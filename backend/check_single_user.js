const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS override failed:', e.message);
}
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ quiet: true });

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');
    const users = await User.find({}, 'name email role subscriptionPlan subscriptionExpires');
    console.log('All Users:');
    users.forEach(u => {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Plan: ${u.subscriptionPlan}, Expires: ${u.subscriptionExpires}`);
    });
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkUser();
