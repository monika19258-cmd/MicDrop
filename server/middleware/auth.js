const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Access token expired.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid access token.' });
    }

    const user = await User.findById(decoded.userId).select('-passwordHash -emailOTP -emailOTPExpiry -refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Email not verified.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

module.exports = verifyToken;
