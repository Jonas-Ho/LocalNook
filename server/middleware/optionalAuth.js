const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/** Attaches req.user when a valid x-auth-token is present; otherwise continues anonymously. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = req.header('x-auth-token');

  if (!token || !process.env.JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
  } catch {
    // Invalid token on public routes — ignore and proceed
  }

  next();
});

module.exports = optionalAuth;