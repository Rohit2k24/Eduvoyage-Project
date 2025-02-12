const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');
const { 
  getDashboardStats, 
  getAllColleges,
  approveCollege,
  rejectCollege,
  getStudents,
  updateStudent,
  deactivateStudent,
  toggleStudentStatus
} = require('../controllers/adminController');

router.get('/dashboard', protect, isAdmin, getDashboardStats);
router.get('/colleges', protect, isAdmin, getAllColleges);
router.post('/colleges/:id/approve', protect, isAdmin, approveCollege);
router.post('/colleges/:id/reject', protect, isAdmin, rejectCollege);

router.get('/students', protect, isAdmin, getStudents);
router.put('/students/:id', protect, isAdmin, updateStudent);
router.put('/students/:id/toggle-status', protect, isAdmin, toggleStudentStatus);

module.exports = router; 