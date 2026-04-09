'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchAllInvestigationData, CaseData } from '@/lib/data-fetcher';
import { 
  ShieldAlert, 
  Search, 
  CreditCard, 
  Building2, 
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  Flame,
  Zap,
  Navigation,
  LocateFixed,
  TrendingUp,
  Map as MapIcon
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';

interface MapViewProps {
  startDate: string;
  endDate: string;
  selectedProvince: string;
  selectedBank: string;
  selectedType: string;
}

interface GroupedPoint {
  lat: number;
  lng: number;
  count: number;
  totalAmount: number;
  items: CaseData[];
  locationName: string;
}

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });
const MapHeatLayer = dynamic(() => import('./MapHeatLayer'), { ssr: false });

export default function MapView({ startDate, endDate, selectedProvince, selectedBank, selectedType }: MapViewProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [L, setL] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => { setL(leaflet); });
    }
    const loadData = async () => {
      const { atm, branch } = await fetchAllInvestigationData();
      setData([...atm, ...branch]);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(p => {
      const lat = parseFloat(String(p.raw?.Latitude || '').replace(/,/g, ''));
      const lng = parseFloat(String(p.raw?.Longitude || '').replace(/,/g, ''));
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return false;

      if (startDate && p.timestamp && new Date(p.timestamp) < new Date(startDate)) return false;
      if (endDate && p.timestamp && new Date(p.timestamp) > new Date(endDate)) return false;
      if (selectedProvince && !String(p.raw?.[' ภ.จว.'] || p.raw?.['ภ.จว.'] || '').trim().includes(selectedProvince)) return false;
      if (selectedBank && !String(p.bank || '').includes(selectedBank)) return false;
      if (selectedType && p.type !== selectedType) return false;

      const searchStr = searchTerm.toLowerCase();
      return String(p.accountName || '').toLowerCase().includes(searchStr) ||
             String(p.location || '').toLowerCase().includes(searchStr);
    });
  }, [data, searchTerm, startDate, endDate, selectedProvince, selectedBank, selectedType]);

  const groupedPoints = useMemo(() => {
    const groups: { [key: string]: GroupedPoint } = {};
    filteredData.forEach(p => {
      const lat = parseFloat(String(p.raw?.Latitude || '').replace(/,/g, ''));
      const lng = parseFloat(String(p.raw?.Longitude || '').replace(/,/g, ''));
      const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
      if (!groups[key]) {
        groups[key] = { lat, lng, count: 0, totalAmount: 0, items: [], locationName: p.location || 'Unknown' };
      }
      groups[key].count += 1;
      groups[key].totalAmount += (p.amount || 0);
      groups[key].items.push(p);
    });
    return Object.values(groups);
  }, [filteredData]);

  const heatPoints = useMemo(() => {
    return groupedPoints.map(g => [g.lat, g.lng, Math.min(1, g.count / 5)] as [number, number, number]);
  }, [groupedPoints]);

  const flyTo = (lat: number, lng: number) => {
    if (mapInstance) mapInstance.flyTo([lat, lng], 15);
  };

  if (loading || !L) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-6 animate-pulse bg-background">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <MapIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
      </div>
      <p className="text-slate-500 font-black text-xs uppercase tracking-widest leading-none mt-2">Deploying Tactical Grid...</p>
    </div>
  );

  const createTacticalIcon = (count: number, amount: number) => {
    const color = amount > 100000 ? '#ef4444' : amount > 50000 ? '#f59e0b' : '#3b82f6';
    const size = count > 5 ? 36 : count > 2 ? 28 : 22; // ลดขนาดหมุดลงเล็กน้อย
    
    return new L.DivIcon({
      className: 'custom-tactical-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="rounded-full flex items-center justify-center border border-white shadow-lg transition-all duration-500 hover:scale-125" 
               style="background-color: ${color}; width: ${size}px; height: ${size}px;">
            <span class="text-white text-[9px] font-black">${count}</span>
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-1000">
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full xl:w-auto">
          <div>
            <h2 className="text-xl font-black tracking-tighter text-foreground uppercase italic leading-none flex items-center gap-2">
              <LocateFixed className="text-primary" size={20} />
              Tactical Map
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Intelligence Area Analysis</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-border w-full md:w-auto shadow-inner">
            <button onClick={() => setShowHeatmap(false)} className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${!showHeatmap ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}>TACTICAL</button>
            <button onClick={() => setShowHeatmap(true)} className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${showHeatmap ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>HEATMAP</button>
          </div>
        </div>
        <div className="relative group w-full xl:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-primary transition-colors" />
          <input type="text" placeholder="FILTER MAP..." className="w-full bg-slate-50 dark:bg-slate-950 border border-border rounded-2xl py-4 pl-12 pr-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[750px]">
        <div className="w-full lg:w-[400px] bg-card rounded-[3rem] border border-border shadow-xl overflow-hidden flex flex-col transition-colors duration-500">
          <div className="p-8 border-b border-border bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
            <div>
              <h3 className="font-black text-xs text-foreground tracking-[0.2em] uppercase">Intelligence Feed</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Found {groupedPoints.length} Strategic Nodes</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {groupedPoints.sort((a, b) => b.count - a.count).map((g, idx) => (
              <div key={idx} onClick={() => flyTo(g.lat, g.lng)} className="bg-slate-50/50 dark:bg-white/5 p-6 rounded-[2rem] border border-border hover:border-primary transition-all group cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg ${g.totalAmount > 100000 ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {g.count}x
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-foreground text-xs truncate uppercase group-hover:text-primary transition-colors">{g.locationName}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">฿{g.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-card rounded-[3rem] border border-border shadow-2xl overflow-hidden relative z-0">
          <MapContainer center={[8.0, 98.5]} zoom={8} className="w-full h-full" ref={setMapInstance} style={{ background: isDark ? '#020617' : '#f8fafc' }}>
            <TileLayer attribution='&copy; OpenStreetMap' url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
            {showHeatmap && <MapHeatLayer points={heatPoints} />}
            {!showHeatmap && groupedPoints.map((g, idx) => {
              const color = g.totalAmount > 100000 ? '#ef4444' : g.totalAmount > 50000 ? '#f59e0b' : '#3b82f6';
              // ปรับรัศมีวงกลมให้กะทัดรัดขึ้น (Base 500m + 300m per count)
              const circleRadius = 500 + (g.count * 300); 
              return (
                <React.Fragment key={idx}>
                  <Circle center={[g.lat, g.lng]} radius={circleRadius} pathOptions={{ fillColor: color, fillOpacity: 0.08, color: color, weight: 1, dashArray: '3, 6' }} />
                  <Marker position={[g.lat, g.lng]} icon={createTacticalIcon(g.count, g.totalAmount)}>
                    <Popup>
                      <div className="p-4 min-w-[240px] font-sans">
                        <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><ShieldAlert size={20} /></div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tactical Node</p>
                            <p className="text-xs font-black text-slate-800 uppercase leading-tight mt-1">{g.locationName}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="max-h-[80px] overflow-y-auto custom-scrollbar bg-slate-50 p-2 rounded-xl">
                            {g.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-[9px] font-bold text-slate-600 py-1 border-b border-white last:border-0">
                                <span>{item.accountName}</span>
                                <span className="text-primary">฿{item.amount?.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <p className="text-base font-black text-red-600 tracking-tighter">฿{g.totalAmount.toLocaleString()}</p>
                            <button onClick={() => window.open(g.items[0].reportLink, '_blank')} className="p-2 bg-[#0f172a] text-white rounded-lg hover:bg-primary transition-all shadow-lg"><ExternalLink size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>

          <div className="absolute bottom-8 right-8 bg-card/90 backdrop-blur-xl p-6 rounded-[2.5rem] border border-border shadow-2xl z-[1000] hidden md:block">
            <h4 className="text-[9px] font-black text-foreground uppercase tracking-[0.2em] mb-4 border-b border-border pb-2">Indicators</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-red-600"></div><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Critical Node</span></div>
              <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-blue-600"></div><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operational</span></div>
              <div className="flex items-center gap-3"><div className="w-4 h-px border-t border-dashed border-slate-400"></div><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Compact Radius</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
