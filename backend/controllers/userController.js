const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpires: user.subscriptionExpires,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionExpires: updatedUser.subscriptionExpires,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (for assignment lists)
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    const roleOrder = { 'Admin': 1, 'Project Manager': 2, 'Team Member': 3 };
    users.sort((a, b) => {
      const orderA = roleOrder[a.role] || 4;
      const orderB = roleOrder[b.role] || 4;
      return orderA - orderB;
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update any user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    console.log('updateUserRole request received:', {
      id: req.params.id,
      body: req.body,
      adminUser: req.user._id,
    });

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can perform this action' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.role) {
      user.role = req.body.role;
    }

    if (req.body.subscriptionPlan !== undefined) {
      const newPlan = req.body.subscriptionPlan;
      if (!['Starter', 'Pro', 'Enterprise'].includes(newPlan)) {
        return res.status(400).json({ message: 'Invalid subscription plan selected' });
      }
      user.subscriptionPlan = newPlan;
      if (newPlan === 'Starter') {
        user.subscriptionExpires = undefined;
      } else {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        user.subscriptionExpires = expirationDate;
      }
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      subscriptionPlan: updatedUser.subscriptionPlan,
      subscriptionExpires: updatedUser.subscriptionExpires,
    });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
};
