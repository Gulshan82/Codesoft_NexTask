const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Store active password reset tokens in memory for simplified flow (or schema).
// To keep database clean and robust, we can add simple temp reset properties.
// Let's implement resetToken storage directly on the User model or dynamically.
// We can use a simple map in memory since it's a demo project, or just generate a token.
// Let's make it simpler and reliable: we can query the user and update a temporary field,
// but since User model doesn't have resetToken, let's update password directly or use a mock reset.
// Let's implement actual reset token logic. To do this, we can store resetToken in memory here:
const resetTokens = new Map(); // token -> { userId, expires }

// Helper to generate and send OTP
const generateAndSendOTP = async (user) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.verificationOTP = otp;
  user.verificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  const message = `Welcome to NexTask! Your verification OTP is: ${otp}. It will expire in 10 minutes.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0b0f19; color: #f1f5f9;">
      <h2 style="color: #8b5cf6; text-align: center; margin-bottom: 24px;">Welcome to NexTask</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">Thank you for registering. Please verify your email using the following One-Time Password (OTP):</p>
      <div style="font-size: 32px; font-weight: 800; text-align: center; letter-spacing: 6px; padding: 20px; margin: 28px 0; background-color: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); color: #a78bfa; border-radius: 16px; font-family: monospace;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 24px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: 'NexTask Email Verification OTP',
    message,
    html,
  });
};

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

    let user;
    try {
      user = await User.create({
        name,
        email,
        password,
        role: registrationRole,
        isVerified: false,
      });

      // Generate & send OTP
      await generateAndSendOTP(user);

      res.status(201).json({
        message: 'Registration successful! Verification OTP sent to your email.',
        email: user.email,
      });
    } catch (err) {
      if (user) {
        await User.deleteOne({ _id: user._id });
      }
      res.status(500).json({ message: err.message || 'Registration failed during verification process. Please check your SMTP settings.' });
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
      // Check if user is verified
      if (!user.isVerified) {
        await generateAndSendOTP(user);
        return res.status(403).json({
          message: 'Your email is not verified. A new OTP has been sent to your email.',
          email: user.email,
          isVerified: false,
        });
      }

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

// @desc    Verify Registration OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP code' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (user.verificationOTP !== otp || user.verificationOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    res.status(200).json({
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

// @desc    Resend Verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate & send OTP
    await generateAndSendOTP(user);

    res.status(200).json({ message: 'A new OTP has been sent to your email.' });
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
  verifyOTP,
  resendOTP,
};
