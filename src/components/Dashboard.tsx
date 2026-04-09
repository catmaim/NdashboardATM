'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { fetchAllInvestigationData, CaseData } from '@/lib/data-fetcher';
import { 
  CheckCircle2, 
  MapPin, 
  ExternalLink, 
  ListTodo,
  TrendingUp,
  ShieldAlert,
  Camera,
  CreditCard,
  Building2,
  Table as TableIcon,
  Fingerprint,
  RefreshCw,
  SearchCode,
  Clock,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  Search,
  FileCheck,
  FileClock,
  UserCheck,
  UserX,
  ShieldCheck,
  Zap,
  LucideIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';

interface DashboardProps {
  startDate: string;
  endDate: string;
  selectedProvince: string;
  selectedBank: string;
  selectedType: string;
}

const BANK_CONFIG: { [key: string]: { color: string, patterns: string[] } } = {
  'กสิกรไทย': { color: '#138B2E', patterns: ['กสิกร', 'KBANK', 'K-BANK'] },
  'ไทยพาณิชย์': { color: '#4E2E7F', patterns: ['ไทยพาณิชย์', 'SCB'] },
  'กรุงเทพ': { color: '#1E4598', patterns: ['กรุงเทพ', 'BBL'] },
  'กรุงไทย': { color: '#00AEEF', patterns: ['กรุงไทย', 'KTB'] },
  'กรุงศรี': { color: '#FFD400', patterns: ['กรุงศรี', 'BAY'] },
  'ออมสิน': { color: '#EB198D', patterns: ['ออมสิน', 'GSB'] },
  'ttb': { color: '#F7941D', patterns: ['ทีทีบี', 'TTB', 'ทหารไทย'] },
  'ธ.ก.ส.': { color: '#006127', patterns: ['ธ.ก.ส', 'ธกส'] },
  'อื่นๆ': { color: '#64748b', patterns: [] }
};

export default function Dashboard({ startDate, endDate, selectedProvince, selectedBank, selectedType }: DashboardProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<{ atm: CaseData[], branch: CaseData[] }>({ atm: [], branch: [] });
  const [activeTab, setActiveTab] = useState<'atm' | 'branch'>('atm');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isDark = theme === 'dark';

  const loadData = async () => {
    setRefreshing(true);
    const result = await fetchAllInvestigationData();
    setData(result);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (selectedType) setActiveTab(selectedType as 'atm' | 'branch');
  }, [selectedType]);

  const allFilteredData = useMemo(() => {
    const combined = [...data.atm, ...data.branch];
    return combined.filter(item => {
      if (startDate && item.timestamp && new Date(item.timestamp) < new Date(startDate)) return false;
      if (endDate && item.timestamp && new Date(item.timestamp) > new Date(endDate)) return false;
      if (selectedProvince && !String(item.raw?.[' ภ.จว.'] || item.raw?.['ภ.จว.'] || '').trim().includes(selectedProvince)) return false;
      if (selectedBank && !String(item.bank || '').includes(selectedBank)) return false;
      if (selectedType && item.type !== selectedType) return false;
      return true;
    });
  }, [data, startDate, endDate, selectedProvince, selectedBank, selectedType]);

  const stats = useMemo(() => {
    const total = allFilteredData.length;
    const damage = allFilteredData.reduce((sum, curr) => sum + (curr.amount || 0), 0);
    const hasReport = allFilteredData.filter(i => !!i.reportLink).length;
    const identified = allFilteredData.filter(i => String(i.result || '').includes('ยืนยันตัว')).length;
    const notIdentified = allFilteredData.filter(i => String(i.result || '').includes('ไม่ยืนยัน')).length;
    const investigationPassed = allFilteredData.filter(i => String(i.status || '').includes('สืบสวนแล้ว')).length;
    return { total, damage, hasReport, pendingReport: total - hasReport, identified, notIdentified, investigationPassed };
  }, [allFilteredData]);

  const chartData = useMemo(() => {
    const provinces = ['ภูเก็ต', 'กระบี่', 'พังงา', 'ระนอง', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'ชุมพร'];
    const provinceData = provinces.map(p => ({
      name: p,
      count: allFilteredData.filter(item => String(item.raw?.[' ภ.จว.'] || item.raw?.['ภ.จว.'] || '').includes(p)).length
    })).sort((a, b) => b.count - a.count);

    const bankMap: { [key: string]: number } = {};
    allFilteredData.forEach(item => {
      const bankRaw = item.type === 'atm' ? (item.raw?.['เจ้าของเครื่อง'] || '') : (item.bank || '');
      const bankName = String(bankRaw).trim();
      if (!bankName) return;
      let matchedKey = 'อื่นๆ';
      for (const itemPattern of [
        { key: 'กสิกรไทย', patterns: ['กสิกร', 'KBANK'] },
        { key: 'ไทยพาณิชย์', patterns: ['ไทยพาณิชย์', 'SCB'] },
        { key: 'กรุงเทพ', patterns: ['กรุงเทพ', 'BBL'] },
        { key: 'กรุงไทย', patterns: ['กรุงไทย', 'KTB'] },
        { key: 'กรุงศรี', patterns: ['กรุงศรี', 'BAY'] },
        { key: 'ออมสิน', patterns: ['ออมสิน', 'GSB'] },
        { key: 'ttb', patterns: ['ทีทีบี', 'TTB'] },
        { key: 'ธ.ก.ส.', patterns: ['ธ.ก.ส', 'ธกส'] }
      ]) {
        if (itemPattern.patterns.some(p => bankName.toUpperCase().includes(p.toUpperCase()))) {
          matchedKey = itemPattern.key; break;
        }
      }
      bankMap[matchedKey] = (bankMap[matchedKey] || 0) + 1;
    });
    const bankData = Object.keys(bankMap).map(key => ({
      name: key, count: bankMap[key], fill: BANK_CONFIG[key]?.color || '#64748b'
    })).sort((a, b) => b.count - a.count);

    return { provinceData, bankData };
  }, [allFilteredData]);

  const displayData = useMemo(() => {
    const currentData = allFilteredData.filter(i => i.type === activeTab);
    return currentData.filter(item => {
      const searchStr = searchTerm.toLowerCase();
      return Object.values(item).some(v => String(v).toLowerCase().includes(searchStr));
    });
  }, [allFilteredData, activeTab, searchTerm]);

  const currentItems = displayData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(displayData.length / itemsPerPage);

  // ฟังก์ชันกำหนดสีตามสถานะ
  const getStatusColor = (status: string, arrest: string) => {
    const s = String(status || '').toLowerCase();
    const a = String(arrest || '').toLowerCase();
    
    if (a.includes('จับกุมแล้ว') || s.includes('เสร็จสิ้น') || s.includes('สืบสวนแล้ว')) 
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
    if (s.includes('ยืนยันตัว') || s.includes('พิสูจน์ทราบ')) 
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-500 border-sky-500/20';
    if (s.includes('ไม่ยืนยัน')) 
      return 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20';
    
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20';
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
      <ShieldCheck className="text-primary mb-4" size={48} />
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Decrypting Operations...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard label="รายการทั้งหมด" value={stats.total} Icon={ListTodo} color="text-blue-500" />
        <StatCard label="ความเสียหายรวม" value={`฿${(stats.damage / 1000000).toFixed(2)}M`} Icon={TrendingUp} color="text-purple-500" />
        <StatCard label="ส่งรายงานแล้ว" value={stats.hasReport} Icon={FileCheck} color="text-emerald-500" />
        <StatCard label="รอส่งรายงาน" value={stats.total - stats.hasReport} Icon={FileClock} color="text-amber-500" />
        <StatCard label="ยืนยันตัวผู้ต้องหา" value={stats.identified} Icon={UserCheck} color="text-sky-500" />
        <StatCard label="ไม่ยืนยันผู้ต้องหา" value={stats.notIdentified} Icon={UserX} color="text-red-500" />
        <StatCard label="ผ่านการสืบสวน" value={stats.investigationPassed} Icon={ShieldCheck} color="text-indigo-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><MapPin size={16} className="text-blue-500" /> Frequency by Province</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.provinceData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" fontSize={10} fontWeight="bold" stroke={isDark ? '#94a3b8' : '#64748b'} interval={0} />
                <YAxis fontSize={10} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 'bold', fill: isDark ? '#94a3b8' : '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><Building2 size={16} className="text-emerald-500" /> Frequency by Bank</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.bankData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" fontSize={8} fontWeight="bold" stroke={isDark ? '#94a3b8' : '#64748b'} interval={0} angle={-35} textAnchor="end" height={80} />
                <YAxis fontSize={10} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.bankData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 'bold', fill: isDark ? '#94a3b8' : '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
        <div className="p-8 border-b border-border flex flex-col xl:flex-row justify-between items-center gap-8 bg-slate-50/50 dark:bg-white/5 transition-colors">
          <div className="flex bg-background p-1 rounded-xl border border-border shadow-inner">
            <button onClick={() => setActiveTab('atm')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'atm' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>ATM</button>
            <button onClick={() => setActiveTab('branch')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'branch' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>BRANCH</button>
          </div>
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-[400px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-primary transition-colors" />
              <input type="text" placeholder="Search operational intel..." className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-background border border-border p-1.5 rounded-2xl shadow-inner">
              {[10, 20, 50].map(num => (
                <button key={num} onClick={() => { setItemsPerPage(num); setCurrentPage(1); }} className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ${itemsPerPage === num ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{num}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto px-6 pb-4">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-6 py-2">Transaction Intel</th>
                <th className="px-6 py-2">Target / Unit</th>
                <th className="px-6 py-2 text-right">Value (THB)</th>
                <th className="px-6 py-2 text-center">Status</th>
                <th className="px-6 py-2 text-center">Protocol</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((row, idx) => (
                <tr key={idx} className="bg-slate-50/30 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group border border-transparent shadow-sm dark:shadow-none">
                  <td className="px-6 py-5 first:rounded-l-2xl border-l-2 border-transparent hover:border-primary">
                    <div className="flex flex-col">
                      <span className="font-black text-xs text-slate-700 dark:text-slate-200">{row.timestamp || 'N/A'}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mt-1 uppercase truncate max-w-[200px]">{row.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-blue-600 dark:text-blue-400 text-xs uppercase group-hover:text-blue-700">{row.accountName || 'N/A'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">{row.bank}</span>
                        <span className="text-slate-400 text-[10px] font-bold uppercase">สภ. {row.station || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-black text-sm text-slate-700 dark:text-white">฿{(row.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${getStatusColor(row.status || '', row.arrestStatus || '')}`}>
                      {row.status || 'CHECKING'}
                    </span>
                  </td>
                  <td className="px-6 py-5 last:rounded-r-2xl text-center">
                    <div className="flex justify-center gap-2">
                      {row.reportLink && <a href={row.reportLink} target="_blank" className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><ExternalLink size={16} /></a>}
                      <button className="p-2.5 bg-background border border-border text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"><Camera size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-border flex justify-between items-center bg-slate-50/50 dark:bg-white/5 transition-colors">
          <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Operational Record {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 bg-background border border-border rounded-xl text-slate-400 hover:text-primary disabled:opacity-30 transition-all"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 bg-background border border-border rounded-xl text-slate-400 hover:text-primary disabled:opacity-30 transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, Icon, color }: { label: string, value: string | number, Icon: LucideIcon, color: string }) {
  return (
    <div className="bg-card p-5 rounded-3xl border border-border shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
      <div className={`p-2.5 w-fit rounded-xl bg-slate-50 dark:bg-white/5 border border-border mb-4 ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={18} />
      </div>
      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 truncate">{label}</p>
      <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter truncate transition-colors">{value}</h4>
    </div>
  );
}
