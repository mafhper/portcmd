import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  Filter, 
} from 'lucide-react';
import { SystemService } from './services/systemService';
import { ProcessEntry, FilterState, SavedProject, ViewType } from './types';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';
import { translations } from './locales';
import StatsOverview from './components/StatsOverview';
import PortTable from './components/PortTable';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import ProjectManager from './components/ProjectManager';
import ConsoleModal from './components/ConsoleModal';
import { AnimatePresence } from 'framer-motion';

const MainApp = () => {
  const { settings } = usePreferences();
  const t = translations[settings.language];
  
  const [processes, setProcesses] = useState<ProcessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedProjectLogs, setSelectedProjectLogs] = useState<SavedProject | null>(null);

  const [filter, setFilter] = useState<FilterState>({
    search: '',
    type: 'All',
    onlyFavorites: false,
    onlyManaged: false,
  });

  const loadProcesses = useCallback(async () => {
    if (processes.length === 0) setLoading(true);
    try {
      const data = await SystemService.getProcesses();
      setProcesses(data);
    } catch (error) {
      console.error("Failed to load processes", error);
    } finally {
      setLoading(false);
    }
  }, [processes.length]);

  useEffect(() => {
    loadProcesses();
    const interval = setInterval(() => {
      SystemService.getProcesses().then(data => {
         setProcesses(prev => {
            const favorites = new Set(prev.filter(p => p.isFavorite).map(p => p.pid));
            return data.map(d => ({
              ...d,
              isFavorite: favorites.has(d.pid) || d.isFavorite
            }));
         });
      });
    }, settings.refreshRate);
    return () => clearInterval(interval);
  }, [settings.refreshRate, loadProcesses]);

  const handleKill = async (pid: number) => {
    if (settings.confirmKill) {
      if (!window.confirm(`${t.confirmKill} ${pid}?`)) return;
    }
    const success = await SystemService.killProcess(pid);
    if (success) setProcesses(prev => prev.filter(p => p.pid !== pid));
  };

  const handleRestart = async (pid: number, managedById?: string) => {
    await SystemService.restartProcess(pid, managedById);
    loadProcesses(); 
  };

  const handleToggleFavorite = (pid: number) => {
    setProcesses(prev => prev.map(p => p.pid === pid ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const filteredProcesses = useMemo(() => {
    return processes.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        p.pid.toString().includes(filter.search) ||
        p.port.toString().includes(filter.search);
      const matchesType = filter.type === 'All' || p.type === filter.type;
      const matchesFav = !filter.onlyFavorites || p.isFavorite;
      const matchesManaged = !filter.onlyManaged || !!p.managedById;
      return matchesSearch && matchesType && matchesFav && matchesManaged;
    });
  }, [processes, filter]);

  return (
    <div 
      className={`flex h-screen overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-500`}
      style={{ color: 'var(--foreground)' }}
    >
      <AnimatePresence>
        {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
        {selectedProjectLogs && <ConsoleModal project={selectedProjectLogs} onClose={() => setSelectedProjectLogs(null)} />}
      </AnimatePresence>

      <Sidebar 
        filter={filter} 
        setFilter={setFilter} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-transparent transition-colors duration-500 relative z-10">
        <h1 className="sr-only">PortCmd - Process and Port Manager</h1>
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-transparent backdrop-blur-sm sticky top-0 z-30">
          <div className="flex-1 max-w-xl">
             {currentView === 'dashboard' && (
              <div className="relative group">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors`} style={{ color: 'var(--muted-foreground)' }} />
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder}
                  aria-label="Search processes"
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all backdrop-blur-md`}
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
             )}
          </div>
          
          <div className="flex items-center space-x-3 ml-4">
             <button 
              onClick={() => loadProcesses()}
              className={`p-2 hover:bg-white/10 rounded-lg transition-all`}
              style={{ color: 'var(--muted-foreground)' }}
              title="Refresh"
              aria-label="Refresh processes"
             >
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
           <div className={`max-w-7xl mx-auto space-y-8`}>
              {currentView === 'dashboard' ? (
                <>
                  <StatsOverview processes={processes} />
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                           <Filter className="w-5 h-5 text-indigo-500" />
                           {t.activeProcesses}
                           <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono">
                              {filteredProcesses.length}
                           </span>
                        </h2>
                     </div>
                     <PortTable 
                        processes={filteredProcesses} 
                        totalProcessesCount={processes.length}
                        onKill={handleKill}
                        onRestart={handleRestart}
                        onToggleFavorite={handleToggleFavorite}
                        isLoading={loading}
                     />
                  </div>
                </>
              ) : (
                <ProjectManager onViewLogs={setSelectedProjectLogs} />
              )}
           </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <PreferencesProvider>
      <MainApp />
    </PreferencesProvider>
  );
}
