import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Terminal } from 'lucide-react';
import { SavedProject, LogEntry } from '../types';
import { SystemService } from '../services/systemService';
import { translations } from '../locales';
import { usePreferences } from '../contexts/PreferencesContext';

interface ConsoleModalProps {
  project: SavedProject | null;
  onClose: () => void;
}

const ConsoleModal: React.FC<ConsoleModalProps> = ({ project, onClose }) => {
  const { settings } = usePreferences();
  const t = translations[settings.language];
  const endRef = useRef<HTMLDivElement>(null);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(project);

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const interval = setInterval(async () => {
      const updated = await SystemService.getProject(project.id);
      if (updated) setCurrentProject(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [project]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentProject?.logs]);

  if (!currentProject) return null;

  const downloadLogs = () => {
    const md = `# Console Logs - ${currentProject.name}\nGenerated at ${new Date().toLocaleString()}\n\n` + 
      currentProject.logs.map((l: LogEntry) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n\n');
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}-logs.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
       <motion.div 
         initial={{ scale: 0.9 }} animate={{ scale: 1 }}
         className="relative w-full max-w-4xl bg-[#0d1117] border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
       >
         <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-900">
           <div className="flex items-center space-x-2 text-zinc-300">
             <Terminal className="w-5 h-5" />
             <span className="font-mono font-bold">{currentProject.name}</span>
           </div>
           <div className="flex items-center space-x-2">
             <button onClick={downloadLogs} className="flex items-center space-x-2 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors">
               <Download className="w-3 h-3" />
               <span>{t.saveLogs}</span>
             </button>
             <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
           </div>
         </div>

         <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1 custom-scrollbar bg-black/50">
           {currentProject.logs.length === 0 ? (
             <div className="text-zinc-600 italic text-center mt-10">No output generated yet.</div>
           ) : (
             currentProject.logs.map((log: LogEntry, i: number) => (
               <div key={i} className="flex space-x-2 border-b border-white/5 pb-0.5 mb-0.5">
                 <span className="text-zinc-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                 <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-zinc-300'}>
                   {log.message}
                 </span>
               </div>
             ))
           )}
           <div ref={endRef} />
         </div>
       </motion.div>
    </div>
  );
};

export default ConsoleModal;