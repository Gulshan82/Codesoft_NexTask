import React, { useState, useEffect } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
  Plus,
  Grid,
  List,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  TrendingUp,
  User,
  Users,
  CheckCircle,
} from 'lucide-react';
import GlassCard from '../../components/UI/GlassCard';
import Modal from '../../components/UI/Modal';

const ProjectsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { projects, createProject, isLoading } = useProjects();

  const [viewMode, setViewMode] = useState('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Planning');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  // Available users list for member selector
  const [allUsers, setAllUsers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Extract query param searches if redirected from search bar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setSearch(q);
  }, [location.search]);

  // Load members dropdown
  useEffect(() => {
    if (isCreateModalOpen) {
      const fetchUsers = async () => {
        try {
          const { data } = await api.get('/users');
          // filter out the owner themselves from selectable members since they own it
          setAllUsers(data.filter(u => u._id !== user._id));
        } catch (err) {
          console.error(err);
        }
      };
      fetchUsers();
    }
  }, [isCreateModalOpen, user._id]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      await createProject({
        name,
        description,
        status,
        priority,
        deadline,
        members: selectedMembers,
      });
      // reset
      setName('');
      setDescription('');
      setStatus('Planning');
      setPriority('Medium');
      setDeadline('');
      setSelectedMembers([]);
      setIsCreateModalOpen(false);
    } catch (err) {
      setFormError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Failed to create project.'
      );
    } finally {
      setFormLoading(false);
    }
  };

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const getPriorityColor = (prio) => {
    switch (prio?.toLowerCase()) {
      case 'critical':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'high':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'medium':
        return 'text-violet-500 bg-violet-500/10 border-violet-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/10';
    }
  };

  const getStatusColor = (stat) => {
    switch (stat?.toLowerCase()) {
      case 'completed':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'active':
        return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'on hold':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/10';
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
            Projects Portfolio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track milestones, statuses, and deadlines for all active project environments.
          </p>
        </div>

        {/* Create project button (Visible to all, validates subscription limits on click) */}
        <button
          onClick={() => {
            if (user?.role !== 'Admin' && user?.subscriptionPlan !== 'Pro' && user?.subscriptionPlan !== 'Enterprise' && projects.length >= 3) {
              const upgrade = window.confirm(
                "🚀 Upgrade to Business Pro!\n\nYou have reached the limit of 3 projects on the Starter Plan. Upgrade to Business Pro to create unlimited projects, milestones calendars, and access advanced team directory profiles.\n\nWould you like to view our subscription plans?"
              );
              if (upgrade) {
                navigate('/pricing');
                setTimeout(() => {
                  const pricingSection = document.getElementById('pricing');
                  if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 300);
              }
              return;
            }

            setIsCreateModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/10 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 bg-white text-slate-800 dark:text-slate-200 focus:border-violet-500"
          />
        </div>

        {/* Sorting / View controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-950/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-transparent cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-950/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-transparent cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Grid / List switcher */}
          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-950/40">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-violet-500/10 text-violet-500' : 'text-slate-400'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-violet-500/10 text-violet-500' : 'text-slate-400'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No projects found</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting the filters or create a new project portfolio.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <GlassCard
              key={project._id}
              hover
              onClick={() => navigate(`/projects/${project._id}`)}
              className="p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between h-56"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-violet-500 transition-colors line-clamp-1">
                  {project.name}
                </h3>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Created by: <span className="font-semibold text-slate-650 dark:text-slate-350">{project.owner?.name || 'Unknown'}</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              {/* Card Bottom */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {project.deadline
                      ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'No Deadline'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {project.progress}% Complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                {/* Members list */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <div className="w-6.5 h-6.5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[9px] border-2 border-white dark:border-slate-900 shadow-inner z-10" title="Project Owner">
                      {project.owner?.name.charAt(0).toUpperCase()}
                    </div>
                    {project.members?.filter(Boolean).slice(0, 3).map((member, index) => (
                      <div
                        key={member._id}
                        className="w-6.5 h-6.5 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[9px] border-2 border-white dark:border-slate-900 shadow-inner relative overflow-hidden"
                        style={{ zIndex: 9 - index }}
                      >
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                        {member.avatar && (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover absolute inset-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ))}
                    {project.members?.length > 3 && (
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-[8px] border-2 border-white dark:border-slate-900 shadow-inner">
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {project.members?.length + 1} total
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        /* List View */
        <GlassCard className="overflow-hidden border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Project Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
              {filteredProjects.map((project) => (
                <tr
                  key={project._id}
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className="hover:bg-slate-500/5 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 max-w-sm">
                    <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-500 transition-colors block">
                      {project.name}
                    </span>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 block mt-0.5">
                      Created by: <span className="font-semibold text-slate-650 dark:text-slate-355">{project.owner?.name || 'Unknown'}</span>
                    </span>
                    <span className="text-slate-400 line-clamp-1 mt-1 text-[11px]">
                      {project.description || 'No description'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-450 font-medium">
                    {project.deadline
                      ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'No Deadline'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[9px] border-2 border-white dark:border-slate-900 shadow-inner z-10">
                        {project.owner?.name.charAt(0).toUpperCase()}
                      </div>
                      {project.members?.filter(Boolean).slice(0, 3).map((member, index) => (
                        <div
                          key={member._id}
                          className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[9px] border-2 border-white dark:border-slate-900 shadow-inner"
                          style={{ zIndex: 9 - index }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 w-44">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{project.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Creation Dialog Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initialize New Project"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              placeholder="E.g., Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Outline project scopes..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={deadline}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          </div>

          {/* Members Checklist selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Invite Team Members ({selectedMembers.length} selected)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-850 bg-slate-50/20 dark:bg-slate-950/20 px-2.5">
              {allUsers.length === 0 ? (
                <p className="text-[10px] text-slate-400 py-4 text-center">No other members registered yet</p>
              ) : (
                allUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => toggleMemberSelection(user._id)}
                    className="flex items-center justify-between py-2 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] text-white overflow-hidden border dark:border-slate-700 relative">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        {user.avatar && (
                          <img
                            src={user.avatar}
                            alt=""
                            className="w-full h-full object-cover absolute inset-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-violet-500 transition-colors">
                          {user.name}
                        </p>
                        <span className="text-[9px] text-slate-400 block">{user.role}</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                      ${selectedMembers.includes(user._id) ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300 dark:border-slate-700'}
                    `}>
                      {selectedMembers.includes(user._id) && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-semibold rounded-xl text-xs shadow-lg shadow-violet-600/10 transition-colors disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Initialize Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsList;
