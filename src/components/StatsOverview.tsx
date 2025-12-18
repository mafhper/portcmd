import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Zap, ShieldCheck } from 'lucide-react';
import { ProcessEntry, ProcessType } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { translations } from '../locales';
import { SystemService } from '../services/systemService';

interface StatsOverviewProps {
  processes: ProcessEntry[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ processes }) => {
  const { settings } = usePreferences();
  const t = translations[settings.language];
  const [lastAuditScore, setLastAuditScore] = useState<number | null>(null);

  useEffect(() => {
    SystemService.getQualityReports().then(reports => {
      if (reports.length > 0) {
        SystemService.getQualityReport(reports[0].filename).then(report => {
          if (report && report.scores) {
            const avg = Object.values(report.scores as Record<string, number>).reduce((a, b) => a + b, 0) / 5;
            setLastAuditScore(Math.round(avg));
          }
        });
      }
    });
  }, []);

  const totalProcesses = processes.length;
  const devProcesses = processes.filter(p => p.type === ProcessType.DEVELOPMENT).length;
  const avgCpu = (processes.reduce((acc, curr) => acc + curr.cpuUsage, 0) / (totalProcesses || 1)).toFixed(1);

  const cards = [
    {
      title: 'Local Services',
      value: totalProcesses,
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      sub: `${devProcesses} dev instances`,
      color: 'from-yellow-500/10 to-orange-500/10',
      border: 'border-yellow-500/20'
    },
    {
      title: 'Build Health',
      value: lastAuditScore !== null ? `${lastAuditScore}%` : '--',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      sub: 'Latest quality score',
      color: 'from-indigo-500/10 to-purple-500/10',
      border: 'border-indigo-500/20'
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
          className={`relative overflow-hidden rounded-xl border transition-all`}
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
            boxShadow: `0 4px 6px -1px rgba(var(--shadow-color), ${Number(settings.shadowIntensity) * 0.1}), 0 2px 4px -1px rgba(var(--shadow-color), ${Number(settings.shadowIntensity) * 0.06})`
          }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-20`} />
          <div className="relative z-10 flex flex-col justify-between h-full p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium uppercase tracking-wider opacity-70" style={{ color: 'var(--muted-foreground)' }}>{card.title}</span>
              <div className="p-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/5">
                {card.icon}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>{card.value}</div>
              <div className="text-xs mt-1 opacity-60" style={{ color: 'var(--muted-foreground)' }}>{card.sub}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
