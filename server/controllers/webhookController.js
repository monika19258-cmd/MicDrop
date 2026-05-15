const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const PerformerApplication = require('../models/PerformerApplication');

const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature.' });
    }

    // Verify webhook signature using raw body
    const rawBody = req.rawBody;
    if (!rawBody) {
      return res.status(400).json({ success: false, message: 'Missing request body.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Webhook signature verification failed.' });
    }

    const event = req.body;
    const { event: eventType, payload } = event;

    switch (eventType) {
      case 'payment.captured': {
        const razorpayPaymentId = payload.payment.entity.id;
        const razorpayOrderId = payload.payment.entity.order_id;
        const amount = payload.payment.entity.amount / 100; // Convert paise to INR

        const payment = await Payment.findOneAndUpdate(
          { razorpayOrderId },
          {
            razorpayPaymentId,
            status: 'captured',
            amount,
          },
          { new: true }
        );

        if (payment) {
          console.log(`Payment captured via webhook: ${razorpayPaymentId} for order ${razorpayOrderId}`);
        }
        break;
      }

      case 'payment.failed': {
        const razorpayOrderId = payload.payment.entity.order_id;
        const razorpayPaymentId = payload.payment.entity.id;

        await Payment.findOneAndUpdate(
          { razorpayOrderId },
          {
            razorpayPaymentId,
            status: 'failed',
          }
        );

        console.log(`Payment failed via webhook: order ${razorpayOrderId}`);
        break;
      }

      case 'order.paid': {
        const razorpayOrderId = payload.order.entity.id;
        console.log(`Order paid via webhook: ${razorpayOrderId}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return res.status(200).json({ success: true, message: 'Webhook processed.' });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ success: false, message: 'Webhook processing failed.' });
  }
};

module.exports = { handleRazorpayWebhook };
