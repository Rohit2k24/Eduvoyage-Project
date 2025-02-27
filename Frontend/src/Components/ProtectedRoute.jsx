import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'student':
        return <Navigate to="/student-dashboard" />;
      case 'college':
        return <Navigate to="/college/dashboard" />;
      case 'admin':
        return <Navigate to="/admin-dashboard" />;
      default:
        return <Navigate to="/" />;
    }
  }

  return children;
};

export default ProtectedRoute; 