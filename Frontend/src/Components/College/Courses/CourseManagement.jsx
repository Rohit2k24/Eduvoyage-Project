import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import Swal from 'sweetalert2';
import './CourseManagement.css';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/college/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
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
        if (data.success) {
          Swal.fire('Deleted!', 'Course has been deleted.', 'success');
          fetchCourses(); // Refresh the list
        }
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      Swal.fire('Error', 'Failed to delete course', 'error');
    }
  };

  return (
    <div className="college-dashboard-layout">
      <CollegeSidebar />
      
      <div className="course-management-main">
        <div className="course-header">
          <h1>Course Management</h1>
          <button className="add-course-btn" onClick={() => navigate('/college/courses/add')}>
            <FaPlus /> Add New Course
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading courses...</div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-image">
                  <img src={course.image || '/default-course.jpg'} alt={course.name} />
                </div>
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p className="duration">{course.duration}</p>
                  <p className="fees">₹{course.fees.toLocaleString()}</p>
                  <p className="seats">Available Seats: {course.availableSeats}</p>
                </div>
                <div className="course-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => navigate(`/college/courses/edit/${course._id}`)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(course._id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement; 