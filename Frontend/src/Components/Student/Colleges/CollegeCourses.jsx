import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaMapMarkerAlt, 
  FaStar, 
  FaUniversity, 
  FaPhone, 
  FaEnvelope, 
  FaCalendarAlt,
  FaCheckCircle,
  FaGraduationCap
} from 'react-icons/fa';
import './CollegeCourses.css';

const CollegeCourses = () => {
  const [college, setCollege] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { collegeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollegeAndCourses();
  }, [collegeId]);

  const fetchCollegeAndCourses = async () => {
    try {
      console.log('Fetching college details for ID:', collegeId);
      const response = await fetch(`http://localhost:3000/api/student/colleges/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch college details');
      }

      setCollege(data.college);
      setCourses(data.courses);
      setError(null);
    } catch (error) {
      console.error('Error fetching college details:', error);
      setError('Failed to load college details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading college details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/student/colleges')}>
          <FaArrowLeft /> Back to Colleges
        </button>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="error-container">
        <h2>College Not Found</h2>
        <p>The requested college could not be found.</p>
        <button onClick={() => navigate('/student/colleges')}>
          <FaArrowLeft /> Back to Colleges
        </button>
      </div>
    );
  }

  return (
    <div className="college-courses-container">
      <button className="back-button" onClick={() => navigate('/student/colleges')}>
        <FaArrowLeft /> Back to Colleges
      </button>

      <div className="college-header">
        <div className="college-banner">
          <img src={college?.documents?.collegeLogo || '/default-college.jpg'} alt={college?.name} />
          <div className="college-overlay">
            <h1>{college?.name}</h1>
            <div className="college-meta">
              <span><FaMapMarkerAlt /> {college?.location}</span>
              <span><FaStar /> {college?.accreditation || 'NA'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="college-content">
        <div className="college-main-info">
          <div className="info-section">
            <h2>About College</h2>
            <p>{college?.description}</p>
          </div>

          <div className="info-section">
            <h2>Key Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <FaUniversity />
                <div>
                  <label>University</label>
                  <span>{college?.university}</span>
                </div>
              </div>
              <div className="info-item">
                <FaCalendarAlt />
                <div>
                  <label>Established</label>
                  <span>{college?.establishmentYear}</span>
                </div>
              </div>
              <div className="info-item">
                <FaStar />
                <div>
                  <label>Accreditation</label>
                  <span>{college?.accreditation || 'NA'}</span>
                </div>
              </div>
              <div className="info-item">
                <FaGraduationCap />
                <div>
                  <label>Total Courses</label>
                  <span>{courses.length} Programs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h2>Facilities</h2>
            <div className="facilities-grid">
              {college?.facilities?.map((facility, index) => (
                <div key={index} className="facility-item">
                  <FaCheckCircle />
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="info-section">
            <h2>Contact Information</h2>
            <div className="contact-info">
              <div className="contact-item">
                <FaMapMarkerAlt />
                <span>{college?.address}</span>
              </div>
              <div className="contact-item">
                <FaPhone />
                <span>{college?.phoneNumber}</span>
              </div>
              <div className="contact-item">
                <FaEnvelope />
                <span>{college?.contactEmail}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="courses-section">
          <h2>Available Courses</h2>
          <div className="courses-grid">
            {courses.map(course => (
              <div 
                key={course._id} 
                className="course-card"
                onClick={() => navigate(`/student/courses/${course._id}`)}
              >
                <h3>{course.name}</h3>
                <div className="course-brief">
                  <span className="course-duration">{course.duration} Years</span>
                  <span className="course-seats">{course.seats.available} Seats</span>
                </div>
                <button 
                  className="view-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/student/courses/${course._id}`);
                  }}
                >
                  View Course Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeCourses; 