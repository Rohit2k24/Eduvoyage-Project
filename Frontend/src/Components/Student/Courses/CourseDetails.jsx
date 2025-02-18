import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUniversity, FaClock, FaRupeeSign, FaUsers, FaSpinner } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import './CourseDetails.css';

const CourseDetails = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching course details for ID:', courseId);

      // Try to fix the course data first
      await fetch(`http://localhost:3000/api/student/debug/fix-course/${courseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Then fetch the course details
      const response = await fetch(`http://localhost:3000/api/student/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch course details');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch course details');
      }

      console.log('Setting course data:', data.course);
      setCourse(data.course);
    } catch (error) {
      console.error('Error fetching course details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load course details',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      // Show loading state
      Swal.fire({
        title: 'Submitting Application',
        text: 'Please wait...',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch('http://localhost:3000/api/student/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId })
      });

      const data = await response.json();
      console.log('Application response:', data);

      // Close loading dialog
      Swal.close();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit application');
      }

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Application Submitted',
        html: `
          Your application has been submitted successfully!<br>
          Application Number: <strong>${data.data.applicationNumber}</strong>
        `,
        confirmButtonColor: '#3498db',
        confirmButtonText: 'View Applications'
      });

      // Redirect to applications page
      navigate('/student/applications');
    } catch (error) {
      console.error('Application error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to submit application',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCollegeInfo = (college) => {
    if (!college) {
      console.log('No college data available');
      return null;
    }

    console.log('Rendering college info:', college);

    const collegeDetails = [
      { 
        title: 'Description', 
        value: college.description,
        fallback: 'Description not available'
      },
      { 
        title: 'Facilities', 
        value: college.facilities,
        fallback: 'Facilities information not available'
      },
      { 
        title: 'University', 
        value: college.university,
        fallback: 'University not specified'
      },
      { 
        title: 'Address', 
        value: college.address,
        fallback: 'Address not specified'
      },
      { 
        title: 'Contact Information', 
        value: (
          <>
            <p>Email: {college.contactEmail || 'Email not available'}</p>
            <p>Phone: {college.phoneNumber || 'Phone number not available'}</p>
          </>
        )
      },
      { 
        title: 'Accreditation', 
        value: college.accreditation,
        fallback: 'Accreditation information not available'
      },
      { 
        title: 'Established', 
        value: college.establishmentYear,
        fallback: 'Establishment year not specified'
      }
    ];

    return (
      <div className="college-details-grid">
        {collegeDetails.map((detail, index) => (
          <div key={index} className="college-detail">
            <h3>{detail.title}</h3>
            {typeof detail.value === 'object' ? (
              detail.value
            ) : (
              <p>{detail.value || detail.fallback}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="course-details-layout">
        <StudentSidebar />
        <div className="course-details-main">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-details-layout">
      <StudentSidebar />
      <div className="course-details-main">
        <button onClick={() => navigate('/student/courses')} className="back-button">
          <FaArrowLeft /> Back to Courses
        </button>

        {course && (
          <div className="course-details-content">
            <div className="course-header">
              <img src={course.image || '/default-course.jpg'} alt={course.name} className="course-image" />
              <div className="course-header-info">
                <h1>{course.name}</h1>
                <p className="college-name">
                  <FaUniversity className="icon" />
                  {course.college?.name}
                </p>
                <p className="course-status">
                  Status: <span className={`status-${course.status}`}>{course.status}</span>
                </p>
              </div>
            </div>

            <div className="course-info-grid">
              <div className="info-card">
                <FaClock className="icon" />
                <h3>Duration</h3>
                <p>{course.duration} years</p>
              </div>
              <div className="info-card">
                <FaRupeeSign className="icon" />
                <h3>Fees</h3>
                <p>₹{course.fees.toLocaleString()}</p>
              </div>
              <div className="info-card">
                <FaUsers className="icon" />
                <h3>Available Seats</h3>
                <p>{course.seats.available} / {course.seats.total}</p>
              </div>
            </div>

            <div className="course-description">
              <h2>Course Description</h2>
              <p>{course.description}</p>
              
              <h3>Eligibility Criteria</h3>
              <p>{course.eligibility}</p>

              {course.curriculum && course.curriculum.length > 0 && (
                <>
                  <h3>Curriculum Highlights</h3>
                  <ul className="curriculum-list">
                    {course.curriculum.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="college-info">
              <h2>About the College</h2>
              {renderCollegeInfo(course.college)}
            </div>

            <div className="important-dates">
              <h2>Important Dates</h2>
              <div className="dates-grid">
                {course.startDate && (
                  <div className="date-item">
                    <h3>Course Start Date</h3>
                    <p>{new Date(course.startDate).toLocaleDateString()}</p>
                  </div>
                )}
                {course.applicationDeadline && (
                  <div className="date-item">
                    <h3>Application Deadline</h3>
                    <p>{new Date(course.applicationDeadline).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleApply} 
              className="apply-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="spinner" />
                  Submitting...
                </>
              ) : (
                'Apply Now'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails; 