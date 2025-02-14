import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaGraduationCap, FaCalendarAlt, FaUserGraduate } from 'react-icons/fa';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import Swal from 'sweetalert2';
import './CourseManagement.css';

const CourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const formatCourseData = (course) => {
    return {
      _id: course._id,
      name: course.name,
      description: course.description || 'No description available',
      duration: course.duration || 'Not specified',
      fees: course.fees || 0,
      image: course.image || '/default-course.jpg',
      seats: {
        total: course.seats?.total || 0,
        available: course.seats?.available || 0,
        occupied: course.seats?.occupied || 0
      },
      college: course.college || {
        name: 'Unknown College',
        location: 'Location not specified'
      }
    };
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/college/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      console.log('Fetched courses:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch courses');
      }

      if (data.success) {
        // Format each course data
        const formattedCourses = data.courses.map(formatCourseData);
        setCourses(formattedCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load courses',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3498db',
        cancelButtonColor: '#e74c3c',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await fetch(`http://localhost:3000/api/college/courses/${courseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete course');
        }

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Course has been deleted.',
            confirmButtonColor: '#3498db'
          });
          fetchCourses(); // Refresh the list
        }
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to delete course',
        confirmButtonColor: '#3498db'
      });
    }
  };

  return (
    <div className="college-dashboard-layout">
      <CollegeSidebar />
      
      <main className="course-management-main">
        <div className="course-header">
          <h1>Course Management</h1>
          <button 
            className="add-course-btn"
            onClick={() => navigate('/college/courses/add')}
          >
            <FaPlus /> Add New Course
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={fetchCourses} className="retry-btn">
              Retry
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="no-courses">
            <FaGraduationCap className="no-courses-icon" />
            <p>No courses added yet</p>
            <button 
              onClick={() => navigate('/college/courses/add')}
              className="add-first-course-btn"
            >
              Add Your First Course
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-image">
                  <img 
                    src={course.image} 
                    alt={course.name}
                    onError={(e) => {
                      e.target.src = '/default-course.jpg';
                    }}
                  />
                </div>
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p className="duration">
                    <FaCalendarAlt /> {course.duration} {course.duration === 1 ? 'year' : 'years'}
                  </p>
                  <p className="fees">
                    <span>₹{course.fees.toLocaleString()}</span>
                  </p>
                  <div className="seats-info">
                    <p className="seats">
                      <FaUserGraduate />
                      <span>Total Seats: {course.seats.total}</span>
                    </p>
                    <p className="seats available">
                      <span>Available: {course.seats.available}</span>
                    </p>
                    <p className="seats occupied">
                      <span>Occupied: {course.seats.occupied}</span>
                    </p>
                  </div>
                </div>
                <div className="course-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => navigate(`/college/courses/edit/${course._id}`)}
                    title="Edit course"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(course._id)}
                    title="Delete course"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseManagement; 