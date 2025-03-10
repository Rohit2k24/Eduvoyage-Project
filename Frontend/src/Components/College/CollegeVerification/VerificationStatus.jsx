import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaCheckCircle, FaCreditCard, FaSignOutAlt, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './VerificationStatus.css';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

const VerificationStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/api/college/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch verification status');
      }

      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
        
        // If both verification and payment are completed, redirect to dashboard
        if (data.status.verificationStatus === 'approved' && 
            data.status.paymentStatus === 'completed') {
          navigate('/college/dashboard');
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch verification status'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      Swal.fire({
        title: 'Processing...',
        text: 'Initiating payment',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch('http://localhost:3000/api/college/initiate-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      Swal.close();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate payment');
      }

      if (data.success) {
        const options = {
          key: RAZORPAY_KEY,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
          name: 'EduVoyage',
          description: 'College Registration Payment',
          handler: async function(response) {
            try {
              const verifyResponse = await fetch('http://localhost:3000/api/college/verify-payment', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                Swal.fire({
                  icon: 'success',
                  title: 'Payment Successful!',
                  text: 'Welcome to EduVoyage! You can now access your college dashboard.',
                  confirmButtonColor: '#3498db'
                }).then(() => {
                  navigate('/college/dashboard');
                });
              } else {
                throw new Error(verifyData.message);
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              Swal.fire({
                icon: 'error',
                title: 'Payment Verification Failed',
                text: 'Please contact support if amount was deducted',
                confirmButtonColor: '#3498db'
              });
            }
          },
          prefill: {
            email: localStorage.getItem('userEmail'),
          },
          theme: {
            color: '#3498db'
          }
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Payment Initiation Failed',
        text: error.message || 'Unable to start payment process',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="verification-status-container">
        <div className="status-box loading">
          <FaSpinner className="spinner" />
          <p>Loading status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-status-container">
      <div className="status-box">
        {status?.verificationStatus === 'pending' && (
          <>
            <div className="status-icon pending">
              <FaExclamationTriangle />
            </div>
            <h2>Verification Pending</h2>
            <p>Your college verification request is under review. We'll notify you once it's approved.</p>
            <p className="sub-text">This usually takes 1-2 business days.</p>
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt className="button-icon" />
              Logout
            </button>
          </>
        )}

        {status?.verificationStatus === 'approved' && status?.paymentStatus === 'pending' && (
          <>
            <div className="status-icon approved">
              <FaCheckCircle />
            </div>
            <h2>Verification Approved!</h2>
            <p>Your college has been verified. Please proceed with the payment to activate your listing.</p>
            <p className="payment-info">Registration Fee: ₹200</p>
            <button onClick={handlePayment} className="payment-button">
              <FaCreditCard className="button-icon" />
              Proceed to Payment
            </button>
          </>
        )}

        {status?.verificationStatus === 'rejected' && (
          <>
            <div className="status-icon rejected">
              <FaTimes />
            </div>
            <h2>Verification Rejected</h2>
            <p className="rejection-reason">{status.rejectionReason || 'Your verification request was not approved.'}</p>
            <p className="support-text">Please contact our support team for assistance:</p>
            <a href="mailto:support@eduvoyage.com" className="support-email">support@eduvoyage.com</a>
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt className="button-icon" />
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationStatus; 