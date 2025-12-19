import React, { useState, useEffect } from 'react';
import { Play, Loader2, Code2, AlertCircle } from 'lucide-react';
import { SystemService } from '../services/systemService';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ScriptRunnerProps {
  pid: number;
  projectPath: string;
}

const ScriptRunner: React.FC<ScriptRunnerProps> = ({ pid, projectPath }) => {
  const { t } = useTranslation();
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
      <div className="flex items-center space-x-2 text-muted text-xs py-2">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>{t('readingPackage')}</span>
      </div>
    );
  }

  if (error || Object.keys(scripts).length === 0) {
    return (
       <div className="flex items-center space-x-2 text-muted text-xs py-2 italic border border-border rounded bg-surface2 px-2 max-w-fit">
        <AlertCircle className="w-3 h-3" />
        <span>{t('noScripts')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-primary text-xs uppercase font-bold tracking-wider mb-2">
        <Code2 className="w-3 h-3" />
        <span>{t('availableScripts')}</span>
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
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-surface2 border-border text-muted hover:bg-surfaceHover hover:border-borderStrong hover:text-fg'
                }
                ${runningScript !== null && runningScript !== name ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={command}
          >
            {runningScript === name ? (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
            ) : (
                <Play className="w-3 h-3 text-success group-hover:text-success" />
            )}
            <span>{name}</span>
          </motion.button>
        ))}
      </div>
      <div className="text-[10px] text-muted mt-1 font-mono pl-1">
        {t('hoverCommand')}
      </div>
    </div>
  );
};

export default ScriptRunner;
