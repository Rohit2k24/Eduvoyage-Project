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
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Please specify gender']
  },
  phone: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  country: {
    type: String
  },
  education: {
    qualifications: [{
      level: String,
      qualification: String,
      institute: String,
      board: String,
      yearOfCompletion: Number,
      percentage: String,
      documents: String
    }],
    highestQualification: String
  },
  passport: {
    number: String,
    document: String,
    expiryDate: Date,
    verified: {
      type: Boolean,
      default: false
    }
  },
  address: String,
  profilePic: String,
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

// Add a pre-save middleware to sync email with User model
StudentSchema.pre('save', async function(next) {
  if (this.isModified('email')) {
    try {
      await mongoose.model('User').findByIdAndUpdate(this.user, {
        email: this.email
      });
    } catch (error) {
      console.error('Error syncing email:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Student', StudentSchema); 