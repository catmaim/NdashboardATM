'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllInvestigationData, CaseData } from '@/lib/data-fetcher';
import { 
  MapPin, 
  CreditCard, 
  Building2, 
  ShieldCheck,
  BarChart3,
  PieChart as PieChartIcon,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { useTheme } from 'next-themes';

interface ProvinceViewProps {
  startDate: string;
  endDate: string;
}

const PROVINCES = ['ภูเก็ต', 'กระบี่', 'พังงา', 'ระนอง', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'ชุมพร'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

export default function ProvinceView({ startDate, endDate }: ProvinceViewProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'total', direction: 'desc' });

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
      return true;
    });
  }, [data, startDate, endDate]);

  const provinceStats = useMemo(() => {
    const stats = PROVINCES.map(p => {
      const provItems = filteredData.filter(i => 
        String(i.raw?.[' ภ.จว.'] || i.raw?.['ภ.จว.'] || '').trim().includes(p)
      );
      return {
        province: p,
        total: provItems.length,
        atm: provItems.filter(i => i.type === 'atm').length,
        branch: provItems.filter(i => i.type === 'branch').length,
        damage: provItems.reduce((sum, curr) => sum + (curr.amount || 0), 0),
        reported: provItems.filter(i => !!i.reportLink).length,
        identified: provItems.filter(i => String(i.result || '').includes('ยืนยันตัว')).length,
        notIdentified: provItems.filter(i => String(i.result || '').includes('ไม่ยืนยัน')).length
      };
    });

    return stats.sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const chartStats = useMemo(() => {
    return [...provinceStats].sort((a, b) => b.total - a.total);
  }, [provinceStats]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return sortConfig.direction === 'desc' ? <ChevronDown size={12} className="ml-1 text-blue-500" /> : <ChevronUp size={12} className="ml-1 text-blue-500" />;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-pulse">
      <ShieldCheck className="text-primary" size={48} />
      <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest text-center">Assembling provincial intel...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {chartStats.map((p, idx) => (
          <div key={idx} className="bg-card p-5 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-border text-slate-400 group-hover:text-blue-500 transition-colors"><MapPin size={16} /></div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">P8 Unit</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{p.province}</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">{p.total} <span className="text-[10px] text-slate-400 font-bold tracking-normal uppercase ml-1">Cases</span></h4>
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
              <span>฿{(p.damage / 1000000).toFixed(1)}M</span>
              <span className="text-emerald-500">{((p.total / (filteredData.length || 1)) * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm transition-colors duration-300">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" /> ATM vs Branch Distribution (Sorted)
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartStats} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="province" fontSize={10} fontWeight="bold" stroke={isDark ? '#94a3b8' : '#64748b'} interval={0} height={40} />
                <YAxis fontSize={10} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip cursor={{fill: 'currentColor', opacity: 0.05}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="atm" name="ATM Withdrawal" fill="#3b82f6" stackId="a">
                  <LabelList dataKey="atm" position="center" style={{ fontSize: 9, fontWeight: 'bold', fill: '#fff' }} />
                </Bar>
                <Bar dataKey="branch" name="Branch Counter" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="branch" position="center" style={{ fontSize: 9, fontWeight: 'bold', fill: '#fff' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <PieChartIcon size={16} className="text-purple-500" /> Share of Operations by Province
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartStats} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="total" nameKey="province">
                  {chartStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
        <div className="p-8 border-b border-border bg-slate-50/50 dark:bg-white/5 transition-colors">
          <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
            <ShieldCheck size={20} className="text-blue-500" /> Provincial Operational Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto px-6 pb-8">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.25em] font-black cursor-pointer select-none">
                <th className="px-6 py-4" onClick={() => handleSort('province')}>ภ.จว. <SortIcon column="province" /></th>
                <th className="px-6 py-4 text-center" onClick={() => handleSort('total')}>รวม <SortIcon column="total" /></th>
                <th className="px-6 py-4 text-center" onClick={() => handleSort('atm')}>ATM <SortIcon column="atm" /></th>
                <th className="px-6 py-4 text-center" onClick={() => handleSort('branch')}>สาขา <SortIcon column="branch" /></th>
                <th className="px-6 py-4 text-right" onClick={() => handleSort('damage')}>ความเสียหาย <SortIcon column="damage" /></th>
                <th className="px-6 py-4 text-center" onClick={() => handleSort('reported')}>ส่งรายงาน <SortIcon column="reported" /></th>
                <th className="px-6 py-4 text-center" onClick={() => handleSort('identified')}>ยืนยัน <SortIcon column="identified" /></th>
                <th className="px-6 py-4 text-center" onClick={() => handleSort('notIdentified')}>ไม่ยืนยัน <SortIcon column="notIdentified" /></th>
              </tr>
            </thead>
            <tbody>
              {provinceStats.map((p, idx) => (
                <tr key={idx} className="bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-white/10 transition-all group border border-transparent shadow-sm dark:shadow-none">
                  <td className="px-6 py-6 first:rounded-l-[1.5rem] border-l-2 border-transparent hover:border-blue-500">
                    <span className="font-black text-slate-700 dark:text-slate-100 uppercase tracking-tighter">{p.province}</span>
                  </td>
                  <td className="px-6 py-6 text-center"><span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white px-3 py-1 rounded-lg text-xs font-black">{p.total}</span></td>
                  <td className="px-6 py-6 text-center text-blue-600 dark:text-blue-400 font-bold text-xs">{p.atm}</td>
                  <td className="px-6 py-6 text-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">{p.branch}</td>
                  <td className="px-6 py-6 text-right font-mono font-black text-slate-700 dark:text-white">฿{p.damage.toLocaleString()}</td>
                  <td className="px-6 py-6 text-center"><span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-3 py-1 rounded-lg text-[10px] font-black">{p.reported}</span></td>
                  <td className="px-6 py-6 text-center"><span className="bg-sky-500/10 text-sky-600 dark:text-sky-500 px-3 py-1 rounded-lg text-[10px] font-black">{p.identified}</span></td>
                  <td className="px-6 py-6 last:rounded-r-[1.5rem] text-center"><span className="bg-red-500/10 text-red-600 dark:text-red-500 px-3 py-1 rounded-lg text-[10px] font-black">{p.notIdentified}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
