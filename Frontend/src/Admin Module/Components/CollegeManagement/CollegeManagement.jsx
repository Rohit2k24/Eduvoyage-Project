import { useState, useEffect } from 'react';
import { FaUniversity, FaSearch, FaEdit, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import Sidebar from '../Sidebar/Sidebar';
import Swal from 'sweetalert2';
import './CollegeManagement.css';

const CollegeManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    university: '',
    location: '',
    contactEmail: '',
    phoneNumber: ''
  });

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
      if (data.success) {
        setColleges(data.colleges);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setLoading(false);
    }
  };

  const handleViewDetails = async (collegeId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/colleges/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedCollege(data.data);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error fetching college details:', error);
    }
  };

  const handleEdit = (college) => {
    setEditData({
      name: college.name,
      university: college.university,
      location: college.location,
      contactEmail: college.contactEmail,
      phoneNumber: college.phoneNumber
    });
    setSelectedCollege(college);
    setEditMode(true);
  };

  const handleUpdateStatus = async (collegeId, newStatus) => {
    try {
      let confirmResult;
      
      if (newStatus === 'approved') {
        confirmResult = await Swal.fire({
          title: 'Confirm Approval',
          text: 'Are you sure you want to approve this college?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, approve it!'
        });
      } else if (newStatus === 'rejected') {
        confirmResult = await Swal.fire({
          title: 'Provide Rejection Reason',
          input: 'textarea',
          inputLabel: 'Reason for Rejection',
          inputPlaceholder: 'Enter the reason for rejection...',
          inputAttributes: {
            'aria-label': 'Rejection reason'
          },
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Reject',
          inputValidator: (value) => {
            if (!value) {
              return 'You need to provide a reason for rejection!';
            }
          }
        });
      }

      if (!confirmResult.isConfirmed) {
        return;
      }

      const reason = newStatus === 'rejected' ? confirmResult.value : '';

      // Show loading state
      Swal.fire({
        title: 'Processing...',
        text: 'Updating college status',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/colleges/${collegeId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          reason
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state immediately
        setColleges(prevColleges => 
          prevColleges.map(college => 
            college._id === collegeId 
              ? { ...college, verificationStatus: newStatus }
              : college
          )
        );

        // Update selected college if in modal
        if (selectedCollege && selectedCollege._id === collegeId) {
          setSelectedCollege(prev => ({
            ...prev,
            verificationStatus: newStatus
          }));
        }

        // Close loading dialog
        Swal.close();

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `College has been ${newStatus}`,
          timer: 1500,
          showConfirmButton: false
        });

        // Refresh the colleges list
        await fetchColleges();
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update college status'
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/colleges/${selectedCollege._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Updated Successfully',
          text: 'College details have been updated',
          timer: 1500
        });
        fetchColleges();
        setSelectedCollege(null);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating college:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update college details'
      });
    }
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="management-main">
        <div className="management-header">
          <h1><FaUniversity /> College Management</h1>
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Search colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading colleges...</div>
        ) : (
          <div className="colleges-table">
            <table>
              <thead>
                <tr>
                  <th>College Name</th>
                  <th>University</th>
                  <th>Location</th>
                  <th>Verification Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredColleges.map(college => (
                  <tr key={college._id}>
                    <td className="college-name">
                      <div className="college-info">
                        <div>
                          <div className="name">{college.name}</div>
                          <div className="email">{college.contactEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>{college.university}</td>
                    <td>{college.location}</td>
                    <td>
                      <span className={`status ${college.verificationStatus}`}>
                        {college.verificationStatus}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEdit(college)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-action btn-view"
                        onClick={() => handleViewDetails(college._id)}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
                  {selectedCollege?.documents?.registrationCertificate && (
                    <div className="document-item">
                      <label>Registration Certificate</label>
                      <a href={selectedCollege?.documents?.registrationCertificate} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </div>
                  )}
                  {selectedCollege?.documents?.accreditationCertificate && (
                    <div className="document-item">
                      <label>Accreditation Certificate</label>
                      <a href={selectedCollege?.documents?.accreditationCertificate} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </div>
                  )}
                  {selectedCollege?.documents?.collegeLogo && (
                    <div className="document-item">
                      <label>College Logo</label>
                      <img src={selectedCollege?.documents?.collegeLogo} alt="College Logo" />
                    </div>
                  )}
                </div>

                {selectedCollege?.documents?.collegeImages && (
                  <div className="college-images">
                    <h4>College Images</h4>
                    <div className="images-grid">
                      {selectedCollege?.documents?.collegeImages.map((image, index) => (
                        <img key={index} src={image} alt={`College Image ${index + 1}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  className="action-btn close"
                  onClick={() => setSelectedCollege(null)}
                >
                  Close
                </button>
                
                {selectedCollege.verificationStatus === 'pending' && (
                  <>
                    <button 
                      className="action-btn approve"
                      onClick={() => handleUpdateStatus(selectedCollege._id, "approved")}
                      disabled={selectedCollege.verificationStatus === 'approved'}
                    >
                      <FaCheck /> Approve
                    </button>
                    <button 
                      className="action-btn reject"
                      onClick={() => handleUpdateStatus(selectedCollege._id, "rejected")}
                      disabled={selectedCollege.verificationStatus === 'rejected'}
                    >
                      <FaTimes /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeManagement; 