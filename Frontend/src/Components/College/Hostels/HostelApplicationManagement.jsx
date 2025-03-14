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
  FaUser,
  FaFilter,
  FaSearch,
  FaGraduationCap,
  FaMoneyBill,
  FaReceipt
} from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import './HostelApplicationManagement.css';

const HostelApplicationManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    hostel: 'all',
    searchQuery: ''
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/hostel/applications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log(response.data);
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.response?.data?.message || 'Error fetching applications');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to load applications'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      let remarks = '';
      if (newStatus === 'rejected') {
        const { value: text } = await Swal.fire({
          title: 'Rejection Reason',
          input: 'textarea',
          inputLabel: 'Please provide a reason for rejection',
          inputPlaceholder: 'Type your reason here...',
          inputAttributes: {
            'aria-label': 'Type your reason here'
          },
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value) {
              return 'You need to provide a reason for rejection!';
            }
          }
        });

        if (!text) return;
        remarks = text;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/hostel/applications/${applicationId}`,
        {
          status: newStatus,
          remarks
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `Application has been ${newStatus}`
        });
        fetchApplications();
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update application status'
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FaCheckCircle className="status-icon approved" />;
      case 'rejected':
        return <FaTimesCircle className="status-icon rejected" />;
      case 'cancelled':
        return <FaTimesCircle className="status-icon cancelled" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  const getPaymentStatusBadge = (application) => {
    if (!application.payment) {
      return (
        <div className="status-badge payment-pending">
          <FaMoneyBill />
          Payment Pending
        </div>
      );
    }

    return (
      <div className="status-badge payment-completed">
        <FaCheckCircle />
        Payment Completed
      </div>
    );
  };

  const filteredApplications = applications.filter(application => {
    if (filters.status !== 'all' && application.status !== filters.status) {
      return false;
    }

    if (filters.hostel !== 'all' && application.hostel._id !== filters.hostel) {
      return false;
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        application.student.name.toLowerCase().includes(query) ||
        application.hostel.name.toLowerCase().includes(query) ||
        application.applicationNumber.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const renderApplicationCard = (application) => {
    const { student, hostel, status, roomType, applicationNumber, createdAt, payment } = application;
    const selectedRoom = hostel.roomTypes.find(room => room.type === roomType);

    return (
      <div key={application._id} className="application-card">
        <div className="application-header">
          <div className="student-info">
            <div className="student-avatar">
              {student.avatar ? (
                <img src={student.avatar} alt={student.name} />
              ) : (
                <FaUser className="default-avatar" />
              )}
            </div>
            <div>
              <h3>{student.name}</h3>
              <p className="student-email">{student.email}</p>
              <p className="student-phone">{student.phone}</p>
            </div>
          </div>
          <div className="application-meta">
            <div className="status-badges">
              <div className={`status-badge ${status}`}>
                {getStatusIcon(status)}
                {getStatusText(status)}
              </div>
              {getPaymentStatusBadge(application)}
            </div>
            <p className="application-number">Application #{applicationNumber}</p>
            <p className="application-date">
              Applied on {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="application-details">
          <div className="application-status-section">
            <h4><FaReceipt /> Application Status</h4>
            <div className="status-timeline">
              <div className="timeline-item">
                <div className={`timeline-icon ${status !== 'cancelled' ? 'completed' : 'cancelled'}`}>
                  <FaClock />
                </div>
                <div className="timeline-content">
                  <h5>Application Submitted</h5>
                  <p>{new Date(createdAt).toLocaleString()}</p>
                </div>
              </div>
              {payment && (
                <div className="timeline-item">
                  <div className="timeline-icon completed">
                    <FaMoneyBill />
                  </div>
                  <div className="timeline-content">
                    <h5>Payment Completed</h5>
                    <p>{new Date(payment.createdAt).toLocaleString()}</p>
                    <div className="payment-details">
                      <p><strong>Transaction ID:</strong> {payment.transactionId}</p>
                      <p><strong>Amount Paid:</strong> ₹{payment.amount}</p>
                    </div>
                  </div>
                </div>
              )}
              {status !== 'pending' && (
                <div className="timeline-item">
                  <div className={`timeline-icon ${status}`}>
                    {getStatusIcon(status)}
                  </div>
                  <div className="timeline-content">
                    <h5>{getStatusText(status)}</h5>
                    <p>{application.updatedAt ? new Date(application.updatedAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="student-details-section">
            <h4><FaUser /> Student Details</h4>
            <div className="details-grid">
              <div className="detail-item">
                <label>Full Name</label>
                <p>{student.name}</p>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <p>{student.email}</p>
              </div>
              <div className="detail-item">
                <label>Phone</label>
                <p>{student.phone}</p>
              </div>
              <div className="detail-item">
                <label>Gender</label>
                <p>{student.gender || 'N/A'}</p>
              </div>
              <div className="detail-item">
                <label>Date of Birth</label>
                <p>{new Date(student.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div className="detail-item">
                <label>Address</label>
                <p>{student.address || 'N/A'}</p>
              </div>
              {/* <div className="detail-item">
                <label>Emergency Contact</label>
                <p>{student.emergencyContact || 'N/A'}</p>
              </div> */}
            </div>
          </div>

          <div className="hostel-details">
            <h4><FaBed /> Hostel Details</h4>
            <div className="detail-row">
              <div className="detail-item">
                <FaBed />
                <div>
                  <span className="label">Hostel</span>
                  <span className="value">{hostel.name}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaBed />
                <div>
                  <span className="label">Room Type</span>
                  <span className="value">{roomType}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaRupeeSign />
                <div>
                  <span className="label">Price</span>
                  <span className="value">₹{selectedRoom.price}/month</span>
                </div>
              </div>
            </div>
          </div>

          {student.education && (
            <div className="education-details">
              <h4><FaGraduationCap /> Educational Background</h4>
              <div className="education-grid">
                {student.education.qualifications?.map((qual, index) => (
                  <div key={index} className="education-item">
                    <h5>{qual.level}</h5>
                    <p><strong>Institute:</strong> {qual.institute}</p>
                    <p><strong>Board:</strong> {qual.board}</p>
                    <p><strong>Year:</strong> {qual.yearOfCompletion}</p>
                    <p><strong>Percentage:</strong> {qual.percentage}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="application-actions">
              <button
                className="approve-btn"
                onClick={() => handleUpdateStatus(application._id, 'approved')}
                disabled={!payment}
              >
                <FaCheckCircle /> Approve
              </button>
              <button
                className="reject-btn"
                onClick={() => handleUpdateStatus(application._id, 'rejected')}
              >
                <FaTimesCircle /> Reject
              </button>
            </div>
          )}

          {status === 'rejected' && application.remarks && (
            <div className="rejection-message">
              <FaTimesCircle />
              <p><strong>Rejection Reason:</strong> {application.remarks}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const uniqueHostels = [...new Set(applications.map(app => app.hostel._id))];

  if (loading) {
    return (
      <>
        <CollegeSidebar />
        <div className="loading">
          <FaSpinner className="spinner" />
          <p>Loading applications...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <CollegeSidebar />
      <div className="hostel-application-management">
        <div className="header">
          <h1><FaBed /> Hostel Applications</h1>
          
          <div className="header-controls">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search applications..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
            </div>

            <div className="filters">
              <div className="filter-group">
                <FaFilter />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="filter-group">
                <FaBed />
                <select
                  value={filters.hostel}
                  onChange={(e) => setFilters(prev => ({ ...prev, hostel: e.target.value }))}
                >
                  <option value="all">All Hostels</option>
                  {uniqueHostels.map(hostelId => {
                    const hostel = applications.find(app => app.hostel._id === hostelId).hostel;
                    return (
                      <option key={hostelId} value={hostelId}>
                        {hostel.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="applications-grid">
          {filteredApplications.length > 0 ? (
            filteredApplications.map(renderApplicationCard)
          ) : (
            <div className="no-applications">
              <FaBed />
              <h3>No Applications Found</h3>
              <p>There are no applications matching your filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HostelApplicationManagement; 