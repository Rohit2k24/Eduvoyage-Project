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
  duration: {
    type: Number,
    required: [true, 'Please specify duration']
  },
  fees: {
    type: Number,
    required: [true, 'Please specify fees']
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  seats: {
    total: {
      type: Number,
      required: [true, 'Please specify total seats'],
      min: 1
    },
    available: {
      type: Number,
      required: [true, 'Please specify available seats'],
      min: 0
    }
  },
  image: {
    type: String,
    default: '/default-course.jpg'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  eligibilityCriteria: [{
    type: String,
    trim: true
  }],
  curriculum: [{
    type: String
  }],
  startDate: {
    type: Date,
    required: [true, 'Please specify start date']
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Please specify application deadline']
  },
  criteria: [{
    type: String,
    required: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
CourseSchema.index({ college: 1, status: 1 });
CourseSchema.index({ name: 'text', description: 'text' });

// Add virtual for occupied seats
CourseSchema.virtual('seats.occupied').get(function() {
  return this.seats.total - this.seats.available;
});

// Pre-save middleware to handle seats
CourseSchema.pre('save', function(next) {
  if (this.isNew) {
    // For new courses, set available seats equal to total seats
    this.seats.available = this.seats.total;
  } else if (this.seats.available > this.seats.total) {
    // Ensure available seats never exceed total seats
    this.seats.available = this.seats.total;
  }
  next();
});

// Pre-find middleware to populate college with necessary fields
CourseSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'college',
    select: 'name description facilities location address contactEmail phoneNumber accreditation establishmentYear'
  });
  next();
});

module.exports = mongoose.model('Course', CourseSchema); 