const express = require('express');
const router = express.Router();
const { sendVerificationCode, verifyAndRegister, login } = require('../controllers/authController');

router.post('/send-verification', sendVerificationCode);
router.post('/verify-and-register', verifyAndRegister);
router.post('/login', login);

module.exports = router; 