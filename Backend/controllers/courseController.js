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

    console.log('Uploading to Cloudinary:', file.path);
    
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'eduvoyage/courses',
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    
    console.log('Cloudinary upload successful:', result.secure_url);
    
    // Delete the local file after successful upload
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error('Failed to delete local file:', unlinkError);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
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

exports.createCourse = asyncHandler(async (req, res) => {
  try {
    console.log('Creating course - Request body:', req.body);
    
    // Parse seats data - ensure we're getting numbers
    const seatsTotal = Number(req.body.seats.total);
    console.log('req.body', req.body.seats.total)
    console.log('Parsed seats total:', seatsTotal, typeof seatsTotal);

    // Validate seats
    if (!Number.isInteger(seatsTotal) || seatsTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total seats must be a positive whole number'
      });
    }

    // Create course data object with validated data
    const courseData = {
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      college: req.user.id,
      duration: Number(req.body.duration),
      fees: Number(req.body.fees),
      seats: {
        total: seatsTotal,
        available: seatsTotal // For new course, available = total
      },
      eligibility: req.body.eligibility.trim(),
      startDate: req.body.startDate,
      applicationDeadline: req.body.applicationDeadline
    };

    // Validate other numerical fields
    if (!Number.isInteger(courseData.duration) || courseData.duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive whole number'
      });
    }

    if (!Number.isFinite(courseData.fees) || courseData.fees < 0) {
      return res.status(400).json({
        success: false,
        message: 'Fees must be a non-negative number'
      });
    }

    // Log the validated data
    console.log('Validated course data:', courseData);

    // Handle image upload
    if (req.file) {
      try {
        console.log('Uploading file:', req.file);
        const imageUrl = await uploadToCloudinary(req.file);
        courseData.image = imageUrl;
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        courseData.image = '/default-course.jpg';
      }
    } else {
      courseData.image = '/default-course.jpg';
    }

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating course'
    });
  }
});

exports.updateCourse = async (req, res) => {
  try {
    const college = await College.findOne({ user: req.user._id });
    const course = await Course.findOne({ 
      _id: req.params.id,
      college: college._id 
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    let imageUrl = course.image;
    if (req.file) {
      try {
        // Delete old image from Cloudinary if exists
        if (course.image) {
          const publicId = course.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`eduvoyage/courses/${publicId}`);
        }
        // Upload new image
        imageUrl = await uploadToCloudinary(req.file);
      } catch (error) {
        console.error('Image update failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update image'
        });
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        image: imageUrl
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating course'
    });
  }
};

exports.deleteCourse = asyncHandler(async (req, res) => {
  try {
    const college = await College.findOne({ user: req.user._id });
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    const course = await Course.findOne({
      _id: req.params.id,
      college: college._id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (course.image && course.image !== '/default-course.jpg') {
      try {
        const publicId = course.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`eduvoyage/courses/${publicId}`);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    await Course.findByIdAndDelete(req.params.id);

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
});

exports.getCourses = asyncHandler(async (req, res, next) => {
  try {
    console.log('Getting courses...');
    
    // For public access, show all active courses with college info
    const courses = await Course.find()
      .populate({
        path: 'college',
        select: 'name location'
      })
      .select('name description duration fees image college')
      .lean();

    console.log(`Found ${courses.length} courses`);

    // Add default values for any missing fields
    const processedCourses = courses.map(course => ({
      ...course,
      image: course.image || '/default-course.jpg',
      description: course.description || 'No description available',
      duration: course.duration || 'Not specified',
      fees: course.fees || 0,
      college: {
        name: course.college?.name || 'Unknown College',
        location: course.college?.location || 'Location not specified'
      }
    }));

    res.status(200).json({
      success: true,
      count: processedCourses.length,
      courses: processedCourses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return next(new ErrorResponse('Error fetching courses', 500));
  }
});

exports.getCourse = async (req, res) => {
  try {
    const college = await College.findOne({ user: req.user._id });
    const course = await Course.findOne({ 
      _id: req.params.id,
      college: college._id 
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching course'
    });
  }
};

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

// Get all courses for a specific college
exports.getCollegeCourses = asyncHandler(async (req, res) => {
  try {
    // Find the college associated with the logged-in user
    const college = await College.findOne({ user: req.user._id });
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }
    console.log('college', college)
    // Get all courses for this college with seats information
    const courses = await Course.find({ college: college.user })
      .select('name description duration fees image seats status')
      .lean();
    console.log('courses', courses)
    // Process courses to include default values and format data
    const processedCourses = courses.map(course => ({
      _id: course._id,
      name: course.name,
      description: course.description || 'No description available',
      duration: course.duration || 'Not specified',
      fees: course.fees || 0,
      image: course.image || '/default-course.jpg',
      seats: {
        total: course.seats?.total || 0,
        available: course.seats?.available || 0,
        occupied: (course.seats?.total || 0) - (course.seats?.available || 0)
      },
      college: {
        name: college.name || 'Unknown College',
        location: college.location || 'Location not specified'
      },
      status: course.status || 'inactive'
    }));

    console.log('Processed courses:', processedCourses);

    res.status(200).json({
      success: true,
      count: processedCourses.length,
      courses: processedCourses
    });
  } catch (error) {
    console.error('Error fetching college courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});