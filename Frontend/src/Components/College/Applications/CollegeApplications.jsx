import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaSearch, FaFilter, FaClock } from 'react-icons/fa';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import ApplicationStatus from '../../Student/Applications/ApplicationStatus';
import Swal from 'sweetalert2';
import './CollegeApplications.css';
import axios from 'axios';

const CollegeApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:3000/api/college/applications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        // Filter out any invalid applications
        const validApplications = response.data.applications.filter(app => 
          app && app.student && app.course
        );
        setApplications(validApplications);
      } else {
        throw new Error(response.data.message || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setError(error.response?.data?.message || 'Failed to load applications');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to load applications',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      setProcessingIds(prev => new Set([...prev, applicationId]));

      const response = await fetch(`/api/college/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update application status');
      }

      // Update the application in the state
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Application ${newStatus} successfully`,
        confirmButtonColor: '#3498db'
      });
    } catch (error) {
      console.error('Error updating application:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update application status',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const handleApprove = async (applicationId) => {
    try {
      const result = await Swal.fire({
        title: 'Approve Application?',
        text: 'Are you sure you want to approve this application?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!'
      });

      if (result.isConfirmed) {
        setProcessingIds(prev => new Set([...prev, applicationId]));
        
        const response = await axios.put(
          `http://localhost:3000/api/college/applications/${applicationId}/status`,
          {
            status: 'approved'
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          // Update the application in the local state
          setApplications(prevApplications =>
            prevApplications.map(app =>
              app._id === applicationId
                ? { 
                    ...app, 
                    status: 'approved',
                    updatedAt: response.data.data.updatedAt,
                    remarks: response.data.data.remarks
                  }
                : app
            )
          );

          await Swal.fire({
            icon: 'success',
            title: 'Application Approved',
            text: 'The application has been approved successfully.',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    } catch (error) {
      console.error('Approval error:', error);
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to approve application. Please try again.',
        confirmButtonColor: '#3498db'
      });

      // Refresh applications to ensure consistency
      await fetchApplications();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const handleReject = async (applicationId) => {
    try {
      const { value: remarks } = await Swal.fire({
        title: 'Reject Application',
        input: 'textarea',
        inputLabel: 'Reason for rejection',
        inputPlaceholder: 'Enter the reason for rejection...',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        inputValidator: (value) => {
          if (!value) {
            return 'Please enter a reason for rejection';
          }
        }
      });

      if (remarks) {
        setProcessingIds(prev => new Set([...prev, applicationId]));
        
        const response = await axios.put(
          `http://localhost:3000/api/college/applications/${applicationId}/status`,
          {
            status: 'rejected',
            remarks
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          // Update the application in the local state
          setApplications(prevApplications =>
            prevApplications.map(app =>
              app._id === applicationId
                ? {
                    ...app,
                    status: 'rejected',
                    remarks: remarks,
                    updatedAt: response.data.data.updatedAt
                  }
                : app
            )
          );

          await Swal.fire({
            icon: 'success',
            title: 'Application Rejected',
            text: 'The application has been rejected successfully.',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    } catch (error) {
      console.error('Rejection error:', error);
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to reject application. Please try again.',
        confirmButtonColor: '#3498db'
      });

      // Refresh applications to ensure consistency
      await fetchApplications();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const filteredApplications = applications
    .filter(app => {
      if (filter === 'all') return true;
      return app?.status === filter;
    })
    .filter(app => {
      // Add null checks for student and applicationNumber
      const studentName = app?.student?.name?.toLowerCase() || '';
      const appNumber = app?.applicationNumber?.toLowerCase() || '';
      const searchQuery = searchTerm.toLowerCase();
      
      return studentName.includes(searchQuery) || appNumber.includes(searchQuery);
    });

  const renderEducationDetails = (education) => {
    if (!education || !education.qualifications || !Array.isArray(education.qualifications)) {
      return <p>No educational details available</p>;
    }

    return education.qualifications.map((qual, index) => (
      <div key={index} className="education-item">
        <h5>{qual.level || 'Education Level Not Specified'}</h5>
        <div className="info-row">
          <p><strong>Institute:</strong> {qual.institute || 'N/A'}</p>
          <p><strong>Board:</strong> {qual.board || 'N/A'}</p>
          <p><strong>Year:</strong> {qual.yearOfCompletion || 'N/A'}</p>
        </div>
        <div className="info-row">
          <p><strong>Percentage:</strong> {qual.percentage ? `${qual.percentage}%` : 'N/A'}</p>
          {qual.documents && (
            <p>
              <strong>Documents:</strong>
              <a href={qual.documents} target="_blank" rel="noopener noreferrer">View</a>
            </p>
          )}
        </div>
      </div>
    ));
  };

  const renderApplicationCard = (application) => {
    if (!application || !application.student || !application.course) {
      return null;
    }

    const formatDate = (date) => {
      if (!date) return 'N/A';
      try {
        return new Date(date).toLocaleDateString();
      } catch (error) {
        return 'N/A';
      }
    };

    const getStatusDisplay = () => {
      if (application.status === 'paid') {
        return (
          <div className="status-badge status-paid">
            <FaCheckCircle className="status-icon" />
            <span>Paid</span>
          </div>
        );
      } else if (application.status === 'approved') {
        return (
          <div className="status-badge status-approved">
            <FaCheckCircle className="status-icon" />
            <span>Approved</span>
          </div>
        );
      } else if (application.status === 'rejected') {
        return (
          <div className="status-badge status-rejected">
            <FaTimesCircle className="status-icon" />
            <span>Rejected</span>
          </div>
        );
      } else {
        return (
          <div className="status-badge status-pending">
            <FaClock className="status-icon" />
            <span>Pending</span>
          </div>
        );
      }
    };

    const getPaymentStatus = () => {
      if (application.payment?.paid) {
        return (
          <div className="payment-status paid">
            <FaCheckCircle />
            <span>Payment Completed</span>
            <span className="payment-date">({formatDate(application.payment.paidAt)})</span>
          </div>
        );
      } else if (application.status === 'approved') {
        return (
          <div className="payment-status pending">
            <FaClock />
            <span>Payment Pending</span>
          </div>
        );
      }
      return null;
    };

    return (
      <div key={application._id} className="application-card">
        <div className="application-header">
          <h3>{application.student.name || 'Unknown Student'}</h3>
          {getStatusDisplay()}
        </div>

        <div className="application-details">
          <p><strong>Application Number:</strong> {application.applicationNumber || 'N/A'}</p>
          <p><strong>Course:</strong> {application.course.name || 'N/A'}</p>
          <p><strong>Applied Date:</strong> {formatDate(application.createdAt)}</p>
          {getPaymentStatus()}
        </div>

        <div className="student-details">
          <h4>Personal Information</h4>
          <div className="info-row">
            <p><strong>Email:</strong> {application.student.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {application.student.phone || 'N/A'}</p>
            <p><strong>Gender:</strong> {application.student.gender || 'N/A'}</p>
          </div>
          <div className="info-row">
            <p><strong>Date of Birth:</strong> {formatDate(application.student.dateOfBirth)}</p>
            <p><strong>Address:</strong> {application.student.address || 'N/A'}</p>
          </div>

          <h4>Educational Background</h4>
          {renderEducationDetails(application.student.education)}
        </div>

        {application.status === 'pending' && (
          <div className="application-actions">
            <button
              onClick={() => handleApprove(application._id)}
              className="approve-btn"
              disabled={processingIds.has(application._id)}
            >
              {processingIds.has(application._id) ? (
                <><FaSpinner className="spinner" /> Processing...</>
              ) : (
                <><FaCheckCircle /> Approve</>
              )}
            </button>
            <button
              onClick={() => handleReject(application._id)}
              className="reject-btn"
              disabled={processingIds.has(application._id)}
            >
              {processingIds.has(application._id) ? (
                <><FaSpinner className="spinner" /> Processing...</>
              ) : (
                <><FaTimesCircle /> Reject</>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Add this for debugging
  useEffect(() => {
    console.log('Current applications:', applications);
  }, [applications]);

  return (
    <div className="applications-layout">
      <CollegeSidebar />
      
      <div className="applications-main">
        <h1>Student Applications</h1>

        <div className="applications-controls">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by student name or application number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <FaFilter className="filter-icon" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <FaSpinner className="spinner" />
            <p>Loading applications...</p>
          </div>
        ) : error ? (
          <div className="error">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={fetchApplications}>Retry</button>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="no-applications">
            <h2>No Applications Found</h2>
            <p>There are no applications matching your criteria.</p>
          </div>
        ) : (
          <div className="applications-grid">
            {filteredApplications.map(renderApplicationCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeApplications; 