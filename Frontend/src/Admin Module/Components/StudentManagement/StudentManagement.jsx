import { useState, useEffect } from 'react';
import { FaUser, FaEdit, FaToggleOff, FaToggleOn, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './StudentManagement.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    dateOfBirth: '',
    country: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStudents(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };

  const handleDeactivate = async (studentId) => {
    try {
      const result = await Swal.fire({
        title: 'Confirm Deactivation',
        text: 'Are you sure you want to deactivate this student account?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
      });

      if (result.isConfirmed) {
        const response = await fetch(
          `http://localhost:3000/api/admin/students/${studentId}/deactivate`, 
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.ok) {
          setStudents(students.map(student => 
            student._id === studentId ? { ...student, accountActive: false } : student
          ));
          Swal.fire('Deactivated!', 'Student account has been deactivated.', 'success');
        }
      }
    } catch (error) {
      console.error('Deactivation error:', error);
      Swal.fire('Error', 'Failed to deactivate account', 'error');
    }
  };

  const handleToggleStatus = async (studentId, currentStatus) => {
    try {
      const result = await Swal.fire({
        title: `Confirm ${currentStatus ? 'Deactivation' : 'Activation'}?`,
        text: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this account?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: currentStatus ? '#d33' : '#28a745',
        cancelButtonColor: '#6c757d',
      });

      if (result.isConfirmed) {
        const response = await fetch(
          `http://localhost:3000/api/admin/students/${studentId}/toggle-status`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStudents(students.map(student => 
            student._id === studentId ? { ...student, accountActive: data.data.accountActive } : student
          ));
          Swal.fire(
            'Success!', 
            `Account ${data.data.accountActive ? 'activated' : 'deactivated'} successfully.`,
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Status toggle error:', error);
      Swal.fire('Error', 'Failed to update status', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/students/${selectedStudent._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(editFormData)
        }
      );

      if (response.ok) {
        const updatedStudent = await response.json();
        setStudents(students.map(student => 
          student._id === updatedStudent.data._id ? updatedStudent.data : student
        ));
        Swal.fire('Updated!', 'Student details have been updated.', 'success');
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Update error:', error);
      Swal.fire('Error', 'Failed to update student', 'error');
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditFormData({
      name: student.name,
      dateOfBirth: student.dateOfBirth 
        ? new Date(student.dateOfBirth).toISOString().split('T')[0] 
        : '',
      country: student.country || ''
    });
  };

  const filteredStudents = students.filter(student => {
    const studentName = student.name?.toLowerCase() || '';
    const userEmail = student.user?.email?.toLowerCase() || '';
    return studentName.includes(searchTerm.toLowerCase()) || 
           userEmail.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="student-management">
      <div className="management-header">
        <h1><FaUser /> Student Management</h1>
        <div className="search-bar">
          <FaSearch />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading students...</div>
      ) : (
        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Applications</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student._id} className="student-row">
                  <td className="student-name">
                    <div className="user-info">
                      {/* <img 
                        src={student.user?.profileImage || '/default-avatar.png'} 
                        alt="Profile" 
                        className="profile-image"
                      /> */}
                      <div>
                        <div className="student-name-text">{student.name || 'No Name'}</div>
                        <div className="student-id">ID: {student._id || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="student-email">
                    <a href={`mailto:${student.user?.email}`}>
                      {student.user?.email || 'No email'}
                    </a>
                  </td>
                  <td className="applications-count">
                    <div className="count-badge">
                      {student.applications?.length || 0}
                    </div>
                  </td>
                  <td>
                    <span className={`status ${student.accountActive ? 'active' : 'inactive'}`}>
                      {student.accountActive ? (
                        <><FaToggleOn className="status-icon" /> Active</>
                      ) : (
                        <><FaToggleOff className="status-icon" /> Inactive</>
                      )}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-action btn-edit" onClick={() => openEditModal(student)}>
                      <FaEdit className="action-icon" />
                    </button>
                    <button 
                      className={`btn-action btn-toggle ${student.accountActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleStatus(student._id, student.accountActive)}
                    >
                      {student.accountActive ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>Edit Student Details</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Birth:</label>
                <input
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) => setEditFormData({...editFormData, dateOfBirth: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Country:</label>
                <select
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                  required
                >
                  <option value="">Select Country</option>
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setSelectedStudent(null)}>
                  Cancel
                </button>
                <button type="submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;