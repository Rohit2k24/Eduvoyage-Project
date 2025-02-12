import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaGraduationCap, FaRupeeSign, FaClock, FaUniversity } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import './CourseList.css';
import { useNavigate } from 'react-router-dom';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    college: '',
    duration: '',
    maxFees: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...');
      const response = await fetch('http://localhost:3000/api/student/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      console.log('Courses data:', data);
      
      if (data.success) {
        setCourses(data.courses || []);
      } else {
        throw new Error(data.message || 'Failed to fetch courses');
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

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleApply = async (courseId) => {
    try {
      const response = await fetch('http://localhost:3000/api/student/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Application Submitted',
          text: 'Your application has been submitted successfully!',
          confirmButtonColor: '#3498db'
        });
      } else {
        // Handle specific error cases
        if (response.status === 400 && data.message.includes('already applied')) {
          Swal.fire({
            icon: 'info',
            title: 'Already Applied',
            text: 'You have already applied for this course. Check your applications page for status.',
            confirmButtonColor: '#3498db',
            showCancelButton: true,
            cancelButtonText: 'Close',
            confirmButtonText: 'View Applications',
          }).then((result) => {
            if (result.isConfirmed) {
              navigate('/student/applications');
            }
          });
        } else if (response.status === 400 && data.message.includes('No seats available')) {
          Swal.fire({
            icon: 'error',
            title: 'No Seats Available',
            text: 'Sorry, all seats for this course have been filled.',
            confirmButtonColor: '#3498db'
          });
        } else {
          throw new Error(data.message || 'Failed to submit application');
        }
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to submit application',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const filteredCourses = courses.filter(course => {
    return (
      course.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      (!filters.college || course.college.name.toLowerCase().includes(filters.college.toLowerCase())) &&
      (!filters.duration || course.duration === parseInt(filters.duration)) &&
      (!filters.maxFees || course.fees <= parseInt(filters.maxFees))
    );
  });

  if (error) {
    return (
      <div className="course-list-layout">
        <StudentSidebar />
        <div className="course-list-main">
          <h1>Available Courses</h1>
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchCourses} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-list-layout">
      <StudentSidebar />
      
      <div className="course-list-main">
        <h1>Available Courses</h1>

        <div className="filters-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              name="search"
              placeholder="Search courses..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="filters">
            <input
              type="text"
              name="college"
              placeholder="Filter by college"
              value={filters.college}
              onChange={(e) => setFilters({ ...filters, college: e.target.value })}
            />
            <select
              name="duration"
              value={filters.duration}
              onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
            >
              <option value="">Duration (Years)</option>
              <option value="1">1 Year</option>
              <option value="2">2 Years</option>
              <option value="3">3 Years</option>
              <option value="4">4 Years</option>
            </select>
            <input
              type="number"
              name="maxFees"
              placeholder="Max fees"
              value={filters.maxFees}
              onChange={(e) => setFilters({ ...filters, maxFees: e.target.value })}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="no-courses">
            <FaGraduationCap className="icon" />
            <h2>No Courses Found</h2>
            <p>Try adjusting your filters or check back later for new courses.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-image">
                  <img src={course.image} alt={course.name} />
                </div>
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p className="college-name">
                    <FaUniversity className="icon" />
                    {course.college.name}
                  </p>
                  <div className="course-details">
                    <span>
                      <FaClock className="icon" />
                      {course.duration} years
                    </span>
                    <span>
                      <FaRupeeSign className="icon" />
                      {course.fees.toLocaleString()}
                    </span>
                  </div>
                  <div className="course-actions">
                    <button 
                      onClick={() => navigate(`/student/courses/${course._id}`)}
                      className="view-details-btn"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handleApply(course._id)}
                      className="apply-btn"
                    >
                      Apply Now
                    </button>
                  </div>
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