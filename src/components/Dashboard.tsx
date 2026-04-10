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
  X,
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
  'ทีทีบี': { color: '#F7941D', patterns: ['ทีทีบี', 'TTB', 'ทหารไทย'] },
  'ธ.ก.ส.': { color: '#006127', patterns: ['ธ.ก.ส', 'ธกส', 'BAAC'] },
  'ยูโอบี': { color: '#003366', patterns: ['ยูโอบี', 'UOB'] },
  'ซีไอเอ็มบี': { color: '#7E191B', patterns: ['ซีไอเอ็มบี', 'CIMB'] },
  'แลนด์ แอนด์ เฮ้าส์': { color: '#6EC1E4', patterns: ['แลนด์ แอนด์ เฮ้าส์', 'LH BANK', 'LHB'] },
  'อาคารสงเคราะห์': { color: '#F58220', patterns: ['อาคารสงเคราะห์', 'GH BANK'] },
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
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);

  const isDark = theme === 'dark';

  // เพิ่มฟังก์ชันกลางสำหรับระบุธนาคาร
  const identifyBank = (item: CaseData): string => {
    const bankRaw = item.type === 'atm' ? (item.raw?.['เจ้าของเครื่อง'] || item.bank || '') : (item.bank || '');
    const bankName = String(bankRaw).trim().toUpperCase();
    if (!bankName) return 'อื่นๆ';

    for (const [key, config] of Object.entries(BANK_CONFIG)) {
      if (key === 'อื่นๆ') continue;
      if (config.patterns.some(p => bankName.includes(p.toUpperCase())) || bankName.includes(key.toUpperCase())) {
        return key;
      }
    }
    
    // พยายามดึงชื่อธนาคารจากฟิลด์ bank ตรงๆ ถ้ามี
    const bankField = String(item.bank || '').trim().toUpperCase();
    if (bankField) {
      for (const [key, config] of Object.entries(BANK_CONFIG)) {
        if (key === 'อื่นๆ') continue;
        if (config.patterns.some(p => bankField.includes(p.toUpperCase())) || bankField.includes(key.toUpperCase())) {
          return key;
        }
      }
    }

    return bankRaw || 'อื่นๆ';
  };

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
      
      if (selectedBank) {
        const itemBankStandard = identifyBank(item);
        if (itemBankStandard.toUpperCase() !== selectedBank.toUpperCase()) {
          // ถ้าไม่ตรงตรงๆ ลองเช็คดูว่าชื่อดิบมีส่วนเกี่ยวข้องไหม
          const bankRaw = item.type === 'atm' ? (item.raw?.['เจ้าของเครื่อง'] || '') : (item.bank || '');
          if (!String(bankRaw).toUpperCase().includes(selectedBank.toUpperCase())) {
             return false;
          }
        }
      }

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
      const finalKey = identifyBank(item);
      bankMap[finalKey] = (bankMap[finalKey] || 0) + 1;
    });

    const bankData = Object.keys(bankMap).map(key => ({
      name: key, 
      count: bankMap[key], 
      fill: BANK_CONFIG[key]?.color || '#94a3b8'
    })).sort((a, b) => b.count - a.count);

    const typeData = [
      { name: 'ATM Withdrawal', count: allFilteredData.filter(i => i.type === 'atm').length, fill: '#3b82f6' },
      { name: 'Branch Counter', count: allFilteredData.filter(i => i.type === 'branch').length, fill: '#10b981' }
    ];

    return { provinceData, bankData, typeData };
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

  const getStatusColor = (status: string, arrest: string) => {
    const s = String(status || '').toLowerCase();
    const a = String(arrest || '').toLowerCase();
    
    if (a.includes('จับกุม') || s.includes('เสร็จสิ้น') || s.includes('สืบสวนแล้ว') || s.includes('ส่งรายงาน') || s.includes('เรียบร้อย')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
    }

    if (s.includes('ยืนยันตัว') || s.includes('พิสูจน์ทราบ') || s.includes('ออกหมาย') || s.includes('รู้ตัว') || s.includes('ส่งสภ')) {
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-500 border-sky-500/20';
    }

    if (s.includes('ไม่ยืนยัน') || s.includes('ไม่ชัด') || s.includes('ไม่พบ') || s.includes('ยกเลิก')) {
      return 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20';
    }
    
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20';
  };

  const getBankColor = (bankName: string) => {
    if (!bankName) return '#94a3b8';
    const name = String(bankName).toUpperCase();
    for (const [key, config] of Object.entries(BANK_CONFIG)) {
      if (key === 'อื่นๆ') continue;
      if (config.patterns.some(p => name.includes(p.toUpperCase())) || name.includes(key.toUpperCase())) {
        return config.color;
      }
    }
    return '#94a3b8';
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><MapPin size={16} className="text-blue-500" /> Frequency by Province</h3>
          <div className="h-[300px]">
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
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.bankData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" fontSize={8} fontWeight="bold" stroke={isDark ? '#94a3b8' : '#64748b'} interval={0} angle={-35} textAnchor="end" height={60} />
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

        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><PieChartIcon size={16} className="text-purple-500" /> Operational Share</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="name"
                >
                  {chartData.typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
              </PieChart>
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
                  <td 
                    className="px-6 py-5 first:rounded-l-2xl border-l-4 transition-all"
                    style={{ borderLeftColor: getBankColor(identifyBank(row)) }}
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-xs text-slate-700 dark:text-slate-200">{row.timestamp || 'N/A'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getBankColor(identifyBank(row)) }}></div>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mt-0.5 uppercase truncate max-w-[200px]">{row.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-blue-600 dark:text-blue-400 text-xs uppercase group-hover:text-blue-700">{row.accountName || 'N/A'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className="text-[9px] font-black px-1.5 py-0.5 rounded text-white uppercase shadow-sm"
                          style={{ backgroundColor: getBankColor(identifyBank(row)) }}
                        >
                          {identifyBank(row)}
                        </span>
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
                      <button 
                        onClick={() => setSelectedCase(row)}
                        className="p-2.5 bg-background border border-border text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <Camera size={16} />
                      </button>
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

      {/* Intel Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedCase(null)}></div>
          <div className="bg-card w-full max-w-2xl rounded-[3rem] border border-border shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-border bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                  <Fingerprint size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tighter uppercase leading-none">Tactical Intel</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Case ID: {selectedCase.id || 'N/A'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                className="p-3 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserCheck size={14} className="text-blue-500" /> Account Name</p>
                  <p className="text-sm font-black text-foreground uppercase">{selectedCase.accountName || 'UNKNOWN'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} className="text-emerald-500" /> Account Number</p>
                  <p className="text-sm font-mono font-black text-foreground">{selectedCase.accountNumber || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Building2 size={14} className="text-purple-500" /> Bank / Source</p>
                  <p className="text-sm font-black text-foreground uppercase">{identifyBank(selectedCase)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-red-500" /> Transaction Value</p>
                  <p className="text-sm font-black text-red-600 uppercase">฿{selectedCase.amount?.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6 bg-slate-100 dark:bg-white/5 rounded-[2rem] border border-border space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-background rounded-xl border border-border mt-1">
                    <MapPin size={16} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operation Location</p>
                    <p className="text-xs font-bold text-foreground mt-1 leading-relaxed">{selectedCase.location || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-background rounded-xl border border-border mt-1">
                    <ShieldAlert size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Investigation Status</p>
                    <p className="text-xs font-bold text-foreground mt-1 leading-relaxed">{selectedCase.status || 'CHECKING'} - {selectedCase.result || 'PENDING ANALYSIS'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {selectedCase.reportLink && (
                  <a 
                    href={selectedCase.reportLink} 
                    target="_blank" 
                    className="flex-1 flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                  >
                    <FileCheck size={18} /> View Full Report
                  </a>
                )}
                <button 
                  onClick={() => setSelectedCase(null)}
                  className="flex-1 bg-slate-100 dark:bg-white/10 text-foreground py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                >
                  Close Intel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
