const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS override failed:', e.message);
}

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ quiet: true });

const reorderUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Fetch all users
    const users = await User.find({}).select('+password');
    console.log(`Fetched ${users.length} users.`);

    // 2. Sort users in memory (Admin first)
    const roleOrder = { 'Admin': 1, 'Project Manager': 2, 'Team Member': 3 };
    const sortedUsers = [...users].sort((a, b) => {
      const orderA = roleOrder[a.role] || 4;
      const orderB = roleOrder[b.role] || 4;
      return orderA - orderB;
    });

    // 3. Delete all users from collection
    await User.deleteMany({});
    console.log('Cleared all users from database.');

    // 4. Re-insert them using raw collection insertMany to bypass Mongoose save hooks (avoiding double-hashing)
    const rawUsers = sortedUsers.map(u => u.toObject());
    await User.collection.insertMany(rawUsers);
    console.log('Successfully re-inserted users with Admin first!');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('Error reordering users:', error);
  }
};

reorderUsers();
