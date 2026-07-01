const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS override failed:', e.message);
}

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ quiet: true });

const restorePasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const users = await User.find({});
    console.log(`Found ${users.length} users. Restoring password field...`);

    for (const u of users) {
      u.password = '123456';
      await u.save();
      console.log(`Password field restored for: ${u.email}`);
    }

    console.log('All user passwords successfully restored to 123456.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error restoring passwords:', error);
  }
};

restorePasswords();
