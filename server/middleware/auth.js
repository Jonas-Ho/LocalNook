const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const auth = asyncHandler(async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    res.status(401);
    throw new Error('No token provided. Authorization denied.');
  }

  if (!process.env.JWT_SECRET) {
    res.status(500);
    throw new Error('JWT_SECRET is not configured');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    res.status(401);
    throw new Error('User not found. Token invalid.');
  }

  req.user = user;
  next();
});

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

module.exports = { auth, adminOnly };