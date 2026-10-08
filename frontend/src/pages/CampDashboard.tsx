import React, { useState, useEffect } from 'react';
import {
  Tent,
  Users,
  Activity,
  Droplets,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCamp, getActions, getHealthReports, updateAction } from '../services/api';
import { CampDetail, Action, HealthReport } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { NavLink } from 'react-router-dom';

export const CampDashboard: React.FC = () => {
  const { activeCampId } = useAuth();
  const campId = activeCampId || 'camp-1';

  const [camp, setCamp] = useState<CampDetail | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCampData = async () => {
    setLoading(true);
    try {
      const [campRes, actRes, repRes] = await Promise.all([
        getCamp(campId),
        getActions(campId),
        getHealthReports(campId),
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
  }, [campId]);

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

  return (
    <div className="space-y-6">
      {/* Camp Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-700">
            <Tent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{camp?.name || 'Relief Camp'}</h1>
              {camp && <RiskBadge level={camp.risk_level} />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ward: <span className="font-semibold text-slate-700">{camp?.ward || 'Ward 4'}</span> •{' '}
              District: <span className="font-semibold text-slate-700">{camp?.district || 'Central'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <NavLink
            to="/report"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Report Health Incident
          </NavLink>
          <NavLink
            to="/environmental"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all"
          >
            <Droplets className="w-3.5 h-3.5" />
            Report Environmental Risk
          </NavLink>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Shelter Population</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {camp?.population.toLocaleString() || '1,200'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sheltered evacuees</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Active Cases</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{camp?.active_cases || 0}</div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">Requires medical oversight</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Primary Syndrome</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-800 truncate mt-1">
            {camp?.top_syndrome || 'None Detected'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Surveillance assessment</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Pending Action Directives</span>
            <ClipboardList className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">
            {actions.filter((a) => a.status !== 'completed').length}
          </div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">From District Admin</div>
        </div>
      </div>

      {/* Directives & Action Items from District Admin */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-teal-600" />
              Assigned Field Directives
            </h2>
            <p className="text-xs text-slate-400">
              Response and sanitation measures issued by District Health
            </p>
          </div>
          <span className="text-xs font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg">
            {actions.filter((a) => a.status === 'completed').length} / {actions.length} Done
          </span>
        </div>

        {actions.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
            No active directives assigned to this camp.
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((act) => (
              <div
                key={act.id}
                className={`p-4 rounded-xl border transition-all ${
                  act.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          act.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {act.priority}
                      </span>
                      <h3
                        className={`text-sm font-bold ${
                          act.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}
                      >
                        {act.title}
                      </h3>
                    </div>
                    {act.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>
                    )}
                    {act.instructions && (
                      <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700 mt-2 whitespace-pre-line">
                        {act.instructions}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <button
                      onClick={() => handleStatusChange(act.id, act.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        act.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 cursor-default'
                          : act.status === 'in_progress'
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-sky-600 text-white hover:bg-sky-700'
                      }`}
                    >
                      {act.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </>
                      ) : act.status === 'in_progress' ? (
                        <>
                          <Clock className="w-3.5 h-3.5" /> Mark Completed
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-3.5 h-3.5" /> Start Action
                        </>
                      )}
                    </button>
                    {act.deadline && (
                      <span className="text-[10px] text-slate-400 font-medium">Due: {act.deadline}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Submissions History */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Recent Health Submissions
            </h2>
            <p className="text-xs text-slate-500">History of incident reports submitted by this camp</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                <th className="py-2.5 px-3">Date/Time</th>
                <th className="py-2.5 px-3">Cases</th>
                <th className="py-2.5 px-3">Symptoms Reported</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.slice(0, 5).map((rep) => {
                const activeSymptoms = Object.entries(rep.symptoms || {})
                  .filter(([k, v]) => v === true && k !== 'other')
                  .map(([k]) => k.replace('_', ' '));

                return (
                  <tr key={rep.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {new Date(rep.reported_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{rep.case_count} cases</td>
                    <td className="py-3 px-3 text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {activeSymptoms.map((sym, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] capitalize"
                          >
                            {sym}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rep.severity === 'severe'
                            ? 'bg-rose-100 text-rose-800'
                            : rep.severity === 'moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rep.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rep.verification_status === 'verified'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rep.verification_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
