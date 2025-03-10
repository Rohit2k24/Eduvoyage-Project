const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Log Cloudinary configuration (without sensitive data)
console.log('Configuring Cloudinary with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'present' : 'missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'present' : 'missing'
});

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test the configuration
cloudinary.api.ping()
  .then(() => console.log('✓ Cloudinary connection successful'))
  .catch(err => console.error('✗ Cloudinary connection failed:', err));

// Generate signature for direct upload
const generateSignature = (folder) => {
  const timestamp = Math.round((new Date).getTime()/1000);
  
  const signature = cloudinary.utils.api_sign_request({
    timestamp: timestamp,
    folder: `eduvoyage/${folder}`,
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
  }, process.env.CLOUDINARY_API_SECRET);

  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: `eduvoyage/${folder}`
  };
};

module.exports = {
  cloudinary,
  generateSignature
}; 