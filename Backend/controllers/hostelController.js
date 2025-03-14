const Hostel = require('../models/Hostel');
const HostelApplication = require('../models/HostelApplication');
const College = require('../models/College');
const Student = require('../models/Student');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { cloudinary } = require('../config/cloudinary');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Get all hostels for a college
// @route   GET /api/college/hostels
// @access  Private (College)
exports.getHostels = asyncHandler(async (req, res, next) => {
  const college = await College.findOne({ user: req.user._id });
  if (!college) {
    return next(new ErrorResponse('College not found', 404));
  }

  const hostels = await Hostel.find({ college: college._id });

  res.status(200).json({
    success: true,
    count: hostels.length,
    data: hostels
  });
});

// @desc    Get single hostel
// @route   GET /api/college/hostels/:id
// @access  Private
exports.getHostel = asyncHandler(async (req, res, next) => {
  const hostel = await Hostel.findById(req.params.id)
    .populate('reviews.student', 'name profilePic');

  if (!hostel) {
    return next(new ErrorResponse('Hostel not found', 404));
  }

  res.status(200).json({
    success: true,
    data: hostel
  });
});

// @desc    Create hostel
// @route   POST /api/college/hostels
// @access  Private (College)
exports.createHostel = asyncHandler(async (req, res, next) => {
  const college = await College.findOne({ user: req.user._id });
  if (!college) {
    return next(new ErrorResponse('College not found', 404));
  }

  const hostelData = { ...req.body };
  hostelData.college = college._id;

  // Convert numeric values
  hostelData.totalRooms = Number(hostelData.totalRooms) || 0;
  hostelData.availableRooms = Number(hostelData.availableRooms || hostelData.totalRooms) || 0;
  if (hostelData.location?.distanceFromCollege) {
    hostelData.location.distanceFromCollege = Number(hostelData.location.distanceFromCollege) || 0;
  }

  // Handle image uploads
  if (hostelData.images && hostelData.images.length > 0) {
    const uploadedImages = [];
    for (const base64Image of hostelData.images) {
      if (base64Image.startsWith('data:image')) {
        const result = await cloudinary.uploader.upload(base64Image, {
          folder: 'eduvoyage/hostels',
          resource_type: 'auto'
        });
        uploadedImages.push(result.secure_url);
      }
    }
    hostelData.images = uploadedImages;
  }

  // Handle room types
  if (hostelData.roomTypes && Array.isArray(hostelData.roomTypes)) {
    hostelData.roomTypes = hostelData.roomTypes.map(roomType => {
      // Ensure room type is lowercase and valid
      const type = (roomType.type || '').toLowerCase();
      if (!['single', 'double', 'triple', 'dormitory'].includes(type)) {
        throw new ErrorResponse(`Invalid room type: ${roomType.type}`, 400);
      }

      const processedRoom = {
        type,
        price: Number(roomType.price) || 0,
        totalBeds: Number(roomType.totalBeds) || 0,
        availableBeds: Number(roomType.availableBeds || roomType.totalBeds) || 0,
        amenities: roomType.amenities || [],
        images: []
      };

      return processedRoom;
    });

    // Handle room type images
    for (let i = 0; i < hostelData.roomTypes.length; i++) {
      const roomType = hostelData.roomTypes[i];
      if (roomType.images && roomType.images.length > 0) {
        const uploadedImages = [];
        for (const base64Image of roomType.images) {
          if (base64Image.startsWith('data:image')) {
            const result = await cloudinary.uploader.upload(base64Image, {
              folder: 'eduvoyage/hostel-rooms',
              resource_type: 'auto'
            });
            uploadedImages.push(result.secure_url);
          }
        }
        hostelData.roomTypes[i].images = uploadedImages;
      }
    }
  }

  const hostel = await Hostel.create(hostelData);

  res.status(201).json({
    success: true,
    data: hostel
  });
});

// @desc    Update hostel
// @route   PUT /api/college/hostels/:id
// @access  Private (College)
exports.updateHostel = asyncHandler(async (req, res, next) => {
  let hostel = await Hostel.findById(req.params.id);

  if (!hostel) {
    return next(new ErrorResponse('Hostel not found', 404));
  }

  // Make sure user is hostel owner
  const college = await College.findOne({ user: req.user._id });
  if (!college || hostel.college.toString() !== college._id.toString()) {
    return next(new ErrorResponse('Not authorized to update this hostel', 401));
  }

  const hostelData = { ...req.body };

  // Convert numeric values
  hostelData.totalRooms = Number(hostelData.totalRooms) || 0;
  hostelData.availableRooms = Number(hostelData.availableRooms || hostelData.totalRooms) || 0;
  if (hostelData.location?.distanceFromCollege) {
    hostelData.location.distanceFromCollege = Number(hostelData.location.distanceFromCollege) || 0;
  }

  // Handle new image uploads
  if (hostelData.newImages && hostelData.newImages.length > 0) {
    const uploadedImages = [];
    for (const base64Image of hostelData.newImages) {
      if (base64Image.startsWith('data:image')) {
        const result = await cloudinary.uploader.upload(base64Image, {
          folder: 'eduvoyage/hostels',
          resource_type: 'auto'
        });
        uploadedImages.push(result.secure_url);
      }
    }
    // Combine existing and new images
    hostelData.images = [...(hostel.images || []), ...uploadedImages];
    delete hostelData.newImages;
  }

  // Handle room types
  if (hostelData.roomTypes && Array.isArray(hostelData.roomTypes)) {
    hostelData.roomTypes = hostelData.roomTypes.map(roomType => {
      // Ensure room type is lowercase and valid
      const type = (roomType.type || '').toLowerCase();
      if (!['single', 'double', 'triple', 'dormitory'].includes(type)) {
        throw new ErrorResponse(`Invalid room type: ${roomType.type}`, 400);
      }

      const processedRoom = {
        type,
        price: Number(roomType.price) || 0,
        totalBeds: Number(roomType.totalBeds) || 0,
        availableBeds: Number(roomType.availableBeds || roomType.totalBeds) || 0,
        amenities: roomType.amenities || [],
        images: roomType.images || []
      };

      return processedRoom;
    });

    // Handle room type images
    for (let i = 0; i < hostelData.roomTypes.length; i++) {
      const roomType = hostelData.roomTypes[i];
      if (roomType.newImages && roomType.newImages.length > 0) {
        const uploadedImages = [];
        for (const base64Image of roomType.newImages) {
          if (base64Image.startsWith('data:image')) {
            const result = await cloudinary.uploader.upload(base64Image, {
              folder: 'eduvoyage/hostel-rooms',
              resource_type: 'auto'
            });
            uploadedImages.push(result.secure_url);
          }
        }
        hostelData.roomTypes[i].images = [...(roomType.images || []), ...uploadedImages];
      }
    }
  }

  hostel = await Hostel.findByIdAndUpdate(req.params.id, hostelData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: hostel
  });
});

// @desc    Delete hostel
// @route   DELETE /api/college/hostels/:id
// @access  Private (College)
exports.deleteHostel = asyncHandler(async (req, res, next) => {
  const hostel = await Hostel.findById(req.params.id);

  if (!hostel) {
    return next(new ErrorResponse('Hostel not found', 404));
  }

  // Make sure user is hostel owner
  const college = await College.findOne({ user: req.user._id });
  if (!college || hostel.college.toString() !== college._id.toString()) {
    return next(new ErrorResponse('Not authorized to delete this hostel', 401));
  }

  await hostel.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get hostel applications
// @route   GET /api/hostel/applications
// @access  Private (College)
exports.getHostelApplications = asyncHandler(async (req, res, next) => {
  const college = await College.findOne({ user: req.user._id });
  if (!college) {
    return next(new ErrorResponse('College not found', 404));
  }

  const applications = await HostelApplication.find({ college: college._id })
    .populate({
      path: 'student',
      select: 'name email gender dateOfBirth phone address emergencyContact'
    })
    .populate({
      path: 'hostel',
      select: 'name type roomTypes'
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
});

// @desc    Update hostel application status
// @route   PUT /api/hostel/applications/:id
// @access  Private (College)
exports.updateHostelApplication = asyncHandler(async (req, res, next) => {
  const { status, remarks } = req.body;

  const application = await HostelApplication.findById(req.params.id);
  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Make sure user is from the college that owns the hostel
  const college = await College.findOne({ user: req.user._id });
  if (!college || application.college.toString() !== college._id.toString()) {
    return next(new ErrorResponse('Not authorized to update this application', 401));
  }

  application.status = status;
  if (remarks) {
    application.remarks = remarks;
  }

  await application.save();

  // If application is approved, update hostel availability
  if (status === 'approved') {
    const hostel = await Hostel.findById(application.hostel);
    if (hostel) {
      const roomType = hostel.roomTypes.find(rt => rt.type === application.roomType);
      if (roomType) {
        roomType.availableBeds = Math.max(0, roomType.availableBeds - 1);
        hostel.availableRooms = Math.max(0, hostel.availableRooms - 1);
        await hostel.save();
      }
    }
  }

  // Fetch updated application with populated fields
  const updatedApplication = await HostelApplication.findById(application._id)
    .populate({
      path: 'student',
      select: 'name email phone address emergencyContact'
    })
    .populate({
      path: 'hostel',
      select: 'name type roomTypes'
    });

  res.status(200).json({
    success: true,
    data: updatedApplication
  });
});

// @desc    Add hostel review
// @route   POST /api/college/hostels/:id/reviews
// @access  Private (Student)
exports.addHostelReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  // Get student
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  // Check if student has stayed in the hostel
  const hasStayed = await HostelApplication.findOne({
    student: student._id,
    hostel: req.params.id,
    status: 'approved'
  });

  if (!hasStayed) {
    return next(new ErrorResponse('You must have stayed in the hostel to review it', 400));
  }

  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) {
    return next(new ErrorResponse('Hostel not found', 404));
  }

  // Add review
  hostel.reviews.push({
    student: student._id,
    rating,
    comment
  });

  await hostel.save();

  res.status(200).json({
    success: true,
    data: hostel
  });
});

// @desc    Get hostels by college ID
// @route   GET /api/hostel/college/:collegeId
// @access  Private
exports.getHostelsByCollege = asyncHandler(async (req, res, next) => {
  const hostels = await Hostel.find({ college: req.params.collegeId })
    .populate('reviews.student', 'name profilePic');

  res.status(200).json({
    success: true,
    count: hostels.length,
    data: hostels
  });
});

// @desc    Apply for hostel
// @route   POST /api/hostel/apply
// @access  Private (Student)
exports.applyForHostel = asyncHandler(async (req, res, next) => {
  const { hostelId, roomType, preferredFloor, specialRequirements, medicalConditions, emergencyContact } = req.body;

  // Get student
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  // Get hostel
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    return next(new ErrorResponse('Hostel not found', 404));
  }

  // Check if student already has any active applications for this hostel
  const existingApplication = await HostelApplication.findOne({
    student: student._id,
    hostel: hostelId,
    status: { $in: ['pending', 'approved', 'waitlisted'] }
  });

  if (existingApplication) {
    return next(new ErrorResponse(`You already have an ${existingApplication.status} application for this hostel`, 400));
  }

  // Check if student has an approved application in any hostel of this college
  const approvedApplication = await HostelApplication.findOne({
    student: student._id,
    college: hostel.college,
    status: 'approved'
  });

  if (approvedApplication) {
    return next(new ErrorResponse('You already have an approved hostel application in this college', 400));
  }

  // Check if room type exists and has available beds
  const selectedRoomType = hostel.roomTypes.find(rt => rt.type === roomType);
  if (!selectedRoomType) {
    return next(new ErrorResponse('Invalid room type', 400));
  }

  if (selectedRoomType.availableBeds <= 0) {
    return next(new ErrorResponse('No beds available for this room type', 400));
  }

  // Create application
  const application = await HostelApplication.create({
    student: student._id,
    hostel: hostelId,
    college: hostel.college,
    roomType,
    preferredFloor: preferredFloor || 'any',
    specialRequirements,
    medicalConditions,
    emergencyContact,
    duration: {
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });

  // Populate the response data
  const populatedApplication = await HostelApplication.findById(application._id)
    .populate({
      path: 'hostel',
      select: 'name type roomTypes images location wardenContact'
    })
    .populate({
      path: 'student',
      select: 'name email phone'
    });

  res.status(201).json({
    success: true,
    data: populatedApplication
  });
});

// @desc    Get student's hostel applications
// @route   GET /api/hostel/student/applications
// @access  Private (Student)
exports.getStudentHostelApplications = asyncHandler(async (req, res, next) => {
  console.log("getStudentHostelApplications");
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }
  console.log("student", student);
  console.log("student._id", student._id);
  const applications = await HostelApplication.find({ student: student._id })
    .populate({
      path: 'hostel',
      select: 'name type roomTypes images location'
    })
    .populate({
      path: 'college',
      select: 'name city state'
    })
    .sort({ createdAt: -1 });
  console.log("applications", applications);
  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
});

// @desc    Update hostel application payment
// @route   PUT /api/hostel/applications/:id/payment
// @access  Private (Student)
exports.updateHostelPayment = asyncHandler(async (req, res, next) => {
  const { transactionId, amount } = req.body;

  const application = await HostelApplication.findById(req.params.id);
  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Verify that the student owns this application
  const student = await Student.findOne({ user: req.user._id });
  if (!student || application.student.toString() !== student._id.toString()) {
    return next(new ErrorResponse('Not authorized to update this application', 401));
  }

  // Update payment details
  application.payment = {
    amount,
    status: 'completed',
    transactionId,
    paidAt: new Date()
  };

  await application.save();

  // Fetch updated application with populated fields
  const updatedApplication = await HostelApplication.findById(application._id)
    .populate({
      path: 'hostel',
      select: 'name type roomTypes images location'
    })
    .populate({
      path: 'college',
      select: 'name city state'
    });

  res.status(200).json({
    success: true,
    data: updatedApplication
  });
});

// @desc    Cancel hostel application
// @route   PUT /api/hostel/applications/:id/cancel
// @access  Private (Student)
exports.cancelHostelApplication = asyncHandler(async (req, res, next) => {
  const application = await HostelApplication.findById(req.params.id);
  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Verify that the student owns this application
  const student = await Student.findOne({ user: req.user._id });
  if (!student || application.student.toString() !== student._id.toString()) {
    return next(new ErrorResponse('Not authorized to cancel this application', 401));
  }

  // Only allow cancellation if status is pending
  if (application.status !== 'pending') {
    return next(new ErrorResponse('Cannot cancel application in current status', 400));
  }

  application.status = 'cancelled';
  await application.save();

  res.status(200).json({
    success: true,
    data: application
  });
});

// @desc    Create Razorpay order for hostel payment
// @route   POST /api/hostel/applications/:id/create-payment
// @access  Private (Student)
exports.createPaymentOrder = asyncHandler(async (req, res, next) => {
  const application = await HostelApplication.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Get student
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  // Check if application belongs to logged in student
  if (application.student.toString() !== student._id.toString()) {
    return next(new ErrorResponse('Not authorized to access this application', 401));
  }

  const hostel = await Hostel.findById(application.hostel);
  const roomType = hostel.roomTypes.find(room => room.type === application.roomType);
  const amount = roomType.price * 100; // Convert to smallest currency unit (paise)

  const options = {
    amount,
    currency: 'INR',
    receipt: `receipt_${application._id}`,
    notes: {
      applicationId: application._id.toString(),
      hostelId: hostel._id.toString(),
      studentId: student._id.toString(),
      roomType: application.roomType
    }
  };

  try {
    const order = await razorpay.orders.create(options);
    
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });
  } catch (error) {
    return next(new ErrorResponse('Error creating payment order', 500));
  }
});

// @desc    Verify Razorpay payment
// @route   POST /api/hostel/applications/:id/verify-payment
// @access  Private (Student)
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new ErrorResponse('Missing payment verification details', 400));
  }

  const application = await HostelApplication.findById(req.params.id);
  
  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Get student
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  // Check if application belongs to logged in student
  if (application.student.toString() !== student._id.toString()) {
    return next(new ErrorResponse('Not authorized to access this application', 401));
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return next(new ErrorResponse('Invalid payment signature', 400));
  }

  // Update application payment status
  application.payment = {
    status: 'completed',
    transactionId: razorpay_payment_id,
    orderId: razorpay_order_id,
    amount: req.body.amount,
    paidAt: Date.now()
  };

  await application.save();

  // Fetch the updated application with populated fields
  const updatedApplication = await HostelApplication.findById(application._id)
    .populate({
      path: 'hostel',
      select: 'name type roomTypes images location wardenContact'
    })
    .populate({
      path: 'student',
      select: 'name email phone'
    });

  res.status(200).json({
    success: true,
    data: updatedApplication
  });
}); 