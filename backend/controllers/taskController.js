const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

// Helper to log activities
const logActivity = async (userId, projectId, taskId, action, details) => {
  try {
    await Activity.create({
      user: userId,
      project: projectId,
      task: taskId,
      action,
      details,
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

// Helper to update project progress percentage
const updateProjectProgress = async (projectId) => {
  try {
    const totalTasks = await Task.countDocuments({ project: projectId });
    if (totalTasks === 0) {
      await Project.findByIdAndUpdate(projectId, { progress: 0 });
      return;
    }
    const completedTasks = await Task.countDocuments({ project: projectId, status: 'Completed' });
    const progress = Math.round((completedTasks / totalTasks) * 100);
    await Project.findByIdAndUpdate(projectId, { progress });
  } catch (error) {
    console.error('Failed to update project progress:', error.message);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, project: projectId, status, priority, dueDate, assignees, checklist } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      status: status || 'To Do',
      priority: priority || 'Medium',
      dueDate,
      assignees: assignees || [],
      checklist: checklist || [],
      createdBy: req.user._id,
    });

    await updateProjectProgress(projectId);
    await logActivity(req.user._id, projectId, task._id, 'created task', `Task "${title}" was created.`);

    // Send notifications to assignees
    if (assignees && assignees.length > 0) {
      const notifications = assignees.map(userId => ({
        recipient: userId,
        sender: req.user._id,
        type: 'TaskAssigned',
        project: projectId,
        task: task._id,
        message: `You have been assigned the task "${title}" by ${req.user.name}.`,
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name owner')
      .populate('assignees', 'name email role avatar')
      .populate('createdBy', 'name email role avatar')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'name email avatar role' }
      })
      .populate('attachments');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, status, priority, dueDate, assignees, checklist } = req.body;
    const oldStatus = task.status;
    const oldAssignees = task.assignees.map(id => id.toString());

    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    task.assignees = assignees || task.assignees;
    task.checklist = checklist || task.checklist;

    const updatedTask = await task.save();

    // Trigger update project progress if status changed
    if (oldStatus !== task.status) {
      await updateProjectProgress(task.project);
      await logActivity(req.user._id, task.project, task._id, 'updated task status', `Task "${task.title}" status changed from "${oldStatus}" to "${task.status}".`);

      // Notify project owner/assignees if task is completed
      if (task.status === 'Completed') {
        const project = await Project.findById(task.project);
        const notificationRecipients = new Set([...task.assignees.map(id => id.toString()), project.owner.toString()]);
        
        // Remove current user from notification
        notificationRecipients.delete(req.user._id.toString());

        if (notificationRecipients.size > 0) {
          const notifications = Array.from(notificationRecipients).map(recipientId => ({
            recipient: recipientId,
            sender: req.user._id,
            type: 'TaskCompleted',
            project: task.project,
            task: task._id,
            message: `Task "${task.title}" was completed by ${req.user.name}.`,
          }));
          await Notification.insertMany(notifications);
        }
      }
    } else {
      await logActivity(req.user._id, task.project, task._id, 'updated task', `Task "${task.title}" details were modified.`);
    }

    // Detect new assignees and notify them
    if (assignees) {
      const newAssignees = assignees.filter(userId => !oldAssignees.includes(userId.toString()));
      if (newAssignees.length > 0) {
        const notifications = newAssignees.map(userId => ({
          recipient: userId,
          sender: req.user._id,
          type: 'TaskAssigned',
          project: task.project,
          task: task._id,
          message: `You have been assigned the task "${task.title}" by ${req.user.name}.`,
        }));
        await Notification.insertMany(notifications);
      }
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const projectId = task.project;
    const taskTitle = task.title;

    await Task.findByIdAndDelete(req.params.id);
    await updateProjectProgress(projectId);

    await logActivity(req.user._id, projectId, null, 'deleted task', `Task "${taskTitle}" was deleted.`);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
};
