const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  submitApplication
} = require('../controllers/studentController');
const multer = require('multer');
const auth = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/profile', auth, getProfile);
router.put('/profile', auth, upload.single('profilePic'), updateProfile);
router.post('/applications', auth, submitApplication);

module.exports = router; 