'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

export default function MapHeatLayer({ points }: HeatLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    // @ts-ignore
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
  }, [map, points]);

  return null;
}
