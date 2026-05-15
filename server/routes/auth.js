const express = require('express');
const router = express.Router();
const { register, verifyEmail, resendOTP, login, refresh, logout, getMe } = require('../controllers/authController');
const verifyToken = require('../middleware/auth');
const { authRateLimiter, otpRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authRateLimiter, register);
router.post('/verify-email', authRateLimiter, verifyEmail);
router.post('/resend-otp', otpRateLimiter, resendOTP);
router.post('/login', authRateLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);

module.exports = router;
