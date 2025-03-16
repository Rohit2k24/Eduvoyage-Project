const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  
  },
  name: {
    type: String
  },
  description: {
    type: String,
  
  },
  website: {
    type: String,

  },
  location: {
    type: String,
   
  },
  registrationNumber: {
    type: String,
   
  },
  address: {
    type: String,

  },
  contactEmail: {
    type: String,
  
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Basic phone number validation
        return /^\+?[\d\s-]{8,}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  facilities: [{
    type: String
  }],
  courses: String,
  country: {
    type: String,
  },
  university: {
    type: String,

  },
  accreditation: {
    type: String
  },
  establishmentYear: {
    type: Number
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  documents: {
    registrationCertificate: {
      type: String,
      default: null
    },
    accreditationCertificate: {
      type: String,
      default: null
    },
    collegeLogo: {
      type: String,
      default: null
    },
    collegeImages: [{
      type: String
    }]
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  subscriptionEndDate: {
    type: Date
  },
  rejectionReason: String,
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    application: {
      type: Boolean,
      default: true
    },
    payment: {
      type: Boolean,
      default: true
    }
  },
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster queries
collegeSchema.index({ user: 1 });

// Virtual populate with reviews
collegeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'college',
  justOne: false,
  match: { status: 'approved' }
});

module.exports = mongoose.model('College', collegeSchema); 