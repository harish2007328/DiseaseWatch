import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  ArrowRight,
  TrendingUp,
  MapPin,
  AlertCircle,
  Plus,
  ShieldCheck,
  Droplets,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  getDashboardSummary,
  getCamps,
  getAlerts,
  getActions,
  detectClusters,
} from '../services/api';
import { Camp, Alert, Action, Cluster, DashboardSummary } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { DistrictMap } from '../components/DistrictMap';
import { ActionModal } from '../components/ActionModal';
import { NavLink } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [, setActions] = useState<Action[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<Alert | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);

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

      const loadedCamps: Camp[] = campsRes.data || [];
      setSummary(sumRes.data);
      setCamps(loadedCamps);
      setAlerts(alertsRes.data || []);
      setActions(actionsRes.data || []);
      setClusters(clustersRes.data?.clusters || []);

      if (loadedCamps.length > 0) {
        setSelectedCamp((prev) => {
          if (prev) {
            const updated = loadedCamps.find((c) => c.id === prev.id);
            if (updated) return updated;
          }
          const highRisk = loadedCamps.find(
            (c) => c.risk_level === 'critical' || c.risk_level === 'high'
          );
          return highRisk || loadedCamps[0];
        });
      }
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

  const syndromeChartData = [
    { name: 'Acute Diarrhea', count: 18 },
    { name: 'Vector-Borne (Dengue)', count: 12 },
    { name: 'Respiratory', count: 8 },
    { name: 'Skin Lesions', count: 5 },
    { name: 'Febrile Illness', count: 4 },
  ];

  const trendData = summary?.disease_trends || [
    { date: 'Day 1', cases: 0 },
    { date: 'Day 2', cases: 2 },
    { date: 'Day 3', cases: 1 },
    { date: 'Day 4', cases: 3 },
    { date: 'Day 5', cases: 4 },
    { date: 'Day 6', cases: 6 },
    { date: 'Day 7', cases: 8 },
  ];

  const totalCamps = camps.length || 6;
  const activeReports = summary?.total_reports ?? 0;
  const highRiskCamps = camps.filter(
    (c) => c.risk_level === 'high' || c.risk_level === 'critical'
  ).length;
  const activeAlertsCount = alerts.filter((a) => a.status !== 'resolved').length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-[#111111]">
            District Health Command Overview
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Tirunelveli District · Real-time syndromic surveillance & relief operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-[#EAF3FF] text-[#0066CC] border border-[#BFDBFE]">
            <span className="w-2 h-2 rounded-full bg-[#0066CC] animate-pulse"></span>
            <span>{totalCamps} Relief Stations Monitored</span>
          </span>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 text-[12px] font-medium rounded-[7px] border border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F7F8FA] text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Update Feed</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Split Layout: MAP on Left, DETAILS & OTHER on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN (7 COLS): GIS MAP + STATION SELECTOR + SUMMARY */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs">
            {/* Map Top Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-[15px] font-semibold text-[#111111] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0066CC]" />
                  <span>Tirunelveli Surveillance Map</span>
                </h2>
                <p className="text-[12px] text-[#6B7280] mt-0.5">
                  Administrative district boundary, relief stations & live syndromic pins
                </p>
              </div>

              <NavLink
                to="/map"
                className="text-[12px] font-medium text-[#0066CC] hover:text-[#004C99] flex items-center gap-1 cursor-pointer"
              >
                <span>Full GIS Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            {/* Station Quick Selector Pills */}
            <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="font-semibold text-[#6B7280] uppercase tracking-wider shrink-0 text-[10px]">
                Stations:
              </span>
              {camps.map((camp) => {
                const isSelected = selectedCamp?.id === camp.id;
                const short = camp.ward || camp.name.split(' - ')[1] || camp.name;
                return (
                  <button
                    key={camp.id}
                    onClick={() => setSelectedCamp(camp)}
                    className={`px-2.5 py-1 rounded-[6px] font-medium transition-all shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#0066CC] text-white border-[#0066CC] shadow-xs'
                        : 'bg-[#F7F8FA] text-[#4B5563] border-[#E5E7EB] hover:bg-[#FFFFFF] hover:text-[#111111]'
                    }`}
                  >
                    <span>{short}</span>
                    {camp.active_cases > 0 && (
                      <span
                        className={`ml-1 font-bold ${
                          isSelected ? 'text-white' : 'text-[#DC2626]'
                        }`}
                      >
                        ({camp.active_cases})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* The Map */}
            <DistrictMap
              camps={camps}
              clusters={clusters}
              selectedCampId={selectedCamp?.id}
              onSelectCamp={(camp) => setSelectedCamp(camp)}
              height="510px"
            />

            {/* Station Mini-Summary Strip */}
            {selectedCamp && (
              <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#111111]">{selectedCamp.name}</span>
                  <RiskBadge level={selectedCamp.risk_level} size="sm" />
                  <span className="text-[#6B7280]">·</span>
                  <span className="text-[#6B7280]">
                    {selectedCamp.population?.toLocaleString() || '1,000'} sheltered
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#6B7280]">
                    Active Cases:{' '}
                    <strong className="text-[#DC2626] font-bold">
                      {selectedCamp.active_cases || 0}
                    </strong>
                  </span>
                  <span className="text-[#6B7280]">·</span>
                  <span className="text-[#0066CC] font-medium">Inspected in right panel →</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (5 COLS): DETAILS & OTHER (KPIs, ALERTS, CHARTS, ROSTER) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Selected Camp Details Card ("DETAILS") */}
          {selectedCamp ? (
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#E5E7EB]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-[#111111]">
                      {selectedCamp.name}
                    </h3>
                    <RiskBadge level={selectedCamp.risk_level} size="sm" />
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Sector: {selectedCamp.ward || 'Tirunelveli Central'} · {Number(selectedCamp.location_lat).toFixed(4)}, {Number(selectedCamp.location_lng).toFixed(4)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <NavLink
                    to="/report"
                    className="px-2.5 py-1 text-[11px] font-medium rounded-[5px] bg-[#0066CC] hover:bg-[#004C99] text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Report</span>
                  </NavLink>
                  <NavLink
                    to="/environmental"
                    className="px-2.5 py-1 text-[11px] font-medium rounded-[5px] border border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#111111] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Droplets className="w-3 h-3 text-[#0066CC]" />
                    <span>Hazard</span>
                  </NavLink>
                </div>
              </div>

              {/* 4 Detail Metric Tiles */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-[7px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block text-[10px] font-medium uppercase tracking-wider">
                    Sheltered Population
                  </span>
                  <strong className="text-[16px] font-bold text-[#111111] block mt-0.5">
                    {selectedCamp.population?.toLocaleString() || '1,000'}
                  </strong>
                  <span className="text-[10px] text-[#6B7280]">Registered citizens</span>
                </div>

                <div className="p-2.5 rounded-[7px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block text-[10px] font-medium uppercase tracking-wider">
                    Active Syndromic Cases
                  </span>
                  <strong className="text-[16px] font-bold text-[#DC2626] block mt-0.5">
                    {selectedCamp.active_cases || 0}
                  </strong>
                  <span className="text-[10px] text-[#6B7280]">Requiring monitoring</span>
                </div>

                <div className="p-2.5 rounded-[7px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block text-[10px] font-medium uppercase tracking-wider">
                    Primary Condition
                  </span>
                  <strong className="text-[13px] font-semibold text-[#111111] truncate block mt-0.5">
                    {selectedCamp.top_syndrome || 'None reported'}
                  </strong>
                  <span className="text-[10px] text-[#6B7280]">Lead syndromic marker</span>
                </div>

                <div className="p-2.5 rounded-[7px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block text-[10px] font-medium uppercase tracking-wider">
                    Environmental Status
                  </span>
                  <strong className="text-[13px] font-semibold text-[#111111] truncate block mt-0.5">
                    {selectedCamp.environmental_issues?.length
                      ? selectedCamp.environmental_issues[0].replace('_', ' ')
                      : 'Stable / Monitored'}
                  </strong>
                  <span className="text-[10px] text-[#6B7280]">Sanitation & potable water</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] text-center text-[#6B7280] text-[12px]">
              Select a station pin on the map to view detailed metrics.
            </div>
          )}

          {/* 2. District Key Operational Indicators ("OTHER") */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-2.5 shadow-2xs">
              <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Total Camps
              </div>
              <div className="text-[18px] font-bold text-[#111111] mt-0.5 tracking-tight">
                {totalCamps}
              </div>
              <div className="text-[10px] text-[#6B7280]">Relief centers</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-2.5 shadow-2xs">
              <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Active Reports
              </div>
              <div className="text-[18px] font-bold text-[#0066CC] mt-0.5 tracking-tight">
                {activeReports}
              </div>
              <div className="text-[10px] text-[#6B7280]">Health logs</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-2.5 shadow-2xs">
              <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                High-Risk
              </div>
              <div className="text-[18px] font-bold text-[#DC2626] mt-0.5 tracking-tight">
                {highRiskCamps}
              </div>
              <div className="text-[10px] text-[#6B7280]">Priority stations</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-2.5 shadow-2xs">
              <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Alerts
              </div>
              <div className="text-[18px] font-bold text-[#EA580C] mt-0.5 tracking-tight">
                {activeAlertsCount}
              </div>
              <div className="text-[10px] text-[#6B7280]">Directives</div>
            </div>
          </div>

          {/* 3. Active Surveillance Alerts */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-[14px] font-semibold text-[#111111] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#EA580C]" />
                  <span>Surveillance Alerts</span>
                </h2>
                <p className="text-[11px] text-[#6B7280]">
                  Immediate syndromic anomalies & containment triggers
                </p>
              </div>

              <NavLink
                to="/alerts-actions"
                className="text-[11px] font-medium text-[#0066CC] hover:text-[#004C99]"
              >
                All Directives →
              </NavLink>
            </div>

            <div className="space-y-2">
              {alerts.length === 0 ? (
                <div className="py-5 text-center text-[#6B7280] text-[12px] bg-[#F7F8FA] rounded-[7px] border border-[#E5E7EB]">
                  <ShieldCheck className="w-5 h-5 text-[#0066CC] mx-auto mb-1 opacity-80" />
                  <span>No active alert triggers across Tirunelveli relief camps.</span>
                </div>
              ) : (
                alerts.slice(0, 3).map((alert) => {
                  const isHigh =
                    alert.severity === 'high' || alert.severity === 'critical';
                  const borderColor = isHigh ? 'border-l-[#DC2626]' : 'border-l-[#0066CC]';
                  const campName =
                    camps.find((c) => c.id === alert.camp_id)?.name || alert.camp_id;

                  return (
                    <div
                      key={alert.id}
                      className={`bg-[#FFFFFF] border border-[#E5E7EB] border-l-[3px] ${borderColor} rounded-[7px] p-2.5 text-[12px] flex items-start justify-between gap-2 shadow-2xs`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold ${
                              isHigh ? 'text-[#DC2626]' : 'text-[#0066CC]'
                            } uppercase tracking-wider`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-[#6B7280]">·</span>
                          <span className="font-semibold text-[#111111] text-[11px] truncate max-w-[140px]">
                            {campName}
                          </span>
                        </div>

                        <p className="text-[#374151] font-medium text-[11px] line-clamp-2">
                          {alert.reason}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedAlertForAction(alert)}
                        className="shrink-0 px-2 py-1 text-[11px] font-semibold text-[#0066CC] hover:bg-[#EAF3FF] rounded-[5px] transition-colors cursor-pointer"
                      >
                        Action →
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 4. Cases Over Time & Syndromes */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] mb-2">
              <div>
                <h2 className="text-[14px] font-semibold text-[#111111] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#0066CC]" />
                  <span>District Incident Progression</span>
                </h2>
                <p className="text-[11px] text-[#6B7280]">
                  Daily case trajectory across monitored camps
                </p>
              </div>
              <span className="text-[10px] text-[#6B7280] font-medium">14-Day Curve</span>
            </div>

            <div className="h-36 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#F2F3F5" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                      borderRadius: '6px',
                      fontSize: '11px',
                      boxShadow: 'none',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cases"
                    stroke="#0066CC"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#0066CC' }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Compact Syndrome Distribution */}
            <div className="pt-2.5 border-t border-[#E5E7EB] mt-2 space-y-1">
              <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Syndromic Distribution
              </div>
              {syndromeChartData.slice(0, 3).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[11px]">
                  <span className="text-[#4B5563] w-32 truncate">{item.name}</span>
                  <div className="flex-1 mx-2 h-1.5 bg-[#F2F3F5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0066CC]"
                      style={{ width: `${(item.count / 25) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-[#111111] w-6 text-right text-[10px]">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Relief Station Roster Table */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] mb-2">
              <h2 className="text-[14px] font-semibold text-[#111111]">
                Relief Station Roster
              </h2>
              <span className="text-[11px] text-[#6B7280]">
                {camps.length} operational stations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                    <th className="py-1.5 font-semibold">Station</th>
                    <th className="py-1.5 font-semibold">Ward</th>
                    <th className="py-1.5 font-semibold text-right">Active</th>
                    <th className="py-1.5 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {camps.map((camp) => {
                    const isSelected = selectedCamp?.id === camp.id;
                    return (
                      <tr
                        key={camp.id}
                        onClick={() => setSelectedCamp(camp)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#EAF3FF]' : 'hover:bg-[#F7F8FA]'
                        }`}
                      >
                        <td className="py-1.5 font-medium text-[#111111] truncate max-w-[140px]">
                          {camp.ward || camp.name.split(' - ')[1] || camp.name}
                        </td>
                        <td className="py-1.5 text-[#6B7280]">{camp.ward || 'Central'}</td>
                        <td className="py-1.5 font-semibold text-[#DC2626] text-right">
                          {camp.active_cases || 0}
                        </td>
                        <td className="py-1.5 text-right">
                          <RiskBadge level={camp.risk_level} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Action Directive Modal */}
      {selectedAlertForAction && (
        <ActionModal
          alert={selectedAlertForAction}
          isOpen={!!selectedAlertForAction}
          onClose={() => setSelectedAlertForAction(null)}
          onActionCreated={() => {
            loadData(true);
            setSelectedAlertForAction(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
