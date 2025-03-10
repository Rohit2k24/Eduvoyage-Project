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
    type: Object
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
  }
}, {
  timestamps: true
});

// Add index for faster queries
collegeSchema.index({ user: 1 });

module.exports = mongoose.model('College', collegeSchema); 