const College = require('../models/College');
const asyncHandler = require('../middleware/async');

// Get college settings
exports.getSettings = asyncHandler(async (req, res) => {
  const college = await College.findOne({ user: req.user.id })
    .select('name description location contactEmail phoneNumber address university website notificationPreferences');

  if (!college) {
    return res.status(404).json({
      success: false,
      message: 'College not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      name: college.name,
      email: college.contactEmail,
      phone: college.phoneNumber,
      website: college.website || '',
      address: college.address,
      description: college.description,
      location: college.location,
      university: college.university,
      notifications: college.notificationPreferences || {
        email: true,
        application: true,
        payment: true
      }
    }
  });
});

// Update college settings
exports.updateSettings = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    website,
    address,
    description,
    location,
    university,
    notifications
  } = req.body;

  const college = await College.findOneAndUpdate(
    { user: req.user.id },
    {
      name,
      contactEmail: email,
      phoneNumber: phone,
      website,
      address,
      description,
      location,
      university,
      notificationPreferences: notifications
    },
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