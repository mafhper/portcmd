import React from 'react';
import { Terminal, Shield, Zap, Download, Layout, Github, ArrowLeft, Activity, Command } from 'lucide-react';

const App = () => {
  const appUrl = typeof window !== 'undefined' && window.location.port === '5174' 
    ? 'http://localhost:5173/portcmd/app/' 
    : '/portcmd/app/';

  return (
    <div className="min-h-screen font-sans selection:bg-brand-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo with Hover Effect */}
          <a href="/portcmd/" className="flex items-center gap-2 font-bold text-xl tracking-tight group">
            <div className="relative bg-brand-500/20 p-1.5 rounded-lg text-brand-500 overflow-hidden group-hover:bg-brand-500 group-hover:text-white transition-colors">
              <Terminal size={20} className="transition-transform duration-300 group-hover:translate-x-full group-hover:opacity-0" />
              <ArrowLeft size={20} className="absolute top-1.5 left-1.5 -translate-x-full opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
            </div>
            <span className="group-hover:text-white transition-colors">PortCmd</span>
          </a>

          <div className="flex items-center space-x-4 md:space-x-6">
            <a href="https://github.com/mafhper/portcmd" target="_blank" className="text-zinc-400 hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <a href={appUrl} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all">
              <span className="hidden sm:inline">Launch Web App</span>
              <span className="sm:hidden">Launch</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 hero-gradient overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span>v1.0 Public Beta Available</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            Control your ports.<br/>
            <span className="text-white">Master your workflow.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The premium system-tray utility for developers. visualize active processes, 
            kill hanging ports, and manage dev servers without touching the command line.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button disabled className="px-8 py-4 bg-zinc-800 text-zinc-500 rounded-xl font-semibold flex items-center space-x-2 cursor-not-allowed border border-zinc-700 w-full sm:w-auto justify-center">
              <Download size={20} />
              <span>Windows, Mac & Linux (Coming Soon)</span>
            </button>
            <a href={appUrl} className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 rounded-xl font-semibold flex items-center space-x-2 transition-all hover:scale-105 w-full sm:w-auto justify-center">
              <Zap size={20} />
              <span>Try Web Demo</span>
            </a>
          </div>
        </div>

        {/* Mockup */}
        <div className="mt-20 max-w-5xl mx-auto glass rounded-xl p-2 shadow-2xl animate-fade-in-up delay-200">
          <div className="bg-[#09090b] rounded-lg overflow-hidden border border-white/5 font-sans">
             
             {/* Mock App Header */}
             <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-zinc-900/50">
                <div className="flex space-x-2">
                   <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="text-xs text-zinc-500 font-mono">localhost: dashboard</div>
                <div className="w-16"></div>
             </div>

             {/* Mock App Content */}
             <div className="p-6 md:p-8 space-y-8">
                
                {/* Mock Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { label: 'Active Ports', value: '12', color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'from-yellow-500/10' },
                     { label: 'Memory Usage', value: '1.2 GB', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'from-blue-500/10' },
                     { label: 'CPU Load', value: '14%', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'from-emerald-500/10' },
                     { label: 'Health', value: 'Good', color: 'text-purple-400', border: 'border-purple-500/20', bg: 'from-purple-500/10' },
                   ].map((stat, i) => (
                     <div key={i} className={`relative overflow-hidden rounded-xl border ${stat.border} bg-zinc-900/50 p-4`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent opacity-50`} />
                        <div className="relative z-10">
                           <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                           <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Mock Table */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                   <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Processes</div>
                      <div className="flex space-x-2">
                         <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                         <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                      </div>
                   </div>
                   <div className="divide-y divide-zinc-800/50">
                      {[
                        { port: '3000', name: 'node-server', pid: '18442', type: 'Development', status: 'Running', color: 'text-emerald-400' },
                        { port: '5432', name: 'postgres', pid: '4421', type: 'Database', status: 'Running', color: 'text-blue-400' },
                        { port: '8080', name: 'docker-proxy', pid: '9921', type: 'System', status: 'Running', color: 'text-zinc-400' },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center px-6 py-4 text-sm hover:bg-white/5 transition-colors cursor-default">
                           <div className="w-24 font-mono font-bold text-brand-400">{row.port}</div>
                           <div className="flex-1 font-medium text-zinc-300">{row.name}</div>
                           <div className="w-20 font-mono text-zinc-500 hidden sm:block">{row.pid}</div>
                           <div className="w-32 hidden sm:block"><span className={`text-xs px-2 py-1 rounded-full bg-white/5 border border-white/5 ${row.color}`}>{row.type}</span></div>
                           <div className="w-24 flex items-center space-x-2 text-zinc-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              <span className="hidden sm:inline">{row.status}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

             </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: "Safe & Secure", desc: "Prevents accidental termination of system processes with smart filters and confirmation modes." },
            { icon: Layout, title: "Modern UI", desc: "Built with a premium dark mode aesthetic, designed to look great on high-DPI displays." },
            { icon: Command, title: "Developer First", desc: "Integrates with your package.json scripts to restart dev servers instantly." }
          ].map((feature, i) => (
            <div key={i} className="glass p-8 rounded-2xl hover:bg-white/5 transition-colors group">
              <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-zinc-800">
                <feature.icon className="text-brand-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} PortCmd. Open Source Software.</p>
      </footer>
    </div>
  );
};

export default App;