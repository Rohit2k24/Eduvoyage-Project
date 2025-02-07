import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaGraduationCap, FaRupeeSign, FaClock } from 'react-icons/fa';
import Header from '../Common/Header/Header';
import './CourseList.css';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    priceRange: 'all',
    duration: 'all',
    college: 'all'
  });
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchColleges();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/courses');
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

  const fetchColleges = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/colleges');
      const data = await response.json();
      if (data.success) {
        setColleges(data.colleges);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         course.description.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesPrice = filters.priceRange === 'all' ||
      (filters.priceRange === 'low' && course.fees <= 50000) ||
      (filters.priceRange === 'medium' && course.fees > 50000 && course.fees <= 100000) ||
      (filters.priceRange === 'high' && course.fees > 100000);

    const matchesDuration = filters.duration === 'all' ||
      (filters.duration === 'short' && course.duration <= '6 months') ||
      (filters.duration === 'medium' && course.duration > '6 months' && course.duration <= '1 year') ||
      (filters.duration === 'long' && course.duration > '1 year');

    const matchesCollege = filters.college === 'all' || course.college._id === filters.college;

    return matchesSearch && matchesPrice && matchesDuration && matchesCollege;
  });

  return (
    <div className="course-list-page">
      <Header />
      
      <div className="course-list-content">
        <aside className="filters-sidebar">
          <h2><FaFilter /> Filters</h2>
          
          <div className="filter-group">
            <label>Price Range</label>
            <select 
              value={filters.priceRange}
              onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
            >
              <option value="all">All Prices</option>
              <option value="low">Under ₹50,000</option>
              <option value="medium">₹50,000 - ₹1,00,000</option>
              <option value="high">Above ₹1,00,000</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Duration</label>
            <select 
              value={filters.duration}
              onChange={(e) => setFilters({...filters, duration: e.target.value})}
            >
              <option value="all">All Durations</option>
              <option value="short">Up to 6 months</option>
              <option value="medium">6 months - 1 year</option>
              <option value="long">More than 1 year</option>
            </select>
          </div>

          <div className="filter-group">
            <label>College</label>
            <select 
              value={filters.college}
              onChange={(e) => setFilters({...filters, college: e.target.value})}
            >
              <option value="all">All Colleges</option>
              {colleges.map(college => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <main className="courses-main">
          <div className="courses-header">
            <h1>Available Courses</h1>
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search courses..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="no-courses">
              <FaGraduationCap />
              <p>No courses found matching your criteria</p>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map(course => (
                <div key={course._id} className="course-card">
                  <div className="course-image">
                    <img src={course.image || '/default-course.jpg'} alt={course.name} />
                  </div>
                  <div className="course-info">
                    <h3>{course.name}</h3>
                    <p className="college-name">{course.college.name}</p>
                    <div className="course-details">
                      <span><FaRupeeSign /> {course.fees.toLocaleString()}</span>
                      <span><FaClock /> {course.duration}</span>
                    </div>
                    <p className="seats-left">
                      {course.availableSeats} seats remaining
                    </p>
                    <button className="apply-btn">Apply Now</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseList; 