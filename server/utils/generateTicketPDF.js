const PDFDocument = require('pdfkit');
const { generateQRCodeBuffer } = require('./qrCode');

/**
 * Generate a PDF ticket for a booking.
 * @param {Object} booking - Populated booking document.
 * @param {Object} user - User document (audience).
 * @returns {Promise<Buffer>} - PDF file as a Buffer.
 */
const generateTicketPDF = async (booking, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const show = booking.show;
      const showDate = show?.date ? new Date(show.date).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }) : 'TBD';

      // Header background
      doc.rect(0, 0, doc.page.width, 120).fill('#e63946');

      // Title
      doc
        .fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('MicDrop', 60, 30, { align: 'left' });

      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Where performers find their stage', 60, 65, { align: 'left' });

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('ENTRY TICKET', 0, 50, { align: 'right', width: doc.page.width - 60 });

      // Show title
      doc
        .fillColor('#1d1d1d')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(show?.title || 'MicDrop Show', 60, 145);

      // Divider
      doc.moveTo(60, 180).lineTo(doc.page.width - 60, 180).strokeColor('#e63946').lineWidth(2).stroke();

      // Show details - left column
      const detailsTop = 200;
      doc
        .fillColor('#555555')
        .fontSize(10)
        .font('Helvetica')
        .text('DATE', 60, detailsTop)
        .fillColor('#1d1d1d')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(showDate, 60, detailsTop + 15);

      doc
        .fillColor('#555555')
        .fontSize(10)
        .font('Helvetica')
        .text('TIME', 60, detailsTop + 50)
        .fillColor('#1d1d1d')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(show?.time || 'TBD', 60, detailsTop + 65);

      doc
        .fillColor('#555555')
        .fontSize(10)
        .font('Helvetica')
        .text('VENUE', 60, detailsTop + 100)
        .fillColor('#1d1d1d')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(show?.venue?.name || 'TBD', 60, detailsTop + 115)
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#555555')
        .text(show?.venue?.address || '', 60, detailsTop + 133)
        .text(show?.venue?.city ? show.venue.city.toUpperCase() : '', 60, detailsTop + 148);

      // Right column - ticket info
      doc
        .fillColor('#555555')
        .fontSize(10)
        .font('Helvetica')
        .text('TICKET HOLDER', 320, detailsTop)
        .fillColor('#1d1d1d')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(user?.name || 'Guest', 320, detailsTop + 15);

      doc
        .fillColor('#555555')
        .fontSize(10)
        .font('Helvetica')
        .text('QUANTITY', 320, detailsTop + 50)
        .fillColor('#1d1d1d')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(`${booking.quantity} ticket(s)`, 320, detailsTop + 65);

      doc
        .fillColor('#555555')
        .fontSize(10)
        .font('Helvetica')
        .text('AMOUNT PAID', 320, detailsTop + 100)
        .fillColor('#2a9d8f')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`₹${booking.totalAmount}`, 320, detailsTop + 115);

      doc
        .fillColor('#555555')
        .fontSize(10)
        .font('Helvetica')
        .text('BOOKING ID', 320, detailsTop + 148)
        .fillColor('#1d1d1d')
        .fontSize(10)
        .font('Helvetica')
        .text(booking._id.toString(), 320, detailsTop + 163);

      // Dashed divider
      const dashY = detailsTop + 200;
      doc.moveTo(60, dashY).lineTo(doc.page.width - 60, dashY).dash(5, { space: 5 }).strokeColor('#cccccc').lineWidth(1).stroke();
      doc.undash();

      // QR Code section
      const qrTop = dashY + 20;
      doc
        .fillColor('#1d1d1d')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('SCAN FOR ENTRY', 60, qrTop);

      doc
        .fillColor('#555555')
        .fontSize(10)
        .font('Helvetica')
        .text('Present this QR code at the venue entrance', 60, qrTop + 18);

      // Generate and embed QR code image
      const qrBuffer = await generateQRCodeBuffer(booking.qrPayload);
      doc.image(qrBuffer, 60, qrTop + 40, { width: 140, height: 140 });

      // QR info text
      doc
        .fillColor('#888888')
        .fontSize(9)
        .font('Helvetica')
        .text('One-time use only. Do not share.', 220, qrTop + 40)
        .text(`QR Ref: ${booking.qrPayload.substring(0, 20)}...`, 220, qrTop + 58);

      // Footer
      const footerY = doc.page.height - 80;
      doc.rect(0, footerY, doc.page.width, 80).fill('#1d1d1d');

      doc
        .fillColor('#ffffff')
        .fontSize(10)
        .font('Helvetica')
        .text('This ticket is non-transferable. Management reserves the right of admission.', 60, footerY + 15, {
          align: 'center',
          width: doc.page.width - 120,
        })
        .text(`© ${new Date().getFullYear()} MicDrop. All rights reserved.`, 60, footerY + 35, {
          align: 'center',
          width: doc.page.width - 120,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateTicketPDF;
