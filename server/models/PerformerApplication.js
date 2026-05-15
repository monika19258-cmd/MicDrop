const mongoose = require('mongoose');

const performerApplicationSchema = new mongoose.Schema(
  {
    performer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
    },
    introNote: {
      type: String,
      maxlength: [1000, 'Intro note cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    feedbackNote: {
      type: String,
      maxlength: [500, 'Feedback note cannot exceed 500 characters'],
      default: '',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    slotTime: {
      type: String,
      default: '',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

performerApplicationSchema.index({ performer: 1, show: 1 }, { unique: true });
performerApplicationSchema.index({ show: 1, status: 1 });

module.exports = mongoose.model('PerformerApplication', performerApplicationSchema);
