const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getDashboardStats, 
  getNotifications, 
  markNotificationAsRead,
  deleteNotification,
  getApplications,
  downloadReceipt,
  verifyPassport,
  initiateDigilocker,
  handleDigilockerCallback,
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getCourseDetails
} = require('../controllers/studentController');

const {
  submitApplication,
  getApplication,
  cancelApplication
} = require('../controllers/applicationController');

const { 
  getCoursesForStudent,
  getAllCoursesForStudent
} = require('../controllers/courseController');

const College = require('../models/College');
const Course = require('../models/Course');

console.log('Initializing student routes');

// Test route (no auth required)
router.get('/test', (req, res) => {
  console.log('Student test route hit');
  res.json({ message: 'Student routes are working' });
});

// Protected routes
router.get('/dashboard', protect, (req, res, next) => {
  console.log('Student dashboard route hit');
  getDashboardStats(req, res, next);
});

// Application routes
router.post('/applications', protect, submitApplication);
router.get('/applications', protect, getApplications);
router.get('/applications/:id', protect, getApplication);
router.delete('/applications/:id', protect, cancelApplication);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationAsRead);
router.delete('/notifications/:id', protect, deleteNotification);
router.get('/applications/:id/receipt', protect, downloadReceipt);

// Passport routes
router.post('/verify-passport', protect, verifyPassport);
router.get('/digilocker/init', protect, initiateDigilocker);
router.get('/digilocker/callback', protect, handleDigilockerCallback);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Settings routes
router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);

// Course routes for students
router.get('/courses', protect, getAllCoursesForStudent);
router.get('/courses/:id', protect, getCourseDetails);

// Add this debug route temporarily
router.get('/debug/college/:id', protect, async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    res.json({ success: true, college });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug route to check course and college data
router.get('/debug/course-details/:id', protect, async (req, res) => {
  try {
    // Check if course exists
    const courseExists = await Course.exists({ _id: req.params.id });
    if (!courseExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Fetch course with college
    const course = await Course.findById(req.params.id);
    
    // Check if college exists
    const collegeExists = await College.exists({ _id: course.college });
    
    // Get college details
    const college = await College.findById(course.college);

    res.json({
      success: true,
      debug: {
        courseId: req.params.id,
        courseExists,
        course,
        collegeId: course.college,
        collegeExists,
        college
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Debug route to fix course college reference
router.post('/debug/fix-course/:courseId', protect, async (req, res) => {
  try {
    // Get the first available college
    const college = await College.findOne();
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'No colleges found in the database'
      });
    }

    // Update the course with the college reference
    const course = await Course.findByIdAndUpdate(
      req.params.courseId,
      { college: college._id },
      { new: true }
    ).populate('college');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated with college reference',
      course
    });
  } catch (error) {
    console.error('Fix course error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Log registered routes
console.log('Student Routes:');
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    const methods = Object.keys(r.route.methods);
    console.log(`${methods.join(',').toUpperCase()} ${r.route.path}`);
  }
});

module.exports = router; 