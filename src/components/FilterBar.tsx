'use client';

import React from 'react';
import { Calendar, MapPin, Filter, X, Building2, CreditCard } from 'lucide-react';

interface FilterBarProps {
  startDate: string;
  endDate: string;
  selectedProvince: string;
  selectedBank: string;
  selectedType: string;
  selectedStatus: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onProvinceChange: (val: string) => void;
  onBankChange: (val: string) => void;
  onTypeChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onClear: () => void;
  }

  const PROVINCES = [
  'ภูเก็ต', 'กระบี่', 'พังงา', 'ระนอง', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'ชุมพร'
  ];

  const BANKS = [
  'กสิกรไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'กรุงไทย', 'กรุงศรี', 'ออมสิน', 'ทีทีบี', 'ธ.ก.ส.', 'ยูโอบี'
  ];

  const STATUSES = [
    'จัดทำรายงานสืบแล้ว', 'อยู่ระหว่างสืบสวน', 'ไม่สามารถดำเนินการได้', 'ยังไม่ได้รับงาน'
  ];
  export default function FilterBar({
  startDate,
  endDate,
  selectedProvince,
  selectedBank,
  selectedType,
  selectedStatus,
  onStartDateChange,
  onEndDateChange,
  onProvinceChange,
  onBankChange,
  onTypeChange,
  onStatusChange,
  onClear
  }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-inner mb-8 transition-colors duration-300">
      {/* Date Range */}
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <Calendar size={16} className="text-blue-600 dark:text-blue-500" />
        <input 
          type="date" 
          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none uppercase"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
        />
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-600">TO</span>
        <input 
          type="date" 
          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none uppercase"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>

      {/* Province Selector */}
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <MapPin size={16} className="text-red-600 dark:text-red-500" />
        <select 
          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none pr-4 cursor-pointer"
          value={selectedProvince}
          onChange={(e) => onProvinceChange(e.target.value)}
        >
          <option value="">ทุกจังหวัด (ภ.8)</option>
          {PROVINCES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Bank Selector */}
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <Building2 size={16} className="text-emerald-600 dark:text-emerald-500" />
        <select 
          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none pr-4 cursor-pointer"
          value={selectedBank}
          onChange={(e) => onBankChange(e.target.value)}
        >
          <option value="">ทุกธนาคาร</option>
          {BANKS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Type Selector */}
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <CreditCard size={16} className="text-purple-600 dark:text-purple-500" />
        <select 
          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none pr-4 cursor-pointer"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="">ทุกประเภทการถอน</option>
          <option value="atm">ATM Withdrawal</option>
          <option value="branch">Branch Counter</option>
        </select>
      </div>

      {/* Status Selector */}
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <Filter size={16} className="text-amber-600 dark:text-amber-500" />
        <select 
          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none pr-4 cursor-pointer"
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">ทุกสถานะงาน</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <button 
        onClick={onClear}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white rounded-2xl text-[10px] font-black transition-all border border-slate-200 dark:border-slate-700 uppercase tracking-widest"
      >
        <X size={14} /> Clear Intel
      </button>
    </div>
  );
}
