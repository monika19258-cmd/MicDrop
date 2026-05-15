const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/webhookController');

// No JSON body parser here — raw body is needed for signature verification
// Raw body is attached by the capture middleware in server.js
router.post('/razorpay', handleRazorpayWebhook);

module.exports = router;
