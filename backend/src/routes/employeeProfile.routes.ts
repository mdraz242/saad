import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import {
  authenticateStaff,
  StaffAuthRequest,
} from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateStaff);

// 1. Get Logged In Staff Profile
router.get('/profile', async (req: StaffAuthRequest, res: Response) => {
  try {
    const staffUser = await prisma.staffUser.findUnique({
      where: { id: req.staff!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            assignedProjects: true,
            quotations: true,
            messages: true,
          },
        },
      },
    });

    if (!staffUser) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    let parsedPermissions: string[] = [];
    if (staffUser.permissions) {
      try {
        parsedPermissions = JSON.parse(staffUser.permissions);
      } catch {
        parsedPermissions = [];
      }
    }

    res.json({
      profile: {
        ...staffUser,
        permissions: parsedPermissions,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// 2. Update Profile Contact Details
router.patch('/profile', async (req: StaffAuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    const updated = await prisma.staffUser.update({
      where: { id: req.staff!.id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    res.json({ profile: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// 3. Change Password
router.post('/change-password', async (req: StaffAuthRequest, res: Response) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid password request.' });
      return;
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.staffUser.findUnique({
      where: { id: req.staff!.id },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.staffUser.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_CHANGED',
        entityType: 'StaffUser',
        entityId: user.id,
        staffUserId: user.id,
        description: `User ${user.name} changed their password`,
      },
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;

