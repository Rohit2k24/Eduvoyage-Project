const Razorpay = require('razorpay');
const crypto = require('crypto');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Notification = require('../models/Notification');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create payment order
exports.createPayment = asyncHandler(async (req, res, next) => {
  const { applicationId } = req.body;

  const application = await Application.findById(applicationId)
    .populate('course', 'name fees');

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  if (application.status !== 'approved') {
    return next(new ErrorResponse('Application is not approved', 400));
  }

  if (application.payment?.paid) {
    return next(new ErrorResponse('Payment already completed', 400));
  }

  const options = {
    amount: application.course.fees * 100, // amount in smallest currency unit
    currency: "INR",
    receipt: `rcpt_${applicationId}`,
    notes: {
      applicationId: applicationId,
      courseName: application.course.name
    }
  };

  const order = await razorpay.orders.create(options);

  // Create payment record
  const payment = await Payment.create({
    application: applicationId,
    student: application.student,
    course: application.course._id,
    amount: application.course.fees,
    orderId: order.id,
    status: 'pending'
  });

  res.status(200).json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency
  });
});

// Verify payment
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { applicationId, paymentId, orderId, signature } = req.body;

  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== signature) {
    return next(new ErrorResponse('Invalid payment signature', 400));
  }

  try {
    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId },
      {
        status: 'completed',
        paymentId,
        paidAt: Date.now()
      },
      { new: true }
    );

    // Update application status and payment details
    const application = await Application.findByIdAndUpdate(
      applicationId,
      {
        status: 'paid',
        payment: {
          paid: true,
          paidAt: Date.now(),
          amount: payment.amount,
          transactionId: paymentId,
          orderId: orderId
        }
      },
      { new: true }
    ).populate({
      path: 'student',
      populate: { path: 'user' }
    }).populate('course');

    // Create notification with correct fields
    try {
      await Notification.create({
        recipient: application.student.user._id, // Using user ID instead of student ID
        title: 'Payment Successful',
        message: `Your payment for ${application.course.name} has been received. You can now download your receipt.`,
        type: 'payment',  // Changed from payment_success to match enum
        relatedDocument: application._id,
        documentModel: 'Application'
      });
    } catch (notificationError) {
      console.log('Notification creation failed:', notificationError);
      // Don't throw error, continue with payment success
    }

    res.status(200).json({
      success: true,
      data: {
        payment,
        application: {
          _id: application._id,
          status: application.status,
          payment: application.payment
        }
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return next(new ErrorResponse('Error processing payment verification', 500));
  }
});

// Generate receipt
exports.generateReceipt = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate('student course payment');

  if (!application || !application.payment?.paid) {
    return next(new ErrorResponse('Receipt not available', 404));
  }

  // Generate PDF receipt using a library like PDFKit
  // ... PDF generation code ...

  res.status(200).json({
    success: true,
    receiptUrl: `receipts/${application.payment.id}.pdf`
  });
}); 