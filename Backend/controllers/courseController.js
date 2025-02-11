const Course = require('../models/Course');
const College = require('../models/College');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
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
    await fs.unlink(file.path);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    // Clean up local file if upload fails
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error('Failed to delete local file:', unlinkError);
    }
    throw error;
  }
};

exports.createCourse = async (req, res) => {
  try {
    console.log('Creating course - Request body:', req.body);
    console.log('File received:', req.file);

    const college = await College.findOne({ user: req.user._id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    let imageUrl = '';
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file);
        console.log('Image uploaded successfully:', imageUrl);
      } catch (error) {
        console.error('Image upload failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    const course = await Course.create({
      ...req.body,
      college: college._id,
      image: imageUrl
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating course'
    });
  }
};

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

exports.deleteCourse = async (req, res) => {
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

    // Delete image from Cloudinary if exists
    if (course.image) {
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
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting course'
    });
  }
};

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