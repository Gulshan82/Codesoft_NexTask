const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to log activities
const logActivity = async (userId, projectId, action, details) => {
  try {
    await Activity.create({
      user: userId,
      project: projectId,
      action,
      details,
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Admin / Project Manager)
const createProject = async (req, res) => {
  try {
    const { name, description, status, priority, deadline, members } = req.body;

    // Limit Starter plan to 3 projects (Admins bypassed)
    if (req.user.role !== 'Admin' && req.user.subscriptionPlan !== 'Pro' && req.user.subscriptionPlan !== 'Enterprise') {
      const projectCount = await Project.countDocuments({ owner: req.user._id });
      if (projectCount >= 3) {
        return res.status(403).json({
          message: 'You have reached the 3-project limit of the Starter Plan. Please upgrade to Business Pro for unlimited project workspaces!'
        });
      }
    }

    const project = await Project.create({
      name,
      description,
      status: status || 'Planning',
      priority: priority || 'Medium',
      deadline,
      owner: req.user._id,
      members: members || [],
    });

    await logActivity(req.user._id, project._id, 'created project', `Project "${name}" was initialized.`);

    // Send notifications to added members
    if (members && members.length > 0) {
      const notifications = members.map(memberId => ({
        recipient: memberId,
        sender: req.user._id,
        type: 'NewMember',
        project: project._id,
        message: `You have been added to the project "${name}" by ${req.user.name}.`,
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects for logged-in user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    let query = {};

    // Admins can see all projects; PMs and Members see projects they own or belong to
    if (req.user.role !== 'Admin') {
      query = {
        $or: [
          { owner: req.user._id },
          { members: req.user._id }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email role avatar')
      .populate('members', 'name email role avatar')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role avatar')
      .populate('members', 'name email role avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions (Admin sees all; others check membership/ownership)
    if (
      req.user.role !== 'Admin' &&
      project.owner._id.toString() !== req.user._id.toString() &&
      !project.members.some(member => member._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    // Find tasks associated with this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignees', 'name email role avatar')
      .populate('createdBy', 'name email role avatar');

    res.json({ project, tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Admin / PM / Project Owner)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Auth check
    if (
      req.user.role !== 'Admin' &&
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'Project Manager'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const { name, description, status, priority, deadline, members } = req.body;

    // Track original members to detect who is newly added
    const oldMembers = project.members.map(m => m.toString());

    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    project.status = status || project.status;
    project.priority = priority || project.priority;
    project.deadline = deadline !== undefined ? deadline : project.deadline;
    project.members = members || project.members;

    const updatedProject = await project.save();

    await logActivity(req.user._id, project._id, 'updated project', `Project "${project.name}" details were updated.`);

    // Find new members added and send notification
    if (members) {
      const newMembers = members.filter(memberId => !oldMembers.includes(memberId.toString()));
      if (newMembers.length > 0) {
        const notifications = newMembers.map(memberId => ({
          recipient: memberId,
          sender: req.user._id,
          type: 'NewMember',
          project: project._id,
          message: `You have been added to the project "${project.name}" by ${req.user.name}.`,
        }));
        await Notification.insertMany(notifications);
      }
    }

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Admin / Project Owner)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Auth check
    if (req.user.role !== 'Admin' && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // Delete tasks, comments associated with the project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    // Notify project members about project deletion
    if (project.members && project.members.length > 0) {
      const notifications = project.members.map(memberId => ({
        recipient: memberId,
        sender: req.user._id,
        type: 'ProjectUpdate',
        message: `Project "${project.name}" has been deleted by ${req.user.name}.`,
      }));
      await Notification.insertMany(notifications);
    }

    res.json({ message: 'Project and all associated tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
