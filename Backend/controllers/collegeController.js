const College = require('../models/College');
const cloudinary = require('../config/cloudinary');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const Course = require('../models/Course');
const Student = require('../models/Student');

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

    // Get total active courses
    const totalCourses = await Course.countDocuments({ 
      college: college._id,
      // Add any active status condition if you have one
    });

    // Get total enrolled students
    const totalStudents = await Student.countDocuments({
      college: college._id,
      status: 'active' // Assuming you have a status field
    });

    // Get recent applications (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApplications = await Student.countDocuments({
      college: college._id,
      createdAt: { $gte: thirtyDaysAgo },
      status: 'pending' // Or whatever status you use for new applications
    });

    res.status(200).json({
      success: true,
      stats: {
        totalCourses,
        totalStudents,
        recentApplications
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