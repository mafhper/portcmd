import React from 'react';
import { Terminal, Shield, Zap, Download, Layout, Github, ArrowRight, Activity, Command } from 'lucide-react';

const App = () => {
  return (
    <div className="min-h-screen font-sans selection:bg-brand-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-xl tracking-tight">
            <div className="bg-brand-500/20 p-1.5 rounded-lg text-brand-500">
              <Terminal size={20} />
            </div>
            <span>PortCommand</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="https://github.com/mafhper/portcommand" target="_blank" className="text-zinc-400 hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <a href="./app/" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all">
              Launch Web App
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
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            Control your ports.<br/>
            <span className="text-white">Master your workflow.</span>
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The premium system-tray utility for developers. visualize active processes, 
            kill hanging ports, and manage dev servers without touching the command line.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition-all hover:scale-105">
              <Download size={20} />
              <span>Download for Windows</span>
            </button>
            <a href="./app/" className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl font-semibold flex items-center space-x-2 transition-all">
              <Zap size={20} />
              <span>Try Live Demo</span>
            </a>
          </div>
        </div>

        {/* Mockup */}
        <div className="mt-20 max-w-5xl mx-auto glass rounded-xl p-2 shadow-2xl animate-fade-in-up delay-200">
          <div className="bg-[#09090b] rounded-lg overflow-hidden aspect-video relative border border-white/5">
             <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                {/* Placeholder for App Screenshot */}
                <div className="text-center">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Application Screenshot / Demo Component</p>
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
        <p>&copy; {new Date().getFullYear()} PortCommand. Open Source Software.</p>
      </footer>
    </div>
  );
};

export default App;