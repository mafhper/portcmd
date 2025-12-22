import { useState, useEffect } from 'react';
import { GitCommit, Calendar, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

const Updates = () => {
  const { t } = useTranslation();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/mafhper/portcmd/commits?per_page=10');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCommits(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">{t('updatesDesc')}</h2>
        <p className="text-zinc-400">{t('updatesDesc')}</p>
      </div>

      {loading ? (
        <div className="space-y-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-32"></div>
            ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {t('failedUpdates')}
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-700 before:to-transparent">
          {commits.map((commit) => (
            <div key={commit.sha} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-700 bg-zinc-900 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/50 transition-colors shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <GitCommit size={20} className="text-zinc-400 group-hover:text-cyan-400" />
              </div>

              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {commit.sha.substring(0, 7)}
                    </span>
                    <div className="flex items-center text-xs text-zinc-500">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(commit.commit.author.date)}
                    </div>
                </div>
                <h3 className="text-lg font-medium text-white mb-2 leading-tight">
                    {commit.commit.message.split('\n')[0]}
                </h3>
                <div className="text-sm text-zinc-400 flex items-center justify-between mt-4 border-t border-white/5 pt-3">
                    <span>{commit.commit.author.name}</span>
                    <a href={commit.html_url} target="_blank" className="flex items-center hover:text-cyan-400 transition-colors">
                        View <ExternalLink size={12} className="ml-1" />
                    </a>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Updates;
