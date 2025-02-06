const User = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');

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