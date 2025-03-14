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
  FaBookReader,
  FaPassport,
  FaUniversity,
  FaFileAlt
} from 'react-icons/fa';
import './StudentList.css';

const StudentList = ({ students }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const PassportDetails = ({ passport }) => {
    if (!passport || Object.keys(passport).length === 0) {
      return (
        <div className="details-section">
          <h4><FaPassport /> Passport Details</h4>
          <p className="no-data">No passport details available</p>
        </div>
      );
    }

    return (
      <div className="details-section">
        <h4><FaPassport /> Passport Details</h4>
        <div className="details-grid">
          {passport.number && (
            <div className="detail-item">
              <label>Passport Number</label>
              <p>{passport.number}</p>
            </div>
          )}
          {passport.expiryDate && (
            <div className="detail-item">
              <label>Expiry Date</label>
              <p>{formatDate(passport.expiryDate)}</p>
            </div>
          )}
          {passport.verified !== undefined && (
            <div className="detail-item">
              <label>Verification Status</label>
              <p>{passport.verified ? 'Verified' : 'Not Verified'}</p>
            </div>
          )}
          {passport.document && (
            <div className="detail-item full-width">
              <label>Passport Document</label>
              <a 
                href={passport.document}
                target="_blank"
                rel="noopener noreferrer"
                className="document-link"
              >
                View Passport Document <FaFileAlt />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BankStatement = ({ bankStatement }) => {
    if (!bankStatement || !bankStatement.document) {
      return (
        <div className="details-section">
          <h4><FaUniversity /> Bank Statement</h4>
          <p className="no-data">No bank statement uploaded</p>
        </div>
      );
    }

    return (
      <div className="details-section">
        <h4><FaUniversity /> Bank Statement</h4>
        <div className="details-grid">
          <div className="detail-item">
            <label>Upload Date</label>
            <p>{formatDate(bankStatement.uploadDate)}</p>
          </div>
          <div className="detail-item">
            <label>Document</label>
            <a 
              href={bankStatement.document}
              target="_blank"
              rel="noopener noreferrer"
              className="document-link"
            >
              View Bank Statement <FaFileAlt />
            </a>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentCard = (student) => {
    const isSelected = selectedStudent?._id === student._id;

    // Add debug logs
    if (isSelected) {
      console.log('Selected student passport:', student.passport);
      console.log('Selected student bank statement:', student.bankStatement);
    }

    return (
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
            className={`view-details-btn ${isSelected ? 'active' : ''}`}
            onClick={() => setSelectedStudent(isSelected ? null : student)}
          >
            <FaEye /> {isSelected ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {isSelected && (
          <div className="student-details-expanded">
            <div className="details-section">
              <h4><FaUserGraduate /> Personal Information</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Full Name</label>
                  <p>{student.name}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{student.email}</p>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <p>{student.phone}</p>
                </div>
                <div className="detail-item">
                  <label>Date of Birth</label>
                  <p>{formatDate(student.dateOfBirth)}</p>
                </div>
                <div className="detail-item">
                  <label>Address</label>
                  <p>{student.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <PassportDetails passport={student.passport} />
            <BankStatement bankStatement={student.bankStatement} />

            <div className="details-section">
              <h4><FaGraduationCap /> Academic Information</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Course</label>
                  <p>{student.course?.name || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Duration</label>
                  <p>{student.course?.duration ? `${student.course.duration} years` : 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Batch</label>
                  <p>{student.academicDetails?.batch || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Enrollment Number</label>
                  <p>{student.enrollmentNumber}</p>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h4><FaGraduationCap /> Educational Background</h4>
              <div className="education-list">
                {student.education?.qualifications?.map((qual, index) => (
                  <div key={index} className="education-item">
                    <div className="education-header">
                      <h5>{qual.level || 'Education Level Not Specified'}</h5>
                      <span className="percentage">{qual.percentage}%</span>
                    </div>
                    <div className="education-details">
                      <p><strong>Institute:</strong> {qual.institute || 'N/A'}</p>
                      <p><strong>Board:</strong> {qual.board || 'N/A'}</p>
                      <p><strong>Year:</strong> {qual.yearOfCompletion || 'N/A'}</p>
                      {qual.documents && (
                        <p>
                          <strong>Documents:</strong>
                          <a 
                            href={qual.documents} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="document-link"
                          >
                            View Documents
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )) || <p className="no-data">No educational background available</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
          {students.map(renderStudentCard)}
        </div>
      )}
    </div>
  );
};

export default StudentList; 