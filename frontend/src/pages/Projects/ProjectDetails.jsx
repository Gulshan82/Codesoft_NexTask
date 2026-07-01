import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useProjectDetails } from '../../hooks/useProjects';
import { useCreateTask, useTaskDetails } from '../../hooks/useTasks';
import api from '../../services/api';
import {
  Plus,
  Settings,
  Users,
  MessageSquare,
  ListTodo,
  Kanban,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  X,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Check,
} from 'lucide-react';
import GlassCard from '../../components/UI/GlassCard';
import Modal from '../../components/UI/Modal';

// Priority color tags helper
const getPriorityColor = (prio) => {
  switch (prio?.toLowerCase()) {
    case 'critical':
    case 'urgent':
      return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    case 'high':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'medium':
      return 'text-violet-500 bg-violet-500/10 border-violet-500/20';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/10';
  }
};

const ProjectDetails = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Fetch Project details & tasks
  const { projectData, isLoading, isError, updateProject, deleteProject } = useProjectDetails(projectId);
  const { createTask } = useCreateTask();

  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedTask, setSelectedTask] = useState(null); // active task for detail modal
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Task filter states
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('All');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('All');

  // Edit project form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('Planning');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editDeadline, setEditDeadline] = useState('');
  const [editMembers, setEditMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Create task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('To Do');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignees, setTaskAssignees] = useState([]);

  // Project Discussion (Mock or loaded via specific calls if needed, we'll store simple discussions list)
  const [discussions, setDiscussions] = useState([]);
  const [newDiscussionText, setNewDiscussionText] = useState('');

  // Initializing edit form once project loads
  useEffect(() => {
    if (projectData?.project) {
      const { project } = projectData;
      setEditName(project.name);
      setEditDesc(project.description);
      setEditStatus(project.status);
      setEditPriority(project.priority);
      setEditDeadline(project.deadline ? project.deadline.split('T')[0] : '');
      setEditMembers(project.members?.filter(Boolean).map((m) => m._id) || []);
    }
  }, [projectData]);

  // Load all users for member selectors
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/users');
        setAllUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  // Simple project discussions loader
  const fetchDiscussions = async () => {
    try {
      const { data } = await api.get(`/comments/project/${projectId}`);
      if (data.length === 0) {
        setDiscussions([
          { _id: 'welcome', user: { name: 'Sarah PM', avatar: '' }, text: 'Welcome to our project discussions! Post updates here.', createdAt: new Date(Date.now() - 3600000 * 2) }
        ]);
      } else {
        setDiscussions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'discussions') {
      fetchDiscussions();
    }
  }, [activeTab]);

  const handleEditProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProject({
        name: editName,
        description: editDesc,
        status: editStatus,
        priority: editPriority,
        deadline: editDeadline,
        members: editMembers,
      });
      setIsEditProjectOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you absolutely sure you want to delete this project and all its tasks? This action is irreversible.')) {
      try {
        await deleteProject();
        navigate('/projects');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete project');
      }
    }
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTask({
        title: taskTitle,
        description: taskDesc,
        project: projectId,
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate,
        assignees: taskAssignees,
      });
      // reset
      setTaskTitle('');
      setTaskDesc('');
      setTaskStatus('To Do');
      setTaskPriority('Medium');
      setTaskDueDate('');
      setTaskAssignees([]);
      setIsCreateTaskOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleTaskAssigneeToggle = (userId) => {
    if (taskAssignees.includes(userId)) {
      setTaskAssignees(taskAssignees.filter((id) => id !== userId));
    } else {
      setTaskAssignees([...taskAssignees, userId]);
    }
  };

  const handleProjectMemberToggle = (userId) => {
    if (editMembers.includes(userId)) {
      setEditMembers(editMembers.filter((id) => id !== userId));
    } else {
      setEditMembers([...editMembers, userId]);
    }
  };

  const handlePostDiscussion = async (e) => {
    e.preventDefault();
    if (!newDiscussionText.trim()) return;
    try {
      const { data } = await api.post('/comments', {
        projectId,
        text: newDiscussionText,
      });
      const currentDiscussions = discussions.filter(d => d._id !== 'welcome');
      setDiscussions([...currentDiscussions, data]);
      setNewDiscussionText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post discussion update');
    }
  };

  // Kanban Native HTML5 Drag and Drop Functions
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('kanban-column-drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('kanban-column-drag-over');
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('kanban-column-drag-over');
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    try {
      // Optimistically trigger PUT status change
      await api.put(`/tasks/${taskId}`, { status: targetStatus });
      // Invalidate queries so UI refetches
      projectData.tasks = projectData.tasks.map(t => t._id === taskId ? { ...t, status: targetStatus } : t);
      // Let react query perform a background sync
      navigate(window.location.pathname, { replace: true });
    } catch (err) {
      console.error('Failed to update status on drop:', err);
    } finally {
      setDraggedTaskId(null);
    }
  };



  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (isError || !projectData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Failed to load project details</h3>
        <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold">
          Return to Projects
        </button>
      </div>
    );
  }

  const { project, tasks } = projectData;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = taskStatusFilter === 'All' || task.status === taskStatusFilter;
    const matchesPriority = taskPriorityFilter === 'All' || task.priority === taskPriorityFilter;
    const matchesAssignee =
      taskAssigneeFilter === 'All' ||
      task.assignees?.filter(Boolean).some((a) => a._id === taskAssigneeFilter);

    return matchesStatus && matchesPriority && matchesAssignee;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
              {project.name}
            </h1>
            <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            {project.description || 'No description provided.'}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-3">
            {/* Project Status */}
            <span className="px-2.5 py-0.5 text-[9px] font-extrabold bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-800/80 uppercase tracking-wide">
              {project.status}
            </span>

            {/* Target Deadline */}
            {project.deadline && (
              <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-md border uppercase tracking-wide flex items-center gap-1
                ${(() => {
                  if (project.status === 'Completed') return 'text-slate-400 border-slate-100 bg-slate-50 dark:bg-slate-900/10 dark:border-slate-800/40';
                  const today = new Date(); today.setHours(0,0,0,0);
                  const due = new Date(project.deadline); due.setHours(0,0,0,0);
                  if (due < today) return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
                  return 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10';
                })()}
              `}>
                <CalendarIcon className="w-2.5 h-2.5" />
                Target: {new Date(project.deadline).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {(() => {
                  if (project.status === 'Completed') return '';
                  const today = new Date(); today.setHours(0,0,0,0);
                  const due = new Date(project.deadline); due.setHours(0,0,0,0);
                  return due < today ? ' (Overdue)' : '';
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Project controls */}
        <div className="flex items-center gap-2">
          {/* Create Task button */}
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>

          {/* Settings / Edit project button (PM / Admin / Owner only) */}
          {(user.role === 'Admin' || user.role === 'Project Manager' || project.owner?._id === user._id) && (
            <button
              onClick={() => setIsEditProjectOpen(true)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Project Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Switchers */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-px overflow-x-auto scrollbar-none whitespace-nowrap">
        {[
          { id: 'tasks', name: 'Task List', icon: ListTodo },
          { id: 'kanban', name: 'Board', icon: Kanban },
          { id: 'calendar', name: 'Milestones', icon: CalendarIcon },
          { id: 'discussions', name: 'Discussions', icon: MessageSquare },
          { id: 'team', name: 'Project Team', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-all border-b-2 relative -mb-[2px] shrink-0
              ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-200'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Contents */}
      <div className="mt-4">
        {/* TABS 1: TASKS LIST */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-slate-700 dark:text-slate-350 cursor-pointer focus:border-violet-500"
              >
                <option value="All">All Statuses</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-slate-700 dark:text-slate-350 cursor-pointer focus:border-violet-500"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>

              <select
                value={taskAssigneeFilter}
                onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-slate-700 dark:text-slate-350 cursor-pointer focus:border-violet-500"
              >
                <option value="All">All Assignees</option>
                <option value={user._id}>Assigned to Me</option>
                {project.members?.filter(Boolean).map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tasks list */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-14 border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white/40 dark:bg-slate-950/20">
                <p className="text-xs text-slate-400">No tasks match your filters in this project</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredTasks.map((task) => (
                  <GlassCard
                    key={task._id}
                    hover
                    onClick={() => {
                      setSelectedTask(task._id);
                      setIsTaskDetailOpen(true);
                    }}
                    className="p-4 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center
                        ${task.status === 'Completed' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-400 dark:border-slate-600'}
                      `}>
                        {task.status === 'Completed' && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </div>
                      <div>
                        <h4 className={`text-xs font-semibold text-slate-800 dark:text-slate-250 truncate max-w-sm ${task.status === 'Completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {task.title}
                        </h4>
                        {task.dueDate && (
                          <span className={`text-[9px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded border leading-none font-bold uppercase tracking-wide mt-1.5
                            ${(() => {
                              if (task.status === 'Completed') return 'text-slate-400 border-slate-100 bg-slate-50 dark:bg-slate-900/10 dark:border-slate-800/40';
                              const today = new Date(); today.setHours(0,0,0,0);
                              const due = new Date(task.dueDate); due.setHours(0,0,0,0);
                              if (due < today) return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
                              return 'text-slate-500 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10';
                            })()}
                          `}>
                            <CalendarIcon className="w-2.5 h-2.5" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {(() => {
                              if (task.status === 'Completed') return '';
                              const today = new Date(); today.setHours(0,0,0,0);
                              const due = new Date(task.dueDate); due.setHours(0,0,0,0);
                              return due < today ? ' • Overdue' : '';
                            })()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto sm:justify-end">
                      <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded">
                        {task.status}
                      </span>

                      {/* Checklist count progress */}
                      {task.checklist?.length > 0 && (
                        <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono">
                          {task.checklist.filter(c => c.isCompleted).length}/{task.checklist.length}
                        </span>
                      )}

                      {/* Assignees initials stack */}
                      <div className="flex -space-x-1 overflow-hidden pl-2">
                        {task.assignees?.filter(Boolean).slice(0, 3).map((assignee) => (
                          <div
                            key={assignee._id}
                            className="w-5.5 h-5.5 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-[8px] border border-white dark:border-slate-900"
                            title={assignee.name}
                          >
                            {assignee.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABS 2: KANBAN BOARD */}
        {activeTab === 'kanban' && (
          <div className="w-full overflow-x-auto pb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-270px)] min-w-[768px]">
            {['To Do', 'In Progress', 'Review', 'Completed'].map((status) => {
              const statusTasks = tasks.filter((t) => t.status === status);
              return (
                <div
                  key={status}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                  className="flex flex-col h-full bg-slate-50/20 dark:bg-slate-950/10 border border-slate-200/30 dark:border-slate-800/20 rounded-2xl p-4 transition-all"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                      {status}
                    </span>
                    <span className="w-5 h-5 bg-slate-200 dark:bg-slate-800/80 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {statusTasks.length}
                    </span>
                  </div>

                  {/* Task Cards Container */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {statusTasks.map((task) => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onClick={() => {
                          setSelectedTask(task._id);
                          setIsTaskDetailOpen(true);
                        }}
                        className="p-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm hover:shadow-md dark:shadow-slate-950/30 transition-all cursor-grab active:cursor-grabbing text-left group"
                      >
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-violet-500 transition-colors">
                          {task.title}
                        </h4>

                        <div className="flex items-center justify-between mt-3.5 gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Priority Badge */}
                            <span className={`px-1.5 py-0.5 text-[8px] font-extrabold border rounded tracking-wide uppercase ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>

                            {/* Due Date Badge */}
                            {task.dueDate && (
                              <span className={`text-[8px] flex items-center gap-1 px-1.5 py-0.5 rounded border leading-none font-bold uppercase tracking-wide
                                ${(() => {
                                  if (task.status === 'Completed') return 'text-slate-400 border-slate-100 bg-slate-50 dark:bg-slate-900/10 dark:border-slate-800/40';
                                  const today = new Date(); today.setHours(0,0,0,0);
                                  const due = new Date(task.dueDate); due.setHours(0,0,0,0);
                                  if (due < today) return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
                                  return 'text-slate-500 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10';
                                })()}
                              `}>
                                <CalendarIcon className="w-2.5 h-2.5" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                {(() => {
                                  if (task.status === 'Completed') return '';
                                  const today = new Date(); today.setHours(0,0,0,0);
                                  const due = new Date(task.dueDate); due.setHours(0,0,0,0);
                                  return due < today ? ' • Overdue' : '';
                                })()}
                              </span>
                            )}

                            {/* Checklist Progress */}
                            {task.checklist?.length > 0 && (
                              <span className="text-[8px] bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 px-1 py-0.5 rounded font-mono font-bold">
                                {task.checklist.filter(c => c.isCompleted).length}/{task.checklist.length}
                              </span>
                            )}
                          </div>

                          {/* Assignees initials stack */}
                          <div className="flex -space-x-1 overflow-hidden flex-shrink-0">
                            {task.assignees?.filter(Boolean).slice(0, 2).map((assignee) => (
                              <div
                                key={assignee._id}
                                className="w-5 h-5 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-[8px] border border-white dark:border-slate-900"
                                title={assignee.name}
                              >
                                {assignee.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {statusTasks.length === 0 && (
                      <div className="h-24 border border-dashed border-slate-300/40 dark:border-slate-800/50 rounded-xl flex flex-col items-center justify-center p-4 bg-slate-100/10 dark:bg-slate-950/10 text-center select-none transition-colors duration-200">
                        <span className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">Empty Column</span>
                        <span className="text-[8px] text-slate-400 dark:text-slate-600 mt-1">Drag & drop tasks here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}

        {/* TABS 3: MILESTONES CALENDAR */}
        {activeTab === 'calendar' && (
          <GlassCard className="p-4 sm:p-6 border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-violet-500" />
              Project Task Deadlines
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
              {tasks.filter((t) => t.dueDate).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No task deadlines set in this project.</p>
              ) : (
                tasks
                  .filter((t) => t.dueDate)
                  .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                  .map((task) => (
                    <div
                      key={task._id}
                      onClick={() => {
                        setSelectedTask(task._id);
                        setIsTaskDetailOpen(true);
                      }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 cursor-pointer hover:bg-slate-500/5 px-2.5 rounded-xl transition-colors text-left"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-350">{task.title}</span>
                      <div className="flex flex-col items-start sm:items-end gap-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        {/* Due date info */}
                        {task.dueDate && (
                          <div className="flex items-center mt-0.5">
                            <span className={`text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded border leading-none font-bold uppercase tracking-wide
                              ${(() => {
                                if (task.status === 'Completed') return 'text-slate-400 border-slate-100 bg-slate-50 dark:bg-slate-900/10 dark:border-slate-800/40';
                                const today = new Date(); today.setHours(0,0,0,0);
                                const due = new Date(task.dueDate); due.setHours(0,0,0,0);
                                if (due < today) return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
                                return 'text-slate-500 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10';
                              })()}
                            `}>
                              <CalendarIcon className="w-2.5 h-2.5" />
                              {new Date(task.dueDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                              {(() => {
                                if (task.status === 'Completed') return '';
                                const today = new Date(); today.setHours(0,0,0,0);
                                const due = new Date(task.dueDate); due.setHours(0,0,0,0);
                                return due < today ? ' • Overdue' : '';
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </GlassCard>
        )}

        {/* TABS 4: DISCUSSION BOARD */}
        {activeTab === 'discussions' && (
          <GlassCard className="p-4 sm:p-6 border-slate-200 dark:border-slate-800 max-w-2xl mx-auto flex flex-col justify-between h-[450px]">
            {/* Discussions Feed */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
              {discussions.map((msg) => (
                <div key={msg._id || msg.id} className="flex gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden border dark:border-slate-850 relative">
                    {msg.user?.name ? msg.user.name.charAt(0).toUpperCase() : 'U'}
                    {msg.user?.avatar && (
                      <img
                        src={msg.user.avatar}
                        alt=""
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-350">{msg.user?.name || 'Unknown User'}</span>
                        {msg.user?.role && (
                          <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-full border leading-none
                            ${msg.user.role === 'Admin' ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' : 
                              msg.user.role === 'Project Manager' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : 
                              'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'}
                          `}>
                            {msg.user.role}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-450">
                        {new Date(msg.createdAt || msg.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Post Chat */}
            <form onSubmit={handlePostDiscussion} className="flex gap-2">
              <input
                type="text"
                placeholder="Send a message to project discussions..."
                value={newDiscussionText}
                onChange={(e) => setNewDiscussionText(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-violet-500/10"
              >
                Send
              </button>
            </form>
          </GlassCard>
        )}

        {/* TABS 5: PROJECT TEAM */}
        {activeTab === 'team' && (
          <GlassCard className="p-4 sm:p-6 border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
              Project Members Directory
            </h3>
            <div className="space-y-4">
              {/* Owner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs border-2 border-white dark:border-slate-900 shadow-sm">
                    {project.owner?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{project.owner?.name}</p>
                    <span className="text-[9px] text-slate-400">Project Creator</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-bold text-violet-500 border border-violet-500/20 bg-violet-500/10 rounded-full">
                  Owner
                </span>
              </div>

              {/* Members */}
              {project.members?.filter(Boolean).map((member) => (
                <div key={member._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs border dark:border-slate-800 relative overflow-hidden">
                      {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      {member.avatar && (
                        <img
                          src={member.avatar}
                          alt=""
                          className="w-full h-full object-cover absolute inset-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{member.name}</p>
                      <span className="text-[9px] text-slate-400">{member.email}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-500 border border-emerald-500/20 bg-emerald-500/10 rounded-full">
                    {member.role}
                  </span>
                </div>
              ))}
              {project.members?.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">No other members assigned to this project.</p>
              )}
            </div>
          </GlassCard>
        )}
      </div>

      {/* MODAL 1: EDIT PROJECT SETTINGS */}
      <Modal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        title="Edit Project Configuration"
      >
        <form onSubmit={handleEditProjectSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Target Deadline
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={editDeadline}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Project Members
            </label>
            <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-850 px-2 bg-slate-50/20 dark:bg-slate-950/20">
              {allUsers.filter(u => u._id !== project.owner?._id).map((member) => (
                <div
                  key={member._id}
                  onClick={() => handleProjectMemberToggle(member._id)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <span className="text-[11px] text-slate-700 dark:text-slate-350">{member.name} ({member.role})</span>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center
                    ${editMembers.includes(member._id) ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-350'}
                  `}>
                    {editMembers.includes(member._id) && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button
              type="button"
              onClick={handleDeleteProject}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-lg shadow-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Project
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditProjectOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-violet-600/10"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD TASK */}
      <Modal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        title="Create New Project Task"
      >
        <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="Task name"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Provide a detailed roadmap for this task..."
              rows={3}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={taskDueDate}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Task Status
            </label>
            <select
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Assign Task To
            </label>
            <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-850 px-2 bg-slate-50/20 dark:bg-slate-950/20">
              {/* Combine owner and members */}
              {[project.owner, ...(project.members || [])].filter(Boolean).map((member) => (
                <div
                  key={member._id}
                  onClick={() => handleTaskAssigneeToggle(member._id)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <span className="text-[11px] text-slate-700 dark:text-slate-350">{member.name} ({member.role})</span>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center
                    ${taskAssignees.includes(member._id) ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-355'}
                  `}>
                    {taskAssignees.includes(member._id) && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateTaskOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-violet-600/10"
            >
              Assign & Create
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: TASK DETAILS (CHECKLIST, ATTACHMENTS, DISCUSSIONS/COMMENTS) */}
      <TaskDetailModal
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        taskId={selectedTask}
        projectMembers={[project.owner, ...(project.members || [])].filter(Boolean)}
      />
    </div>
  );
};

/* MODULAR DETAILED TASK MODAL COMPONENT (COMMENTS, CHECKLISTS, ATTACHMENTS) */
const TaskDetailModal = ({ isOpen, onClose, taskId, projectMembers }) => {
  const { task, isLoading, isError, updateTask, deleteTask, addComment, deleteComment } = useTaskDetails(taskId);

  // States
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Edit fields states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('To Do');
  const [editAssignees, setEditAssignees] = useState([]);

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description);
      setEditPriority(task.priority);
      setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setEditStatus(task.status);
      setEditAssignees(task.assignees?.filter(Boolean).map((a) => a._id) || []);
    }
  }, [task]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Task Loading...">
        <div className="h-64 flex items-center justify-center animate-pulse">
          <p className="text-xs text-slate-400">Retrieving task metadata...</p>
        </div>
      </Modal>
    );
  }

  if (isError || !task) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Error">
        <div className="h-44 flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
          <p className="text-xs text-slate-400">Failed to load task details</p>
        </div>
      </Modal>
    );
  }

  const handleSaveTaskUpdates = async (e) => {
    e.preventDefault();
    try {
      await updateTask({
        title: editTitle,
        description: editDesc,
        priority: editPriority,
        dueDate: editDueDate,
        status: editStatus,
        assignees: editAssignees,
      });
      setIsEditMode(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteTask(task.project._id);
        onClose();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  // Checklist updates
  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newChecklist = [...(task.checklist || []), { text: newChecklistText, isCompleted: false }];
    await updateTask({ checklist: newChecklist });
    setNewChecklistText('');
  };

  const handleToggleChecklistItem = async (itemId) => {
    const newChecklist = task.checklist.map((item) =>
      item._id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    await updateTask({ checklist: newChecklist });
  };

  const handleDeleteChecklistItem = async (itemId) => {
    const newChecklist = task.checklist.filter((item) => item._id !== itemId);
    await updateTask({ checklist: newChecklist });
  };

  // Comment updates
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    try {
      await addComment(newCommentText);
      setNewCommentText('');
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  // File Attachment Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', task._id);

    setIsUploading(true);
    try {
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Invalidate query to trigger refetch
      task.attachments.push({ fileName: file.name, fileUrl: '#' }); // temp visual
      window.location.reload(); // simple browser force sync or query refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTaskAssigneeEditToggle = (userId) => {
    if (editAssignees.includes(userId)) {
      setEditAssignees(editAssignees.filter(id => id !== userId));
    } else {
      setEditAssignees([...editAssignees, userId]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Modify Task Details' : task.title}
      size="xl"
    >
      {isEditMode ? (
        /* EDIT MODE FORM */
        <form onSubmit={handleSaveTaskUpdates} className="space-y-4 px-4 pb-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Task Title</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-255 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-255 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={editDueDate}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Re-assign Members</label>
            <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-850 px-2 bg-slate-50/20 dark:bg-slate-950/20">
              {projectMembers.filter(Boolean).map((member) => (
                <div
                  key={member._id}
                  onClick={() => handleTaskAssigneeEditToggle(member._id)}
                  className="flex items-center justify-between py-1.5 cursor-pointer"
                >
                  <span className="text-[11px] text-slate-700 dark:text-slate-350">{member.name}</span>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center
                    ${editAssignees.includes(member._id) ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-355'}
                  `}>
                    {editAssignees.includes(member._id) && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold"
            >
              Save Updates
            </button>
          </div>
        </form>
      ) : (
        /* STANDARD READ DETAILS MODE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left px-4 pb-4">
          {/* Left panel: Info, Checklist, Attachments */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</h4>
              <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900 rounded-xl p-3.5">
                {task.description || 'No description provided.'}
              </p>
            </div>

            {/* Checklist Section */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-violet-500" />
                Task Checklist
              </h4>

              {/* Checklist list */}
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {task.checklist?.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-950/10"
                  >
                    <div
                      onClick={() => handleToggleChecklistItem(item._id)}
                      className="flex items-center gap-2.5 cursor-pointer flex-1"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                        ${item.isCompleted ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300 dark:border-slate-700'}
                      `}>
                        {item.isCompleted && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-xs text-slate-700 dark:text-slate-300 ${item.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {item.text}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteChecklistItem(item._id)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add checklist item */}
              <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a checklist item..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 text-slate-255 dark:text-slate-200 rounded-xl text-xs font-semibold"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-sky-500" />
                Attachments
              </h4>

              {/* Attachment listing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-36 overflow-y-auto">
                {task.attachments?.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-950/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-sky-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={attachment.fileName}>
                          {attachment.fileName}
                        </p>
                        <span className="text-[9px] text-slate-400 block">
                          {(attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'Attached file')}
                        </span>
                      </div>
                    </div>

                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>

              {/* Upload input */}
              <div className="flex items-center justify-start">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-350 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  {isUploading ? 'Uploading Attachment...' : 'Upload File Attachment'}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            </div>
          </div>

          {/* Right panel: Meta status & Task discussions */}
          <div className="space-y-4 border-l border-slate-100 dark:border-slate-850 pl-4">
            {/* Meta statistics */}
            <div className="space-y-3 p-3.5 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl border border-slate-100 dark:border-slate-900">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Status</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {task.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Priority</span>
                <span className={`px-2 py-0.5 font-bold border rounded ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Due Date</span>
                <span className={`font-semibold px-2 py-0.5 rounded border
                  ${(() => {
                    if (!task.dueDate) return 'text-slate-500';
                    if (task.status === 'Completed') return 'text-slate-405 border-slate-100 dark:border-slate-800';
                    const today = new Date(); today.setHours(0,0,0,0);
                    const due = new Date(task.dueDate); due.setHours(0,0,0,0);
                    if (due < today) return 'text-rose-500 border-rose-500/20 bg-rose-500/10 font-bold';
                    return 'text-slate-700 dark:text-slate-300 border-transparent';
                  })()}
                `}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                  {(() => {
                    if (!task.dueDate || task.status === 'Completed') return '';
                    const today = new Date(); today.setHours(0,0,0,0);
                    const due = new Date(task.dueDate); due.setHours(0,0,0,0);
                    return due < today ? ' (Overdue)' : '';
                  })()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-900/60">
                <span className="text-slate-400 font-medium">Created By</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[8px] relative overflow-hidden" title="Task Creator">
                    {(task.createdBy?.name || 'U').charAt(0).toUpperCase()}
                    {task.createdBy?.avatar && (
                      <img
                        src={task.createdBy.avatar}
                        alt=""
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <span className="font-semibold text-slate-750 dark:text-slate-250">
                    {task.createdBy?.name || 'System'}
                  </span>
                </div>
              </div>

              {/* Assignees stack list */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Assignees</span>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {task.assignees?.filter(Boolean).map((a) => (
                    <div key={a._id} className="flex items-center gap-2">
                      <div className="w-5.5 h-5.5 rounded-full bg-slate-655 text-white flex items-center justify-center font-bold text-[8px]">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{a.name}</span>
                    </div>
                  ))}
                  {task.assignees?.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No one assigned yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Task comments/discussion */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments Feed</h4>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {task.comments?.filter(Boolean).map((comment) => (
                  <div key={comment._id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-950/10 relative group text-left">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-350">{comment.user?.name}</span>
                      <span className="text-[8px] text-slate-450">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed pr-3">{comment.text}</p>
                    <button
                      onClick={() => deleteComment(comment._id)}
                      className="absolute top-2.5 right-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {task.comments?.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center py-4">No comments posted yet</p>
                )}
              </div>

              {/* Add comment */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-1.5">
                <input
                  type="text"
                  placeholder="Post comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold"
                >
                  Send
                </button>
              </form>
            </div>

            {/* Task deletion & updates triggers */}
            <div className="pt-2 border-t border-slate-105 dark:border-slate-850 flex flex-col gap-2 w-full">
              {task.status === 'Completed' ? (
                <button
                  type="button"
                  onClick={() => updateTask({ status: 'In Progress' })}
                  className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Reopen Task
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => updateTask({ status: 'Completed' })}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete Task
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="w-full py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-605 dark:text-violet-400 border border-violet-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Details
              </button>

              <button
                type="button"
                onClick={handleDeleteTask}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-bold transition-all border border-rose-500/20 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProjectDetails;
