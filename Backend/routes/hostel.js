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
  getHostelsByCollege,
  applyForHostel,
  getStudentHostelApplications,
  updateHostelPayment,
  cancelHostelApplication,
  createPaymentOrder,
  verifyPayment,
  validateStudentEligibility
} = require('../controllers/hostelController');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Student hostel application routes
router.route('/student/applications')
  .get(protect, authorize('student'), getStudentHostelApplications);

// Validate student eligibility before applying
router.route('/validate-eligibility/:collegeId')
  .get(protect, authorize('student'), validateStudentEligibility);

// Apply for hostel and create payment
router.route('/apply')
  .post(protect, authorize('student'), applyForHostel);

// Payment routes
router.route('/applications/:id/create-payment')
  .post(protect, authorize('student'), createPaymentOrder);

router.route('/applications/:id/verify-payment')
  .post(protect, authorize('student'), verifyPayment);

// Cancel application
router.route('/applications/:id/cancel')
  .put(protect, authorize('student'), cancelHostelApplication);

// Get hostel applications (for college admin)
router.route('/applications')
  .get(protect, authorize('college'), getHostelApplications);

// Get hostels by college ID
router.route('/college/:collegeId')
  .get(protect, getHostelsByCollege);

// Hostel management routes
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

module.exports = router; 