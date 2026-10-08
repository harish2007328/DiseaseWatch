import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camp, Cluster } from '../types';
import { RiskBadge } from './RiskBadge';
import { Layers, Crosshair, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import tirunelveliBoundary from '../data/tirunelveli_boundary.json';

// Authentic Geographic Centers
const TIRUNELVELI_DISTRICT_CENTER: [number, number] = [8.550, 77.580]; // Center of entire Tirunelveli district
const CAMPS_CLUSTER_CENTER: [number, number] = [8.724, 77.720]; // Center of Tirunelveli relief camp stations

// Custom SVG Pin Generator for Leaflet
const createPinIcon = (camp: Camp, isSelected: boolean) => {
  const norm = (camp.risk_level || 'low').toLowerCase();
  const colors: Record<string, { bg: string; border: string; glow: string }> = {
    critical: { bg: '#DC2626', border: '#991B1B', glow: 'rgba(220, 38, 38, 0.4)' },
    high: { bg: '#EA580C', border: '#C2410C', glow: 'rgba(234, 88, 12, 0.35)' },
    medium: { bg: '#D97706', border: '#B45309', glow: 'rgba(217, 119, 6, 0.3)' },
    low: { bg: '#0066CC', border: '#004C99', glow: 'rgba(0, 102, 204, 0.3)' },
  };
  const c = colors[norm] || colors.low;

  // Short label from name: e.g. "Palayamkottai", "Town", "Melapalayam"
  let shortName = camp.ward || camp.name.split(' - ')[1] || camp.name;
  shortName = shortName.replace(/\(.*?\)/g, '').trim();
  if (shortName.length > 15) shortName = shortName.substring(0, 13) + '…';

  const cases = camp.active_cases || 0;

  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
      <!-- Pin Marker -->
      <div style="
        position: relative;
        width: 30px;
        height: 38px;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.28));
        transition: transform 0.2s ease;
      ">
        <svg viewBox="0 0 24 30" width="30" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 18 12 18s12-9.5 12-18c0-6.627-5.373-12-12-12z" fill="${c.bg}" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="11" r="5.5" fill="#FFFFFF"/>
          <circle cx="12" cy="11" r="3.5" fill="${c.bg}"/>
        </svg>
        ${
          isSelected
            ? `<div style="
                position: absolute;
                top: 2px;
                left: 2px;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                border: 2px solid #FFFFFF;
                box-shadow: 0 0 10px 4px ${c.glow};
                animation: pulse 1.8s infinite;
              "></div>`
            : ''
        }
      </div>

      <!-- Station Name Tag -->
      <div style="
        margin-top: 2px;
        background: #FFFFFF;
        color: #111111;
        border: 1px solid #E5E7EB;
        box-shadow: 0 2px 4px rgba(0,0,0,0.12);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 10px;
        font-weight: 600;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${c.bg};"></span>
        <span>${shortName}</span>
        ${cases > 0 ? `<span style="color: ${c.bg}; font-weight: 700;">(${cases})</span>` : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-camp-pin',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -42],
  });
};

// Map controller component for smooth transitions
function MapViewController({
  targetCenter,
  targetZoom,
}: {
  targetCenter: [number, number];
  targetZoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(targetCenter, targetZoom, { duration: 1.0 });
    // Invalidate size to ensure crisp rendering
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [targetCenter, targetZoom, map]);

  return null;
}

interface DistrictMapProps {
  camps: Camp[];
  clusters?: Cluster[];
  selectedCampId?: string | null;
  onSelectCamp?: (camp: Camp) => void;
  height?: string;
  defaultViewMode?: 'camps' | 'district';
}

export const DistrictMap: React.FC<DistrictMapProps> = ({
  camps,
  clusters = [],
  selectedCampId,
  onSelectCamp,
  height = '520px',
  defaultViewMode = 'camps',
}) => {
  const [viewMode, setViewMode] = useState<'camps' | 'district'>(defaultViewMode);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    defaultViewMode === 'camps' ? CAMPS_CLUSTER_CENTER : TIRUNELVELI_DISTRICT_CENTER
  );
  const [mapZoom, setMapZoom] = useState<number>(defaultViewMode === 'camps' ? 13 : 10);
  const [showBoundary, setShowBoundary] = useState(true);

  // When selectedCampId changes, automatically focus on it
  useEffect(() => {
    if (selectedCampId) {
      const targetCamp = camps.find((c) => c.id === selectedCampId);
      if (targetCamp) {
        setMapCenter([targetCamp.location_lat, targetCamp.location_lng]);
        setMapZoom(14);
        setViewMode('camps');
      }
    }
  }, [selectedCampId, camps]);

  const handleFocusCamps = () => {
    setViewMode('camps');
    setMapCenter(CAMPS_CLUSTER_CENTER);
    setMapZoom(13);
  };

  const handleFocusDistrict = () => {
    setViewMode('district');
    setMapCenter(TIRUNELVELI_DISTRICT_CENTER);
    setMapZoom(10);
  };

  return (
    <div className="relative w-full rounded-[8px] overflow-hidden border border-[#E5E7EB] bg-[#F7F8FA]" style={{ height }}>
      {/* Top Left: District & Relief Badge */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2">
        <div className="bg-[#FFFFFF] px-3 py-1.5 rounded-[7px] border border-[#E5E7EB] text-[12px] text-[#111111] shadow-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0066CC]"></span>
          <span className="font-semibold text-[#111111]">Tirunelveli District</span>
          <span className="text-[#6B7280]">·</span>
          <span className="text-[#4B5563] font-medium">
            {camps.length} Active Relief Stations
          </span>
        </div>
      </div>

      {/* Top Right: View Controls (Focus Camps vs Entire District) */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 bg-[#FFFFFF] p-1 rounded-[8px] border border-[#E5E7EB] shadow-sm">
        <button
          onClick={handleFocusCamps}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-[5px] flex items-center gap-1.5 transition-colors cursor-pointer ${
            viewMode === 'camps'
              ? 'bg-[#EAF3FF] text-[#0066CC]'
              : 'text-[#4B5563] hover:text-[#111111] hover:bg-[#F7F8FA]'
          }`}
          title="Zoom to relief camps area with clear spacing"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Focus Camps</span>
        </button>

        <button
          onClick={handleFocusDistrict}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-[5px] flex items-center gap-1.5 transition-colors cursor-pointer ${
            viewMode === 'district'
              ? 'bg-[#EAF3FF] text-[#0066CC]'
              : 'text-[#4B5563] hover:text-[#111111] hover:bg-[#F7F8FA]'
          }`}
          title="View full Tirunelveli district administrative boundary"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>District Boundary</span>
        </button>
      </div>

      {/* Bottom Right: Map Legend */}
      <div className="absolute bottom-3 right-3 z-[400] bg-[#FFFFFF] px-3 py-2 rounded-[7px] border border-[#E5E7EB] text-[11px] text-[#4B5563] shadow-sm flex items-center gap-3">
        <span className="font-semibold text-[#111111]">Risk:</span>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#0066CC]"></span>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#EA580C]"></span>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
          <span>Critical</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <MapViewController targetCenter={mapCenter} targetZoom={mapZoom} />

        {/* Crisp OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Authentic Official Tirunelveli Administrative Boundary */}
        {showBoundary && (
          <GeoJSON
            data={tirunelveliBoundary as any}
            style={() => ({
              color: '#0066CC',
              weight: 2.2,
              opacity: 0.85,
              fillColor: '#0066CC',
              fillOpacity: 0.04,
              dashArray: '4, 4',
            })}
          />
        )}

        {/* Relief Camp Pins */}
        {camps.map((camp) => {
          const isSelected = selectedCampId === camp.id;
          return (
            <Marker
              key={camp.id}
              position={[camp.location_lat, camp.location_lng]}
              icon={createPinIcon(camp, isSelected)}
              eventHandlers={{
                click: () => onSelectCamp && onSelectCamp(camp),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[210px] text-[12px] space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E5E7EB]">
                    <span className="font-semibold text-[#111111]">{camp.name}</span>
                    <RiskBadge level={camp.risk_level} size="sm" />
                  </div>

                  <div className="space-y-1 text-[#4B5563]">
                    <div className="flex justify-between">
                      <span>Taluk / Sector:</span>
                      <strong className="text-[#111111]">{camp.ward || 'Tirunelveli'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Population:</span>
                      <strong className="text-[#111111]">{camp.population.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Cases:</span>
                      <strong className="text-[#DC2626]">{camp.active_cases || 0}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Top Condition:</span>
                      <span className="text-[#111111] truncate max-w-[120px]">
                        {camp.top_syndrome || 'Gastrointestinal'}
                      </span>
                    </div>
                  </div>

                  {onSelectCamp && (
                    <button
                      onClick={() => onSelectCamp(camp)}
                      className="w-full mt-2 py-1.5 px-3 text-[11px] font-medium rounded-[6px] bg-[#0066CC] hover:bg-[#004C99] text-white transition-colors cursor-pointer text-center"
                    >
                      Inspect Camp Station
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default DistrictMap;
