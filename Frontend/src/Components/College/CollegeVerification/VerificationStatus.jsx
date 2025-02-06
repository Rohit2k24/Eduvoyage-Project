import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaCheckCircle, FaCreditCard, FaSignOutAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './VerificationStatus.css';

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
      const response = await fetch('http://localhost:3000/api/college/initiate-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Initialize Razorpay
        const options = {
          key: process.env.RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
          name: 'EduVoyage',
          description: '2 Months College Listing Payment',
          handler: async (response) => {
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
                  text: 'You can now access your college dashboard',
                  confirmButtonColor: '#3498db'
                }).then(() => {
                  navigate('/college/dashboard');
                });
              }
            } catch (error) {
              Swal.fire({
                icon: 'error',
                title: 'Payment Verification Failed',
                text: error.message,
                confirmButtonColor: '#3498db'
              });
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Payment Initiation Failed',
        text: error.message,
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