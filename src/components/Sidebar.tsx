import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Terminal, 
  Code,
  Database, 
  Server, 
  Cpu, 
  Star,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Globe,
  ArrowLeft
} from 'lucide-react';import { usePreferences } from '../contexts/PreferencesContext';
import { useTranslation } from 'react-i18next';
// import { SystemService } from '../services/systemService'; // Removed as unused
import { ProcessType, FilterState, ViewType } from '../types';

interface SidebarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  onOpenSettings: () => void;
  currentView: ViewType;
  setCurrentView: (v: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ filter, setFilter, onOpenSettings, currentView, setCurrentView }) => {
  const { settings, updateSettings, isDark } = usePreferences();
  const { t } = useTranslation();
  
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
    { id: 'dashboard', label: t('dashboard'), icon: Code, view: 'dashboard' },
    { id: 'projects', label: t('workspaces'), icon: FolderKanban, view: 'projects' },
  ];
  const categories = [
    { type: ProcessType.DEVELOPMENT, icon: Code, color: 'text-success' },
    { type: ProcessType.DATABASE, icon: Database, color: 'text-info' },
    { type: ProcessType.SYSTEM, icon: Server, color: 'text-muted' },
    { type: ProcessType.OTHER, icon: Cpu, color: 'text-warning' },
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
      <div className="h-16 flex items-center relative border-b shrink-0 px-3" style={{ borderColor: 'var(--border-color)' }}>
        <a href="/portcmd/app/" className="flex items-center justify-center p-2 rounded-lg hover:bg-surfaceHover transition-colors group">
          <div className="relative w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden group-hover:bg-primary transition-all duration-300">
            <Terminal size={18} className="transition-all duration-300 group-hover:translate-x-8 group-hover:opacity-0" />
            <ArrowLeft size={18} className="absolute text-white -translate-x-8 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </div>
        </a>
        
        <AnimatePresence>
          {!collapsed && (
            <motion.a 
              href="/portcmd/app/"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="ml-2 font-bold text-lg tracking-tight whitespace-nowrap hover:text-primary transition-colors duration-200"
              style={{ color: 'var(--sidebar-text)' }}
            >
              PortCmd
            </motion.a>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
          className="absolute -right-3 top-6 bg-primary rounded-full p-1 text-primaryFg shadow-lg hover:bg-primaryHover transition-colors z-50"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar overflow-hidden`}>
        {/* Main Views */}
        <div className="space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.view as ViewType)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                ${currentView === item.view 
                  ? 'bg-primary/10 text-primary shadow-sm' 
                  : 'hover:bg-surfaceHover text-muted hover:text-fg'}`}
              style={{ color: currentView === item.view ? '' : 'var(--sidebar-text)' }}
              title={collapsed ? item.label : ''}
              aria-label={item.label}
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
                  className="px-3 text-[10px] font-bold uppercase tracking-widest opacity-50 mt-4 mb-2"
                >
                  {t('categories')}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-1">
              <button
                 onClick={() => setFilter((prev) => ({ ...prev, type: 'All', onlyFavorites: false, onlyManaged: false }))}
                 className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-surfaceHover text-muted hover:text-fg min-h-[44px]`}
                 style={{ color: 'var(--sidebar-text)' }}
                 aria-label="Show all processes"
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
                  onClick={() => setFilter((prev) => ({ ...prev, type: cat.type, onlyFavorites: false, onlyManaged: false }))}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} ${collapsed ? 'px-3' : 'pl-6 pr-3'} py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-surfaceHover text-muted hover:text-fg min-h-[40px] 
                    ${filter.type === cat.type ? 'bg-surfaceHover text-fg' : ''}`}
                  style={{ color: 'var(--sidebar-text)' }}
                  title={collapsed ? cat.type : ''}
                  aria-label={`Filter by ${cat.type}`}
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
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-2 shadow-sm"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Shortcuts */}
            <div className="pt-2 space-y-1">
              <button 
                onClick={() => setFilter((prev) => ({ ...prev, onlyManaged: true, onlyFavorites: false, type: 'All' }))}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                  ${filter.onlyManaged ? 'bg-success/10 text-success shadow-sm' : 'hover:bg-surfaceHover text-muted hover:text-fg'}`}
                style={{ color: filter.onlyManaged ? '' : 'var(--sidebar-text)' }}
                title={collapsed ? "My Projects" : ''}
                aria-label="Show my projects only"
              >
                <FolderKanban className={`w-4 h-4 shrink-0`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap">
                      {t('managed')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button 
                onClick={() => setFilter((prev) => ({ ...prev, onlyFavorites: true, onlyManaged: false, type: 'All' }))}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                  ${filter.onlyFavorites ? 'bg-warning/10 text-warning shadow-sm' : 'hover:bg-surfaceHover text-muted hover:text-fg'}`}
                style={{ color: filter.onlyFavorites ? '' : 'var(--sidebar-text)' }}
                  title={collapsed ? t('favorites') : ''}
                aria-label="Show favorites only"
              >
                <Star className={`w-4 h-4 shrink-0 ${filter.onlyFavorites ? 'fill-current' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap">
                      {t('favorites')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t shrink-0 space-y-2" style={{ borderColor: 'var(--border-color)' }}>
         {!collapsed && (
            <div className="space-y-1 mb-2">
               {/* Shortcuts removed as requested - they belong in Dashboard */}
            </div>
         )}
        <button 
          onClick={onOpenSettings}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} p-3 rounded-lg text-muted hover:text-fg hover:bg-surfaceHover transition-all min-h-[44px]`}
          style={{ color: 'var(--sidebar-text)' }}
          title={t('settings')}
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap">
                {t('settings')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;