const User = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/emailService');

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

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      role: user.role
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Login failed'
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

    // Code is valid, proceed with registration
    const user = await User.create({
      email,
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
      await College.create({
        user: user._id,
        name: userData.name,
        country: userData.country,
        university: userData.university === 'other' ? userData.customUniversity : userData.university,
        accreditation: userData.accreditation === 'other' ? userData.customAccreditation : userData.accreditation,
        establishmentYear: userData.establishmentYear,
        website: userData.website,
        address: userData.address,
        contactPerson: userData.contactPerson,
        phoneNumber: userData.phoneNumber
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