import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Loader2,
  Users,
} from 'lucide-react';
import api from '../../services/api';
import GlassCard from '../../components/UI/GlassCard';

const DiscussionsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [newDiscussionText, setNewDiscussionText] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to bottom of message thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [discussions]);

  // Load user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get('/projects');
        setProjects(data);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Load project discussion comments when active project changes
  useEffect(() => {
    if (!activeProject) return;
    const fetchDiscussions = async () => {
      setLoadingDiscussions(true);
      try {
        const { data } = await api.get(`/comments/project/${activeProject._id}`);
        setDiscussions(data);
      } catch (err) {
        console.error('Failed to fetch discussions', err);
      } finally {
        setLoadingDiscussions(false);
      }
    };
    fetchDiscussions();
  }, [activeProject]);

  const handlePostDiscussion = async (e) => {
    e.preventDefault();
    if (!newDiscussionText.trim() || !activeProject) return;
    try {
      const { data } = await api.post('/comments', {
        projectId: activeProject._id,
        text: newDiscussionText,
      });
      setDiscussions([...discussions, data]);
      setNewDiscussionText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    }
  };

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-[calc(100vh-140px)] border border-slate-200/50 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white/40 dark:bg-slate-950/20 backdrop-blur-md">
      {/* Left panel: List of project channels */}
      <div
        className={`border-r border-slate-200/50 dark:border-slate-800/80 flex flex-col h-full bg-slate-50/10 dark:bg-slate-900/10 min-w-0 min-h-0 overflow-hidden
          ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}
        `}
      >
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            Project Channels
          </h3>
          <p className="text-[10px] text-slate-450 mt-1">Select a workspace to start chatting</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingProjects ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              <span className="text-xs">Loading channels...</span>
            </div>
          ) : projects.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No channels available.</p>
          ) : (
            projects.map((project) => (
              <button
                key={project._id}
                onClick={() => {
                  setActiveProject(project);
                  setIsMobileChatOpen(true);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group
                  ${
                    activeProject?._id === project._id
                      ? 'bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold shadow-sm'
                      : 'border border-transparent hover:bg-slate-100/40 dark:hover:bg-slate-800/20 text-slate-600 dark:text-slate-400 font-medium'
                  }
                `}
              >
                <div className="flex items-center gap-1 min-w-0 flex-1 mr-2">
                  <span className={`text-xs font-semibold truncate max-w-[180px] transition-colors
                    ${activeProject?._id === project._id ? 'text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400'}
                  `}>
                    {project.name}
                  </span>
                </div>
                <span className={`px-1.5 py-0.5 text-[8px] font-extrabold border rounded uppercase leading-none ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Active Chat feed */}
      <div
        className={`flex flex-col h-full bg-transparent min-w-0 min-h-0 overflow-hidden
          ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}
        `}
      >
        {!activeProject ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-white/10 dark:bg-transparent">
            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/25 text-violet-500 mb-4 animate-bounce-slow">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Welcome to Discussions Hub</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
              Select a project channel from the left sidebar to start discussing milestones and collaborate with your team.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setIsMobileChatOpen(false)}
                  className="p-1.5 rounded-lg md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate">
                      {activeProject.name}
                    </span>
                    <span className={`px-1.5 py-0.2 text-[8px] font-extrabold rounded bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide`}>
                      {activeProject.status}
                    </span>
                  </div>
                  {activeProject.description && (
                    <p className="text-[10px] text-slate-450 truncate max-w-lg mt-0.5">
                      {activeProject.description}
                    </p>
                  )}
                </div>
              </div>

              {/* View Project Detail shortcut */}
              <button
                onClick={() => navigate(`/projects/${activeProject._id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-650 dark:text-slate-350 transition-colors"
              >
                Go to Project
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/10 dark:bg-slate-950/5">
              {loadingDiscussions ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  <span className="text-xs">Loading conversation...</span>
                </div>
              ) : discussions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-850 dark:text-slate-250">No discussions posted yet</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">Be the first to send a message in this channel!</p>
                </div>
              ) : (
                discussions.map((msg) => (
                  <div key={msg._id} className="flex gap-3 text-left">
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
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900 rounded-2xl p-3 shadow-sm max-w-2xl">
                      <div className="flex items-center justify-between mb-1">
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
                          {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Chat Box */}
            <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20">
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
                  disabled={!newDiscussionText.trim()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionsPage;
