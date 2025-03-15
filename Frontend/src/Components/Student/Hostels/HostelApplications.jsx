import React, { useState, useEffect } from 'react';
import {
  FaBed,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaRupeeSign,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaMoneyBill
} from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import StudentSidebar from '../Sidebar/StudentSidebar';
import './HostelApplications.css';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
  });
};

const HostelApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
    loadRazorpayScript();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:3000/api/hostel/student/applications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log("Full API Response:", response);
      
      if (response.data.success) {
        const applicationData = response.data.data;
        console.log("Application Data:", applicationData);
        setApplications(applicationData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.response?.data?.message || error.message || 'Error fetching applications');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Failed to load applications'
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (application, paymentData) => {
    try {
      const verifyResponse = await axios.post(
        `http://localhost:3000/api/hostel/applications/${application._id}/verify-payment`,
        {
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_signature: paymentData.razorpay_signature,
          amount: paymentData.amount
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (verifyResponse.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful',
          text: 'Your hostel payment has been processed successfully!'
        });
        await fetchApplications(); // Refresh the applications list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Payment verification error:', error);
      if (error.response?.status === 500 && error.response?.data?.message?.includes('Notification')) {
        // Payment was successful but notification failed
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful',
          text: 'Your payment has been processed successfully!'
        });
        await fetchApplications();
        return true;
      }
      throw error;
    }
  };

  const handlePayment = async (application) => {
    try {
      setLoading(true);
      
      const orderResponse = await axios.post(
        `http://localhost:3000/api/hostel/applications/${application._id}/create-payment`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create payment order');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.data.amount,
        currency: orderResponse.data.data.currency,
        name: "EduVoyage",
        description: `Hostel fee for ${application.hostel.name} - ${application.roomType} room`,
        order_id: orderResponse.data.data.orderId,
        handler: async function(response) {
          try {
            await verifyPayment(application, {
              ...response,
              amount: orderResponse.data.data.amount
            });
          } catch (error) {
            console.error('Payment verification error:', error);
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
        },
        prefill: {
          name: application.student?.name,
          email: application.student?.email,
          contact: application.student?.phone
        },
        theme: {
          color: "#10b981"
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

  const handleCancelApplication = async (applicationId) => {
    try {
      const result = await Swal.fire({
        title: 'Cancel Application',
        text: 'Are you sure you want to cancel this hostel application?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, cancel it',
        cancelButtonText: 'No, keep it',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            const response = await axios.put(
              `http://localhost:3000/api/hostel/applications/${applicationId}/cancel`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );

            if (response.data.success) {
              return response.data;
            }
            throw new Error(response.data.message || 'Cancellation failed');
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.message || error.message || 'Failed to cancel application'
            );
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      });

      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Application Cancelled',
          text: 'Your hostel application has been cancelled successfully!'
        });
        fetchApplications();
      }
    } catch (error) {
      console.error('Error cancelling application:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Failed to cancel application'
      });
    }
  };

  const getStatusDisplay = (status, payment) => {
    if (payment.status === 'completed') {
      return (
        <div className="status-badge status-paid">
          <FaCheckCircle className="status-icon" />
          <span>Paid</span>
        </div>
      );
    } else if (status === 'pending_payment' || payment?.status === 'pending') {
      return (
        <div className="status-badge status-pending">
          <FaMoneyBill className="status-icon" />
          <span>Payment Pending</span>
        </div>
      );
    } else if (status === 'cancelled') {
      return (
        <div className="status-badge status-cancelled">
          <FaTimesCircle className="status-icon" />
          <span>Cancelled</span>
        </div>
      );
    } else if (payment?.status === 'failed') {
      return (
        <div className="status-badge status-failed">
          <FaTimesCircle className="status-icon" />
          <span>Payment Failed</span>
        </div>
      );
    } else {
      return (
        <div className="status-badge status-pending">
          <FaClock className="status-icon" />
          <span>Processing</span>
        </div>
      );
    }
  };

  const renderApplicationCard = (application) => {
    if (!application || !application.hostel) return null;

    const { hostel, status, roomType, applicationNumber, createdAt, payment } = application;
    const selectedRoom = hostel.roomTypes?.find(room => room.type === roomType) || {};

    return (
      <div key={application._id} className="application-card">
        <div className="application-header">
          <div className="hostel-image">
            {hostel.images && hostel.images.length > 0 ? (
              <img src={hostel.images[0]} alt={hostel.name} />
            ) : (
              <FaBed className="default-hostel-icon" />
            )}
          </div>
          <div className="application-info">
            <div className="application-title">
              <h3>{hostel.name || 'Unnamed Hostel'}</h3>
              {getStatusDisplay(status, payment)}
            </div>
            <p className="application-number">Application #{applicationNumber || 'N/A'}</p>
            <p className="application-date">
              Applied on {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <div className="application-details">
          <div className="detail-row">
            <div className="detail-item">
              <FaBed />
              <div>
                <span className="label">Room Type</span>
                <span className="value">{roomType || 'N/A'}</span>
              </div>
            </div>
            <div className="detail-item">
              <FaRupeeSign />
              <div>
                <span className="label">Price</span>
                <span className="value">₹{selectedRoom.price || 0}/month</span>
              </div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-item">
              <FaMapMarkerAlt />
              <div>
                <span className="label">Location</span>
                <span className="value">{hostel.location?.address || 'Address not available'}</span>
              </div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-item">
              <FaPhone />
              <div>
                <span className="label">Warden Contact</span>
                <span className="value">{hostel.wardenContact?.phone || 'Not available'}</span>
              </div>
            </div>
            {hostel.wardenContact?.email && (
              <div className="detail-item">
                <FaEnvelope />
                <div>
                  <span className="label">Warden Email</span>
                  <span className="value">{hostel.wardenContact.email}</span>
                </div>
              </div>
            )}
          </div>

          {(status === 'pending_payment' || payment?.status === 'pending' || payment?.status === 'failed') && (
            <div className="application-actions">
              <button
                className="pay-btn"
                onClick={() => handlePayment(application)}
              >
                <FaMoneyBill /> {payment?.status === 'failed' ? 'Retry Payment' : 'Pay Now'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => handleCancelApplication(application._id)}
              >
                <FaTimesCircle /> Cancel Application
              </button>
            </div>
          )}

          {status === 'paid' && payment?.status === 'completed' && (
            <div className="success-message">
              <FaCheckCircle />
              <p>Payment completed! Your hostel room is confirmed.</p>
              {payment && (
                <div className="payment-details">
                  <p><strong>Transaction ID:</strong> {payment.transactionId}</p>
                  <p><strong>Paid Amount:</strong> ₹{payment.amount}</p>
                  <p><strong>Payment Date:</strong> {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}</p>
                  <p><strong>Payment Status:</strong> {payment.status}</p>
                </div>
              )}
            </div>
          )}

          {payment?.status === 'failed' && (
            <div className="error-message payment-failed">
              <FaTimesCircle />
              <p>Payment failed. Please try again.</p>
            </div>
          )}

          {status === 'cancelled' && (
            <div className="cancelled-message">
              <FaTimesCircle />
              <p>Application cancelled</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="student-layout">
      <StudentSidebar />
      <div className="student-content">
        <div className="hostel-applications">
          <div className="header">
            <h1><FaBed /> My Hostel Applications</h1>
          </div>

          {error && (
            <div className="error-message">
              <FaTimesCircle />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="loading">
              <FaSpinner className="spinner" />
              <p>Loading applications...</p>
            </div>
          ) : (
            <div className="applications-grid">
              {Array.isArray(applications) && applications.length > 0 ? (
                applications.map((application) => (
                  application && renderApplicationCard(application)
                ))
              ) : (
                <div className="no-applications">
                  <FaBed className="empty-icon" />
                  <h3>No Applications Found</h3>
                  <p>You haven't applied for any hostels yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostelApplications; 