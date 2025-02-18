const Application = require('../models/Application');
const Course = require('../models/Course');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Notification = require('../models/Notification');

// @desc    Submit new application
// @route   POST /api/student/applications
// @access  Private (Student only)
exports.submitApplication = asyncHandler(async (req, res, next) => {
  try {
    console.log('Submitting application - Request body:', req.body);
    const { courseId } = req.body;

    if (!courseId) {
      return next(new ErrorResponse('Course ID is required', 400));
    }

    // Check if course exists and has available seats
    const course = await Course.findById(courseId)
      .populate('college', 'name');

    if (!course) {
      return next(new ErrorResponse('Course not found', 404));
    }

    // Check if student has already applied
    const existingApplication = await Application.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this course'
      });
    }

    // Check if seats are available
    if (course.seats.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No seats available for this course'
      });
    }

    // Create application
    const application = new Application({
      student: req.user._id,
      course: courseId,
      status: 'pending'
    });

    // Save the application
    await application.save();

    // Update course seats
    await Course.findByIdAndUpdate(courseId, {
      $inc: { 'seats.available': -1 }
    }, { 
      new: true,
      runValidators: true
    });

    // Try to create notification, but don't fail if it errors
    try {
      await Notification.create({
        user: req.user._id,
        title: 'Application Submitted',
        message: `Your application for ${course.name} has been submitted successfully. Application number: ${application.applicationNumber}`,
        type: 'application_submitted'
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue execution even if notification creation fails
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        courseName: course.name,
        collegeName: course.college.name,
        status: application.status
      }
    });
  } catch (error) {
    console.error('Submit application error:', error);
    
    // Check if application was created despite the error
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this course'
      });
    }

    // If application was created but there was an error in subsequent operations
    try {
      const application = await Application.findOne({
        student: req.user._id,
        course: req.body.courseId
      });

      if (application) {
        // Return success even if notification creation failed
        return res.status(201).json({
          success: true,
          message: 'Application submitted successfully',
          data: {
            applicationId: application._id,
            applicationNumber: application.applicationNumber,
            courseName: course.name,
            collegeName: course.college.name,
            status: application.status
          }
        });
      }
    } catch (findError) {
      console.error('Error finding application:', findError);
    }

    next(new ErrorResponse('Error submitting application', 500));
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
// @access  Private
exports.cancelApplication = asyncHandler(async (req, res, next) => {
  try {
    console.log('Cancelling application:', req.params.id);
    console.log('Student ID:', req.user._id);

    // Find application with both ID and student ID to ensure ownership
    const application = await Application.findOne({
      _id: req.params.id,
      student: req.user._id
    }).populate('course', 'name seats');

    console.log('Found application:', application);

    if (!application) {
      return next(new ErrorResponse('Application not found or not authorized', 404));
    }

    // Check if application is already processed
    if (application.status !== 'pending') {
      return next(new ErrorResponse('Cannot cancel a processed application', 400));
    }

    // Get course details before deleting application
    const courseName = application.course.name;

    // Use deleteOne instead of remove
    const deleteResult = await Application.deleteOne({ 
      _id: application._id,
      student: req.user._id 
    });

    console.log('Delete result:', deleteResult);

    if (deleteResult.deletedCount === 0) {
      return next(new ErrorResponse('Failed to delete application', 500));
    }

    // Update course available seats
    await Course.findByIdAndUpdate(
      application.course._id,
      { $inc: { 'seats.available': 1 } },
      { new: true }
    );

    // Create notification for cancellation
    await Notification.create({
      user: req.user._id,
      title: 'Application Cancelled',
      message: `Your application for ${courseName} has been cancelled.`,
      type: 'application_cancelled'
    });

    res.status(200).json({
      success: true,
      message: 'Application cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling application:', error);
    next(new ErrorResponse(error.message || 'Error cancelling application', 500));
  }
}); 