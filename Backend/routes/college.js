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

// Course routes with proper middleware
router.route('/courses')
  .get(async (req, res) => {
    try {
      const college = await College.findOne({ user: req.user.id });
      if (!college) {
        return res.status(404).json({
          success: false,
          message: 'College not found'
        });
      }

      const courses = await Course.find({ 
        college: college._id,
        status: 'active'
      })
      .select('name description duration fees image startDate applicationDeadline seats eligibilityCriteria')
      .sort('-createdAt');

      res.status(200).json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Error in /courses route:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching courses'
      });
    }
  })
  .post(upload.single('image'), createCourse);

router.route('/courses/:id')
  .get(getCourse)
  .put(upload.single('image'), updateCourse)
  .delete(deleteCourse);

// Application routes
router.get('/applications', async (req, res) => {
  try {
    // First find the college
    const college = await College.findOne({ user: req.user.id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    console.log('Found college:', college._id);

    // Find all courses belonging to this college
    const courses = await Course.find({ college: college._id });
    console.log('Found courses:', courses.map(c => c._id));

    // Get all applications for these courses with complete student details
    const applications = await Application.find({
      course: { $in: courses.map(c => c._id) }
    })
    .populate({
      path: 'student',
      select: 'name email gender phone dateOfBirth education address profilePic',
      populate: {
        path: 'user',
        select: 'email'
      }
    })
    .populate({
      path: 'course',
      select: 'name description duration fees eligibilityCriteria'
    })
    .sort('-createdAt');

    console.log(`Found ${applications.length} applications`);

    // Process applications to ensure all required data is present
    const processedApplications = applications.map(app => ({
      _id: app._id,
      applicationNumber: app.applicationNumber,
      status: app.status,
      createdAt: app.createdAt,
      remarks: app.remarks || '',
      student: {
        _id: app.student?._id,
        name: app.student?.name || 'N/A',
        email: app.student?.user?.email || 'N/A',
        phone: app.student?.phone || 'N/A',
        gender: app.student?.gender || 'N/A',
        dateOfBirth: app.student?.dateOfBirth,
        education: app.student?.education || { qualifications: [] },
        address: app.student?.address || 'N/A',
        profilePic: app.student?.profilePic
      },
      course: {
        _id: app.course?._id,
        name: app.course?.name || 'N/A',
        description: app.course?.description || 'N/A',
        duration: app.course?.duration,
        fees: app.course?.fees,
        eligibilityCriteria: app.course?.eligibilityCriteria || []
      }
    }));

    res.status(200).json({
      success: true,
      count: processedApplications.length,
      applications: processedApplications
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

router.put('/applications/:id/status', updateApplicationStatus);

// Notification routes
router.get('/notifications', getCollegeNotifications);
router.put('/notifications/:id/read', markAsRead);
router.put('/notifications/read-all', markAllAsRead);
router.delete('/notifications/:id', deleteNotification);

// Settings routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Get college status (verification and payment)
router.get('/status', async (req, res) => {
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
      status: {
        verificationStatus: college.verificationStatus,
        paymentStatus: college.paymentStatus,
        rejectionReason: college.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error fetching college status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching college status'
    });
  }
});

module.exports = router; 