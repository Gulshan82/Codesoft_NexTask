const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS override failed:', e.message);
}

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ quiet: true });

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const users = await User.find({});
    for (const u of users) {
      u.password = '123456';
      await u.save();
      console.log(`Password reset for user: ${u.email}`);
    }

    console.log('All passwords have been reset to: 123456');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

reset();
