import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaSpinner } from 'react-icons/fa';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import StudentList from './StudentList';
import Swal from 'sweetalert2';
import './StudentManagement.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3000/api/college/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      if (data.success) {
        // Filter out any invalid student data
        const validStudents = data.students.filter(student => 
          student && student.name && student.email
        );
        setStudents(validStudents);
      } else {
        throw new Error(data.message || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(error.message || 'Failed to load students');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load students',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (student.phone || '').includes(searchTerm);
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && student.status === filter;
  });

  return (
    <div className="college-dashboard-layout">
      <CollegeSidebar />
      
      <div className="student-management-main">
        <h1>Student Management</h1>

        <div className="student-controls">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <FaFilter className="filter-icon" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Students</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <FaSpinner className="spinner" />
            <p>Loading students...</p>
          </div>
        ) : error ? (
          <div className="error">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={fetchStudents} className="retry-btn">Retry</button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="no-students">
            <h2>No Students Found</h2>
            <p>There are no students matching your criteria.</p>
          </div>
        ) : (
          <StudentList 
            students={filteredStudents}
            onStatusChange={fetchStudents}
          />
        )}
      </div>
    </div>
  );
};

export default StudentManagement; 