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
    required: true
  },
  registrationNumber: {
    type: String,
    sparse: true, // This allows multiple null values
    unique: true  // But ensures uniqueness when value exists
  },
  description: String,
  address: String,
  contactEmail: String,
  phoneNumber: String,
  facilities: String,
  courses: String,
  country: {
    type: String,
    required: true
  },
  university: {
    type: String,
    required: true
  },
  accreditation: {
    type: String,
    required: true
  },
  establishmentYear: {
    type: Number,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  documents: {
    registrationCertificate: String,
    accreditationCertificate: String,
    collegeLogo: String,
    collegeImages: [String]
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  subscriptionEndDate: {
    type: Date
  },
  rejectionReason: String
}, {
  timestamps: true
});

// Add index for faster queries
collegeSchema.index({ user: 1 });

module.exports = mongoose.model('College', collegeSchema); 