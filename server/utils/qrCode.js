const QRCode = require('qrcode');

/**
 * Generate a QR code as a data URL (base64 PNG).
 * @param {string} payload - The string to encode in the QR code.
 * @returns {Promise<string>} - Base64 data URL of the QR code image.
 */
const generateQRCodeDataURL = async (payload) => {
  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 300,
    });
    return dataUrl;
  } catch (err) {
    throw new Error(`Failed to generate QR code: ${err.message}`);
  }
};

/**
 * Generate a QR code as a Buffer (PNG).
 * @param {string} payload - The string to encode.
 * @returns {Promise<Buffer>} - PNG buffer.
 */
const generateQRCodeBuffer = async (payload) => {
  try {
    const buffer = await QRCode.toBuffer(payload, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 1,
      width: 300,
    });
    return buffer;
  } catch (err) {
    throw new Error(`Failed to generate QR code buffer: ${err.message}`);
  }
};

module.exports = { generateQRCodeDataURL, generateQRCodeBuffer };
