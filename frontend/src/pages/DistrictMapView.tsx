import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { getCamps, detectClusters } from '../services/api';
import { Camp, Cluster } from '../types';
import { DistrictMap } from '../components/DistrictMap';
import { RiskBadge } from '../components/RiskBadge';

export const DistrictMapView: React.FC = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, clRes] = await Promise.all([getCamps(), detectClusters()]);
      setCamps(cRes.data || []);
      setClusters(clRes.data?.clusters || []);
      if (cRes.data && cRes.data.length > 0) {
        setSelectedCamp(cRes.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCamps = camps.filter((c) => {
    if (riskFilter === 'all') return true;
    return c.risk_level === riskFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#111111]">
            District GIS Surveillance
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Tirunelveli District · Real geographic boundary, wards & camp deployment
          </p>
        </div>

        {/* Minimal Risk Filter */}
        <div className="flex bg-[#F2F3F5] p-1 rounded-[7px] self-start sm:self-auto">
          {['all', 'critical', 'high', 'medium', 'low'].map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-[5px] capitalize transition-colors cursor-pointer ${
                riskFilter === level
                  ? 'bg-[#FFFFFF] text-[#111111]'
                  : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Box */}
      <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB]">
        <DistrictMap
          camps={filteredCamps}
          clusters={clusters}
          selectedCampId={selectedCamp?.id}
          onSelectCamp={(camp) => setSelectedCamp(camp)}
          height="540px"
        />
      </div>

      {/* Selected Camp Information Card (Apple Style) */}
      {selectedCamp && (
        <div className="bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E5E7EB]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-semibold text-[#111111]">
                  {selectedCamp.name}
                </h3>
                <RiskBadge level={selectedCamp.risk_level} size="sm" />
              </div>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                {selectedCamp.ward || 'Central'}, Tirunelveli · Lat {selectedCamp.location_lat.toFixed(4)}, Lng {selectedCamp.location_lng.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
            <div className="p-3 rounded-[7px] bg-[#F7F8FA] border border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[11px]">Population</span>
              <strong className="text-[16px] font-semibold text-[#111111]">{selectedCamp.population.toLocaleString()}</strong>
            </div>

            <div className="p-3 rounded-[7px] bg-[#F7F8FA] border border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[11px]">Active Cases</span>
              <strong className="text-[16px] font-semibold text-[#DC2626]">{selectedCamp.active_cases || 0}</strong>
            </div>

            <div className="p-3 rounded-[7px] bg-[#F7F8FA] border border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[11px]">Primary Condition</span>
              <strong className="text-[14px] font-medium text-[#111111] truncate block mt-0.5">
                {selectedCamp.top_syndrome || 'Gastrointestinal'}
              </strong>
            </div>

            <div className="p-3 rounded-[7px] bg-[#F7F8FA] border border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[11px]">Environmental Status</span>
              <strong className="text-[14px] font-medium text-[#111111] block mt-0.5">
                Water Contamination
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
