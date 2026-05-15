const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const verifyToken = require('../middleware/auth');
const requireRoles = require('../middleware/roles');
const { uploadBanner: uploadBannerMiddleware } = require('../middleware/upload');

router.use(verifyToken, requireRoles(['admin']));

// Show management
router.post('/shows', createShow);
router.put('/shows/:id', updateShow);
router.delete('/shows/:id', deleteShow);

// Performer applications
router.get('/applications', getApplications);
router.put('/applications/:id/approve', approveApplication);
router.put('/applications/:id/reject', rejectApplication);

// Bookings
router.get('/bookings/:showId', getShowBookings);

// Analytics
router.get('/analytics', getAnalytics);

// Check-in
router.post('/checkin', checkIn);

// Banner upload
router.post('/upload/banner', uploadBannerMiddleware.single('banner'), uploadBanner);

module.exports = router;
