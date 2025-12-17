import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Settings, 
  Terminal, 
  Database, 
  Server, 
  Cpu, 
  Star,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { translations } from '../locales';
import { ProcessType, FilterState } from '../types';

interface SidebarProps {
  filter: FilterState;
  setFilter: (f: any) => void;
  onOpenSettings: () => void;
  currentView: 'dashboard' | 'projects';
  setCurrentView: (v: 'dashboard' | 'projects') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ filter, setFilter, onOpenSettings, currentView, setCurrentView }) => {
  const { settings, updateSettings, isDark } = usePreferences();
  const t = translations[settings.language];
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const collapsed = isMobile || settings.sidebarCollapsed;

  const glassStyle = {
    backgroundColor: isDark 
      ? `rgba(9, 9, 11, ${settings.glassOpacity})` 
      : `rgba(255, 255, 255, ${settings.glassOpacity})`,
    backdropFilter: `blur(${settings.glassBlur}px)`,
    color: 'var(--sidebar-text)',
    boxShadow: `4px 0px 20px rgba(var(--shadow-color), ${Number(settings.shadowIntensity) * 0.2})`
  };

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, view: 'dashboard' },
    { id: 'projects', label: t.projects, icon: FolderKanban, view: 'projects' },
  ];

  const categories = [
    { type: ProcessType.DEVELOPMENT, icon: Terminal, color: 'text-emerald-500' },
    { type: ProcessType.DATABASE, icon: Database, color: 'text-blue-500' },
    { type: ProcessType.SYSTEM, icon: Server, color: 'text-zinc-500' },
    { type: ProcessType.OTHER, icon: Cpu, color: 'text-purple-500' },
  ];

  const textVariants = {
    hidden: { opacity: 0, width: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, width: 'auto', transition: { duration: 0.2, delay: 0.1 } }
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex-shrink-0 flex flex-col h-full border-r relative z-20 overflow-hidden"
      style={{ ...glassStyle, borderColor: 'var(--border-color)' }}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-center relative border-b shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-500 overflow-hidden px-4">
          <ShieldCheck className="w-8 h-8 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span 
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="font-bold text-lg tracking-tight whitespace-nowrap"
              >
                PortCmd
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <button 
          onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
          className="absolute -right-3 top-6 bg-indigo-600 rounded-full p-1 text-white shadow-lg hover:bg-indigo-500 transition-colors z-50"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {/* Main Views */}
        <div className="space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.view as any)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${currentView === item.view 
                  ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'}`}
              style={{ color: currentView === item.view ? '' : 'var(--sidebar-text)' }}
              title={collapsed ? item.label : ''}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span 
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="ml-3 whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>

        {/* Categories (Only in Dashboard) */}
        {currentView === 'dashboard' && (
          <>
            <AnimatePresence>
              {!collapsed && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
                  className="px-3 text-[10px] font-bold uppercase tracking-widest opacity-50"
                >
                  {t.categories}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-1">
              <button
                 onClick={() => setFilter((prev: any) => ({ ...prev, type: 'All', onlyFavorites: false, onlyManaged: false }))}
                 className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100`}
                 style={{ color: 'var(--sidebar-text)' }}
              >
                 <div className="flex items-center">
                    <Globe className="w-4 h-4 shrink-0 opacity-50" />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap">
                          All
                        </motion.span>
                      )}
                    </AnimatePresence>
                 </div>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.type}
                  onClick={() => setFilter((prev: any) => ({ ...prev, type: cat.type, onlyFavorites: false, onlyManaged: false }))}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 
                    ${filter.type === cat.type ? 'bg-black/5 dark:bg-white/5 !opacity-100' : ''}`}
                  style={{ color: 'var(--sidebar-text)' }}
                  title={collapsed ? cat.type : ''}
                >
                  <div className="flex items-center min-w-0">
                    <cat.icon className={`w-4 h-4 shrink-0 ${cat.color}`} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap truncate">
                          {cat.type}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {!collapsed && filter.type === cat.type && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500 shrink-0 ml-2 shadow-sm"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Shortcuts */}
            <div className="pt-2 space-y-1">
              <button 
                onClick={() => setFilter((prev: any) => ({ ...prev, onlyManaged: true, onlyFavorites: false, type: 'All' }))}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filter.onlyManaged ? 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'}`}
                style={{ color: filter.onlyManaged ? '' : 'var(--sidebar-text)' }}
                title={collapsed ? "My Projects" : ''}
              >
                <FolderKanban className={`w-4 h-4 shrink-0`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap">
                      My Projects
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button 
                onClick={() => setFilter((prev: any) => ({ ...prev, onlyFavorites: true, onlyManaged: false, type: 'All' }))}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filter.onlyFavorites ? 'bg-yellow-600/10 text-yellow-600 dark:text-yellow-500 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'}`}
                style={{ color: filter.onlyFavorites ? '' : 'var(--sidebar-text)' }}
                title={collapsed ? t.favorites : ''}
              >
                <Star className={`w-4 h-4 shrink-0 ${filter.onlyFavorites ? 'fill-current' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap">
                      {t.favorites}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <button 
          onClick={onOpenSettings}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} p-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all`}
          style={{ color: 'var(--sidebar-text)' }}
          title={t.settings}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap">
                {t.settings}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;