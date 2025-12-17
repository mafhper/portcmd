import React from 'react';
import { Activity, Cpu, HardDrive, Zap } from 'lucide-react';
import { ProcessEntry, ProcessType } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { translations } from '../locales';

interface StatsOverviewProps {
  processes: ProcessEntry[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ processes }) => {
  const { settings } = usePreferences();
  const t = translations[settings.language];

  const totalProcesses = processes.length;
  const devProcesses = processes.filter(p => p.type === ProcessType.DEVELOPMENT).length;
  const totalMemory = processes.reduce((acc, curr) => acc + curr.memoryUsage, 0).toFixed(0);
  const avgCpu = (processes.reduce((acc, curr) => acc + curr.cpuUsage, 0) / (totalProcesses || 1)).toFixed(1);

  const cards = [
    {
      title: t.activePorts,
      value: totalProcesses,
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      sub: `${devProcesses} ${t.devServers}`,
      color: 'from-yellow-500/10 to-orange-500/10',
      border: 'border-yellow-500/20'
    },
    {
      title: t.memoryUsage,
      value: `${totalMemory} MB`,
      icon: <HardDrive className="w-5 h-5 text-blue-400" />,
      sub: t.totalAllocation,
      color: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/20'
    },
    {
      title: t.avgCpuLoad,
      value: `${avgCpu}%`,
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      sub: t.perProcess,
      color: 'from-emerald-500/10 to-green-500/10',
      border: 'border-emerald-500/20'
    },
    {
      title: t.systemHealth,
      value: t.goodCondition,
      icon: <Activity className="w-5 h-5 text-purple-400" />,
      sub: t.noConflicts,
      color: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/20'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className={`relative overflow-hidden rounded-xl border ${card.border} bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900/80`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-50`} />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{card.title}</span>
              <div className="p-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/5">
                {card.icon}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
              <div className="text-zinc-500 text-xs mt-1">{card.sub}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
