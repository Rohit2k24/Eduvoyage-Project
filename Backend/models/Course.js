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
      required: [true, 'Please specify total seats'],
      min: [1, 'Total seats must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Total seats must be a whole number'
      }
    },
    available: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isInteger(value) && value <= this.seats.total;
        },
        message: 'Available seats must be a whole number and cannot exceed total seats'
      }
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
}, {
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

module.exports = mongoose.model('Course', CourseSchema); 