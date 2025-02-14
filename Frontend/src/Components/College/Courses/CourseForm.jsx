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
    seats: {
      total: '',
      available: ''
    },
    eligibility: '',
    startDate: '',
    applicationDeadline: '',
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
    if (name.startsWith('seats.')) {
      const [, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        seats: {
          ...prev.seats,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
      // Validate required fields
      if (!formData.name || !formData.description || !formData.duration || 
          !formData.fees || !formData.seats.total || !formData.eligibility || 
          !formData.startDate || !formData.applicationDeadline) {
        throw new Error('Please fill in all required fields');
      }

      // Validate numerical fields
      const duration = Number(formData.duration);
      const fees = Number(formData.fees);
      const totalSeats = Number(formData.seats.total);

      // Validate numerical values
      if (!Number.isInteger(duration) || duration <= 0) {
        throw new Error('Duration must be a positive whole number');
      }
      if (!Number.isFinite(fees) || fees < 0) {
        throw new Error('Fees must be a non-negative number');
      }
      if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
        throw new Error('Total seats must be a positive whole number');
      }

      const formDataToSend = new FormData();

      // Append basic fields with validated numbers
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('duration', String(duration));
      formDataToSend.append('fees', String(fees));
      formDataToSend.append('seats[total]', String(totalSeats));
      formDataToSend.append('eligibility', formData.eligibility.trim());
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('applicationDeadline', formData.applicationDeadline);

      // Handle image
      if (formData.image instanceof File) {
        formDataToSend.append('image', formData.image);
      }

      // Log the FormData contents for debugging
      for (let pair of formDataToSend.entries()) {
        console.log('Form data entry:', pair[0], ':', pair[1]);
      }

      const url = id 
        ? `http://localhost:3000/api/college/courses/${id}`
        : 'http://localhost:3000/api/college/courses';
      
      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit course');
      }

      Swal.fire({
        icon: 'success',
        title: `Course ${id ? 'Updated' : 'Added'} Successfully!`,
        confirmButtonColor: '#3498db'
      }).then(() => {
        navigate('/college/courses');
      });

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
              <label>Duration (in years)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
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
              <label>Total Seats</label>
              <input
                type="number"
                name="seats.total"
                value={formData.seats.total}
                onChange={handleInputChange}
                required
              />
            </div>
            {id && (
              <div className="form-group">
                <label>Available Seats</label>
                <input
                  type="number"
                  name="seats.available"
                  value={formData.seats.available}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}
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

          <div className="form-row">
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

            <div className="form-group">
              <label>Application Deadline</label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
                required
              />
            </div>
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
            <button 
              type="button" 
              onClick={() => navigate('/college/courses')} 
              className="cancel-btn"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading}
            >
              {loading ? 'Saving...' : (id ? 'Update Course' : 'Add Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm; 