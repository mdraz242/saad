import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';

interface EmailPayload {
  to: string;
  subject: string;
  caseNumber?: string;
  template: string;
  heading: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  subtext?: string;
}

export class EmailService {
  private static renderTemplate(payload: EmailPayload): string {
    const portalUrl = config.clientUrl;
    const accessUrl = payload.ctaUrl || `${portalUrl}/find-case?caseNumber=${payload.caseNumber || ''}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; line-height: 1.6; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #1a382b; padding: 28px 32px; text-align: left; }
    .logo { color: #ffffff; font-size: 20px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; }
    .logo-dot { display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-left: 4px; }
    .content { padding: 36px 32px; }
    .case-badge { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; color: #1e293b; padding: 6px 12px; border-radius: 4px; font-family: monospace; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
    h1 { font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    p { margin: 0 0 16px 0; color: #334155; font-size: 15px; }
    .otp-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: monospace; font-size: 28px; font-weight: 700; color: #15803d; letter-spacing: 4px; }
    .btn { display: inline-block; background: #1a382b; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .security-notice { font-size: 13px; color: #64748b; border-left: 3px solid #cbd5e1; padding-left: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        BETONGPORTALEN<span class="logo-dot"></span>
      </div>
    </div>
    <div class="content">
      ${payload.caseNumber ? `<div class="case-badge">Case Ref: ${payload.caseNumber}</div>` : ''}
      <h1>${payload.heading}</h1>
      <p>${payload.message}</p>
      
      ${payload.ctaText ? `
        <div style="text-align: center; margin: 28px 0;">
          <a href="${accessUrl}" class="btn">${payload.ctaText}</a>
        </div>
      ` : ''}
      
      ${payload.subtext ? `<p style="font-size: 14px; color: #64748b;">${payload.subtext}</p>` : ''}

      <div class="security-notice">
        <strong>Security Notice:</strong> Betongportalen will never include confidential price breakdowns directly in an unverified email. Access your case using your case reference and email verification code.
      </div>
    </div>
    <div class="footer">
      Betongportalen AB • Klarabergsviadukten 70, 111 64 Stockholm • Org nr: 556812-3490<br/>
      Need support? Contact us at kontakt@betongportalen.se
    </div>
  </div>
</body>
</html>
    `;
  }

  public static async sendEmail(payload: EmailPayload): Promise<boolean> {
    const html = this.renderTemplate(payload);

    try {
      // 1. Log to database for inspection, test verification and audit
      await prisma.notificationEmailLog.create({
        data: {
          toEmail: payload.to,
          subject: payload.subject,
          template: payload.template,
          bodyText: `${payload.heading}\n\n${payload.message}`,
          caseNumber: payload.caseNumber || null,
          status: 'SENT',
        },
      });

      console.log(`[EMAIL DISPATCHED] To: ${payload.to} | Subject: "${payload.subject}" | Case: ${payload.caseNumber || 'N/A'}`);
      return true;
    } catch (err) {
      console.error('[EMAIL ERROR] Failed to record/send email:', err);
      return false;
    }
  }

  // 1. New Case Submission
  public static async sendCaseCreatedConfirmation(to: string, caseNumber: string, customerName: string) {
    return this.sendEmail({
      to,
      subject: `Inquiry confirmation – Case ${caseNumber}`,
      caseNumber,
      template: 'CASE_CREATED',
      heading: `Thank you for your inquiry, ${customerName}`,
      message: `We have received your concrete / construction material request. Our procurement team is identifying the optimal supplier and negotiating the best volume price for your project. Save your case reference: <strong>${caseNumber}</strong>.`,
      ctaText: 'Access Your Case Portal',
      subtext: 'You can check current case status, chat directly with our team, and review price quotations at any time.',
    });
  }

  // 2. OTP Verification Code
  public static async sendOtpCode(to: string, caseNumber: string, otpCode: string) {
    const message = `
      You requested access to case <strong>${caseNumber}</strong>.
      <div class="otp-box">
        <span style="display:block; font-size: 13px; color: #166534; margin-bottom: 6px; font-weight: 500;">YOUR SINGLE-USE VERIFICATION CODE</span>
        <span class="otp-code">${otpCode}</span>
        <span style="display:block; font-size: 12px; color: #4b5563; margin-top: 8px;">Valid for 10 minutes. Do not share this code.</span>
      </div>
      If you did not request this verification code, you can safely disregard this email.
    `;

    return this.sendEmail({
      to,
      subject: `Verification code for case ${caseNumber}: ${otpCode}`,
      caseNumber,
      template: 'OTP_VERIFICATION',
      heading: 'Confirm your case access',
      message,
    });
  }

  // 3. Employee sends a message
  public static async sendStaffMessageNotification(to: string, caseNumber: string) {
    return this.sendEmail({
      to,
      subject: `New message on case ${caseNumber}`,
      caseNumber,
      template: 'STAFF_MESSAGE',
      heading: 'New message from Betongportalen team',
      message: `A concrete specialist has responded to your case. For your privacy and security, sign in to your case portal to read and reply to the message.`,
      ctaText: 'View Message & Reply',
    });
  }

  // 4. Quotation issued
  public static async sendQuotationIssuedNotification(to: string, caseNumber: string, quotationNumber: string, version: number) {
    return this.sendEmail({
      to,
      subject: `New Quotation available – Case ${caseNumber}`,
      caseNumber,
      template: 'QUOTATION_ISSUED',
      heading: `Your quotation ${quotationNumber} (v${version}) is ready`,
      message: `We have finalized negotiated terms for your concrete request. Please log in to view the line items, VAT calculation, download the official PDF quotation, and choose whether to accept or decline.`,
      ctaText: 'Review Quotation',
    });
  }

  // 5. Customer accepted quotation
  public static async sendQuotationAcceptedNotification(to: string, caseNumber: string, quotationNumber: string, staffEmails: string[]) {
    // Send confirmation to customer
    await this.sendEmail({
      to,
      subject: `Quotation acceptance confirmed – Case ${caseNumber}`,
      caseNumber,
      template: 'QUOTATION_ACCEPTED_CUSTOMER',
      heading: 'Quotation Accepted',
      message: `Thank you for accepting quotation ${quotationNumber}. We are now booking the dispatch schedule with the concrete plant. Our team will keep you updated in your case chat.`,
      ctaText: 'View Case Status',
    });

    // Notify staff
    for (const staffEmail of staffEmails) {
      await this.sendEmail({
        to: staffEmail,
        subject: `[STAFF ALERT] Quotation ${quotationNumber} ACCEPTED by customer (${caseNumber})`,
        caseNumber,
        template: 'QUOTATION_ACCEPTED_STAFF',
        heading: 'Customer Accepted Quotation',
        message: `Customer has accepted quotation ${quotationNumber} on case ${caseNumber}. Please verify delivery dispatch and proceed with production scheduling.`,
      });
    }
  }

  // 6. Customer declined quotation
  public static async sendQuotationDeclinedNotification(to: string, caseNumber: string, quotationNumber: string, staffEmails: string[]) {
    await this.sendEmail({
      to,
      subject: `Quotation declined – Case ${caseNumber}`,
      caseNumber,
      template: 'QUOTATION_DECLINED_CUSTOMER',
      heading: 'Quotation Declined',
      message: `Your decision to decline quotation ${quotationNumber} has been recorded. If you require an adjusted quantity, different concrete specification, or delivery schedule, please let us know in the case portal.`,
      ctaText: 'Open Case Portal',
    });

    for (const staffEmail of staffEmails) {
      await this.sendEmail({
        to: staffEmail,
        subject: `[STAFF ALERT] Quotation ${quotationNumber} DECLINED (${caseNumber})`,
        caseNumber,
        template: 'QUOTATION_DECLINED_STAFF',
        heading: 'Customer Declined Quotation',
        message: `Customer declined quotation ${quotationNumber} for case ${caseNumber}. Review chat notes or contact the customer to renegotiate.`,
      });
    }
  }

  // 7. Important status update
  public static async sendStatusUpdateNotification(to: string, caseNumber: string, statusDescription: string) {
    return this.sendEmail({
      to,
      subject: `Status update on case ${caseNumber}`,
      caseNumber,
      template: 'STATUS_UPDATE',
      heading: 'Case Status Update',
      message: `The status of your inquiry has been updated: <strong>${statusDescription}</strong>. Access your case to view details.`,
      ctaText: 'View Case Update',
    });
  }
}

