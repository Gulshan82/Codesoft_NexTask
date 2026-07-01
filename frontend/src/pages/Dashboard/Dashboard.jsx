import React from 'react';
import { useSelector } from 'react-redux';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Activity as ActivityIcon,
  Calendar,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import GlassCard from '../../components/UI/GlassCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { stats, isLoading, isError } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl lg:col-span-2" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Failed to load dashboard metrics</h3>
        <p className="text-sm text-slate-400 mt-1">Please ensure your database is running and try again.</p>
      </div>
    );
  }

  const { counts, taskStatusData, weeklyProgress, recentActivities, upcomingDeadlines } = stats;

  const overviewCards = [
    { title: 'Total Projects', value: counts.projects, icon: Briefcase, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20', path: '/projects' },
    { title: 'Total Tasks', value: counts.tasks, icon: Clock, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', path: '/projects' },
    { title: 'Completed Tasks', value: counts.completedTasks, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', path: '/projects' },
    { title: 'Pending Tasks', value: counts.pendingTasks, icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', path: '/projects' },
    { title: 'Overdue Tasks', value: counts.overdueTasks, icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', path: '/projects' },
    { title: 'Active Team', value: counts.members, icon: Users, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20', path: '/team' },
  ];

  // Pie chart colors
  const PIE_COLORS = ['#f59e0b', '#6366f1', '#a855f7', '#10b981'];

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
          Welcome back, {user?.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here is what's happening across your active projects today.
        </p>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {overviewCards.map((card) => (
          <GlassCard
            key={card.title}
            hover
            onClick={() => navigate(card.path)}
            className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                {card.value}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <GlassCard className="p-6 lg:col-span-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Weekly Velocity Report
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tasks created vs. tasks completed over the last 7 days.
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="dayName" stroke="rgba(148, 163, 184, 0.5)" tickLine={false} style={{ fontSize: 11 }} />
                <YAxis stroke="rgba(148, 163, 184, 0.5)" tickLine={false} style={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="created" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" name="Tasks Created" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Tasks Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Task status split */}
        <GlassCard className="p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Task Status Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of tasks by active status categories.
            </p>
          </div>

          <div className="h-44 flex items-center justify-center relative my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {taskStatusData.filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {taskStatusData.every(d => d.value === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                No tasks available
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {taskStatusData.map((status, idx) => (
              <div key={status.name} className="flex items-center gap-2 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                <span className="text-slate-500 dark:text-slate-400 truncate">{status.name}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 ml-auto">{status.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Deadlines and Activity Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <GlassCard className="p-6 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Critical Deadlines
              </h3>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              Full Calendar <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No upcoming critical deadlines
              </div>
            ) : (
              upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  onClick={() => navigate(deadline.type === 'Project' ? `/projects/${deadline.id}` : `/projects`)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 hover:border-violet-500/20 transition-all cursor-pointer group"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {deadline.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {deadline.type} • Project: {deadline.projectName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getPriorityColor(deadline.priority)}`}>
                      {deadline.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border
                      ${(() => {
                        const today = new Date(); today.setHours(0,0,0,0);
                        const due = new Date(deadline.dueDate); due.setHours(0,0,0,0);
                        if (due < today) return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
                        return 'text-slate-500 dark:text-slate-400 border-transparent bg-slate-100 dark:bg-slate-800';
                      })()}
                    `}>
                      {new Date(deadline.dueDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {(() => {
                        const today = new Date(); today.setHours(0,0,0,0);
                        const due = new Date(deadline.dueDate); due.setHours(0,0,0,0);
                        return due < today ? ' (Overdue)' : '';
                      })()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Recent Activities */}
        <GlassCard className="p-6 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <ActivityIcon className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Live Activity Stream
            </h3>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {recentActivities.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No activity logs available
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity._id} className="flex gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden mt-0.5 border dark:border-slate-800 relative">
                    {activity.user?.name ? activity.user.name.charAt(0).toUpperCase() : 'U'}
                    {activity.user?.avatar && (
                      <img
                        src={activity.user.avatar}
                        alt={activity.user.name}
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 border-b border-slate-100 dark:border-slate-900 pb-2.5 last:border-b-0">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      <span className="font-semibold text-violet-600 dark:text-violet-400">
                        {activity.user?.name || 'Unknown User'}
                      </span>{' '}
                      {activity.action}{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-300">
                        {activity.task?.title || activity.project?.name}
                      </span>
                    </p>
                    {activity.details && (
                      <span className="text-[10px] text-slate-400 block mt-1 italic">
                        "{activity.details}"
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 block mt-1">
                      {new Date(activity.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;
