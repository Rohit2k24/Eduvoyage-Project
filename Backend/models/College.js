const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
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
  website: String,
  address: String,
  contactPerson: String,
  phoneNumber: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('College', collegeSchema); 