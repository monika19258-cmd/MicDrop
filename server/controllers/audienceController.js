const Razorpay = require('razorpay');
const crypto = require('crypto');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { generateQRCodeDataURL } = require('../utils/qrCode');
const generateTicketPDF = require('../utils/generateTicketPDF');
const { sendTicketEmail } = require('../utils/email');

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// POST /api/audience/book/:showId
const initiateBooking = async (req, res) => {
  try {
    const { showId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1 || quantity > 10) {
      return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 10.' });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    if (show.status !== 'upcoming' && show.status !== 'ongoing') {
      return res.status(400).json({ success: false, message: 'Tickets are not available for this show.' });
    }

    if (new Date(show.date) < new Date()) {
      return res.status(400).json({ success: false, message: 'This show has already passed.' });
    }

    // Check available capacity
    const bookedCount = await Booking.aggregate([
      { $match: { show: show._id } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const totalBooked = bookedCount[0]?.total || 0;
    const available = show.capacity - totalBooked;

    if (available < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${available} ticket(s) remaining for this show.`,
        available,
      });
    }

    const totalAmount = show.ticketPrice * quantity;
    const totalAmountPaise = totalAmount * 100;

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: totalAmountPaise,
      currency: 'INR',
      receipt: `ticket_${req.user._id}_${showId}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        showId: showId,
        quantity: quantity.toString(),
        type: 'ticket',
      },
    });

    const payment = await Payment.create({
      user: req.user._id,
      amount: totalAmount,
      type: 'ticket',
      razorpayOrderId: order.id,
      status: 'created',
    });

    return res.status(201).json({
      success: true,
      message: 'Order created. Complete payment to confirm booking.',
      data: {
        orderId: order.id,
        paymentId: payment._id,
        amount: totalAmountPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        show: {
          title: show.title,
          date: show.date,
          time: show.time,
          venue: show.venue,
        },
        quantity,
        totalAmount,
      },
    });
  } catch (err) {
    console.error('Initiate booking error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid show ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create booking order.' });
  }
};

// POST /api/audience/payment-verify
const verifyPaymentAndBook = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, quantity, showId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !quantity || !showId) {
      return res.status(400).json({ success: false, message: 'Missing required payment verification fields.' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, user: req.user._id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'captured',
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Fetch show
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    // Generate unique QR payload
    const qrPayload = `MICDROP_${show._id}_${req.user._id}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Generate QR code data URL
    const qrCodeUrl = await generateQRCodeDataURL(qrPayload);

    // Create booking
    const booking = await Booking.create({
      audience: req.user._id,
      show: show._id,
      quantity,
      totalAmount: payment.amount,
      paymentId: payment._id,
      qrPayload,
      qrCodeUrl,
    });

    // Populate booking for PDF/email
    const populatedBooking = await Booking.findById(booking._id)
      .populate('show', 'title date time venue')
      .lean();

    // Generate PDF ticket
    const pdfBuffer = await generateTicketPDF(populatedBooking, req.user);

    // Send ticket email (non-blocking on failure)
    sendTicketEmail(req.user.email, req.user.name, populatedBooking, pdfBuffer).catch((err) => {
      console.error('Failed to send ticket email:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed! Your ticket has been sent to your email.',
      data: {
        bookingId: booking._id,
        qrCodeUrl,
        quantity,
        totalAmount: payment.amount,
        show: {
          title: show.title,
          date: show.date,
          time: show.time,
          venue: show.venue,
        },
      },
    });
  } catch (err) {
    console.error('Verify booking payment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm booking.' });
  }
};

// GET /api/audience/my-tickets
const getMyTickets = async (req, res) => {
  try {
    const bookings = await Booking.find({ audience: req.user._id })
      .populate('show', 'title date time venue status banner category')
      .populate('paymentId', 'amount status razorpayPaymentId')
      .sort({ bookedAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error('Get my tickets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
};

// GET /api/audience/ticket/:bookingId
const getTicket = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      audience: req.user._id,
    })
      .populate('show', 'title date time venue status banner category ticketPrice')
      .populate('paymentId', 'amount status razorpayPaymentId createdAt')
      .lean();

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (err) {
    console.error('Get ticket error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket.' });
  }
};

module.exports = { initiateBooking, verifyPaymentAndBook, getMyTickets, getTicket };
