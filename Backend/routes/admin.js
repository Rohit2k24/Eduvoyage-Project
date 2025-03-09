const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllColleges,
  updateCollegeStatus,
  updateCollege,
  getCollegeDetails,
  getStudents,
  updateStudent,
  toggleStudentStatus,
  deactivateStudent,
  getDashboardStats
} = require('../controllers/adminController');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard route
router.get('/dashboard-stats', getDashboardStats);

// College management routes
router.get('/colleges', getAllColleges);
router.get('/colleges/:id', getCollegeDetails);
router.put('/colleges/:id', updateCollege);
router.put('/colleges/:id/status', updateCollegeStatus);

// Student management routes
router.get('/students', getStudents);
router.put('/students/:id', updateStudent);
router.put('/students/:id/toggle-status', toggleStudentStatus);
router.put('/students/:id/deactivate', deactivateStudent);

module.exports = router;