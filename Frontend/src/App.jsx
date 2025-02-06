import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Components/Login/login'
import Register from './Components/Register/register'
import RegisterChoice from './Components/Register/RegisterChoice'
import Home from './Pages/Home/Home'
import ForgotPassword from './Components/Login/ForgotPassword'
import ResetPassword from './Components/Login/ResetPassword'
import AdminDashboard from './Admin Module/Components/AdminDashboard/AdminDashboard'
import CollegeVerificationForm from './Components/College/CollegeVerification/CollegeVerificationForm'
import VerificationStatus from './Components/College/CollegeVerification/VerificationStatus'
import ProtectedRoute from './Components/Common/ProtectedRoute'
import CollegeManagement from './Admin Module/Components/CollegeManagement/CollegeManagement'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-redirect" element={<RegisterChoice />} />
        <Route path="/register/student" element={<Register userType="student" />} />
        <Route path="/register/college" element={<Register userType="college" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/college/verification-form" element={
          <ProtectedRoute allowedRoles={['college']}>
            <CollegeVerificationForm />
          </ProtectedRoute>
        } />
        
        <Route path="/college/verification-status" element={
          <ProtectedRoute allowedRoles={['college']}>
            <VerificationStatus />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/colleges" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CollegeManagement />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App
