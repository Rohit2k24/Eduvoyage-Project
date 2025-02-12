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
  updateSettings
} = require('../controllers/studentController');

const {
  submitApplication,
  getApplication,
  cancelApplication
} = require('../controllers/applicationController');

const { 
  getCoursesForStudent,
  getCourseDetailsForStudent,
  getAllCoursesForStudent
} = require('../controllers/courseController');

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
router.get('/courses/:id', protect, getCourseDetailsForStudent);

// Log registered routes
console.log('Student Routes:');
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    const methods = Object.keys(r.route.methods);
    console.log(`${methods.join(',').toUpperCase()} ${r.route.path}`);
  }
});

module.exports = router; 