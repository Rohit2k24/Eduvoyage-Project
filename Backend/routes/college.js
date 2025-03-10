const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getCollegeCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourse
} = require('../controllers/courseController');
const { submitVerification, getVerificationStatus, initiatePayment, verifyPayment, getDashboardStats, getApplications, updateApplicationStatus } = require('../controllers/collegeController');
const Course = require('../models/Course');
const Application = require('../models/Application');
const User = require('../models/User');
const {
  getCollegeNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const {
  getSettings,
  updateSettings
} = require('../controllers/settingsController');
const College = require('../models/College');

// Configure multer for verification uploads
const verificationFields = [
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'accreditationCertificate', maxCount: 1 },
  { name: 'collegeLogo', maxCount: 1 },
  { name: 'collegeImages', maxCount: 5 }
];

// Protect all routes
router.use(protect);
router.use(authorize('college'));

// Get college details
router.get('/details', async (req, res) => {
  try {
    const college = await College.findOne({ user: req.user.id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }
    res.json({
      success: true,
      college
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching college details'
    });
  }
});

// Dashboard stats route
router.get('/dashboard-stats', async (req, res) => {
  try {
    const collegeId = req.user.id;

    // Get total courses for this college
    const totalCourses = await Course.countDocuments({
      college: collegeId,
      status: 'active' // Only count active courses
    });

    // Get total enrolled students (accepted applications)
    const totalStudents = await Application.aggregate([
      {
        $match: {
          college: collegeId,
          status: 'accepted'
        }
      },
      {
        $group: {
          _id: '$student', // Group by student to avoid counting duplicates
          count: { $first: 1 }
        }
      },
      {
        $count: 'total'
      }
    ]);

    // Get pending applications count
    const pendingApplications = await Application.countDocuments({
      college: collegeId,
      status: 'pending'
    });

    // Get recent applications with populated data
    const recentApplications = await Application.find({
      college: collegeId
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('student', 'name email')
    .populate('course', 'name')
    .lean(); // Use lean() for better performance

    // Calculate monthly growth (example: based on applications in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyApplications = await Application.countDocuments({
      college: collegeId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    const monthlyGrowthRate = monthlyApplications > 0 
      ? ((monthlyApplications / (totalStudents[0]?.total || 1)) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalCourses,
        totalStudents: totalStudents[0]?.total || 0,
        pendingApplications,
        recentApplications,
        monthlyGrowthRate
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// College verification routes
router.post('/submit-verification', upload.fields(verificationFields), submitVerification);
router.get('/verification-status', getVerificationStatus);
router.post('/initiate-payment', initiatePayment);
router.post('/verify-payment', verifyPayment);

// Course routes
router.route('/courses')
  .get(getCollegeCourses)
  .post(upload.single('image'), createCourse);

router.route('/courses/:id')
  .get(getCourse)
  .put(upload.single('image'), updateCourse)
  .delete(deleteCourse);

// Application routes
router.get('/applications', getApplications);
router.put('/applications/:id/status', updateApplicationStatus);

// Notification routes
router.get('/notifications', getCollegeNotifications);
router.put('/notifications/:id/read', markAsRead);
router.put('/notifications/read-all', markAllAsRead);
router.delete('/notifications/:id', deleteNotification);

// Settings routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router; 