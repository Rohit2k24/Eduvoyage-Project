import { FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './ApplicationStatus.css';

const ApplicationStatus = ({ status }) => {
  const statusConfig = {
    pending: { 
      color: 'status-pending', 
      icon: <FaClock />, 
      label: 'Pending',
      description: 'Your application is being reviewed'
    },
    approved: { 
      color: 'status-approved', 
      icon: <FaCheckCircle />, 
      label: 'Approved',
      description: 'Congratulations! Your application has been approved'
    },
    rejected: { 
      color: 'status-rejected', 
      icon: <FaTimesCircle />, 
      label: 'Rejected',
      description: 'Unfortunately, your application was not successful'
    }
  };

  const { color, icon, label, description } = statusConfig[status] || statusConfig.pending;

  return (
    <div className={`application-status ${color}`}>
      <div className="status-icon">{icon}</div>
      <div className="status-info">
        <span className="status-label">{label}</span>
        <span className="status-description">{description}</span>
      </div>
    </div>
  );
};

export default ApplicationStatus; 