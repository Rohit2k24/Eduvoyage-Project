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
  FaGraduationCap,
  FaTimes,
  FaSearchPlus,
  FaSearchMinus,
  FaBed
} from 'react-icons/fa';
import HostelList from '../../College/Hostels/HostelList';
import ReviewSection from '../../Common/ReviewSection';
import './CollegeCourses.css';
import axios from 'axios';

const CollegeCourses = () => {
  const [college, setCollege] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [hostelApplications, setHostelApplications] = useState([]);
  const [hasAppliedAndPaid, setHasAppliedAndPaid] = useState(false);
  const { collegeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollegeAndCourses();
    fetchHostelApplications();
    checkApplicationStatus();
  }, [collegeId]);

  const fetchHostelApplications = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/hostel/student/applications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setHostelApplications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching hostel applications:', error);
    }
  };

  const fetchCollegeAndCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!collegeId || !collegeId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid college ID');
      }

      console.log('Fetching details for college:', collegeId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/college/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      console.log('Received data:', data);

      if (!response.ok) {
        throw new Error(
          response.status === 404 
            ? 'College not found' 
            : data.message || 'Failed to fetch college details'
        );
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch college details');
      }

      if (!data.college) {
        throw new Error('College data is missing');
      }

      setCollege(data.college);
      setCourses(data.courses || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching college details:', error);
      setError(error.message || 'Failed to load college details. Please try again later.');
      setCollege(null);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      // Check if student has any paid applications for any courses in this college
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/applications/college/${collegeId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      console.log('College application status data:', data);

      if (data.success) {
        // Set hasAppliedAndPaid to true if there's any paid application for this college
        const hasPaidApplication = data.applications && data.applications.some(app => app.status === 'paid');
        console.log('Has paid application:', hasPaidApplication);
        setHasAppliedAndPaid(hasPaidApplication);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
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

  const renderAboutTab = () => (
    <>
      <div className="info-section">
        <h2>About College</h2>
        <p>{college?.description}</p>
      </div>

      <div className="info-section">
        <h2>College Gallery</h2>
        <div className="college-gallery">
          {college?.documents?.collegeImages && college.documents.collegeImages.length > 0 ? (
            <div className="gallery-grid">
              {college.documents.collegeImages.map((imageUrl, index) => (
                <div 
                  key={index} 
                  className="gallery-item"
                  onClick={() => setSelectedImage(imageUrl)}
                >
                  <img src={imageUrl} alt={`${college.name} - Image ${index + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <p className="no-images">No images available for this college.</p>
          )}
        </div>
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

      <ReviewSection
        type="college"
        id={collegeId}
        canReview={hasAppliedAndPaid}
      />
    </>
  );

  const renderCoursesTab = () => (
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
  );

  const renderHostelsTab = () => (
    <div className="hostels-section">
      <div className="hostel-list">
        <HostelList 
          collegeId={collegeId} 
          applications={hostelApplications}
          onApplicationSubmit={() => {
            // Refresh applications after new submission
            fetchHostelApplications();
          }}
          renderActions={(hostel) => {
            const application = hostelApplications.find(
              app => app.hostel._id === hostel._id
            );

            if (application) {
              return (
                <div className="hostel-application-status">
                  <div className={`status-badge ${application.status}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </div>
                  <button
                    className="view-application-btn"
                    onClick={() => navigate('/student/hostel-applications')}
                  >
                    View Application
                  </button>
                </div>
              );
            }
            return null;
          }}
        />
      </div>
    </div>
  );

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
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <FaUniversity /> About
          </button>
          <button
            className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <FaGraduationCap /> Courses
          </button>
          <button
            className={`tab ${activeTab === 'hostels' ? 'active' : ''}`}
            onClick={() => setActiveTab('hostels')}
          >
            <FaBed /> Hostels
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'about' && renderAboutTab()}
          {activeTab === 'courses' && renderCoursesTab()}
          {activeTab === 'hostels' && renderHostelsTab()}
        </div>
      </div>

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <button className="close-modal" onClick={() => setSelectedImage(null)}>
            <FaTimes />
          </button>
          <button 
            className="zoom-button"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
          >
            {isZoomed ? <FaSearchMinus /> : <FaSearchPlus />}
          </button>
          <div 
            className={`modal-content ${isZoomed ? 'zoomed' : ''}`} 
            onClick={e => e.stopPropagation()}
          >
            <img src={selectedImage} alt="College" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeCourses; 