import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import {
  authenticateStaff,
  StaffAuthRequest,
} from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateStaff);

// Helper to generate project ID (e.g. BP-PRJ-2026-0003)
async function generateProjectId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const count = await prisma.project.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `BP-PRJ-${currentYear}-${sequence}`;
}

// 1. List Projects with search and filters
router.get('/', async (req, res) => {
  try {
    const { status, customerId, search } = req.query;

    const whereClause: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }
    if (customerId && typeof customerId === 'string') {
      whereClause.customerId = customerId;
    }
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { projectId: { contains: search } },
        { name: { contains: search } },
        { location: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, customerType: true } },
        case: { select: { id: true, caseNumber: true, status: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        _count: { select: { materials: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Failed to retrieve projects.' });
  }
});

// 2. Get Project Details
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
      },
      include: {
        customer: true,
        case: {
          select: {
            id: true,
            caseNumber: true,
            status: true,
            quantity: true,
            unit: true,
            deliveryAddress: true,
            desiredDeliveryDate: true,
            comments: true,
          },
        },
        quotation: {
          include: {
            items: true,
          },
        },
        assignedStaff: { select: { id: true, name: true, email: true } },
        materials: {
          include: { product: true },
        },
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to retrieve project details.' });
  }
});

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  customerId: z.string().uuid(),
  caseId: z.string().uuid().optional(),
  quotationId: z.string().uuid().optional(),
  location: z.string().min(2),
  projectValue: z.number().nonnegative().optional(),
  approvedValue: z.number().nonnegative().optional(),
  vatAmount: z.number().nonnegative().optional(),
  currency: z.string().default('SEK'),
  startDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  assignedStaffId: z.string().uuid().optional(),
  materials: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unit: z.string().default('m³'),
    deliveryAddress: z.string().optional(),
    deliveryDate: z.string().optional(),
    technicalRequirements: z.string().optional(),
  })).optional(),
});

// 3. Create Project Manually
router.post('/', async (req: StaffAuthRequest, res) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid project data.' });
      return;
    }

    const data = parsed.data;
    const projectId = await generateProjectId();

    const newProject = await prisma.project.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        customerId: data.customerId,
        caseId: data.caseId,
        quotationId: data.quotationId,
        location: data.location,
        projectValue: data.projectValue || 0,
        approvedValue: data.approvedValue,
        vatAmount: data.vatAmount,
        currency: data.currency,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
        assignedStaffId: data.assignedStaffId || req.staff!.id,
        status: 'NEW',
        progress: 0,
        materials: data.materials && data.materials.length > 0 ? {
          create: data.materials.map(m => ({
            productId: m.productId,
            productName: m.productName,
            description: m.description,
            quantity: m.quantity,
            unit: m.unit,
            deliveryAddress: m.deliveryAddress,
            deliveryDate: m.deliveryDate ? new Date(m.deliveryDate) : undefined,
            technicalRequirements: m.technicalRequirements,
          })),
        } : undefined,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'NEW',
            changedByStaffId: req.staff!.id,
            notes: 'Project initialized',
            progress: 0,
          },
        },
      },
      include: {
        customer: true,
        materials: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: newProject.id,
        staffUserId: req.staff!.id,
        description: `Created project ${newProject.projectId}: ${newProject.name}`,
      },
    });

    res.status(201).json({ project: newProject });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// 4. Convert Case to Project
router.post('/convert-case/:caseId', async (req: StaffAuthRequest, res) => {
  try {
    const caseId = req.params.caseId as string;
    const foundCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        customer: true,
        caseProducts: true,
        quotations: {
          where: { status: 'ISSUED' },
          orderBy: { version: 'desc' },
          take: 1,
          include: { items: true },
        },
      },
    });

    if (!foundCase) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    // Ensure or link customer
    let customerId = foundCase.customerId;
    if (!customerId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: foundCase.customerEmail.toLowerCase().trim() },
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            name: foundCase.customerName,
            customerType: foundCase.customerType,
            email: foundCase.customerEmail.toLowerCase().trim(),
            phone: foundCase.customerPhone,
            address: foundCase.deliveryAddress,
          },
        });
        customerId = newCustomer.id;
      }

      await prisma.case.update({
        where: { id: caseId },
        data: { customerId },
      });
    }

    const projectId = await generateProjectId();
    const latestQuote = foundCase.quotations[0];
    const initialStatus = latestQuote ? 'QUOTED' : 'NEW';

    const project = await prisma.project.create({
      data: {
        projectId,
        name: `Project for Case ${foundCase.caseNumber}`,
        description: foundCase.comments || `Originated from customer case ${foundCase.caseNumber}`,
        customerId: customerId!,
        caseId: foundCase.id,
        quotationId: latestQuote ? latestQuote.id : undefined,
        status: initialStatus,
        progress: initialStatus === 'QUOTED' ? 20 : 10,
        location: foundCase.deliveryAddress,
        projectValue: latestQuote ? latestQuote.grandTotal : 0,
        approvedValue: latestQuote ? latestQuote.subtotal : undefined,
        vatAmount: latestQuote ? latestQuote.vatAmount : undefined,
        currency: 'SEK',
        expectedDeliveryDate: foundCase.desiredDeliveryDate,
        assignedStaffId: req.staff!.id,
        materials: {
          create: foundCase.caseProducts.length > 0 ? foundCase.caseProducts.map(cp => ({
            productId: cp.productId,
            productName: cp.productName,
            description: cp.productDescription || cp.customRequirements,
            quantity: foundCase.quantity,
            unit: foundCase.unit,
            deliveryAddress: foundCase.deliveryAddress,
            deliveryDate: foundCase.desiredDeliveryDate,
            technicalRequirements: foundCase.technicalRequirements,
          })) : [{
            productName: 'Concrete Materials',
            description: foundCase.technicalRequirements,
            quantity: foundCase.quantity,
            unit: foundCase.unit,
            deliveryAddress: foundCase.deliveryAddress,
            deliveryDate: foundCase.desiredDeliveryDate,
          }],
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: initialStatus,
            changedByStaffId: req.staff!.id,
            notes: `Converted from case ${foundCase.caseNumber}`,
            progress: initialStatus === 'QUOTED' ? 20 : 10,
          },
        },
      },
      include: {
        customer: true,
        materials: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CASE_CONVERTED_TO_PROJECT',
        entityType: 'Project',
        entityId: project.id,
        staffUserId: req.staff!.id,
        description: `Case ${foundCase.caseNumber} converted to Project ${project.projectId}`,
      },
    });

    res.status(201).json({ project });
  } catch (err) {
    console.error('Convert case to project error:', err);
    res.status(500).json({ error: 'Failed to convert case to project.' });
  }
});

// 5. Update Project Details & Progress
router.patch('/:id', async (req: StaffAuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      description,
      status,
      progress,
      location,
      projectValue,
      approvedValue,
      vatAmount,
      startDate,
      expectedDeliveryDate,
      actualCompletionDate,
      assignedStaffId,
      statusNote,
    } = req.body;

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const statusChanged = status && status !== existing.status;
    const progressChanged = typeof progress === 'number' && progress !== existing.progress;

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status ? { status } : {}),
        ...(typeof progress === 'number' ? { progress: Math.min(100, Math.max(0, progress)) } : {}),
        ...(location ? { location } : {}),
        ...(typeof projectValue === 'number' ? { projectValue } : {}),
        ...(typeof approvedValue === 'number' ? { approvedValue } : {}),
        ...(typeof vatAmount === 'number' ? { vatAmount } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(expectedDeliveryDate !== undefined ? { expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null } : {}),
        ...(actualCompletionDate !== undefined ? { actualCompletionDate: actualCompletionDate ? new Date(actualCompletionDate) : null } : {}),
        ...(assignedStaffId !== undefined ? { assignedStaffId } : {}),
      },
      include: {
        customer: true,
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    // Record history if status or progress changed
    if (statusChanged || progressChanged || statusNote) {
      await prisma.projectStatusHistory.create({
        data: {
          projectId: id,
          fromStatus: existing.status,
          toStatus: updated.status,
          progress: updated.progress,
          changedByStaffId: req.staff!.id,
          notes: statusNote || (statusChanged ? `Status updated to ${status}` : `Progress updated to ${progress}%`),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: 'PROJECT_UPDATED',
        entityType: 'Project',
        entityId: id,
        staffUserId: req.staff!.id,
        description: `Updated project ${existing.projectId}: Status=${updated.status}, Progress=${updated.progress}%`,
      },
    });

    res.json({ project: updated });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// 6. Add Material to Project
router.post('/:id/materials', async (req: StaffAuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const {
      productId,
      productName,
      description,
      quantity,
      unit,
      deliveryAddress,
      deliveryDate,
      technicalRequirements,
    } = req.body;

    if (!productName || !quantity) {
      res.status(400).json({ error: 'Product name and quantity are required.' });
      return;
    }

    const material = await prisma.projectMaterial.create({
      data: {
        projectId: id,
        productId,
        productName,
        description,
        quantity: Number(quantity),
        unit: unit || 'm³',
        deliveryAddress,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        technicalRequirements,
      },
      include: { product: true },
    });

    res.status(201).json({ material });
  } catch (err) {
    console.error('Add project material error:', err);
    res.status(500).json({ error: 'Failed to add material to project.' });
  }
});

// 7. Delete Material from Project
router.delete('/:id/materials/:materialId', async (req: StaffAuthRequest, res) => {
  try {
    const { materialId } = req.params;
    await prisma.projectMaterial.delete({
      where: { id: materialId as string },
    });
    res.json({ message: 'Material removed from project.' });
  } catch (err) {
    console.error('Delete project material error:', err);
    res.status(500).json({ error: 'Failed to remove material.' });
  }
});

export default router;

