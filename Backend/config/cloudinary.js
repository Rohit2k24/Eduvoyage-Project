const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Log Cloudinary configuration (without sensitive data)
console.log('Cloudinary Configuration:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '**present**' : '**missing**',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '**present**' : '**missing**'
});

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify configuration
try {
  // Test the configuration with a simple API call
  cloudinary.api.ping()
    .then(() => console.log('Cloudinary connection verified successfully'))
    .catch(error => console.error('Cloudinary connection test failed:', error));
} catch (error) {
  console.error('Error testing Cloudinary configuration:', error);
}

module.exports = cloudinary; 