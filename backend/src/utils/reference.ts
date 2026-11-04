import crypto from 'crypto';

const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous characters

export function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  let code = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += CHARSET[randomBytes[i] % CHARSET.length];
  }
  return `BP-${year}-${code}`;
}

export function generateQuotationNumber(counter: number): string {
  const year = new Date().getFullYear();
  const padded = String(counter).padStart(4, '0');
  return `BP-Q-${year}-${padded}`;
}

export function generateOtp(): string {
  // 6 digit numeric code
  const num = crypto.randomInt(100000, 999999);
  return String(num);
}

