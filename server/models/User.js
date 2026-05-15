const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['performer', 'audience', 'admin'],
      required: [true, 'Role is required'],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailOTP: {
      type: String,
      select: false,
    },
    emailOTPExpiry: {
      type: Date,
      select: false,
    },
    profile: {
      bio: { type: String, maxlength: 500, default: '' },
      category: { type: String, default: '' },
      reelUrl: { type: String, default: '' },
      photoUrl: { type: String, default: '' },
    },
    refreshToken: {
      type: String,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
