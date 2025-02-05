const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');
const { getDashboardStats } = require('../controllers/adminController');

router.get('/dashboard', protect, isAdmin, getDashboardStats);

module.exports = router; 