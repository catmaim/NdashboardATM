'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchAllInvestigationData, CaseData, parseDate } from '@/lib/data-fetcher';
import { 
  ShieldAlert, 
  Search, 
  CreditCard, 
  Building2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Flame,
  Zap,
  Navigation,
  LocateFixed,
  TrendingUp,
  Map as MapIcon,
  Clock,
  MapPin,
  Compass
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';

interface MapViewProps {
  startDate: string;
  endDate: string;
  selectedProvince: string;
  selectedBank: string;
  selectedType: string;
  selectedStatus: string;
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

export default function MapView({ startDate, endDate, selectedProvince, selectedBank, selectedType, selectedStatus }: MapViewProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [L, setL] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const [feedPage, setFeedPage] = useState(1);
  const itemsPerFeedPage = 10;

  const isDark = theme === 'dark';

  const identifyBank = (item: CaseData): string => {
    const bankRaw = item.type === 'atm' ? (item.raw?.['เจ้าของเครื่อง'] || item.bank || '') : (item.bank || '');
    const bankName = String(bankRaw).trim().toUpperCase();
    if (!bankName) return 'อื่นๆ';
    for (const [key, config] of Object.entries(BANK_CONFIG)) {
      if (key === 'อื่นๆ') continue;
      if (config.patterns.some(p => bankName.includes(p.toUpperCase())) || bankName.includes(key.toUpperCase())) return key;
    }
    return bankRaw || 'อื่นๆ';
  };

  const getBankColor = (item: CaseData) => {
    const name = identifyBank(item);
    return BANK_CONFIG[name]?.color || '#94a3b8';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => { setL(leaflet.default || leaflet); });
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
      
      const prov = String(p.raw?.[' ภ.จว.'] || p.raw?.['ภ.จว.'] || '').trim();
      if (selectedProvince && !prov.includes(selectedProvince)) return false;
      
      if (selectedBank) {
        const itemBankStandard = identifyBank(p);
        if (itemBankStandard.toUpperCase() !== selectedBank.toUpperCase()) {
          const bankRaw = p.type === 'atm' ? (p.raw?.['เจ้าของเครื่อง'] || '') : (p.bank || '');
          if (!String(bankRaw).toUpperCase().includes(selectedBank.toUpperCase())) return false;
        }
      }

      if (selectedType && p.type !== selectedType) return false;
      if (selectedStatus && !String(p.status || '').toLowerCase().includes(selectedStatus.toLowerCase())) return false;

      const searchStr = searchTerm.toLowerCase();
      return String(p.accountName || '').toLowerCase().includes(searchStr) ||
             String(p.location || '').toLowerCase().includes(searchStr);
    });
  }, [data, searchTerm, startDate, endDate, selectedProvince, selectedBank, selectedType, selectedStatus]);

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

  const createTacticalIcon = (count: number, amount: number) => {
    if (!L) return null;
    const color = amount > 100000 ? '#ef4444' : amount > 50000 ? '#f59e0b' : '#3b82f6';
    const size = count > 5 ? 36 : count > 2 ? 28 : 22;
    
    return new L.DivIcon({
      className: 'custom-tactical-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute inset-0 rounded-full animate-ping opacity-20" style="background-color: ${color}; animation-duration: 3s;"></div>
          <div class="absolute inset-[-8px] rounded-full animate-pulse opacity-10" style="background-color: ${color};"></div>
          
          <div class="rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xl transition-all duration-500 hover:scale-125 relative z-10" 
               style="background-color: ${color}; width: ${size}px; height: ${size}px;">
            <span class="text-white text-[9px] font-black">${count}</span>
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  const tacticalPoints = useMemo(() => {
    if (!L) return [];
    return groupedPoints.map((g, idx) => {
      const icon = createTacticalIcon(g.count, g.totalAmount);
      return { ...g, icon, idx };
    }).filter(p => !!p.icon);
  }, [groupedPoints, L]);

  if (loading || !L) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-6 animate-pulse bg-background">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <MapIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
      </div>
      <p className="text-slate-500 font-black text-xs uppercase tracking-widest leading-none mt-2">Deploying Tactical Grid...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-1000">
      <style jsx global>{`
        @keyframes custom-ping {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-ping-slow {
          animation: custom-ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
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
            {groupedPoints.sort((a, b) => b.count - a.count)
              .slice((feedPage - 1) * itemsPerFeedPage, feedPage * itemsPerFeedPage)
              .map((g, idx) => (
              <div key={idx} onClick={() => flyTo(g.lat, g.lng)} className="bg-slate-50/50 dark:bg-white/5 p-6 rounded-[2rem] border border-border hover:border-primary transition-all group cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg ${g.totalAmount > 100000 ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {g.count}x
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-foreground text-xs truncate uppercase group-hover:text-primary transition-colors">{g.locationName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-red-600">฿{g.totalAmount.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-300">|</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{g.items[0].type === 'atm' ? 'ATM' : 'BRANCH'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                  {Array.from(new Set(g.items.map(i => identifyBank(i)))).map((bankName, bIdx) => (
                    <span key={bIdx} className="px-2 py-0.5 rounded text-[8px] font-black text-white uppercase shadow-sm" style={{ backgroundColor: BANK_CONFIG[bankName]?.color || '#94a3b8' }}>
                      {bankName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls for Feed */}
          <div className="p-6 border-t border-border bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Page {feedPage} of {Math.ceil(groupedPoints.length / itemsPerFeedPage)}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setFeedPage(p => Math.max(1, p - 1))} 
                disabled={feedPage === 1}
                className="p-2 bg-background border border-border rounded-lg text-slate-400 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setFeedPage(p => Math.min(Math.ceil(groupedPoints.length / itemsPerFeedPage), p + 1))} 
                disabled={feedPage >= Math.ceil(groupedPoints.length / itemsPerFeedPage)}
                className="p-2 bg-background border border-border rounded-lg text-slate-400 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-card rounded-[3rem] border border-border shadow-2xl overflow-hidden relative z-0">
          <MapContainer center={[8.0, 98.5]} zoom={8} className="w-full h-full" ref={setMapInstance} style={{ background: isDark ? '#020617' : '#f8fafc' }}>
            <TileLayer attribution='&copy; OpenStreetMap' url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
            {showHeatmap && <MapHeatLayer points={heatPoints} />}
            {!showHeatmap && tacticalPoints.map((g: any) => {
              const color = g.totalAmount > 100000 ? '#ef4444' : g.totalAmount > 50000 ? '#f59e0b' : '#3b82f6';
              const circleRadius = 500 + (g.count * 300); 
              return (
                <React.Fragment key={g.idx}>
                  <Circle center={[g.lat, g.lng]} radius={circleRadius} pathOptions={{ fillColor: color, fillOpacity: 0.08, color: color, weight: 1, dashArray: '3, 6' }} />
                  <Marker position={[g.lat, g.lng]} icon={g.icon}>
                    <Popup>
                      <div className="p-4 min-w-[320px] font-sans">
                        <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><ShieldAlert size={20} /></div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tactical Node</p>
                            <p className="text-xs font-black text-slate-800 uppercase leading-tight mt-1">{g.locationName}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="max-h-[180px] overflow-y-auto custom-scrollbar bg-slate-50 p-2 rounded-xl space-y-2">
                            {g.items.map((item: any, i: number) => (
                              <div key={i} className="flex flex-col gap-1.5 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-slate-700 uppercase">{item.accountName}</span>
                                  <span className="text-[10px] font-black text-red-600">฿{item.amount?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded text-white uppercase" style={{ backgroundColor: getBankColor(item) }}>
                                    {identifyBank(item)}
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase">
                                    {item.type === 'atm' ? 'ATM' : 'BRANCH'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 pt-1 border-t border-slate-50 mt-1">
                                  <Clock size={10} className="text-blue-500" />
                                  {item.timestamp || 'N/A'}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-col gap-2 pt-2">
                            <div className="flex justify-between items-center">
                              <div className="flex flex-col">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Intelligence</p>
                                <p className="text-lg font-black text-red-600 tracking-tighter">฿{g.totalAmount.toLocaleString()}</p>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`, '_blank')}
                                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 text-[9px] font-black uppercase"
                                  title="Navigate"
                                >
                                  <Compass size={14} /> NAV
                                </button>
                                {g.items[0].reportLink && (
                                  <button 
                                    onClick={() => window.open(g.items[0].reportLink, '_blank')} 
                                    className="p-2.5 bg-[#0f172a] text-white rounded-xl hover:bg-primary transition-all shadow-lg flex items-center gap-2 text-[9px] font-black uppercase"
                                  >
                                    <ExternalLink size={14} /> INTEL
                                  </button>
                                )}
                              </div>
                            </div>
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
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-600"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Critical (&gt; 100K THB)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">High Alert (&gt; 50K THB)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operational (&lt; 50K THB)</span>
              </div>
              <div className="pt-2 border-t border-border flex items-center gap-3">
                <div className="w-4 h-px border-t border-dashed border-slate-400"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dynamic Radius</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
