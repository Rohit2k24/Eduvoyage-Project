const Course = require('../models/Course');
const College = require('../models/College');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    if (!file || !file.path) {
      throw new Error('No file provided for upload');
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'eduvoyage/courses',
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // Delete the local file after successful upload
    await fs.unlink(file.path);
    return result.secure_url;
  } catch (error) {
    // Clean up local file if upload fails
    if (file && file.path) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('Failed to delete local file:', unlinkError);
      }
    }
    throw error;
  }
};

exports.createCourse = async (req, res) => {
  try {
    console.log('Creating course with data:', req.body);

    // Parse numeric values
    const totalSeats = parseInt(req.body.seats.total);
    const duration = parseInt(req.body.duration);
    const fees = parseInt(req.body.fees);

    // Validate numeric values
    if (isNaN(totalSeats) || totalSeats < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total seats must be at least 1'
      });
    }

    // Get eligibility criteria from request body
    let eligibilityCriteria = [];
    if (Array.isArray(req.body.eligibilityCriteria)) {
      eligibilityCriteria = req.body.eligibilityCriteria.filter(criteria => criteria.trim());
    } else if (typeof req.body.eligibilityCriteria === 'string') {
      eligibilityCriteria = [req.body.eligibilityCriteria.trim()];
    }

    // Validate eligibility criteria
    if (eligibilityCriteria.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one eligibility criterion is required'
      });
    }

    // Find the college first
    const college = await College.findOne({ user: req.user.id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    const courseData = {
      name: req.body.name,
      description: req.body.description,
      duration: duration,
      fees: fees,
      college: college._id,
      seats: {
        total: totalSeats,
        available: totalSeats
      },
      eligibilityCriteria: eligibilityCriteria,
      startDate: req.body.startDate,
      applicationDeadline: req.body.applicationDeadline,
      status: req.body.status || 'active',
      image: req.body.image || '/default-course.jpg' // Provide default image if none provided
    };

    console.log('Course data to save:', courseData);

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create course'
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    console.log('Update request body:', req.body);
    console.log('Course ID:', req.params.id);

    // First find the college
    const college = await College.findOne({ user: req.user.id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    // Find the course using both course ID and college ID
    const existingCourse = await Course.findOne({
      _id: req.params.id,
      college: college._id
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Parse numeric values
    const totalSeats = parseInt(req.body.seats.total);
    const availableSeats = parseInt(req.body.seats.available);
    const duration = parseInt(req.body.duration);
    const fees = parseInt(req.body.fees);

    // Validate numeric values
    if (isNaN(totalSeats) || totalSeats < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total seats must be at least 1'
      });
    }

    // Get eligibility criteria from request body
    let eligibilityCriteria = [];
    if (Array.isArray(req.body.eligibilityCriteria)) {
      eligibilityCriteria = req.body.eligibilityCriteria.filter(criteria => criteria.trim());
    } else if (typeof req.body.eligibilityCriteria === 'string') {
      eligibilityCriteria = [req.body.eligibilityCriteria.trim()];
    }

    // Validate eligibility criteria
    if (eligibilityCriteria.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one eligibility criterion is required'
      });
    }

    const courseData = {
      name: req.body.name,
      description: req.body.description,
      duration: duration,
      fees: fees,
      seats: {
        total: totalSeats,
        available: availableSeats
      },
      eligibilityCriteria: eligibilityCriteria,
      startDate: req.body.startDate,
      applicationDeadline: req.body.applicationDeadline,
      image: req.body.image || existingCourse.image // Keep existing image if no new one provided
    };

    console.log('Course data to update:', courseData);

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      courseData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update course'
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findOne({
      _id: courseId,
      college: req.user.id // Use req.user.id directly
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (course.image && course.image.includes('cloudinary')) {
      try {
        const publicId = course.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`eduvoyage/courses/${publicId}`);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    await Course.findByIdAndDelete(courseId);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course'
    });
  }
};

exports.getCourses = asyncHandler(async (req, res) => {
  try {
    const courses = await Course.find({ status: 'active' })
      .populate('college', 'name location')
      .select('name description duration fees image startDate applicationDeadline seats eligibilityCriteria college')
      .sort('-createdAt');

    const processedCourses = courses.map(course => ({
      _id: course._id,
      name: course.name,
      description: course.description,
      duration: course.duration,
      fees: course.fees,
      image: course.image || '/default-course.jpg',
      startDate: course.startDate,
      applicationDeadline: course.applicationDeadline,
      availableSeats: course.seats?.available || 0,
      eligibilityCriteria: course.eligibilityCriteria || [],
      college: {
        _id: course.college?._id,
        name: course.college?.name,
        location: course.college?.location
      }
    }));

    res.status(200).json({
      success: true,
      count: processedCourses.length,
      data: processedCourses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

exports.getCollegeCourses = asyncHandler(async (req, res) => {
  try {
    // First, find the college using user ID
    const college = await College.findOne({ user: req.user.id });
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    // Then find courses for this college using college._id
    const courses = await Course.find({ 
      college: college._id,
      status: 'active'
    })
    .select('name description duration fees image startDate applicationDeadline seats eligibilityCriteria')
    .sort('-createdAt');

    const processedCourses = courses.map(course => ({
      _id: course._id,
      name: course.name,
      description: course.description,
      duration: course.duration,
      fees: course.fees,
      image: course.image || '/default-course.jpg',
      startDate: course.startDate,
      applicationDeadline: course.applicationDeadline,
      seats: course.seats,
      eligibilityCriteria: course.eligibilityCriteria || []
    }));

    res.status(200).json({
      success: true,
      data: processedCourses
    });
  } catch (error) {
    console.error('Error in getCollegeCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching college courses'
    });
  }
});

exports.getCourse = asyncHandler(async (req, res) => {
  try {
    console.log('Fetching course with ID:', req.params.id);
    const course = await Course.findById(req.params.id)
      .populate('college', 'name location contactEmail phoneNumber')
      .select('-__v');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course details'
    });
  }
});

exports.getAllCoursesForStudent = asyncHandler(async (req, res) => {
  const courses = await Course.find({ status: 'active' })
    .populate({
      path: 'college',
      select: 'name location'
    })
    .select('name description duration fees image college startDate applicationDeadline seats');

  const processedCourses = courses.map(course => ({
    _id: course._id,
    name: course.name,
    description: course.description,
    duration: course.duration,
    fees: course.fees,
    image: course.image || '/default-course.jpg',
    college: {
      name: course.college?.name || 'Unknown College',
      location: course.college?.location || 'Location not specified'
    },
    startDate: course.startDate,
    applicationDeadline: course.applicationDeadline,
    availableSeats: course.seats.available
  }));

  res.status(200).json({
    success: true,
    courses: processedCourses
  });
});

exports.getCourseDetailsForStudent = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate({
      path: 'college',
      select: 'name location description facilities'
    });

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  res.status(200).json({
    success: true,
    course: {
      _id: course._id,
      name: course.name,
      description: course.description,
      duration: course.duration,
      fees: course.fees,
      image: course.image,
      eligibility: course.eligibility,
      startDate: course.startDate,
      applicationDeadline: course.applicationDeadline,
      seats: course.seats,
      college: {
        name: course.college.name,
        location: course.college.location,
        description: course.college.description,
        facilities: course.college.facilities
      }
    }
  });
});