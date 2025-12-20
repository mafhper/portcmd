import { Terminal, Github, ArrowLeft, Globe, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, Suspense, lazy } from 'react';

// Lazy load pages to reduce initial bundle size
const Home = lazy(() => import('./pages/Home'));
const QualityCore = lazy(() => import('./pages/QualityCore'));
const Updates = lazy(() => import('./pages/Updates'));
const Author = lazy(() => import('./pages/Author'));

const App = () => {
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');

  const appUrl = typeof window !== 'undefined' && window.location.port === '5174' 
    ? 'http://localhost:5173/portcmd/app/' 
    : '/portcmd/app/';

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const renderView = () => {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Loader2 className="animate-spin text-brand-500" size={48} />
        </div>
      }>
        {(() => {
          switch(currentView) {
            case 'quality': return <QualityCore />;
            case 'updates': return <Updates />;
            case 'author': return <Author />;
            default: return <Home />;
          }
        })()}
      </Suspense>
    );
  };

  const NavLink = ({ view, label }: { view: string, label: string }) => (
    <button 
      onClick={() => { setCurrentView(view); window.scrollTo(0, 0); }}
      className={`text-sm font-medium transition-colors ${currentView === view ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen font-sans selection:bg-brand-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight group">
              <button onClick={() => setCurrentView('home')} className="relative bg-brand-500/20 p-1.5 rounded-lg text-brand-500 overflow-hidden group-hover:bg-brand-500 group-hover:text-white transition-colors cursor-pointer" title={t('launchApp')}>
                <Terminal size={20} className="transition-transform duration-300 group-hover:translate-x-full group-hover:opacity-0" />
                <ArrowLeft size={20} className="absolute top-1.5 left-1.5 -translate-x-full opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </button>
              <button 
                onClick={() => setCurrentView('home')} 
                className="group-hover:text-white transition-colors hover:text-brand-500"
              >
                PortCmd
              </button>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6">
               <NavLink view="quality" label={t('qualityCore')} />
               <NavLink view="updates" label={t('updates')} />
               <NavLink view="author" label={t('author')} />
            </div>
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                aria-label="Change Language"
              >
                <Globe size={20} />
              </button>
              
              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 py-1 w-32 bg-zinc-900 border border-white/10 rounded-lg shadow-xl flex flex-col z-50 animate-fade-in-up">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'pt-BR', label: 'Português' },
                      { code: 'es', label: 'Español' }
                    ].map((lang) => (
                      <button 
                        key={lang.code}
                        onClick={() => { changeLanguage(lang.code); setIsLangOpen(false); }}
                        className={`px-4 py-2 text-sm text-left hover:bg-white/5 transition-colors ${i18n.language === lang.code ? 'text-brand-500 font-medium' : 'text-zinc-400'}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <a href="https://github.com/mafhper/portcmd" target="_blank" className="text-zinc-400 hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <a href={appUrl} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all">
              <span className="hidden sm:inline">{t('launchApp')}</span>
              <span className="sm:hidden">{t('launch')}</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="animate-fade-in">
        {renderView()}
      </main>

    </div>
  );
};

export default App;