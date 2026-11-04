import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../utils/prisma.js';

export interface StaffAuthRequest extends Request {
  staff?: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions?: string[];
  };
}

export interface CustomerAuthRequest extends Request {
  customerCase?: {
    caseId: string;
    caseNumber: string;
    email: string;
  };
}

// Staff authentication
export async function authenticateStaff(
  req: StaffAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized. Staff credentials required.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { staffId: string; role: string };

    const staffUser = await prisma.staffUser.findUnique({
      where: { id: decoded.staffId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    });

    if (!staffUser || !staffUser.isActive) {
      res.status(401).json({ error: 'Account disabled or invalid.' });
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

    req.staff = {
      id: staffUser.id,
      email: staffUser.email,
      name: staffUser.name,
      role: staffUser.role,
      permissions: parsedPermissions,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

// Admin role check (Full super-admin privileges)
export function requireAdministrator(
  req: StaffAuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.staff || req.staff.role !== 'ADMINISTRATOR') {
    res.status(403).json({ error: 'Forbidden. Administrator privileges required.' });
    return;
  }
  next();
}

// Granular permission check
export function requirePermission(permission: string) {
  return (req: StaffAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.staff) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    // Administrators have full access
    if (req.staff.role === 'ADMINISTRATOR') {
      next();
      return;
    }

    // Check employee granted permissions
    const staffPermissions = req.staff.permissions || [];
    if (!staffPermissions.includes(permission)) {
      res.status(403).json({
        error: `Forbidden. Missing required permission: ${permission}`,
      });
      return;
    }

    next();
  };
}

// Verified customer session authentication
export async function authenticateCustomerSession(
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers['x-case-session'] || req.headers.authorization;
    let token = '';

    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    }

    if (!token) {
      res.status(401).json({ error: 'Customer session verification required.' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      caseId: string;
      caseNumber: string;
      email: string;
      type: string;
    };

    if (decoded.type !== 'CUSTOMER_CASE_SESSION') {
      res.status(401).json({ error: 'Invalid session type.' });
      return;
    }

    const foundCase = await prisma.case.findUnique({
      where: { id: decoded.caseId },
      select: { id: true, caseNumber: true, customerEmail: true },
    });

    if (!foundCase || foundCase.caseNumber !== decoded.caseNumber) {
      res.status(401).json({ error: 'Case session no longer valid.' });
      return;
    }

    req.customerCase = {
      caseId: foundCase.id,
      caseNumber: foundCase.caseNumber,
      email: foundCase.customerEmail,
    };

    next();
  } catch (err) {
    res.status(401).json({
      error: 'Case verification expired or invalid. Please re-enter your case number.',
    });
  }
}
