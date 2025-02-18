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
      required: true,
      min: 0
    }
  },
  image: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  eligibility: {
    type: String,
    required: [true, 'Please specify eligibility criteria']
  },
  curriculum: [{
    type: String
  }],
  startDate: Date,
  applicationDeadline: Date
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

// Pre-find middleware to populate college with all necessary fields
CourseSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'college',
    model: 'College',
    select: 'name description facilities location address contactEmail phoneNumber accreditation establishmentYear'
  });
  next();
});

module.exports = mongoose.model('Course', CourseSchema); 