import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaRupeeSign, FaCalendarAlt, FaUsers, FaCheckCircle, FaBriefcase, FaRobot, FaCheck } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import ReviewSection from '../../Common/ReviewSection';
import Swal from 'sweetalert2';
import './CourseDetails.css';

const CourseDetails = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [careerInfo, setCareerInfo] = useState(null);
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseDetails();
    checkProfileCompletion();
    checkApplicationStatus();
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

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/student/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      console.log("data",data);
      const existingApplication = data.data.find(app => app.course._id === courseId);
      
      if (existingApplication) {
        setHasApplied(true);
        console.log("existingApplication",existingApplication);
        console.log("existingApplication.status",existingApplication.status);
        setApplicationStatus(existingApplication.status);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
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

        setHasApplied(true);
        setApplicationStatus('pending');

        await Swal.fire({
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

  const handleCareerInfo = async () => {
    if (!course?.name) return;

    const loadingDialog = Swal.fire({
      title: 'Analyzing Career Paths',
      html: `
        <div class="ai-loading">
          <div class="ai-loading-icon">
            <i class="fas fa-robot fa-spin"></i>
          </div>
          <p>Our AI is analyzing potential career paths for ${course.name}...</p>
          <p class="ai-loading-subtitle">This may take a few seconds</p>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await fetch('http://localhost:3000/api/ai/career-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseName: course.name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch career information');
      }

      if (!data.success || !data.data || !data.data.careers) {
        throw new Error('Invalid response format');
      }

      setCareerInfo(data.data);
      await loadingDialog.close();

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Analysis Complete',
        text: 'Career paths have been analyzed successfully!',
        timer: 1500,
        showConfirmButton: false
      });

      // Scroll to the career section with a smooth animation
      setTimeout(() => {
        const careerSection = document.querySelector('.career-paths-section');
        if (careerSection) {
          careerSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          
          // Add a highlight effect
          careerSection.classList.add('highlight-section');
          setTimeout(() => {
            careerSection.classList.remove('highlight-section');
          }, 1000);
        }
      }, 100);

    } catch (error) {
      console.error('Error fetching career info:', error);
      await loadingDialog.close();
      
      let errorMessage = 'Failed to fetch career information. Please try again.';
      
      // Customize error message based on the error
      if (error.message.includes('API key')) {
        errorMessage = 'Service configuration error. Please contact support.';
      } else if (error.message.includes('Rate limit')) {
        errorMessage = 'Too many requests. Please try again in a few minutes.';
      } else if (error.message.includes('unavailable')) {
        errorMessage = 'Service is temporarily unavailable. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }

      Swal.fire({
        icon: 'error',
        title: 'Analysis Failed',
        text: errorMessage,
        confirmButtonColor: '#3498db',
        confirmButtonText: 'Try Again'
      });
    }
  };

  const getApplicationButton = () => {
    if (hasApplied) {
      return (
        <button 
          className="applied-btn"
          onClick={() => navigate('/student/applications')}
        >
          <FaCheck className="icon" />
          {applicationStatus === 'pending' ? 'Application Pending' : 
           applicationStatus === 'approved' ? 'Application Approved' :
           applicationStatus === 'rejected' ? 'Application Rejected' :
           applicationStatus === 'paid' ? 'Application Completed' : 'Applied'}
        </button>
      );
    }

    return (
      <button 
        className="apply-btn"
        disabled={course.seats.available === 0}
        onClick={handleApply}
      >
        {course.seats.available === 0 ? 'No Seats Available' : 'Apply Now'}
      </button>
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
          <FaArrowLeft /> Back to Courses
        </button>

        <div className="course-details-content">
          <div className="course-header">
            <h1>{course.name}</h1>
            <div className="college-info">
              <p>{course.college?.name}</p>
              <p>{course.college?.location}</p>
            </div>
            <button onClick={handleCareerInfo} className="ai-career-btn">
              <FaRobot /> AI Career Analysis
            </button>
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

            {getApplicationButton()}
          </div>

          {careerInfo && (
            <div className="career-paths-section">
              <h2><FaBriefcase /> AI-Generated Career Paths</h2>
              <div className="career-paths-grid">
                {careerInfo.careers.map((career, index) => (
                  <div key={index} className="career-card">
                    <h3>{career.title}</h3>
                    <p className="career-description">{career.description}</p>
                    <div className="salary-ranges">
                      <h4>Expected Salary Ranges:</h4>
                      <ul>
                        {Object.entries(career.salaryRanges).map(([level, range]) => (
                          <li key={level}>
                            <span className="level">{level}:</span>
                            <span className="range">₹{range}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="skills-required">
                      <h4>Key Skills Required:</h4>
                      <ul>
                        {career.requiredSkills.map((skill, idx) => (
                          <li key={idx}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                    {career.additionalInfo && (
                      <div className="additional-info">
                        <h4>Additional Information:</h4>
                        <p>{career.additionalInfo}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <ReviewSection
            type="course"
            id={courseId}
            canReview={applicationStatus === 'paid'}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseDetails; 