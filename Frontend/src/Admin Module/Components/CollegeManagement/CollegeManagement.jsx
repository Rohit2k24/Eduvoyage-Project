import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaSearch, FaSort } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './CollegeManagement.css';

const CollegeManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/colleges', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setColleges(data.colleges);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setLoading(false);
    }
  };

  const handleViewDetails = (college) => {
    setSelectedCollege(college);
  };

  const handleApprove = async (collegeId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/colleges/${collegeId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'College Approved',
          text: 'The college has been successfully approved.',
          confirmButtonColor: '#3498db'
        });
        fetchColleges();
      }
    } catch (error) {
      console.error('Error approving college:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to approve college',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const handleReject = async (collegeId) => {
    try {
      const { value: reason } = await Swal.fire({
        title: 'Rejection Reason',
        input: 'textarea',
        inputLabel: 'Please provide a reason for rejection',
        inputPlaceholder: 'Enter reason here...',
        confirmButtonColor: '#3498db',
        showCancelButton: true
      });

      if (reason) {
        const response = await fetch(`http://localhost:3000/api/admin/colleges/${collegeId}/reject`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'College Rejected',
            text: 'The college has been rejected.',
            confirmButtonColor: '#3498db'
          });
          fetchColleges();
        }
      }
    } catch (error) {
      console.error('Error rejecting college:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to reject college',
        confirmButtonColor: '#3498db'
      });
    }
  };

  return (
    <div className="college-management">
      <header className="management-header">
        <h1>College Management</h1>
        <div className="controls">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search colleges..." />
          </div>
          <div className="filter-controls">
            <button className="filter-btn">
              <FaSort /> Sort By
            </button>
          </div>
        </div>
      </header>

      <div className="college-grid">
        {colleges.map(college => (
          <div className="college-card" key={college._id}>
            <div className="card-header">
              <h3>{college.name}</h3>
              <span className={`status ${college.verificationStatus}`}>
                {college.verificationStatus}
              </span>
            </div>
            
            <div className="card-body">
              <div className="info-row">
                <label>University:</label>
                <p>{college.university}</p>
              </div>
              <div className="info-row">
                <label>Location:</label>
                <p>{college.address}</p>
              </div>
            </div>

            <div className="card-actions">
              <button 
                className="action-btn view"
                onClick={() => handleViewDetails(college)}
              >
                <FaEye /> Details
              </button>
              {college.verificationStatus === 'pending' && (
                <div className="approval-buttons">
                  <button 
                    className="action-btn approve"
                    onClick={() => handleApprove(college._id)}
                  >
                    <FaCheck /> Approve
                  </button>
                  <button 
                    className="action-btn reject"
                    onClick={() => handleReject(college._id)}
                  >
                    <FaTimes /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCollege && (
        <div className="college-details-modal">
          <div className="modal-content">
            <h3>{selectedCollege.name}</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Description</label>
                <p>{selectedCollege.description}</p>
              </div>
              <div className="detail-item">
                <label>Contact Email</label>
                <p>{selectedCollege.contactEmail}</p>
              </div>
              <div className="detail-item">
                <label>Phone</label>
                <p>{selectedCollege.phoneNumber}</p>
              </div>
              <div className="detail-item">
                <label>Facilities</label>
                <p>{selectedCollege.facilities}</p>
              </div>
              <div className="detail-item">
                <label>Courses</label>
                <p>{selectedCollege.courses}</p>
              </div>
            </div>

            <div className="documents-section">
              <h4>Documents</h4>
              <div className="documents-grid">
                {selectedCollege.documents.registrationCertificate && (
                  <div className="document-item">
                    <label>Registration Certificate</label>
                    <a href={selectedCollege.documents.registrationCertificate} target="_blank" rel="noopener noreferrer">
                      View Document
                    </a>
                  </div>
                )}
                {selectedCollege.documents.accreditationCertificate && (
                  <div className="document-item">
                    <label>Accreditation Certificate</label>
                    <a href={selectedCollege.documents.accreditationCertificate} target="_blank" rel="noopener noreferrer">
                      View Document
                    </a>
                  </div>
                )}
                {selectedCollege.documents.collegeLogo && (
                  <div className="document-item">
                    <label>College Logo</label>
                    <img src={selectedCollege.documents.collegeLogo} alt="College Logo" />
                  </div>
                )}
              </div>

              {selectedCollege.documents.collegeImages && (
                <div className="college-images">
                  <h4>College Images</h4>
                  <div className="images-grid">
                    {selectedCollege.documents.collegeImages.map((image, index) => (
                      <img key={index} src={image} alt={`College Image ${index + 1}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="close-modal" onClick={() => setSelectedCollege(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeManagement; 