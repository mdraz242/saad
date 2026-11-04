import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import {
  authenticateStaff,
  requireAdministrator,
} from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateStaff);
router.use(requireAdministrator);

// List Audit Logs
router.get('/', async (req, res) => {
  try {
    const { action, staffId, entityType, search } = req.query;

    const whereClause: any = {};
    if (action && typeof action === 'string' && action !== 'ALL') {
      whereClause.action = action;
    }
    if (staffId && typeof staffId === 'string' && staffId !== 'ALL') {
      whereClause.staffUserId = staffId;
    }
    if (entityType && typeof entityType === 'string' && entityType !== 'ALL') {
      whereClause.entityType = entityType;
    }
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { action: { contains: search } },
        { description: { contains: search } },
        { entityType: { contains: search } },
        { entityId: { contains: search } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json({ logs });
  } catch (err) {
    console.error('List activity logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve activity logs.' });
  }
});

export default router;

