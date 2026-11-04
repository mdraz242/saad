import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { config, CASE_STATUSES } from '../config/index.js';
import { authenticateStaff, StaffAuthRequest } from '../middleware/auth.middleware.js';
import { generateQuotationNumber } from '../utils/reference.js';
import { EmailService } from '../services/email.service.js';
import { PdfService } from '../services/pdf.service.js';

const router = Router();
router.use(authenticateStaff);

const quotationItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit required'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
});

const createQuotationSchema = z.object({
  validityDays: z.number().int().min(1).default(14),
  termsAndConditions: z.string().min(5),
  notes: z.string().optional(),
  vatRate: z.number().default(25.0),
  items: z.array(quotationItemSchema).min(1, 'At least one line item is required'),
  issueImmediately: z.boolean().default(false),
});

// 1. Create Initial or New Version Quotation for a Case
router.post('/cases/:caseId/quotations', async (req: StaffAuthRequest, res: Response) => {
  try {
    const caseId = req.params.caseId as string;
    const parsed = createQuotationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid quotation data' });
      return;
    }

    const foundCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        quotations: { orderBy: { version: 'desc' } },
      },
    });

    if (!foundCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const { validityDays, termsAndConditions, notes, vatRate, items, issueImmediately } = parsed.data;

    // Determine version and quotation number
    const latestVersion = foundCase.quotations.length > 0 ? foundCase.quotations[0].version : 0;
    const newVersion = latestVersion + 1;

    let quotationNumber: string;
    if (foundCase.quotations.length > 0) {
      quotationNumber = foundCase.quotations[0].quotationNumber;
    } else {
      const quoteCount = await prisma.quotation.count();
      quotationNumber = generateQuotationNumber(quoteCount + 1);
    }

    // Perform calculations on server
    let subtotal = 0;
    const calculatedItems = items.map((item, idx) => {
      const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      subtotal += lineTotal;
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        lineTotal,
        sortOrder: idx + 1,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    const vatAmount = Math.round((subtotal * (vatRate / 100)) * 100) / 100;
    const grandTotal = Math.round((subtotal + vatAmount) * 100) / 100;

    const validityDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
    const initialStatus = issueImmediately ? 'ISSUED' : 'DRAFT';

    // If issuing immediately, supersede previous active quotations
    if (issueImmediately) {
      await prisma.quotation.updateMany({
        where: { caseId, status: 'ISSUED' },
        data: { status: 'SUPERSEDED' },
      });
    }

    const newQuotation = await prisma.quotation.create({
      data: {
        caseId,
        quotationNumber,
        version: newVersion,
        status: initialStatus,
        subtotal,
        vatRate,
        vatAmount,
        grandTotal,
        validityDate,
        termsAndConditions,
        notes: notes || null,
        createdByStaffId: req.staff!.id,
        items: {
          create: calculatedItems,
        },
      },
      include: {
        items: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (issueImmediately) {
      await prisma.case.update({
        where: { id: caseId },
        data: {
          status: CASE_STATUSES.QUOTATION_SENT,
          lastActivityAt: new Date(),
        },
      });

      await prisma.caseStatusHistory.create({
        data: {
          caseId,
          fromStatus: foundCase.status,
          toStatus: CASE_STATUSES.QUOTATION_SENT,
          changedByStaffId: req.staff!.id,
          notes: `Quotation ${quotationNumber} (v${newVersion}) issued by ${req.staff!.name}`,
        },
      });

      EmailService.sendQuotationIssuedNotification(
        foundCase.customerEmail,
        foundCase.caseNumber,
        quotationNumber,
        newVersion
      ).catch((e) => console.error(e));
    }

    await prisma.auditLog.create({
      data: {
        action: issueImmediately ? 'QUOTATION_ISSUED' : 'QUOTATION_DRAFT_CREATED',
        entityType: 'Quotation',
        entityId: newQuotation.id,
        staffUserId: req.staff!.id,
        details: `Quotation ${quotationNumber} v${newVersion} created with total ${grandTotal} SEK`,
      },
    });

    res.status(201).json({ quotation: newQuotation });
  } catch (err) {
    console.error('Create quotation error:', err);
    res.status(500).json({ error: 'Failed to create quotation.' });
  }
});

// 2. Issue a Draft Quotation to Customer
router.post('/quotations/:id/issue', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { case: true },
    });

    if (!quotation) {
      res.status(404).json({ error: 'Quotation not found.' });
      return;
    }

    // Supersede any previously issued version on this case
    await prisma.quotation.updateMany({
      where: { caseId: quotation.caseId, status: 'ISSUED' },
      data: { status: 'SUPERSEDED' },
    });

    // Mark current as ISSUED
    const updated = await prisma.quotation.update({
      where: { id },
      data: { status: 'ISSUED' },
    });

    // Update case status to QUOTATION_SENT
    await prisma.case.update({
      where: { id: quotation.caseId },
      data: {
        status: CASE_STATUSES.QUOTATION_SENT,
        lastActivityAt: new Date(),
      },
    });

    await prisma.caseStatusHistory.create({
      data: {
        caseId: quotation.caseId,
        fromStatus: quotation.case.status,
        toStatus: CASE_STATUSES.QUOTATION_SENT,
        changedByStaffId: req.staff!.id,
        notes: `Quotation ${quotation.quotationNumber} (v${quotation.version}) issued to customer by ${req.staff!.name}`,
      },
    });

    EmailService.sendQuotationIssuedNotification(
      quotation.case.customerEmail,
      quotation.case.caseNumber,
      quotation.quotationNumber,
      quotation.version
    ).catch((e) => console.error(e));

    res.json({ message: 'Quotation issued to customer.', quotation: updated });
  } catch (err) {
    console.error('Issue quotation error:', err);
    res.status(500).json({ error: 'Failed to issue quotation.' });
  }
});

// 3. Staff Download Quotation PDF
router.get('/quotations/:id/pdf', async (req: StaffAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        case: true,
      },
    });

    if (!quotation) {
      res.status(404).json({ error: 'Quotation not found.' });
      return;
    }

    const settings = await prisma.applicationSettings.findUnique({
      where: { id: 'default-settings' },
    });

    if (!settings) {
      res.status(500).json({ error: 'Settings not configured.' });
      return;
    }

    const pdfBuffer = await PdfService.generateQuotationPdf(quotation, settings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Betongportalen_${quotation.quotationNumber}_v${quotation.version}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Admin PDF error:', err);
    res.status(500).json({ error: 'Failed to generate quotation PDF.' });
  }
});

export default router;
