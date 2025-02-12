import { FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ApplicationStatus = ({ status }) => {
  const statusConfig = {
    pending: { color: 'text-orange-500', icon: <FaClock />, label: 'Pending' },
    approved: { color: 'text-green-500', icon: <FaCheckCircle />, label: 'Approved' },
    rejected: { color: 'text-red-500', icon: <FaTimesCircle />, label: 'Rejected' }
  };

  const { color, icon, label } = statusConfig[status] || {};

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}; 