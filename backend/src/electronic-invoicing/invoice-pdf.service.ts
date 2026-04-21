import { Injectable, NotFoundException } from '@nestjs/common';
// Lazy load modules to prevent boot crashes if not installed in the environment
let PDFDocument: any;
let bwipjs: any;
import { ElectronicInvoice } from './entities/electronic-invoice.entity';
import { AfipCredentials, TipoIva } from './entities/afip-credentials.entity';
import { Sale } from '@sales/entities/sale.entity';

@Injectable()
export class InvoicePdfService {
  /**
   * Genera un PDF de la factura electrónica en un Buffer.
   */
  async generateInvoicePdf(
    invoice: ElectronicInvoice,
    creds: AfipCredentials,
    sale?: Sale,
  ): Promise<Buffer> {
    if (!PDFDocument) PDFDocument = require('pdfkit');
    if (!bwipjs) bwipjs = require('bwip-js');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      this.renderHeader(doc, invoice, creds);
      this.renderReceptor(doc, invoice);
      this.renderItems(doc, sale);
      this.renderFooter(doc, invoice, creds);

      doc.end();
    });
  }

  private renderHeader(doc: any, invoice: ElectronicInvoice, creds: AfipCredentials) {
    // Rectángulo exterior de cabecera
    doc.rect(40, 40, 515, 100).stroke();

    // Letra del comprobante (A, B, C)
    const letra = invoice.tipo_comprobante === 1 ? 'A' : invoice.tipo_comprobante === 6 ? 'B' : 'C';
    doc.rect(282, 40, 30, 30).fillAndStroke('#eee', '#000');
    doc.fillColor('#000').fontSize(20).text(letra, 282, 48, { align: 'center', width: 30 });

    // Código de comprobante (debajo de la letra)
    const codComp = invoice.tipo_comprobante.toString().padStart(3, '0');
    doc.fontSize(7).text(`COD. ${codComp}`, 282, 72, { align: 'center', width: 30 });

    // Lado Izquierdo: Datos del Emisor
    doc.fontSize(14).text(creds.razon_social, 50, 50, { width: 220 });
    doc.fontSize(8).text(`Condición IVA: ${creds.tipo_iva}`, 50, 70);
    doc.text(`Punto de Venta: ${invoice.punto_de_venta.toString().padStart(4, '0')}`, 50, 80);

    // Lado Derecho: Datos del Comprobante
    const nroComp = invoice.numero_comprobante.toString().padStart(8, '0');
    doc.fontSize(12).text('FACTURA', 320, 50, { align: 'right', width: 220 });
    doc.fontSize(10).text(`Nro: ${invoice.punto_de_venta.toString().padStart(4, '0')}-${nroComp}`, 320, 65, { align: 'right', width: 220 });
    doc.text(`Fecha: ${invoice.fecha_comprobante.toLocaleDateString('es-AR')}`, 320, 78, { align: 'right', width: 220 });

    doc.moveDown(4);
  }

  private renderReceptor(doc: any, invoice: ElectronicInvoice) {
    doc.rect(40, 145, 515, 60).stroke();
    doc.fontSize(10).text(`Cliente: ${invoice.nombre_receptor || 'Consumidor Final'}`, 50, 155);
    
    const tipoDocMap: Record<number, string> = { 80: 'CUIT', 96: 'DNI', 99: 'Sin Doc.' };
    const docLabel = tipoDocMap[invoice.doc_tipo_receptor] || 'Doc';
    doc.text(`${docLabel}: ${invoice.doc_nro_receptor}`, 50, 170);
    doc.text('Condición IVA: Consumidor Final', 50, 185); // TODO: Mejorar esto si es Responsable Inscripto
  }

  private renderItems(doc: any, sale?: Sale) {
    const startY = 220;
    doc.rect(40, startY, 515, 20).fill('#eee').stroke('#000');
    doc.fillColor('#000').fontSize(9);
    doc.text('Producto', 50, startY + 6);
    doc.text('Cant.', 300, startY + 6, { width: 50, align: 'right' });
    doc.text('Precio Unit.', 360, startY + 6, { width: 80, align: 'right' });
    doc.text('Subtotal', 450, startY + 6, { width: 90, align: 'right' });

    if (!sale || !sale.items || sale.items.length === 0) {
      doc.text('Venta registrada sin detalle de items en el sistema.', 50, startY + 30);
      return;
    }

    let currentY = startY + 25;
    sale.items.forEach((item) => {
      // Si el item tiene relación cargada con product
      const name = (item as any).product?.name || 'Producto';
      doc.text(name, 50, currentY, { width: 240 });
      doc.text(item.quantity.toString(), 300, currentY, { width: 50, align: 'right' });
      doc.text(`$${Number(item.unit_price).toFixed(2)}`, 360, currentY, { width: 80, align: 'right' });
      doc.text(`$${Number(item.subtotal).toFixed(2)}`, 450, currentY, { width: 90, align: 'right' });
      currentY += 15;
      
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });
  }

  private async renderFooter(doc: any, invoice: ElectronicInvoice, creds: AfipCredentials) {
    const footerY = 720;
    doc.lineCap('butt').moveTo(40, footerY).lineTo(555, footerY).stroke();

    // Totales
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`TOTAL: $${Number(invoice.importe_total).toFixed(2)}`, 400, footerY + 10, { width: 140, align: 'right' });
    doc.font('Helvetica').fontSize(9);
    
    if (invoice.tipo_comprobante === 1) { // Factura A
      doc.text(`Neto Gravado: $${Number(invoice.importe_neto).toFixed(2)}`, 400, footerY + 25, { width: 140, align: 'right' });
      doc.text(`IVA: $${Number(invoice.importe_iva).toFixed(2)}`, 400, footerY + 35, { width: 140, align: 'right' });
    }

    // CAE y Vencimiento
    doc.fontSize(10).font('Helvetica-Bold').text(`CAE: ${invoice.cae}`, 50, footerY + 60);
    doc.text(`Vencimiento CAE: ${invoice.cae_expiration.toLocaleDateString('es-AR')}`, 50, footerY + 75);

    // QR AFIP (Obligatorio desde 2021)
    // URL base ARCA: https://www.afip.gob.ar/fe/qr/?p=BASE64(JSON)
    const qrData = {
      ver: 1,
      fecha: invoice.fecha_comprobante.toISOString().split('T')[0],
      cuit: 20000000001, // TODO: Desencriptar CUIT de creds
      ptoVta: invoice.punto_de_venta,
      tipoCmp: invoice.tipo_comprobante,
      nroCmp: Number(invoice.numero_comprobante),
      importe: Number(invoice.importe_total),
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: invoice.doc_tipo_receptor,
      nroDocRec: Number(invoice.doc_nro_receptor),
      tipoCodAut: 'E',
      codAut: Number(invoice.cae),
    };

    const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(JSON.stringify(qrData)).toString('base64')}`;
    
    try {
      const qrImage = await bwipjs.toBuffer({
        bcid: 'qrcode',
        text: qrUrl,
        scale: 2,
        height: 20,
        width: 20,
      });
      doc.image(qrImage, 50, footerY + 5, { width: 50 });
    } catch (err) {
      console.error('Error generating QR for invoice:', err);
    }
    
    if (invoice.is_test) {
      doc.save();
      doc.fontSize(40).fillColor('red', 0.1).rotate(-45, { origin: [300, 400] }).text('VALIDEZ NO FISCAL - PRUEBA', 100, 400);
      doc.restore();
    }
  }
}
