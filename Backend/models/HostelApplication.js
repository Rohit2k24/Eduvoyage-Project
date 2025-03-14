const mongoose = require('mongoose');

const HostelApplicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  roomType: {
    type: String,
    enum: ['single', 'double', 'triple', 'dormitory'],
    required: true
  },
  preferredFloor: {
    type: String,
    enum: ['ground', 'first', 'second', 'third', 'any'],
    default: 'any'
  },
  duration: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waitlisted', 'cancelled'],
    default: 'pending'
  },
  payment: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date,
    refundedAt: Date
  },
  specialRequirements: String,
  medicalConditions: String,
  emergencyContact: {
    name: String,
    relation: String,
    phone: String,
    address: String
  },
  documents: {
    medicalCertificate: String,
    addressProof: String,
    parentId: String
  },
  remarks: String,
  applicationNumber: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Generate unique application number before saving
HostelApplicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    const count = await this.constructor.countDocuments();
    this.applicationNumber = `HA${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Add indexes for better query performance
HostelApplicationSchema.index({ student: 1, hostel: 1 });
HostelApplicationSchema.index({ college: 1, status: 1 });
HostelApplicationSchema.index({ applicationNumber: 1 });

module.exports = mongoose.model('HostelApplication', HostelApplicationSchema); 