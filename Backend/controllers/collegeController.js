const College = require('../models/College');
const cloudinary = require('../config/cloudinary');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const CollegeStudent = require('../models/CollegeStudent');
const { generateSignature } = require('../config/cloudinary');

// Move Razorpay initialization inside the functions where it's needed
const getRazorpayInstance = () => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials are not configured');
    }
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (error) {
    console.error('Razorpay initialization error:', error);
    throw error;
  }
};

// Helper function to handle file upload to Cloudinary
const uploadFileToCloudinary = async (filePath, folder) => {
  try {
    console.log(`Attempting to upload file from path: ${filePath} to folder: ${folder}`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `eduvoyage/${folder}`,
      resource_type: 'auto'
    });
    console.log(`Successfully uploaded file to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error; // Propagate the original error
  }
};

// Helper function to safely delete a file
const safeDeleteFile = async (filePath) => {
  try {
    await fs.access(filePath); // Check if file exists
    await fs.unlink(filePath);
    console.log(`Successfully deleted file: ${filePath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') { // Only log if error is not "file doesn't exist"
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }
};

// Helper function to ensure college exists
const ensureCollegeExists = async (userId) => {
  let college = await College.findOne({ user: userId });
  
  if (!college) {
    // Get user details to create college
    const user = await User.findById(userId).select('email');
    if (!user) {
      throw new Error('User not found');
    }

    // Create a basic college record
    college = await College.create({
      user: userId,
      name: 'Pending Verification', // Temporary name
      country: 'Pending',          // Temporary value
      university: 'Pending',       // Temporary value
      accreditation: 'Pending',    // Temporary value
      establishmentYear: new Date().getFullYear(), // Current year as placeholder
      verificationStatus: 'pending',
      contactEmail: user.email,
      description: '',
      address: '',
      phoneNumber: '',
      facilities: '',
      courses: '',
      documents: {}
    });
  }
  
  return college;
};

exports.submitVerification = async (req, res) => {
  const uploadedFiles = []; // Keep track of uploaded files for cleanup

  try {
    console.log('Starting verification submission...');
    console.log('Files received:', req.files);
    
    const {
      collegeDescription,
      address,
      contactEmail,
      phoneNumber,
      facilities,
      courses
    } = req.body;

    // Initialize documents object
    const documents = {};

    // Handle file uploads
    if (req.files) {
      try {
        // Upload registration certificate
        if (req.files.registrationCertificate) {
          const file = req.files.registrationCertificate[0];
          console.log('Processing registration certificate:', file.path);
          uploadedFiles.push(file.path);
          const registrationUrl = await uploadFileToCloudinary(
            file.path,
            'certificates'
          );
          documents.registrationCertificate = registrationUrl;
          console.log('Registration certificate URL:', registrationUrl);
        }

        // Upload accreditation certificate
        if (req.files.accreditationCertificate) {
          const file = req.files.accreditationCertificate[0];
          console.log('Processing accreditation certificate:', file.path);
          uploadedFiles.push(file.path);
          const accreditationUrl = await uploadFileToCloudinary(
            file.path,
            'certificates'
          );
          documents.accreditationCertificate = accreditationUrl;
          console.log('Accreditation certificate URL:', accreditationUrl);
        }

        // Upload college logo
        if (req.files.collegeLogo) {
          const file = req.files.collegeLogo[0];
          console.log('Processing college logo:', file.path);
          uploadedFiles.push(file.path);
          const logoUrl = await uploadFileToCloudinary(
            file.path,
            'logos'
          );
          documents.collegeLogo = logoUrl;
          console.log('College logo URL:', logoUrl);
        }

        // Upload college images
        if (req.files.collegeImages) {
          console.log('Processing college images...');
          const imageUrls = [];
          for (const file of req.files.collegeImages) {
            uploadedFiles.push(file.path);
            const imageUrl = await uploadFileToCloudinary(file.path, 'college-images');
            imageUrls.push(imageUrl);
            console.log('College image URL:', imageUrl);
          }
          documents.collegeImages = imageUrls;
        }

        console.log('All files uploaded successfully');
        console.log('Final documents object:', documents);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        throw uploadError;
      }
    }

    // Ensure college exists
    let college = await ensureCollegeExists(req.user._id);

    // Update verification-related fields
    college = await College.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          description: collegeDescription,
          address,
          contactEmail,
          phoneNumber,
          facilities,
          courses,
          'documents.registrationCertificate': documents.registrationCertificate,
          'documents.accreditationCertificate': documents.accreditationCertificate,
          'documents.collegeLogo': documents.collegeLogo,
          'documents.collegeImages': documents.collegeImages,
          verificationStatus: 'pending'
        }
      },
      { new: true }
    );

    console.log('Updated college document:', college);

    // Clean up uploaded files after successful processing
    await Promise.all(uploadedFiles.map(filePath => safeDeleteFile(filePath)));

    console.log('Verification submission completed successfully');
    res.status(200).json({
      success: true,
      message: 'Verification documents submitted successfully'
    });
  } catch (error) {
    console.error('Verification submission error:', error);
    
    // Clean up any uploaded files in case of error
    await Promise.all(uploadedFiles.map(filePath => safeDeleteFile(filePath)));

    // Send more specific error message for validation failures
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting verification documents'
    });
  }
};

exports.getVerificationStatus = async (req, res) => {
  try {
    const college = await College.findOne({ user: req.user._id });
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.status(200).json({
      success: true,
      status: college.verificationStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.initiatePayment = async (req, res) => {
  try {
    // First check if college exists and is approved
    const college = await College.findOne({ user: req.user._id });
    if (!college) {
      throw new Error('College not found');
    }

    if (college.verificationStatus !== 'approved') {
      throw new Error('College verification is pending');
    }

    // Initialize Razorpay
    const razorpay = getRazorpayInstance();
    
    // Create order options
    const options = {
      amount: 20000, // ₹200 in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        collegeId: college._id.toString()
      }
    };

    console.log('Creating Razorpay order with options:', options);

    // Create order
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order);

    if (!order) {
      throw new Error('Unable to create Razorpay order');
    }

    res.status(200).json({
      success: true,
      amount: options.amount,
      currency: options.currency,
      orderId: order.id
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error initiating payment'
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new Error('Missing payment verification parameters');
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Update college payment status and subscription
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 2);

      const college = await College.findOneAndUpdate(
        { user: req.user._id },
        {
          paymentStatus: 'completed',
          subscriptionEndDate,
          verificationStatus: 'approved'
        },
        { new: true }
      );

      if (!college) {
        throw new Error('College not found');
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      throw new Error('Invalid payment signature');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error verifying payment'
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Get college ID from authenticated user
    const college = await College.findOne({ user: req.user._id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }
    console.log("college",college);
    // Get total active courses
    const totalCourses = await Course.countDocuments({ 
      college: college._id,
      status: 'active'
    });
    console.log("totalCourses",totalCourses);
    // Get courses IDs for this college
    const courseIds = await Course.find({ college: college._id }).distinct('_id');

    // Get total enrolled students
    const totalStudents = await CollegeStudent.countDocuments({
      college: college._id,
      status: 'active'
    });

    // Get pending applications count
    const pendingApplications = await Application.countDocuments({
      college: college._id,
      status: 'pending'
    });

    // Get recent applications with populated data
    const recentApplications = await Application.find({
      college: college._id
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate({
      path: 'student',
      select: 'name email'
    })
    .populate({
      path: 'course',
      select: 'name'
    })
    .lean();

    // Calculate monthly growth
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get current month's new students
    const currentMonthStudents = await CollegeStudent.countDocuments({
      college: college._id,
      createdAt: { $gte: firstDayOfMonth }
    });

    // Get last month's total students
    const lastMonthStudents = await CollegeStudent.countDocuments({
      college: college._id,
      createdAt: {
        $gte: firstDayOfLastMonth,
        $lte: lastDayOfLastMonth
      }
    });

    // Process recent applications
    const processedApplications = recentApplications.map(app => ({
      _id: app._id,
      status: app.status,
      student: {
        name: app.student?.name || 'N/A',
        email: app.student?.email || 'N/A'
      },
      course: {
        name: app.course?.name || 'N/A'
      },
      createdAt: app.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        pendingApplications,
        recentApplications: processedApplications,
        currentMonthStudents,
        lastMonthStudents
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard stats'
    });
  }
};

// @desc    Get all applications for college
// @route   GET /api/college/applications
// @access  Private (College only)
exports.getApplications = asyncHandler(async (req, res, next) => {
  try {
    // First find the college ID from the user
    const college = await College.findOne({ user: req.user._id });
    
    if (!college) {
      return next(new ErrorResponse('College not found', 404));
    }

    console.log('Found college:', college._id); // Debug log

    // Find all courses belonging to this college
    const courses = await Course.find({ college: college._id });
    
    console.log('Found courses:', courses.map(c => c._id)); // Debug log

    if (!courses.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        applications: []
      });
    }

    // Get all applications for these courses and populate student data
    const applications = await Application.find({
      course: { $in: courses.map(c => c._id) }
    })
    .populate({
      path: 'student',
      select: 'name phone user',
      populate: {
        path: 'user',
        select: 'email'
      }
    })
    .populate({
      path: 'course',
      select: 'name college',
      populate: {
        path: 'college',
        select: '_id name'
      }
    })
    .sort({ createdAt: -1 });

    console.log('Found applications:', applications.length); // Debug log

    res.status(200).json({
      success: true,
      count: applications.length,
      applications: applications.map(app => ({
        _id: app._id,
        applicationNumber: app.applicationNumber,
        status: app.status,
        createdAt: app.createdAt,
        course: {
          _id: app.course?._id,
          name: app.course?.name,
          college: app.course?.college?._id
        },
        student: {
          _id: app.student?._id,
          name: app.student?.name,
          phone: app.student?.phone,
          email: app.student?.user?.email
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return next(new ErrorResponse('Error fetching applications', 500));
  }
});

// @desc    Update application status
// @route   PUT /api/college/applications/:id/status
// @access  Private (College only)
exports.updateApplicationStatus = asyncHandler(async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    
    // First find the college associated with the logged-in user
    const college = await College.findOne({ user: req.user._id });
    if (!college) {
      return next(new ErrorResponse('College not found', 404));
    }

    // Find the application with populated course and student
    const application = await Application.findById(req.params.id)
      .populate({
        path: 'course',
        select: 'name college duration'
      })
      .populate({
        path: 'student',
        select: 'user name email phone gender dateOfBirth address education',
        populate: {
          path: 'user',
          select: '_id email'
        }
      });

    if (!application) {
      return next(new ErrorResponse('Application not found', 404));
    }

    // Verify that the application belongs to a course in this college
    if (!application.course?.college || 
        application.course.college.toString() !== college._id.toString()) {
      return next(new ErrorResponse('Not authorized to update this application', 403));
    }

    // Update application status
    application.status = status;
    if (remarks) {
      application.remarks = remarks;
    }

    await application.save();

    // If application is approved, create CollegeStudent record
    if (status === 'approved') {
      try {
        // Check if CollegeStudent record already exists
        let collegeStudent = await CollegeStudent.findOne({
          college: college._id,
          student: application.student._id
        });

        if (!collegeStudent) {
          // Create new CollegeStudent record
          collegeStudent = await CollegeStudent.create({
            college: college._id,
            student: application.student._id,
            course: application.course._id,
            application: application._id,
            status: 'active',
            academicDetails: {
              batch: new Date().getFullYear().toString(),
              semester: 1
            }
          });

          console.log('Created new college student record:', collegeStudent._id);
        } else {
          // Update existing record
          collegeStudent.course = application.course._id;
          collegeStudent.status = 'active';
          collegeStudent.application = application._id;
          await collegeStudent.save();
          console.log('Updated existing college student record:', collegeStudent._id);
        }
      } catch (studentError) {
        console.error('Error creating/updating college student record:', studentError);
      }
    }

    // Create notification for student
    try {
      if (application.student?.user?._id) {
    await Notification.create({
          recipient: application.student.user._id,
          type: 'application',
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your application for ${application.course.name} has been ${status}${remarks ? `. Remarks: ${remarks}` : ''}`,
          data: {
            applicationId: application._id,
            courseName: application.course.name,
            status: status
          }
        });
      }
    } catch (notificationError) {
      console.error('Notification creation error:', notificationError);
    }

    // Send response
    res.status(200).json({
      success: true,
      data: {
        _id: application._id,
        status: application.status,
        applicationNumber: application.applicationNumber,
        remarks: application.remarks,
        updatedAt: application.updatedAt
      }
    });

  } catch (error) {
    console.error('Update application error:', error);
    return next(new ErrorResponse(error.message || 'Error updating application status', 500));
  }
});

// @desc    Get all students for a college
// @route   GET /api/college/students
// @access  Private (College only)
exports.getStudents = asyncHandler(async (req, res, next) => {
  try {
    // First find the college associated with the logged-in user
    const college = await College.findOne({ user: req.user._id });
    if (!college) {
      return next(new ErrorResponse('College not found', 404));
    }

    console.log('Found college:', college._id);

    // Find all college students with populated data
    const collegeStudents = await CollegeStudent.find({ 
      college: college._id 
    })
    .populate({
      path: 'student',
      select: 'name email phone gender dateOfBirth address education user passport bankStatement',
      populate: {
        path: 'user',
        select: 'email'
      }
    })
    .populate({
      path: 'course',
      select: 'name duration'
    })
    .sort({ createdAt: -1 });

    console.log('Found college students:', collegeStudents.length);

    // Process student data to include all necessary information
    const processedStudents = collegeStudents.map(collegeStudent => ({
      _id: collegeStudent._id,
      enrollmentNumber: collegeStudent.enrollmentNumber,
      name: collegeStudent.student?.name,
      email: collegeStudent.student?.user?.email || collegeStudent.student?.email,
      phone: collegeStudent.student?.phone || 'N/A',
      gender: collegeStudent.student?.gender || 'N/A',
      dateOfBirth: collegeStudent.student?.dateOfBirth,
      address: collegeStudent.student?.address || 'N/A',
      status: collegeStudent.status,
      enrollmentDate: collegeStudent.enrollmentDate,
      education: collegeStudent.student?.education || { qualifications: [] },
      passport: collegeStudent.student?.passport || {},
      bankStatement: collegeStudent.student?.bankStatement || {},
      course: collegeStudent.course ? {
        _id: collegeStudent.course._id,
        name: collegeStudent.course.name,
        duration: collegeStudent.course.duration
      } : null,
      academicDetails: collegeStudent.academicDetails
    }));

    res.status(200).json({
      success: true,
      count: processedStudents.length,
      students: processedStudents
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return next(new ErrorResponse('Error fetching students', 500));
  }
});

// @desc    Update student status
// @route   PATCH /api/college/students/:id/status
// @access  Private (College only)
exports.updateStudentStatus = asyncHandler(async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // First find the college associated with the logged-in user
    const college = await College.findOne({ user: req.user._id });
    if (!college) {
      return next(new ErrorResponse('College not found', 404));
    }

    // Find the student and verify they belong to this college
    const student = await Student.findOne({
      _id: req.params.id,
      college: college._id
    });

    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    // Update student status
    student.status = status;
    await student.save();

    // Create notification for student
    try {
      if (student.user) {
        await Notification.create({
          recipient: student.user,
          type: 'application',
          title: `Status Updated`,
          message: `Your student status has been updated to ${status}`,
          data: {
            studentId: student._id,
            status: status
          }
        });
      }
    } catch (notificationError) {
      console.error('Notification creation error:', notificationError);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: student._id,
        status: student.status,
        updatedAt: student.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating student status:', error);
    return next(new ErrorResponse('Error updating student status', 500));
  }
});

// Add this function to get upload signature
exports.getUploadSignature = async (req, res) => {
  try {
    const folder = req.query.folder || 'college'; // Default folder
    const signatureData = generateSignature(folder);
    
    res.status(200).json({
      success: true,
      data: signatureData
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate upload signature'
    });
  }
};

// Update the updateSettings function to handle Cloudinary URLs
exports.updateSettings = async (req, res) => {
  try {
    const college = await College.findOne({ user: req.user._id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    const updateData = { ...req.body };

    // Handle facilities array properly
    if (Array.isArray(req.body.facilities)) {
      updateData.facilities = req.body.facilities.map(facility => ({
        name: facility.name
      }));
    }

    // Handle document URLs from Cloudinary
    if (req.body.documents) {
      updateData.documents = {
        ...college.documents, // Keep existing documents
        ...req.body.documents // Update with new documents
      };
    }

    const updatedCollege = await College.findByIdAndUpdate(
      college._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCollege
    });
  } catch (error) {
    console.error('Error updating college settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update college settings'
    });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const college = await College.findOne({ user: req.user._id })
      .select('name email phone website address description location university establishmentYear accreditation facilities documents notifications');

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    // Ensure facilities is always an array
    const settings = {
      ...college.toObject(),
      facilities: college.facilities || [],
      documents: college.documents || {},
      notifications: college.notifications || {
        email: true,
        application: true,
        payment: true
      }
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch settings'
    });
  }
}; 