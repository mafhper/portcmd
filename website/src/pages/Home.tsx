import { Shield, Zap, Download, Layout, Command, Box, Layers, FolderGit2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
const Home = ({ onNavigate }: { onNavigate?: (view: string) => void }) => {
  const { t } = useTranslation();
  
  const appUrl = typeof window !== 'undefined' && window.location.port === '5174' 
    ? 'http://localhost:5173/portcmd/app/' 
    : '/portcmd/app/';

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 hero-gradient overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6" role="status">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span>v1.0 Public Beta Available</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            {t('heroTitle')}<br/>
            <span className="text-white">{t('heroSubtitle')}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('heroDesc')}
          </p>

          <div className="flex flex-col items-center">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button disabled className="px-8 py-4 bg-zinc-800 text-zinc-500 rounded-xl font-semibold flex items-center space-x-2 cursor-not-allowed border border-zinc-700 w-full sm:w-auto justify-center">
                <Download size={20} />
                <span>{t('download')}</span>
              </button>
              <a 
                href={appUrl} 
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 rounded-xl font-semibold flex items-center space-x-2 transition-all hover:scale-105 w-full sm:w-auto justify-center focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Try the demo application"
              >
                <Zap size={20} aria-hidden="true" />
                <span>{t('tryDemo')}</span>
              </a>
            </div>
            <span className="text-xs text-zinc-400 mt-3">{t('platformsComingSoon')}</span>
          </div>
        </div>

        {/* Mockup */}
        <div className="mt-20 max-w-5xl mx-auto glass rounded-xl p-2 shadow-2xl animate-fade-in-up">
          <div className="bg-[#09090b] rounded-lg overflow-hidden border border-white/5 font-sans">
             
             {/* Mock App Header */}
             <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-zinc-900/50">
                <div className="flex space-x-2">
                   <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="text-xs text-zinc-400 font-mono">localhost: dashboard</div>
                <div className="w-16"></div>
             </div>

             {/* Mock App Content */}
             <div className="p-6 md:p-8 space-y-8">
                
                {/* Mock Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { label: 'Active Ports', value: '18', color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'from-yellow-500/10' },
                     { label: 'Memory Usage', value: '2.4 GB', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'from-blue-500/10' },
                     { label: 'CPU Load', value: '23%', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'from-emerald-500/10' },
                     { label: 'Health', value: 'Stable', color: 'text-purple-400', border: 'border-purple-500/20', bg: 'from-purple-500/10' },
                   ].map((stat, i) => (
                     <div key={i} className={`relative overflow-hidden rounded-xl border ${stat.border} bg-zinc-900/50 p-4`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent opacity-50`} />
                        <div className="relative z-10">
                           <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                           <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Mock Table */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                   <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Processes</div>
                      <div className="flex space-x-2">
                         <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                         <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                      </div>
                   </div>
                   <div className="divide-y divide-zinc-800/50">
                      {[
                        { port: '3000', name: 'react-frontend', pid: '18442', type: 'Development', status: 'Running', color: 'text-emerald-400' },
                        { port: '5432', name: 'postgres-db', pid: '4421', type: 'Database', status: 'Running', color: 'text-blue-400' },
                        { port: '6379', name: 'redis-cache', pid: '9921', type: 'System', status: 'Running', color: 'text-zinc-400' },
                        { port: '8080', name: 'api-gateway', pid: '10234', type: 'System', status: 'Running', color: 'text-purple-400' },
                        { port: '9000', name: 'minio-storage', pid: '5567', type: 'System', status: 'Stopped', color: 'text-red-400' },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center px-6 py-4 text-sm hover:bg-white/5 transition-colors cursor-default">
                           <div className="w-24 font-mono font-bold text-brand-400">{row.port}</div>
                           <div className="flex-1 font-medium text-zinc-300">{row.name}</div>
                           <div className="w-20 font-mono text-zinc-400 hidden sm:block">{row.pid}</div>
                           <div className="w-32 hidden sm:block"><span className={`text-xs px-2 py-1 rounded-full bg-white/5 border border-white/5 ${row.color}`}>{row.type}</span></div>
                           <div className="w-24 flex items-center space-x-2 text-zinc-400">
                              <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                              <span className="hidden sm:inline">{row.status}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

             </div>
          </div>
        </div>
      </section>

      {/* App Functions */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('appFunctions')}</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { icon: Box, title: t('appFunc1'), desc: t('appFunc1Desc'), color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                    { icon: Layers, title: t('appFunc2'), desc: t('appFunc2Desc'), color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    { icon: FolderGit2, title: t('appFunc3'), desc: t('appFunc3Desc'), color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
                ].map((func, i) => (
                    <div key={i} className={`p-8 rounded-3xl border ${func.border} ${func.bg} hover:scale-105 transition-transform duration-300`}>
                        <func.icon className={`w-12 h-12 ${func.color} mb-6`} />
                        <h3 className="text-xl font-bold text-white mb-3">{func.title}</h3>
                        <p className="text-zinc-400">{func.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: t('featureSafe'), desc: t('featureSafeDesc') },
            { icon: Layout, title: t('featureModern'), desc: t('featureModernDesc') },
            { icon: Command, title: t('featureDev'), desc: t('featureDevDesc') }
          ].map((feature, i) => (
            <div key={i} className="glass p-8 rounded-2xl hover:bg-white/5 transition-colors group">
              <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-zinc-800">
                <feature.icon className="text-brand-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>



      {/* Quality Core Promo */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-purple-900/20" />
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
                    <span>{t('qcTag')}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">{t('qcPromoTitle')}</h2>
                <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
                    {t('qcPromoDesc')}
                </p>
                <button onClick={() => onNavigate && onNavigate('quality')} className="inline-flex items-center space-x-2 text-cyan-400 font-bold hover:text-cyan-300 transition-colors group py-3 pr-4 min-h-[48px]">
                    <span>{t('qcPromoButton')}</span>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            <div className="flex-1 w-full relative">
                 <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
                 <div className="glass p-8 rounded-3xl border border-white/10 relative z-10 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <Shield size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-zinc-400">Quality Status</div>
                            <div className="text-xl font-bold text-white">Passing</div>
                        </div>
                        <div className="ml-auto flex gap-1">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-75" />
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Security Scan', status: 'Secure', color: 'text-emerald-400' },
                            { label: 'Performance', status: '98/100', color: 'text-emerald-400' },
                            { label: 'Maintainability', status: 'A+', color: 'text-emerald-400' },
                        ].map((item, i) => (
                             <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                <span className="text-zinc-400">{item.label}</span>
                                <span className={`font-mono font-bold ${item.color}`}>{item.status}</span>
                             </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 text-center text-zinc-400 text-sm">
        <p>&copy; {new Date().getFullYear()} {t('footerRights')}</p>
      </footer>
    </>
  );
};

export default Home;
