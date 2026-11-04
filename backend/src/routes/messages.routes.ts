import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticateStaff, StaffAuthRequest } from '../middleware/auth.middleware.js';
import { EmailService } from '../services/email.service.js';

const router = Router();
router.use(authenticateStaff);

// 1. Central Messages Inbox across all cases
router.get('/messages/inbox', async (req, res) => {
  try {
    const { unreadOnly, search, caseId } = req.query;

    const whereClause: any = {};
    if (unreadOnly === 'true') {
      whereClause.isRead = false;
      whereClause.senderType = 'CUSTOMER';
    }
    if (caseId && typeof caseId === 'string') {
      whereClause.caseId = caseId;
    }
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { message: { contains: search } },
        { senderName: { contains: search } },
        { case: { caseNumber: { contains: search } } },
        { case: { customerName: { contains: search } } },
      ];
    }

    const messages = await prisma.caseMessage.findMany({
      where: whereClause,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            customerName: true,
            customerEmail: true,
            status: true,
          },
        },
        staffUser: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const unreadCount = await prisma.caseMessage.count({
      where: {
        senderType: 'CUSTOMER',
        isRead: false,
      },
    });

    res.json({
      messages,
      unreadCount,
    });
  } catch (err) {
    console.error('List inbox messages error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages inbox.' });
  }
});

// 2. Get messages for a specific case
router.get('/cases/:id/messages', async (req, res) => {
  try {
    const id = req.params.id as string;
    const messages = await prisma.caseMessage.findMany({
      where: { caseId: id },
      include: {
        staffUser: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark customer messages as read
    await prisma.caseMessage.updateMany({
      where: {
        caseId: id,
        senderType: 'CUSTOMER',
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ messages });
  } catch (err) {
    console.error('Get case messages error:', err);
    res.status(500).json({ error: 'Failed to retrieve case messages.' });
  }
});

// 3. Mark single message as read
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const id = req.params.id as string;
    const updated = await prisma.caseMessage.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ message: updated });
  } catch (err) {
    console.error('Mark message read error:', err);
    res.status(500).json({ error: 'Failed to mark message as read.' });
  }
});

// 4. Staff sends message in case
router.post('/cases/:id/messages', async (req: StaffAuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const foundCase = await prisma.case.findUnique({
      where: { id },
      select: { id: true, caseNumber: true, customerEmail: true },
    });

    if (!foundCase) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const newMessage = await prisma.caseMessage.create({
      data: {
        caseId: id,
        senderType: 'STAFF',
        staffUserId: req.staff!.id,
        senderName: req.staff!.name,
        message: message.trim(),
        isRead: true,
      },
      include: {
        staffUser: { select: { id: true, name: true, role: true } },
      },
    });

    await prisma.case.update({
      where: { id },
      data: { lastActivityAt: new Date() },
    });

    // Notify customer via email without leaking confidential details
    EmailService.sendStaffMessageNotification(
      foundCase.customerEmail,
      foundCase.caseNumber
    ).catch((err) => console.error('Staff message notification error:', err));

    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Staff send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;
