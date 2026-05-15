const Show = require('../models/Show');
const PerformerApplication = require('../models/PerformerApplication');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/email');

// POST /api/admin/shows
const createShow = async (req, res) => {
  try {
    const { title, description, venue, date, time, capacity, ticketPrice, performerSlots, totalSlots, category, status } = req.body;

    if (!title || !description || !venue || !date || !time || !capacity || ticketPrice === undefined || !performerSlots || !totalSlots || !category) {
      return res.status(400).json({ success: false, message: 'All required show fields must be provided.' });
    }

    if (!venue.name || !venue.address || !venue.city) {
      return res.status(400).json({ success: false, message: 'Venue name, address, and city are required.' });
    }

    const show = await Show.create({
      title,
      description,
      venue,
      date: new Date(date),
      time,
      capacity: Number(capacity),
      ticketPrice: Number(ticketPrice),
      performerSlots: Number(performerSlots),
      totalSlots: Number(totalSlots),
      category,
      status: status || 'upcoming',
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: 'Show created successfully.', data: show });
  } catch (err) {
    console.error('Create show error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create show.' });
  }
};

// PUT /api/admin/shows/:id
const updateShow = async (req, res) => {
  try {
    const allowedFields = ['title', 'description', 'venue', 'date', 'time', 'capacity', 'ticketPrice', 'performerSlots', 'totalSlots', 'banner', 'category', 'status'];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (updateData.date) updateData.date = new Date(updateData.date);

    const show = await Show.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    return res.status(200).json({ success: true, message: 'Show updated successfully.', data: show });
  } catch (err) {
    console.error('Update show error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid show ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update show.' });
  }
};

// DELETE /api/admin/shows/:id
const deleteShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    // Check if there are confirmed bookings
    const bookingCount = await Booking.countDocuments({ show: show._id });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete show with ${bookingCount} existing booking(s). Cancel the show instead.`,
      });
    }

    await Show.findByIdAndDelete(req.params.id);
    await PerformerApplication.deleteMany({ show: req.params.id });

    return res.status(200).json({ success: true, message: 'Show deleted successfully.' });
  } catch (err) {
    console.error('Delete show error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid show ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete show.' });
  }
};

// GET /api/admin/applications
const getApplications = async (req, res) => {
  try {
    const { showId, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (showId) filter.show = showId;
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      PerformerApplication.find(filter)
        .populate('performer', 'name email profile')
        .populate('show', 'title date time venue performerSlots')
        .populate('paymentId', 'amount status')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PerformerApplication.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: applications,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('Get applications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

// PUT /api/admin/applications/:id/approve
const approveApplication = async (req, res) => {
  try {
    const { slotTime } = req.body;

    const application = await PerformerApplication.findById(req.params.id)
      .populate('performer', 'name email')
      .populate('show', 'title performerSlots');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Application is already approved.' });
    }

    // Check performer slot availability
    const approvedCount = await PerformerApplication.countDocuments({
      show: application.show._id,
      status: 'approved',
    });

    if (approvedCount >= application.show.performerSlots) {
      return res.status(400).json({ success: false, message: 'All performer slots are filled for this show.' });
    }

    application.status = 'approved';
    if (slotTime) application.slotTime = slotTime;
    await application.save();

    // Send approval email
    await sendApprovalEmail(
      application.performer.email,
      application.performer.name,
      application.show.title,
      slotTime || null
    );

    return res.status(200).json({
      success: true,
      message: 'Application approved.',
      data: { applicationId: application._id, status: application.status, slotTime: application.slotTime },
    });
  } catch (err) {
    console.error('Approve application error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid application ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to approve application.' });
  }
};

// PUT /api/admin/applications/:id/reject
const rejectApplication = async (req, res) => {
  try {
    const { feedbackNote } = req.body;

    const application = await PerformerApplication.findById(req.params.id)
      .populate('performer', 'name email')
      .populate('show', 'title');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Application is already rejected.' });
    }

    application.status = 'rejected';
    if (feedbackNote) application.feedbackNote = feedbackNote;
    await application.save();

    // Send rejection email
    await sendRejectionEmail(
      application.performer.email,
      application.performer.name,
      application.show.title,
      feedbackNote || null
    );

    return res.status(200).json({
      success: true,
      message: 'Application rejected.',
      data: { applicationId: application._id, status: application.status },
    });
  } catch (err) {
    console.error('Reject application error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid application ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to reject application.' });
  }
};

// GET /api/admin/bookings/:showId
const getShowBookings = async (req, res) => {
  try {
    const { showId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const show = await Show.findById(showId).lean();
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find({ show: showId })
        .populate('audience', 'name email')
        .populate('paymentId', 'amount status razorpayPaymentId')
        .sort({ bookedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments({ show: showId }),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('Get show bookings error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid show ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    // Total revenue from captured payments
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Tickets sold (sum of quantities)
    const ticketsResult = await Booking.aggregate([
      { $group: { _id: null, ticketsSold: { $sum: '$quantity' } } },
    ]);
    const ticketsSold = ticketsResult[0]?.ticketsSold || 0;

    // Performer registrations (captured)
    const performerRegistrations = await Payment.countDocuments({ type: 'registration', status: 'captured' });

    // Revenue by show
    const revenueByShow = await Booking.aggregate([
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment',
        },
      },
      { $unwind: { path: '$payment', preserveNullAndEmpty: true } },
      { $match: { 'payment.status': 'captured' } },
      {
        $group: {
          _id: '$show',
          revenue: { $sum: '$totalAmount' },
          ticketsSold: { $sum: '$quantity' },
          bookingCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'shows',
          localField: '_id',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $project: {
          showId: '$_id',
          showTitle: '$show.title',
          showDate: '$show.date',
          revenue: 1,
          ticketsSold: 1,
          bookingCount: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Monthly revenue (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'captured', createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          revenue: 1,
          transactions: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        ticketsSold,
        performerRegistrations,
        revenueByShow,
        monthlyRevenue,
      },
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
};

// POST /api/admin/checkin
const checkIn = async (req, res) => {
  try {
    const { qrPayload } = req.body;

    if (!qrPayload) {
      return res.status(400).json({ success: false, message: 'QR payload is required.' });
    }

    const booking = await Booking.findOne({ qrPayload })
      .populate('show', 'title date time venue status')
      .populate('audience', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Invalid QR code. Ticket not found.' });
    }

    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already checked in.',
        data: {
          checkedInAt: booking.checkedInAt,
          audience: booking.audience?.name,
          show: booking.show?.title,
        },
      });
    }

    if (booking.show?.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This show has been cancelled.' });
    }

    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Check-in successful!',
      data: {
        bookingId: booking._id,
        audience: { name: booking.audience?.name, email: booking.audience?.email },
        show: { title: booking.show?.title, date: booking.show?.date, time: booking.show?.time },
        quantity: booking.quantity,
        checkedInAt: booking.checkedInAt,
      },
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ success: false, message: 'Check-in failed.' });
  }
};

// POST /api/admin/upload/banner
const uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully.',
      data: {
        url: req.file.path,
        publicId: req.file.filename,
      },
    });
  } catch (err) {
    console.error('Upload banner error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload banner.' });
  }
};

module.exports = {
  createShow,
  updateShow,
  deleteShow,
  getApplications,
  approveApplication,
  rejectApplication,
  getShowBookings,
  getAnalytics,
  checkIn,
  uploadBanner,
};
