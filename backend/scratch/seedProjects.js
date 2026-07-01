const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });

const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');

const seedProjects = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nextask');
    console.log('MongoDB Connected successfully.');

    // Fetch all users to assign owners/members
    const users = await User.find({});
    if (users.length === 0) {
      console.error('No users found in database! Please run the app or register first.');
      process.exit(1);
    }

    const adminUser = users.find(u => u.role === 'Admin') || users[0];
    const otherUsers = users.filter(u => u._id.toString() !== adminUser._id.toString());
    const memberIds = otherUsers.map(u => u._id);

    console.log(`Using owner: ${adminUser.name} (${adminUser.role})`);

    const activeProjectId = '6a4229c5ea4f4a49c6107684';

    // Delete all projects EXCEPT the active one
    await Project.deleteMany({ _id: { $ne: activeProjectId } });
    // Also delete any tasks that belong to deleted projects
    await Task.deleteMany({ project: { $ne: activeProjectId } });
    console.log('Cleared other projects and their tasks.');

    const newProjectsData = [
      {
        name: 'Alpha CRM Platform',
        description: 'Design and deploy a customer relationship manager dashboard for scaling operations and sales forecasting pipelines.',
        status: 'Active',
        priority: 'Critical',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000 * 15), // 15 days in future
        progress: 45,
        tasks: [
          { title: 'Setup Stripe billing webhook', status: 'In Progress', priority: 'High' },
          { title: 'Design customer intake form', status: 'Completed', priority: 'Medium' },
          { title: 'Optimize search indexing query', status: 'To Do', priority: 'Low' }
        ]
      },
      {
        name: 'Beta E-Commerce Portal',
        description: 'Redesigning checkout gateway pipeline and catalog layout for mobile responsive view optimization.',
        status: 'Planning',
        priority: 'High',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000 * 30), // 30 days in future
        progress: 10,
        tasks: [
          { title: 'Mockup product description page', status: 'To Do', priority: 'Medium' },
          { title: 'Define commerce database schemas', status: 'In Progress', priority: 'High' },
          { title: 'Register payment merchant account', status: 'To Do', priority: 'Urgent' }
        ]
      },
      {
        name: 'Security Audit & Hardening',
        description: 'Vulnerability assessment testing, API payload validation filters, and SSL certificate installation audit.',
        status: 'On Hold',
        priority: 'Critical',
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000 * 6), // 6 days in past (Overdue Project!)
        progress: 30,
        tasks: [
          { title: 'Review OWASP top 10 hazards', status: 'In Progress', priority: 'High' },
          { title: 'Configure cors access headers', status: 'Review', priority: 'Medium' },
          { title: 'Run static code analysis security scan', status: 'To Do', priority: 'Urgent' }
        ]
      },
      {
        name: 'Mobile App Prototype',
        description: 'Exporting Figma component screens, initializing React Native codebase, and testing expo build deployments.',
        status: 'Completed',
        priority: 'Medium',
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3), // 3 days in past
        progress: 100,
        tasks: [
          { title: 'Create figma interactive wires', status: 'Completed', priority: 'Medium' },
          { title: 'Initialize expo starter kit template', status: 'Completed', priority: 'High' },
          { title: 'Test device push notifications', status: 'Completed', priority: 'Medium' }
        ]
      }
    ];

    for (const pData of newProjectsData) {
      const { tasks, ...projectFields } = pData;

      const project = new Project({
        ...projectFields,
        owner: adminUser._id,
        members: memberIds,
      });

      await project.save();
      console.log(`Created project: ${project.name}`);

      // Create matching Activity Log for Project creation
      const activityProj = new Activity({
        user: adminUser._id,
        project: project._id,
        action: 'created the project',
        details: project.name,
      });
      await activityProj.save();

      // Seed tasks inside this project
      for (const tData of tasks) {
        const task = new Task({
          title: tData.title,
          description: `Automatic mock task generated for ${project.name} during seeder execution.`,
          status: tData.status,
          priority: tData.priority,
          project: project._id,
          assignees: [adminUser._id],
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1)),
          checklist: [
            { text: 'Initial setup', isCompleted: tData.status === 'Completed' },
            { text: 'Self review', isCompleted: tData.status === 'Completed' }
          ]
        });

        await task.save();

        const activityTask = new Activity({
          user: adminUser._id,
          project: project._id,
          task: task._id,
          action: tData.status === 'Completed' ? 'completed the task' : 'created the task',
          details: task.title,
        });
        await activityTask.save();
      }
      console.log(`  Seeded ${tasks.length} tasks for ${project.name}`);
    }

    const totalCount = await Project.countDocuments({});
    console.log(`Seeding completed. Total projects in database: ${totalCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding projects failed:', error);
    process.exit(1);
  }
};

seedProjects();
