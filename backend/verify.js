const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS override failed:', e.message);
}

const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Activity = require('./models/Activity');
const Notification = require('./models/Notification');

const testDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nextask_test';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    // Clean up test collections
    await User.deleteMany({ email: { $in: ['gk4644771@gmail.com', /@test\.com$/] } });
    console.log('Cleaned up previous test users.');

    // 1. Create a Test User (Admin)
    console.log('\n--- Test 1: User Registration ---');
    const adminUser = await User.create({
      name: 'Admin Tester',
      email: 'gk4644771@gmail.com',
      password: 'Gulshan@#$123',
      role: 'Admin',
      isVerified: true,
    });
    console.log(`Created User: ${adminUser.name} [Role: ${adminUser.role}]`);

    // Verify password compare works
    const isMatch = await adminUser.comparePassword('Gulshan@#$123');
    console.log('Password comparison check:', isMatch ? 'PASSED' : 'FAILED');

    // 2. Create a Test Project
    console.log('\n--- Test 2: Project Creation ---');
    const project = await Project.create({
      name: 'Test Project Suite',
      description: 'Verifying backend integrity',
      status: 'Planning',
      priority: 'High',
      owner: adminUser._id,
      members: [],
    });
    console.log(`Created Project: "${project.name}" (Status: ${project.status})`);

    // Log Activity
    await Activity.create({
      user: adminUser._id,
      project: project._id,
      action: 'created project',
      details: `Project "${project.name}" initialized.`,
    });
    console.log('Activity logged successfully.');

    // 3. Create a Test Task
    console.log('\n--- Test 3: Task Creation ---');
    const task = await Task.create({
      title: 'Setup verification tests',
      description: 'Write integration checks and run them',
      project: project._id,
      status: 'To Do',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      assignees: [adminUser._id],
    });
    console.log(`Created Task: "${task.title}" (Status: ${task.status})`);

    // Verify task linkage
    const foundTask = await Task.findById(task._id).populate('project');
    console.log(`Populated Task Parent Project: "${foundTask.project.name}"`);

    console.log('\n--- Verification: ALL TESTS PASSED ---');
    process.exit(0);
  } catch (error) {
    console.error('Test suite failed:', error.message);
    process.exit(1);
  }
};

testDB();
