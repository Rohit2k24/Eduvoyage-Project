const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  type: {
    type: String,
    enum: ['application', 'payment', 'status_update', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedTo: {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application'
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema); 