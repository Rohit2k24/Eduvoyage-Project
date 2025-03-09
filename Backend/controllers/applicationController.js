const Application = require('../models/Application');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const College = require('../models/College');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.submitApplication = asyncHandler(async (req, res) => {
  try {
    console.log('Submitting application - Request body:', req.body);
    const { courseId } = req.body;

    // Find course and populate college details
    let course = await Course.findById(courseId)
      .populate('college', 'name _id');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // If course has no college, try to find and associate one
    if (!course.college) {
      const college = await College.findOne();
      if (!college) {
        return res.status(400).json({
          success: false,
          message: 'No colleges available in the system'
        });
      }

      course.college = college._id;
      await course.save();
      await course.populate('college', 'name _id');
    }

    // Find student
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Check for existing application
    const existingApplication = await Application.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this course'
      });
    }

    // Create application
    const application = await Application.create({
      student: req.user._id,
      course: courseId,
      college: course.college._id,
      status: 'pending',
      applicationData: {
        studentName: student.name || student.user.name,
        studentEmail: student.email || student.user.email,
        courseName: course.name,
        collegeName: course.college.name
      }
    });

    // Create notification
    await Notification.create({
      user: course.college._id,
      userModel: 'College',
      title: 'New Application',
      message: `New application received for ${course.name}`,
      type: 'application',
      data: {
        applicationId: application._id,
        courseName: course.name,
        studentName: student.name || student.user.name
      }
    });

    res.status(201).json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting application'
    });
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
    try {
      await Notification.create({
        user: req.user._id,
        userModel: 'Student',
        title: 'Application Cancelled',
        message: `Your application for ${courseName} has been cancelled.`,
        type: 'system',
        data: {
          courseId: application.course._id,
          courseName: courseName,
          applicationId: application._id
        }
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the cancellation if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Application cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling application:', error);
    next(new ErrorResponse(error.message || 'Error cancelling application', 500));
  }
});

// Add this to your application submission handler
const createNotification = async (collegeId, application) => {
  await Notification.create({
    college: collegeId,
    type: 'application',
    title: 'New Application Received',
    message: `A new application has been received for ${application.course.name}`,
    relatedTo: {
      application: application._id,
      course: application.course
    }
  });
};

// Add this to your payment confirmation handler
const createPaymentNotification = async (collegeId, payment, application) => {
  await Notification.create({
    college: collegeId,
    type: 'payment',
    title: 'Application Fee Received',
    message: `Application fee received for ${application.course.name}`,
    relatedTo: {
      payment: payment._id,
      application: application._id,
      course: application.course
    }
  });
};

exports.createApplication = asyncHandler(async (req, res) => {
  try {
    // Get student profile with proper population
    const student = await Student.findOne({ user: req.user.id })
      .populate('academicDetails qualifications')
      .select('academicDetails qualifications marks documents');

    // Updated profile completion check
    if (!student || 
        !student.academicDetails || 
        !student.qualifications || 
        !student.qualifications.length || 
        !student.marks) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before applying'
      });
    }

    // Get course and college details
    const course = await Course.findById(req.body.courseId)
      .populate('college', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if student has already applied
    const existingApplication = await Application.findOne({
      student: student._id,
      course: course._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this course'
      });
    }

    // Create application with profile data
    const application = await Application.create({
      student: student._id,
      course: course._id,
      college: course.college._id,
      profileData: {
        academicDetails: student.academicDetails,
        qualifications: student.qualifications,
        marks: student.marks,
        documents: student.documents || []
      }
    });

    // Create notification for college
    await Notification.create({
      user: course.college._id,
      title: 'New Application',
      message: `New application received for ${course.name}`,
      type: 'application',
      data: {
        applicationId: application._id,
        courseName: course.name,
        studentName: student.name
      }
    });

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating application'
    });
  }
});