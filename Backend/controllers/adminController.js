const User = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

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

exports.getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find()
      .sort({ createdAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      colleges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching colleges'
    });
  }
};

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
    .populate({
      path: 'user',
      select: 'name email profileImage role',
      match: { role: 'student' } // Only include students
    })
    .populate({
      path: 'applications',
      select: 'status course'
    })
    .select('-password')
    .lean();

  // Filter out any null users (admin accounts)
  const filteredStudents = students.filter(student => student.user !== null);

  res.status(200).json({
    success: true,
    count: filteredStudents.length,
    data: filteredStudents
  });
});

// @desc    Update student details
// @route   PUT /api/admin/students/:id
exports.updateStudent = asyncHandler(async (req, res, next) => {
  const { name, dateOfBirth, country } = req.body;
  
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { name, dateOfBirth, country },
    { new: true, runValidators: true }
  ).populate('user', 'email');

  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  res.status(200).json({ 
    success: true, 
    data: student 
  });
});

// @desc    Toggle student account status
// @route   PUT /api/admin/students/:id/toggle-status
exports.toggleStudentStatus = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);
  
  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  student.accountActive = !student.accountActive;
  await student.save();

  res.status(200).json({ 
    success: true, 
    data: { 
      _id: student._id, 
      accountActive: student.accountActive 
    } 
  });
});

// @desc    Deactivate student account
// @route   PUT /api/admin/students/:id/deactivate
exports.deactivateStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);
  
  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  student.accountActive = false;
  await student.save();

  res.status(200).json({ 
    success: true, 
    data: { 
      _id: student._id, 
      status: 'deactivated' 
    } 
  });
}); 