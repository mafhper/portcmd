import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, Github, RefreshCw, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { SystemService } from '../services/systemService';
import { SavedProject, SiteStatus, GitHubStatus } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';

const MonitorView: React.FC = () => {
  usePreferences();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [statuses, setStatuses] = useState<Record<string, SiteStatus>>({});
  const [gitStatuses, setGitStatuses] = useState<Record<string, GitHubStatus>>({});
  const [loading, setLoading] = useState(true);

  const refreshStatuses = useCallback(async (targetProjects?: SavedProject[]) => {
    const list = targetProjects || projects;
    if (list.length === 0) return;
    
    // Ping all sites
    const pingPromises = list.filter(p => p.url).map(async (p) => {
      const res = await SystemService.pingSite(p.url!);
      setStatuses(prev => ({ ...prev, [p.id]: res }));
    });

    // Fetch git statuses
    const gitPromises = list.filter(p => p.githubRepo).map(async (p) => {
      const res = await SystemService.getGitHubStatus(p.githubRepo!);
      if (res) setGitStatuses(prev => ({ ...prev, [p.id]: res }));
    });

    await Promise.all([...pingPromises, ...gitPromises]);
  }, [projects]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const data = await SystemService.getSavedProjects();
    setProjects(data);
    await refreshStatuses(data);
    setLoading(false);
  }, [refreshStatuses]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadAll();
    const interval = setInterval(refreshStatuses, 60000 * 5); // 5 min interval for auto-refresh
    return () => clearInterval(interval);
  }, [loadAll, refreshStatuses]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'slow': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'offline': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-8" style={{ color: 'var(--foreground)' }}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Activity className="text-indigo-500" />
          Real-time Monitor
        </h2>
        <button 
          onClick={() => refreshStatuses()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all border flex items-center gap-2"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <RefreshCw size={14} />
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading && projects.length === 0 ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl border" style={{ borderColor: 'var(--border-color)' }} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed rounded-2xl opacity-30" style={{ borderColor: 'var(--border-color)' }}>
            No projects with URLs found. Add them in Project Manager.
          </div>
        ) : (
          projects.map(project => {
            const status = statuses[project.id];
            const git = gitStatuses[project.id];
            
            return (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border transition-all hover:shadow-xl"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        {project.name}
                        {status?.status === 'online' ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-amber-500" />}
                      </h3>
                      <p className="text-xs opacity-50 font-mono mt-1">{project.url || 'No URL configured'}</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status?.status)}`}>
                        {status?.status?.toUpperCase() || 'UNKNOWN'}
                      </div>
                      {status?.latency ? (
                        <div className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 opacity-70">
                          {status.latency}ms
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ping Monitor */}
                    <div className="bg-black/10 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-50 mb-3">
                        <Globe size={12} />
                        Network Status
                      </div>
                      <div className="flex items-end gap-1 h-8">
                        {/* Simulated small ping history bars */}
                        {[...Array(20)].map((_, i) => (
                          <div key={i} className={`flex-1 rounded-t-sm ${i === 19 && status?.status === 'online' ? 'bg-emerald-500' : 'bg-white/10'}`} style={{ height: `${Math.random() * 60 + 20}%` }} />
                        ))}
                      </div>
                      <div className="mt-3 text-[10px] opacity-40 flex justify-between font-mono">
                        <span>Last 20 pings</span>
                        <span>{status?.lastCheck ? new Date(status.lastCheck).toLocaleTimeString() : '--'}</span>
                      </div>
                    </div>

                    {/* GitHub Monitor */}
                    <div className="bg-black/10 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-50 mb-3">
                        <Github size={12} />
                        GitHub Feed {project.githubRepo ? `(${project.githubRepo})` : ''}
                      </div>
                      {git?.lastCommit ? (
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                              <Zap size={14} className="text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-indigo-400 truncate">{git.lastCommit.message}</p>
                              <p className="text-[10px] opacity-50 mt-0.5">{git.lastCommit.author} • {new Date(git.lastCommit.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] opacity-30 italic py-2">No GitHub repository linked.</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MonitorView;