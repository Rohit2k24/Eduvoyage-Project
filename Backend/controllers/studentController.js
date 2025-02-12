const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const DigilockerService = require('../config/digilocker');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const streamifier = require('streamifier');
const User = require('../models/User');

// @desc    Get student dashboard statistics
// @route   GET /api/student/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  try {
    console.log('getDashboardStats called');
    const studentId = req.user.id;
    console.log('Student ID:', studentId);

    // Get applications count by status
    const applicationStats = await Application.aggregate([
      { 
        $match: { 
          student: new mongoose.Types.ObjectId(studentId)
        } 
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Application stats:', applicationStats);

    // Get recent applications
    const recentApplications = await Application.find({ 
      student: studentId 
    })
    .sort('-createdAt')
    .limit(5)
    .populate({
      path: 'course',
      select: 'name college',
      populate: {
        path: 'college',
        select: 'name'
      }
    });
    console.log('Recent applications:', recentApplications);

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      user: studentId,
      read: false
    });
    console.log('Unread notifications:', unreadNotifications);

    // Get recommended courses
    const recommendedCourses = await Course.find({ 
      status: 'active',
      _id: { $nin: recentApplications.map(app => app.course._id) }
    })
    .sort('-createdAt')
    .limit(3)
    .populate('college', 'name');
    console.log('Recommended courses:', recommendedCourses);

    // Format the response
    const response = {
      applicationStats: applicationStats.reduce((acc, stat) => {
        acc[stat._id || 'pending'] = stat.count;
        return acc;
      }, {
        pending: 0,
        approved: 0,
        rejected: 0
      }),
      recentApplications,
      unreadNotifications,
      recommendedCourses
    };

    console.log('Sending response:', response);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return next(new ErrorResponse('Error fetching dashboard data', 500));
  }
});

// @desc    Get student notifications
// @route   GET /api/student/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/student/notifications/:id/read
// @access  Private
exports.markNotificationAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 401));
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Delete notification
// @route   DELETE /api/student/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 401));
  }

  await notification.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get student applications
// @route   GET /api/student/applications
// @access  Private
exports.getApplications = asyncHandler(async (req, res, next) => {
  const applications = await Application.find({ student: req.user.id })
    .sort('-createdAt')
    .populate({
      path: 'course',
      select: 'name college image',
      populate: {
        path: 'college',
        select: 'name'
      }
    });

  res.status(200).json({
    success: true,
    applications
  });
});

// @desc    Download application receipt
// @route   GET /api/student/applications/:id/receipt
// @access  Private
exports.downloadReceipt = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate({
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

  if (application.student.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 401));
  }

  // Generate and send receipt
  // This is a placeholder - implement actual receipt generation logic
  res.status(200).json({
    success: true,
    message: 'Receipt download functionality to be implemented'
  });
});

exports.verifyPassport = async (req, res) => {
  try {
    const { passportNumber } = req.body;
    
    // Basic passport number validation
    const passportRegex = /^[A-Z][0-9]{7}$/;
    if (!passportRegex.test(passportNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid passport number format'
      });
    }

    const student = await Student.findOneAndUpdate(
      { user: req.user._id },
      { 
        'passport.number': passportNumber,
        'passport.verified': false
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Passport number saved',
      data: student
    });
  } catch (error) {
    console.error('Passport verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.initiateDigilocker = async (req, res) => {
  try {
    const authUrl = DigilockerService.getAuthUrl();
    res.status(200).json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Digilocker initiation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.handleDigilockerCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const accessToken = await DigilockerService.getAccessToken(code);
    const document = await DigilockerService.getPassportDocument(accessToken);

    const student = await Student.findOneAndUpdate(
      { user: req.user._id },
      { 
        'passport.document': document.uri,
        'passport.digilockerVerified': true,
        'passport.verified': true
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Passport verified through Digilocker',
      data: student
    });
  } catch (error) {
    console.error('Digilocker callback error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate('user', 'name email profilePic');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        name: student.user.name,
        email: student.user.email,
        phone: student.phone,
        education: student.education,
        profilePic: student.user.profilePic,
        // ... other fields
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'passport-documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto' }]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg and .pdf format allowed!'));
  }
}).single('passportDocument');

exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    let profilePicUrl = '';
    
    if(req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'student-profiles',
            transformation: [
              { width: 500, height: 500, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if(result) resolve(result);
            else reject(error);
          }
        );
        
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      profilePicUrl = result.secure_url;
    }

    // Update user profile picture
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: profilePicUrl },
      { new: true }
    );

    // Update student details
    const student = await Student.findOneAndUpdate(
      { user: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'profilePic');

    res.status(200).json({
      success: true,
      data: {
        ...student.toObject(),
        profilePic: user.profilePic
      }
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      settings: {
        notifications: {
          emailAlerts: student.settings?.notifications?.emailAlerts ?? true,
          applicationUpdates: student.settings?.notifications?.applicationUpdates ?? true,
          courseRecommendations: student.settings?.notifications?.courseRecommendations ?? true,
          deadlineReminders: student.settings?.notifications?.deadlineReminders ?? true
        },
        privacy: {
          showProfile: student.settings?.privacy?.showProfile ?? true,
          showEducation: student.settings?.privacy?.showEducation ?? true
        }
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    const student = await Student.findOneAndUpdate(
      { user: req.user._id },
      { settings },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      settings: student.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
}; 