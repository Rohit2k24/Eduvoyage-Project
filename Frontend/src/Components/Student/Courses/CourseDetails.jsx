import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaRupeeSign, FaCalendarAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import './CourseDetails.css';

const CourseDetails = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseDetails();
    checkProfileCompletion();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch course details');
      }

      setCourse(data.data);
    } catch (error) {
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkProfileCompletion = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      const profile = data.profile;
      console.log('Profile data:', profile);
      console.log("qualification",profile.education.qualifications[0]);
      const missing = [];
      
      if (!profile.dateOfBirth) missing.push('Date of Birth');
      if (!profile.gender) missing.push('Gender');
      if (!profile.phone) missing.push('Phone Number');
      if (!profile.address) missing.push('Address');
      
      if (profile.education?.qualifications?.length > 0) {
        const latestQualification = profile.education.qualifications[0];
        if (!latestQualification.level) missing.push('Current Qualification');
        if (!latestQualification.institute) missing.push('School/College Name');
        if (!latestQualification.board) missing.push('Board/University');
        if (!latestQualification.yearOfCompletion) missing.push('Year of Passing');
        if (!latestQualification.percentage) missing.push('Percentage/CGPA');
      } else {
        missing.push('Educational Qualifications');
      }
      
      // if (!profile.documents || profile.documents.length === 0) {
      //   missing.push('Required Documents');
      // }

      setMissingFields(missing);
      setProfileComplete(missing.length === 0);

      console.log('Missing fields:', missing);
      
    } catch (error) {
      console.error('Error checking profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to check profile completion. Please try again.',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const handleApply = async () => {
    try {
      await checkProfileCompletion();
      
      if (!profileComplete) {
        Swal.fire({
          icon: 'warning',
          title: 'Profile Incomplete',
          html: `
            <p>Please complete the following details in your profile:</p>
            <ul style="text-align: left; margin-top: 10px; list-style-type: none;">
              ${missingFields.map(field => `
                <li style="margin-bottom: 8px;">
                  <i class="fas fa-exclamation-circle" style="color: #f39c12; margin-right: 8px;"></i>
                  ${field}
                </li>
              `).join('')}
            </ul>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              These details are required and will be shared with the college.
            </p>
          `,
          showCancelButton: true,
          confirmButtonText: 'Complete Profile',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#3498db'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/student/profile');
          }
        });
        return;
      }

      const result = await Swal.fire({
        title: 'Confirm Application',
        html: `
          <p>The following details will be shared with the college:</p>
          <ul style="text-align: left; margin: 15px 0; list-style-type: none;">
            <li>• Personal Information (Name, DOB, Contact)</li>
            <li>• Educational Background</li>
            <li>• Academic Records</li>
            <li>• Supporting Documents</li>
          </ul>
          <p>Do you want to proceed?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Apply',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3498db'
      });

      if (result.isConfirmed) {
        const response = await fetch('http://localhost:3000/api/student/applications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            courseId: courseId
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to submit application');
        }

        Swal.fire({
          icon: 'success',
          title: 'Application Submitted',
          text: 'Your application has been submitted successfully!',
          confirmButtonColor: '#3498db'
        });
        navigate('/student/applications');
      }
    } catch (error) {
      console.error('Application error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to submit application',
        confirmButtonColor: '#3498db'
      });
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

  if (error) {
    return (
      <div className="course-details-layout">
        <StudentSidebar />
        <div className="course-details-main">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="back-btn">
              <FaArrowLeft /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-details-layout">
        <StudentSidebar />
        <div className="course-details-main">
          <div className="error-message">
            <h2>Course Not Found</h2>
            <p>The requested course could not be found.</p>
            <button onClick={() => navigate(-1)} className="back-btn">
              <FaArrowLeft /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-details-layout">
      <StudentSidebar />
      <div className="course-details-main">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FaArrowLeft /> Back
        </button>

        <div className="course-details-content">
          <div className="course-header">
            <h1>{course.name}</h1>
            <div className="college-info">
              <p>{course.college?.name}</p>
              <p>{course.college?.location}</p>
            </div>
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

          <div className="eligibility-section">
            <h2>Eligibility Criteria</h2>
            <ul>
              {course.eligibilityCriteria.map((criteria, index) => (
                <li key={index}>
                  <FaCheckCircle className="icon" />
                  {criteria}
                </li>
              ))}
            </ul>
          </div>

          <div className="application-section">
            <div className="deadline-info">
              <FaCalendarAlt className="icon" />
              <div>
                <h3>Application Deadline</h3>
                <p>{new Date(course.applicationDeadline).toLocaleDateString()}</p>
              </div>
            </div>

            <button 
              className="apply-btn"
              disabled={course.seats.available === 0}
              onClick={handleApply}
            >
              {course.seats.available === 0 ? 'No Seats Available' : 'Apply Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails; 