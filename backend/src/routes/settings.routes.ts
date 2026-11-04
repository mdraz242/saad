import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import {
  authenticateStaff,
  requireAdministrator,
  StaffAuthRequest,
} from '../middleware/auth.middleware.js';

const router = Router();

// Public: Get Basic Company Info
router.get('/settings', async (_req, res) => {
  try {
    const settings = await prisma.applicationSettings.findUnique({
      where: { id: 'default-settings' },
      select: {
        companyName: true,
        companyLogoUrl: true,
        orgNumber: true,
        vatNumber: true,
        address: true,
        supportEmail: true,
        supportPhone: true,
        defaultVatRate: true,
        currency: true,
        measurementUnits: true,
      },
    });
    res.json({ settings });
  } catch (err) {
    console.error('Get public settings error:', err);
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

// Admin: Get Full Settings
router.get('/admin/settings', authenticateStaff, async (_req, res) => {
  try {
    const settings = await prisma.applicationSettings.findUnique({
      where: { id: 'default-settings' },
    });
    res.json({ settings });
  } catch (err) {
    console.error('Get admin settings error:', err);
    res.status(500).json({ error: 'Failed to retrieve application settings.' });
  }
});

// Admin: Update Settings
router.patch(
  '/admin/settings',
  authenticateStaff,
  requireAdministrator,
  async (req: StaffAuthRequest, res) => {
    try {
      const {
        companyName,
        companyLogoUrl,
        orgNumber,
        vatNumber,
        address,
        supportEmail,
        supportPhone,
        defaultVatRate,
        currency,
        defaultQuotationTerms,
        measurementUnits,
        dataRetentionDays,
      } = req.body;

      const updated = await prisma.applicationSettings.upsert({
        where: { id: 'default-settings' },
        update: {
          ...(companyName ? { companyName } : {}),
          ...(companyLogoUrl !== undefined ? { companyLogoUrl } : {}),
          ...(orgNumber ? { orgNumber } : {}),
          ...(vatNumber ? { vatNumber } : {}),
          ...(address ? { address } : {}),
          ...(supportEmail ? { supportEmail } : {}),
          ...(supportPhone ? { supportPhone } : {}),
          ...(defaultVatRate !== undefined ? { defaultVatRate: Number(defaultVatRate) } : {}),
          ...(currency ? { currency } : {}),
          ...(defaultQuotationTerms ? { defaultQuotationTerms } : {}),
          ...(measurementUnits !== undefined ? { measurementUnits } : {}),
          ...(dataRetentionDays !== undefined ? { dataRetentionDays: Number(dataRetentionDays) } : {}),
        },
        create: {
          id: 'default-settings',
          companyName: companyName || 'Betongportalen AB',
          companyLogoUrl: companyLogoUrl || null,
          orgNumber: orgNumber || '556812-3490',
          vatNumber: vatNumber || 'SE556812349001',
          address: address || 'Klarabergsviadukten 70, 111 64 Stockholm',
          supportEmail: supportEmail || 'kontakt@betongportalen.se',
          supportPhone: supportPhone || '+46 (0)8 400 120 00',
          defaultVatRate: defaultVatRate !== undefined ? Number(defaultVatRate) : 25.0,
          currency: currency || 'SEK',
          defaultQuotationTerms: defaultQuotationTerms || 'Standard quotation terms',
          measurementUnits: measurementUnits || 'm³,tonnes,pieces,pallets,running meters',
          dataRetentionDays: dataRetentionDays ? Number(dataRetentionDays) : 1825,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'SETTINGS_UPDATED',
          entityType: 'ApplicationSettings',
          entityId: updated.id,
          staffUserId: req.staff!.id,
          description: `Application settings updated by ${req.staff!.name}`,
        },
      });

      res.json({ settings: updated });
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  }
);

// Admin: Email Inspector
router.get('/admin/email-logs', authenticateStaff, async (_req, res) => {
  try {
    const emails = await prisma.notificationEmailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
    });

    res.json({ emails });
  } catch (err) {
    console.error('Email log error:', err);
    res.status(500).json({ error: 'Failed to retrieve email logs.' });
  }
});

export default router;
