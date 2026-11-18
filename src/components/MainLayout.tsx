import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Book,
  Plus,
  History,
  Menu,
  ChevronLeft,
  Sparkles,
  User,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatService } from '../api/chat.service';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<string[]>([]);

  const currentSessionId = localStorage.getItem('sirius_session_id') || '';

  useEffect(() => {
    loadHistory();
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, [location.pathname]);

  const loadHistory = () => {
    const savedHistory = JSON.parse(localStorage.getItem('sirius_history') || '[]');
    setHistory(savedHistory);
  };

  const startNewChat = () => {
    const newId = `session-${Date.now()}`;
    localStorage.setItem('sirius_session_id', newId);

    const savedHistory = JSON.parse(localStorage.getItem('sirius_history') || '[]');
    const newHistory = [newId, ...savedHistory].slice(0, 20);
    localStorage.setItem('sirius_history', JSON.stringify(newHistory));
    setHistory(newHistory);

    if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.location.reload();
    }
  };

  const selectSession = (id: string) => {
    localStorage.setItem('sirius_session_id', id);
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.location.reload();
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;

    try {
      await chatService.deleteSession(id);
      const savedHistory = JSON.parse(localStorage.getItem('sirius_history') || '[]');
      const newHistory = savedHistory.filter((sid: string) => sid !== id);
      localStorage.setItem('sirius_history', JSON.stringify(newHistory));
      setHistory(newHistory);

      if (id === currentSessionId) {
        const nextSession = newHistory[0];
        if (nextSession) {
          selectSession(nextSession);
        } else {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">

      <aside className={cn(
        "transition-all duration-300 ease-in-out border-r border-slate-100 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#0b1120] flex flex-col relative z-20",
        isSidebarOpen ? "w-72" : "w-20"
      )}>

        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="font-black text-lg tracking-tighter uppercase">Sirius AI</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
              <Sparkles size={16} className="text-white" />
            </div>
          )}

          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 mx-auto mt-2"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="px-4 mt-6">
          <button
            onClick={startNewChat}
            className={cn(
              "flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95",
              isSidebarOpen ? "w-full py-3 px-4 rounded-2xl" : "w-12 h-12 justify-center rounded-full mx-auto"
            )}
          >
            <Plus size={20} className="text-emerald-500" />
            {isSidebarOpen && <span className="font-bold text-sm">New Chat</span>}
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-1">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 py-3 rounded-xl transition-all group",
              isSidebarOpen ? "px-4" : "justify-center",
              location.pathname === '/' ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            )}
          >
            <MessageSquare size={20} />
            {isSidebarOpen && <span className="text-sm font-semibold">Conversations</span>}
          </Link>

          <Link
            to="/knowledge"
            className={cn(
              "flex items-center gap-3 py-3 rounded-xl transition-all group",
              isSidebarOpen ? "px-4" : "justify-center",
              location.pathname === '/knowledge' ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            )}
          >
            <Book size={20} />
            {isSidebarOpen && <span className="text-sm font-semibold">Knowledge</span>}
          </Link>
        </nav>

        {isSidebarOpen && (
          <div className="mt-8 flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
            <div className="flex items-center gap-2 px-4 mb-4 text-slate-400">
              <History size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Recent Chats</span>
            </div>

            <div className="space-y-1">
              {history.map(id => {
                const timestamp = parseInt(id.split('-').pop() || '0');
                const dateLabel = isNaN(timestamp) ? id : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });

                return (
                  <div key={id} className="group relative">
                    <button
                      onClick={() => selectSession(id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all text-[11px] font-bold truncate pr-10",
                        currentSessionId === id
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
                      )}
                    >
                      <MessageSquare size={13} className={currentSessionId === id ? 'text-emerald-500' : 'text-slate-400'} />
                      <span className="truncate">{dateLabel}</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteSession(e, id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className={cn(
            "flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all",
            isSidebarOpen ? "p-3 rounded-2xl" : "w-12 h-12 justify-center rounded-full mx-auto"
          )}>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0">
              <User size={16} />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">Sirius Admin</p>
                <p className="text-[10px] text-slate-400 truncate">Ready</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar bg-white dark:bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
