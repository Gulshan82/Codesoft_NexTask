const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');

// Store active password reset tokens in memory for simplified flow (or schema).
// To keep database clean and robust, we can add simple temp reset properties.
// Let's implement resetToken storage directly on the User model or dynamically.
// We can use a simple map in memory since it's a demo project, or just generate a token.
// Let's make it simpler and reliable: we can query the user and update a temporary field,
// but since User model doesn't have resetToken, let's update password directly or use a mock reset.
// Let's implement actual reset token logic. To do this, we can store resetToken in memory here:
const resetTokens = new Map(); // token -> { userId, expires }

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Prevent escalations: new registrations cannot assign themselves the Admin role
    let registrationRole = role || 'Team Member';
    if (registrationRole === 'Admin') {
      registrationRole = 'Team Member';
    }

    const user = await User.create({
      name,
      email,
      password,
      role: registrationRole,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpires: user.subscriptionExpires,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpires: user.subscriptionExpires,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    resetTokens.set(resetToken, { userId: user._id, expires });

    // In a real app we'd send an email. For this app, we will return the token in the API response
    // so the frontend can immediately load the reset form or show it for development ease.
    res.json({
      message: 'Reset token generated (simulated email send)',
      resetToken,
      resetUrl: `/reset-password/${resetToken}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const resetInfo = resetTokens.get(token);

    if (!resetInfo || resetInfo.expires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    const user = await User.findById(resetInfo.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = password;
    await user.save();

    // Clean up token
    resetTokens.delete(token);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (user && (await user.comparePassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
};
