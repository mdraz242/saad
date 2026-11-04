import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import {
  authenticateStaff,
  requireAdministrator,
  StaffAuthRequest,
} from '../middleware/auth.middleware.js';

const router = Router();

// Public: Get Active Products for Customer Form
router.get('/products', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ products });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// Admin: Get All Products (Active and Inactive)
router.get('/admin/products', authenticateStaff, async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ products });
  } catch (err) {
    console.error('Admin get products error:', err);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(5),
  defaultUnit: z.string().min(1),
  availableUnits: z.string().min(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// Admin: Create Product (Admin role required)
router.post(
  '/admin/products',
  authenticateStaff,
  requireAdministrator,
  async (req: StaffAuthRequest, res) => {
    try {
      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid product data' });
        return;
      }

      const product = await prisma.product.create({
        data: parsed.data,
      });

      await prisma.auditLog.create({
        data: {
          action: 'PRODUCT_CREATED',
          entityType: 'Product',
          entityId: product.id,
          staffUserId: req.staff!.id,
          details: `Created product "${product.name}"`,
        },
      });

      res.status(201).json({ product });
    } catch (err) {
      console.error('Create product error:', err);
      res.status(500).json({ error: 'Failed to create product.' });
    }
  }
);

// Admin: Update Product (Admin role required)
router.patch(
  '/admin/products/:id',
  authenticateStaff,
  requireAdministrator,
  async (req: StaffAuthRequest, res) => {
    try {
      const id = req.params.id as string;
      const parsed = productSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid product update data.' });
        return;
      }

      const updated = await prisma.product.update({
        where: { id },
        data: parsed.data,
      });

      await prisma.auditLog.create({
        data: {
          action: 'PRODUCT_UPDATED',
          entityType: 'Product',
          entityId: id,
          staffUserId: req.staff!.id,
          details: `Updated product "${updated.name}"`,
        },
      });

      res.json({ product: updated });
    } catch (err) {
      console.error('Update product error:', err);
      res.status(500).json({ error: 'Failed to update product.' });
    }
  }
);

// Admin: Toggle Product Active Status
router.delete(
  '/admin/products/:id',
  authenticateStaff,
  requireAdministrator,
  async (req: StaffAuthRequest, res) => {
    try {
      const id = req.params.id as string;
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        res.status(404).json({ error: 'Product not found.' });
        return;
      }

      const updated = await prisma.product.update({
        where: { id },
        data: { isActive: !product.isActive },
      });

      res.json({ message: `Product ${updated.isActive ? 'activated' : 'deactivated'}.`, product: updated });
    } catch (err) {
      console.error('Delete product error:', err);
      res.status(500).json({ error: 'Failed to update product.' });
    }
  }
);

export default router;
