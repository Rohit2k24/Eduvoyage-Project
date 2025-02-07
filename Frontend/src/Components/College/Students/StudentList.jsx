import { FaUserGraduate, FaEnvelope, FaPhone, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

const StudentList = ({ students, onStatusChange }) => {
  const handleStatusChange = async (studentId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/college/students/${studentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `Student status has been updated to ${newStatus}`,
          confirmButtonColor: '#3498db'
        });
        onStatusChange(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update student status',
        confirmButtonColor: '#3498db'
      });
    }
  };

  return (
    <div className="student-list">
      {students.length === 0 ? (
        <div className="no-students">No students found</div>
      ) : (
        students.map(student => (
          <div key={student._id} className="student-card">
            <div className="student-info">
              <div className="student-avatar">
                <FaUserGraduate />
              </div>
              <div className="student-details">
                <h3>{student.name}</h3>
                <p>
                  <FaEnvelope /> {student.email}
                </p>
                <p>
                  <FaPhone /> {student.phone}
                </p>
              </div>
            </div>
            <div className="student-status">
              <span className={`status-badge ${student.status}`}>
                {student.status}
              </span>
              <div className="status-actions">
                <button
                  className={`status-btn ${student.status === 'active' ? 'active' : ''}`}
                  onClick={() => handleStatusChange(student._id, 'active')}
                  disabled={student.status === 'active'}
                >
                  <FaCheckCircle /> Active
                </button>
                <button
                  className={`status-btn ${student.status === 'inactive' ? 'inactive' : ''}`}
                  onClick={() => handleStatusChange(student._id, 'inactive')}
                  disabled={student.status === 'inactive'}
                >
                  <FaTimesCircle /> Inactive
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default StudentList; 