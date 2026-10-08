import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCamp, getCamps, getActions, getHealthReports, updateAction } from '../services/api';
import { CampDetail, Camp, Action, HealthReport } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { NavLink } from 'react-router-dom';

export const CampDashboard: React.FC = () => {
  const { activeCampId, switchRole } = useAuth();
  const [allCamps, setAllCamps] = useState<Camp[]>([]);
  const [camp, setCamp] = useState<CampDetail | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveCampId = activeCampId || (allCamps.length > 0 ? allCamps[0].id : '');

  useEffect(() => {
    getCamps().then((res) => setAllCamps(res.data || [])).catch(() => {});
  }, []);

  const loadCampData = async () => {
    if (!effectiveCampId) return;
    setLoading(true);
    try {
      const [campRes, actRes, repRes] = await Promise.all([
        getCamp(effectiveCampId),
        getActions(effectiveCampId),
        getHealthReports(effectiveCampId),
      ]);
      setCamp(campRes.data);
      setActions(actRes.data || []);
      setReports(repRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampData();
  }, [effectiveCampId]);

  const handleStatusChange = async (actionId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'in_progress' : 'completed';
    try {
      await updateAction(actionId, nextStatus);
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, status: nextStatus } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const openActionsCount = actions.filter((a) => a.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Camp Header */}
      <div className="bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-semibold tracking-tight text-[#111111]">
              {camp?.name || 'Camp 01 — Govt High School'}
            </h1>
            {camp && <RiskBadge level={camp.risk_level} size="sm" />}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#6B7280] mt-1">
            <span>Tirunelveli District · {camp?.ward || 'Ward 4'}</span>
            <span>·</span>
            {/* Quick Camp Selector */}
            <div className="inline-flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-[#111111]">Switch Station:</span>
              <select
                value={effectiveCampId}
                onChange={(e) => switchRole('camp', e.target.value)}
                className="px-2 py-0.5 text-[12px] font-semibold bg-[#F7F8FA] border border-[#E5E7EB] rounded-[5px] text-[#0066CC] focus:border-[#0066CC] cursor-pointer"
              >
                {allCamps.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <NavLink
            to="/report"
            className="px-3.5 py-2 text-[12px] font-medium rounded-[7px] bg-[#0066CC] hover:bg-[#004C99] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Health Incident</span>
          </NavLink>
          <NavLink
            to="/environmental"
            className="px-3.5 py-2 text-[12px] font-medium rounded-[7px] bg-[#FFFFFF] hover:bg-[#F7F8FA] border border-[#E5E7EB] text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Environmental Incident</span>
          </NavLink>
        </div>
      </div>

      {/* Overview KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB]">
          <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            Population
          </div>
          <div className="text-[28px] font-semibold text-[#111111] mt-1 tracking-tight">
            {camp?.population.toLocaleString() || '1,200'}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Sheltered residents</div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB]">
          <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            Active Cases
          </div>
          <div className="text-[28px] font-semibold text-[#DC2626] mt-1 tracking-tight">
            {camp?.active_cases || 0}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Under surveillance</div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB]">
          <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            Current Risk
          </div>
          <div className="mt-2">
            <RiskBadge level={camp?.risk_level || 'low'} size="md" />
          </div>
          <div className="text-[11px] text-[#6B7280] mt-1.5 truncate">
            {camp?.top_syndrome || 'Gastrointestinal'}
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB]">
          <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            Open Actions
          </div>
          <div className="text-[28px] font-semibold text-[#111111] mt-1 tracking-tight">
            {openActionsCount}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">District directives</div>
        </div>
      </div>

      {/* Two Column Layout: Open Directives + Recent Incident Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Directives List */}
        <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111111]">
                District Action Directives
              </h2>
              <p className="text-[12px] text-[#6B7280]">
                Response instructions assigned by District Health Officer
              </p>
            </div>
            <span className="text-[12px] font-medium text-[#6B7280]">
              {actions.length} total
            </span>
          </div>

          <div className="space-y-2">
            {actions.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-[#6B7280]">
                No pending directives assigned to this camp.
              </div>
            ) : (
              actions.map((act) => {
                const isComplete = act.status === 'completed';
                return (
                  <div
                    key={act.id}
                    className="p-3 rounded-[7px] border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-[13px] text-[#111111]">
                        {act.title}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-[4px] border ${
                          isComplete
                            ? 'bg-[#EAF3FF] text-[#0066CC] border-[#BFDBFE]'
                            : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                        }`}
                      >
                        {act.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[12px] text-[#4B5563] whitespace-pre-line leading-relaxed">
                      {act.instructions || act.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-[#6B7280]">
                      <span>Target: within 6 hours</span>
                      <button
                        onClick={() => handleStatusChange(act.id, act.status)}
                        className="text-[#0066CC] hover:text-[#004C99] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {isComplete ? 'Mark Re-opened' : 'Advance Progress →'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Health Reports */}
        <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111111]">
                Recent Incident Logs
              </h2>
              <p className="text-[12px] text-[#6B7280]">
                Syndromic logs submitted from this camp
              </p>
            </div>
            <NavLink
              to="/report"
              className="text-[12px] font-medium text-[#0066CC] hover:text-[#004C99]"
            >
              + New Report
            </NavLink>
          </div>

          <div className="space-y-2">
            {reports.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-[#6B7280]">
                No health incidents logged yet.
              </div>
            ) : (
              reports.slice(0, 5).map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-[7px] border border-[#E5E7EB] flex items-center justify-between text-[12px]"
                >
                  <div>
                    <div className="font-medium text-[#111111]">
                      {rep.risk_assessment?.suspected_syndrome || 'Syndromic report'}
                    </div>
                    <div className="text-[#6B7280] text-[11px] mt-0.5">
                      {rep.case_count} cases · {rep.notes ? rep.notes.substring(0, 45) + '...' : 'Water/sanitation trigger'}
                    </div>
                  </div>
                  <RiskBadge level={rep.risk_assessment?.risk_level || 'low'} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
