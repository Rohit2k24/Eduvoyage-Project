const express = require('express');
const router = express.Router();
const { sendVerificationCode, verifyAndRegister, login, forgotPassword, resetPassword } = require('../controllers/authController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const User = require('../models/User');
const College = require('../models/College');
const jwt = require('jsonwebtoken');

router.post('/send-verification', sendVerificationCode);
router.post('/verify-and-register', verifyAndRegister);
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');

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

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userId: user.user
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.post('/register', upload.fields([
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'accreditationCertificate', maxCount: 1 },
  { name: 'collegeLogo', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Registration request received:', {
      body: req.body,
      files: req.files
    });

    // Handle file uploads
    const documents = {};
    if (req.files) {
      if (req.files.registrationCertificate) {
        documents.registrationCertificate = req.files.registrationCertificate[0].path;
      }
      if (req.files.accreditationCertificate) {
        documents.accreditationCertificate = req.files.accreditationCertificate[0].path;
      }
      if (req.files.collegeLogo) {
        documents.collegeLogo = req.files.collegeLogo[0].path;
      }
    }

    // Create user based on role
    const userData = {
      ...req.body,
      documents
    };

    // Save to database
    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

module.exports = router; 