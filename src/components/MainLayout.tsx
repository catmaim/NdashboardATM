'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, 
  Search as SearchIcon, 
  Map as MapIcon, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ShieldAlert,
  Bell,
  BarChart4,
  Users,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function MainLayout({ children, activeView, onViewChange }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'provinces', name: 'Provinces', icon: <BarChart4 size={20} /> },
    { id: 'mules', name: 'Mule Accounts', icon: <Users size={20} /> },
    { id: 'map', name: 'Tactical Map', icon: <MapIcon size={20} /> },
    { id: 'reports', name: 'Reports', icon: <FileText size={20} /> },
  ];

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-500 ease-in-out">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-white dark:bg-slate-900/50 border-r border-border transition-all duration-500 ease-in-out hidden md:flex flex-col z-30 shadow-sm dark:shadow-none`}>
        <div className="p-8 flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-600/10">
            <ShieldAlert size={24} />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col animate-in fade-in duration-500">
              <span className="font-black text-xl tracking-tighter leading-none">POLICE HUB</span>
              <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1 uppercase">Region 8 Operational</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group ${
                activeView === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white'
              }`}
            >
              {activeView === item.id && (
                <div className="absolute left-0 w-1 h-6 bg-white rounded-full ml-1" />
              )}
              <div className={`${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{item.icon}</div>
              {isSidebarOpen && <span className="font-bold text-xs tracking-widest uppercase">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-border space-y-2">
          <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all font-bold text-xs uppercase tracking-widest group">
            <Settings size={20} className="group-hover:rotate-90 transition-transform" />
            {isSidebarOpen && <span>Settings</span>}
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500/70 hover:bg-red-500/10 transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={20} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl border-b border-border px-8 flex items-center justify-between z-20 transition-all duration-500">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-3 bg-slate-100 dark:bg-white/5 border border-border rounded-2xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all shadow-inner"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 bg-slate-100 dark:bg-white/5 border border-border rounded-2xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all shadow-inner relative overflow-hidden group"
            >
              <div className="relative z-10">
                {theme === 'dark' ? <Sun size={20} className="animate-in spin-in-90 duration-500" /> : <Moon size={20} className="animate-in spin-in-90 duration-500" />}
              </div>
              <div className="absolute inset-0 bg-blue-600 translate-y-10 group-hover:translate-y-0 transition-transform duration-300 opacity-10" />
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 tracking-[0.2em] uppercase mb-1">Ops Status</span>
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Secure Link</span>
              </div>
            </div>
            
            <div className="h-10 w-px bg-border"></div>

            <div className="flex items-center gap-4 group cursor-pointer bg-slate-100 dark:bg-white/5 p-2 pr-5 rounded-2xl border border-border hover:border-blue-500/50 transition-all shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center font-black border border-white/10 shadow-lg text-white group-hover:scale-105 transition-transform">
                P8
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black uppercase tracking-tighter leading-none mb-1">Officer ID: 8842</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Command Level</p>
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto custom-scrollbar bg-background relative transition-colors duration-500">
          <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-700 h-full p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
