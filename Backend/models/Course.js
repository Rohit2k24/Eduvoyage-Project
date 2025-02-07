const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a course name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  duration: {
    type: String,
    required: [true, 'Please specify the course duration']
  },
  fees: {
    type: Number,
    required: [true, 'Please add course fees']
  },
  seats: {
    total: {
      type: Number,
      required: [true, 'Please specify total seats']
    },
    available: {
      type: Number,
      required: true
    }
  },
  eligibility: {
    type: String,
    required: [true, 'Please specify eligibility criteria']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add course start date']
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Please add application deadline']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  image: {
    type: String,
    default: 'default-course.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update available seats
CourseSchema.pre('save', function(next) {
  if (!this.isNew && !this.seats.available) {
    this.seats.available = this.seats.total;
  }
  next();
});

module.exports = mongoose.model('Course', CourseSchema); 