import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaCheckCircle, FaCreditCard, FaSignOutAlt } from 'react-icons/fa';
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
      const response = await fetch('http://localhost:3000/api/college/verification-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      setStatus(data.status);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching status:', error);
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      console.log('Initiating payment...');
      const response = await fetch('http://localhost:3000/api/college/initiate-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Payment initiation response:', data);

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
          description: '2 Months College Listing Payment',
          handler: async function(response) {
            try {
              console.log('Payment successful, verifying...', response);
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
              console.log('Payment verification response:', verifyData);

              if (verifyData.success) {
                Swal.fire({
                  icon: 'success',
                  title: 'Payment Successful!',
                  text: 'Welcome to EduVoyage! You can now manage your college profile.',
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
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Logged Out Successfully',
      text: 'Thank you for using EduVoyage!',
      confirmButtonColor: '#3498db',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      // Navigate to login page
      navigate('/login');
    });
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
        {status === 'pending' && (
          <>
            <div className="status-icon pending">
              <FaSpinner className="spinner" />
            </div>
            <h2>Verification Pending</h2>
            <p>Your college verification request is under review. We'll notify you once it's approved.</p>
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt className="button-icon" />
              Logout
            </button>
          </>
        )}

        {status === 'approved' && (
          <>
            <div className="status-icon approved">
              <FaCheckCircle />
            </div>
            <h2>Verification Approved!</h2>
            <p>Your college has been verified. Please proceed with the payment to activate your listing.</p>
            <button onClick={handlePayment} className="payment-button">
              <FaCreditCard className="button-icon" />
              Proceed to Payment
            </button>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="status-icon rejected">
              <FaTimes />
            </div>
            <h2>Verification Rejected</h2>
            <p>Your verification request was not approved. Please contact support for more information.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationStatus; 