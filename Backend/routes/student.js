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
  getCourseDetails,
  getColleges,
  getCollegeDetails
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
const Student = require('../models/Student');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

const { 
  createPayment, 
  verifyPayment, 
  generateReceipt 
} = require('../controllers/paymentController');

const upload = require('../middleware/upload');
const fs = require('fs');

console.log('Initializing student routes');

// Add this at the top of the file to see all incoming requests
router.use((req, res, next) => {
  console.log('Student route accessed:', req.method, req.url);
  next();
});

// Add debugging middleware for student routes
router.use((req, res, next) => {
  console.log('Student route accessed:', {
    method: req.method,
    path: req.url,
    user: req.user?._id
  });
  next();
});

// Test route (no auth required)
router.get('/test', (req, res) => {
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
router.get('/profile', protect, async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user._id);
    
    let student = await Student.findOne({ user: req.user._id })
      .populate('user', 'email name phone');

    if (!student) {
      // Create new student profile if it doesn't exist
      const user = await User.findById(req.user._id);
      student = await Student.create({
        user: req.user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        dateOfBirth: new Date(),
        country: 'Not specified',
        education: {
          qualifications: [],
          highestQualification: ''
        },
        passport: {},
        profilePic: user.profilePic || ''
      });
    }

    // Ensure email is synced between User and Student
    if (student.email !== student.user.email) {
      student.email = student.user.email;
      await student.save();
    }

    console.log('Sending profile:', student);
    res.status(200).json({
      success: true,
      profile: {
        ...student.toObject(),
        email: student.user.email
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

router.put('/profile', protect, upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'passportDocument', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 },
  { name: 'educationDocuments', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log('Updating profile with files:', req.files);
    const updateData = JSON.parse(req.body.data || '{}');
    const studentUpdateData = { ...updateData };

    // Handle file uploads
    if (req.files) {
      // Handle profile picture
      if (req.files.profilePic) {
        const result = await cloudinary.uploader.upload(req.files.profilePic[0].path, {
          folder: 'student_profiles'
        });
        studentUpdateData.profilePic = result.secure_url;
      }

      // Handle passport document
      if (req.files.passportDocument) {
        const result = await cloudinary.uploader.upload(req.files.passportDocument[0].path, {
          folder: 'passport_documents'
        });
        if (!studentUpdateData.passport) studentUpdateData.passport = {};
        studentUpdateData.passport.document = result.secure_url;
      }

      // Handle bank statement
      if (req.files.bankStatement) {
        const result = await cloudinary.uploader.upload(req.files.bankStatement[0].path, {
          folder: 'bank_statements'
        });
        studentUpdateData.bankStatement = {
          document: result.secure_url,
          uploadDate: new Date()
        };
      }

      // Handle education documents
      if (req.files.educationDocuments) {
        const uploadPromises = req.files.educationDocuments.map(file => 
          cloudinary.uploader.upload(file.path, {
            folder: 'education_documents'
          })
        );
        const results = await Promise.all(uploadPromises);
        
        if (studentUpdateData.education && studentUpdateData.education.qualifications) {
          results.forEach((result, index) => {
            if (studentUpdateData.education.qualifications[index]) {
              studentUpdateData.education.qualifications[index].documents = result.secure_url;
            }
          });
        }
      }
    }

    // Update both User and Student models
    const [user, student] = await Promise.all([
      User.findByIdAndUpdate(
        req.user._id,
        {
          name: updateData.name,
          email: updateData.email,
          phone: updateData.phone
        },
        { new: true }
      ),
      Student.findOneAndUpdate(
        { user: req.user._id },
        studentUpdateData,
        { 
          new: true, 
          runValidators: true,
          context: 'query'
        }
      ).populate('user', 'email name phone')
    ]);

    // Clean up uploaded files
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        ...student.toObject(),
        email: user.email,
        gender: student.gender
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
});

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

// Payment routes
router.post('/create-payment', protect, createPayment);
router.post('/verify-payment', protect, verifyPayment);
router.get('/payment-receipt/:id', protect, generateReceipt);

// Add these new routes
router.get('/colleges', protect, getColleges);
router.get('/colleges/:id', protect, async (req, res) => {
  try {
    const college = await College.findById(req.params.id)
      .select('name location university description facilities address phoneNumber contactEmail accreditation establishmentYear documents');

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    const courses = await Course.find({
      college: college._id,
      status: 'active'
    }).select('name duration seats fees');

    res.status(200).json({
      success: true,
      college,
      courses
    });
  } catch (error) {
    console.error('Error fetching college details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching college details'
    });
  }
});

// Add this route to fix course-college association before application
router.post('/check-course/:courseId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('college', 'name _id');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.college) {
      const college = await College.findOne();
      if (college) {
        course.college = college._id;
        await course.save();
        await course.populate('college', 'name _id');
      }
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Check course error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking course'
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