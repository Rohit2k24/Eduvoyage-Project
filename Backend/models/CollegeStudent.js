const mongoose = require('mongoose');

const CollegeStudentSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentNumber: {
    type: String,
    unique: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'dropped'],
    default: 'active'
  },
  academicDetails: {
    batch: String,
    semester: {
      type: Number,
      default: 1
    },
    section: String
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate enrollment number
CollegeStudentSchema.pre('save', async function(next) {
  try {
    if (!this.enrollmentNumber) {
      const year = new Date().getFullYear();
      const college = await mongoose.model('College').findById(this.college);
      const collegeCode = college.name.substring(0, 3).toUpperCase();
      
      // Find the latest enrollment number for this college and year
      const latestStudent = await this.constructor.findOne({
        college: this.college,
        enrollmentNumber: new RegExp(`^${collegeCode}${year}`)
      }).sort({ enrollmentNumber: -1 });

      let nextNumber = 1;
      if (latestStudent && latestStudent.enrollmentNumber) {
        const currentNumber = parseInt(latestStudent.enrollmentNumber.slice(-4));
        nextNumber = currentNumber + 1;
      }

      // Generate new enrollment number: COLYYYYNNNN
      this.enrollmentNumber = `${collegeCode}${year}${nextNumber.toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add indexes for better performance
CollegeStudentSchema.index({ college: 1, student: 1 }, { unique: true });
CollegeStudentSchema.index({ enrollmentNumber: 1 }, { unique: true });
CollegeStudentSchema.index({ status: 1 });

module.exports = mongoose.model('CollegeStudent', CollegeStudentSchema); 