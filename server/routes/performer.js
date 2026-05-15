const express = require('express');
const router = express.Router();
const {
  browseShows,
  applyToShow,
  verifyPayment,
  getMyApplications,
  getMyShows,
  updateProfile,
} = require('../controllers/performerController');
const verifyToken = require('../middleware/auth');
const requireRoles = require('../middleware/roles');

router.use(verifyToken, requireRoles(['performer']));

router.get('/shows', browseShows);
router.post('/apply/:showId', applyToShow);
router.post('/payment-verify', verifyPayment);
router.get('/applications', getMyApplications);
router.get('/my-shows', getMyShows);
router.put('/profile', updateProfile);

module.exports = router;
