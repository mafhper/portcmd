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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false); // Reset on desktop
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

  const promoUrl = typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:5174/portcmd/'
    : '/portcmd/';

  const desktopCollapsed = settings.sidebarCollapsed;
  // Mobile: sidebar always uses mobileOpen for visibility
  // Desktop: sidebar uses desktopCollapsed for width
  const showIconsOnly = isMobile ? !mobileOpen : desktopCollapsed;

  const glassStyle = {
    backgroundColor: isDark 
      ? `rgba(9, 9, 11, ${settings.glassOpacity})` 
      : `rgba(248, 250, 252, ${Math.max(Number(settings.glassOpacity), 0.85)})`, // Light: minimum 0.85 opacity for contrast
    backdropFilter: `blur(${settings.glassBlur}px)`,
    color: 'var(--sidebar-text)',
    boxShadow: isDark 
      ? `4px 0px 20px rgba(0, 0, 0, ${Number(settings.shadowIntensity) * 0.2})`
      : `4px 0px 20px rgba(0, 0, 0, ${Number(settings.shadowIntensity) * 0.08})`
  };

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Code, view: 'dashboard' },
    { id: 'projects', label: t('workspaces'), icon: FolderKanban, view: 'projects' },
  ];
  const categories = [
    { type: ProcessType.DEVELOPMENT, icon: Code, color: 'text-success' },
    { type: ProcessType.DATABASE, icon: Database, color: 'text-info' },
    { type: ProcessType.SYSTEM, icon: Server, color: 'text-gray-600 dark:text-gray-400' },
    { type: ProcessType.OTHER, icon: Cpu, color: 'text-warning' },
  ];

  const textVariants = {
    hidden: { opacity: 0, width: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, width: 'auto', transition: { duration: 0.2, delay: 0.1 } }
  };

  return (
    <>
    {/* Mobile Overlay */}
    <AnimatePresence>
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] md:hidden"
        />
      )}
    </AnimatePresence>

    {/* Mobile Toggle Button (Floating) - Explicit colors and high Z-index */}
    <button
      onClick={toggleMobileSidebar}
      className={`fixed bottom-6 right-6 z-[110] p-4 bg-blue-600 text-white rounded-full shadow-lg md:hidden hover:bg-blue-700 transition-colors ${mobileOpen ? 'hidden' : 'block'}`}
      aria-label="Open Menu"
    >
      <ChevronRight size={24} />
    </button>

    <motion.aside 
      initial={false}
      animate={{ 
        width: isMobile ? 280 : (desktopCollapsed ? 80 : 260),
        x: isMobile ? (mobileOpen ? 0 : -280) : 0
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`
        flex-col h-full border-r overflow-hidden
        ${isMobile ? 'fixed inset-y-0 left-0 z-[100] shadow-2xl' : 'flex flex-shrink-0 relative z-[70]'}
      `}
      style={{ ...glassStyle, borderColor: 'var(--border-color)' }}
    >
      {/* Header */}
      {/* Header */}
      <div className="h-16 flex items-center relative border-b shrink-0 px-3" style={{ borderColor: 'var(--border-color)' }}>
        <a href={promoUrl} className="flex items-center justify-center p-2 rounded-lg hover:bg-surfaceHover transition-colors group" title={t('backToSite') || "Back to Site"}>
          <div className="relative w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden group-hover:bg-primary transition-all duration-300">
            <Terminal size={18} className="transition-all duration-300 group-hover:translate-x-8 group-hover:opacity-0" />
            <ArrowLeft size={18} className="absolute text-white -translate-x-8 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </div>
        </a>
        
        <AnimatePresence>
          {!showIconsOnly && (
            <motion.button 
              onClick={() => { window.scrollTo(0, 0); window.location.reload(); }}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="ml-2 font-bold text-lg tracking-tight whitespace-nowrap hover:text-primary transition-colors duration-200"
              style={{ color: 'var(--sidebar-text)' }}
            >
              PortCmd
            </motion.button>
          )}
        </AnimatePresence>
        
        <button 
          onClick={isMobile ? toggleMobileSidebar : () => updateSettings({ sidebarCollapsed: !showIconsOnly })}
          className="absolute -right-3 top-6 bg-primary rounded-full p-1 text-primaryFg shadow-lg hover:bg-primaryHover transition-colors z-50"
          aria-label={isMobile ? 'Close sidebar' : (showIconsOnly ? 'Expand sidebar' : 'Collapse sidebar')}
        >
          {isMobile || showIconsOnly ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
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
              className={`w-full flex items-center ${showIconsOnly ? 'justify-center' : ''} px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                ${currentView === item.view 
                  ? 'bg-primary/10 text-primary shadow-sm' 
                  : 'hover:bg-surfaceHover text-gray-600 dark:text-gray-400 hover:text-fg'}`}
              style={{ color: currentView === item.view ? '' : 'var(--sidebar-text)' }}
              title={showIconsOnly ? item.label : ''}
              aria-label={item.label}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {!showIconsOnly && (
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
              {!showIconsOnly && (
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
                 className={`w-full flex items-center ${showIconsOnly ? 'justify-center' : 'justify-between'} px-3 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-surfaceHover text-gray-600 dark:text-gray-400 hover:text-fg min-h-[44px]`}
                 style={{ color: 'var(--sidebar-text)' }}
                 aria-label="Show all processes"
              >
                 <div className="flex items-center">
                    <Globe className="w-4 h-4 shrink-0 opacity-50" />
                    <AnimatePresence>
                      {!showIconsOnly && (
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
                  className={`w-full flex items-center ${showIconsOnly ? 'justify-center' : 'justify-between'} ${showIconsOnly ? 'px-3' : 'pl-6 pr-3'} py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-surfaceHover text-gray-600 dark:text-gray-400 hover:text-fg min-h-[44px] 
                    ${filter.type === cat.type ? 'bg-surfaceHover text-fg' : ''}`}
                  style={{ color: 'var(--sidebar-text)' }}
                  title={showIconsOnly ? cat.type : ''}
                  aria-label={`Filter by ${cat.type}`}
                >
                  <div className="flex items-center min-w-0">
                    <cat.icon className={`w-4 h-4 shrink-0 ${cat.color}`} />
                    <AnimatePresence>
                      {!showIconsOnly && (
                        <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap truncate">
                          {cat.type}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {!showIconsOnly && filter.type === cat.type && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-2 shadow-sm"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Shortcuts */}
            <div className="pt-2 space-y-1">
              <button 
                onClick={() => setFilter((prev) => ({ ...prev, onlyManaged: true, onlyFavorites: false, type: 'All' }))}
                className={`w-full flex items-center ${showIconsOnly ? 'justify-center' : ''} px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                  ${filter.onlyManaged ? 'bg-success/10 text-success shadow-sm' : 'hover:bg-surfaceHover text-gray-600 dark:text-gray-400 hover:text-fg'}`}
                style={{ color: filter.onlyManaged ? '' : 'var(--sidebar-text)' }}
                title={showIconsOnly ? "My Projects" : ''}
                aria-label="Show my projects only"
              >
                <FolderKanban className={`w-4 h-4 shrink-0`} />
                <AnimatePresence>
                  {!showIconsOnly && (
                    <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap">
                      {t('managed')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button 
                onClick={() => setFilter((prev) => ({ ...prev, onlyFavorites: true, onlyManaged: false, type: 'All' }))}
                className={`w-full flex items-center ${showIconsOnly ? 'justify-center' : ''} px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                  ${filter.onlyFavorites ? 'bg-warning/10 text-warning shadow-sm' : 'hover:bg-surfaceHover text-gray-600 dark:text-gray-400 hover:text-fg'}`}
                style={{ color: filter.onlyFavorites ? '' : 'var(--sidebar-text)' }}
                  title={showIconsOnly ? t('favorites') : ''}
                aria-label="Show favorites only"
              >
                <Star className={`w-4 h-4 shrink-0 ${filter.onlyFavorites ? 'fill-current' : ''}`} />
                <AnimatePresence>
                  {!showIconsOnly && (
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
         {!showIconsOnly && (
            <div className="space-y-1 mb-2">
               {/* Shortcuts removed as requested - they belong in Dashboard */}
            </div>
         )}
        <button 
          onClick={onOpenSettings}
          className={`w-full flex items-center ${showIconsOnly ? 'justify-center' : ''} p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:text-fg hover:bg-surfaceHover transition-all min-h-[44px]`}
          style={{ color: 'var(--sidebar-text)' }}
          title={t('settings')}
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {!showIconsOnly && (
              <motion.span variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="ml-3 whitespace-nowrap">
                {t('settings')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
    </>
  );
};

export default Sidebar;