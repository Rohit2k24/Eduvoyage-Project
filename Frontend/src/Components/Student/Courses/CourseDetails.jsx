import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaRupeeSign, FaUsers, FaSpinner, FaCalendarAlt } from 'react-icons/fa';
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
      const response = await fetch(`http://localhost:3000/api/student/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch course details');
      }

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

      Swal.close();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit application');
      }

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
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Back
        </button>

        {course && (
          <div className="course-details-content">
            <div className="course-header">
              <h1>{course.name}</h1>
              <p className="course-status">
                Status: <span className={`status-${course.status}`}>{course.status}</span>
              </p>
            </div>

            <div className="course-info-grid">
              <div className="info-card">
                <FaClock className="icon" />
                <h3>Duration</h3>
                <p>{course.duration} Years</p>
              </div>
              <div className="info-card">
                <FaRupeeSign className="icon" />
                <h3>Course Fee</h3>
                <p>₹{course.fees.toLocaleString()}</p>
              </div>
              <div className="info-card">
                <FaUsers className="icon" />
                <h3>Available Seats</h3>
                <p>{course.seats.available} / {course.seats.total}</p>
              </div>
              <div className="info-card">
                <FaCalendarAlt className="icon" />
                <h3>Start Date</h3>
                <p>{new Date(course.startDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="course-section">
              <h2>Course Description</h2>
              <p>{course.description}</p>
            </div>

            <div className="course-criteria">
              <h3>Eligibility Criteria</h3>
              <ul className="criteria-list">
                {course.criteria.map((criteria, index) => (
                  <li key={index} className="criteria-item">
                    <span className="criteria-bullet">•</span>
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>

            {course.curriculum && course.curriculum.length > 0 && (
              <div className="course-section">
                <h2>Curriculum Highlights</h2>
                <ul className="curriculum-list">
                  {course.curriculum.map((item, index) => (
                    <li key={index}>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="application-section">
              <div className="deadline-info">
                <FaCalendarAlt className="icon" />
                <div>
                  <h3>Application Deadline</h3>
                  <p>{new Date(course.applicationDeadline).toLocaleDateString()}</p>
                </div>
              </div>

              <button 
                onClick={handleApply} 
                className="apply-button"
                disabled={isSubmitting || course.seats.available === 0}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="spinner" />
                    Submitting...
                  </>
                ) : course.seats.available === 0 ? (
                  'No Seats Available'
                ) : (
                  'Apply Now'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails; 