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
import ProtectedRoute from './Components/ProtectedRoute'
import CollegeManagement from './Admin Module/Components/CollegeManagement/CollegeManagement'
import CourseManagement from './Components/College/Courses/CourseManagement'
import CourseForm from './Components/College/Courses/CourseForm'
import StudentManagement from './Components/College/Students/StudentManagement'
import CollegeDashboard from './Components/College/CollegeDashboard/CollegeDashboard'
import StudentDashboard from './Components/Student/Dashboard/StudentDashboard'
import CourseList from './Components/Student/Courses/CourseList'
import StudentApplications from './Components/Student/Applications/StudentApplications'
import StudentNotifications from './Components/Student/Notifications/StudentNotifications'
import StudentProfile from './Components/Student/Profile/StudentProfile'
import StudentSettings from './Components/Student/Settings/StudentSettings'
import AdminStudentManagement from './Admin Module/Components/StudentManagement/StudentManagement'
// import StudentSupport from './Components/Student/Support/StudentSupport'
import CourseDetails from './Components/Student/Courses/CourseDetails'
import CollegeApplications from './Components/College/Applications/CollegeApplications'
import CollegeList from './Components/Student/Colleges/CollegeList'
import CollegeCourses from './Components/Student/Colleges/CollegeCourses'
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
        
        <Route path="/college/courses" element={
          <ProtectedRoute allowedRoles={['college']}>
            <CourseManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/college/courses/add" element={
          <ProtectedRoute allowedRoles={['college']}>
            <CourseForm />
          </ProtectedRoute>
        } />
        
        <Route path="/college/courses/edit/:id" element={
          <ProtectedRoute allowedRoles={['college']}>
            <CourseForm />
          </ProtectedRoute>
        } />
        
        <Route path="/college/students" element={
          <ProtectedRoute allowedRoles={['college']}>
            <StudentManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/college/dashboard" element={
          <ProtectedRoute allowedRoles={['college']}>
            <CollegeDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/student/courses" element={<CourseList />} />
        
        <Route path="/student/applications" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentApplications />
          </ProtectedRoute>
        } />
        
        <Route path="/student/notifications" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentNotifications />
          </ProtectedRoute>
        } />
        
        <Route path="/student/profile" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/student/settings" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentSettings />
          </ProtectedRoute>
        } />
        
        {/* <Route path="/student/support" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentSupport />
          </ProtectedRoute>
        } /> */}
        
        <Route path="/admin/students" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminStudentManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/student/courses/:courseId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <CourseDetails />
          </ProtectedRoute>
        } />
        
        <Route 
          path="/college/applications" 
          element={
            <ProtectedRoute allowedRoles={['college']}>
              <CollegeApplications />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/student/colleges" element={
          <ProtectedRoute allowedRoles={['student']}>
            <CollegeList />
          </ProtectedRoute>
        } />
        
        <Route path="/student/colleges/:collegeId/courses" element={
          <ProtectedRoute allowedRoles={['student']}>
            <CollegeCourses />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App
