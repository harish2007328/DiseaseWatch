import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Sparkles,
  Users,
  Activity,
  Droplets,
  Share2,
  RefreshCw,
} from 'lucide-react';
import { detectClusters, getCamps, detectAnomaly } from '../services/api';
import { Cluster, Camp, AnomalyResult } from '../types';
import { DistrictMap } from '../components/DistrictMap';
import { RiskBadge } from '../components/RiskBadge';

export const ClusterAnalysisView: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [anomaly, setAnomaly] = useState<AnomalyResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clusterRes, campsRes, anomalyRes] = await Promise.all([
        detectClusters(),
        getCamps(),
        detectAnomaly({
          camp_id: 'camp-1',
          recent_cases: [2, 4, 3, 5, 8, 14, 26],
          baseline_cases: [2, 3, 3, 2, 4],
        }),
      ]);

      setClusters(clusterRes.data?.clusters || []);
      setCamps(campsRes.data || []);
      setAnomaly(anomalyRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-rose-600" />
            Geospatial Outbreak & Cluster Detection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            DBSCAN spatial clustering algorithm identifies multi-camp co-occurring syndromes and shared environmental transmission vectors
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-run Spatial Detection
        </button>
      </div>

      {/* Outbreak Spike Alert Banner (Anomaly Result) */}
      {anomaly && anomaly.is_anomaly && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 text-rose-900">
          <div className="p-2 rounded-xl bg-rose-500 text-white shadow-xs shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm">Statistical Surge Anomaly Detected</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900 uppercase">
                Z-Score: +{anomaly.anomaly_score.toFixed(1)}σ
              </span>
            </div>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              {anomaly.message ||
                'Recent case velocity in Camp Alpha & Beta exceeds 3 standard deviations above baseline post-disaster mean.'}
            </p>
          </div>
        </div>
      )}

      {/* Map & Cluster Dossiers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map View (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Spatial Proximity & Cluster Perimeter Map
            </h2>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
              {clusters.length} Active Hotspot Clusters
            </span>
          </div>

          <div className="flex-1 min-h-[440px]">
            <DistrictMap camps={camps} clusters={clusters} height="440px" />
          </div>
        </div>

        {/* Cluster Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Cluster Epidemiological Profiles
          </h2>

          {clusters.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No cross-camp spatial clusters detected currently.
            </div>
          ) : (
            clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                    <span className="font-extrabold text-xs text-rose-700 uppercase tracking-wider">
                      Cluster {cluster.id}
                    </span>
                  </div>
                  <RiskBadge level={cluster.severity} size="sm" />
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Predominant Syndrome
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                    {cluster.common_syndrome}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Cases</span>
                    <strong className="text-rose-600 text-base">{cluster.total_cases}</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Involved Camps</span>
                    <strong className="text-slate-800 text-base">
                      {cluster.affected_camps.length} camps
                    </strong>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Affected Camp Nodes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.affected_camps.map((campName, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-100 flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {campName}
                      </span>
                    ))}
                  </div>
                </div>

                {cluster.environmental_factors && cluster.environmental_factors.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block mb-1 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-amber-600" /> Shared Vector / Environmental Factors
                    </span>
                    <p className="text-xs text-slate-600">
                      {cluster.environmental_factors.join(' • ')}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
