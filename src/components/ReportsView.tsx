import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Shield, Clock, ChevronRight, X } from 'lucide-react';
import { SystemService } from '../services/systemService';
import { motion, AnimatePresence } from 'framer-motion';

const ReportsView: React.FC = () => {
  const [qualityReports, setQualityReports] = useState<{ filename: string; timestamp: string }[]>([]);
  const [systemLogs, setSystemLogs] = useState<{ filename: string; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<{ filename: string; html: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [qData, sData] = await Promise.all([
      SystemService.getQualityReports(),
      SystemService.getSystemLogs()
    ]);
    setQualityReports(qData);
    setSystemLogs(sData);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadData();
  }, [loadData]);

  const handleViewLog = async (filename: string) => {
    const data = await SystemService.getSystemLog(filename);
    if (data) {
      setSelectedLog({ filename, html: data.html });
    }
  };

  const handleViewQuality = async (filename: string) => {
    // Quality reports are JSON, we can show them or redirect to the markdown version if exists
    // For now, let's look for the matching .md file in system logs
    const mdFilename = filename.replace('.json', '.md');
    if (systemLogs.some(l => l.filename === mdFilename)) {
      handleViewLog(mdFilename);
    } else {
      // Fallback: show raw JSON in a modal (simplified)
      const data = await SystemService.getQualityReport(filename);
      setSelectedLog({ 
        filename, 
        html: `<pre style="font-size: 12px; color: #a3a3a3; background: #000; padding: 20px; border-radius: 8px;">${JSON.stringify(data, null, 2)}</pre>` 
      });
    }
  };

  return (
    <div className="space-y-8" style={{ color: 'var(--foreground)' }}>
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <FileText className="text-indigo-500" />
          Reports & Logs
        </h2>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all border"
          style={{ borderColor: 'var(--border-color)' }}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Quality Core Reports */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-50">
            <Shield size={16} />
            Quality Scans
          </div>
          
          <div className="space-y-2">
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/5" />)}
              </div>
            ) : qualityReports.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-xl opacity-30" style={{ borderColor: 'var(--border-color)' }}>
                No quality reports found.
              </div>
            ) : (
              qualityReports.map(report => (
                <div 
                  key={report.filename}
                  onClick={() => handleViewQuality(report.filename)}
                  className="p-4 rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group flex items-center justify-between"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                      <Shield size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{report.filename}</div>
                      <div className="text-xs opacity-50 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(report.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                </div>
              ))
            )}
          </div>
        </section>

        {/* System Logs */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-50">
            <FileText size={16} />
            Audit Logs
          </div>
          
          <div className="space-y-2">
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/5" />)}
              </div>
            ) : systemLogs.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-xl opacity-30" style={{ borderColor: 'var(--border-color)' }}>
                No system logs found.
              </div>
            ) : (
              systemLogs.map(log => (
                <div 
                  key={log.filename}
                  onClick={() => handleViewLog(log.filename)}
                  className="p-4 rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group flex items-center justify-between"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{log.filename}</div>
                      <div className="text-xs opacity-50 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Log Detail Modal (WindowConsole Style) */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl h-full max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b bg-black/10" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1.5 mr-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest opacity-70 flex items-center gap-2">
                    <FileText size={14} />
                    {selectedLog.filename}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-8 md:p-12 prose prose-invert max-w-none custom-scrollbar bg-[#0d1117]/50">
                {/* We use dangerouslySetInnerHTML for the converted Markdown */}
                <div 
                  className="report-content"
                  dangerouslySetInnerHTML={{ __html: selectedLog.html }} 
                />
              </div>

              <div className="px-6 py-4 border-t bg-black/10 flex justify-end gap-3" style={{ borderColor: 'var(--border-color)' }}>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .report-content {
          color: #e4e4e7;
          font-size: 14px;
          line-height: 1.6;
        }
        .report-content h1 { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; }
        .report-content h2 { font-size: 20px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; color: #fff; }
        .report-content h3 { font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; color: #d4d4d8; }
        .report-content p { margin-bottom: 16px; }
        .report-content ul { list-style-type: disc; padding-left: 24px; margin-bottom: 16px; }
        .report-content li { margin-bottom: 8px; }
        .report-content table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
        .report-content th, .report-content td { padding: 12px; text-align: left; border: 1px solid rgba(255,255,255,0.1); }
        .report-content th { background: rgba(255,255,255,0.05); color: #fff; }
        .report-content code { background: rgba(255,255,255,0.1); padding: 2px 4px; rounded: 4px; font-family: monospace; }
        .report-content blockquote { border-left: 4px solid #6366f1; padding-left: 16px; font-style: italic; color: #a1a1aa; }
      `}</style>

    </div>
  );
};

export default ReportsView;