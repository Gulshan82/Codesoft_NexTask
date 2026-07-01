import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Briefcase,
  CheckCircle,
  Clock,
  ArrowRight,
  Coffee,
  AlertCircle,
} from 'lucide-react';
import GlassCard from '../../components/UI/GlassCard';

const CalendarPage = () => {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Fetch all tasks and projects to display deadlines
  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        setLoading(true);
        const { data: projects } = await api.get('/projects');
        
        let allEvents = [];

        // Add projects deadlines
        projects.forEach(p => {
          if (p.deadline) {
            allEvents.push({
              id: p._id,
              title: p.name,
              description: p.description,
              date: new Date(p.deadline),
              type: 'Project',
              priority: p.priority,
              colorClass: 'border-violet-500 bg-violet-500/10 text-violet-755 dark:text-violet-400',
              link: `/projects/${p._id}`,
            });
          }
        });

        // Fetch tasks details for each project to merge their deadlines
        const fetchTasksPromises = projects.map(p => api.get(`/projects/${p._id}`));
        const projectDetails = await Promise.all(fetchTasksPromises);
        
        projectDetails.forEach(({ data }) => {
          data.tasks.forEach(task => {
            if (task.dueDate && task.status !== 'Completed') {
              allEvents.push({
                id: task._id,
                title: task.title,
                description: task.description,
                date: new Date(task.dueDate),
                type: 'Task',
                priority: task.priority,
                projectName: data.project.name,
                colorClass: 'border-indigo-500 bg-indigo-500/10 text-indigo-755 dark:text-indigo-400',
                link: `/projects/${data.project._id || data.project}`,
              });
            }
          });
        });

        setEvents(allEvents);
      } catch (err) {
        console.error('Failed to load calendar deadlines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeadlines();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate calendar days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];

  // Padding days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    daysArray.push({
      isCurrentMonth: false,
      date: new Date(year, month, -i),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Padding days for next month to complete the 42-cell calendar grid
  const totalCells = 42;
  const remainingCells = totalCells - daysArray.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysArray.push({
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Selected Day's events
  const selectedDayEvents = events.filter(
    (e) => e.date.toDateString() === selectedDate.toDateString()
  );

  const getPriorityBadgeColor = (priority) => {
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
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
          Milestones Calendar
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Coordinate timelines, track critical launch dates, and manage due tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: The Calendar Grid (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Glass Pill */}
          <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-2xl shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-violet-500 mr-1 flex-shrink-0" />
              
              {/* Month Dropdown Select */}
              <select
                value={month}
                onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
                className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none focus:ring-0 select-none"
              >
                {monthNames.map((name, index) => (
                  <option key={name} value={index} className="bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100">
                    {name}
                  </option>
                ))}
              </select>

              {/* Separator */}
              <span className="text-xs font-bold text-slate-400 dark:text-slate-655 px-0.5 select-none">/</span>

              {/* Year Dropdown Select */}
              <select
                value={year}
                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
                className="text-xs font-bold text-slate-850 dark:text-slate-200 bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none focus:ring-0 select-none"
              >
                {Array.from({ length: 17 }, (_, i) => new Date().getFullYear() - 8 + i).map((y) => (
                  <option key={y} value={y} className="bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              {/* Legend keys */}
              <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase mr-2 border-r border-slate-200 dark:border-slate-800 pr-5">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Project</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Task</span>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Grid Card */}
          {loading ? (
            <div className="h-96 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-center animate-pulse bg-white/30 dark:bg-slate-900/10">
              <p className="text-xs text-slate-400">Loading deadline matrices...</p>
            </div>
          ) : (
            <GlassCard className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl">
              {/* Week Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Days Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80 text-left min-h-[460px]">
                {daysArray.map((day, idx) => {
                  const dateStr = day.date.toISOString().split('T')[0];
                  const dayEvents = events.filter((e) => e.date.toISOString().split('T')[0] === dateStr);
                  
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  const isSelected = selectedDate.toDateString() === day.date.toDateString();

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(day.date)}
                      className={`
                        p-2.5 flex flex-col justify-between transition-all min-h-[85px] cursor-pointer relative group
                        ${day.isCurrentMonth ? 'bg-transparent' : 'bg-slate-500/5 text-slate-400 dark:text-slate-655'}
                        ${isSelected ? 'bg-violet-500/5 ring-1 ring-inset ring-violet-500/30' : 'hover:bg-slate-500/5'}
                      `}
                    >
                      {/* Day Number badge */}
                      <div className="flex justify-between items-center">
                        <span className={`
                          text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center justify-center
                          ${isToday ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}
                          ${isSelected && !isToday ? 'text-violet-600 dark:text-violet-400 font-extrabold' : ''}
                        `}>
                          {day.date.getDate()}
                        </span>

                        {/* Unread events count marker */}
                        {dayEvents.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        )}
                      </div>

                      {/* Small inline list of items (maximum 2 shown) */}
                      <div className="mt-2 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map((evt, eIdx) => (
                          <div
                            key={eIdx}
                            className={`
                              px-1 py-0.5 rounded border text-[8px] font-bold truncate max-w-full leading-tight flex items-center gap-1
                              ${evt.type === 'Project' ? 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'}
                            `}
                          >
                            {evt.type === 'Project' ? <Briefcase className="w-2.5 h-2.5 flex-shrink-0" /> : <Clock className="w-2.5 h-2.5 flex-shrink-0" />}
                            <span className="truncate">{evt.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[7.5px] font-extrabold text-slate-400 pl-1">
                            +{dayEvents.length - 2} more...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Side: The Agenda Panel (1/3 width) */}
        <div className="space-y-4">
          <GlassCard className="p-6 border-slate-200 dark:border-slate-800 shadow-xl min-h-[460px] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-105 dark:border-slate-800/80">
                <Clock className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">
                  Agenda: {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </h3>
              </div>

              {/* Event Cards Checklist */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Coffee className="w-9 h-9 text-slate-350 dark:text-slate-600 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No Milestones Due
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] mx-auto leading-relaxed">
                        Enjoy your free day! There are no tasks or project releases scheduled.
                      </p>
                    </div>
                  </div>
                ) : (
                  selectedDayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => navigate(evt.link)}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 hover:border-violet-500/30 transition-all cursor-pointer group text-left relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border flex items-center gap-1
                          ${evt.type === 'Project' ? 'text-violet-500 border-violet-500/20 bg-violet-500/10' : 'text-indigo-500 border-indigo-500/20 bg-indigo-500/10'}
                        `}>
                          {evt.type === 'Project' ? <Briefcase className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                          {evt.type}
                        </span>

                        <span className={`px-1.5 py-0.5 text-[8px] font-bold border rounded ${getPriorityBadgeColor(evt.priority)}`}>
                          {evt.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-205 leading-snug group-hover:text-violet-500 transition-colors">
                        {evt.title}
                      </h4>
                      
                      {evt.projectName && (
                        <span className="text-[9px] text-slate-400 block mt-1.5">
                          Project: {evt.projectName}
                        </span>
                      )}

                      {evt.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-2 leading-relaxed italic">
                          "{evt.description}"
                        </p>
                      )}

                      <div className="flex justify-end items-center gap-1 text-[9px] text-violet-500 font-bold mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        Go to Project Workspace <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Quick Metric */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Selected Day: {selectedDayEvents.length} due</span>
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {selectedDate.toLocaleDateString()}
              </span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
