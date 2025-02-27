const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema first
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'college', 'admin'],
    required: true
  },
  phone: String,
  country: String,
  // College specific fields
  university: String,
  accreditation: String,
  establishmentYear: String,
  website: String,
  address: String,
  description: String,
  facilities: [String],
  documents: {
    registrationCertificate: String,
    accreditationCertificate: String,
    collegeLogo: String
  },
  // Student specific fields
  dateOfBirth: Date,
  // Common fields
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  profilePic: {
    type: String,
    default: ''
  }
});

// Add middleware to schema before creating model
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Add methods to schema
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create the model
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User; 