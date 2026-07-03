const express = require('express');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  googleLogin,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/update-password', protect, updatePassword);
router.post('/google', authLimiter, googleLogin);

module.exports = router;
