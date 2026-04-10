'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

interface HeatLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

export default function MapHeatLayer({ points }: HeatLayerProps) {
  const map = useMap();
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadLeaflet = async () => {
        const leaflet = await import('leaflet');
        // @ts-ignore
        await import('leaflet.heat');
        setL(leaflet.default || leaflet);
      };
      loadLeaflet();
    }
  }, []);

  useEffect(() => {
    if (!map || !points.length || !L || !L.heatLayer) return;

    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.4: '#3b82f6', // Blue (Low)
        0.6: '#10b981', // Green (Medium)
        0.7: '#f59e0b', // Orange (High)
        1.0: '#ef4444'  // Red (Very High)
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, L]);

  return null;
}
