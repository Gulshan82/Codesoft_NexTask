const Comment = require('../models/Comment');
const Discussion = require('../models/Discussion');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

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

// @desc    Add a comment to a task or project
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { taskId, projectId, text } = req.body;

    if (taskId) {
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const comment = await Comment.create({
        task: taskId,
        project: task.project,
        user: req.user._id,
        text,
      });

      // Add to task comments list
      task.comments.push(comment._id);
      await task.save();

      await logActivity(req.user._id, task.project, task._id, 'commented', `Added a comment on task "${task.title}".`);

      // Notify task assignees and project owner
      const project = await Project.findById(task.project);
      const recipients = new Set([...task.assignees.map(id => id.toString()), project.owner.toString()]);
      
      // Remove the commenter themselves
      recipients.delete(req.user._id.toString());

      if (recipients.size > 0) {
        const notifications = Array.from(recipients).map(recipientId => ({
          recipient: recipientId,
          sender: req.user._id,
          type: 'NewComment',
          project: task.project,
          task: task._id,
          message: `${req.user.name} commented on "${task.title}": "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        }));
        await Notification.insertMany(notifications);
      }

      // Populate user info for returning comment
      const populatedComment = await Comment.findById(comment._id).populate('user', 'name email avatar role');
      return res.status(201).json(populatedComment);
    } else if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Auth check: Admin, Project Owner, or Project Member
      let isAuthorized = false;
      if (req.user.role === 'Admin' || project.owner.toString() === req.user._id.toString()) {
        isAuthorized = true;
      } else {
        const authorizedProject = await Project.findOne({
          _id: projectId,
          members: req.user._id,
        });
        if (authorizedProject) isAuthorized = true;
      }

      if (!isAuthorized) {
        return res.status(403).json({ message: 'Not authorized to participate in this project\'s discussions' });
      }

      const comment = await Discussion.create({
        project: projectId,
        user: req.user._id,
        text,
      });

      await logActivity(req.user._id, projectId, null, 'discussed', `Posted a message in project discussions: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}".`);

      // Notify project members and owner
      const recipients = new Set([...project.members.map(id => id.toString()), project.owner.toString()]);
      recipients.delete(req.user._id.toString());

      if (recipients.size > 0) {
        const notifications = Array.from(recipients).map(recipientId => ({
          recipient: recipientId,
          sender: req.user._id,
          type: 'ProjectUpdate',
          project: projectId,
          message: `${req.user.name} posted in "${project.name}" discussions: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        }));
        await Notification.insertMany(notifications);
      }

      // Populate user info for returning comment
      const populatedComment = await Discussion.findById(comment._id).populate('user', 'name email avatar role');
      return res.status(201).json(populatedComment);
    } else {
      return res.status(400).json({ message: 'Please provide either taskId or projectId' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project level discussion comments
// @route   GET /api/comments/project/:projectId
// @access  Private
const getProjectDiscussions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Auth check: Admin, Project Owner, or Project Member
    let isAuthorized = false;
    if (req.user.role === 'Admin' || project.owner.toString() === req.user._id.toString()) {
      isAuthorized = true;
    } else {
      const authorizedProject = await Project.findOne({
        _id: projectId,
        members: req.user._id,
      });
      if (authorizedProject) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to access discussions for this project' });
    }

    // Find discussions for this project
    const comments = await Discussion.find({ project: projectId })
      .populate('user', 'name email avatar role')
      .sort({ createdAt: 1 }); // chronological order

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    if (comment.task) {
      const task = await Task.findById(comment.task);
      if (task) {
        task.comments = task.comments.filter(id => id.toString() !== comment._id.toString());
        await task.save();
      }
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addComment,
  deleteComment,
  getProjectDiscussions,
};
