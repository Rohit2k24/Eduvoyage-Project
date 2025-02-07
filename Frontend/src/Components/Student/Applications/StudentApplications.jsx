import { useState, useEffect } from 'react';
import { FaFilter, FaSearch, FaDownload } from 'react-icons/fa';
import StudentSidebar from '../Dashboard/StudentSidebar';
import Swal from 'sweetalert2';
import './StudentApplications.css';

const StudentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateRange: 'all'
  });

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

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
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

  const downloadReceipt = async (applicationId) => {
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
      a.download = `application-receipt-${applicationId}.pdf`;
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#f39c12';
      case 'approved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      case 'waitlisted': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filters.status === 'all' || app.status.toLowerCase() === filters.status;
    const matchesSearch = app.course.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         app.course.college.name.toLowerCase().includes(filters.search.toLowerCase());
    
    let matchesDate = true;
    if (filters.dateRange !== 'all') {
      const appDate = new Date(app.createdAt);
      const now = new Date();
      switch (filters.dateRange) {
        case 'week':
          matchesDate = now - appDate <= 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          matchesDate = now - appDate <= 30 * 24 * 60 * 60 * 1000;
          break;
        case 'year':
          matchesDate = now - appDate <= 365 * 24 * 60 * 60 * 1000;
          break;
      }
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <div className="student-applications-layout">
      <StudentSidebar />
      
      <div className="applications-main">
        <div className="applications-header">
          <h1>My Applications</h1>
          
          <div className="filters-section">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search courses or colleges..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>

            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Date Range:</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="no-applications">
            <img src="/empty-applications.svg" alt="No applications" />
            <h2>No Applications Found</h2>
            <p>You haven't applied to any courses yet or no applications match your filters.</p>
          </div>
        ) : (
          <div className="applications-grid">
            {filteredApplications.map(application => (
              <div key={application._id} className="application-card">
                <div className="course-image">
                  <img src={application.course.image || '/default-course.jpg'} alt={application.course.name} />
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(application.status) }}
                  >
                    {application.status}
                  </span>
                </div>
                
                <div className="application-details">
                  <h3>{application.course.name}</h3>
                  <p className="college-name">{application.course.college.name}</p>
                  
                  <div className="application-info">
                    <div className="info-item">
                      <label>Application ID:</label>
                      <span>{application._id}</span>
                    </div>
                    <div className="info-item">
                      <label>Applied On:</label>
                      <span>{new Date(application.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <label>Last Updated:</label>
                      <span>{new Date(application.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {application.status === 'approved' && (
                    <button 
                      className="download-receipt"
                      onClick={() => downloadReceipt(application._id)}
                    >
                      <FaDownload /> Download Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentApplications; 