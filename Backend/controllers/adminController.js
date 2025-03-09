const User = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Notification = require('../models/Notification');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalColleges = await User.countDocuments({ role: 'college' });
    const pendingVerifications = await College.countDocuments({ verificationStatus: 'pending' });

    res.status(200).json({
      success: true,
      totalStudents,
      totalColleges,
      pendingVerifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
};

exports.getAllColleges = asyncHandler(async (req, res) => {
  const colleges = await College.find()
    .select('name contactEmail location university verificationStatus paymentStatus documents')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: colleges.length,
    colleges
  });
});

exports.approveCollege = async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'approved' },
      { new: true }
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'College approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving college'
    });
  }
};

exports.rejectCollege = async (req, res) => {
  try {
    const { reason } = req.body;

    const college = await College.findByIdAndUpdate(
      req.params.id,
      { 
        verificationStatus: 'rejected',
        rejectionReason: reason
      },
      { new: true }
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'College rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting college'
    });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
exports.getStudents = asyncHandler(async (req, res) => {
  const students = await Student.find()
    .populate('user', 'email accountStatus')
    .select('-__v')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: students.length,
    data: students
  });
});

// @desc    Update student details
// @route   PUT /api/admin/students/:id
exports.updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

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
});

// @desc    Toggle student account status
// @route   PUT /api/admin/students/:id/toggle-status
exports.toggleStudentStatus = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('user');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  student.user.accountStatus = !student.user.accountStatus;
  await student.user.save();

  res.status(200).json({
    success: true,
    data: student
  });
});

// @desc    Deactivate student account
// @route   PUT /api/admin/students/:id/deactivate
exports.deactivateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('user');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  student.user.accountStatus = false;
  await student.user.save();

  res.status(200).json({
    success: true,
    message: 'Student account deactivated'
  });
});

// Update college verification status
exports.updateCollegeStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const college = await College.findById(req.params.id);

  if (!college) {
    return res.status(404).json({
      success: false,
      message: 'College not found'
    });
  }

  college.verificationStatus = status;
  if (reason) {
    college.rejectionReason = reason;
  }

  await college.save();

  // Send notification to college
  await Notification.create({
    recipient: college.user,
    title: `College Verification ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: status === 'approved' 
      ? 'Your college has been verified and approved.'
      : `Your college verification was rejected. Reason: ${reason}`,
    type: 'verification'
  });

  res.status(200).json({
    success: true,
    data: college
  });
});

// Update college details
exports.updateCollege = asyncHandler(async (req, res) => {
  const college = await College.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!college) {
    return res.status(404).json({
      success: false,
      message: 'College not found'
    });
  }

  res.status(200).json({
    success: true,
    data: college
  });
});

// Get college details
exports.getCollegeDetails = asyncHandler(async (req, res) => {
  const college = await College.findById(req.params.id)
    .select('-__v');

  if (!college) {
    return res.status(404).json({
      success: false,
      message: 'College not found'
    });
  }

  res.status(200).json({
    success: true,
    data: college
  });
}); 