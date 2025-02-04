import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Components/Login/login'
import Register from './Components/Register/register'
import RegisterChoice from './Components/Register/RegisterChoice'
import Home from './Pages/Home/Home'
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
      </Routes>
    </Router>
  )
}

export default App
