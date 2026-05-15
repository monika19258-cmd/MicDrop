const Show = require('../models/Show');
const PerformerApplication = require('../models/PerformerApplication');

// GET /api/shows
const getShows = async (req, res) => {
  try {
    const { city, date, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const filter = { status: { $in: ['upcoming', 'ongoing'] } };

    if (city) filter['venue.city'] = city.toLowerCase().trim();
    if (category) filter.category = { $regex: new RegExp(category, 'i') };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.ticketPrice = {};
      if (minPrice !== undefined) filter.ticketPrice.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.ticketPrice.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [shows, total] = await Promise.all([
      Show.find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email')
        .lean(),
      Show.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: shows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get shows error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch shows.' });
  }
};

// GET /api/shows/:id
const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const approvedApplications = await PerformerApplication.find({
      show: show._id,
      status: 'approved',
    })
      .populate('performer', 'name profile')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...show,
        approvedPerformers: approvedApplications,
      },
    });
  } catch (err) {
    console.error('Get show by ID error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid show ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to fetch show.' });
  }
};

module.exports = { getShows, getShowById };
