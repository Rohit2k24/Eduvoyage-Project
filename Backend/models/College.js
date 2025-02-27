const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensure one college per user
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  website: {
    type: String,
    
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  registrationNumber: {
    type: String,
    sparse: true, // This allows multiple null values
    unique: true  // But ensures uniqueness when value exists
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  contactEmail: {
    type: String,
    required: [true, 'Please add a contact email']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  facilities: [{
    type: String
  }],
  courses: String,
  country: {
    type: String,
    required: true
  },
  university: {
    type: String,
    required: [true, 'Please add a university name']
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