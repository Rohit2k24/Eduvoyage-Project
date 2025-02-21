import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaSearch, FaFilter } from 'react-icons/fa';
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
      
      const response = await axios.get('/api/college/applications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('API Response:', response.data); // Debug log

      if (response.data.success) {
        setApplications(response.data.applications);
      } else {
        throw new Error(response.data.error || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setError(error.response?.data?.error || 'Failed to load applications');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to load applications',
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
        
        const response = await axios.put(`/api/college/applications/${applicationId}/status`, {
          status: 'approved'
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Application Approved',
            text: 'The application has been approved successfully.',
            showConfirmButton: false,
            timer: 1500
          });
          await fetchApplications();
        }
      }
    } catch (error) {
      console.error('Approval error:', error.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to approve application'
      });
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
        
        const response = await axios.put(`/api/college/applications/${applicationId}/status`, {
          status: 'rejected',
          remarks
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Application Rejected',
            text: 'The application has been rejected successfully.',
            showConfirmButton: false,
            timer: 1500
          });
          await fetchApplications(); // Refresh the applications list
        }
      }
    } catch (error) {
      console.error('Rejection error:', error.response?.data || error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to reject application'
      });
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

  const renderApplicationCard = (application) => {
    // For debugging
    console.log('Rendering application:', {
      id: application._id,
      student: application.student,
      course: application.course
    });

    return (
      <div key={application._id} className="application-card">
        <div className="application-header">
          <h3>{application?.student?.name || 'Unknown Student'}</h3>
          <ApplicationStatus status={application?.status || 'pending'} />
        </div>

        <div className="application-details">
          <p><strong>Application Number:</strong> {application?.applicationNumber || 'N/A'}</p>
          <p><strong>Course:</strong> {application?.course?.name || 'N/A'}</p>
          <p><strong>Applied Date:</strong> {application?.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>

        <div className="student-details">
          <h4>Student Details</h4>
          <div className="info-row">
            <div className="info-item">
              <p><strong>Name:</strong> {application?.student?.name || 'N/A'}</p>
            </div>
            <div className="info-item">
              <p><strong>Email:</strong> {application?.student?.user?.email || 'N/A'}</p>
            </div>
            <div className="info-item">
              <p><strong>Phone:</strong> {application?.student?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {application?.status === 'pending' && (
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