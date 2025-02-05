const User = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalColleges = await User.countDocuments({ role: 'college' });
    const pendingVerifications = await College.countDocuments({ status: 'pending' });

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