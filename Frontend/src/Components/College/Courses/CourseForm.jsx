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
    eligibilityCriteria: [''],
    startDate: '',
    applicationDeadline: '',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id]);

  useEffect(() => {
    // Cleanup function to revoke object URLs when component unmounts
    // or when imagePreview changes
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/college/courses/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      console.log('Course details response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch course details');
      }

      if (data.success && data.data) {
        // Format the data for the form
        setFormData({
          name: data.data.name || '',
          description: data.data.description || '',
          duration: data.data.duration || '',
          fees: data.data.fees || '',
          seats: {
            total: data.data.seats?.total || '',
            available: data.data.seats?.available || ''
          },
          eligibilityCriteria: data.data.eligibilityCriteria || [''],
          startDate: data.data.startDate || '',
          applicationDeadline: data.data.applicationDeadline || '',
          image: data.data.image || '',
          status: data.data.status || 'active'
        });

        // Set the image preview
        setImagePreview(data.data.image);

        console.log('Form data set:', formData);
      } else {
        throw new Error('Invalid course data received');
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load course details',
        confirmButtonColor: '#3498db'
      }).then(() => {
        navigate('/college/courses');
      });
    } finally {
      setLoading(false);
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Get upload signature from backend
        const signatureResponse = await fetch('http://localhost:3000/api/college/upload-signature?folder=courses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const signatureData = await signatureResponse.json();

        if (!signatureData.success) {
          throw new Error('Failed to get upload signature');
        }

        // Create form data for Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signatureData.data.apiKey);
        formData.append('timestamp', signatureData.data.timestamp);
        formData.append('signature', signatureData.data.signature);
        formData.append('folder', signatureData.data.folder);

        // Upload to Cloudinary
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.data.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        const uploadResult = await uploadResponse.json();
        if (uploadResult.secure_url) {
          setFormData(prev => ({
            ...prev,
            image: uploadResult.secure_url
          }));
          setImagePreview(uploadResult.secure_url);
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Image upload error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: 'Failed to upload image. Please try again.',
          confirmButtonColor: '#3498db'
        });
      }
    }
  };

  const handleCriteriaChange = (index, value) => {
    setFormData(prev => {
      const newCriteria = [...prev.eligibilityCriteria];
      newCriteria[index] = value;
      return {
        ...prev,
        eligibilityCriteria: newCriteria
      };
    });
  };

  const addCriteria = () => {
    setFormData(prev => ({
      ...prev,
      eligibilityCriteria: [...prev.eligibilityCriteria, '']
    }));
  };

  const removeCriteria = (index) => {
    setFormData(prev => ({
      ...prev,
      eligibilityCriteria: prev.eligibilityCriteria.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse numeric values
      const totalSeats = parseInt(formData.seats.total);
      const availableSeats = id ? parseInt(formData.seats.available) : totalSeats;
      const duration = parseInt(formData.duration);
      const fees = parseInt(formData.fees);

      // Validate numeric values
      if (isNaN(totalSeats) || totalSeats < 1) {
        throw new Error('Total seats must be at least 1');
      }
      if (isNaN(duration) || duration < 1) {
        throw new Error('Duration must be at least 1 year');
      }
      if (isNaN(fees) || fees < 0) {
        throw new Error('Fees must be a non-negative number');
      }
      if (id && (isNaN(availableSeats) || availableSeats < 0 || availableSeats > totalSeats)) {
        throw new Error('Available seats must be between 0 and total seats');
      }

      // Filter out empty criteria
      const validCriteria = formData.eligibilityCriteria.filter(criteria => criteria.trim());
      if (validCriteria.length === 0) {
        throw new Error('At least one eligibility criterion is required');
      }

      const courseData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: duration,
        fees: fees,
        startDate: formData.startDate,
        applicationDeadline: formData.applicationDeadline,
        seats: {
          total: totalSeats,
          available: id ? availableSeats : totalSeats
        },
        eligibilityCriteria: validCriteria,
        image: formData.image || ''
      };

      const url = id 
        ? `http://localhost:3000/api/college/courses/${id}`
        : 'http://localhost:3000/api/college/courses';
      
      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(courseData)
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
            {formData.eligibilityCriteria.map((criteria, index) => (
              <div key={index} className="criteria-row">
                <textarea
                  value={criteria}
                  onChange={(e) => handleCriteriaChange(index, e.target.value)}
                  placeholder={`Criterion ${index + 1}`}
                  required={index === 0}
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeCriteria(index)}
                    className="remove-criteria-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCriteria}
              className="add-criteria-btn"
            >
              Add Criterion
            </button>
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
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Course preview" />
              </div>
            )}
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