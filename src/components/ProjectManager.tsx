import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, Play, Square, FileText, Trash, Loader2 } from 'lucide-react';
import { SavedProject } from '../types';
import { SystemService } from '../services/systemService';
import { usePreferences } from '../contexts/PreferencesContext';
import { translations } from '../locales';
import AddProjectModal from './AddProjectModal';

interface ProjectManagerProps {
  onViewLogs: (project: SavedProject) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ onViewLogs }) => {
  const { settings } = usePreferences();
  const t = translations[settings.language];
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    const data = await SystemService.getSavedProjects();
    setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadProjects();
    const interval = setInterval(loadProjects, 2000);
    return () => clearInterval(interval);
  }, [loadProjects]);

  const handleAddProjectConfirm = async (name: string, path: string) => {
    await SystemService.addProject(path, name);
    loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this project?')) {
      await SystemService.removeProject(id);
      loadProjects();
    }
  };

  const runScript = async (project: SavedProject, script: string) => {
    await SystemService.runSavedProjectScript(project.id, script);
    loadProjects();
  };

  const stopProject = async (project: SavedProject) => {
    await SystemService.stopSavedProject(project.id);
    loadProjects();
  };

  return (
    <div className="space-y-6 relative" style={{ color: 'var(--foreground)' }}>
      <AnimatePresence>
        {isAddModalOpen && (
          <AddProjectModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onConfirm={handleAddProjectConfirm} 
          />
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.manageProjects}</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
        >
          <FolderPlus className="w-5 h-5" />
          <span>{t.addProject}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>
      ) : projects.length === 0 ? (
        <div 
          className="text-center p-12 border-2 border-dashed rounded-xl transition-all"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
           <FolderPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
           <p className="opacity-50" style={{ color: 'var(--muted-foreground)' }}>{t.noProjects}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <motion.div 
              key={project.id}
              layout
              className="border rounded-xl p-5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="font-bold text-lg">{project.name}</h3>
                   <p className="text-xs font-mono truncate max-w-[200px] opacity-50" style={{ color: 'var(--muted-foreground)' }}>{project.path}</p>
                 </div>
                 <div className="flex space-x-1">
                   <button 
                     onClick={() => onViewLogs(project)}
                     className="p-2 opacity-50 hover:opacity-100 hover:text-indigo-500 transition-colors"
                     title="View Console"
                    >
                     <FileText className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => handleDelete(project.id)}
                     className="p-2 opacity-50 hover:opacity-100 hover:text-red-500 transition-colors"
                   >
                     <Trash className="w-4 h-4" />
                   </button>
                 </div>
               </div>

               <div className="space-y-2">
                 <div className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--muted-foreground)' }}>{t.scripts}</div>
                 <div className="flex flex-wrap gap-2">
                   {Object.keys(project.scripts).map(script => (
                     <button
                       key={script}
                       onClick={() => project.isRunning && project.activeScript === script ? stopProject(project) : runScript(project, script)}
                       disabled={project.isRunning && project.activeScript !== script}
                       className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-all
                         ${project.isRunning && project.activeScript === script
                            ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                            : 'bg-black/5 dark:bg-white/5 border-zinc-700/30 hover:border-zinc-500 opacity-70 hover:opacity-100'
                         }
                         ${project.isRunning && project.activeScript !== script ? 'opacity-30 cursor-not-allowed' : ''}
                       `}
                       style={{ color: project.isRunning && project.activeScript === script ? '' : 'var(--foreground)' }}
                     >
                       {project.isRunning && project.activeScript === script ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3" />}
                       <span>{script}</span>
                     </button>
                   ))}
                 </div>
               </div>
               
               {project.isRunning && (
                 <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-500">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Running: {project.activeScript}</span>
                 </div>
               )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
