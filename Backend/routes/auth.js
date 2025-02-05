const express = require('express');
const router = express.Router();
const { sendVerificationCode, verifyAndRegister, login, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/send-verification', sendVerificationCode);
router.post('/verify-and-register', verifyAndRegister);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router; 