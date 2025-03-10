import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaGraduationCap } from 'react-icons/fa';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import Swal from 'sweetalert2';
import './CourseManagement.css';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/api/college/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch courses');
      }

      if (data.success && Array.isArray(data.data)) {
        setCourses(data.data);
      } else {
        console.error('Unexpected data format:', data);
        throw new Error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load courses',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (courseId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
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
            confirmButtonColor: '#3085d6'
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
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleEdit = (courseId) => {
    try {
      navigate(`/college/courses/edit/${courseId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to navigate to edit page',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const filteredCourses = courses.filter(course => 
    course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="course-management-layout">
        <CollegeSidebar />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-management-layout">
      <CollegeSidebar />
      <div className="course-management-main">
        <div className="course-management-header">
          <h1>Course Management</h1>
          <button 
            onClick={() => navigate('/college/courses/add')} 
            className="add-course-btn"
          >
            <FaPlus /> Add New Course
          </button>
        </div>

        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredCourses.length > 0 ? (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-image">
                  <img 
                    src={course.image || '/default-course.jpg'} 
                    alt={course.name}
                    onError={(e) => {
                      e.target.src = '/default-course.jpg';
                    }}
                  />
                </div>
                <div className="course-info">
                  <h3>{course.name || 'Untitled Course'}</h3>
                  <p className="description">
                    {course.description || 'No description available'}
                  </p>
                  <div className="course-details">
                    <span>Duration: {course.duration || 'N/A'} years</span>
                    <span>Fees: ₹{(course.fees || 0).toLocaleString()}</span>
                    <span>
                      Seats: {course.seats?.available || 0}/{course.seats?.total || 0}
                    </span>
                  </div>
                  <div className="course-actions">
                    <button 
                      onClick={() => handleEdit(course._id)}
                      className="edit-btn"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(course._id)}
                      className="delete-btn"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-courses">
            <FaGraduationCap className="no-courses-icon" />
            <p>
              {searchTerm 
                ? 'No courses found matching your search.' 
                : 'No courses found. Add your first course!'}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => navigate('/college/courses/add')}
                className="add-first-course-btn"
              >
                <FaPlus /> Add Course
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement; 