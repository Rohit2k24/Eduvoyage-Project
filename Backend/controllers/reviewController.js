const Review = require('../models/Review');
const Student = require('../models/Student');
const College = require('../models/College');
const Course = require('../models/Course');
const Application = require('../models/Application');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  console.log("Fetching reviews with query params:", req.query);
  const { type, id, sort = '-createdAt', status = 'approved' } = req.query;
  
  const query = { status };
  
  // Only add type and id conditions if both are provided
  if (type && id) {
    if (type === 'course') {
      query.course = id;
    } else if (type === 'college') {
      query.college = id;
    }
    query.reviewType = type;
  }
  
  console.log("Final query:", query);
  
  const reviews = await Review.find(query)
    .populate({
      path: 'student',
      select: 'name profilePic _id user'
    })
    .sort(sort);

  console.log(`Found ${reviews.length} reviews`);
  console.log('Reviews with student details:', reviews.map(review => ({
    reviewId: review._id,
    studentId: review.student._id,
    studentName: review.student.name
  })));

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate({
      path: 'student',
      select: 'name profilePic'
    });

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Add review
// @route   POST /api/reviews
// @access  Private (Student)
exports.addReview = asyncHandler(async (req, res, next) => {
  const { type, id, rating, title, review, pros, cons } = req.body;
  
  if (!type || !id) {
    return next(new ErrorResponse('Please provide review type and ID', 400));
  }

  if (!['college', 'course'].includes(type)) {
    return next(new ErrorResponse('Invalid review type', 400));
  }

  // Get student
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  // Verify the entity (college/course) exists
  let entity;
  let collegeId;
  if (type === 'college') {
    entity = await College.findById(id);
    collegeId = id;
  } else {
    entity = await Course.findById(id);
    if (entity) {
      collegeId = entity.college;
    }
  }

  if (!entity) {
    return next(new ErrorResponse(`${type.charAt(0).toUpperCase() + type.slice(1)} not found`, 404));
  }

  // Check if student has a paid application
  let applicationQuery;
  if (type === 'college') {
    // For college reviews, check if student has any paid application for any course in this college
    applicationQuery = {
      student: student._id,
      status: 'paid',
      college: collegeId
    };
  } else {
    // For course reviews, check for specific course application
    applicationQuery = {
      student: student._id,
      status: 'paid',
      course: id
    };
  }

  const application = await Application.findOne(applicationQuery);

  if (!application) {
    return next(
      new ErrorResponse(
        type === 'college' 
          ? `You must have a paid application for a course in this college to review it`
          : `You must have a paid application for this course to review it`,
        400
      )
    );
  }

  // Check if student already reviewed
  const existingReview = await Review.findOne({
    student: student._id,
    [type]: id,
    reviewType: type
  });

  if (existingReview) {
    return next(
      new ErrorResponse(
        `You have already reviewed this ${type}`,
        400
      )
    );
  }

  // Handle media uploads if any
  let mediaUrls = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'eduvoyage/reviews',
        resource_type: 'auto'
      });
      mediaUrls.push({
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        url: result.secure_url
      });
    }
  }

  // Create review
  const reviewData = {
    student: student._id,
    [type]: id,
    reviewType: type,
    rating,
    title,
    review,
    pros: Array.isArray(pros) ? pros.filter(p => p.trim()) : [],
    cons: Array.isArray(cons) ? cons.filter(c => c.trim()) : [],
    verifiedApplication: true,
    media: mediaUrls,
    status: 'approved' // Auto-approve verified application reviews
  };

  const newReview = await Review.create(reviewData);

  // Populate student details
  await newReview.populate('student', 'name profilePic');

  res.status(201).json({
    success: true,
    data: newReview
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Student)
exports.updateReview = asyncHandler(async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    // Get student
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    // Check if student owns the review
    if (review.student.toString() !== student._id.toString()) {
      return next(new ErrorResponse('Not authorized to update this review', 401));
    }

    const { rating, title, review: reviewText, pros, cons } = req.body;

    // Handle media uploads if any
    let mediaUrls = [...review.media]; // Keep existing media
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'eduvoyage/reviews',
          resource_type: 'auto'
        });
        mediaUrls.push({
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url: result.secure_url
        });
      }
    }

    // Update review
    review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        rating,
        title,
        review: reviewText,
        pros: Array.isArray(pros) ? pros.filter(p => p.trim()) : review.pros,
        cons: Array.isArray(cons) ? cons.filter(c => c.trim()) : review.cons,
        media: mediaUrls,
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('student', 'name profilePic');

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    next(new ErrorResponse('Error updating review', 500));
  }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Student)
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // Make sure student owns review
  const student = await Student.findOne({ user: req.user._id });
  if (!student || review.student.toString() !== student._id.toString()) {
    return next(new ErrorResponse('Not authorized to delete this review', 401));
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
exports.markHelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  const hasMarked = review.helpful.users.includes(req.user._id);
  
  if (hasMarked) {
    // Remove mark
    review.helpful.users.pull(req.user._id);
    review.helpful.count--;
  } else {
    // Add mark
    review.helpful.users.push(req.user._id);
    review.helpful.count++;
  }

  await review.save();

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
exports.reportReview = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  const hasReported = review.reported.users.includes(req.user._id);
  
  if (hasReported) {
    return next(new ErrorResponse('You have already reported this review', 400));
  }

  review.reported.users.push(req.user._id);
  review.reported.count++;
  review.reported.reasons.push({
    user: req.user._id,
    reason
  });

  // If report count exceeds threshold, mark for moderation
  if (review.reported.count >= 5) {
    review.status = 'pending';
  }

  await review.save();

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Update review status (for college admins)
// @route   PUT /api/reviews/:id/status
// @access  Private (College)
exports.updateReviewStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // Make sure college owns the review
  const college = await College.findOne({ user: req.user._id });
  if (!college || review.college.toString() !== college._id.toString()) {
    return next(new ErrorResponse('Not authorized to update this review', 401));
  }

  review.status = status;
  await review.save();

  res.status(200).json({
    success: true,
    data: review
  });
}); 