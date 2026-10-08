import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  AlertCircle,
  Droplets,
  Activity,
  FileCheck2,
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

  const filteredHealth = healthReports.filter((r) =>
    filterStatus === 'all' ? true : r.verification_status === filterStatus
  );

  const filteredEnv = envReports.filter((r) =>
    filterStatus === 'all' ? true : r.verification_status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-sky-600" />
            Field Verification Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review and endorse incoming camp incident telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Pending (
              {tab === 'health'
                ? healthReports.filter((r) => r.verification_status === 'pending').length
                : envReports.filter((r) => r.verification_status === 'pending').length}
              )
            </button>
            <button
              onClick={() => setFilterStatus('verified')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === 'verified' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Verified
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setTab('health')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            tab === 'health'
              ? 'border-b-2 border-sky-600 text-sky-700'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Activity className="w-4 h-4" />
          Health Incident Reports ({healthReports.length})
        </button>
        <button
          onClick={() => setTab('environmental')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            tab === 'environmental'
              ? 'border-b-2 border-amber-600 text-amber-700'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Droplets className="w-4 h-4" />
          Environmental Hazards ({envReports.length})
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {tab === 'health' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Camp</th>
                  <th className="py-3 px-4">Cases / Exposure</th>
                  <th className="py-3 px-4">Reported Symptoms</th>
                  <th className="py-3 px-4">Field Notes</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHealth.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No reports match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHealth.map((rep) => {
                    const activeSymptoms = Object.entries(rep.symptoms || {})
                      .filter(([k, v]) => v === true && k !== 'other')
                      .map(([k]) => k.replace('_', ' '));

                    return (
                      <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {rep.camp_name || rep.camp_id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-rose-600">
                          {rep.case_count} cases
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {rep.affected_people} exposed
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {activeSymptoms.map((sym, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] capitalize font-medium"
                              >
                                {sym}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                          {rep.notes || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                          {new Date(rep.reported_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rep.verification_status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rep.verification_status === 'rejected'
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {rep.verification_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {rep.verification_status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleVerifyHealth(rep.id, 'verified')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" /> Endorse
                              </button>
                              <button
                                onClick={() => handleVerifyHealth(rep.id, 'rejected')}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Camp</th>
                  <th className="py-3 px-4">Hazard Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Location / Details</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnv.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No environmental reports match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEnv.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {rep.camp_name || rep.camp_id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 capitalize">
                        {rep.issue_type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge level={rep.severity} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                        <div className="font-semibold text-slate-800">{rep.location}</div>
                        <div>{rep.description}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(rep.reported_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            rep.verification_status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rep.verification_status === 'rejected'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {rep.verification_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {rep.verification_status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyEnv(rep.id, 'verified')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" /> Endorse Hazard
                            </button>
                            <button
                              onClick={() => handleVerifyEnv(rep.id, 'rejected')}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
