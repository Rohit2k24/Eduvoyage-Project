import { Link } from 'react-router-dom';
import { FaUserGraduate, FaUniversity } from 'react-icons/fa';
import './RegisterChoice.css';

const RegisterChoice = () => {
  return (
    <div className="register-choice-container">
      <div className="register-choice-box">
        <h2>Choose Registration Type</h2>
        <div className="choice-cards">
          <Link to="/register/student" className="choice-card">
            <FaUserGraduate className="choice-icon" />
            <h3>Student</h3>
            <p>Register as a student to explore and apply to universities worldwide</p>
          </Link>
          
          <Link to="/register/college" className="choice-card">
            <FaUniversity className="choice-icon" />
            <h3>University/College</h3>
            <p>Register your institution to connect with international students</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterChoice; 