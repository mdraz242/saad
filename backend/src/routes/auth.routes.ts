import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { authenticateStaff, StaffAuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Staff Login
router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email and password required.' });
      return;
    }

    const { email, password } = parsed.data;
    const staff = await prisma.staffUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!staff || !staff.isActive) {
      res.status(401).json({ error: 'Invalid credentials or inactive account.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, staff.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials or inactive account.' });
      return;
    }

    const token = jwt.sign(
      { staffId: staff.id, role: staff.role, email: staff.email },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    await prisma.auditLog.create({
      data: {
        action: 'STAFF_LOGIN',
        entityType: 'StaffUser',
        entityId: staff.id,
        staffUserId: staff.id,
        details: `Successful login by ${staff.name} (${staff.role})`,
      },
    });

    res.json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
    });
  } catch (err: any) {
    console.error('Staff login error:', err);
    res.status(500).json({ error: err?.message || 'Authentication service error.' });
  }
});

// Staff current user check
router.get('/me', authenticateStaff, async (req: StaffAuthRequest, res) => {
  res.json({ staff: req.staff });
});

// Staff Logout
router.post('/logout', authenticateStaff, async (req: StaffAuthRequest, res) => {
  if (req.staff) {
    await prisma.auditLog.create({
      data: {
        action: 'STAFF_LOGOUT',
        entityType: 'StaffUser',
        entityId: req.staff.id,
        staffUserId: req.staff.id,
        details: `Logged out: ${req.staff.name}`,
      },
    });
  }
  res.json({ message: 'Logged out successfully.' });
});

export default router;

