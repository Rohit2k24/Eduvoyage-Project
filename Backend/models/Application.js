const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  payment: {
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    amount: Number,
    transactionId: String,
    orderId: String
  },
  applicationNumber: {
    type: String,
    unique: true
  },
  documents: [{
    type: String // paths to uploaded documents
  }],
  remarks: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to generate application number
ApplicationSchema.pre('save', async function(next) {
  try {
    if (!this.applicationNumber) {
      // Get the current year
      const year = new Date().getFullYear();
      
      // Find the latest application number for the current year
      const latestApp = await this.constructor.findOne({
        applicationNumber: new RegExp(`^APP${year}`)
      }).sort({ applicationNumber: -1 });

      let nextNumber = 1;
      if (latestApp && latestApp.applicationNumber) {
        // Extract the number from the latest application number and increment it
        const currentNumber = parseInt(latestApp.applicationNumber.replace(`APP${year}`, ''));
        nextNumber = currentNumber + 1;
      }

      // Generate the new application number
      this.applicationNumber = `APP${year}${nextNumber.toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add indexes for better performance
ApplicationSchema.index({ student: 1 });
ApplicationSchema.index({ course: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ college: 1 });

module.exports = mongoose.model('Application', ApplicationSchema); 