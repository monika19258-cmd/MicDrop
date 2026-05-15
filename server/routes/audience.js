const express = require('express');
const router = express.Router();
const {
  initiateBooking,
  verifyPaymentAndBook,
  getMyTickets,
  getTicket,
} = require('../controllers/audienceController');
const verifyToken = require('../middleware/auth');
const requireRoles = require('../middleware/roles');

router.use(verifyToken, requireRoles(['audience']));

router.post('/book/:showId', initiateBooking);
router.post('/payment-verify', verifyPaymentAndBook);
router.get('/my-tickets', getMyTickets);
router.get('/ticket/:bookingId', getTicket);

module.exports = router;
