import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { config, CASE_STATUSES, CASE_STATUS_DESCRIPTIONS } from '../config/index.js';
import { authenticateStaff, StaffAuthRequest } from '../middleware/auth.middleware.js';
import { generateCaseNumber } from '../utils/reference.js';
import { EmailService } from '../services/email.service.js';

const router = Router();
router.use(authenticateStaff);

// 1. List Cases with Search, Filter, Sort, Pagination
router.get('/', async (req: StaffAuthRequest, res: Response) => {
  try {
    const {
      search,
      status,
      customerType,
      sortBy = 'latestActivity',
      sortDir = 'desc',
      page = '1',
      limit = '15',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 15));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { caseNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerEmail: { contains: q } },
        { customerPhone: { contains: q } },
      ];
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (customerType && typeof customerType === 'string' && customerType !== 'ALL') {
      where.customerType = customerType;
    }

    const orderBy: any = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortDir === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.lastActivityAt = sortDir === 'asc' ? 'asc' : 'desc';
    }

    const [total, cases] = await Promise.all([
      prisma.case.count({ where }),
      prisma.case.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          caseProducts: true,
          _count: {
            select: { messages: true, quotations: true },
          },
        },
      }),
    ]);

    res.json({
      cases: cases.map((c) => ({
        ...c,
        statusDescription: CASE_STATUS_DESCRIPTIONS[c.status] || c.status,
      })),
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / take),
        limit: take,
      },
    });
  } catch (err) {
    console.error('Admin list cases error:', err);
    res.status(500).json({ error: 'Failed to retrieve cases.' });
  }
});

// 2. Create Case Manually on Behalf of Customer
const manualCaseSchema = z.object({
  customerType: z.enum(['INDIVIDUAL', 'BUSINESS']),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(6),
  productName: z.string().min(2),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  deliveryAddress: z.string().min(5),
  desiredDeliveryDate: z.string().optional().nullable(),
  deliveryRequirements: z.string().optional(),
  technicalRequirements: z.string().optional(),
  comments: z.string().optional(),
});

router.post('/', async (req: StaffAuthRequest, res: Response) => {
  try {
    const parsed = manualCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid form data' });
      return;
    }

    const data = parsed.data;
    let caseNumber = generateCaseNumber();
    while (await prisma.case.findUnique({ where: { caseNumber } })) {
      caseNumber = generateCaseNumber();
    }

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        customerType: data.customerType,
        customerName: data.customerName.trim(),
        customerEmail: data.customerEmail.toLowerCase().trim(),
        customerPhone: data.customerPhone.trim(),
        status: CASE_STATUSES.UNDER_REVIEW, // Created directly by staff
        quantity: data.quantity,
        unit: data.unit,
        deliveryAddress: data.deliveryAddress.trim(),
        desiredDeliveryDate: data.desiredDeliveryDate ? new Date(data.desiredDeliveryDate) : null,
        deliveryRequirements: data.deliveryRequirements || null,
        technicalRequirements: data.technicalRequirements || null,
        comments: data.comments || null,
        privacyAccepted: true,
        caseProducts: {
          create: {
            productName: data.productName,
          },
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: CASE_STATUSES.UNDER_REVIEW,
            changedByStaffId: req.staff!.id,
            notes: `Created manually on behalf of customer by ${req.staff!.name}`,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_CASE_CREATED',
        entityType: 'Case',
        entityId: newCase.id,
        staffUserId: req.staff!.id,
        details: `Created case ${newCase.caseNumber} for ${newCase.customerName}`,
      },
    });

    EmailService.sendCaseCreatedConfirmation(newCase.customerEmail, newCase.caseNumber, newCase.customerName).catch(
      (err) => console.error('Error dispatching manual creation email:', err)
    );

    res.status(201).json({ case: newCase });
  } catch (err) {
    console.error('Manual case creation error:', err);
    res.status(500).json({ error: 'Failed to create case.' });
  }
});

// 3. Get Single Case Details
router.get('/:id', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const foundCase = await prisma.case.findUnique({
      where: { id },
      include: {
        caseProducts: { include: { product: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { staffUser: { select: { id: true, name: true, role: true } } },
        },
        quotations: {
          orderBy: { version: 'desc' },
          include: {
            items: { orderBy: { sortOrder: 'asc' } },
            createdBy: { select: { id: true, name: true } },
            decisions: { orderBy: { decidedAt: 'desc' } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { changedBy: { select: { id: true, name: true } } },
        },
      },
    });

    if (!foundCase) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    res.json({
      case: {
        ...foundCase,
        statusDescription: CASE_STATUS_DESCRIPTIONS[foundCase.status] || foundCase.status,
        existingQuoteDetails: foundCase.existingQuoteDetails ? JSON.parse(foundCase.existingQuoteDetails) : null,
      },
    });
  } catch (err) {
    console.error('Admin get case error:', err);
    res.status(500).json({ error: 'Failed to retrieve case details.' });
  }
});

// 4. Update Request Information (Edit request)
router.patch('/:id', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const {
      quantity,
      unit,
      deliveryAddress,
      desiredDeliveryDate,
      deliveryRequirements,
      technicalRequirements,
      comments,
      productName,
    } = req.body;

    const updated = await prisma.case.update({
      where: { id },
      data: {
        ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
        ...(unit ? { unit } : {}),
        ...(deliveryAddress ? { deliveryAddress } : {}),
        ...(desiredDeliveryDate ? { desiredDeliveryDate: new Date(desiredDeliveryDate) } : {}),
        ...(deliveryRequirements !== undefined ? { deliveryRequirements } : {}),
        ...(technicalRequirements !== undefined ? { technicalRequirements } : {}),
        ...(comments !== undefined ? { comments } : {}),
        lastActivityAt: new Date(),
      },
    });

    if (productName) {
      await prisma.caseProduct.updateMany({
        where: { caseId: id },
        data: { productName },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: 'CASE_EDITED',
        entityType: 'Case',
        entityId: id,
        staffUserId: req.staff!.id,
        details: `Case details updated by staff ${req.staff!.name}`,
      },
    });

    res.json({ message: 'Case updated successfully', case: updated });
  } catch (err) {
    console.error('Admin update case error:', err);
    res.status(500).json({ error: 'Failed to update case.' });
  }
});

// 5. Accept Request for Processing (NEW -> UNDER_REVIEW)
router.post('/:id/accept-processing', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        status: CASE_STATUSES.UNDER_REVIEW,
        lastActivityAt: new Date(),
      },
    });

    await prisma.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: existing.status,
        toStatus: CASE_STATUSES.UNDER_REVIEW,
        changedByStaffId: req.staff!.id,
        notes: `Accepted for processing by ${req.staff!.name}`,
      },
    });

    EmailService.sendStatusUpdateNotification(
      existing.customerEmail,
      existing.caseNumber,
      CASE_STATUS_DESCRIPTIONS[CASE_STATUSES.UNDER_REVIEW]
    ).catch((e) => console.error(e));

    res.json({ message: 'Case accepted for processing', case: updated });
  } catch (err) {
    console.error('Accept processing error:', err);
    res.status(500).json({ error: 'Failed to update case status.' });
  }
});

// 6. Decline Initial Request (with customer-visible explanation)
router.post('/:id/decline-request', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      res.status(400).json({ error: 'A customer-visible explanation is required when declining a request.' });
      return;
    }

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        status: CASE_STATUSES.REQUEST_DECLINED,
        declineReason: reason.trim(),
        lastActivityAt: new Date(),
      },
    });

    await prisma.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: existing.status,
        toStatus: CASE_STATUSES.REQUEST_DECLINED,
        changedByStaffId: req.staff!.id,
        notes: `Declined by ${req.staff!.name}. Reason: ${reason.trim()}`,
      },
    });

    EmailService.sendStatusUpdateNotification(
      existing.customerEmail,
      existing.caseNumber,
      `Request declined: ${reason.trim()}`
    ).catch((e) => console.error(e));

    res.json({ message: 'Request declined.', case: updated });
  } catch (err) {
    console.error('Decline request error:', err);
    res.status(500).json({ error: 'Failed to decline request.' });
  }
});

// 7. Request Additional Information from Customer
router.post('/:id/request-info', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { message } = req.body;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    if (message && message.trim()) {
      await prisma.caseMessage.create({
        data: {
          caseId: id,
          senderType: 'STAFF',
          staffUserId: req.staff!.id,
          senderName: req.staff!.name,
          message: message.trim(),
        },
      });
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        status: CASE_STATUSES.MORE_INFO_NEEDED,
        lastActivityAt: new Date(),
      },
    });

    await prisma.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: existing.status,
        toStatus: CASE_STATUSES.MORE_INFO_NEEDED,
        changedByStaffId: req.staff!.id,
        notes: `More information requested by ${req.staff!.name}: ${message || 'Inquiry details required'}`,
      },
    });

    EmailService.sendStaffMessageNotification(existing.customerEmail, existing.caseNumber).catch((e) => console.error(e));

    res.json({ message: 'Status updated to More information needed.', case: updated });
  } catch (err) {
    console.error('Request info error:', err);
    res.status(500).json({ error: 'Failed to update case.' });
  }
});

// 8. Close Case
router.post('/:id/close', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        status: CASE_STATUSES.CLOSED,
        closeReason: reason || 'Case closed by staff',
        lastActivityAt: new Date(),
      },
    });

    await prisma.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: existing.status,
        toStatus: CASE_STATUSES.CLOSED,
        changedByStaffId: req.staff!.id,
        notes: `Case closed by ${req.staff!.name}. Note: ${reason || 'Resolved'}`,
      },
    });

    res.json({ message: 'Case closed.', case: updated });
  } catch (err) {
    console.error('Close case error:', err);
    res.status(500).json({ error: 'Failed to close case.' });
  }
});

// 9. Update Status Directly
router.patch('/:id/status', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, notes } = req.body;

    if (!Object.values(CASE_STATUSES).includes(status)) {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        status,
        lastActivityAt: new Date(),
      },
    });

    await prisma.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: existing.status,
        toStatus: status,
        changedByStaffId: req.staff!.id,
        notes: notes || `Status changed to ${status} by ${req.staff!.name}`,
      },
    });

    res.json({ message: 'Status updated.', case: updated });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

export default router;
