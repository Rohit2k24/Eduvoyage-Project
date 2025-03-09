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
router.get('/college/:collegeId', getCollegeCourses); // This must come before /:id
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
