'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import Dashboard from '@/components/Dashboard';
import MapView from '@/components/MapView';
import ProvinceView from '@/components/ProvinceView';
import ReportView from '@/components/ReportView';
import MuleAccountView from '@/components/MuleAccountView';
import FilterBar from '@/components/FilterBar';
import { SearchCode, Construction } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  
  // Global Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedProvince('');
    setSelectedBank('');
    setSelectedType('');
    setSelectedStatus('');
  };

  const renderView = () => {
    const filterProps = { startDate, endDate, selectedProvince, selectedBank, selectedType, selectedStatus };

    switch (activeView) {
      case 'dashboard':
        return <Dashboard {...filterProps} />;
      case 'provinces':
        return <ProvinceView {...filterProps} />;
      case 'mules':
        return <MuleAccountView {...filterProps} />;
      case 'map':
        return <MapView {...filterProps} />;
      case 'reports':
        return <ReportView {...filterProps} />;
      default:
        return <Dashboard {...filterProps} />;
    }
  };

  return (
    <MainLayout activeView={activeView} onViewChange={setActiveView}>
      <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
        <FilterBar 
          startDate={startDate}
          endDate={endDate}
          selectedProvince={selectedProvince}
          selectedBank={selectedBank}
          selectedType={selectedType}
          selectedStatus={selectedStatus}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onProvinceChange={setSelectedProvince}
          onBankChange={setSelectedBank}
          onTypeChange={setSelectedType}
          onStatusChange={setSelectedStatus}
          onClear={clearFilters}
        />
        {renderView()}
      </div>
    </MainLayout>
  );
}
