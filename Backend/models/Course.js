const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a course name'],
    trim: true,
    maxlength: [100, 'Course name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  duration: {
    type: Number,
    required: [true, 'Please add course duration in years']
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
    enum: ['active', 'inactive'],
    default: 'active'
  },
  image: {
    type: String,
    default: '/default-course.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
CourseSchema.index({ college: 1, status: 1 });
CourseSchema.index({ name: 'text', description: 'text' });

// Middleware to update available seats
CourseSchema.pre('save', function(next) {
  if (!this.isNew && !this.seats.available) {
    this.seats.available = this.seats.total;
  }
  next();
});

module.exports = mongoose.model('Course', CourseSchema); 