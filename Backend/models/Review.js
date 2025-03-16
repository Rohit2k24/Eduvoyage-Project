const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, 'Please provide a review title'],
    trim: true,
    maxlength: 100
  },
  review: {
    type: String,
    required: [true, 'Please provide a review'],
    trim: true,
    maxlength: 1000
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  reviewType: {
    type: String,
    enum: ['college', 'course'],
    required: true
  },
  verifiedApplication: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  reported: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    reasons: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent user from submitting more than one review per college/course
reviewSchema.index(
  { student: 1, college: 1, reviewType: 1 },
  { unique: true, sparse: true }
);
reviewSchema.index(
  { student: 1, course: 1, reviewType: 1 },
  { unique: true, sparse: true }
);

// Static method to calculate average rating
reviewSchema.statics.getAverageRating = async function(id, type) {
  const obj = await this.aggregate([
    {
      $match: {
        [type]: id,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: `$${type}`,
        averageRating: { $avg: '$rating' },
        numberOfReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    if (type === 'college') {
      await this.model('College').findByIdAndUpdate(id, {
        averageRating: obj[0]?.averageRating || 0,
        numberOfReviews: obj[0]?.numberOfReviews || 0
      });
    } else {
      await this.model('Course').findByIdAndUpdate(id, {
        averageRating: obj[0]?.averageRating || 0,
        numberOfReviews: obj[0]?.numberOfReviews || 0
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', function() {
  if (this.college) {
    this.constructor.getAverageRating(this.college, 'college');
  }
  if (this.course) {
    this.constructor.getAverageRating(this.course, 'course');
  }
});

// Call getAverageRating after remove
reviewSchema.post('remove', function() {
  if (this.college) {
    this.constructor.getAverageRating(this.college, 'college');
  }
  if (this.course) {
    this.constructor.getAverageRating(this.course, 'course');
  }
});

module.exports = mongoose.model('Review', reviewSchema); 