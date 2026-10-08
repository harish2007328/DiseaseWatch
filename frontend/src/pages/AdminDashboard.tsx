import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Tent,
  FileCheck2,
  AlertTriangle,
  Users,
  Activity,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { getDashboardSummary, getCamps, getAlerts, getActions, detectClusters } from '../services/api';
import { Camp, Alert, Action, Cluster, DashboardSummary } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { DistrictMap } from '../components/DistrictMap';
import { ActionModal } from '../components/ActionModal';
import { NavLink } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<Alert | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [sumRes, campsRes, alertsRes, actionsRes, clustersRes] = await Promise.all([
        getDashboardSummary(),
        getCamps(),
        getAlerts(),
        getActions(),
        detectClusters(),
      ]);

      setSummary(sumRes.data);
      setCamps(campsRes.data);
      setAlerts(alertsRes.data);
      setActions(actionsRes.data);
      setClusters(clustersRes.data?.clusters || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredCamps = camps.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.district.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.ward.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const syndromeChartData = [
    { name: 'Acute Diarrhea', count: 28, color: '#0284c7' },
    { name: 'Vector-Borne (Dengue/Malaria)', count: 19, color: '#e11d48' },
    { name: 'Acute Respiratory', count: 14, color: '#f59e0b' },
    { name: 'Skin / Dermatitis', count: 9, color: '#10b981' },
    { name: 'Febrile Illness Unspecified', count: 7, color: '#8b5cf6' },
  ];

  const trendData = summary?.disease_trends || [
    { date: 'Oct 02', cases: 12 },
    { date: 'Oct 03', cases: 18 },
    { date: 'Oct 04', cases: 24 },
    { date: 'Oct 05', cases: 38 },
    { date: 'Oct 06', cases: 54 },
    { date: 'Oct 07', cases: 72 },
    { date: 'Oct 08', cases: 89 },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
              Tirunelveli Health Surveillance Command
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Post-disaster incident monitoring & district epidemiological tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <NavLink
            to="/clusters"
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Clusters ({clusters.length})
          </NavLink>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Monitored Camps</span>
            <Tent className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.total_camps ?? camps.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across 3 flood-affected wards</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Incident Cases</span>
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {summary?.total_affected ?? camps.reduce((a, b) => a + (b.active_cases || 0), 0)}
          </div>
          <div className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +24% in last 24h
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {alerts.filter((a) => a.status !== 'resolved').length}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            {alerts.filter((a) => a.severity === 'critical').length} Critical level
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>High Risk Zones</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {camps.filter((c) => c.risk_level === 'high' || c.risk_level === 'critical').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Immediate intervention</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Directives Active</span>
            <FileCheck2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">
            {actions.filter((a) => a.status === 'in_progress').length}
          </div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">
            {actions.filter((a) => a.status === 'completed').length} completed
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Camp Surveillance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Panel (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Tirunelveli District GIS Incident Grid
              </h2>
              <p className="text-xs text-slate-400">
                Live camp telemetry and administrative boundary
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">
              {camps.length} Camps Monitored
            </span>
          </div>

          <div className="flex-1 min-h-[420px]">
            <DistrictMap
              camps={camps}
              clusters={clusters}
              selectedCampId={selectedCamp?.id}
              onSelectCamp={(camp) => setSelectedCamp(camp)}
              height="420px"
            />
          </div>
        </div>

        {/* Camp Quick Selector / Dossier List (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Relief Camps
            </h2>
            <div className="text-xs text-slate-400">{filteredCamps.length} listed</div>
          </div>

          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by camp, ward..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2.5 pr-1">
            {filteredCamps.map((camp) => (
              <div
                key={camp.id}
                onClick={() => setSelectedCamp(camp)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedCamp?.id === camp.id
                    ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-400'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xs text-slate-900 leading-snug">{camp.name}</h3>
                  <RiskBadge level={camp.risk_level} size="sm" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>
                    <span className="text-slate-400">Ward:</span> {camp.ward}
                  </div>
                  <div>
                    <span className="text-slate-400">Cases:</span>{' '}
                    <strong className="text-rose-600">{camp.active_cases}</strong>
                  </div>
                </div>
                {camp.top_syndrome && (
                  <div className="mt-1.5 text-[11px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md font-medium truncate">
                    Syndrome: {camp.top_syndrome}
                  </div>
                )}
                {camp.environmental_issues && camp.environmental_issues.length > 0 && (
                  <div className="mt-1 text-[10px] text-amber-700 truncate">
                    Env: {camp.environmental_issues.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Charts: Trends & Syndrome Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                District Epidemiological Curve (7 Days)
              </h3>
              <p className="text-xs text-slate-500">Aggregated incident case reports timeline</p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
              Upward Velocity
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Syndrome Breakdown Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Suspected Syndromic Breakdown
              </h3>
              <p className="text-xs text-slate-500">ML classification based on symptom co-occurrence</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={syndromeChartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Alerts & Rapid Action Dispatch Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Active Early-Warning Alerts
            </h2>
            <p className="text-xs text-slate-500">
              Syndromic surges and environmental triggers requiring district administrator verification
            </p>
          </div>
          <NavLink
            to="/alerts-actions"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            View all alerts & directives <ExternalLink className="w-3 h-3" />
          </NavLink>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Relief Camp</th>
                <th className="py-2.5 px-3">Trigger Reason</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.slice(0, 5).map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <RiskBadge level={alert.severity} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {alert.camp_name || alert.camp_id}
                  </td>
                  <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                    <span className="font-medium">{alert.reason}</span>
                    {alert.description && (
                      <span className="text-slate-400 block text-[11px] truncate">
                        {alert.description}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        alert.status === 'verified'
                          ? 'bg-blue-100 text-blue-800'
                          : alert.status === 'action_assigned'
                          ? 'bg-teal-100 text-teal-800'
                          : alert.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedAlertForAction(alert)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs transition-colors shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      Generate Action Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Plan Modal */}
      <ActionModal
        alert={selectedAlertForAction}
        isOpen={!!selectedAlertForAction}
        onClose={() => setSelectedAlertForAction(null)}
        onActionCreated={() => {
          setSelectedAlertForAction(null);
          loadData(true);
        }}
      />
    </div>
  );
};
