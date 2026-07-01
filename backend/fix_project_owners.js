const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS override failed:', e.message);
}

const mongoose = require('mongoose');
const Project = require('./models/Project');
const User = require('./models/User');
require('dotenv').config({ quiet: true });

const fixOwners = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Get a default valid user (Admin or Project Manager) to assign orphaned projects to
    const defaultUser = await User.findOne({ role: 'Admin' }) || await User.findOne({});
    if (!defaultUser) {
      console.error('No users found in database to assign projects to!');
      await mongoose.disconnect();
      return;
    }
    console.log(`Default fallback owner will be: ${defaultUser.email} (${defaultUser._id})`);

    const projects = await Project.find({});
    console.log(`Found ${projects.length} total projects.`);

    let fixedCount = 0;
    for (const project of projects) {
      // Check if the owner exists in the database
      const ownerExists = await User.findById(project.owner);
      if (!project.owner || !ownerExists) {
        console.log(`Project "${project.name}" has an invalid/missing owner. Reassigning...`);
        project.owner = defaultUser._id;
        await project.save();
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} projects.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing project owners:', error);
  }
};

fixOwners();
