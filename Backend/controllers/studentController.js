const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// @desc    Get student dashboard statistics
// @route   GET /api/student/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  try {
    console.log('getDashboardStats called');
    const studentId = req.user.id;
    console.log('Student ID:', studentId);

    // Get applications count by status
    const applicationStats = await Application.aggregate([
      { 
        $match: { 
          student: new mongoose.Types.ObjectId(studentId)
        } 
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Application stats:', applicationStats);

    // Get recent applications
    const recentApplications = await Application.find({ 
      student: studentId 
    })
    .sort('-createdAt')
    .limit(5)
    .populate({
      path: 'course',
      select: 'name college',
      populate: {
        path: 'college',
        select: 'name'
      }
    });
    console.log('Recent applications:', recentApplications);

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      user: studentId,
      read: false
    });
    console.log('Unread notifications:', unreadNotifications);

    // Get recommended courses
    const recommendedCourses = await Course.find({ 
      status: 'active',
      _id: { $nin: recentApplications.map(app => app.course._id) }
    })
    .sort('-createdAt')
    .limit(3)
    .populate('college', 'name');
    console.log('Recommended courses:', recommendedCourses);

    // Format the response
    const response = {
      applicationStats: applicationStats.reduce((acc, stat) => {
        acc[stat._id || 'pending'] = stat.count;
        return acc;
      }, {
        pending: 0,
        approved: 0,
        rejected: 0
      }),
      recentApplications,
      unreadNotifications,
      recommendedCourses
    };

    console.log('Sending response:', response);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return next(new ErrorResponse('Error fetching dashboard data', 500));
  }
});

// @desc    Get student notifications
// @route   GET /api/student/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/student/notifications/:id/read
// @access  Private
exports.markNotificationAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 401));
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Delete notification
// @route   DELETE /api/student/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 401));
  }

  await notification.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get student applications
// @route   GET /api/student/applications
// @access  Private
exports.getApplications = asyncHandler(async (req, res, next) => {
  const applications = await Application.find({ student: req.user.id })
    .sort('-createdAt')
    .populate({
      path: 'course',
      select: 'name college image',
      populate: {
        path: 'college',
        select: 'name'
      }
    });

  res.status(200).json({
    success: true,
    applications
  });
});

// @desc    Download application receipt
// @route   GET /api/student/applications/:id/receipt
// @access  Private
exports.downloadReceipt = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate({
      path: 'course',
      select: 'name college',
      populate: {
        path: 'college',
        select: 'name'
      }
    });

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  if (application.student.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 401));
  }

  // Generate and send receipt
  // This is a placeholder - implement actual receipt generation logic
  res.status(200).json({
    success: true,
    message: 'Receipt download functionality to be implemented'
  });
}); 