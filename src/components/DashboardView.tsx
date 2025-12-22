import React from 'react';
import { Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PortTable from './PortTable';
import { ProcessEntry } from '../types';

interface DashboardViewProps {
  processes: ProcessEntry[];
  filteredProcesses: ProcessEntry[];
  loading: boolean;
  onKill: (pid: number) => void;
  onRestart: (pid: number, managedById?: string) => void;
  onToggleFavorite: (pid: number) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  processes,
  filteredProcesses,
  loading,
  onKill,
  onRestart,
  onToggleFavorite
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
             <Filter className="w-5 h-5 text-indigo-500" />
             {t('activeProcesses')}
             <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono">
                {filteredProcesses.length}
             </span>
          </h2>
       </div>
       <PortTable 
          processes={filteredProcesses} 
          totalProcessesCount={processes.length}
          onKill={onKill}
          onRestart={onRestart}
          onToggleFavorite={onToggleFavorite}
          isLoading={loading}
       />
    </div>
  );
};

export default DashboardView;
