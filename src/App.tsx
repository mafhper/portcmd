import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { 
  Search, 
  RefreshCw, 
} from 'lucide-react';
import { SystemService } from './services/systemService';
import { ProcessEntry, FilterState, SavedProject, ViewType } from './types';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';
import { useTranslation } from 'react-i18next';
import StatsOverview from './components/StatsOverview';

// Lazy load heavy components
const LazyModals = lazy(() => import('./components/LazyModals'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const ProjectManager = lazy(() => import('./components/ProjectManager'));
const DashboardView = lazy(() => import('./components/DashboardView'));

const MainApp = () => {
  const { settings } = usePreferences();
  const { t } = useTranslation();
  
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
    document.title = `PortCmd - ${t(currentView === 'projects' ? 'workspaces' : 'dashboard')}`;
  }, [currentView, t]);

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
      if (!window.confirm(`${t('confirmKill')} ${pid}?`)) return;
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
      className={`flex h-screen w-full overflow-hidden font-sans selection:bg-indigo-500/30`}
      style={{ color: 'var(--foreground)' }}
    >
      <Suspense fallback={null}>
        <LazyModals 
          isSettingsOpen={isSettingsOpen} 
          onCloseSettings={() => setIsSettingsOpen(false)}
          selectedProjectLogs={selectedProjectLogs}
          onCloseConsole={() => setSelectedProjectLogs(null)}
        />
      </Suspense>

      <Suspense fallback={<div className="w-20 md:w-64 h-full bg-black/20 border-r border-white/5" />}>
        <Sidebar 
          filter={filter} 
          setFilter={setFilter} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      </Suspense>

      <main className="flex-1 flex flex-col min-w-0 bg-transparent transition-colors duration-500 relative z-10">
        <h1 className="sr-only">PortCmd - Process and Port Manager</h1>
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-transparent backdrop-blur-sm sticky top-0 z-30">
          <div className="flex-1">
             {currentView === 'dashboard' && (
              <div className="relative group">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors`} style={{ color: 'var(--muted-foreground)' }} />
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder')}
                  aria-label="Search processes"
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all backdrop-blur-md min-h-[44px]`}
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
             )}
          </div>
          
          <div className="flex items-center space-x-3 ml-4">
             <button 
              onClick={() => loadProcesses()}
              className={`p-3.5 hover:bg-white/10 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center`}
              style={{ color: 'var(--muted-foreground)' }}
              title="Refresh"
              aria-label="Refresh processes"
             >
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
      </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
           <div className={`w-full space-y-8`}>
              {currentView === 'dashboard' ? (
                <>
                  <StatsOverview processes={processes} />
                  <Suspense fallback={<div className="animate-pulse space-y-8">
                    <div className="h-96 bg-white/5 rounded-xl"></div>
                  </div>}>
                    <DashboardView 
                      processes={processes}
                      filteredProcesses={filteredProcesses}
                      loading={loading}
                      onKill={handleKill}
                      onRestart={handleRestart}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </Suspense>
                </>
              ) : (
                <Suspense fallback={<div className="animate-pulse bg-white/5 rounded-xl h-64" />}>
                  <ProjectManager onViewLogs={setSelectedProjectLogs} />
                </Suspense>
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
