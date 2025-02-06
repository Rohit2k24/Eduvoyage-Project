const College = require('../models/College');
const cloudinary = require('../config/cloudinary');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');

// Move Razorpay initialization inside the functions where it's needed
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
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
    const razorpay = getRazorpayInstance();
    const amount = 20000; // ₹200 in paise
    
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    res.status(200).json({
      success: true,
      amount,
      currency: 'INR',
      orderId: order.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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

      await College.findOneAndUpdate(
        { user: req.user._id },
        {
          paymentStatus: 'completed',
          subscriptionEndDate
        }
      );

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      throw new Error('Invalid signature');
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 