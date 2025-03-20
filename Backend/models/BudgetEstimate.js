const mongoose = require('mongoose');

const budgetEstimateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  country: {
    type: String,
    required: true
  },
  courseDuration: {
    type: Number,
    required: true
  },
  courseType: {
    type: String,
    required: true,
    enum: ['bachelors', 'masters', 'phd']
  },
  accommodationType: {
    type: String,
    required: true,
    enum: ['onCampus', 'offCampus', 'homestay']
  },
  lifestyle: {
    type: String,
    required: true,
    enum: ['budget', 'moderate', 'luxury']
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  estimates: {
    tuition: Number,
    accommodation: Number,
    livingExpenses: Number,
    travel: Number,
    miscellaneous: Number,
    total: Number
  },
  insights: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
budgetEstimateSchema.index({ userId: 1, createdAt: -1 });
budgetEstimateSchema.index({ country: 1, courseType: 1 });

const BudgetEstimate = mongoose.model('BudgetEstimate', budgetEstimateSchema);

module.exports = BudgetEstimate; 