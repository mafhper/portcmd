import React, { useState, useEffect } from 'react';
import { Play, Loader2, Code2, AlertCircle } from 'lucide-react';
import { SystemService } from '../services/systemService';
import { motion } from 'framer-motion';
import { usePreferences } from '../contexts/PreferencesContext';
import { translations } from '../locales';

interface ScriptRunnerProps {
  pid: number;
  projectPath: string;
}

const ScriptRunner: React.FC<ScriptRunnerProps> = ({ pid, projectPath }) => {
  const { settings } = usePreferences();
  const t = translations[settings.language];
  const [scripts, setScripts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [runningScript, setRunningScript] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadScripts = async () => {
      setLoading(true);
      try {
        const data = await SystemService.getProjectScripts(pid);
        if (mounted) {
            setScripts(data);
            if (Object.keys(data).length === 0) setError(true);
        }
      } catch (err) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (projectPath) {
      loadScripts();
    } else {
        setError(true);
    }

    return () => { mounted = false; };
  }, [pid, projectPath]);

  const handleRunScript = async (scriptName: string) => {
    setRunningScript(scriptName);
    try {
      await SystemService.runProjectScript(pid, scriptName);
      // In a real app, we might show a toast here
    } finally {
      setRunningScript(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-zinc-500 text-xs py-2">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>{t.readingPackage}</span>
      </div>
    );
  }

  if (error || Object.keys(scripts).length === 0) {
    return (
       <div className="flex items-center space-x-2 text-zinc-600 text-xs py-2 italic border border-zinc-800/50 rounded bg-zinc-900/20 px-2 max-w-fit">
        <AlertCircle className="w-3 h-3" />
        <span>{t.noScripts}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-indigo-400 text-xs uppercase font-bold tracking-wider mb-2">
        <Code2 className="w-3 h-3" />
        <span>{t.availableScripts}</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Object.entries(scripts).map(([name, command]) => (
          <motion.button
            key={name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRunScript(name)}
            disabled={runningScript !== null}
            className={`
                group flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-all
                ${runningScript === name 
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600'
                }
                ${runningScript !== null && runningScript !== name ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={command}
          >
            {runningScript === name ? (
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            ) : (
                <Play className="w-3 h-3 text-emerald-500 group-hover:text-emerald-400" />
            )}
            <span>{name}</span>
          </motion.button>
        ))}
      </div>
      <div className="text-[10px] text-zinc-600 mt-1 font-mono pl-1">
        {t.hoverCommand}
      </div>
    </div>
  );
};

export default ScriptRunner;
