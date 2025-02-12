import { Link } from 'react-router-dom';
import { FaUserGraduate, FaUniversity } from 'react-icons/fa';
import './RegisterChoice.css';

const RegisterChoice = () => {
  return (
    <div className="register-container">
      <div className="register-glass-panel">
        <div className="register-header">
          <h1>Start Your Journey 🚀</h1>
          <p>Join EduVoyage as...</p>
        </div>
        
        <div className="choice-grid">
          <Link to="/register/student" className="choice-card student">
            <div className="card-content">
              <div className="icon-wrapper">
                <FaUserGraduate className="choice-icon" />
              </div>
              <h2>Student</h2>
              <p>Begin your global education adventure with personalized university matching</p>
              <span className="cta-text">Explore Opportunities →</span>
            </div>
          </Link>

          <Link to="/register/college" className="choice-card college">
            <div className="card-content">
              <div className="icon-wrapper">
                <FaUniversity className="choice-icon" />
              </div>
              <h2>University</h2>
              <p>Connect with top international students and showcase your programs</p>
              <span className="cta-text">Attract Talent →</span>
            </div>
          </Link>
        </div>

        <p className="existing-account">
          Already registered? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterChoice; 