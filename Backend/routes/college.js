const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getCollegeCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourse
} = require('../controllers/courseController');
const { submitVerification, getVerificationStatus, initiatePayment, verifyPayment, getDashboardStats } = require('../controllers/collegeController');

// Configure multer for verification uploads
const verificationFields = [
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'accreditationCertificate', maxCount: 1 },
  { name: 'collegeLogo', maxCount: 1 },
  { name: 'collegeImages', maxCount: 5 }
];

// College verification routes
router.post(
  '/submit-verification', 
  protect, 
  upload.fields(verificationFields), 
  submitVerification
);
router.get('/verification-status', protect, getVerificationStatus);
router.post('/initiate-payment', protect, initiatePayment);
router.post('/verify-payment', protect, verifyPayment);
router.get('/dashboard-stats', protect, getDashboardStats);

// Course routes
router.get('/courses', protect, getCollegeCourses);
router.post('/courses', protect, upload.single('image'), createCourse);
router.get('/courses/:id', protect, getCourse);
router.put('/courses/:id', protect, upload.single('image'), updateCourse);
router.delete('/courses/:id', protect, deleteCourse);

module.exports = router; 