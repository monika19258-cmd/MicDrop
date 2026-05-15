const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    venue: {
      name: { type: String, required: [true, 'Venue name is required'] },
      address: { type: String, required: [true, 'Venue address is required'] },
      city: { type: String, required: [true, 'City is required'], lowercase: true, trim: true },
      mapUrl: { type: String, default: '' },
    },
    date: {
      type: Date,
      required: [true, 'Show date is required'],
    },
    time: {
      type: String,
      required: [true, 'Show time is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    ticketPrice: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Ticket price cannot be negative'],
    },
    performerSlots: {
      type: Number,
      required: [true, 'Performer slots is required'],
      min: [1, 'Must have at least 1 performer slot'],
    },
    totalSlots: {
      type: Number,
      required: [true, 'Total slots is required'],
      min: [1, 'Must have at least 1 total slot'],
    },
    banner: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

showSchema.index({ 'venue.city': 1, date: 1, category: 1, status: 1 });
showSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Show', showSchema);
