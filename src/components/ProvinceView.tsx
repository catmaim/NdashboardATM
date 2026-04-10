'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllInvestigationData, CaseData, parseDate } from '@/lib/data-fetcher';
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

export default function ProvinceView({ startDate, endDate, selectedProvince, selectedBank, selectedType, selectedStatus }: ProvinceViewProps) {
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
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Province Tactical Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {provinceStats.filter(p => p.total > 0).map((p, idx) => {
          const provinceColor = COLORS[PROVINCES.indexOf(p.province)] || '#3b82f6';
          return (
            <div key={idx} className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group overflow-hidden relative" style={{ borderBottom: `4px solid ${provinceColor}` }}>
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity" style={{ color: provinceColor }}>
                <MapPin size={80} />
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl transition-colors" style={{ backgroundColor: `${provinceColor}15`, color: provinceColor }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tighter">{p.province}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Zone 8 Command</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Ops</p>
                  <p className="text-xl font-black tracking-tighter text-foreground">{p.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reported</p>
                  <p className="text-xl font-black tracking-tighter text-emerald-500">{p.reported}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capital Damage</p>
                  <p className="text-xs font-black text-red-600">฿{p.damage.toLocaleString()}</p>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000" 
                    style={{ 
                      width: `${p.total > 0 ? (p.reported / p.total) * 100 : 0}%`,
                      backgroundColor: provinceColor
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">ATM: {p.atm}</span>
                  <span className="text-slate-400">BRANCH: {p.branch}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" /> Case Distribution by Province
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartStats} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="province" fontSize={10} fontWeight="bold" stroke={isDark ? '#94a3b8' : '#64748b'} interval={0} />
                <YAxis fontSize={10} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {chartStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[PROVINCES.indexOf(entry.province)] || '#3b82f6'} />
                  ))}
                  <LabelList dataKey="total" position="top" style={{ fontSize: 10, fontWeight: 'bold', fill: isDark ? '#94a3b8' : '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
          <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <PieChartIcon size={16} className="text-emerald-500" /> Operational Share by Province
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartStats.filter(s => s.total > 0)}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="total"
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
        <div className="p-8 border-b border-border bg-slate-50/50 dark:bg-white/5">
          <h3 className="font-black text-xs text-foreground tracking-[0.2em] uppercase flex items-center gap-2">
            <MapPin size={16} className="text-red-500" /> Detailed Province Intelligence
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-border">
                <th className="px-8 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('province')}>Province <SortIcon column="province" /></th>
                <th className="px-8 py-4 text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('total')}>Total Cases <SortIcon column="total" /></th>
                <th className="px-8 py-4 text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('atm')}>ATM <SortIcon column="atm" /></th>
                <th className="px-8 py-4 text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('branch')}>Branch <SortIcon column="branch" /></th>
                <th className="px-8 py-4 text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('damage')}>Damage (THB) <SortIcon column="damage" /></th>
                <th className="px-8 py-4 text-center">Status Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {provinceStats.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                  <td className="px-8 py-5">
                    <span className="font-black text-xs text-slate-700 dark:text-slate-200 uppercase">{p.province}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="bg-blue-600/10 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black">{p.total}</span>
                  </td>
                  <td className="px-8 py-5 text-center text-xs font-bold text-slate-500">{p.atm}</td>
                  <td className="px-8 py-5 text-center text-xs font-bold text-slate-500">{p.branch}</td>
                  <td className="px-8 py-5 text-right font-mono font-black text-sm text-slate-700 dark:text-white italic">
                    ฿{p.damage.toLocaleString()}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-2">
                      <span title="Identified" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-3 py-1 rounded-lg text-[10px] font-black">{p.identified}</span>
                      <span title="Not Identified" className="bg-red-500/10 text-red-600 dark:text-red-500 px-3 py-1 rounded-lg text-[10px] font-black">{p.notIdentified}</span>
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
