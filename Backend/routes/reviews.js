const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
  markHelpful,
  reportReview,
  updateReviewStatus
} = require('../controllers/reviewController');
const Student = require('../models/Student');
const Review = require('../models/Review');

// Public routes
router.route('/')
  .get(getReviews)
  .post(protect, authorize('student'), upload.array('media', 5), addReview);

// Check if review belongs to current student
router.get('/:reviewId/ownership', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const review = await Review.findById(req.params.reviewId);
    console.log('Review ID:', req.params.reviewId);
    console.log('Student:', student._id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    console.log('Review student ID:', review.student);
    const isOwner = review.student.toString() === student._id.toString();
    console.log('Is owner:', isOwner);
    
    res.status(200).json({
      success: true,
      isOwner
    });
  } catch (error) {
    console.error('Error in ownership check:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking review ownership',
      error: error.message
    });
  }
});

// Protected routes for review management
router.route('/:id')
  .get(getReview)
  .put(protect, authorize('student'), upload.array('media', 5), updateReview)
  .delete(protect, authorize('student'), deleteReview);

// Interaction routes
router.route('/:id/helpful')
  .put(protect, markHelpful);

router.route('/:id/report')
  .post(protect, reportReview);

// College admin routes
router.route('/:id/status')
  .put(protect, authorize('college'), updateReviewStatus);

module.exports = router; 