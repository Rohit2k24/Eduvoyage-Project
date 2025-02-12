import { useState, useEffect } from 'react';
import { FaSearch, FaBook, FaUniversity, FaClock, FaMoneyBillWave, FaUserGraduate } from 'react-icons/fa';
import './CourseList.css';

const CourseList = ({ courses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.college.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="course-list-container">
      <div className="course-filters">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search courses or colleges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open for Applications</option>
          <option value="closed">Applications Closed</option>
          <option value="upcoming">Upcoming Programs</option>
        </select>
      </div>

      <div className="course-grid">
        {filteredCourses.map(course => (
          <div key={course.id} className="course-card">
            <div className="card-header">
              <h3 className="course-title">
                <FaBook className="header-icon" />
                {course.name}
              </h3>
              <span className={`status-badge ${course.status}`}>
                {course.status.toUpperCase()}
              </span>
            </div>
            
            <div className="course-college">
              <FaUniversity className="icon" />
              <span>{course.college.name}</span>
            </div>

            <p className="course-description">
              {course.description.substring(0, 100)}...
            </p>

            <div className="course-details">
              <div className="detail-item">
                <FaClock className="icon" />
                <span>Application Deadline: {course.deadline}</span>
              </div>
              <div className="detail-item">
                <FaClock className="icon" />
                <span>Duration: {course.duration}</span>
              </div>
              <div className="detail-item">
                <FaMoneyBillWave className="icon" />
                <span>Fees: ₹{course.fees.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <FaUserGraduate className="icon" />
                <span>Seats Available: {course.availableSeats}</span>
              </div>
            </div>

            <div className="course-tags">
              {course.specializations.map(spec => (
                <span key={spec} className="tag">{spec}</span>
              ))}
            </div>

            <div className="card-footer">
              <button className="apply-button">
                View Details
              </button>
              <div className="application-progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${(course.applicationsReceived / course.totalSeats) * 100}%` }}
                ></div>
                <span>{course.applicationsReceived} applications received</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseList; 