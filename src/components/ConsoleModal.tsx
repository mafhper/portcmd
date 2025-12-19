import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Terminal } from 'lucide-react';
import { SavedProject, LogEntry } from '../types';
import { SystemService } from '../services/systemService';
import { useTranslation } from 'react-i18next';

interface ConsoleModalProps {
  project: SavedProject | null;
  onClose: () => void;
}

const ConsoleModal: React.FC<ConsoleModalProps> = ({ project, onClose }) => {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(project);

  // Handle scroll events to enable/disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Check if user is near bottom (within 50px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isNearBottom);
  };

  // Effect removed: syncing state from props handled by key={} in parent
  // If project prop changes, we still update specific fields if needed, 
  // but better to rely on parent unmount/mount or simpler logic.
  // Sync state from props (Render-cycle update pattern)
  if (project && project.id !== currentProject?.id) {
     setCurrentProject(project);
     setShouldAutoScroll(true);
  }

  useEffect(() => {
    if (!project) return;
    const interval = setInterval(async () => {
      const updated = await SystemService.getProject(project.id);
      if (updated) setCurrentProject(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [project]);

  useEffect(() => {
    if (shouldAutoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentProject?.logs, shouldAutoScroll]);

  if (!currentProject) return null;

  // Utility to remove ANSI escape codes
  // eslint-disable-next-line no-control-regex
  const stripAnsi = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

  const downloadLogs = () => {
    const md = `# Console Logs - ${currentProject.name}\nGenerated at ${new Date().toLocaleString()}\n\n` + 
      currentProject.logs.map((l: LogEntry) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${stripAnsi(l.message)}`).join('\n\n');
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}-logs.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
       <motion.div 
         initial={{ scale: 0.9 }} animate={{ scale: 1 }}
         className="relative w-full max-w-4xl border rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
         style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--foreground)' }}
       >
         <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(0,0,0,0.05)' }}>
           <div className="flex items-center space-x-2 opacity-80">
             <Terminal className="w-5 h-5" />
             <span className="font-mono font-bold">{currentProject.name}</span>
           </div>
           <div className="flex items-center space-x-2">
             <button onClick={downloadLogs} className="flex items-center space-x-2 px-3 py-1.5 text-xs bg-primary hover:bg-primaryHover text-primaryFg rounded transition-colors shadow-lg shadow-primary/20">
               <Download className="w-3 h-3" />
               <span>{t('saveLogs')}</span>
             </button>
              <button onClick={() => {
                  if(currentProject) SystemService.clearProjectLogs(currentProject.id).then(() => {
                      if(currentProject) setCurrentProject({...currentProject, logs: []});
                  });
              }} className="flex items-center space-x-2 px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors border border-red-500/20">
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
              <button onClick={onClose} aria-label="Close console" className="p-1 text-muted hover:text-fg transition-colors"><X className="w-5 h-5" /></button>
           </div>
         </div>

         <div 
           ref={scrollRef}
           onScroll={handleScroll}
           className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1 custom-scrollbar bg-[#0d1117] text-zinc-300"
         >
           {currentProject.logs.length === 0 ? (
             <div className="text-zinc-600 italic text-center mt-10">No output generated yet.</div>
           ) : (
             currentProject.logs.map((log: LogEntry, i: number) => (
               <div key={i} className="flex space-x-2 border-b border-white/5 pb-0.5 mb-0.5">
                 <span className="text-zinc-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                 <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-zinc-300'}>
                   {stripAnsi(log.message)}
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