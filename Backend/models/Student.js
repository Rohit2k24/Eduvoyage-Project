const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  phone: String,
  education: {
    highestQualification: String,
    institute: String,
    yearOfCompletion: Number,
    percentage: String
  },
  passport: {
    number: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function(v) {
          // Passport number format: A1234567 (1 letter followed by 7 digits)
          return /^[A-Z][0-9]{7}$/.test(v);
        },
        message: props => `${props.value} is not a valid passport number! Format should be: A1234567`
      }
    },
    document: String, // URL to passport document
    verified: {
      type: Boolean,
      default: false
    },
    digilockerVerified: {
      type: Boolean,
      default: false
    },
    expiryDate: {
      type: Date,
      validate: {
        validator: function(v) {
          return v > new Date();
        },
        message: 'Passport must not be expired'
      }
    }
  },
  profileImage: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  settings: {
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
      courseRecommendations: { type: Boolean, default: true },
      deadlineReminders: { type: Boolean, default: true }
    },
    privacy: {
      showProfile: { type: Boolean, default: true },
      showEducation: { type: Boolean, default: true }
    }
  },
  accountActive: {
    type: Boolean,
    default: true
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', StudentSchema); 