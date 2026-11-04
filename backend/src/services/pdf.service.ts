import PDFDocument from 'pdfkit';
import { ApplicationSettings, Case, Quotation, QuotationItem } from '@prisma/client';

interface QuotationWithDetails extends Quotation {
  items: QuotationItem[];
  case: Case;
}

export class PdfService {
  public static async generateQuotationPdf(
    quotation: QuotationWithDetails,
    settings: ApplicationSettings
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1a382b';
      const greenAccent = '#22c55e';
      const darkText = '#0f172a';
      const mutedText = '#64748b';
      const borderColor = '#e2e8f0';

      // Header Bar
      doc.rect(40, 40, 515, 6).fill(primaryColor);

      // Brand Logo / Header Text
      doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('BETONGPORTALEN', 40, 58, { continued: true });
      doc.fontSize(20).fillColor(greenAccent).text(' •');
      doc.fontSize(9).font('Helvetica').fillColor(mutedText).text('The Concrete & Construction Materials Portal', 40, 82);

      // Document Title & Reference Box
      doc.fontSize(18).font('Helvetica-Bold').fillColor(darkText).text('COMMERCIAL QUOTATION', 350, 58, { align: 'right' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text(`Quote Ref: ${quotation.quotationNumber} (v${quotation.version})`, 350, 80, { align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor(mutedText).text(`Case Ref: ${quotation.case.caseNumber}`, 350, 95, { align: 'right' });

      // Divider line
      doc.strokeColor(borderColor).lineWidth(1).moveTo(40, 115).lineTo(555, 115).stroke();

      // Two-column meta details
      // Left Column: Customer details
      const metaY = 125;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedText).text('CUSTOMER DETAILS', 40, metaY);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(darkText).text(quotation.case.customerName, 40, metaY + 14);
      doc.fontSize(9).font('Helvetica').fillColor(darkText).text(`Customer Type: ${quotation.case.customerType === 'BUSINESS' ? 'Company / Business' : 'Individual / Private'}`, 40, metaY + 28);
      doc.fontSize(9).text(`Delivery Address: ${quotation.case.deliveryAddress}`, 40, metaY + 42, { width: 230 });
      doc.fontSize(9).text(`Contact: ${quotation.case.customerEmail} | ${quotation.case.customerPhone}`, 40, metaY + 70);

      // Right Column: Issuer & Dates
      doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedText).text('SUPPLIER & DATES', 320, metaY);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(darkText).text(settings.companyName, 320, metaY + 14);
      doc.fontSize(9).font('Helvetica').fillColor(darkText).text(`Org. No: ${settings.orgNumber} | VAT: ${settings.vatNumber}`, 320, metaY + 28);
      
      const issueDateStr = new Date(quotation.createdAt).toLocaleDateString('sv-SE');
      const validUntilStr = new Date(quotation.validityDate).toLocaleDateString('sv-SE');
      doc.fontSize(9).text(`Issue Date: ${issueDateStr}`, 320, metaY + 42);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#b91c1c').text(`Valid Until: ${validUntilStr}`, 320, metaY + 56);
      doc.fontSize(9).font('Helvetica').fillColor(darkText).text(`Support: ${settings.supportEmail} | ${settings.supportPhone}`, 320, metaY + 70);

      // Table Header
      const tableY = 220;
      doc.rect(40, tableY, 515, 24).fill('#f1f5f9');
      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkText);
      doc.text('#', 48, tableY + 7);
      doc.text('Description / Specification', 75, tableY + 7);
      doc.text('Qty', 320, tableY + 7, { width: 45, align: 'right' });
      doc.text('Unit', 375, tableY + 7);
      doc.text('Unit Price', 415, tableY + 7, { width: 60, align: 'right' });
      doc.text('Total (ex. VAT)', 480, tableY + 7, { width: 65, align: 'right' });

      // Table Items
      let currentY = tableY + 28;
      quotation.items.forEach((item, index) => {
        if (index % 2 === 1) {
          doc.rect(40, currentY - 4, 515, 22).fill('#fafafa');
        }

        doc.fontSize(9).font('Helvetica').fillColor(darkText);
        doc.text(String(index + 1), 48, currentY);
        doc.text(item.description, 75, currentY, { width: 235 });
        doc.text(item.quantity.toLocaleString('sv-SE', { maximumFractionDigits: 2 }), 320, currentY, { width: 45, align: 'right' });
        doc.text(item.unit, 375, currentY);
        doc.text(`${item.unitPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`, 415, currentY, { width: 60, align: 'right' });
        doc.font('Helvetica-Bold').text(`${item.lineTotal.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`, 480, currentY, { width: 65, align: 'right' });

        currentY += 24;
      });

      // Bottom Totals Section
      currentY += 10;
      doc.strokeColor(borderColor).lineWidth(1).moveTo(320, currentY).lineTo(555, currentY).stroke();
      currentY += 8;

      const formatKr = (val: number) => `${val.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SEK`;

      doc.fontSize(9).font('Helvetica').fillColor(mutedText).text('Subtotal (excl. VAT):', 320, currentY);
      doc.font('Helvetica').fillColor(darkText).text(formatKr(quotation.subtotal), 440, currentY, { width: 105, align: 'right' });
      currentY += 16;

      doc.fontSize(9).font('Helvetica').fillColor(mutedText).text(`Moms / VAT (${quotation.vatRate}%):`, 320, currentY);
      doc.font('Helvetica').fillColor(darkText).text(formatKr(quotation.vatAmount), 440, currentY, { width: 105, align: 'right' });
      currentY += 18;

      // Grand total box
      doc.rect(315, currentY - 4, 240, 26).fill('#f0fdf4');
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('TOTAL AMOUNT (INCL. VAT):', 325, currentY + 3);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text(formatKr(quotation.grandTotal), 430, currentY + 3, { width: 115, align: 'right' });
      currentY += 36;

      // Notes section (if any)
      if (quotation.notes) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text('IMPORTANT QUOTATION NOTES', 40, currentY);
        currentY += 14;
        doc.fontSize(8.5).font('Helvetica').fillColor(darkText).text(quotation.notes, 40, currentY, { width: 515 });
        currentY += doc.heightOfString(quotation.notes, { width: 515 }) + 14;
      }

      // Terms and Conditions Section
      doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedText).text('TERMS & DELIVERY CONDITIONS', 40, currentY);
      currentY += 14;
      doc.fontSize(8).font('Helvetica').fillColor(mutedText).text(quotation.termsAndConditions, 40, currentY, { width: 515 });

      // Footer
      doc.fontSize(7.5).font('Helvetica').fillColor('#94a3b8').text(
        `Betongportalen AB • Registered Address: ${settings.address} • Quotation generated via Betongportalen System. All prices subject to confirmed access conditions and validity period.`,
        40,
        780,
        { width: 515, align: 'center' }
      );

      doc.end();
    });
  }
}

