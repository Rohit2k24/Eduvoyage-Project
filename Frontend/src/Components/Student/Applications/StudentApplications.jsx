import { useState, useEffect } from 'react';
import { FaGraduationCap, FaSpinner, FaDownload, FaEye } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import ApplicationStatus from './ApplicationStatus';
import Swal from 'sweetalert2';
import './StudentApplications.css';

const StudentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingIds, setCancellingIds] = useState(new Set());

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/student/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      console.log('Applications data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch applications');
      }

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
        text: 'Are you sure you want to cancel this application? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3498db',
        cancelButtonColor: '#e74c3c',
        confirmButtonText: 'Yes, cancel it!',
        cancelButtonText: 'No, keep it'
      });

      if (result.isConfirmed) {
        setCancellingIds(prev => new Set([...prev, applicationId]));
        setLoading(true);
        console.log('Cancelling application:', applicationId);

        const response = await fetch(`http://localhost:3000/api/student/applications/${applicationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('Cancel response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to cancel application');
        }

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Application Cancelled',
          text: data.message || 'Your application has been cancelled successfully',
          confirmButtonColor: '#3498db'
        });

        // Remove the cancelled application from state
        setApplications(prevApplications => 
          prevApplications.filter(app => app._id !== applicationId)
        );
      }
    } catch (error) {
      console.error('Error cancelling application:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to cancel application',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (applicationId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/student/applications/${applicationId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `application-${applicationId}-receipt.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to download receipt',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const renderApplicationCard = (application) => (
    <div key={application._id} className="application-card">
      <div className="application-header">
        <h3>{application.course?.name}</h3>
        <ApplicationStatus status={application.status} />
      </div>

      <div className="application-details">
        <p className="college-name">{application.course?.college?.name}</p>
        <p className="application-number">Application #{application.applicationNumber}</p>
        <p className="date">Applied on: {new Date(application.createdAt).toLocaleDateString()}</p>
        
        <div className="course-info">
          <p>Duration: {application.course?.duration} years</p>
          <p>Fees: ₹{application.course?.fees?.toLocaleString()}</p>
        </div>
      </div>

      <div className="application-actions">
        {application.status === 'pending' && (
          <button 
            onClick={() => handleCancelApplication(application._id)}
            className="cancel-btn"
            disabled={cancellingIds.has(application._id)}
          >
            {cancellingIds.has(application._id) ? (
              <>
                <FaSpinner className="spinner" />
                Cancelling...
              </>
            ) : (
              'Cancel Application'
            )}
          </button>
        )}
        
        {application.status === 'approved' && (
          <button 
            onClick={() => handleDownloadReceipt(application._id)}
            className="download-btn"
            disabled={loading}
          >
            <FaDownload /> Download Receipt
          </button>
        )}
      </div>
    </div>
  );

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
            {applications.map(renderApplicationCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentApplications; 