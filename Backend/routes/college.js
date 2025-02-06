const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitVerification, getVerificationStatus, initiatePayment, verifyPayment } = require('../controllers/collegeController');
const upload = require('../middleware/upload');

// Configure multer for file uploads
const uploadFields = [
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'accreditationCertificate', maxCount: 1 },
  { name: 'collegeLogo', maxCount: 1 },
  { name: 'collegeImages', maxCount: 5 }
];

router.post('/submit-verification', protect, upload.fields(uploadFields), submitVerification);
router.get('/verification-status', protect, getVerificationStatus);
router.post('/initiate-payment', protect, initiatePayment);
router.post('/verify-payment', protect, verifyPayment);

module.exports = router; 