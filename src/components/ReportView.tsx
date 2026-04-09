'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllInvestigationData, CaseData } from '@/lib/data-fetcher';
import { 
  FileCheck, 
  FileClock, 
  Files, 
  BarChart3, 
  PieChart as PieChartIcon, 
  ShieldCheck,
  TrendingUp,
  MapPin,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { useTheme } from 'next-themes';

interface ReportViewProps {
  startDate: string;
  endDate: string;
}

const PROVINCES = ['ภูเก็ต', 'กระบี่', 'พังงา', 'ระนอง', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'ชุมพร'];

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

export default function ReportView({ startDate, endDate }: ReportViewProps) {
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

  const reportStats = useMemo(() => {
    const stats = PROVINCES.map(p => {
      const provItems = filteredData.filter(i => 
        String(i.raw?.[' ภ.จว.'] || i.raw?.['ภ.จว.'] || '').trim().includes(p)
      );
      const total = provItems.length;
      const reported = provItems.filter(i => !!i.reportLink).length;
      const pending = total - reported;
      const percentValue = total > 0 ? (reported / total) * 100 : 0;

      return {
        province: p,
        total,
        reported,
        pending,
        percent: parseFloat(percentValue.toFixed(1))
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
    return [...reportStats].sort((a, b) => b.total - a.total);
  }, [reportStats]);

  const totalStats = useMemo(() => {
    const total = filteredData.length;
    const reported = filteredData.filter(i => !!i.reportLink).length;
    return {
      total,
      reported,
      pending: total - reported
    };
  }, [filteredData]);

  const pieData = [
    { name: 'ส่งรายงานแล้ว', value: totalStats.reported, color: '#10b981' },
    { name: 'รอส่งรายงาน', value: totalStats.pending, color: '#f59e0b' }
  ];

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
      <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest text-center">Assembling Tactical Reports...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="รายการทั้งหมด" value={totalStats.total} icon={<Files />} color="blue" />
        <StatCard label="ส่งรายงานแล้ว" value={totalStats.reported} icon={<FileCheck />} color="emerald" />
        <StatCard label="รอส่งรายงาน" value={totalStats.pending} icon={<FileClock />} color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" /> Report Submission Status
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartStats} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="province" fontSize={10} fontWeight="bold" stroke={isDark ? '#94a3b8' : '#64748b'} interval={0} height={40} />
                <YAxis fontSize={10} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="reported" name="Submitted" fill="#10b981" stackId="a">
                  <LabelList dataKey="reported" position="center" style={{ fontSize: 9, fontWeight: 'bold', fill: '#fff' }} />
                </Bar>
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="pending" position="center" style={{ fontSize: 9, fontWeight: 'bold', fill: '#fff' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm text-center">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2 justify-center">
            <PieChartIcon size={16} className="text-emerald-500" /> Global Rate
          </h3>
          <div className="h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-[-10px]">
              <p className="text-3xl font-black text-slate-800 dark:text-white">{((totalStats.reported / (totalStats.total || 1)) * 100).toFixed(0)}%</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
        <div className="p-8 border-b border-border bg-slate-50/50 dark:bg-white/5 transition-colors">
          <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
            <ShieldCheck size={20} className="text-emerald-500" /> Detailed Provincial Report Summary
          </h3>
        </div>
        <div className="overflow-x-auto px-6 pb-8">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.25em] font-black cursor-pointer select-none">
                <th className="px-6 py-4" onClick={() => handleSort('province')}>ภ.จว. <SortIcon column="province" /></th>
                <th className="px-6 py-4 text-center" onClick={() => handleSort('total')}>รวม <SortIcon column="total" /></th>
                <th className="px-6 py-4 text-center text-emerald-500" onClick={() => handleSort('reported')}>ส่งรายงานแล้ว <SortIcon column="reported" /></th>
                <th className="px-6 py-4 text-center text-amber-500" onClick={() => handleSort('pending')}>รอส่ง <SortIcon column="pending" /></th>
                <th className="px-6 py-4 text-center" onClick={() => handleSort('percent')}>% ส่งแล้ว <SortIcon column="percent" /></th>
              </tr>
            </thead>
            <tbody>
              {reportStats.map((p, idx) => (
                <tr key={idx} className="bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-white/10 transition-all group border border-transparent shadow-sm dark:shadow-none">
                  <td className="px-6 py-6 first:rounded-l-[1.5rem] border-l-2 border-transparent hover:border-emerald-500">
                    <div className="flex items-center gap-3">
                      <MapPin size={14} className="text-slate-400 group-hover:text-blue-500" />
                      <span className="font-black text-slate-700 dark:text-slate-100 uppercase tracking-tighter">{p.province}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center"><span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white px-4 py-1.5 rounded-xl text-xs font-black">{p.total}</span></td>
                  <td className="px-6 py-6 text-center"><span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{p.reported}</span></td>
                  <td className="px-6 py-6 text-center"><span className="text-amber-600 dark:text-amber-400 font-bold text-sm">{p.pending}</span></td>
                  <td className="px-6 py-6 last:rounded-r-[1.5rem] text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block shadow-inner">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.percent}%` }}></div>
                      </div>
                      <span className="font-black text-slate-700 dark:text-white text-xs">{p.percent}%</span>
                    </div>
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

function StatCard({ label, value, icon, color }: any) {
  const colors: any = {
    blue: 'border-blue-500/20 shadow-blue-500/5',
    emerald: 'border-emerald-500/20 shadow-emerald-500/5',
    amber: 'border-amber-500/20 shadow-amber-500/5',
  };

  return (
    <div className={`bg-card p-8 rounded-[2rem] border ${colors[color]} shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all group`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border text-slate-400 group-hover:text-primary transition-colors">{icon}</div>
        <TrendingUp size={12} className="text-slate-300 dark:text-slate-700" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <h4 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{value}</h4>
    </div>
  );
}
