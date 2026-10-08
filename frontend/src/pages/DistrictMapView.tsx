import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Layers, RefreshCw, Users, Activity, Droplets } from 'lucide-react';
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
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600" />
            Tirunelveli District Surveillance Map
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Southern Tamil Nadu relief camp coordinates and administrative border
          </p>
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs bg-slate-100 p-1 rounded-xl">
            {['all', 'critical', 'high', 'medium', 'low'].map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-all ${
                  riskFilter === level ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map (8 cols) */}
        <div className="lg:col-span-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs min-h-[580px]">
          <DistrictMap
            camps={filteredCamps}
            clusters={clusters}
            selectedCampId={selectedCamp?.id}
            onSelectCamp={(c) => setSelectedCamp(c)}
            height="580px"
          />
        </div>

        {/* Selected Camp Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedCamp ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">{selectedCamp.name}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedCamp.ward} • {selectedCamp.district}
                  </p>
                </div>
                <RiskBadge level={selectedCamp.risk_level} size="md" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Population</span>
                  <strong className="text-slate-800 text-sm">
                    {selectedCamp.population.toLocaleString()}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Active Cases</span>
                  <strong className="text-rose-600 text-sm">{selectedCamp.active_cases}</strong>
                </div>
              </div>

              {selectedCamp.top_syndrome && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs">
                  <span className="text-[10px] uppercase font-bold text-sky-700 block mb-0.5">
                    Suspected Syndromic Pattern
                  </span>
                  <div className="font-bold text-sky-950">{selectedCamp.top_syndrome}</div>
                </div>
              )}

              {selectedCamp.environmental_issues && selectedCamp.environmental_issues.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block mb-1 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-amber-600" /> Environmental Triggers
                  </span>
                  <div className="text-amber-900 font-medium">
                    {selectedCamp.environmental_issues.join(', ')}
                  </div>
                </div>
              )}

              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <div>
                  <strong>Health Reports Logged:</strong> {selectedCamp.health_report_count}
                </div>
                <div>
                  <strong>Environmental Hazards:</strong> {selectedCamp.environmental_report_count}
                </div>
                <div>
                  <strong>Coordinates:</strong> {selectedCamp.location_lat.toFixed(4)},{' '}
                  {selectedCamp.location_lng.toFixed(4)}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a camp marker on the map to inspect its epidemiological status.
            </div>
          )}

          {/* Quick List of High-Risk Camps */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              All Camps ({filteredCamps.length})
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {filteredCamps.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCamp(c)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedCamp?.id === c.id
                      ? 'border-sky-500 bg-sky-50/50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="font-semibold text-slate-800 truncate mr-2">{c.name}</span>
                  <RiskBadge level={c.risk_level} size="sm" showPulse={false} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
