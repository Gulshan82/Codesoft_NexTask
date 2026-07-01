const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });

const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

const seedTasks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nextask');
    console.log('MongoDB Connected successfully.');

    const projectId = '6a4229c5ea4f4a49c6107684';
    const project = await Project.findById(projectId);
    if (!project) {
      console.error('Project not found!');
      process.exit(1);
    }

    console.log(`Found project: ${project.name}`);

    // Clear old tasks of this project
    await Task.deleteMany({ project: projectId });
    console.log('Cleared existing tasks for this project.');

    // Fetch members and owner as valid assignee pools
    const userPool = [project.owner, ...project.members].filter(Boolean);
    console.log(`User pool size: ${userPool.length}`);

    const tasksData = [
      {
        title: 'Verify Backend Connection',
        description: 'Review database ping responses, check Atlas connection pooling, and verify local network DNS routing configuration.',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2), // 2 days in future
      },
      {
        title: 'Design System Typography Redesign',
        description: 'Update the tailwind stylesheet to use Inter and Outfit fonts, standardizing heading levels and line-heights globally.',
        status: 'To Do',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 4), // 4 days in future
      },
      {
        title: 'Write API Integration Tests',
        description: 'Create automated mocha/chai test suites to validate auth routes, user profile updates, and role-based permissions.',
        status: 'Completed',
        priority: 'Urgent',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 4), // 4 days in past
      },
      {
        title: 'Optimize Database Indexing',
        description: 'Analyze slow query logs and add compound indexes for project members and task statuses to speed up API response times.',
        status: 'To Do',
        priority: 'High',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2), // 2 days in past (Overdue!)
      },
      {
        title: 'Configure SSL Certificates',
        description: 'Generate Let\'s Encrypt SSL certificates for staging domain, and test TLS handshake responses using SSL Labs analyzer.',
        status: 'Review',
        priority: 'Urgent',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3), // 3 days in past (Overdue!)
      },
      {
        title: 'Build Team Analytics Dashboard',
        description: 'Implement frontend charts using recharts to display project velocity, task progress splits, and activity history stream.',
        status: 'To Do',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 8), // 8 days in future
      },
      {
        title: 'Draft User Documentation',
        description: 'Write Markdown setup guidelines detailing local env variables, docker compose commands, and API route documentation.',
        status: 'In Progress',
        priority: 'Low',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 12), // 12 days in future
      },
      {
        title: 'Setup CloudWatch Error Logs',
        description: 'Configure winston transports to stream backend server crash logs and unhandled rejections directly to AWS CloudWatch logs.',
        status: 'To Do',
        priority: 'Low',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 9), // 9 days in future
      },
      {
        title: 'Fix Profile Page Avatar Lag',
        description: 'Compress uploaded profile picture images before storing in S3 bucket to prevent rendering lag on navbar avatars.',
        status: 'Review',
        priority: 'Medium',
        dueDate: new Date(), // Due today!
      },
      {
        title: 'Dockerize Project Microservices',
        description: 'Build dockerfiles for backend and frontend apps, and tie them together with mongo container inside docker-compose yaml.',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 1), // Tomorrow
      },
      {
        title: 'Refactor Redux State Guard',
        description: 'Optimize user session persistence and auth slice selectors to avoid unneeded component re-renders during state mutations.',
        status: 'Completed',
        priority: 'Medium',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5), // 5 days in past
      },
      {
        title: 'Audit Node Modules Security',
        description: 'Run npm audit fix and update outdated backend dependencies to shield routes from prototype pollution vulnerabilities.',
        status: 'To Do',
        priority: 'High',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 6), // 6 days in future
      }
    ];

    // Map tasks and save
    const createdTasks = [];
    for (let i = 0; i < tasksData.length; i++) {
      const data = tasksData[i];
      // Random assignees from pool
      const taskAssignees = [];
      if (userPool.length > 0) {
        // assign 1-2 users
        const numAssignees = Math.min(userPool.length, Math.floor(Math.random() * 2) + 1);
        const shuffled = [...userPool].sort(() => 0.5 - Math.random());
        for (let k = 0; k < numAssignees; k++) {
          taskAssignees.push(shuffled[k]);
        }
      }

      const task = new Task({
        ...data,
        project: projectId,
        assignees: taskAssignees,
        checklist: [
          { text: 'Analyze initial logs', isCompleted: data.status === 'Completed' },
          { text: 'Code implementation review', isCompleted: data.status === 'Completed' },
          { text: 'Write automated unit test cases', isCompleted: false }
        ]
      });

      await task.save();
      createdTasks.push(task);

      // Create a matching Activity Log entry
      const activity = new Activity({
        user: userPool[0] || project.owner,
        project: projectId,
        task: task._id,
        action: data.status === 'Completed' ? 'completed the task' : 'created the task',
        details: task.title,
      });
      await activity.save();
    }

    console.log(`Successfully seeded ${createdTasks.length} tasks and logged activities!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedTasks();
