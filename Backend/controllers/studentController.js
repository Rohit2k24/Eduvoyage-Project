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
const College = require('../models/College');
const PDFDocument = require('pdfkit');

// @desc    Get student dashboard statistics
// @route   GET /api/student/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    // Get applications count by status
    const applicationStats = await Application.aggregate([
      { 
        $match: { 
          student: student._id
        } 
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent applications with full details
    const recentApplications = await Application.find({ 
      student: student._id 
    })
    .sort('-createdAt')
    .limit(5)
    .populate({
      path: 'course',
      select: 'name fees duration college startDate applicationDeadline',
      populate: {
        path: 'college',
        select: 'name location'
      }
    });

    // Get upcoming deadlines
    const upcomingDeadlines = await Course.find({
      applicationDeadline: { $gt: new Date() },
      status: 'active'
    })
    .sort('applicationDeadline')
    .limit(3)
    .populate('college', 'name location')
    .select('name applicationDeadline college');

    // Get recommended colleges based on student's interests and applications
    const appliedColleges = await Application.find({ student: student._id })
      .distinct('course')
      .then(courses => Course.find({ _id: { $in: courses } })
      .distinct('college'));

    const recommendedColleges = await College.find({ 
      _id: { $nin: appliedColleges },
      verificationStatus: 'approved'
    })
    .sort('-createdAt')
    .limit(3)
    .select('name location university totalCourses')
    .lean();

    // Get total courses for each recommended college
    const recommendedCollegesWithCounts = await Promise.all(
      recommendedColleges.map(async (college) => {
        const totalCourses = await Course.countDocuments({ 
          college: college._id,
          status: 'active'
        });
        return { ...college, totalCourses };
      })
    );

    // Get unread notifications
    const unreadNotifications = await Notification.countDocuments({
      recipient: student._id,
      read: false
    });

    // Format application statistics
    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0
    };

    applicationStats.forEach(stat => {
      if (stat._id) {
        stats[stat._id] = stat.count;
        stats.total += stat.count;
      }
    });

    // Format deadlines
    const formattedDeadlines = upcomingDeadlines.map(course => ({
      id: course._id,
      courseName: course.name,
      collegeName: course.college.name,
      deadline: course.applicationDeadline,
      daysLeft: Math.ceil((new Date(course.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    const response = {
      stats,
      recentApplications: recentApplications.map(app => ({
        id: app._id,
        courseName: app.course.name,
        collegeName: app.course.college.name,
        status: app.status,
        appliedDate: app.createdAt,
        fees: app.course.fees
      })),
      deadlines: formattedDeadlines,
      recommendedColleges: recommendedCollegesWithCounts,
      unreadNotifications,
      studentName: student.name
    };

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
  try {
    console.log('Fetching applications for student:', req.user._id);

    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const applications = await Application.find({ 
      student: student._id 
    })
    .populate({
      path: 'course',
      select: 'name description fees duration college',
      populate: {
        path: 'college',
        select: 'name location'
      }
    })
    .populate('student', 'name email phone')
    .sort('-createdAt');

    console.log('Found applications:', applications);

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    next(new ErrorResponse('Error fetching applications', 500));
  }
});

// @desc    Download application receipt
// @route   GET /api/student/applications/:id/receipt
// @access  Private
exports.downloadReceipt = asyncHandler(async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    const application = await Application.findById(req.params.id)
      .populate({
        path: 'course',
        select: 'name fees college',
        populate: {
          path: 'college',
          select: 'name address logo'
        }
      })
      .populate('student', 'name email phone');

    if (!application) {
      return next(new ErrorResponse('Application not found', 404));
    }

    if (application.student._id.toString() !== student._id.toString()) {
      return next(new ErrorResponse('Not authorized to access this receipt', 401));
    }

    if (!application.payment?.paid) {
      return next(new ErrorResponse('Receipt not available - Payment pending', 400));
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Payment Receipt - ${application.course.name}`,
        Author: 'EduVoyage'
      }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${application._id}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add border to the page
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

    // Header section with logo placeholder
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('EduVoyage', 50, 40, { align: 'center' })
       .fontSize(16)
       .font('Helvetica')
       .text('Payment Receipt', { align: 'center' });

    // Add horizontal line
    doc.moveTo(50, 100)
       .lineTo(545, 100)
       .stroke();

    // Receipt details in the top right
    doc.font('Helvetica')
       .fontSize(10)
       .text('Receipt No:', 400, 120)
       .font('Helvetica-Bold')
       .text(application.payment.transactionId)
       .font('Helvetica')
       .text('Date:', 400)
       .font('Helvetica-Bold')
       .text(new Date(application.payment.paidAt).toLocaleDateString());

    // College details box
    doc.roundedRect(50, 160, 495, 80, 5)
       .fillAndStroke('#f8f9fa', '#dee2e6');
    
    doc.fill('#000000')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('College Details', 70, 170)
       .font('Helvetica')
       .fontSize(10)
       .text(application.course.college.name, 70)
       .text(application.course.college.address || 'Address not available');

    // Student details box
    doc.roundedRect(50, 260, 495, 80, 5)
       .fillAndStroke('#f8f9fa', '#dee2e6');

    doc.fill('#000000')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('Student Details', 70, 270)
       .font('Helvetica')
       .fontSize(10)
       .text(`Name: ${application.student.name}`, 70)
       .text(`Email: ${application.student.email}`)
       .text(`Phone: ${application.student.phone || 'Not provided'}`);

    // Payment details box with table-like structure
    doc.roundedRect(50, 360, 495, 160, 5)
       .fillAndStroke('#f8f9fa', '#dee2e6');

    doc.fill('#000000')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('Payment Details', 70, 370);

    // Create table header
    const tableTop = 400;
    const columnWidth = 150;
    
    // Table headers
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .text('Description', 70, tableTop)
       .text('Details', 270, tableTop);

    // Table rows
    const rowData = [
      ['Course Name', application.course.name],
      ['Application ID', application._id],
      ['Amount Paid', `₹${application.payment.amount.toLocaleString()}`],
      ['Payment Date', new Date(application.payment.paidAt).toLocaleDateString()],
      ['Transaction ID', application.payment.transactionId],
      ['Payment Status', 'Successful']
    ];

    let yPos = tableTop + 20;
    rowData.forEach(([label, value], index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(60, yPos - 5, 475, 20).fill('#f8f9fa');
      }
      
      doc.fill('#000000')
         .font('Helvetica')
         .text(label, 70, yPos)
         .text(value, 270, yPos);
      
      yPos += 20;
    });

    // Add QR Code placeholder
    doc.roundedRect(50, 540, 100, 100, 5).stroke();
    doc.fontSize(8)
       .text('Scan to verify', 65, 650);

    // Footer
    doc.fontSize(8)
       .text('This is a computer-generated receipt and does not require a signature.', 50, 750, {
         align: 'center',
         color: 'grey'
       })
       .text('EduVoyage - Your Gateway to Higher Education', {
         align: 'center',
         color: '#666'
       });

    // Add page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .text(`Page ${i + 1} of ${pages.count}`,
           50,
           doc.page.height - 50,
           { align: 'center', color: '#666' }
         );
    }

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Download receipt error:', error);
    next(new ErrorResponse('Error generating receipt', 500));
  }
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

exports.getProfile = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .select('name email gender dateOfBirth phone address education passport profilePic status')
      .populate('user', 'name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching profile'
    });
  }
});

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

exports.updateProfile = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      gender,
      dateOfBirth,
      phone,
      address,
      // ... other fields
    } = req.body;

    const student = await Student.findOne({ user: req.user.id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    console.log("student",student);
    // Update student profile
    student.name = name || student.name;
    student.gender = gender || student.gender;
    student.dateOfBirth = dateOfBirth || student.dateOfBirth;
    student.phone = phone || student.phone;
    student.address = address || student.address;
    // ... update other fields

    await student.save();

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
});

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

// Update the getCourseDetails function
exports.getCourseDetails = asyncHandler(async (req, res, next) => {
  try {
    console.log('Fetching course with ID:', req.params.id);
    
    // First check if the course exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return next(new ErrorResponse('Course not found', 404));
    }

    // If course has no college reference, try to assign one
    if (!course.college) {
      console.log('No college reference found, attempting to assign one');
      const college = await College.findOne();
      if (college) {
        course.college = college._id;
        await course.save();
      }
    }

    // Populate the college data
    await course.populate({
      path: 'college',
      select: 'name description facilities location address university contactEmail phoneNumber accreditation establishmentYear'
    });

    console.log('Raw course data:', course);
    console.log('College reference:', course.college);

    // Create a clean object with all required fields
    const formattedCourse = {
      _id: course._id,
      name: course.name,
      description: course.description,
      duration: course.duration,
      fees: course.fees,
      seats: course.seats,
      image: course.image,
      status: course.status,
      eligibility: course.eligibility,
      curriculum: course.curriculum || [],
      startDate: course.startDate,
      applicationDeadline: course.applicationDeadline,
      college: course.college ? {
        _id: course.college._id,
        name: course.college.name,
        description: course.college.description,
        facilities: course.college.facilities,
        university: course.college.university,
        address: course.college.address,
        contactEmail: course.college.contactEmail,
        phoneNumber: course.college.phoneNumber,
        accreditation: course.college.accreditation,
        establishmentYear: course.college.establishmentYear
      } : {
        name: 'College information not available',
        description: 'Description not available',
        facilities: 'Facilities information not available',
        location: 'Location not specified',
        address: 'Address not specified',
        contactEmail: 'Email not available',
        phoneNumber: 'Phone number not available',
        accreditation: 'Accreditation information not available',
        establishmentYear: 'Establishment year not specified'
      }
    };

    console.log('Formatted course data:', formattedCourse);

    res.status(200).json({
      success: true,
      course: formattedCourse
    });
  } catch (error) {
    console.error('Error in getCourseDetails:', error);
    if (error.name === 'CastError') {
      return next(new ErrorResponse('Invalid course ID', 400));
    }
    next(new ErrorResponse('Error fetching course details', 500));
  }
});

const checkAndFixCourseData = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    let needsSave = false;

    // Check and fix college reference
    if (!course.college) {
      const college = await College.findOne();
      if (college) {
        course.college = college._id;
        needsSave = true;
      }
    }

    // Save if needed
    if (needsSave) {
      await course.save();
    }

    return course;
  } catch (error) {
    console.error('Error in checkAndFixCourseData:', error);
    throw error;
  }
};

// Get all colleges
exports.getColleges = asyncHandler(async (req, res) => {
  const colleges = await College.find({ verificationStatus: 'approved' })
    .select('name location university documents totalCourses')
    .lean();

  // Add total courses count for each college
  const collegesWithCounts = await Promise.all(colleges.map(async (college) => {
    const totalCourses = await Course.countDocuments({ 
      college: college._id,
      status: 'active'
    });
    return { ...college, totalCourses };
  }));

  res.status(200).json({
    success: true,
    colleges: collegesWithCounts
  });
});

// Get college details with courses
exports.getCollegeDetails = asyncHandler(async (req, res) => {
  const college = await College.findById(req.params.id)
    .select('-user -__v')
    .lean();

  if (!college) {
    return next(new ErrorResponse('College not found', 404));
  }

  const courses = await Course.find({
    college: college._id,
    status: 'active'
  }).select('-__v').lean();

  res.status(200).json({
    success: true,
    college,
    courses
  });
}); 