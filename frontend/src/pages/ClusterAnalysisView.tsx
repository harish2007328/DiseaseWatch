import React, { useState, useEffect } from 'react';
import {
  Layers,
  RefreshCw,
  AlertCircle,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#111111]">
            Outbreak Cluster Radar
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Tirunelveli District · Spatial syndromic clustering & anomaly detection
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 text-[12px] font-medium rounded-[7px] border border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F7F8FA] text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recompute</span>
        </button>
      </div>

      {/* Cluster Map */}
      <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB]">
        <div className="mb-3">
          <h2 className="text-[15px] font-semibold text-[#111111]">
            Geographic Outbreak Clusters
          </h2>
          <p className="text-[12px] text-[#6B7280]">
            Contagion spread and linked camp nodes in Tirunelveli
          </p>
        </div>
        <DistrictMap camps={camps} clusters={clusters} height="440px" />
      </div>

      {/* Detected Clusters List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clusters.map((cluster) => {
          const isHigh = cluster.severity === 'high' || cluster.severity === 'critical';
          const borderColor = isHigh ? 'border-l-[#DC2626]' : 'border-l-[#0066CC]';

          return (
            <div
              key={cluster.id}
              className={`bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB] border-l-[3px] ${borderColor} space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[13px] text-[#111111]">
                  {cluster.common_syndrome || 'Suspected Cluster'}
                </span>
                <RiskBadge level={cluster.severity} size="sm" />
              </div>

              <div className="text-[12px] text-[#4B5563]">
                <strong>Syndrome:</strong> {cluster.common_syndrome}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px] pt-1 border-t border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280]">Active Cases:</span>{' '}
                  <strong className="text-[#111111]">{cluster.total_cases}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">Involved Camps:</span>{' '}
                  <strong className="text-[#111111]">{cluster.affected_camp_ids?.length || 2}</strong>
                </div>
              </div>

              <p className="text-[11px] text-[#6B7280] pt-1">
                Triggered by shared groundwater aquifer proximity in Ward 4 sector.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
