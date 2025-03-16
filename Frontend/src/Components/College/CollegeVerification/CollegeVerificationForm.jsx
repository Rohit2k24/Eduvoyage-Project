import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './CollegeVerificationForm.css';

const CollegeVerificationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    collegeDescription: '',
    address: '',
    contactEmail: '',
    phoneNumber: '',
    facilities: '',
    courses: ''
  });
  
  const [documents, setDocuments] = useState({
    registrationCertificate: null,
    accreditationCertificate: null,
    collegeLogo: null,
    collegeImages: []
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'collegeImages') {
      setDocuments({
        ...documents,
        [name]: Array.from(files)
      });
    } else {
      setDocuments({
        ...documents,
        [name]: files[0]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Append text data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Append files
      formDataToSend.append('registrationCertificate', documents.registrationCertificate);
      formDataToSend.append('accreditationCertificate', documents.accreditationCertificate);
      formDataToSend.append('collegeLogo', documents.collegeLogo);
      documents.collegeImages.forEach(image => {
        formDataToSend.append('collegeImages', image);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/submit-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Verification Submitted!',
          text: 'Your college verification request has been submitted. Please wait for admin approval.',
          confirmButtonColor: '#3498db'
        }).then(() => {
          navigate('/college/verification-status');
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.message || 'Failed to submit verification request',
        confirmButtonColor: '#3498db'
      });
    }
  };

  return (
    <div className="verification-form-container">
      <div className="verification-form-box">
        <h2>College Verification Form</h2>
        <p className="form-subtitle">Please provide the following information and documents for verification</p>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label>College Description</label>
              <textarea
                name="collegeDescription"
                value={formData.collegeDescription}
                onChange={handleInputChange}
                placeholder="Provide a detailed description of your college"
                required
              />
            </div>

            <div className="form-group">
              <div className="input-icon-wrapper">
                <FaMapMarkerAlt className="input-icon" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Complete Address"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="input-icon-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="Contact Email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-icon-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Contact Phone"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Information</h3>
            
            <div className="form-group">
              <label>Facilities</label>
              <textarea
                name="facilities"
                value={formData.facilities}
                onChange={handleInputChange}
                placeholder="List major facilities available"
                required
              />
            </div>

            <div className="form-group">
              <label>Courses Offered</label>
              <textarea
                name="courses"
                value={formData.courses}
                onChange={handleInputChange}
                placeholder="List major courses offered"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Required Documents</h3>
            
            <div className="form-group">
              <label>
                <FaUpload className="upload-icon" />
                Registration Certificate
              </label>
              <input
                type="file"
                name="registrationCertificate"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaUpload className="upload-icon" />
                Accreditation Certificate
              </label>
              <input
                type="file"
                name="accreditationCertificate"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaUpload className="upload-icon" />
                College Logo
              </label>
              <input
                type="file"
                name="collegeLogo"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaUpload className="upload-icon" />
                College Images (up to 5)
              </label>
              <input
                type="file"
                name="collegeImages"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
                multiple
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-button">
            Submit for Verification
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollegeVerificationForm; 