const mongoose = require('mongoose');
const Course = require('../models/Course');
const College = require('../models/College');
require('dotenv').config();

const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a college ID (you need at least one college in the database)
    const college = await College.findOne();
    if (!college) {
      console.error('No college found in database');
      return;
    }

    const coursesData = [
      {
        name: 'Bachelor of Computer Science',
        description: 'A comprehensive program covering computer science fundamentals',
        college: college._id,
        duration: 4,
        fees: 400000,
        seats: {
          total: 60,
          available: 60
        },
        eligibility: '12th with Mathematics',
        startDate: new Date('2024-08-01'),
        applicationDeadline: new Date('2024-06-30'),
        status: 'active'
      },
      {
        name: 'Master of Business Administration',
        description: 'Advanced business management program',
        college: college._id,
        duration: 2,
        fees: 600000,
        seats: {
          total: 40,
          available: 40
        },
        eligibility: 'Bachelor\'s degree with 60%',
        startDate: new Date('2024-08-01'),
        applicationDeadline: new Date('2024-06-30'),
        status: 'active'
      }
    ];

    await Course.insertMany(coursesData);
    console.log('Courses seeded successfully');
  } catch (error) {
    console.error('Error seeding courses:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedCourses(); 