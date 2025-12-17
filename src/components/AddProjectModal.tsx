import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FolderOpen, Type, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { translations } from '../locales';
import { SystemService } from '../services/systemService';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, path: string) => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { settings } = usePreferences();
  const t = translations[settings.language];
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{valid: boolean; error?: string; warning?: string} | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && path) {
      onConfirm(name, path);
      onClose();
      setName('');
      setPath('');
    }
  };

  const handleValidate = async () => {
    if (!path) return;
    setValidating(true);
    setValidationResult(null);
    
    const result = await SystemService.validatePath(path);
    setValidationResult(result);
    setValidating(false);

    if (result.valid && result.name && !name) {
      setName(result.name);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-md bg-[#18181b] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700 bg-zinc-900">
          <h3 className="text-lg font-semibold text-white">{t.addProject}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Path Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="w-3 h-3" />
              {t.projectPath}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value);
                  setValidationResult(null);
                }}
                onBlur={handleValidate}
                placeholder={t.pathPlaceholder}
                className={`flex-1 bg-zinc-900/50 border rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 transition-all
                  ${validationResult?.valid ? 'border-emerald-500/50 focus:ring-emerald-500/20' : 
                    validationResult?.valid === false ? 'border-red-500/50 focus:ring-red-500/20' : 'border-zinc-700 focus:ring-indigo-500/50'}`}
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={validating || !path}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition-colors"
              >
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              </button>
            </div>
            {validationResult?.error && (
               <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {validationResult.error}</p>
            )}
            {validationResult?.valid && (
               <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Path valid</p>
            )}
            <p className="text-[10px] text-zinc-500 italic">* Enter the absolute path to your project folder.</p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-3 h-3" />
              {t.projectName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!name || !path || !validationResult?.valid}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transition-all"
            >
              {t.add}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddProjectModal;
