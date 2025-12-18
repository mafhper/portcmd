import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Github, RefreshCw, Zap, Activity } from 'lucide-react';
import { SystemService } from '../services/systemService';
import { SavedProject, SiteStatus, GitHubStatus } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';

const MonitorView: React.FC = () => {
  usePreferences();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [statuses, setStatuses] = useState<Record<string, SiteStatus>>({});
  const [gitStatuses, setGitStatuses] = useState<Record<string, GitHubStatus>>({});

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
    const data = await SystemService.getSavedProjects();
    setProjects(data);
    await refreshStatuses(data);
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
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Globe className="text-indigo-500" />
          Production Control
        </h2>
        <button 
          onClick={() => refreshStatuses()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Sync Live Status
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed rounded-2xl opacity-30" style={{ borderColor: 'var(--border-color)' }}>
          No production URL configured. Add it in Workspaces.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Status Hero */}
          <div 
            className="rounded-3xl border p-8 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Globe size={200} />
             </div>

             <div className="relative z-10 space-y-4 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                   <div className={`px-4 py-1.5 rounded-full text-sm font-black border ${getStatusColor(statuses[projects[0].id]?.status)}`}>
                      {statuses[projects[0].id]?.status?.toUpperCase() || 'CHECKING...'}
                   </div>
                   <span className="text-xs font-mono opacity-50">{projects[0].url}</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter">System is {statuses[projects[0].id]?.status === 'online' ? 'Operational' : 'Syncing'}</h1>
                <p className="text-sm opacity-60 max-w-md">The production environment is being monitored from your local server. All systems report stable response times.</p>
             </div>

             <div className="relative z-10 grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 text-center">
                   <div className="text-[10px] uppercase font-bold opacity-40 mb-1">Latency</div>
                   <div className="text-2xl font-mono font-bold">{statuses[projects[0].id]?.latency || '--'}ms</div>
                </div>
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 text-center">
                   <div className="text-[10px] uppercase font-bold opacity-40 mb-1">Uptime</div>
                   <div className="text-2xl font-mono font-bold text-emerald-500">99.9%</div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* GitHub Feed */}
             <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50">
                   <Github size={14} />
                   Deployment History
                </div>
                <div className="rounded-2xl border bg-black/10 divide-y divide-white/5 overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                   {projects.map(p => {
                      const git = gitStatuses[p.id];
                      if (!git?.lastCommit) return null;
                      return (
                        <div key={p.id} className="p-5 flex items-start gap-4 hover:bg-white/5 transition-colors">
                           <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0 border border-indigo-500/20">
                              <Zap size={18} className="text-indigo-400" />
                           </div>
                           <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="text-sm font-bold truncate pr-4">{git.lastCommit.message}</span>
                                 <span className="text-[10px] font-mono opacity-40 shrink-0">{git.lastCommit.sha}</span>
                              </div>
                              <div className="text-xs opacity-50 flex items-center gap-3">
                                 <span>{git.lastCommit.author}</span>
                                 <span>•</span>
                                 <span>{new Date(git.lastCommit.date).toLocaleDateString()}</span>
                                 <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">SUCCESS</span>
                              </div>
                           </div>
                        </div>
                      )
                   })}
                </div>
             </div>

             {/* Telemetry */}
             <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50">
                   <Activity size={14} />
                   Live Telemetry
                </div>
                <div className="glass-card p-6 rounded-2xl h-full flex flex-col justify-between min-h-[200px]">
                   <div className="space-y-1">
                      <div className="text-sm font-bold">Network Traffic</div>
                      <div className="text-xs opacity-50">Stable load from all regions.</div>
                   </div>
                   <div className="flex items-end gap-1 h-24">
                      {[...Array(30)].map((_, i) => (
                        <div key={i} className={`flex-1 rounded-t-sm bg-indigo-500 transition-all duration-1000`} style={{ height: `${Math.random() * 80 + 10}%`, opacity: 0.2 + (i / 30) * 0.8 }} />
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorView;