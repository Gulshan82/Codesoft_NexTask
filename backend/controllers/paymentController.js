const Razorpay = require('razorpay');
const User = require('../models/User');
const crypto = require('crypto');

// Setup Razorpay instance, fallback to mock system if environment values are empty
const isKeyConfigured = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
let razorpayInstance = null;

if (isKeyConfigured) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('\x1b[32mRazorpay gateway loaded successfully.\x1b[0m');
} else {
  console.log('\x1b[33mRazorpay credentials not found in env. Running in Mock Checkout Mode.\x1b[0m');
}

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payments/order
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const { planName } = req.body;

    if (!['Pro', 'Enterprise'].includes(planName)) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const amount = planName === 'Pro' ? 99900 : 999900; // In paise (e.g. 99900 paise = 999.00 INR)

    // Fallback for Mock Mode
    if (!razorpayInstance) {
      return res.status(200).json({
        id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        amount: amount,
        currency: 'INR',
        isMock: true,
        key_id: 'rzp_test_mockKeyId123',
      });
    }

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_subscription_${planName.toLowerCase()}_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      ...order,
      key_id: process.env.RAZORPAY_KEY_ID,
      isMock: false,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: error.message || 'Error generating payment order' });
  }
};

/**
 * @desc    Verify Razorpay Signature & Upgrade Plan
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      isMock,
    } = req.body;

    if (!planName) {
      return res.status(400).json({ message: 'Plan name is required' });
    }

    // Expiration date (30 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    // Skip crypto verification if in Mock Mode
    if (isMock || !razorpayInstance) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User account not found' });
      }

      user.subscriptionPlan = planName;
      user.subscriptionExpires = expirationDate;
      await user.save();

      return res.status(200).json({
        success: true,
        message: `Plan upgraded to ${planName} successfully (Simulated Payment)!`,
        user: {
          name: user.name,
          email: user.email,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionExpires: user.subscriptionExpires,
        },
      });
    }

    // Verify cryptographic signature for Razorpay
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User account not found' });
      }

      user.subscriptionPlan = planName;
      user.subscriptionExpires = expirationDate;
      await user.save();

      res.status(200).json({
        success: true,
        message: `Plan upgraded to ${planName} successfully!`,
        user: {
          name: user.name,
          email: user.email,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionExpires: user.subscriptionExpires,
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature validation' });
    }
  } catch (error) {
    console.error('Razorpay verify payment error:', error);
    res.status(500).json({ message: error.message || 'Error validating payment status' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
