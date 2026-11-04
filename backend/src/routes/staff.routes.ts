import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import {
  authenticateStaff,
  requireAdministrator,
  StaffAuthRequest,
} from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateStaff);
router.use(requireAdministrator);

// System permission definitions
export const SYSTEM_PERMISSIONS = [
  { id: 'cases:view', label: 'View Cases', category: 'Cases', description: 'Access and view all customer cases' },
  { id: 'cases:create', label: 'Create Cases', category: 'Cases', description: 'Create cases on behalf of customers' },
  { id: 'cases:edit', label: 'Edit Case Info', category: 'Cases', description: 'Modify delivery details, quantities, and requirements' },
  { id: 'cases:status', label: 'Change Case Status', category: 'Cases', description: 'Accept, decline, or request more information' },
  { id: 'cases:close', label: 'Close Cases', category: 'Cases', description: 'Mark cases as completed or permanently closed' },
  
  { id: 'projects:view', label: 'View Projects', category: 'Projects', description: 'Browse project directory and track progress' },
  { id: 'projects:create', label: 'Create Projects', category: 'Projects', description: 'Initialize new projects or convert cases' },
  { id: 'projects:edit', label: 'Update Progress', category: 'Projects', description: 'Update delivery schedules, materials, and % progress' },
  
  { id: 'customers:view', label: 'View Customers', category: 'Customers', description: 'Search and inspect customer profiles' },
  { id: 'customers:edit', label: 'Edit Customers', category: 'Customers', description: 'Modify contact numbers, company names, and addresses' },
  
  { id: 'quotations:view', label: 'View Quotations', category: 'Quotations', description: 'View current and historical quotation offers' },
  { id: 'quotations:create', label: 'Create & Issue Quotations', category: 'Quotations', description: 'Build line items, calculate VAT, issue and download PDFs' },
  
  { id: 'messages:manage', label: 'Customer Messaging', category: 'Messaging', description: 'Send direct replies to customer case chats' },
  { id: 'products:view', label: 'View Products Catalog', category: 'Products', description: 'Search products and technical specifications' },
  { id: 'products:manage', label: 'Manage Products (Admin)', category: 'Products', description: 'Add, edit, or disable catalog items and categories' },
  
  { id: 'staff:manage', label: 'Manage Employees (Admin)', category: 'Administration', description: 'Create and deactivate staff accounts' },
  { id: 'settings:manage', label: 'System Settings (Admin)', category: 'Administration', description: 'Modify business terms, VAT rates, and retention' },
];

// 1. Get Permissions Matrix
router.get('/permissions/matrix', async (_req, res) => {
  try {
    const staff = await prisma.staffUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const staffWithParsedPerms = staff.map(s => {
      let perms: string[] = [];
      if (s.permissions) {
        try {
          perms = JSON.parse(s.permissions);
        } catch {
          perms = [];
        }
      }
      return {
        ...s,
        permissions: perms,
      };
    });

    res.json({
      systemPermissions: SYSTEM_PERMISSIONS,
      staff: staffWithParsedPerms,
    });
  } catch (err) {
    console.error('Get permissions matrix error:', err);
    res.status(500).json({ error: 'Failed to retrieve permissions matrix.' });
  }
});

// 2. List Staff Accounts
router.get('/', async (_req, res) => {
  try {
    const staff = await prisma.staffUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        permissions: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { quotations: true, messages: true, assignedProjects: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const parsedStaff = staff.map(s => {
      let perms: string[] = [];
      if (s.permissions) {
        try {
          perms = JSON.parse(s.permissions);
        } catch {
          perms = [];
        }
      }
      return {
        ...s,
        permissions: perms,
      };
    });

    res.json({ staff: parsedStaff });
  } catch (err) {
    console.error('List staff error:', err);
    res.status(500).json({ error: 'Failed to retrieve staff users.' });
  }
});

const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['EMPLOYEE', 'ADMINISTRATOR']).default('EMPLOYEE'),
  permissions: z.array(z.string()).optional(),
});

// 3. Create Staff Account
router.post('/', async (req: StaffAuthRequest, res) => {
  try {
    const parsed = createStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid staff data' });
      return;
    }

    const { name, email, phone, password, role, permissions } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.staffUser.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      res.status(400).json({ error: 'A staff user with this email already exists.' });
      return;
    }

    // Default permissions for employee if not provided
    const defaultPerms = permissions || (role === 'EMPLOYEE' ? [
      'cases:view', 'cases:create', 'cases:edit', 'cases:status', 'cases:close',
      'projects:view', 'projects:create', 'projects:edit',
      'customers:view', 'quotations:view', 'quotations:create',
      'messages:manage', 'products:view'
    ] : SYSTEM_PERMISSIONS.map(p => p.id));

    const passwordHash = await bcrypt.hash(password, 10);
    const newStaff = await prisma.staffUser.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        passwordHash,
        role,
        permissions: JSON.stringify(defaultPerms),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'STAFF_CREATED',
        entityType: 'StaffUser',
        entityId: newStaff.id,
        staffUserId: req.staff!.id,
        description: `Created staff account: ${newStaff.name} (${newStaff.role})`,
      },
    });

    res.status(201).json({
      staff: {
        ...newStaff,
        permissions: defaultPerms,
      },
    });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: 'Failed to create staff account.' });
  }
});

// 4. Update Staff Permissions
router.patch('/:id/permissions', async (req: StaffAuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      res.status(400).json({ error: 'Permissions must be an array of strings.' });
      return;
    }

    const updated = await prisma.staffUser.update({
      where: { id },
      data: {
        permissions: JSON.stringify(permissions),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'PERMISSIONS_UPDATED',
        entityType: 'StaffUser',
        entityId: id,
        staffUserId: req.staff!.id,
        description: `Updated permissions matrix for ${updated.name}`,
      },
    });

    res.json({
      staff: {
        ...updated,
        permissions,
      },
    });
  } catch (err) {
    console.error('Update permissions error:', err);
    res.status(500).json({ error: 'Failed to update permissions.' });
  }
});

// 5. Edit Staff Account
router.patch('/:id', async (req: StaffAuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { name, phone, role, isActive, permissions } = req.body;

    const existing = await prisma.staffUser.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Staff account not found.' });
      return;
    }

    const updated = await prisma.staffUser.update({
      where: { id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
        ...(role && ['EMPLOYEE', 'ADMINISTRATOR'].includes(role) ? { role } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(Array.isArray(permissions) ? { permissions: JSON.stringify(permissions) } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        isActive: true,
        updatedAt: true,
      },
    });

    let parsedPerms: string[] = [];
    if (updated.permissions) {
      try {
        parsedPerms = JSON.parse(updated.permissions);
      } catch {
        parsedPerms = [];
      }
    }

    await prisma.auditLog.create({
      data: {
        action: 'STAFF_UPDATED',
        entityType: 'StaffUser',
        entityId: id,
        staffUserId: req.staff!.id,
        description: `Updated staff user ${updated.name}`,
      },
    });

    res.json({
      staff: {
        ...updated,
        permissions: parsedPerms,
      },
    });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Failed to update staff user.' });
  }
});

// 6. Reset Staff Password
router.post('/:id/reset-password', async (req: StaffAuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const existing = await prisma.staffUser.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Staff account not found.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.staffUser.update({
      where: { id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        action: 'STAFF_PASSWORD_RESET',
        entityType: 'StaffUser',
        entityId: id,
        staffUserId: req.staff!.id,
        description: `Password reset for staff user ${existing.name}`,
      },
    });

    res.json({ message: `Password reset successfully for ${existing.name}.` });
  } catch (err) {
    console.error('Reset staff password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

export default router;
