import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Filter,
} from 'lucide-react';
import {
  getHealthReports,
  getEnvironmentalReports,
  verifyHealthReport,
  verifyEnvironmentalReport,
} from '../services/api';
import { HealthReport, EnvironmentalReport } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const VerificationQueue: React.FC = () => {
  const [tab, setTab] = useState<'health' | 'environmental'>('health');
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [envReports, setEnvReports] = useState<EnvironmentalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadReports = async () => {
    setLoading(true);
    try {
      const [hRes, eRes] = await Promise.all([getHealthReports(), getEnvironmentalReports()]);
      setHealthReports(hRes.data || []);
      setEnvReports(eRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleVerifyHealth = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await verifyHealthReport(id, status);
      setHealthReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, verification_status: status } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyEnv = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await verifyEnvironmentalReport(id, status);
      setEnvReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, verification_status: status } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#111111]">
            Report Verification Queue
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Tirunelveli District · Epidemiologist sign-off for incident alerts
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#F2F3F5] p-1 rounded-[7px] self-start sm:self-auto">
          <button
            onClick={() => setTab('health')}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-[5px] transition-colors cursor-pointer ${
              tab === 'health'
                ? 'bg-[#FFFFFF] text-[#111111]'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            Health Incidents ({healthReports.length})
          </button>
          <button
            onClick={() => setTab('environmental')}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-[5px] transition-colors cursor-pointer ${
              tab === 'environmental'
                ? 'bg-[#FFFFFF] text-[#111111]'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            Environmental ({envReports.length})
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#FFFFFF] rounded-[8px] border border-[#E5E7EB] overflow-hidden">
        {tab === 'health' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#F7F8FA]">
                  <th className="py-2.5 px-4 font-medium">Camp</th>
                  <th className="py-2.5 px-4 font-medium">Syndrome</th>
                  <th className="py-2.5 px-4 font-medium">Cases</th>
                  <th className="py-2.5 px-4 font-medium">Risk</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {healthReports.map((r) => {
                  const isVerified = r.verification_status === 'verified';
                  return (
                    <tr key={r.id} className="hover:bg-[#F7F8FA] transition-colors">
                      <td className="py-3 px-4 font-medium text-[#111111]">Camp {r.camp_id}</td>
                      <td className="py-3 px-4 text-[#4B5563]">
                        {r.risk_assessment?.suspected_syndrome || 'Waterborne / Diarrhea'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#111111]">{r.case_count}</td>
                      <td className="py-3 px-4">
                        <RiskBadge level={r.risk_assessment?.risk_level || 'medium'} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] border ${
                            isVerified
                              ? 'bg-[#EAF3FF] text-[#0066CC] border-[#BFDBFE]'
                              : 'bg-[#F2F3F5] text-[#6B7280] border-[#E5E7EB]'
                          }`}
                        >
                          {r.verification_status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerifyHealth(r.id, 'verified')}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-[5px] bg-[#EAF3FF] hover:bg-[#BFDBFE] text-[#0066CC] transition-colors cursor-pointer"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleVerifyHealth(r.id, 'rejected')}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-[5px] border border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#DC2626] transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#F7F8FA]">
                  <th className="py-2.5 px-4 font-medium">Camp</th>
                  <th className="py-2.5 px-4 font-medium">Issue</th>
                  <th className="py-2.5 px-4 font-medium">Location</th>
                  <th className="py-2.5 px-4 font-medium">Severity</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {envReports.map((r) => {
                  const isVerified = r.verification_status === 'verified';
                  return (
                    <tr key={r.id} className="hover:bg-[#F7F8FA] transition-colors">
                      <td className="py-3 px-4 font-medium text-[#111111]">Camp {r.camp_id}</td>
                      <td className="py-3 px-4 text-[#4B5563]">
                        {r.issue_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-[#6B7280] max-w-xs truncate">{r.location}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-[4px] border ${
                            r.severity === 'severe'
                              ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                              : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                          }`}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] border ${
                            isVerified
                              ? 'bg-[#EAF3FF] text-[#0066CC] border-[#BFDBFE]'
                              : 'bg-[#F2F3F5] text-[#6B7280] border-[#E5E7EB]'
                          }`}
                        >
                          {r.verification_status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerifyEnv(r.id, 'verified')}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-[5px] bg-[#EAF3FF] hover:bg-[#BFDBFE] text-[#0066CC] transition-colors cursor-pointer"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleVerifyEnv(r.id, 'rejected')}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-[5px] border border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#DC2626] transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
