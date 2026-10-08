import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camp, Cluster } from '../types';
import { RiskBadge } from './RiskBadge';
import { Crosshair, Compass } from 'lucide-react';
import tirunelveliBoundary from '../data/tirunelveli_boundary.json';

// Centers
const TIRUNELVELI_DISTRICT_CENTER: [number, number] = [8.550, 77.580];
const DEFAULT_CAMPS_CENTER: [number, number] = [8.724, 77.715];

// Robust Leaflet Camp Marker Icon (Explicit pixel size to prevent 0px layout collapse)
const createCampMarkerIcon = (riskLevel: string, cases: number, isSelected: boolean) => {
  const norm = (riskLevel || 'low').toLowerCase();
  const colors: Record<string, { bg: string; border: string }> = {
    critical: { bg: '#DC2626', border: '#991B1B' },
    high: { bg: '#EA580C', border: '#C2410C' },
    medium: { bg: '#D97706', border: '#B45309' },
    low: { bg: '#0066CC', border: '#004C99' },
  };
  const c = colors[norm] || colors.low;
  const size = isSelected ? 34 : 28;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${c.bg};
      border: 3px solid #FFFFFF;
      box-shadow: 0 3px 8px rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: pointer;
      ${isSelected ? 'outline: 3px solid #0066CC; outline-offset: 2px;' : ''}
    ">
      ${cases > 0 ? cases : '●'}
    </div>
  `;

  return L.divIcon({
    className: 'camp-pin-circle',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 6],
  });
};

// Component to guarantee proper sizing and auto-fit to camps
function MapAutoFitter({
  camps,
  viewMode,
}: {
  camps: Camp[];
  viewMode: 'camps' | 'district';
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size to guarantee tiles and markers render crisply on mount
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);

  useEffect(() => {
    if (viewMode === 'district') {
      map.setView(TIRUNELVELI_DISTRICT_CENTER, 10, { animate: true });
      return;
    }

    if (camps && camps.length > 0) {
      const validPoints: [number, number][] = camps
        .filter((c) => c.location_lat != null && c.location_lng != null)
        .map((c) => [Number(c.location_lat), Number(c.location_lng)]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13,
          animate: true,
        });
      }
    }
  }, [camps, viewMode, map]);

  return null;
}

// Pan to camp when clicked/selected
function PanToSelectedCamp({ camp }: { camp?: Camp }) {
  const map = useMap();
  useEffect(() => {
    if (camp && camp.location_lat != null && camp.location_lng != null) {
      map.setView([Number(camp.location_lat), Number(camp.location_lng)], 14, {
        animate: true,
      });
    }
  }, [camp, map]);
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
  camps = [],
  clusters = [],
  selectedCampId,
  onSelectCamp,
  height = '520px',
}) => {
  const [viewMode, setViewMode] = useState<'camps' | 'district'>('camps');

  const selectedCamp = camps.find((c) => c.id === selectedCampId);

  return (
    <div
      className="relative w-full rounded-[8px] overflow-hidden border border-[#E5E7EB] bg-[#F7F8FA]"
      style={{ height }}
    >
      {/* Top Left: District Badge */}
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

      {/* Top Right: View Controls */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 bg-[#FFFFFF] p-1 rounded-[8px] border border-[#E5E7EB] shadow-sm">
        <button
          onClick={() => setViewMode('camps')}
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
          onClick={() => setViewMode('district')}
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

      {/* Bottom Right: Risk Legend */}
      <div className="absolute bottom-3 right-3 z-[400] bg-[#FFFFFF] px-3 py-2 rounded-[7px] border border-[#E5E7EB] text-[11px] text-[#4B5563] shadow-sm flex items-center gap-3">
        <span className="font-semibold text-[#111111]">Risk:</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0066CC]"></span>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
          <span>Critical</span>
        </div>
      </div>

      {/* React Leaflet Map */}
      <MapContainer
        center={DEFAULT_CAMPS_CENTER}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <MapAutoFitter camps={camps} viewMode={viewMode} />
        {selectedCamp && <PanToSelectedCamp camp={selectedCamp} />}

        {/* Clean OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Authentic Tirunelveli District Administrative Boundary */}
        <GeoJSON
          key="tirunelveli-official-boundary"
          data={tirunelveliBoundary as any}
          interactive={false}
          style={() => ({
            color: '#0066CC',
            weight: 2.2,
            opacity: 0.85,
            fillColor: '#0066CC',
            fillOpacity: 0.04,
            dashArray: '5, 5',
          })}
        />

        {/* Relief Camp Pins */}
        {camps.map((camp) => {
          const lat = Number(camp.location_lat);
          const lng = Number(camp.location_lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          const isSelected = selectedCampId === camp.id;
          const label = camp.ward || camp.name.split(' - ')[1] || camp.name;

          return (
            <Marker
              key={camp.id}
              position={[lat, lng]}
              icon={createCampMarkerIcon(camp.risk_level, camp.active_cases || 0, isSelected)}
              eventHandlers={{
                click: () => onSelectCamp && onSelectCamp(camp),
              }}
            >
              {/* Permanent Station Name Badge below the pin */}
              <Tooltip
                permanent
                direction="bottom"
                offset={[0, 18]}
                className="clean-camp-tooltip"
              >
                <span className="font-semibold text-[11px] text-[#111111] whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-sm border border-[#E5E7EB]">
                  {label}
                </span>
              </Tooltip>

              <Popup>
                <div className="p-1 min-w-[210px] text-[12px] space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E5E7EB]">
                    <span className="font-semibold text-[#111111]">{camp.name}</span>
                    <RiskBadge level={camp.risk_level} size="sm" />
                  </div>

                  <div className="space-y-1 text-[#4B5563]">
                    <div className="flex justify-between">
                      <span>Sector / Ward:</span>
                      <strong className="text-[#111111]">{camp.ward || 'Tirunelveli'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Population:</span>
                      <strong className="text-[#111111]">{camp.population?.toLocaleString() || '1,000'}</strong>
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
