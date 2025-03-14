const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide hostel name']
  },
  type: {
    type: String,
    enum: ['boys', 'girls', 'co-ed'],
    required: [true, 'Please specify hostel type']
  },
  totalRooms: {
    type: Number,
    required: [true, 'Please specify total number of rooms']
  },
  availableRooms: {
    type: Number,
    required: [true, 'Please specify available rooms']
  },
  roomTypes: [{
    type: {
      type: String,
      enum: {
        values: ['single', 'double', 'triple', 'dormitory'],
        message: '{VALUE} is not a valid room type'
      },
      required: [true, 'Room type is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    totalBeds: {
      type: Number,
      required: [true, 'Total beds is required'],
      min: [1, 'Total beds must be at least 1']
    },
    availableBeds: {
      type: Number,
      required: true,
      min: [0, 'Available beds cannot be negative']
    },
    amenities: [String],
    images: [String]
  }],
  facilities: [{
    name: String,
    description: String,
    icon: String
  }],
  rules: [String],
  location: {
    address: String,
    distanceFromCollege: Number, // in kilometers
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  images: [String],
  description: String,
  wardenContact: {
    name: String,
    phone: String,
    email: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  reviews: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for better query performance
HostelSchema.index({ college: 1, type: 1 });

module.exports = mongoose.model('Hostel', HostelSchema); 