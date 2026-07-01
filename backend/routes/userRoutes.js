const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/', protect, getAllUsers);
router.put('/:id', protect, updateUserRole);

module.exports = router;
