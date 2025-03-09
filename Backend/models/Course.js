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
    required: [true, 'Please add a description']
  },
  duration: {
    type: Number,
    required: [true, 'Please add course duration in years']
  },
  fees: {
    type: Number,
    required: [true, 'Please add course fees']
  },
  image: {
    type: String,
    default: '/default-course.jpg'
  },
  college: {
    type: mongoose.Schema.ObjectId,
    ref: 'College',
    required: true
  },
  seats: {
    total: {
      type: Number,
      required: [true, 'Please add total number of seats']
    },
    available: {
      type: Number,
      required: true
    }
  },
  eligibilityCriteria: {
    type: [String],
    required: [true, 'Please add eligibility criteria']
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', CourseSchema);