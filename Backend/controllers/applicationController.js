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

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ErrorResponse('Course not found', 404));
    }

    // Check if student has already applied
    const existingApplication = await Application.findOne({
      student: req.user.id,
      course: courseId
    });

    if (existingApplication) {
      return next(new ErrorResponse('You have already applied for this course', 400));
    }

    // Create application
    const application = await Application.create({
      student: req.user.id,
      course: courseId,
      status: 'pending'
    });

    // Populate course details
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
    return next(new ErrorResponse('Error submitting application', 500));
  }
});

// @desc    Get all applications for a student
// @route   GET /api/student/applications
// @access  Private (Student only)
exports.getApplications = asyncHandler(async (req, res, next) => {
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
    count: applications.length,
    data: applications
  });
});

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