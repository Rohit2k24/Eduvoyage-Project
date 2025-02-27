const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/async');

// Get all notifications for a college
exports.getCollegeNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ college: req.user.id })
    .sort('-createdAt')
    .populate('relatedTo.application')
    .populate('relatedTo.payment')
    .populate('relatedTo.course');

  res.status(200).json({
    success: true,
    data: notifications
  });
});

// Mark notification as read
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { 
      _id: req.params.id,
      college: req.user.id
    },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// Mark all notifications as read
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { college: req.user.id },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// Delete a notification
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    college: req.user.id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
}); 