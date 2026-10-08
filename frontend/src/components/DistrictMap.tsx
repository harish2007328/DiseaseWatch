import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Camp, Cluster } from '../types';
import { RiskBadge } from './RiskBadge';
import { AlertCircle, Users, Activity, Droplets } from 'lucide-react';

// Fix Leaflet marker icon paths in bundler
const createCustomMarker = (riskLevel: string) => {
  const colors: Record<string, string> = {
    critical: '#e11d48', // rose-600
    high: '#f97316',     // orange-500
    medium: '#f59e0b',   // amber-500
    low: '#10b981',      // emerald-500
  };
  const color = colors[riskLevel.toLowerCase()] || '#64748b';

  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M16 0C7.16 0 0 7.16 0 16c0 10.5 16 26 16 26s16-15.5 16-26C32 7.16 24.84 0 16 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="16" cy="15" r="7" fill="#ffffff" />
      <circle cx="16" cy="15" r="4" fill="${color}" />
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svgHtml,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
};

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
  height = '500px',
}) => {
  const centerLat = camps.length > 0 ? camps[0].location_lat : 13.0827;
  const centerLng = camps.length > 0 ? camps[0].location_lng : 80.2707;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100" style={{ height }}>
      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-400 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-md text-xs">
        <span className="font-bold text-slate-800 block mb-1.5 uppercase tracking-wider text-[10px]">
          Surveillance Zones
        </span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span className="text-slate-600">Critical Alert</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-slate-600">High Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-600">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600">Controlled</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Cluster hazard buffer circles */}
        {clusters.map((cluster) => (
          <Circle
            key={cluster.id}
            center={[cluster.center_lat, cluster.center_lng]}
            radius={(cluster.radius_km || 1.5) * 1000}
            pathOptions={{
              color: '#e11d48',
              fillColor: '#f43f5e',
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '6, 6',
            }}
          >
            <Popup>
              <div className="p-2 space-y-1">
                <div className="font-bold text-rose-700 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Cluster Detected
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Syndrome:</strong> {cluster.common_syndrome}
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Total Cluster Cases:</strong> {cluster.total_cases}
                </div>
                <div className="text-xs text-slate-500">
                  {cluster.affected_camps.length} camps in high proximity
                </div>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Camp markers */}
        {camps.map((camp) => (
          <Marker
            key={camp.id}
            position={[camp.location_lat, camp.location_lng]}
            icon={createCustomMarker(camp.risk_level)}
            eventHandlers={{
              click: () => onSelectCamp && onSelectCamp(camp),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[220px]">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{camp.name}</h4>
                </div>
                <div className="mb-2">
                  <RiskBadge level={camp.risk_level} size="sm" />
                </div>
                
                <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users className="w-3.5 h-3.5" /> Population:
                    </span>
                    <span className="font-medium text-slate-800">{camp.population.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Activity className="w-3.5 h-3.5" /> Active Incidents:
                    </span>
                    <span className="font-semibold text-rose-600">{camp.active_cases}</span>
                  </div>
                  {camp.top_syndrome && (
                    <div className="pt-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Suspected Syndrome:</span>
                      <div className="text-sky-700 font-medium">{camp.top_syndrome}</div>
                    </div>
                  )}
                  {camp.environmental_issues && camp.environmental_issues.length > 0 && (
                    <div className="pt-1 text-[11px]">
                      <span className="font-semibold text-amber-800 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-amber-600" /> Env Risk:
                      </span>
                      <div className="text-amber-700">{camp.environmental_issues.join(', ')}</div>
                    </div>
                  )}
                </div>

                {onSelectCamp && (
                  <button
                    onClick={() => onSelectCamp(camp)}
                    className="mt-3 w-full py-1 px-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors text-center"
                  >
                    View Camp Health Dossier
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
