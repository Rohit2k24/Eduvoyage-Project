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
      min: [0, 'Total seats cannot be negative']
    },
    available: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative'],
      validate: {
        validator: function(value) {
          return value <= this.seats.total;
        },
        message: 'Available seats cannot exceed total seats'
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
});

// Add indexes for better query performance
CourseSchema.index({ college: 1, status: 1 });
CourseSchema.index({ name: 'text', description: 'text' });

// Middleware to update available seats
CourseSchema.pre('save', function(next) {
  // Set available seats to total seats if it's a new course
  if (this.isNew && !this.seats.available) {
    this.seats.available = this.seats.total;
  }
  
  // Ensure available seats stays within bounds
  if (this.seats.available < 0) {
    this.seats.available = 0;
  }
  if (this.seats.available > this.seats.total) {
    this.seats.available = this.seats.total;
  }
  
  next();
});

// Add middleware for updates
CourseSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // If we're updating seats, ensure the values are valid
  if (update.$inc && update.$inc['seats.available']) {
    this.options.runValidators = true;
  }
  
  next();
});

module.exports = mongoose.model('Course', CourseSchema); 