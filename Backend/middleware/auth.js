const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

exports.protect = asyncHandler(async (req, res, next) => {
  try {
    let token;
    console.log('Auth headers:', req.headers); // Debug log

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found:', token); // Debug log
    }

    if (!token) {
      console.log('No token found'); // Debug log
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log

    req.user = await User.findById(decoded.id);
    if (!req.user) {
      console.log('No user found with token ID'); // Debug log
      return next(new ErrorResponse('User not found', 401));
    }

    console.log('User authenticated:', req.user._id); // Debug log
    next();
  } catch (error) {
    console.error('Auth middleware error:', error); // Debug log
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Add role authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
}; 