import { ShieldCheck, BarChart2, Activity, GitCommit, Search, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const QualityCore = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 mb-24 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
          <span>{t('qcTag')}</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 mb-6">
          {t('qcTitle')}
        </h2>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          {t('qcSubtitle')}
        </p>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {[
          { icon: ShieldCheck, title: t('qcGates'), desc: t('qcGatesDesc') },
          { icon: BarChart2, title: t('qcLighthouse'), desc: t('qcLighthouseDesc') },
          { icon: Activity, title: t('qcMonitoring'), desc: t('qcMonitoringDesc') },
          { icon: Search, title: t('qcAnalysis'), desc: t('qcAnalysisDesc') },
          { icon: GitCommit, title: t('qcCommits'), desc: t('qcCommitsDesc') },
          { icon: Lock, title: t('qcSecurity'), desc: t('qcSecurityDesc') }
        ].map((feature, i) => (
          <div key={i} className="glass p-8 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-zinc-800 transition-colors border border-zinc-800">
              <feature.icon className="text-cyan-500" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
            <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Open Source Note */}
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl font-bold text-white mb-4">{t('qcOpenSourceTitle')}</h2>
            <p className="text-zinc-400 mb-8">
                {t('qcOpenSourceDesc')}
            </p>
            <a href="https://github.com/mafhper/portcmd" target="_blank" className="inline-flex items-center px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors">
                {t('viewOnGithub')}
            </a>
        </div>
      </div>
    </div>
  );
};

export default QualityCore;
