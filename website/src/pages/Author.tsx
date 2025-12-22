import { Github, Twitter, Globe, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Author = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      
      {/* Profile Card */}
      <div className="glass p-8 md:p-12 rounded-3xl border border-white/5 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-cyan-400 to-purple-500 mb-6">
                <img 
                    src="https://github.com/mafhper.png" 
                    alt="mafhper" 
                    className="w-full h-full rounded-full bg-black border-4 border-black object-cover"
                />
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-2">mafhper</h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-md">
                {t('authorRole')}
            </p>

            <div className="flex items-center gap-4">
                <a href="https://github.com/mafhper" target="_blank" className="p-3 min-w-[44px] min-h-[44px] bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white cursor-pointer flex items-center justify-center">
                    <Github size={24} />
                </a>
                <a href="#" className="p-3 min-w-[44px] min-h-[44px] bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white cursor-pointer flex items-center justify-center">
                    <Twitter size={24} />
                </a>
                <a href="https://mafhper.github.io/personal-news" target="_blank" className="p-3 min-w-[44px] min-h-[44px] bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white cursor-pointer flex items-center justify-center">
                    <Globe size={24} />
                </a>
            </div>
        </div>
      </div>

      {/* Featured Project: AuraWall */}
      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <a href="https://mafhper.github.io/aurawall/" target="_blank" className="glass p-8 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group cursor-pointer block">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{t('wallTitle')}</h3>
                <ArrowUpRight className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-zinc-400 mb-6">
                {t('wallDesc')}
            </p>
            <div className="inline-flex text-xs font-mono text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded">
                {t('visitSite')}
            </div>
        </a>

        <div className="glass p-8 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
            <h3 className="text-xl font-bold text-white mb-4">{t('contact')}</h3>
            <p className="text-zinc-400 mb-6">
                {t('contactDesc')}
            </p>
            <a href="mailto:contact@example.com" className="text-cyan-400 hover:underline">
                {t('touch')} &rarr;
            </a>
        </div>
      </div>

    </div>
  );
};

export default Author;
