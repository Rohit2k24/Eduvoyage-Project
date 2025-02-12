const Application = require('../models/Application');
const Course = require('../models/Course');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Submit new application
// @route   POST /api/student/applications
// @access  Private (Student only)
exports.submitApplication = asyncHandler(async (req, res, next) => {
  try {
    console.log('Submitting application - Request body:', req.body);
    console.log('User:', req.user);
    
    const { courseId } = req.body;

    if (!courseId) {
      return next(new ErrorResponse('Course ID is required', 400));
    }

    // Check if course exists and populate all necessary fields
    const course = await Course.findById(courseId)
      .populate('college', 'name');

    if (!course) {
      return next(new ErrorResponse('Course not found', 404));
    }

    // Check if student has already applied
    const existingApplication = await Application.findOne({
      student: req.user.id,
      course: courseId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this course',
        application: existingApplication
      });
    }

    // Check if seats are available
    if (course.seats.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No seats available for this course'
      });
    }

    // Create application first
    const application = await Application.create({
      student: req.user.id,
      course: courseId,
      status: 'pending'
    });

    // Update course seats in a separate operation
    await Course.findByIdAndUpdate(courseId, {
      $inc: { 'seats.available': -1 }
    }, { 
      new: true,
      runValidators: true
    });

    // Populate application details for response
    await application.populate({
      path: 'course',
      select: 'name college',
      populate: {
        path: 'college',
        select: 'name'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Submit application error:', error);
    
    // If it's a validation error, send a more specific message
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course data',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    return next(new ErrorResponse('Error submitting application', 500));
  }
});

// @desc    Get all applications for a student
// @route   GET /api/student/applications
// @access  Private (Student only)
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate({
        path: 'course',
        select: 'name college',
        populate: {
          path: 'college',
          select: 'name'
        }
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: applications // Make sure this is an array, even if empty
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
};

// @desc    Get single application
// @route   GET /api/student/applications/:id
// @access  Private (Student only)
exports.getApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findOne({
    _id: req.params.id,
    student: req.user.id
  }).populate({
    path: 'course',
    select: 'name college',
    populate: {
      path: 'college',
      select: 'name'
    }
  });

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  res.status(200).json({
    success: true,
    data: application
  });
});

// @desc    Cancel application
// @route   DELETE /api/student/applications/:id
// @access  Private (Student only)
exports.cancelApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findOne({
    _id: req.params.id,
    student: req.user.id
  });

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  if (application.status !== 'pending') {
    return next(new ErrorResponse('Cannot cancel processed application', 400));
  }

  await application.remove();

  res.status(200).json({
    success: true,
    message: 'Application cancelled successfully'
  });
}); 