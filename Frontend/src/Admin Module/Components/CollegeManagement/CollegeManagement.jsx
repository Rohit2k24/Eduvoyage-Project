import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';
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
      <h2>College Management</h2>
      
      <div className="college-list">
        {loading ? (
          <div className="loading">Loading colleges...</div>
        ) : (
          <table className="college-table">
            <thead>
              <tr>
                <th>College Name</th>
                <th>University</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map(college => (
                <tr key={college._id}>
                  <td>{college.name}</td>
                  <td>{college.university}</td>
                  <td>{college.address}</td>
                  <td>
                    <span className={`status-badge ${college.verificationStatus}`}>
                      {college.verificationStatus}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="action-btn view"
                      onClick={() => handleViewDetails(college)}
                    >
                      <FaEye />
                    </button>
                    {college.verificationStatus === 'pending' && (
                      <>
                        <button 
                          className="action-btn approve"
                          onClick={() => handleApprove(college._id)}
                        >
                          <FaCheck />
                        </button>
                        <button 
                          className="action-btn reject"
                          onClick={() => handleReject(college._id)}
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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