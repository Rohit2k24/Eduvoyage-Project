const mongoose = require('mongoose');

const jobListingSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Part-Time', 'Casual', 'Flexible'],
    required: true
  },
  salary: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    period: {
      type: String,
      enum: ['Hour', 'Week', 'Month'],
      required: true
    }
  },
  description: {
    type: String,
    required: true
  },
  requirements: [{
    type: String
  }],
  benefits: [{
    type: String
  }],
  workingHours: {
    min: Number,
    max: Number
  },
  studentFriendly: {
    type: Boolean,
    default: true
  },
  applicationLink: String,
  postedDate: {
    type: Date,
    default: Date.now
  }
});

jobListingSchema.index({ country: 1, type: 1 });
jobListingSchema.index({ postedDate: -1 });

const JobListing = mongoose.model('JobListing', jobListingSchema);

module.exports = JobListing; 