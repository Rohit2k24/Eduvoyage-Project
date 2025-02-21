import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaClock, FaCheckCircle, FaTimesCircle, FaDownload, FaCreditCard } from 'react-icons/fa';
import './ApplicationStatus.css';

const ApplicationStatus = ({ status, application, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(
    application?.status === 'paid' || application?.payment?.paid || false
  );

  const getStatusIcon = () => {
    // Get status either from direct prop or from application object
    const currentStatus = application?.status || status;
    
    switch (currentStatus) {
      case 'approved':
        return <FaCheckCircle className="status-icon approved" />;
      case 'rejected':
        return <FaTimesCircle className="status-icon rejected" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  // Only show payment features if we have the full application object
  const showPaymentFeatures = Boolean(application);

  const handlePayment = async () => {
    if (!application) return;

    try {
      setLoading(true);
      
      const orderResponse = await axios.post('/api/student/create-payment', {
        applicationId: application._id
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Order Response:', orderResponse.data);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "EduVoyage",
        description: `Course fee for ${application.course.name}`,
        order_id: orderResponse.data.orderId,
        handler: async (response) => {
          try {
            console.log('Payment Response:', response);
            
            const verifyResponse = await axios.post('/api/student/verify-payment', {
              applicationId: application._id,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            }, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (verifyResponse.data.success) {
              setIsPaid(true); // Update local payment status
              Swal.fire({
                icon: 'success',
                title: 'Payment Successful',
                text: 'Your payment has been processed successfully!'
              });
              if (onPaymentComplete) onPaymentComplete();
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Verification Error',
              text: error.response?.data?.message || 'Failed to verify payment'
            });
          }
        },
        prefill: {
          name: application.student.name,
          email: application.student.user?.email,
          contact: application.student.phone
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

      console.log('Razorpay Options:', { 
        ...options, 
        key: '***' // Hide key in logs
      }); // Debug log

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Payment Error',
        text: error.response?.data?.message || 'Failed to process payment'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update isPaid when application changes
  useEffect(() => {
    setIsPaid(application?.status === 'paid' || application?.payment?.paid || false);
  }, [application]);

  const handleDownloadReceipt = async () => {
    if (!application) return;

    try {
      const response = await axios.get(`/api/student/payment-receipt/${application._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${application.applicationNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to download receipt'
      });
    }
  };

  const showPaymentButton = 
    showPaymentFeatures && 
    application.status === 'approved' && 
    !isPaid;

  return (
    <div className="application-status">
      <div className="status-badge">
        {getStatusIcon()}
        <span>{application?.status === 'paid' ? 'Paid' : (application?.status || status)}</span>
      </div>

      {showPaymentButton && (
        <button 
          className="payment-btn"
          onClick={handlePayment}
          disabled={loading}
        >
          <FaCreditCard />
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      )}

      {isPaid && (
        <button 
          className="receipt-btn"
          onClick={handleDownloadReceipt}
        >
          <FaDownload />
          Download Receipt
        </button>
      )}
    </div>
  );
};

export default ApplicationStatus; 