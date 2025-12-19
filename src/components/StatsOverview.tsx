import React from 'react';
import { Zap, Cpu, Activity, Server } from 'lucide-react';
import { ProcessEntry } from '../types';
import { useTranslation } from 'react-i18next';

interface StatsOverviewProps {
  processes: ProcessEntry[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ processes }) => {
  const { t } = useTranslation();
  const totalProcesses = processes.length;
  const devProcesses = processes.filter(p => p.type === 'Development').length;
  const dbProcesses = processes.filter(p => p.type === 'Database').length;
  const avgCpu = (processes.reduce((acc, curr) => acc + curr.cpuUsage, 0) / (totalProcesses || 1)).toFixed(1);
  const totalMemory = processes.reduce((acc, curr) => acc + curr.memoryUsage, 0);

  const stats = [
    { 
      title: t('activePorts'), 
      value: totalProcesses, 
      sub: t('devServers'), 
      icon: <Zap size={16} className="text-yellow-400" />,
      color: 'from-yellow-500/10 to-orange-500/10',
      borderColor: 'border-yellow-500/20'
    },
    { 
      title: t('avgCpuLoad'), 
      value: `${avgCpu}%`, 
      sub: t('perProcess'), 
      icon: <Cpu size={16} className="text-indigo-400" />,
      color: 'from-indigo-500/10 to-purple-500/10',
      borderColor: 'border-indigo-500/20'
    },
    { 
      title: t('memoryUsage'), 
      value: `${totalMemory} MB`, 
      sub: t('totalAllocation'), 
      icon: <Activity size={16} className="text-emerald-400" />,
      color: 'from-emerald-500/10 to-teal-500/10',
      borderColor: 'border-emerald-500/20'
    },
    { 
      title: t('systemHealth'), 
      value: `${devProcesses}/${dbProcesses}`, 
      sub: 'Dev / DB', 
      icon: <Server size={16} className="text-purple-400" />,
      color: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((card, i) => (
        <div 
          key={i} 
          className={`p-5 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${card.color} ${card.borderColor} transition-all hover:scale-[1.02] hover:shadow-lg`}
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{card.title}</span>
            <div className="p-1.5 bg-black/10 dark:bg-white/10 rounded-lg">
              {card.icon}
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight mb-0.5">{card.value}</div>
          <div className="text-xs opacity-50">{card.sub}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
