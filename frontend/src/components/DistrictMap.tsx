import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Camp, Cluster } from '../types';
import { RiskBadge } from './RiskBadge';
import { Users, Activity, Droplets, Crosshair } from 'lucide-react';

// Tirunelveli District Geographic Coordinates
const TIRUNELVELI_CENTER: [number, number] = [8.7139, 77.7567];

// Accurate boundary perimeter for Tirunelveli District (Southern Tamil Nadu)
const TIRUNELVELI_DISTRICT_BORDER: [number, number][] = [
  [9.020, 77.620],
  [9.055, 77.710],
  [9.080, 77.800],
  [9.040, 77.870],
  [8.940, 77.940],
  [8.840, 77.980],
  [8.730, 77.995],
  [8.610, 77.960],
  [8.490, 77.910],
  [8.360, 77.870],
  [8.250, 77.810],
  [8.180, 77.710],
  [8.220, 77.600],
  [8.330, 77.520],
  [8.440, 77.440],
  [8.540, 77.380],
  [8.650, 77.350],
  [8.730, 77.400],
  [8.810, 77.470],
  [8.920, 77.540],
  [9.020, 77.620],
];

// Inner urban surveillance zones (Tirunelveli Town, Palayamkottai, Melapalayam)
const URBAN_ZONE_BORDER: [number, number][] = [
  [8.745, 77.695],
  [8.752, 77.745],
  [8.735, 77.785],
  [8.695, 77.775],
  [8.685, 77.725],
  [8.705, 77.690],
  [8.745, 77.695],
];

// Custom sleek pins
const createCustomMarker = (riskLevel: string, cases: number) => {
  const colors: Record<string, { bg: string; ring: string; text: string }> = {
    critical: { bg: '#e11d48', ring: 'rgba(225, 29, 72, 0.35)', text: '#ffffff' },
    high: { bg: '#f97316', ring: 'rgba(249, 115, 22, 0.35)', text: '#ffffff' },
    medium: { bg: '#f59e0b', ring: 'rgba(245, 158, 11, 0.3)', text: '#ffffff' },
    low: { bg: '#10b981', ring: 'rgba(16, 185, 129, 0.3)', text: '#ffffff' },
  };
  const c = colors[riskLevel.toLowerCase()] || colors.low;

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${c.ring}; animation: pulse 2s infinite;"></div>
      <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: ${c.bg}; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: ${c.text}; font-size: 11px; font-weight: 800; font-family: system-ui, sans-serif;">
        ${cases > 99 ? '99+' : cases}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-camp-pin',
    html,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

function MapViewRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface DistrictMapProps {
  camps: Camp[];
  clusters?: Cluster[];
  selectedCampId?: string | null;
  onSelectCamp?: (camp: Camp) => void;
  height?: string;
}

export const DistrictMap: React.FC<DistrictMapProps> = ({
  camps,
  clusters = [],
  selectedCampId,
  onSelectCamp,
  height = '520px',
}) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-50" style={{ height }}>
      {/* Floating Header Badges */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
          <span>Tirunelveli District Grid</span>
          <span className="text-[10px] text-slate-400 font-normal">| Tamil Nadu</span>
        </div>
      </div>

      {/* Floating Minimal Legend */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-[11px] font-medium flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
          <span className="text-slate-700">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span className="text-slate-700">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-700">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-700">Low</span>
        </div>
      </div>

      <MapContainer
        center={TIRUNELVELI_CENTER}
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <MapViewRecenter center={TIRUNELVELI_CENTER} zoom={11} />

        {/* Premium CartoDB Voyager Tile Layer - Crisp, Light, Beautiful Aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Real Tirunelveli District Administrative Border */}
        <Polygon
          positions={TIRUNELVELI_DISTRICT_BORDER}
          pathOptions={{
            color: '#0284c7',
            weight: 2.5,
            dashArray: '6, 6',
            fillColor: '#38bdf8',
            fillOpacity: 0.05,
          }}
        >
          <Tooltip sticky direction="top">
            <span className="text-xs font-bold text-sky-900">Tirunelveli District Boundary</span>
          </Tooltip>
        </Polygon>

        {/* Urban Relief Hotspot Core (Palayamkottai / Melapalayam / Tirunelveli Town) */}
        <Polygon
          positions={URBAN_ZONE_BORDER}
          pathOptions={{
            color: '#6366f1',
            weight: 1.5,
            fillColor: '#818cf8',
            fillOpacity: 0.08,
          }}
        >
          <Tooltip sticky direction="top">
            <span className="text-xs font-semibold text-indigo-900">High-Density Urban Evacuee Sector</span>
          </Tooltip>
        </Polygon>

        {/* Camp Location Pins */}
        {camps.map((camp) => (
          <Marker
            key={camp.id}
            position={[camp.location_lat, camp.location_lng]}
            icon={createCustomMarker(camp.risk_level, camp.active_cases || 0)}
            eventHandlers={{
              click: () => onSelectCamp && onSelectCamp(camp),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[210px] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900">{camp.name}</h4>
                  <RiskBadge level={camp.risk_level} size="sm" showPulse={false} />
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {camp.ward || 'Central'}, Tirunelveli
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div className="bg-slate-50 p-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-semibold">POPULATION</span>
                    <strong className="text-slate-800">{camp.population.toLocaleString()}</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-semibold">ACTIVE CASES</span>
                    <strong className="text-rose-600">{camp.active_cases || 0}</strong>
                  </div>
                </div>

                {camp.top_syndrome && (
                  <div className="text-xs text-sky-800 bg-sky-50 px-2 py-1 rounded-md font-semibold">
                    {camp.top_syndrome}
                  </div>
                )}

                {onSelectCamp && (
                  <button
                    onClick={() => onSelectCamp(camp)}
                    className="w-full mt-1 py-1.5 px-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer text-center"
                  >
                    View Camp Dossier
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
