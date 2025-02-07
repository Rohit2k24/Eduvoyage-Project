const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
    unique: true
  },
  documents: [{
    type: String // paths to uploaded documents
  }],
  remarks: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate application number before saving
ApplicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    const count = await this.constructor.countDocuments();
    this.applicationNumber = `APP${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

// Add indexes
ApplicationSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema); 