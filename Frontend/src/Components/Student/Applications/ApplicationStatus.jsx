import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaClock, FaCheckCircle, FaTimesCircle, FaDownload, FaCreditCard } from 'react-icons/fa';
import './ApplicationStatus.css';

const ApplicationStatus = ({ application, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(
    application?.status === 'paid' || application?.payment?.paid || false
  );

  const getStatusIcon = () => {
    switch (application?.status) {
      case 'approved':
        return <FaCheckCircle className="status-icon approved" />;
      case 'rejected':
        return <FaTimesCircle className="status-icon rejected" />;
      case 'paid':
        return <FaCheckCircle className="status-icon paid" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  const getStatusClass = () => {
    switch (application?.status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'paid':
        return 'status-paid';
      default:
        return 'status-pending';
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const verifyResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/verify-payment`,
        {
          applicationId: application._id,
          paymentId: paymentData.razorpay_payment_id,
          orderId: paymentData.razorpay_order_id,
          signature: paymentData.razorpay_signature
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (verifyResponse.data.success) {
        setIsPaid(true);
        // Update the application status immediately
        const updatedApplication = verifyResponse.data.data.application;
        if (onPaymentComplete) {
          await onPaymentComplete(application._id, updatedApplication);
        }
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful',
          text: 'Your payment has been processed successfully!'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Payment verification error:', error);
      // Check if the error is due to notification creation
      if (error.response?.status === 500 && error.response?.data?.message?.includes('Notification')) {
        // Payment was successful but notification failed
        setIsPaid(true);
        if (onPaymentComplete) {
          await onPaymentComplete(application._id);
        }
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful',
          text: 'Your payment has been processed successfully!'
        });
        return true;
      }
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!application) return;

    try {
      setLoading(true);
      
      const orderResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/create-payment`,
        { applicationId: application._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "EduVoyage",
        description: `Course fee for ${application.course.name}`,
        order_id: orderResponse.data.orderId,
        handler: async function(response) {
          try {
            await verifyPayment(response);
          } catch (error) {
            console.error('Payment verification error:', error);
            if (!isPaid) {
              await Swal.fire({
                icon: 'warning',
                title: 'Payment Status Unclear',
                text: 'Your payment might have been successful. Please wait a moment and refresh the page. If the issue persists, please contact support.',
                confirmButtonText: 'Refresh Page',
                showCancelButton: true,
                cancelButtonText: 'Close'
              }).then((result) => {
                if (result.isConfirmed) {
                  window.location.reload();
                }
              });
            }
          }
        },
        prefill: {
          name: application.student?.name,
          email: application.student?.email,
          contact: application.student?.phone
        },
        theme: {
          color: "#3498db"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Payment Error',
        text: error.response?.data?.message || 'Failed to process payment'
      });
    }
  };

  useEffect(() => {
    setIsPaid(application?.status === 'paid' || application?.payment?.paid || false);
  }, [application]);

  return (
    <div className="application-status">
      <div className={`status-badge ${getStatusClass()}`}>
        {getStatusIcon()}
        <span>{application?.status === 'paid' ? 'Paid' : application?.status}</span>
      </div>

      {application?.status === 'approved' && !isPaid && (
        <button 
          className="payment-btn"
          onClick={handlePayment}
          disabled={loading}
        >
          <FaCreditCard />
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      )}

      {/* {isPaid && (
        <button 
          className="receipt-btn"
          onClick={() => window.open(`http://localhost:3000/api/student/applications/${application._id}/receipt`, '_blank')}
        >
          <FaDownload />
          Download Receiptssss
        </button>
      )} */}
    </div>
  );
};

export default ApplicationStatus; 