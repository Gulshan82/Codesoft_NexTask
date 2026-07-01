const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');

// @desc    Get dashboard metrics & statistics
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    let projectQuery = {};
    let taskQuery = {};

    // Admins see everything. PMs and Members see their own projects and associated tasks.
    if (req.user.role !== 'Admin') {
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      }).select('_id');
      
      const projectIds = userProjects.map(p => p._id);
      
      projectQuery = { _id: { $in: projectIds } };
      taskQuery = { project: { $in: projectIds } };
    }

    // 1. Total counts
    const totalProjects = await Project.countDocuments(projectQuery);
    const totalTasks = await Task.countDocuments(taskQuery);
    
    const completedTasks = await Task.countDocuments({ ...taskQuery, status: 'Completed' });
    const inProgressTasks = await Task.countDocuments({ ...taskQuery, status: 'In Progress' });
    const reviewTasks = await Task.countDocuments({ ...taskQuery, status: 'Review' });
    const todoTasks = await Task.countDocuments({ ...taskQuery, status: 'To Do' });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Overdue tasks: status !== Completed and dueDate < start of today
    const overdueTasks = await Task.countDocuments({
      ...taskQuery,
      status: { $ne: 'Completed' },
      dueDate: { $lt: startOfToday },
    });

    // Overdue projects: status !== Completed and deadline < start of today
    const overdueProjects = await Project.countDocuments({
      ...projectQuery,
      status: { $ne: 'Completed' },
      deadline: { $lt: startOfToday },
    });

    // Active members (distinct user count across our projects)
    let totalMembersCount = 0;
    if (req.user.role === 'Admin') {
      totalMembersCount = await User.countDocuments({});
    } else {
      const projects = await Project.find(projectQuery).select('members owner');
      const uniqueMemberIds = new Set();
      projects.forEach(p => {
        uniqueMemberIds.add(p.owner.toString());
        p.members.forEach(m => uniqueMemberIds.add(m.toString()));
      });
      totalMembersCount = uniqueMemberIds.size;
    }

    // 2. Task Completion Graph Data (Task Status Split)
    const taskStatusData = [
      { name: 'To Do', value: todoTasks },
      { name: 'In Progress', value: inProgressTasks },
      { name: 'Review', value: reviewTasks },
      { name: 'Completed', value: completedTasks },
    ];

    // 3. Weekly Activity Logs / Progress (Simulated or Aggregated)
    // Let's get completed tasks count group by day for the last 7 days.
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: date.toISOString().split('T')[0],
        completed: 0,
        created: 0,
      });
    }

    const startOf7DaysAgo = new Date();
    startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 6);
    startOf7DaysAgo.setHours(0, 0, 0, 0);

    const recentlyCompletedTasks = await Task.find({
      ...taskQuery,
      status: 'Completed',
      dueDate: { $gte: startOf7DaysAgo }, // simple proxy or creation date
    }).select('dueDate createdAt');

    const recentlyCreatedTasks = await Task.find({
      ...taskQuery,
      createdAt: { $gte: startOf7DaysAgo },
    }).select('createdAt');

    last7Days.forEach(day => {
      // match created
      const createdCount = recentlyCreatedTasks.filter(t => {
        const cDate = new Date(t.createdAt).toISOString().split('T')[0];
        return cDate === day.dateStr;
      }).length;
      
      // match completed (use dueDate or simple fallback date since we don't have task completion timestamps)
      const completedCount = recentlyCompletedTasks.filter(t => {
        const cDate = new Date(t.dueDate || t.createdAt).toISOString().split('T')[0];
        return cDate === day.dateStr;
      }).length;

      day.created = createdCount;
      day.completed = completedCount;
    });

    // 4. Recent Activities (limited to 8 items)
    let activityQuery = {};
    if (req.user.role !== 'Admin') {
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      }).select('_id');
      activityQuery = { project: { $in: userProjects.map(p => p._id) } };
    }

    const recentActivities = await Activity.find(activityQuery)
      .populate('user', 'name email avatar role')
      .populate('project', 'name')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(8);

    // 5. Critical/Upcoming Deadlines (including overdue items)
    const upcomingTasks = await Task.find({
      ...taskQuery,
      status: { $ne: 'Completed' },
      dueDate: { $ne: null },
    })
      .populate('project', 'name')
      .sort({ dueDate: 1 })
      .limit(5);

    const upcomingProjects = await Project.find({
      ...projectQuery,
      status: { $ne: 'Completed' },
      deadline: { $ne: null },
    })
      .sort({ deadline: 1 })
      .limit(5);

    const upcomingDeadlines = [
      ...upcomingTasks.map(t => ({
        id: t._id,
        title: t.title,
        type: 'Task',
        projectName: t.project?.name || 'N/A',
        dueDate: t.dueDate,
        priority: t.priority,
      })),
      ...upcomingProjects.map(p => ({
        id: p._id,
        title: p.name,
        type: 'Project',
        projectName: p.name,
        dueDate: p.deadline,
        priority: p.priority,
      })),
    ]
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    res.json({
      counts: {
        projects: totalProjects,
        tasks: totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks,
        overdueProjects,
        members: totalMembersCount,
      },
      taskStatusData,
      weeklyProgress: last7Days,
      recentActivities,
      upcomingDeadlines,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
