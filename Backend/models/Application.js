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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  documents: [{
    type: String // paths to uploaded documents
  }],
  remarks: String,
}, {
  timestamps: true
});

// Pre-save middleware to generate application number
ApplicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    const count = await this.constructor.countDocuments();
    this.applicationNumber = `APP${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Add index for better query performance
ApplicationSchema.index({ student: 1, course: 1 }, { unique: true });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ applicationNumber: 1 });

module.exports = mongoose.model('Application', ApplicationSchema); 