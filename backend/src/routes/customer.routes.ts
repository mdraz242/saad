import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../utils/prisma.js';
import { config, CASE_STATUSES, CASE_STATUS_DESCRIPTIONS } from '../config/index.js';
import { generateCaseNumber, generateOtp } from '../utils/reference.js';
import { EmailService } from '../services/email.service.js';
import { PdfService } from '../services/pdf.service.js';
import {
  authenticateCustomerSession,
  CustomerAuthRequest,
} from '../middleware/auth.middleware.js';

const router = Router();

// Rate limiters for OTP request & verification
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many verification code requests. Please wait 15 minutes.' },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many verification attempts. Please wait 15 minutes.' },
});

// Helper to mask email address for verification hint
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0].length > 2 ? `${domainParts[0][0]}***` : domainParts[0];
  return `${maskedName}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
}

const createCaseSchema = z.object({
  customerType: z.enum(['INDIVIDUAL', 'BUSINESS']),
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(6, 'Phone number is required'),
  isQuoteComparison: z.boolean().default(false),
  existingQuoteDetails: z
    .object({
      existingProduct: z.string().optional(),
      quotedQuantity: z.string().optional(),
      currentQuotedPrice: z.string().optional(),
      terms: z.string().optional(),
      additionalDescription: z.string().optional(),
    })
    .optional(),
  productId: z.string().optional().nullable(),
  productName: z.string().min(2, 'Product name is required'),
  customRequirements: z.string().optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  desiredDeliveryDate: z.string().optional().nullable(),
  deliveryRequirements: z.string().optional(),
  technicalRequirements: z.string().optional(),
  comments: z.string().optional(),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy notice' }),
  }),
});

// 1. Submit New Customer Case (Three-Step Form)
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid form data' });
      return;
    }

    const data = parsed.data;
    let caseNumber = generateCaseNumber();
    // Ensure uniqueness
    while (await prisma.case.findUnique({ where: { caseNumber } })) {
      caseNumber = generateCaseNumber();
    }

    const desiredDate = data.desiredDeliveryDate ? new Date(data.desiredDeliveryDate) : null;

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        customerType: data.customerType,
        customerName: data.customerName.trim(),
        customerEmail: data.customerEmail.toLowerCase().trim(),
        customerPhone: data.customerPhone.trim(),
        status: CASE_STATUSES.NEW,
        isQuoteComparison: data.isQuoteComparison,
        existingQuoteDetails: data.existingQuoteDetails ? JSON.stringify(data.existingQuoteDetails) : null,
        quantity: data.quantity,
        unit: data.unit,
        deliveryAddress: data.deliveryAddress.trim(),
        desiredDeliveryDate: desiredDate,
        deliveryRequirements: data.deliveryRequirements?.trim() || null,
        technicalRequirements: data.technicalRequirements?.trim() || null,
        comments: data.comments?.trim() || null,
        privacyAccepted: true,
        caseProducts: {
          create: {
            productId: data.productId || null,
            productName: data.productName,
            customRequirements: data.customRequirements || null,
          },
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: CASE_STATUSES.NEW,
            notes: 'Inquiry submitted online via public form',
          },
        },
      },
    });

    // Send confirmation email asynchronously
    EmailService.sendCaseCreatedConfirmation(newCase.customerEmail, newCase.caseNumber, newCase.customerName).catch(
      (err) => console.error('Error dispatching creation email:', err)
    );

    res.status(201).json({
      message: 'Inquiry submitted successfully',
      caseNumber: newCase.caseNumber,
      createdAt: newCase.createdAt,
    });
  } catch (err) {
    console.error('Case submission error:', err);
    res.status(500).json({ error: 'Failed to process inquiry submission.' });
  }
});

// 2. Request OTP Code for Case Access
router.post('/request-access', otpRequestLimiter, async (req: Request, res: Response) => {
  try {
    const { caseNumber } = req.body;
    if (!caseNumber || typeof caseNumber !== 'string') {
      res.status(400).json({ error: 'Case reference number is required.' });
      return;
    }

    const cleanCaseNumber = caseNumber.trim().toUpperCase();
    const foundCase = await prisma.case.findUnique({
      where: { caseNumber: cleanCaseNumber },
      select: { id: true, caseNumber: true, customerEmail: true },
    });

    if (!foundCase) {
      // Return neutral message to avoid enumeration
      res.status(404).json({
        error: 'No active case found matching this reference. Please check your reference number.',
      });
      return;
    }

    // Invalidate previous unused verification codes for this case
    await prisma.emailVerification.updateMany({
      where: { caseNumber: cleanCaseNumber, isUsed: false },
      data: { isUsed: true },
    });

    const otpCode = generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

    await prisma.emailVerification.create({
      data: {
        caseId: foundCase.id,
        caseNumber: foundCase.caseNumber,
        email: foundCase.customerEmail,
        otpHash,
        expiresAt,
        isUsed: false,
      },
    });

    // Send email with OTP code
    await EmailService.sendOtpCode(foundCase.customerEmail, foundCase.caseNumber, otpCode);

    res.json({
      success: true,
      caseNumber: foundCase.caseNumber,
      maskedEmail: maskEmail(foundCase.customerEmail),
      message: `A single-use verification code has been sent to ${maskEmail(foundCase.customerEmail)}.`,
    });
  } catch (err) {
    console.error('Request access error:', err);
    res.status(500).json({ error: 'Failed to initiate case verification.' });
  }
});

// 3. Verify OTP Code and Generate Temporary Customer Session
router.post('/verify-access', otpVerifyLimiter, async (req: Request, res: Response) => {
  try {
    const { caseNumber, otpCode } = req.body;
    if (!caseNumber || !otpCode) {
      res.status(400).json({ error: 'Case reference and verification code are required.' });
      return;
    }

    const cleanCaseNumber = caseNumber.trim().toUpperCase();
    const cleanOtp = String(otpCode).trim();

    const verification = await prisma.emailVerification.findFirst({
      where: {
        caseNumber: cleanCaseNumber,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { case: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      res.status(400).json({
        error: 'Verification code has expired or is invalid. Please request a new code.',
      });
      return;
    }

    if (verification.attempts >= config.maxOtpAttempts) {
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { isUsed: true },
      });
      res.status(400).json({
        error: 'Maximum verification attempts exceeded. Please request a new code.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(cleanOtp, verification.otpHash);
    if (!isMatch) {
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
      return;
    }

    // Mark verification as used
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { isUsed: true },
    });

    // Issue short-lived session token (2 hours)
    const token = jwt.sign(
      {
        caseId: verification.caseId,
        caseNumber: verification.caseNumber,
        email: verification.email,
        type: 'CUSTOMER_CASE_SESSION',
      },
      config.jwtSecret,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      token,
      caseNumber: verification.caseNumber,
    });
  } catch (err) {
    console.error('Verify access error:', err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// 4. Get Current Verified Case Dashboard Details
router.get('/customer/current', authenticateCustomerSession, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const caseId = req.customerCase!.caseId;
    const foundCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        caseProducts: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            senderType: true,
            senderName: true,
            message: true,
            createdAt: true,
          },
        },
        quotations: {
          where: { status: { in: ['ISSUED', 'SUPERSEDED'] } },
          orderBy: { version: 'desc' },
          include: {
            items: { orderBy: { sortOrder: 'asc' } },
            decisions: { orderBy: { decidedAt: 'desc' } },
          },
        },
      },
    });

    if (!foundCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    // Active quotation is the highest version with ISSUED status
    const currentQuotation = foundCase.quotations.find((q) => q.status === 'ISSUED') || null;

    res.json({
      case: {
        id: foundCase.id,
        caseNumber: foundCase.caseNumber,
        customerType: foundCase.customerType,
        customerName: foundCase.customerName,
        customerEmail: foundCase.customerEmail,
        customerPhone: foundCase.customerPhone,
        status: foundCase.status,
        statusDescription: CASE_STATUS_DESCRIPTIONS[foundCase.status] || foundCase.status,
        declineReason: foundCase.declineReason,
        closeReason: foundCase.closeReason,
        isQuoteComparison: foundCase.isQuoteComparison,
        existingQuoteDetails: foundCase.existingQuoteDetails ? JSON.parse(foundCase.existingQuoteDetails) : null,
        quantity: foundCase.quantity,
        unit: foundCase.unit,
        deliveryAddress: foundCase.deliveryAddress,
        desiredDeliveryDate: foundCase.desiredDeliveryDate,
        deliveryRequirements: foundCase.deliveryRequirements,
        technicalRequirements: foundCase.technicalRequirements,
        comments: foundCase.comments,
        createdAt: foundCase.createdAt,
        lastActivityAt: foundCase.lastActivityAt,
        caseProducts: foundCase.caseProducts,
      },
      currentQuotation,
      quotationHistory: foundCase.quotations,
      messages: foundCase.messages,
    });
  } catch (err) {
    console.error('Customer get current case error:', err);
    res.status(500).json({ error: 'Failed to retrieve case details.' });
  }
});

// 5. Customer Modifies Request
router.patch('/customer/current', authenticateCustomerSession, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const caseId = req.customerCase!.caseId;
    const existing = await prisma.case.findUnique({ where: { id: caseId } });

    if (!existing) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    // Only allow modifications when not yet closed or accepted
    if (['CLOSED', 'REQUEST_DECLINED', 'QUOTATION_ACCEPTED'].includes(existing.status)) {
      res.status(400).json({ error: 'Modifications are not allowed in the current case status.' });
      return;
    }

    const { quantity, unit, deliveryAddress, desiredDeliveryDate, deliveryRequirements, technicalRequirements, comments } = req.body;

    const updated = await prisma.case.update({
      where: { id: caseId },
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

    await prisma.caseStatusHistory.create({
      data: {
        caseId,
        fromStatus: existing.status,
        toStatus: existing.status,
        notes: 'Customer updated request details',
      },
    });

    res.json({ message: 'Request updated successfully', case: updated });
  } catch (err) {
    console.error('Customer update error:', err);
    res.status(500).json({ error: 'Failed to update request.' });
  }
});

// 6. Customer Cancels Case
router.post('/customer/cancel', authenticateCustomerSession, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const caseId = req.customerCase!.caseId;
    const existing = await prisma.case.findUnique({ where: { id: caseId } });

    if (!existing) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    if (existing.status === CASE_STATUSES.QUOTATION_ACCEPTED) {
      res.status(400).json({
        error: 'Case has an accepted quotation. Please contact Betongportalen support directly to cancel an active order.',
      });
      return;
    }

    const reason = req.body.reason || 'Cancelled by customer';

    await prisma.case.update({
      where: { id: caseId },
      data: {
        status: CASE_STATUSES.CLOSED,
        closeReason: reason,
        lastActivityAt: new Date(),
      },
    });

    await prisma.caseStatusHistory.create({
      data: {
        caseId,
        fromStatus: existing.status,
        toStatus: CASE_STATUSES.CLOSED,
        notes: `Customer cancelled inquiry: ${reason}`,
      },
    });

    res.json({ message: 'Case cancelled successfully.' });
  } catch (err) {
    console.error('Cancel case error:', err);
    res.status(500).json({ error: 'Failed to cancel case.' });
  }
});

// 7. Customer Sends Message in Case Chat
router.post('/customer/messages', authenticateCustomerSession, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const caseId = req.customerCase!.caseId;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const currentCase = await prisma.case.findUnique({
      where: { id: caseId },
      select: { customerName: true, caseNumber: true },
    });

    const newMessage = await prisma.caseMessage.create({
      data: {
        caseId,
        senderType: 'CUSTOMER',
        senderName: currentCase?.customerName || 'Customer',
        message: message.trim(),
      },
    });

    await prisma.case.update({
      where: { id: caseId },
      data: { lastActivityAt: new Date() },
    });

    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Customer send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// 8. Customer Accepts Quotation
router.post('/customer/quotations/:quoteId/accept', authenticateCustomerSession, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const caseId = req.customerCase!.caseId;
    const quoteId = req.params.quoteId as string;

    const quotation = await prisma.quotation.findFirst({
      where: { id: quoteId, caseId, status: 'ISSUED' },
      include: { case: true },
    });

    if (!quotation) {
      res.status(404).json({ error: 'Active issued quotation not found.' });
      return;
    }

    // Record decision
    await prisma.quotationDecision.create({
      data: {
        quotationId: quotation.id,
        caseId: quotation.caseId,
        version: quotation.version,
        decision: 'ACCEPTED',
        customerEmail: req.customerCase!.email,
        ipAddress: req.ip,
      },
    });

    // Update case status
    await prisma.case.update({
      where: { id: caseId },
      data: {
        status: CASE_STATUSES.QUOTATION_ACCEPTED,
        lastActivityAt: new Date(),
      },
    });

    // Log status history
    await prisma.caseStatusHistory.create({
      data: {
        caseId,
        fromStatus: quotation.case.status,
        toStatus: CASE_STATUSES.QUOTATION_ACCEPTED,
        notes: `Customer accepted quotation ${quotation.quotationNumber} (version ${quotation.version})`,
      },
    });

    // Get staff emails for notification
    const staffMembers = await prisma.staffUser.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    EmailService.sendQuotationAcceptedNotification(
      quotation.case.customerEmail,
      quotation.case.caseNumber,
      quotation.quotationNumber,
      staffMembers.map((s) => s.email)
    ).catch((err) => console.error('Quotation accept notification error:', err));

    res.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} (v${quotation.version}) successfully accepted!`,
    });
  } catch (err) {
    console.error('Accept quotation error:', err);
    res.status(500).json({ error: 'Failed to accept quotation.' });
  }
});

// 9. Customer Declines Quotation
router.post('/customer/quotations/:quoteId/decline', authenticateCustomerSession, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const caseId = req.customerCase!.caseId;
    const quoteId = req.params.quoteId as string;
    const { reason } = req.body;

    const quotation = await prisma.quotation.findFirst({
      where: { id: quoteId, caseId, status: 'ISSUED' },
      include: { case: true },
    });

    if (!quotation) {
      res.status(404).json({ error: 'Active issued quotation not found.' });
      return;
    }

    // Record decision
    await prisma.quotationDecision.create({
      data: {
        quotationId: quotation.id,
        caseId: quotation.caseId,
        version: quotation.version,
        decision: 'DECLINED',
        decisionReason: reason || null,
        customerEmail: req.customerCase!.email,
        ipAddress: req.ip,
      },
    });

    // Update case status
    await prisma.case.update({
      where: { id: caseId },
      data: {
        status: CASE_STATUSES.QUOTATION_DECLINED,
        lastActivityAt: new Date(),
      },
    });

    await prisma.caseStatusHistory.create({
      data: {
        caseId,
        fromStatus: quotation.case.status,
        toStatus: CASE_STATUSES.QUOTATION_DECLINED,
        notes: `Customer declined quotation ${quotation.quotationNumber} (v${quotation.version}). Reason: ${reason || 'No reason provided'}`,
      },
    });

    const staffMembers = await prisma.staffUser.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    EmailService.sendQuotationDeclinedNotification(
      quotation.case.customerEmail,
      quotation.case.caseNumber,
      quotation.quotationNumber,
      staffMembers.map((s) => s.email)
    ).catch((err) => console.error('Quotation decline notification error:', err));

    res.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} (v${quotation.version}) declined.`,
    });
  } catch (err) {
    console.error('Decline quotation error:', err);
    res.status(500).json({ error: 'Failed to decline quotation.' });
  }
});

// 10. Customer Download Quotation PDF
router.get('/customer/quotations/:quoteId/pdf', authenticateCustomerSession, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const caseId = req.customerCase!.caseId;
    const quoteId = req.params.quoteId as string;

    const quotation = await prisma.quotation.findFirst({
      where: { id: quoteId, caseId },
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
      res.status(500).json({ error: 'Application settings not configured.' });
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
    console.error('Quotation PDF error:', err);
    res.status(500).json({ error: 'Failed to generate quotation PDF.' });
  }
});

export default router;
