const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const collegeRoutes = require('./routes/college');
const studentRoutes = require('./routes/student');
const courseRoutes = require('./routes/course');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/college', collegeRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/college/courses', courseRoutes);

// Print all registered routes
console.log('Registered Routes:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    // Routes registered directly on app
    console.log(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        const path = handler.route.path;
        const methods = Object.keys(handler.route.methods);
        console.log(`${methods.join(',').toUpperCase()} ${path}`);
      }
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = server; 