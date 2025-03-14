const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getHostels,
  getHostel,
  createHostel,
  updateHostel,
  deleteHostel,
  getHostelApplications,
  updateHostelApplication,
  addHostelReview,
  getHostelsByCollege,
  applyForHostel,
  getStudentHostelApplications,
  updateHostelPayment,
  cancelHostelApplication,
  createApplication,
  getStudentApplications,
  getApplicationById,
  updateApplicationStatus,
  cancelApplication,
  createPaymentOrder,
  verifyPayment
} = require('../controllers/hostelController');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Student hostel application routes
router.route('/student/applications')
  .get(protect, authorize('student'), getStudentHostelApplications);

router.route('/applications/:id/payment')
  .put(protect, authorize('student'), updateHostelPayment);

router.route('/applications/:id/cancel')
  .put(protect, authorize('student'), cancelHostelApplication);

// Hostel application routes - Place these BEFORE the :id routes
router.route('/applications')
  .get(protect, authorize('college'), getHostelApplications);

router.route('/applications/:id')
  .put(protect, authorize('college'), updateHostelApplication);

// Get hostels by college ID
router.route('/college/:collegeId')
  .get(protect, getHostelsByCollege);

// Apply for hostel
router.route('/apply')
  .post(protect, authorize('student'), applyForHostel);

// Hostel routes
router.route('/')
  .get(protect, getHostels)
  .post(
    protect,
    authorize('college'),
    upload.fields([
      { name: 'images', maxCount: 10 },
      { name: 'roomTypeImages_0', maxCount: 5 },
      { name: 'roomTypeImages_1', maxCount: 5 },
      { name: 'roomTypeImages_2', maxCount: 5 },
      { name: 'roomTypeImages_3', maxCount: 5 }
    ]),
    createHostel
  );

router.route('/:id')
  .get(protect, getHostel)
  .put(
    protect,
    authorize('college'),
    upload.fields([{ name: 'images', maxCount: 10 }]),
    updateHostel
  )
  .delete(protect, authorize('college'), deleteHostel);

// Hostel review routes
router.route('/:id/reviews')
  .post(protect, authorize('student'), addHostelReview);

// Payment routes
router.route('/applications/:id/create-payment')
  .post(protect, authorize('student'), createPaymentOrder);

router.route('/applications/:id/verify-payment')
  .post(protect, authorize('student'), verifyPayment);

module.exports = router; 