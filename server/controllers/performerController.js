const Razorpay = require('razorpay');
const crypto = require('crypto');
const Show = require('../models/Show');
const PerformerApplication = require('../models/PerformerApplication');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendApplicationConfirmation } = require('../utils/email');

const REGISTRATION_FEE_INR = 99;
const REGISTRATION_FEE_PAISE = REGISTRATION_FEE_INR * 100;

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// GET /api/performer/shows
const browseShows = async (req, res) => {
  try {
    const { page = 1, limit = 12, city, category } = req.query;
    const filter = { status: 'upcoming', date: { $gte: new Date() } };

    if (city) filter['venue.city'] = city.toLowerCase().trim();
    if (category) filter.category = { $regex: new RegExp(category, 'i') };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Exclude shows performer already applied to
    const existingApplications = await PerformerApplication.find({
      performer: req.user._id,
    }).distinct('show');

    filter._id = { $nin: existingApplications };

    const [shows, total] = await Promise.all([
      Show.find(filter).sort({ date: 1 }).skip(skip).limit(limitNum).lean(),
      Show.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: shows,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('Browse shows error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch shows.' });
  }
};

// POST /api/performer/apply/:showId
const applyToShow = async (req, res) => {
  try {
    const { showId } = req.params;
    const { introNote } = req.body;

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    if (show.status !== 'upcoming') {
      return res.status(400).json({ success: false, message: 'Applications are only open for upcoming shows.' });
    }

    if (new Date(show.date) < new Date()) {
      return res.status(400).json({ success: false, message: 'This show has already passed.' });
    }

    const existingApplication = await PerformerApplication.findOne({
      performer: req.user._id,
      show: showId,
    });

    if (existingApplication) {
      return res.status(409).json({ success: false, message: 'You have already applied to this show.' });
    }

    // Count approved applications vs performer slots
    const approvedCount = await PerformerApplication.countDocuments({
      show: showId,
      status: 'approved',
    });

    if (approvedCount >= show.performerSlots) {
      return res.status(400).json({ success: false, message: 'All performer slots for this show are filled.' });
    }

    // Create Razorpay order
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: REGISTRATION_FEE_PAISE,
      currency: 'INR',
      receipt: `reg_${req.user._id}_${showId}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        showId: showId,
        type: 'registration',
      },
    });

    // Create a pending payment record
    const payment = await Payment.create({
      user: req.user._id,
      amount: REGISTRATION_FEE_INR,
      type: 'registration',
      razorpayOrderId: order.id,
      status: 'created',
    });

    // Create a pre-application (holds spot, becomes active after payment)
    const application = await PerformerApplication.create({
      performer: req.user._id,
      show: showId,
      introNote: introNote || '',
      status: 'pending',
      paymentId: payment._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Application initiated. Complete payment to submit.',
      data: {
        applicationId: application._id,
        orderId: order.id,
        amount: REGISTRATION_FEE_PAISE,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    console.error('Apply to show error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid show ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

// POST /api/performer/payment-verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !applicationId) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
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

    // Update application status
    const application = await PerformerApplication.findByIdAndUpdate(
      applicationId,
      { status: 'pending', paymentId: payment._id },
      { new: true }
    ).populate('show', 'title');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Send confirmation email
    await sendApplicationConfirmation(
      req.user.email,
      req.user.name,
      application.show?.title || 'the show'
    );

    return res.status(200).json({
      success: true,
      message: 'Payment verified. Your application is pending review.',
      data: { applicationId: application._id, status: application.status },
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
};

// GET /api/performer/applications
const getMyApplications = async (req, res) => {
  try {
    const applications = await PerformerApplication.find({ performer: req.user._id })
      .populate('show', 'title date time venue status banner category')
      .populate('paymentId', 'amount status razorpayPaymentId')
      .sort({ appliedAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: applications });
  } catch (err) {
    console.error('Get my applications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

// GET /api/performer/my-shows
const getMyShows = async (req, res) => {
  try {
    const applications = await PerformerApplication.find({
      performer: req.user._id,
      status: 'approved',
    })
      .populate({
        path: 'show',
        match: { date: { $gte: new Date() }, status: { $in: ['upcoming', 'ongoing'] } },
        select: 'title date time venue status banner category ticketPrice',
      })
      .sort({ appliedAt: 1 })
      .lean();

    // Filter out applications where show is null (didn't match populate filter)
    const upcomingShows = applications.filter((app) => app.show !== null);

    return res.status(200).json({ success: true, data: upcomingShows });
  } catch (err) {
    console.error('Get my shows error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch upcoming shows.' });
  }
};

// PUT /api/performer/profile
const updateProfile = async (req, res) => {
  try {
    const { bio, category, reelUrl } = req.body;

    const updateFields = {};
    if (bio !== undefined) updateFields['profile.bio'] = bio;
    if (category !== undefined) updateFields['profile.category'] = category;
    if (reelUrl !== undefined) updateFields['profile.reelUrl'] = reelUrl;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No profile fields provided.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { profile: user.profile },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

module.exports = { browseShows, applyToShow, verifyPayment, getMyApplications, getMyShows, updateProfile };
