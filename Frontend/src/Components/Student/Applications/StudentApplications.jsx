import { useState, useEffect } from 'react';
import { FaGraduationCap, FaSpinner } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import './StudentApplications.css';

const StudentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/student/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load applications',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async (applicationId) => {
    try {
      const result = await Swal.fire({
        title: 'Cancel Application?',
        text: 'Are you sure you want to cancel this application?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3498db',
        cancelButtonColor: '#e74c3c',
        confirmButtonText: 'Yes, cancel it!'
      });

      if (result.isConfirmed) {
        const response = await fetch(`http://localhost:3000/api/student/applications/${applicationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Application Cancelled',
            text: 'Your application has been cancelled successfully',
            confirmButtonColor: '#3498db'
          });
          fetchApplications(); // Refresh the list
        } else {
          throw new Error('Failed to cancel application');
        }
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to cancel application',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  if (error) {
    return (
      <div className="applications-layout">
        <StudentSidebar />
        <div className="applications-main">
          <h1>My Applications</h1>
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchApplications} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-layout">
      <StudentSidebar />
      
      <div className="applications-main">
        <h1>My Applications</h1>

        {loading ? (
          <div className="loading">
            <FaSpinner className="spinner" />
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="no-applications">
            <FaGraduationCap className="icon" />
            <h2>No Applications Yet</h2>
            <p>Start exploring courses and submit your first application!</p>
          </div>
        ) : (
          <div className="applications-grid">
            {applications.map(application => (
              <div key={application._id} className="application-card">
                <div className="application-header">
                  <h3>{application.course.name}</h3>
                  <span className={`status ${getStatusColor(application.status)}`}>
                    {application.status}
                  </span>
                </div>

                <div className="application-details">
                  <p className="college-name">{application.course.college.name}</p>
                  <p className="application-number">Application #{application.applicationNumber}</p>
                  <p className="date">Applied on: {new Date(application.createdAt).toLocaleDateString()}</p>
                </div>

                {application.status === 'pending' && (
                  <button 
                    onClick={() => handleCancelApplication(application._id)}
                    className="cancel-btn"
                  >
                    Cancel Application
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentApplications; 