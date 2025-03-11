const express = require('express');
const { protect } = require('../middleware/auth');
const { analyzeCareerPaths } = require('../controllers/aiController');

const router = express.Router();

router.post('/career-paths', protect, analyzeCareerPaths);

module.exports = router; 