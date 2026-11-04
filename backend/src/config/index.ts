import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'betongportalen_super_secret_jwt_key_2026_nordic_platform',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  emailFrom: process.env.EMAIL_FROM || 'no-reply@betongportalen.se',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  otpExpiryMinutes: 10,
  maxOtpAttempts: 5,
};

export const CASE_STATUSES = {
  NEW: 'NEW',
  UNDER_REVIEW: 'UNDER_REVIEW',
  MORE_INFO_NEEDED: 'MORE_INFO_NEEDED',
  QUOTATION_SENT: 'QUOTATION_SENT',
  QUOTATION_ACCEPTED: 'QUOTATION_ACCEPTED',
  QUOTATION_DECLINED: 'QUOTATION_DECLINED',
  REQUEST_DECLINED: 'REQUEST_DECLINED',
  CLOSED: 'CLOSED',
} as const;

export const CASE_STATUS_DESCRIPTIONS: Record<string, string> = {
  NEW: 'Request received. Our concrete specialists will review your requirements shortly.',
  UNDER_REVIEW: 'Under review. We are currently negotiating the best prices with approved regional concrete plants.',
  MORE_INFO_NEEDED: 'Additional details needed. An employee has sent you a question in the case chat.',
  QUOTATION_SENT: 'Quotation ready! Review your quotation and terms below to accept or decline.',
  QUOTATION_ACCEPTED: 'Quotation accepted. The order is being booked with the production facility.',
  QUOTATION_DECLINED: 'Quotation declined. You can reply in the chat if you need an adjusted specification.',
  REQUEST_DECLINED: 'Request declined. Please see the employee note below.',
  CLOSED: 'Case closed. Thank you for using Betongportalen.',
};

