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
    required: true,
    enum: ['single', 'double', 'triple', 'dormitory']
  },
  status: {
    type: String,
    enum: ['pending', 'pending_payment', 'paid', 'cancelled'],
    default: 'pending_payment'
  },
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  payment: {
    orderId: String,
    transactionId: String,
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paidAt: Date,
    retryCount: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    failureReason: String
  },
  remarks: String
}, {
  timestamps: true
});

// Add middleware to sync application status with payment status
HostelApplicationSchema.pre('save', function(next) {
  // If payment status is modified or this is a new document
  if (this.isModified('payment.status') || this.isNew) {
    if (this.payment?.status === 'completed') {
      this.status = 'paid';
    } else if (this.payment?.status === 'failed') {
      if (this.status !== 'cancelled') {
        this.status = 'pending_payment';
      }
    } else if (this.payment?.status === 'pending') {
      if (this.status !== 'cancelled') {
        this.status = 'pending_payment';
      }
    }
  }

  // If application status is set to cancelled, ensure payment status is updated
  if (this.isModified('status') && this.status === 'cancelled') {
    if (this.payment && this.payment.status !== 'completed') {
      this.payment.status = 'failed';
      this.payment.failureReason = 'Application cancelled by user';
    }
  }

  next();
});

// Virtual for payment status
HostelApplicationSchema.virtual('paymentStatus').get(function() {
  if (this.status === 'cancelled') return 'cancelled';
  return this.payment ? this.payment.status : 'pending';
});

// Add indexes for better query performance
HostelApplicationSchema.index({ student: 1, college: 1, status: 1 });
HostelApplicationSchema.index({ applicationNumber: 1 }, { unique: true });
HostelApplicationSchema.index({ hostel: 1 });
HostelApplicationSchema.index({ 'payment.status': 1 });

module.exports = mongoose.model('HostelApplication', HostelApplicationSchema); 