import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUniversity, FaSearch, FaMapMarkerAlt, FaGraduationCap, FaFilter } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import './CollegeList.css';

const CollegeList = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    minCourses: '',
    accreditation: '',
    establishmentYear: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/student/colleges', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setColleges(data.colleges);
      console.log("data.colleges",data.colleges);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setLoading(false);
    }
  };

  const filteredColleges = colleges.filter(college => {
    const matchesSearch = 
      college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      college.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !filters.location || college.location.includes(filters.location);
    const matchesMinCourses = !filters.minCourses || college.totalCourses >= parseInt(filters.minCourses);
    const matchesAccreditation = !filters.accreditation || college.accreditation === filters.accreditation;
    const matchesYear = !filters.establishmentYear || college.establishmentYear >= parseInt(filters.establishmentYear);

    return matchesSearch && matchesLocation && matchesMinCourses && matchesAccreditation && matchesYear;
  });

  const handleCollegeClick = (collegeId) => {
    console.log('Navigating to college courses:', collegeId);
    navigate(`/student/colleges/${collegeId}/courses`);
  };

  return (
    <div className="college-list-layout">
      <StudentSidebar />
      
      <div className="college-list-main">
        <div className="college-list-header">
          <h1><FaUniversity /> Explore Colleges</h1>
          
          <div className="search-filter-container">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search colleges by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button 
              className={`filter-button ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Location</label>
                <select 
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                >
                  <option value="">All Locations</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Chennai">Chennai</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Minimum Courses</label>
                <select 
                  value={filters.minCourses}
                  onChange={(e) => setFilters({...filters, minCourses: e.target.value})}
                >
                  <option value="">Any</option>
                  <option value="5">5+</option>
                  <option value="10">10+</option>
                  <option value="15">15+</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Accreditation</label>
                <select 
                  value={filters.accreditation}
                  onChange={(e) => setFilters({...filters, accreditation: e.target.value})}
                >
                  <option value="">All</option>
                  <option value="A++">A++</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Established After</label>
                <select 
                  value={filters.establishmentYear}
                  onChange={(e) => setFilters({...filters, establishmentYear: e.target.value})}
                >
                  <option value="">Any Year</option>
                  <option value="2000">2000</option>
                  <option value="1990">1990</option>
                  <option value="1980">1980</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-spinner">Loading colleges...</div>
        ) : (
          <div className="colleges-grid">
            {filteredColleges.map(college => (
              <div 
                key={college._id} 
                className="college-card"
                onClick={() => handleCollegeClick(college._id)}
              >
                <div className="college-image">
                  <img src={college.documents?.collegeLogo || '/default-college.jpg'} alt={college.name} />
                </div>
                <div className="college-info">
                  <h2>{college.name}</h2>
                  
                  <div className="college-meta">
                    <p className="location">
                      <FaMapMarkerAlt /> {college.location}
                    </p>
                    {college.accreditation && (
                      <div className={`accreditation ${college.accreditation.replace('+', '\\+')}`}>
                        Grade: {college.accreditation}
                      </div>
                    )}
                  </div>
                  
                  <p className="university">{college.university}</p>
                  
                  <div className="college-details">
                    <div className="detail-item">
                      <span className="detail-label">Established</span>
                      <span className="detail-value">{college.establishmentYear}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Courses</span>
                      <span className="detail-value">{college.totalCourses}</span>
                    </div>
                    {college.facilities && (
                      <div className="detail-item">
                        <span className="detail-label">Facilities</span>
                        <span className="detail-value">{college.facilities.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                    {college.ranking && (
                      <div className="detail-item">
                        <span className="detail-label">Ranking</span>
                        <span className="detail-value">#{college.ranking}</span>
                      </div>
                    )}
                  </div>

                  <div className="college-stats">
                    <div className="stat">
                      <FaGraduationCap />
                      <span>{college.totalCourses} Courses Available</span>
                    </div>
                    <button className="view-courses-btn">
                      View Courses
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

export default CollegeList; 