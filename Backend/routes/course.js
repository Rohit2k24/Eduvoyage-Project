const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createCourse,
  updateCourse,
  deleteCourse,
  getCourses,
  getCourse,
  getCollegeCourses
} = require('../controllers/courseController');
const College = require('../models/College');
const Course = require('../models/Course');

// Debug logging middleware
router.use((req, res, next) => {
  console.log('Course Route Hit:', {
    method: req.method,
    url: req.url,
    body: req.body,
    files: req.files || req.file,
    headers: req.headers
  });
  next();
});

// Public routes - Order matters!
router.get('/college/:collegeId', async (req, res) => {
  try {
    const { collegeId } = req.params;
    console.log('Fetching college details for ID:', collegeId);

    // Validate collegeId format
    if (!collegeId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid college ID format'
      });
    }

    // First, find the college
    const college = await College.findById(collegeId)
      .select('name location university description facilities address phoneNumber contactEmail accreditation establishmentYear documents');

    if (!college) {
      console.log('College not found for ID:', collegeId);
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    console.log('Found college:', college.name);

    // Then find all active courses for this college
    const courses = await Course.find({
      college: collegeId,
      status: 'active'
    }).select('name description duration fees image startDate applicationDeadline seats eligibilityCriteria');

    console.log(`Found ${courses.length} courses for college:`, college.name);

    res.status(200).json({
      success: true,
      college,
      courses
    });
  } catch (error) {
    console.error('Error in getCollegeCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching college details',
      error: error.message
    });
  }
}); // This must come before /:id
router.get('/', getCourses);
router.get('/:id', getCourse);

// Protected routes
router.post('/', protect, upload.single('image'), createCourse);
router.put('/:id', protect, upload.single('image'), updateCourse);
router.delete('/:id', protect, deleteCourse);

// Error handler
router.use((error, req, res, next) => {
  console.error('Course Route Error:', error);
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }
  next(error);
});

module.exports = router;
