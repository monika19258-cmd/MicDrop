const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    audience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Cannot book more than 10 tickets at once'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    qrPayload: {
      type: String,
      unique: true,
      required: true,
    },
    qrCodeUrl: {
      type: String,
      default: '',
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

bookingSchema.index({ audience: 1, show: 1 });
bookingSchema.index({ qrPayload: 1 }, { unique: true });
bookingSchema.index({ show: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
