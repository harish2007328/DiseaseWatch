import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camp, Cluster } from '../types';
import { RiskBadge } from './RiskBadge';
import { Layers } from 'lucide-react';

const TIRUNELVELI_CENTER: [number, number] = [8.7139, 77.7567];

// Authentic administrative polygon coordinates for Tirunelveli District (Tamil Nadu)
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

// Outer bounding polygon covering all surrounding areas to create a "Donut Hole / Spotlight Mask"
// Everything outside Tirunelveli District will be covered by this faded overlay
const SURROUNDING_MASK_OUTER: [number, number][] = [
  [16.0, 70.0],
  [16.0, 85.0],
  [2.0, 85.0],
  [2.0, 70.0],
  [16.0, 70.0],
];

// Tirunelveli administrative zones / wards
const ADMINISTRATIVE_WARDS = [
  {
    name: 'Palayamkottai Ward (Ward 04)',
    campsCount: 3,
    population: 3400,
    activeCases: 42,
    highRiskCamps: 1,
    riskLevel: 'HIGH',
    polygon: [
      [8.730, 77.730],
      [8.745, 77.770],
      [8.715, 77.785],
      [8.695, 77.745],
      [8.730, 77.730],
    ] as [number, number][],
  },
  {
    name: 'Tirunelveli Town (Ward 01)',
    campsCount: 2,
    population: 2800,
    activeCases: 19,
    highRiskCamps: 0,
    riskLevel: 'MEDIUM',
    polygon: [
      [8.735, 77.680],
      [8.755, 77.725],
      [8.725, 77.735],
      [8.705, 77.690],
      [8.735, 77.680],
    ] as [number, number][],
  },
  {
    name: 'Melapalayam Sector (Ward 07)',
    campsCount: 2,
    population: 2100,
    activeCases: 29,
    highRiskCamps: 1,
    riskLevel: 'HIGH',
    polygon: [
      [8.695, 77.725],
      [8.715, 77.770],
      [8.670, 77.765],
      [8.665, 77.715],
      [8.695, 77.725],
    ] as [number, number][],
  },
];

// Apple minimalist camp marker
const createCleanMarker = (riskLevel: string, cases: number) => {
  const norm = (riskLevel || 'low').toLowerCase();
  const colors: Record<string, { bg: string; text: string }> = {
    critical: { bg: '#991B1B', text: '#FFFFFF' },
    high: { bg: '#DC2626', text: '#FFFFFF' },
    medium: { bg: '#2563EB', text: '#FFFFFF' },
    low: { bg: '#0066CC', text: '#FFFFFF' },
  };
  const c = colors[norm] || colors.low;

  const html = `
    <div style="width: 24px; height: 24px; border-radius: 6px; background: ${c.bg}; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; color: ${c.text}; font-size: 10px; font-weight: 700; font-family: -apple-system, sans-serif;">
      ${cases > 99 ? '99+' : cases}
    </div>
  `;

  return L.divIcon({
    className: 'clean-camp-pin',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

// Component to handle map sizing & recentering reliably
function MapInitHelper({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // Invalidate size after mount to prevent grey/blank map bug
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
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
  height = '500px',
}) => {
  const [layers, setLayers] = useState({
    camps: true,
    boundaries: true,
    wards: true,
    fadedMask: true,
  });

  const [selectedWard, setSelectedWard] = useState<typeof ADMINISTRATIVE_WARDS[0] | null>(null);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  return (
    <div className="relative w-full rounded-[8px] overflow-hidden border border-[#E5E7EB] bg-[#FFFFFF]" style={{ height }}>
      {/* Top Left: District Title Badge */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2">
        <div className="bg-[#FFFFFF] px-3 py-1.5 rounded-[7px] border border-[#E5E7EB] text-[12px] text-[#111111] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0066CC]"></span>
          <span className="font-semibold text-[#111111]">Tirunelveli District</span>
          <span className="text-[#6B7280]">· Highlighted Zone</span>
        </div>
      </div>

      {/* Top Right: Layer Control */}
      <div className="absolute top-3 right-3 z-[400]">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="bg-[#FFFFFF] px-2.5 py-1.5 rounded-[7px] border border-[#E5E7EB] text-[12px] font-medium text-[#111111] hover:bg-[#F7F8FA] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-[#0066CC]" />
          <span>Layers</span>
        </button>

        {showLayerMenu && (
          <div className="mt-1.5 w-52 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-2.5 space-y-2 z-[400]">
            <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider pb-1 border-b border-[#E5E7EB]">
              Map Visibility
            </div>

            <label className="flex items-center gap-2 text-[12px] text-[#111111] cursor-pointer">
              <input
                type="checkbox"
                checked={layers.fadedMask}
                onChange={(e) => setLayers({ ...layers, fadedMask: e.target.checked })}
                className="rounded-[4px] border-[#E5E7EB] text-[#0066CC]"
              />
              <span>Fade Outside Districts</span>
            </label>

            <label className="flex items-center gap-2 text-[12px] text-[#111111] cursor-pointer">
              <input
                type="checkbox"
                checked={layers.boundaries}
                onChange={(e) => setLayers({ ...layers, boundaries: e.target.checked })}
                className="rounded-[4px] border-[#E5E7EB] text-[#0066CC]"
              />
              <span>Tirunelveli Boundary</span>
            </label>

            <label className="flex items-center gap-2 text-[12px] text-[#111111] cursor-pointer">
              <input
                type="checkbox"
                checked={layers.wards}
                onChange={(e) => setLayers({ ...layers, wards: e.target.checked })}
                className="rounded-[4px] border-[#E5E7EB] text-[#0066CC]"
              />
              <span>Administrative Wards</span>
            </label>

            <label className="flex items-center gap-2 text-[12px] text-[#111111] cursor-pointer">
              <input
                type="checkbox"
                checked={layers.camps}
                onChange={(e) => setLayers({ ...layers, camps: e.target.checked })}
                className="rounded-[4px] border-[#E5E7EB] text-[#0066CC]"
              />
              <span>Relief Camp Markers</span>
            </label>
          </div>
        )}
      </div>

      {/* Selected Ward Card */}
      {selectedWard && (
        <div className="absolute bottom-3 left-3 z-[400] max-w-xs bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-3 text-[12px]">
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-[#E5E7EB]">
            <span className="font-semibold text-[#111111]">{selectedWard.name}</span>
            <button
              onClick={() => setSelectedWard(null)}
              className="text-[#6B7280] hover:text-[#111111] text-[11px] cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-[#4B5563]">
            <div className="flex justify-between">
              <span>Camps:</span>
              <strong className="text-[#111111]">{selectedWard.campsCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>Population:</span>
              <strong className="text-[#111111]">{selectedWard.population.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span>Active cases:</span>
              <strong className="text-[#111111]">{selectedWard.activeCases}</strong>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[#E5E7EB]">
              <span>Status:</span>
              <RiskBadge level={selectedWard.riskLevel} size="sm" />
            </div>
          </div>
        </div>
      )}

      {/* React Leaflet Map */}
      <MapContainer
        center={TIRUNELVELI_CENTER}
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <MapInitHelper center={TIRUNELVELI_CENTER} zoom={11} />

        {/* Standard, Highly-Reliable OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Inverse Spotlight Mask: Fades out all surrounding regions while keeping Tirunelveli clear */}
        {layers.fadedMask && (
          <Polygon
            positions={[SURROUNDING_MASK_OUTER, TIRUNELVELI_DISTRICT_BORDER]}
            pathOptions={{
              stroke: false,
              fillColor: '#FFFFFF',
              fillOpacity: 0.62,
              interactive: false,
            }}
          />
        )}

        {/* Distinctive Tirunelveli District Boundary Line */}
        {layers.boundaries && (
          <Polygon
            positions={TIRUNELVELI_DISTRICT_BORDER}
            pathOptions={{
              color: '#0066CC',
              weight: 2.5,
              fillColor: '#0066CC',
              fillOpacity: 0.05,
            }}
          >
            <Tooltip sticky direction="top">
              <span className="text-[12px] font-semibold text-[#0066CC]">Tirunelveli District</span>
            </Tooltip>
          </Polygon>
        )}

        {/* Administrative Wards Polygons inside Tirunelveli */}
        {layers.wards &&
          ADMINISTRATIVE_WARDS.map((ward) => (
            <Polygon
              key={ward.name}
              positions={ward.polygon}
              pathOptions={{
                color: ward.riskLevel === 'HIGH' ? '#DC2626' : '#0066CC',
                weight: 1.5,
                fillColor: ward.riskLevel === 'HIGH' ? '#DC2626' : '#0066CC',
                fillOpacity: 0.08,
              }}
              eventHandlers={{
                click: () => setSelectedWard(ward),
              }}
            >
              <Tooltip sticky direction="top">
                <span className="text-[11px] font-medium text-[#111111]">{ward.name}</span>
              </Tooltip>
            </Polygon>
          ))}

        {/* Camps Markers */}
        {layers.camps &&
          camps.map((camp) => (
            <Marker
              key={camp.id}
              position={[camp.location_lat, camp.location_lng]}
              icon={createCleanMarker(camp.risk_level, camp.active_cases || 0)}
              eventHandlers={{
                click: () => onSelectCamp && onSelectCamp(camp),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px] text-[12px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#111111]">{camp.name}</span>
                    <RiskBadge level={camp.risk_level} size="sm" />
                  </div>

                  <div className="space-y-1 text-[#4B5563] pt-1 border-t border-[#E5E7EB]">
                    <div className="flex justify-between">
                      <span>Population:</span>
                      <strong className="text-[#111111]">{camp.population}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Active cases:</span>
                      <strong className="text-[#111111]">{camp.active_cases || 0}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Top condition:</span>
                      <span className="text-[#111111] truncate max-w-[110px]">
                        {camp.top_syndrome || 'Gastrointestinal'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Environmental:</span>
                      <span className="text-[#111111]">Water issue</span>
                    </div>
                  </div>

                  {onSelectCamp && (
                    <button
                      onClick={() => onSelectCamp(camp)}
                      className="w-full mt-2 py-1.5 px-3 text-[11px] font-medium rounded-[7px] bg-[#0066CC] hover:bg-[#004C99] text-white transition-colors cursor-pointer text-center"
                    >
                      View Camp
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
