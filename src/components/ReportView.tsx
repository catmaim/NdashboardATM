'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllInvestigationData, CaseData, parseDate } from '@/lib/data-fetcher';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Building2,
  MapPin,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTheme } from 'next-themes';

interface ReportViewProps {
  startDate: string;
  endDate: string;
  selectedProvince: string;
  selectedBank: string;
  selectedType: string;
  selectedStatus: string;
}

const PROVINCES = ['ภูเก็ต', 'กระบี่', 'พังงา', 'ระนอง', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'ชุมพร'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

export default function ReportView({ startDate, endDate, selectedProvince, selectedBank, selectedType, selectedStatus }: ReportViewProps) {
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
      // Date Filter
      if (startDate && item.timestamp && new Date(item.timestamp) < new Date(startDate)) return false;
      if (endDate && item.timestamp && new Date(item.timestamp) > new Date(endDate)) return false;
      
      // Province Filter
      const prov = String(item.raw?.[' ภ.จว.'] || item.raw?.['ภ.จว.'] || '').trim();
      if (selectedProvince && !prov.includes(selectedProvince)) return false;
      
      // Bank Filter
      if (selectedBank) {
        const bankRaw = item.type === 'atm' ? (item.raw?.['เจ้าของเครื่อง'] || item.bank || '') : (item.bank || '');
        const bankName = String(bankRaw).trim().toUpperCase();
        const selectedBankUpper = selectedBank.toUpperCase();
        
        const patterns: { [key: string]: string[] } = {
          'กสิกรไทย': ['กสิกร', 'KBANK', 'K-BANK'],
          'ไทยพาณิชย์': ['ไทยพาณิชย์', 'SCB'],
          'กรุงเทพ': ['กรุงเทพ', 'BBL'],
          'กรุงไทย': ['กรุงไทย', 'KTB'],
          'กรุงศรี': ['กรุงศรี', 'BAY'],
          'ออมสิน': ['ออมสิน', 'GSB'],
          'ทีทีบี': ['ทีทีบี', 'TTB', 'ทหารไทย'],
          'ธ.ก.ส.': ['ธ.ก.ส', 'ธกส', 'BAAC'],
          'ยูโอบี': ['ยูโอบี', 'UOB'],
          'ซีไอเอ็มบี': ['ซีไอเอ็มบี', 'CIMB'],
          'แลนด์ แอนด์ เฮ้าส์': ['แลนด์ แอนด์ เฮ้าส์', 'LH BANK', 'LHB'],
          'อาคารสงเคราะห์': ['อาคารสงเคราะห์', 'GH BANK']
        };

        let isMatch = bankName.includes(selectedBankUpper);
        if (!isMatch && patterns[selectedBank]) {
          isMatch = patterns[selectedBank].some(p => bankName.includes(p.toUpperCase()));
        }
        
        if (!isMatch && item.bank) {
          const bField = String(item.bank).toUpperCase();
          isMatch = bField.includes(selectedBankUpper);
          if (!isMatch && patterns[selectedBank]) {
            isMatch = patterns[selectedBank].some(p => bField.includes(p.toUpperCase()));
          }
        }

        if (!isMatch) return false;
      }

      // Type Filter
      if (selectedType && item.type !== selectedType) return false;
      if (selectedStatus && !String(item.status || '').toLowerCase().includes(selectedStatus.toLowerCase())) return false;
      
      return true;
    });
  }, [data, startDate, endDate, selectedProvince, selectedBank, selectedType, selectedStatus]);

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
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex items-center gap-6">
          <div className="p-4 bg-blue-600/10 text-blue-600 rounded-2xl"><FileText size={24} /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Investigations</p><h4 className="text-2xl font-black text-foreground tracking-tighter">{totalStats.total}</h4></div>
        </div>
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex items-center gap-6">
          <div className="p-4 bg-emerald-600/10 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reports Finalized</p><h4 className="text-2xl font-black text-emerald-600 tracking-tighter">{totalStats.reported}</h4></div>
        </div>
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex items-center gap-6">
          <div className="p-4 bg-amber-600/10 text-amber-600 rounded-2xl"><Clock size={24} /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Documents</p><h4 className="text-2xl font-black text-amber-600 tracking-tighter">{totalStats.pending}</h4></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><FileCheck size={16} className="text-blue-500" /> Report Completion by Province</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartStats} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="province" fontSize={10} fontWeight="bold" stroke={isDark ? '#94a3b8' : '#64748b'} interval={0} />
                <YAxis fontSize={10} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="reported" name="Finalized" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500" /> Tactical Completion Rate</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartStats.filter(s => s.total > 0)}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="reported"
                  nameKey="province"
                >
                  {chartStats.filter(s => s.total > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[PROVINCES.indexOf(entry.province)] || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
        <div className="p-8 border-b border-border bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
          <h3 className="font-black text-xs text-foreground tracking-[0.2em] uppercase flex items-center gap-2"><FileText size={16} className="text-primary" /> Comprehensive Report Intel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-border">
                <th className="px-8 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('province')}>Province <SortIcon column="province" /></th>
                <th className="px-8 py-4 text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('total')}>Total Unit <SortIcon column="total" /></th>
                <th className="px-8 py-4 text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('reported')}>Finalized <SortIcon column="reported" /></th>
                <th className="px-8 py-4 text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('pending')}>Pending <SortIcon column="pending" /></th>
                <th className="px-8 py-4 text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('percent')}>Completion % <SortIcon column="percent" /></th>
                <th className="px-8 py-4 text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reportStats.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <td className="px-8 py-5"><span className="font-black text-xs text-slate-700 dark:text-slate-200 uppercase">{p.province}</span></td>
                  <td className="px-8 py-5 text-center"><span className="text-xs font-bold text-slate-500">{p.total}</span></td>
                  <td className="px-8 py-5 text-center"><span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black">{p.reported}</span></td>
                  <td className="px-8 py-5 text-center"><span className="bg-amber-500/10 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black">{p.pending}</span></td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p.percent}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-primary">{p.percent}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-lg hover:bg-primary hover:text-white transition-all"><ExternalLink size={14} /></button>
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
