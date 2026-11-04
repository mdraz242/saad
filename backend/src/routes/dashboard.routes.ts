import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import {
  authenticateStaff,
  StaffAuthRequest,
} from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateStaff);

// Admin Dashboard Data
router.get('/admin', async (_req, res) => {
  try {
    const [
      totalCases,
      newCases,
      underReviewCases,
      moreInfoNeededCases,
      quotationSentCases,
      acceptedQuotationCases,
      activeProjects,
      completedProjects,
      recentCases,
      recentProjects,
      recentMessages,
      recentQuotations,
      recentActivity,
    ] = await Promise.all([
      prisma.case.count(),
      prisma.case.count({ where: { status: 'NEW' } }),
      prisma.case.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.case.count({ where: { status: 'MORE_INFO_NEEDED' } }),
      prisma.case.count({ where: { status: 'QUOTATION_SENT' } }),
      prisma.case.count({ where: { status: 'QUOTATION_ACCEPTED' } }),
      prisma.project.count({
        where: {
          status: { in: ['NEW', 'PLANNING', 'QUOTED', 'APPROVED', 'IN_PROGRESS'] },
        },
      }),
      prisma.project.count({ where: { status: 'COMPLETED' } }),
      // Recent cases
      prisma.case.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          caseProducts: { take: 1 },
        },
      }),
      // Recent projects
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          assignedStaff: { select: { name: true } },
        },
      }),
      // Recent messages
      prisma.caseMessage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          case: { select: { id: true, caseNumber: true, customerName: true } },
        },
      }),
      // Recent quotations
      prisma.quotation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          case: { select: { id: true, caseNumber: true, customerName: true } },
          createdBy: { select: { name: true } },
        },
      }),
      // Recent audit activity
      prisma.auditLog.findMany({
        take: 7,
        orderBy: { createdAt: 'desc' },
        include: {
          staffUser: { select: { name: true, role: true } },
        },
      }),
    ]);

    res.json({
      metrics: {
        totalCases,
        newCases,
        underReviewCases,
        moreInfoNeededCases,
        quotationSentCases,
        acceptedQuotationCases,
        activeProjects,
        completedProjects,
      },
      recentCases,
      recentProjects,
      recentMessages,
      recentQuotations,
      recentActivity,
    });
  } catch (err) {
    console.error('Admin dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin dashboard metrics.' });
  }
});

// Employee Dashboard Data
router.get('/employee', async (req: StaffAuthRequest, res) => {
  try {
    const staffId = req.staff!.id;

    const [
      openCases,
      pendingReview,
      quotesAwaitingResponse,
      activeProjects,
      unreadMessagesCount,
      recentCases,
      assignedProjects,
      recentCustomerMessages,
      recentQuotations,
    ] = await Promise.all([
      prisma.case.count({
        where: {
          status: { in: ['NEW', 'UNDER_REVIEW', 'MORE_INFO_NEEDED'] },
        },
      }),
      prisma.case.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.case.count({ where: { status: 'QUOTATION_SENT' } }),
      prisma.project.count({
        where: {
          status: { in: ['NEW', 'PLANNING', 'QUOTED', 'APPROVED', 'IN_PROGRESS'] },
        },
      }),
      prisma.caseMessage.count({
        where: {
          senderType: 'CUSTOMER',
          isRead: false,
        },
      }),
      prisma.case.findMany({
        take: 6,
        orderBy: { lastActivityAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          caseProducts: { take: 1 },
        },
      }),
      prisma.project.findMany({
        where: {
          assignedStaffId: staffId,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: { select: { name: true } },
        },
      }),
      prisma.caseMessage.findMany({
        where: { senderType: 'CUSTOMER' },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          case: { select: { id: true, caseNumber: true, customerName: true } },
        },
      }),
      prisma.quotation.findMany({
        where: { createdByStaffId: staffId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          case: { select: { id: true, caseNumber: true, customerName: true } },
        },
      }),
    ]);

    res.json({
      metrics: {
        openCases,
        pendingReview,
        quotesAwaitingResponse,
        activeProjects,
        unreadMessagesCount,
      },
      recentCases,
      assignedProjects,
      recentCustomerMessages,
      recentQuotations,
    });
  } catch (err) {
    console.error('Employee dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve employee dashboard metrics.' });
  }
});

export default router;

