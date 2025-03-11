import { useState } from 'react';
import { 
  FaUserGraduate, 
  FaEnvelope, 
  FaPhone, 
  FaEye, 
  FaGraduationCap, 
  FaCalendarAlt, 
  FaMapMarkerAlt,
  FaIdCard,
  FaBookReader
} from 'react-icons/fa';
import './StudentList.css';

const StudentDetailsModal = ({ student, onClose }) => {
  if (!student) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FaUserGraduate />
            <h2>Student Details</h2>
          </div>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="student-profile-header">
            <div className="student-avatar-large">
              <FaUserGraduate />
            </div>
            <div className="student-basic-info">
              <h3>{student.name}</h3>
              <span className="enrollment-badge">
                <FaIdCard /> {student.enrollmentNumber}
              </span>
            </div>
          </div>

          <div className="info-section">
            <h4><FaUserGraduate /> Personal Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <FaEnvelope /> 
                <div className="info-content">
                  <label>Email</label>
                  <span>{student.email}</span>
                </div>
              </div>
              <div className="info-item">
                <FaPhone /> 
                <div className="info-content">
                  <label>Phone</label>
                  <span>{student.phone}</span>
                </div>
              </div>
              <div className="info-item">
                <FaCalendarAlt /> 
                <div className="info-content">
                  <label>Date of Birth</label>
                  <span>{formatDate(student.dateOfBirth)}</span>
                </div>
              </div>
              <div className="info-item">
                <FaMapMarkerAlt /> 
                <div className="info-content">
                  <label>Address</label>
                  <span>{student.address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h4><FaGraduationCap /> Academic Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <FaBookReader />
                <div className="info-content">
                  <label>Course</label>
                  <span>{student.course?.name}</span>
                </div>
              </div>
              <div className="info-item">
                <FaCalendarAlt />
                <div className="info-content">
                  <label>Duration</label>
                  <span>{student.course?.duration} years</span>
                </div>
              </div>
              <div className="info-item">
                <FaIdCard />
                <div className="info-content">
                  <label>Batch</label>
                  <span>{student.academicDetails?.batch}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h4><FaGraduationCap /> Educational Background</h4>
            <div className="education-list">
              {student.education?.qualifications?.map((qual, index) => (
                <div key={index} className="education-item">
                  <div className="education-header">
                    <h5>{qual.level}</h5>
                    <span className="percentage">{qual.percentage}%</span>
                  </div>
                  <div className="education-details">
                    <p><strong>Institute:</strong> {qual.institute}</p>
                    <p><strong>Board:</strong> {qual.board}</p>
                    <p><strong>Year:</strong> {qual.yearOfCompletion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentList = ({ students }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <div className="student-list">
      {students.length === 0 ? (
        <div className="no-students">
          <FaUserGraduate className="no-data-icon" />
          <h2>No Students Found</h2>
          <p>There are no students matching your criteria.</p>
        </div>
      ) : (
        <div className="student-grid">
          {students.map(student => (
          <div key={student._id} className="student-card">
              <div className="student-card-header">
              <div className="student-avatar">
                <FaUserGraduate />
              </div>
                <div className="student-card-info">
                <h3>{student.name}</h3>
                  <p className="enrollment-number">
                    <FaIdCard /> {student.enrollmentNumber}
                  </p>
                </div>
              </div>
              
              <div className="student-card-content">
                <div className="info-row">
                  <FaGraduationCap />
                  <span>{student.course?.name}</span>
                </div>
                <div className="info-row">
                  <FaEnvelope />
                  <span>{student.email}</span>
                </div>
                <div className="info-row">
                  <FaPhone />
                  <span>{student.phone}</span>
              </div>
            </div>

              <div className="student-card-actions">
                <button
                  className="view-details-btn"
                  onClick={() => setSelectedStudent(student)}
                >
                  <FaEye /> View Details
                </button>
              </div>
            </div>
          ))}
          </div>
      )}
      
      {selectedStudent && (
        <StudentDetailsModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
};

export default StudentList; 