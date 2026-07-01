const express = require('express');
const { getDashboardStats } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);

module.exports = router;
