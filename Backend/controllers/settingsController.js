const College = require('../models/College');
const asyncHandler = require('../middleware/async');

// Get college settings
exports.getSettings = asyncHandler(async (req, res) => {
  const college = await College.findOne({ user: req.user.id })
    .select('name contactEmail phoneNumber website address description location university establishmentYear accreditation facilities documents notificationPreferences');

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
      address: college.address || '',
      description: college.description || '',
      location: college.location || '',
      university: college.university || '',
      establishmentYear: college.establishmentYear || '',
      accreditation: college.accreditation || '',
      facilities: Array.isArray(college.facilities) ? college.facilities : [],
      documents: {
        collegeLogo: college.documents?.collegeLogo || '',
        collegeImages: Array.isArray(college.documents?.collegeImages) ? college.documents.collegeImages : [],
        registrationCertificate: college.documents?.registrationCertificate || '',
        accreditationCertificate: college.documents?.accreditationCertificate || ''
      },
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
    establishmentYear,
    accreditation,
    facilities,
    documents,
    notifications
  } = req.body;

  // Find college first to preserve existing data
  const existingCollege = await College.findOne({ user: req.user.id });
  if (!existingCollege) {
    return res.status(404).json({
      success: false,
      message: 'College not found'
    });
  }

  // Prepare update data
  const updateData = {
    name,
    contactEmail: email,
    phoneNumber: phone,
    website,
    address,
    description,
    location,
    university,
    establishmentYear,
    accreditation,
    notificationPreferences: notifications,
    facilities: Array.isArray(facilities) ? facilities : [],
    documents: {
      collegeLogo: documents?.collegeLogo || existingCollege.documents?.collegeLogo,
      collegeImages: Array.isArray(documents?.collegeImages) ? documents.collegeImages : existingCollege.documents?.collegeImages || [],
      registrationCertificate: documents?.registrationCertificate || existingCollege.documents?.registrationCertificate,
      accreditationCertificate: documents?.accreditationCertificate || existingCollege.documents?.accreditationCertificate
    }
  };

  const college = await College.findOneAndUpdate(
    { user: req.user.id },
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: college
  });
});