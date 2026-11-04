import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import {
  authenticateStaff,
  StaffAuthRequest,
} from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateStaff);

// 1. List Customers with search & filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const { customerType, search } = req.query;

    const whereClause: any = {};
    if (customerType && typeof customerType === 'string' && customerType !== 'ALL') {
      whereClause.customerType = customerType;
    }
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { companyName: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            cases: true,
            projects: true,
          },
        },
        projects: {
          select: {
            projectValue: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = customers.map(c => {
      const totalProjectValue = c.projects.reduce((acc, p) => acc + (p.projectValue || 0), 0);
      return {
        id: c.id,
        name: c.name,
        customerType: c.customerType,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        address: c.address,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        casesCount: c._count.cases,
        projectsCount: c._count.projects,
        totalProjectValue,
      };
    });

    res.json({ customers: transformed });
  } catch (err) {
    console.error('List customers error:', err);
    res.status(500).json({ error: 'Failed to retrieve customers.' });
  }
});

// 2. Get Customer Profile with linked records
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        cases: {
          include: {
            caseProducts: true,
            quotations: {
              select: {
                id: true,
                quotationNumber: true,
                version: true,
                status: true,
                grandTotal: true,
                createdAt: true,
              },
              orderBy: { version: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        projects: {
          include: {
            materials: true,
            assignedStaff: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    const totalProjectValue = customer.projects.reduce((acc, p) => acc + (p.projectValue || 0), 0);

    res.json({
      customer: {
        ...customer,
        totalProjectValue,
      },
    });
  } catch (err) {
    console.error('Get customer details error:', err);
    res.status(500).json({ error: 'Failed to retrieve customer profile.' });
  }
});

const customerSchema = z.object({
  name: z.string().min(2),
  customerType: z.enum(['INDIVIDUAL', 'BUSINESS']).default('INDIVIDUAL'),
  companyName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(5),
  address: z.string().optional(),
});

// 3. Create Customer
router.post('/', async (req: StaffAuthRequest, res: Response) => {
  try {
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid customer data.' });
      return;
    }

    const data = parsed.data;
    const cleanEmail = data.email.toLowerCase().trim();

    const existing = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      res.status(400).json({ error: 'A customer with this email already exists.' });
      return;
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        customerType: data.customerType,
        companyName: data.companyName?.trim() || null,
        email: cleanEmail,
        phone: data.phone.trim(),
        address: data.address?.trim() || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_CREATED',
        entityType: 'Customer',
        entityId: newCustomer.id,
        staffUserId: req.staff!.id,
        description: `Created customer record: ${newCustomer.name} (${newCustomer.email})`,
      },
    });

    res.status(201).json({ customer: newCustomer });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer.' });
  }
});

// 4. Update Customer
router.patch('/:id', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, customerType, companyName, email, phone, address } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(customerType && ['INDIVIDUAL', 'BUSINESS'].includes(customerType) ? { customerType } : {}),
        ...(companyName !== undefined ? { companyName: companyName ? String(companyName).trim() : null } : {}),
        ...(email ? { email: String(email).toLowerCase().trim() } : {}),
        ...(phone ? { phone: String(phone).trim() } : {}),
        ...(address !== undefined ? { address: address ? String(address).trim() : null } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_UPDATED',
        entityType: 'Customer',
        entityId: id,
        staffUserId: req.staff!.id,
        description: `Updated customer record: ${updated.name}`,
      },
    });

    res.json({ customer: updated });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer.' });
  }
});

export default router;

