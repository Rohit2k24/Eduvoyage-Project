import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUpload } from 'react-icons/fa';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import Swal from 'sweetalert2';
import './CourseForm.css';

const CourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    fees: '',
    availableSeats: '',
    startDate: '',
    eligibility: '',
    image: null
  });

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/college/courses/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFormData(data.course);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'image') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append image if exists
      if (formData.image instanceof File) {
        formDataToSend.append('image', formData.image);
      }

      const url = id 
        ? `http://localhost:3000/api/college/courses/${id}`
        : 'http://localhost:3000/api/college/courses';
      
      const method = id ? 'PUT' : 'POST';

      console.log('Sending request to:', url);
      console.log('Method:', method);
      console.log('Token:', localStorage.getItem('token'));

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit course');
      }

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: `Course ${id ? 'Updated' : 'Added'} Successfully!`,
          confirmButtonColor: '#3498db'
        }).then(() => {
          navigate('/college/courses');
        });
      }
    } catch (error) {
      console.error('Error submitting course:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || `Failed to ${id ? 'update' : 'add'} course`,
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="college-dashboard-layout">
      <CollegeSidebar />
      
      <div className="course-form-main">
        <h1>{id ? 'Edit Course' : 'Add New Course'}</h1>
        
        <form onSubmit={handleSubmit} className="course-form">
          <div className="form-group">
            <label>Course Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 4 years"
                required
              />
            </div>

            <div className="form-group">
              <label>Fees (₹)</label>
              <input
                type="number"
                name="fees"
                value={formData.fees}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Available Seats</label>
              <input
                type="number"
                name="availableSeats"
                value={formData.availableSeats}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Eligibility Criteria</label>
            <textarea
              name="eligibility"
              value={formData.eligibility}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <FaUpload className="upload-icon" />
              Course Image
            </label>
            <input
              type="file"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
              className="file-input"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/college/courses')} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : (id ? 'Update Course' : 'Add Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm; 