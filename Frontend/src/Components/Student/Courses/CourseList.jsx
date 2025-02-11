import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaGraduationCap, FaRupeeSign, FaClock, FaUniversity, FaMapMarkerAlt } from 'react-icons/fa';
import StudentSidebar from '../Dashboard/StudentSidebar';
import Swal from 'sweetalert2';
import './CourseList.css';
import { useNavigate } from 'react-router-dom';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    duration: '',
    fees: '',
    college: '',
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/courses`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch courses');
      }

      const data = await response.json();
      console.log('Received courses data:', data);

      if (data.success && Array.isArray(data.courses)) {
        // Process the courses to ensure all required fields exist
        const processedCourses = data.courses.map(course => ({
          _id: course._id,
          name: course.name || 'Untitled Course',
          description: course.description || 'No description available',
          duration: course.duration || 'Duration not specified',
          fees: course.fees || 0,
          image: course.image || '/default-course.jpg',
          college: {
            name: course.college?.name || 'Unknown College',
            location: course.college?.location || 'Location not specified'
          }
        }));
        setCourses(processedCourses);
      } else {
        throw new Error('Invalid course data received');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load courses. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.college.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = (!filters.duration || course.duration === filters.duration) &&
                          (!filters.fees || course.fees <= parseInt(filters.fees)) &&
                          (!filters.college || course.college.name === filters.college) &&
                          (!filters.location || course.college.location === filters.location);
    
    return matchesSearch && matchesFilters;
  });

  const handleApply = async (courseId) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'student') {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please login as a student to apply for courses',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
      return;
    }

    try {
      console.log('Submitting application for course:', courseId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId })
      });

      const data = await response.json();
      console.log('Application response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit application');
      }

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Application submitted successfully',
          showConfirmButton: true,
          confirmButtonText: 'View Applications',
          showCancelButton: true,
          cancelButtonText: 'Close'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/student/applications');
          }
        });
      } else {
        throw new Error(data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to submit application',
      });
    }
  };

  return (
    <div className="student-layout">
      <StudentSidebar />
      <div className="course-list-container">
        <div className="course-list-header">
          <h1>Browse Courses</h1>
          <div className="search-filter-container">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search courses or colleges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="filter-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <select
              value={filters.duration}
              onChange={(e) => setFilters({...filters, duration: e.target.value})}
            >
              <option value="">Duration (Any)</option>
              <option value="1">1 Year</option>
              <option value="2">2 Years</option>
              <option value="3">3 Years</option>
              <option value="4">4 Years</option>
            </select>

            <select
              value={filters.fees}
              onChange={(e) => setFilters({...filters, fees: e.target.value})}
            >
              <option value="">Fees (Any)</option>
              <option value="100000">Under ₹1,00,000</option>
              <option value="200000">Under ₹2,00,000</option>
              <option value="500000">Under ₹5,00,000</option>
            </select>

            {/* Add more filters as needed */}
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-image">
                  <img 
                    src={course.image} 
                    alt={course.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-course.jpg';
                    }}
                  />
                </div>
                <div className="course-details">
                  <h3>{course.name}</h3>
                  <div className="college-info">
                    <FaUniversity />
                    <span>{course.college?.name || 'Unknown College'}</span>
                  </div>
                  <div className="course-meta">
                    <div>
                      <FaClock />
                      <span>{course.duration} {course.duration === 1 ? 'Year' : 'Years'}</span>
                    </div>
                    <div>
                      <FaRupeeSign />
                      <span>{course.fees.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <FaMapMarkerAlt />
                      <span>{course.college?.location || 'Location not specified'}</span>
                    </div>
                  </div>
                  <p className="course-description">
                    {course.description || 'No description available'}
                  </p>
                  <button 
                    className="apply-button"
                    onClick={() => handleApply(course._id)}
                  >
                    Apply Now
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

export default CourseList; 