'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllInvestigationData, CaseData } from '@/lib/data-fetcher';
import { 
  UserCircle2, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Search, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown,
  Building2,
  ShieldAlert,
  CreditCard,
  Target,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LabelList
} from 'recharts';
import { useTheme } from 'next-themes';

interface MuleAccountViewProps {
  startDate: string;
  endDate: string;
  selectedProvince: string;
  selectedBank: string;
  selectedType: string;
}

type MuleStats = {
  name: string;
  accountNumber: string;
  bank: string;
  count: number;
  totalAmount: number;
  topStation: string;
  lastSeen: string;
  lastLocation: string;
  lastBank: string;
};

export default function MuleAccountView({ startDate, endDate, selectedProvince, selectedBank, selectedType }: MuleAccountViewProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>({ key: 'count', direction: 'desc' });

  const isDark = theme === 'dark';

  useEffect(() => {
    const loadData = async () => {
      const { atm, branch } = await fetchAllInvestigationData();
      setData([...atm, ...branch]);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (startDate && item.timestamp && new Date(item.timestamp) < new Date(startDate)) return false;
      if (endDate && item.timestamp && new Date(item.timestamp) > new Date(endDate)) return false;
      if (selectedProvince && !String(item.raw?.[' ภ.จว.'] || item.raw?.['ภ.จว.'] || '').trim().includes(selectedProvince)) return false;
      if (selectedBank && !String(item.bank || '').includes(selectedBank)) return false;
      if (selectedType && item.type !== selectedType) return false;
      return true;
    });
  }, [data, startDate, endDate, selectedProvince, selectedBank, selectedType]);

  const muleAccounts = useMemo(() => {
    const muleMap: { [key: string]: MuleStats } = {};
    const sortedByTime = [...filteredData].sort((a, b) => {
      return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
    });

    sortedByTime.forEach(item => {
      const name = String(item.accountName || 'UNKNOWN').trim();
      const accNum = String(item.accountNumber || 'N/A').trim();
      const key = `${name}_${accNum}`;

      if (!muleMap[key]) {
        muleMap[key] = {
          name,
          accountNumber: accNum,
          bank: String(item.bank || 'Unknown Bank'),
          count: 0,
          totalAmount: 0,
          topStation: String(item.station || 'N/A'),
          lastSeen: String(item.timestamp || 'N/A'),
          lastLocation: String(item.location || 'N/A'),
          lastBank: String(item.bank || 'N/A')
        };
      }

      muleMap[key].count += 1;
      muleMap[key].totalAmount += (item.amount || 0);
      muleMap[key].lastSeen = item.timestamp || muleMap[key].lastSeen;
      muleMap[key].lastLocation = item.location || muleMap[key].lastLocation;
      muleMap[key].lastBank = item.bank || muleMap[key].lastBank;
      muleMap[key].topStation = item.station || muleMap[key].topStation;
    });

    const list = Object.values(muleMap);
    return list.sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const top10Freq = useMemo(() => [...muleAccounts].sort((a, b) => b.count - a.count).slice(0, 10), [muleAccounts]);
  const top10Value = useMemo(() => [...muleAccounts].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10), [muleAccounts]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-pulse">
      <ShieldAlert className="text-primary" size={48} />
      <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest leading-none mt-2">Targeting High-Value Mules...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Unique Targets" value={muleAccounts.length} icon={<Target />} color="blue" />
        <StatCard label="Max Frequency Target" value={top10Freq[0]?.name || 'N/A'} icon={<AlertTriangle />} color="red" subValue={`${top10Freq[0]?.count || 0} Times`} />
        <StatCard label="High Value Target" value={top10Value[0]?.name || 'N/A'} icon={<ShieldAlert />} color="blue" subValue={`฿${(top10Value[0]?.totalAmount || 0).toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><Target size={16} className="text-red-500" /> Top 10 High-Frequency Mules</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Freq} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} width={100} fontWeight="bold" />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="count" position="right" style={{ fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500" /> Top 10 High-Value Mules</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Value} layout="vertical" margin={{ left: 40, right: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} width={100} fontWeight="bold" />
                <Tooltip />
                <Bar dataKey="totalAmount" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="totalAmount" position="right" formatter={(val: any) => `฿${Number(val || 0).toLocaleString()}`} style={{ fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
        <div className="p-8 border-b border-border flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-white/5 gap-6 transition-colors">
          <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3"><ShieldAlert size={20} className="text-red-500" /> Mule Account Intelligence</h3>
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-primary transition-colors" />
            <input type="text" placeholder="Filter names or accounts..." className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto px-6 pb-8">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black cursor-pointer select-none">
                <th className="px-6 py-4" onClick={() => setSortConfig({ key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Mule Identity <SortIcon active={sortConfig.key === 'name'} dir={sortConfig.direction} /></th>
                <th className="px-6 py-4 text-center" onClick={() => setSortConfig({ key: 'count', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Freq <SortIcon active={sortConfig.key === 'count'} dir={sortConfig.direction} /></th>
                <th className="px-6 py-4 text-right" onClick={() => setSortConfig({ key: 'totalAmount', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Value <SortIcon active={sortConfig.key === 'totalAmount'} dir={sortConfig.direction} /></th>
                <th className="px-6 py-4 text-center">เวลาที่กดเงินล่าสุด</th>
                <th className="px-6 py-4">สถานที่กดเงินล่าสุด</th>
                <th className="px-6 py-4 text-center">ธนาคาร</th>
              </tr>
            </thead>
            <tbody>
              {muleAccounts.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.accountNumber.includes(searchTerm)).slice(0, 100).map((m, idx) => (
                <tr key={idx} className="bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-white/10 transition-all group border border-transparent shadow-sm dark:shadow-none">
                  <td className="px-6 py-6 first:rounded-l-2xl border-l-2 border-transparent hover:border-red-500">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border text-slate-400 group-hover:text-red-500 transition-colors"><UserCircle2 size={24} /></div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 dark:text-slate-100 uppercase tracking-tight text-sm mb-1">{m.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] tracking-widest">{m.accountNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center"><span className={`px-3 py-1 rounded-lg text-xs font-black ${m.count > 5 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{m.count}</span></td>
                  <td className="px-6 py-6 text-right font-mono font-black text-slate-700 dark:text-white text-base">฿{m.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <Clock size={12} className="text-blue-500" /> {m.lastSeen}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase max-w-[200px]">
                      <MapPin size={12} className="text-red-500 shrink-0" /> <span className="truncate">{m.lastLocation}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 last:rounded-r-2xl text-center">
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">{m.lastBank}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, subValue }: any) {
  return (
    <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border text-slate-400 group-hover:text-primary transition-colors">{icon}</div>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter truncate">{value}</h4>
      {subValue && <p className={`text-xs font-bold mt-2 ${color}`}>{subValue}</p>}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean, dir: 'asc'|'desc' }) {
  if (!active) return <ArrowUpDown size={12} className="inline ml-1 opacity-20" />;
  return dir === 'desc' ? <ChevronDown size={12} className="inline ml-1 text-blue-500" /> : <ChevronUp size={12} className="inline ml-1 text-blue-500" />;
}
