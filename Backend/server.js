const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const collegeRoutes = require('./routes/college');
const path = require('path');
const fs = require('fs');

// Import routes (we'll create these next)
// const authRoutes = require('./routes/auth');
// const adminRoutes = require('./routes/admin');
// const collegeRoutes = require('./routes/college');
// const studentRoutes = require('./routes/student');

// Initialize express
const app = express();
dotenv.config();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/college', collegeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected! Attempting to reconnect...');
  connectDB();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  connectDB();
});

// After MongoDB connection is established
mongoose.connection.once('open', async () => {
  try {
    await mongoose.connection.collection('colleges').dropIndex('registrationNumber_1');
    console.log('Dropped registrationNumber index');
  } catch (error) {
    // Index might not exist, which is fine
    console.log('No registrationNumber index to drop');
  }
});

// Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/college', collegeRoutes);
// app.use('/api/student', studentRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Initialize database connection
  connectDB();
});
