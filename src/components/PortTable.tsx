import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Star, Globe, Code, Database, Server, Cpu, MoreHorizontal, Copy, ShieldAlert, FolderOpen, ArrowUp, ArrowDown, ArrowUpDown, ChevronRight, ChevronDown, Layers, Box } from 'lucide-react';
import { ProcessEntry, ProcessType, ProcessStatus } from '../types';
import ScriptRunner from './ScriptRunner';
import { useTranslation } from 'react-i18next';

interface PortTableProps {
  processes: ProcessEntry[];
  totalProcessesCount: number;
  onKill: (pid: number) => void;
  onRestart: (pid: number, managedById?: string) => void;
  onToggleFavorite: (pid: number) => void;
  isLoading: boolean;
}

const getTypeIcon = (type: ProcessType) => {
  switch (type) {
    case ProcessType.DEVELOPMENT: return <Code className="w-4 h-4 text-emerald-400" />;
    case ProcessType.DATABASE: return <Database className="w-4 h-4 text-blue-400" />;
    case ProcessType.SYSTEM: return <Server className="w-4 h-4 text-zinc-400" />;
    case ProcessType.OTHER: return <Cpu className="w-4 h-4 text-purple-400" />;
  }
};

const getTypeStyles = (type: ProcessType) => {
  switch (type) {
    case ProcessType.DEVELOPMENT: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case ProcessType.DATABASE: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case ProcessType.SYSTEM: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    case ProcessType.OTHER: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }
};

type SortKey = keyof ProcessEntry | 'status';

const PortTable: React.FC<PortTableProps> = ({ processes, totalProcessesCount, onKill, onRestart, onToggleFavorite, isLoading }) => {
  const { t } = useTranslation();
  const [expandedPid, setExpandedPid] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const toggleExpand = (pid: number) => {
    setExpandedPid(expandedPid === pid ? null : pid);
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const groupedProcesses = useMemo(() => {
    const groups: Record<string, ProcessEntry[]> = { standalone: [] };
    
    // Sort first if needed
    const procList = [...processes];
    if (sortConfig) {
      procList.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === bValue) return 0;
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
           const comparison = aValue.localeCompare(bValue);
           return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        const comparison = aValue > bValue ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    // Grouping
    procList.forEach(p => {
      if (p.managedById) {
        if (!groups[p.managedById]) groups[p.managedById] = [];
        groups[p.managedById].push(p);
      } else if (p.projectPath) {
        const key = `path:${p.projectPath}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      } else {
        groups.standalone.push(p);
      }
    });

    return groups;
  }, [processes, sortConfig]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-primary" /> 
      : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const renderHeader = (label: string, key: SortKey, className = "") => (
    <th 
      className={`px-4 py-3 cursor-pointer select-none group hover:bg-surfaceHover transition-colors text-muted ${className}`}
      onClick={() => handleSort(key)}
    >
      <div className={`flex items-center gap-2 ${className.includes('text-right') ? 'justify-end' : ''}`}>
        {label}
        <SortIcon column={key} />
      </div>
    </th>
  );

    const renderRow = (proc: ProcessEntry, isChild = false) => (

      <React.Fragment key={proc.pid}>

        <motion.tr

          layout

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          exit={{ opacity: 0 }}

          onClick={() => toggleExpand(proc.pid)}

          className={`group cursor-pointer transition-colors hover:bg-surfaceHover ${

            expandedPid === proc.pid ? 'bg-surfaceHover' : ''

          } ${isChild ? 'bg-surfaceHover' : ''}`}

          style={{ color: 'var(--foreground)' }}

        >

          <td className={`px-6 py-4 font-mono font-bold whitespace-nowrap align-middle ${isChild ? 'pl-10 opacity-70' : ''}`}>

             <div className="flex items-center gap-2">

               {isChild && <div className="w-2 h-[1px] opacity-20" style={{ backgroundColor: 'var(--foreground)' }} />}

               <span className="text-indigo-500 dark:text-indigo-400">{proc.port}</span>

             </div>

          </td>

  

          <td className="px-6 py-4 align-middle">

            <div className="flex items-center space-x-3 max-w-[250px]">

              <div className={`p-2 rounded-lg border ${getTypeStyles(proc.type)} bg-opacity-10 shrink-0`}>

                {getTypeIcon(proc.type)}

              </div>

              <div className="min-w-0 overflow-hidden">

                <div className="font-medium truncate" title={proc.name}>{proc.name}</div>

                <div className="text-xs font-mono truncate opacity-60" style={{ color: 'var(--muted-foreground)' }} title={proc.user}>{proc.user}</div>

              </div>

            </div>

          </td>

  

          <td className="px-6 py-4 whitespace-nowrap align-middle">

            <span className="font-mono text-xs px-2 py-1 bg-surface2 rounded border border-border text-muted">

              {proc.pid}

            </span>

          </td>

  

          <td className="px-6 py-4 whitespace-nowrap align-middle">

            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border max-w-full ${getTypeStyles(proc.type)}`}>

              <span className="truncate">{t(proc.type)}</span>

            </span>

          </td>

  

          <td className="px-6 py-4 whitespace-nowrap align-middle">

            <div className="flex items-center space-x-2">

              <span className="relative flex h-2 w-2 shrink-0">

                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${proc.status === ProcessStatus.RUNNING ? 'bg-green-400' : 'bg-yellow-400'}`}></span>

                <span className={`relative inline-flex rounded-full h-2 w-2 ${proc.status === ProcessStatus.RUNNING ? 'bg-green-500' : 'bg-yellow-500'}`}></span>

              </span>

              <span className="opacity-70 truncate">{t(proc.status)}</span>

            </div>

          </td>

  

          <td className="px-6 py-4 text-right whitespace-nowrap align-middle">

            <div className="flex justify-end items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">

              <button

                onClick={(e) => { e.stopPropagation(); onToggleFavorite(proc.pid); }}

                className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${proc.isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100'}`}

                title="Favorite"
                aria-label={proc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}

              >

                <Star className={`w-4 h-4 ${proc.isFavorite ? 'fill-current' : ''}`} />

              </button>

              <button

                onClick={(e) => { e.stopPropagation(); toggleExpand(proc.pid); }}

                className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Show more options"

              >

                <MoreHorizontal className="w-4 h-4" />

              </button>

            </div>

          </td>

        </motion.tr>

  

        <AnimatePresence>

          {expandedPid === proc.pid && (

            <tr style={{ backgroundColor: 'rgba(var(--shadow-color), 0.02)' }}>

              <td colSpan={6} className="p-0 border-b" style={{ borderColor: 'var(--border-color)' }}>

                <motion.div

                  initial={{ height: 0, opacity: 0 }}

                  animate={{ height: 'auto', opacity: 1 }}

                  exit={{ height: 0, opacity: 0 }}

                  className="overflow-hidden"

                >

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                    <div className="space-y-6 min-w-0">

                      <div>

                        <label className="text-xs uppercase tracking-wider font-semibold opacity-50">{t('addressNetwork')}</label>

                        <div className="mt-1 flex items-center space-x-2 text-sm opacity-80">

                          <Globe className="w-4 h-4 opacity-50" />

                          <span className="font-mono">{proc.address}:{proc.port}</span>

                        </div>

                      </div>

                      

                      {proc.projectPath && (

                        <div className="min-w-0">

                          <label className="text-xs uppercase tracking-wider font-semibold opacity-50">{t('projectSource')}</label>

                          <div className="mt-1 flex items-center space-x-2 text-sm font-mono opacity-70" title={proc.projectPath}>

                            <FolderOpen className="w-3.5 h-3.5 shrink-0" />

                            <span className="truncate">{proc.projectPath}</span>

                          </div>

                        </div>

                      )}

  

                      {proc.type === ProcessType.DEVELOPMENT && proc.projectPath && (

                        <ScriptRunner pid={proc.pid} projectPath={proc.projectPath} />

                      )}

  

                      {!proc.projectPath && (

                        <div className="min-w-0">

                          <label className="text-xs uppercase tracking-wider font-semibold opacity-50">{t('commandLine')}</label>

                          <div className="mt-1 flex items-center justify-between p-3 bg-surface2 border border-border rounded-md font-mono text-xs text-muted group">

                            <span className="truncate">{proc.commandLine || t('na')}</span>

                            <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-2" aria-label="Copy command line">

                              <Copy className="w-3 h-3 hover:opacity-100" />

                            </button>

                          </div>

                        </div>

                      )}

                    </div>

  

                    <div className="space-y-4 flex flex-col md:items-end">

                      <div className="flex space-x-6 md:text-right">

                        <div>

                          <div className="text-xs uppercase opacity-50">{t('memory')}</div>

                          <div className="text-sm font-mono opacity-80">{proc.memoryUsage} MB</div>

                        </div>

                        <div>

                          <div className="text-xs uppercase opacity-50">{t('cpu')}</div>

                          <div className="text-sm font-mono opacity-80">{proc.cpuUsage}%</div>

                        </div>

                      </div>

  

                      <div className="flex space-x-3 pt-2">

                        {proc.type === ProcessType.DEVELOPMENT && (

                          <button

                            onClick={() => onRestart(proc.pid, proc.managedById)}

                            className="flex items-center space-x-2 px-4 py-2 bg-surface2 hover:bg-surfaceHover text-sm font-medium rounded-lg transition-colors border border-border"


                          >

                            <RotateCw className="w-4 h-4" />

                            <span>{t('restart')}</span>

                          </button>

                        )}

                        <button

                          onClick={() => onKill(proc.pid)}

                          className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-500/20"

                        >

                          <ShieldAlert className="w-4 h-4" />

                          <span>{t('killProcess')}</span>

                        </button>

                      </div>

                    </div>

                  </div>

                </motion.div>

              </td>

            </tr>

          )}

        </AnimatePresence>

      </React.Fragment>

    );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500 space-y-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-sm animate-pulse">{t('scanning')}</p>
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <Server className="w-12 h-12 mb-3 opacity-20" />
        <p>{totalProcessesCount > 0 ? "No processes match your filter. Try switching to 'All'." : t('noActiveProcesses')}</p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl border backdrop-blur-sm shadow-inner overflow-hidden flex flex-col transition-all"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="border-b border-border bg-surface2 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10 text-muted">
            <tr>
              {renderHeader(t('port'), 'port', 'px-6')}
              {renderHeader(t('process'), 'name', 'px-6')}
              {renderHeader(t('pid'), 'pid', 'px-6')}
              {renderHeader(t('type'), 'type', 'px-6')}
              {renderHeader(t('status'), 'status', 'px-6')}
              <th className="px-6 py-3 text-right text-muted">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {Object.entries(groupedProcesses).map(([groupId, groupItems]) => {
              if (groupId === 'standalone') {
                return groupItems.map(p => renderRow(p));
              }

              const isCollapsed = collapsedGroups.has(groupId);
              const totalMem = groupItems.reduce((acc, curr) => acc + curr.memoryUsage, 0);
              const totalCpu = groupItems.reduce((acc, curr) => acc + curr.cpuUsage, 0);
              const projectName = groupItems[0]?.projectPath 
                  ? groupItems[0].projectPath.split(/[/\\]/).pop() 
                  : 'Unknown Project';
              const isManaged = !!groupItems[0].managedById;
              const displayName = isManaged ? groupItems[0].name : (projectName || 'Project Group');

              return (
                <React.Fragment key={groupId}>
                  <tr 
                    className="cursor-pointer border-b transition-colors"
                    style={{ backgroundColor: 'rgba(var(--shadow-color), 0.05)', borderColor: 'var(--border-color)' }}
                    onClick={() => toggleGroup(groupId)}
                  >
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex items-center justify-between" style={{ color: 'var(--foreground)' }}>
                        <div className="flex items-center gap-3">
                           {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                           <div className="flex items-center gap-2 font-semibold">
                             {isManaged ? <Layers className="w-4 h-4 text-indigo-400" /> : <Box className="w-4 h-4 text-emerald-400" />}
                             <span>{displayName}</span>
                           </div>
                           <span className="px-2 py-0.5 rounded-full bg-surfaceHover text-xs text-muted">
                             {groupItems.length} processes
                           </span>
                        </div>
                        <div className="flex items-center gap-6 text-xs font-mono opacity-50 mr-4">
                           <span>MEM: {totalMem} MB</span>
                           <span>CPU: {totalCpu.toFixed(1)}%</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {!isCollapsed && groupItems.map(p => renderRow(p, true))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortTable;