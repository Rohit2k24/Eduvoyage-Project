import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import './CourseApplication.css';

const CourseApplication = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    academicDetails: '',
    previousQualification: '',
    marks: '',
    documents: null
  });

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      const data = await response.json();
      setCourse(data.data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#3498db'
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const formDataToSend = new FormData();
      formDataToSend.append('courseId', courseId);
      formDataToSend.append('academicDetails', formData.academicDetails);
      formDataToSend.append('previousQualification', formData.previousQualification);
      formDataToSend.append('marks', formData.marks);
      if (formData.documents) {
        formDataToSend.append('documents', formData.documents);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Application Submitted',
        text: 'Your application has been submitted successfully!',
        confirmButtonColor: '#3498db'
      });

      navigate('/student/applications');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#3498db'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="application-layout">
        <StudentSidebar />
        <div className="application-main">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="application-layout">
      <StudentSidebar />
      <div className="application-main">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FaArrowLeft /> Back
        </button>

        <div className="application-content">
          <h1>Course Application</h1>
          <div className="course-info">
            <h2>{course?.name}</h2>
            <p>{course?.college?.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="application-form">
            <div className="form-group">
              <label>Academic Details</label>
              <textarea
                value={formData.academicDetails}
                onChange={(e) => setFormData({...formData, academicDetails: e.target.value})}
                placeholder="Enter your academic background"
                required
              />
            </div>

            <div className="form-group">
              <label>Previous Qualification</label>
              <input
                type="text"
                value={formData.previousQualification}
                onChange={(e) => setFormData({...formData, previousQualification: e.target.value})}
                placeholder="Enter your highest qualification"
                required
              />
            </div>

            <div className="form-group">
              <label>Marks Obtained (%)</label>
              <input
                type="number"
                value={formData.marks}
                onChange={(e) => setFormData({...formData, marks: e.target.value})}
                placeholder="Enter your percentage"
                min="0"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label>Supporting Documents</label>
              <input
                type="file"
                onChange={(e) => setFormData({...formData, documents: e.target.files[0]})}
                accept=".pdf,.doc,.docx"
              />
              <small>Upload relevant documents (PDF, DOC, DOCX)</small>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseApplication; 