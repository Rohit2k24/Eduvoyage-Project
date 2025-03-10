const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');
const student = require('../models/Student');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const crypto = require('crypto');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Store verification codes temporarily (in production, use Redis or similar)
const verificationCodes = new Map();

exports.register = async (req, res) => {
  try {
    const { email, password, role, ...profileData } = req.body;

    // Create user
    const user = await User.create({
      email,
      password,
      role
    });

    // Create profile based on role
    if (role === 'student') {
      await Student.create({
        user: user._id,
        name: profileData.name,
        dateOfBirth: profileData.dateOfBirth,
        nationality: profileData.nationality
      });
    } else if (role === 'college') {
      await College.create({
        user: user._id,
        ...profileData
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      role: user.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Send response with user details
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('Starting verification process for:', email);

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated verification code:', verificationCode);

    // Store code with timestamp
    verificationCodes.set(email, {
      code: verificationCode,
      timestamp: Date.now(),
      attempts: 0
    });

    try {
      console.log('Attempting to send email...');
      await sendVerificationEmail(email, verificationCode);
      console.log('Email sent successfully');

      res.status(200).json({
        success: true,
        message: 'Verification code sent successfully'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);

      // Delete the stored code if email fails
      verificationCodes.delete(email);

      res.status(500).json({
        success: false,
        message: emailError.message
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.verifyAndRegister = async (req, res) => {
  try {
    const { email, verificationCode, ...userData } = req.body;
    console.log("🚀 ~ exports.verifyAndRegister= ~ email, verificationCode, ...userData :", userData)

    // Check if verification code exists and is valid
    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired or not found'
      });
    }

    // Check if code is expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Verification code expired'
      });
    }

    // Check if code matches
    if (storedData.code !== verificationCode) {
      storedData.attempts += 1;
      if (storedData.attempts >= 3) {
        verificationCodes.delete(email);
        return res.status(400).json({
          success: false,
          message: 'Too many incorrect attempts. Please request a new code.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Create user
    const user = await User.create({
      email,
      name: userData.name,
      password: userData.password,
      role: userData.role
    });

    // Create profile based on role
    if (userData.role === 'student') {
      await Student.create({
        user: user._id,
        name: userData.name,
        dateOfBirth: userData.dateOfBirth,
        country: userData.country
      });
    } else if (userData.role === 'college') {
      console.log(userData.name)
      // Create college profile with all required fields
      await College.create({
        user: user._id,
        name: userData.name,
        country: userData.country,
        university: userData.university === 'other' ? userData.customUniversity : userData.university,
        accreditation: userData.accreditation === 'other' ? userData.customAccreditation : userData.accreditation,
        // establishmentYear: parseInt(userData.establishmentYear),
        verificationStatus: 'pending',
        // Optional fields can be added later during verification
        description: '',
        address: '',
        contactEmail: email, // Use registration email as initial contact
        phoneNumber: '',
        facilities: '',
        courses: '',
        documents: {}
      });
    }

    // Clear verification code
    verificationCodes.delete(email);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      role: user.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Generate password reset token
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Received forgot password request for:', email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Save hashed token to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log('Reset URL:', resetUrl);

    try {
      // Send email
      await sendPasswordResetEmail(email, resetUrl);
      console.log('Password reset email sent successfully');

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to email'
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);

      // Reset the token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check if expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 