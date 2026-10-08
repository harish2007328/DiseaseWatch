import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Table,
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
} from '../services/api';
import { Camp, Alert, DashboardSummary } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { DistrictMap } from '../components/DistrictMap';
import { ActionModal } from '../components/ActionModal';
import { NavLink } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  // Instant Cache Hydration: Render instantly from sessionStorage if available
  const [summary, setSummary] = useState<DashboardSummary | null>(() => {
    try {
      const cached = sessionStorage.getItem('dw_summary');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [camps, setCamps] = useState<Camp[]>(() => {
    try {
      const cached = sessionStorage.getItem('dw_camps');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      const cached = sessionStorage.getItem('dw_alerts');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<Alert | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(() => {
    try {
      const cached = sessionStorage.getItem('dw_camps');
      if (cached) {
        const list: Camp[] = JSON.parse(cached);
        return list.length > 0 ? list[0] : null;
      }
    } catch {}
    return null;
  });
  const [rightViewTab, setRightViewTab] = useState<'trends' | 'roster'>('trends');

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      // Fast, lightweight parallel fetching (no redundant cluster calculation)
      const [sumRes, campsRes, alertsRes] = await Promise.all([
        getDashboardSummary(isRefresh),
        getCamps(isRefresh),
        getAlerts(),
      ]);

      const loadedCamps: Camp[] = campsRes.data || [];
      const loadedSummary = sumRes.data;
      const loadedAlerts = alertsRes.data || [];

      setSummary(loadedSummary);
      setCamps(loadedCamps);
      setAlerts(loadedAlerts);

      // Save to local session cache for 0ms loads
      try {
        sessionStorage.setItem('dw_summary', JSON.stringify(loadedSummary));
        sessionStorage.setItem('dw_camps', JSON.stringify(loadedCamps));
        sessionStorage.setItem('dw_alerts', JSON.stringify(loadedAlerts));
      } catch {}

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

  const campAlerts = selectedCamp
    ? alerts.filter((a) => a.camp_id === selectedCamp.id)
    : [];

  return (
    <div className="h-full flex flex-col min-h-0 space-y-2.5">
      {/* Clean Executive Header (Shrink-0) */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-[19px] font-bold tracking-tight text-[#111111] leading-tight">
            District Health Command
          </h1>
          <p className="text-[12px] text-[#6B7280]">
            Tirunelveli District · Real-time syndromic surveillance & relief operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-[#EAF3FF] text-[#0066CC] border border-[#BFDBFE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066CC] animate-pulse"></span>
            <span>{totalCamps} Relief Stations Online</span>
          </span>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-2.5 py-1 text-[11px] font-medium rounded-[6px] border border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F7F8FA] text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Update Feed</span>
          </button>
        </div>
      </div>

      {/* Screen-Fit Command Center: Fixed Full-Height Map on Left, Scrollable Values on Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden lg:h-[calc(100vh-140px)] min-h-[520px]">
        {/* ========================================================= */}
        {/* LEFT COLUMN (7 COLS): FULL-HEIGHT GIS MAP + STATION DROPDOWN */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-3 shadow-xs flex flex-col h-full min-h-0">
            {/* Top Bar: Station Dropdown & Full GIS Link */}
            <div className="shrink-0 flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 min-w-0">
                <label
                  htmlFor="station-dropdown"
                  className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider shrink-0"
                >
                  Station:
                </label>
                <select
                  id="station-dropdown"
                  value={selectedCamp?.id || ''}
                  onChange={(e) => {
                    const found = camps.find((c) => c.id === e.target.value);
                    if (found) setSelectedCamp(found);
                  }}
                  className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] px-2.5 py-1 text-[12px] font-semibold text-[#111111] focus:outline-none focus:border-[#0066CC] cursor-pointer max-w-[260px] truncate"
                >
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.ward ? `${camp.ward} — ${camp.name}` : camp.name}
                      {camp.active_cases > 0 ? ` (${camp.active_cases} active)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <NavLink
                to="/map"
                className="shrink-0 text-[11px] font-semibold text-[#0066CC] hover:text-[#004C99] flex items-center gap-1 cursor-pointer pl-1"
              >
                <span>Full GIS</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>

            {/* The Map: Fills 100% of Available Container Height */}
            <div className="flex-1 min-h-0 relative rounded-[8px] overflow-hidden">
              <DistrictMap
                camps={camps}
                selectedCampId={selectedCamp?.id}
                onSelectCamp={(camp) => setSelectedCamp(camp)}
                height="100%"
              />
            </div>

            {/* Bottom Station Status Strip (Shrink-0) */}
            {selectedCamp && (
              <div className="shrink-0 mt-2 pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#111111]">{selectedCamp.name}</span>
                  <RiskBadge level={selectedCamp.risk_level} size="sm" />
                  <span>·</span>
                  <span>{selectedCamp.population?.toLocaleString() || '1,000'} sheltered</span>
                </div>
                <div className="text-[11px]">
                  <span>Active Cases: </span>
                  <strong
                    className={
                      selectedCamp.active_cases > 0 ? 'text-[#DC2626]' : 'text-[#111111]'
                    }
                  >
                    {selectedCamp.active_cases || 0}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (5 COLS): SCROLLABLE VALUES & TELEMETRY */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-y-auto pr-1 space-y-3">
          {/* 1. Selected Station Telemetry Card */}
          {selectedCamp && (
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-3.5 shadow-xs space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-bold text-[#111111]">
                      {selectedCamp.name}
                    </h3>
                    <RiskBadge level={selectedCamp.risk_level} size="sm" />
                  </div>
                  <p className="text-[11px] text-[#6B7280]">
                    Sector: {selectedCamp.ward || 'Tirunelveli Central'} ·{' '}
                    {Number(selectedCamp.location_lat).toFixed(4)},{' '}
                    {Number(selectedCamp.location_lng).toFixed(4)}
                  </p>
                </div>
              </div>

              {/* 4 Detail Metric Tiles (Compact 2x2) */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-[6px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block text-[10px] font-medium uppercase tracking-wider">
                    Population
                  </span>
                  <strong className="text-[15px] font-bold text-[#111111] block">
                    {selectedCamp.population?.toLocaleString() || '1,000'}
                  </strong>
                  <span className="text-[10px] text-[#6B7280]">Sheltered citizens</span>
                </div>

                <div className="p-2 rounded-[6px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block text-[10px] font-medium uppercase tracking-wider">
                    Active Cases
                  </span>
                  <strong
                    className={`text-[15px] font-bold block ${
                      selectedCamp.active_cases > 0 ? 'text-[#DC2626]' : 'text-[#111111]'
                    }`}
                  >
                    {selectedCamp.active_cases || 0}
                  </strong>
                  <span className="text-[10px] text-[#6B7280]">Under monitoring</span>
                </div>

                <div className="p-2 rounded-[6px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block text-[10px] font-medium uppercase tracking-wider">
                    Lead Syndrome
                  </span>
                  <strong className="text-[12px] font-semibold text-[#111111] truncate block mt-0.5">
                    {selectedCamp.top_syndrome || 'None reported'}
                  </strong>
                  <span className="text-[10px] text-[#6B7280]">Dominant symptom</span>
                </div>

                <div className="p-2 rounded-[6px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block text-[10px] font-medium uppercase tracking-wider">
                    Sanitation
                  </span>
                  <strong className="text-[12px] font-semibold text-[#111111] truncate block mt-0.5">
                    {selectedCamp.environmental_issues?.length
                      ? selectedCamp.environmental_issues[0].replace('_', ' ')
                      : 'Stable / Clean'}
                  </strong>
                  <span className="text-[10px] text-[#6B7280]">Water & latrines</span>
                </div>
              </div>

              {/* Station Specific Directives/Alerts */}
              <div className="pt-1">
                {campAlerts.length > 0 ? (
                  <div className="space-y-1.5">
                    {campAlerts.slice(0, 1).map((alert) => (
                      <div
                        key={alert.id}
                        className="bg-[#FFF8F5] border border-[#FDBA74] rounded-[6px] p-2 text-[11px] flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                            <span className="font-semibold text-[#C2410C] text-[10px] uppercase">
                              {alert.severity} Alert
                            </span>
                          </div>
                          <p className="text-[#7C2D12] text-[11px] truncate">
                            {alert.reason}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedAlertForAction(alert)}
                          className="shrink-0 px-2 py-1 text-[10px] font-bold bg-[#EA580C] text-white hover:bg-[#C2410C] rounded-[4px] transition-colors cursor-pointer"
                        >
                          Action →
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] rounded-[6px] px-2.5 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Station operating within normal safety thresholds</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. District Analytics & Directory Card */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-3.5 shadow-xs space-y-3 shrink-0">
            {/* 4 Compact District KPIs Strip */}
            <div className="grid grid-cols-4 gap-2 text-center pb-2.5 border-b border-[#E5E7EB]">
              <div className="bg-[#F7F8FA] rounded-[6px] p-1.5 border border-[#E5E7EB]">
                <div className="text-[10px] font-semibold text-[#6B7280] uppercase">Camps</div>
                <div className="text-[16px] font-bold text-[#111111]">{totalCamps}</div>
              </div>
              <div className="bg-[#F7F8FA] rounded-[6px] p-1.5 border border-[#E5E7EB]">
                <div className="text-[10px] font-semibold text-[#6B7280] uppercase">Reports</div>
                <div className="text-[16px] font-bold text-[#0066CC]">{activeReports}</div>
              </div>
              <div className="bg-[#F7F8FA] rounded-[6px] p-1.5 border border-[#E5E7EB]">
                <div className="text-[10px] font-semibold text-[#6B7280] uppercase">High Risk</div>
                <div className="text-[16px] font-bold text-[#DC2626]">{highRiskCamps}</div>
              </div>
              <div className="bg-[#F7F8FA] rounded-[6px] p-1.5 border border-[#E5E7EB]">
                <div className="text-[10px] font-semibold text-[#6B7280] uppercase">Alerts</div>
                <div className="text-[16px] font-bold text-[#EA580C]">{activeAlertsCount}</div>
              </div>
            </div>

            {/* View Switcher: 14-Day Curve vs Stations Directory */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#F7F8FA] p-0.5 rounded-[6px] border border-[#E5E7EB] text-[11px]">
                <button
                  onClick={() => setRightViewTab('trends')}
                  className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    rightViewTab === 'trends'
                      ? 'bg-[#FFFFFF] text-[#0066CC] shadow-2xs font-semibold'
                      : 'text-[#6B7280] hover:text-[#111111]'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Trends</span>
                </button>
                <button
                  onClick={() => setRightViewTab('roster')}
                  className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    rightViewTab === 'roster'
                      ? 'bg-[#FFFFFF] text-[#0066CC] shadow-2xs font-semibold'
                      : 'text-[#6B7280] hover:text-[#111111]'
                  }`}
                >
                  <Table className="w-3 h-3" />
                  <span>All Stations ({camps.length})</span>
                </button>
              </div>

              {alerts.length > 0 && (
                <NavLink
                  to="/alerts-actions"
                  className="text-[11px] font-semibold text-[#0066CC] hover:text-[#004C99]"
                >
                  {alerts.length} Directives →
                </NavLink>
              )}
            </div>

            {/* Content for Trends Tab */}
            {rightViewTab === 'trends' ? (
              <div className="space-y-2 pt-1">
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid stroke="#F2F3F5" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        fontSize={9}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        fontSize={9}
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
                        dot={{ r: 2, fill: '#0066CC' }}
                        activeDot={{ r: 3.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Compact Syndrome Distribution */}
                <div className="pt-2 border-t border-[#E5E7EB] space-y-1">
                  <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                    Syndromic Distribution
                  </div>
                  {syndromeChartData.slice(0, 3).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[10px]">
                      <span className="text-[#4B5563] w-28 truncate">{item.name}</span>
                      <div className="flex-1 mx-2 h-1 bg-[#F2F3F5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0066CC]"
                          style={{ width: `${(item.count / 25) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-[#111111] w-5 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Content for Stations Roster Tab */
              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                      <th className="py-1 font-semibold">Station</th>
                      <th className="py-1 font-semibold">Ward</th>
                      <th className="py-1 font-semibold text-right">Cases</th>
                      <th className="py-1 font-semibold text-right">Risk</th>
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
                          <td className="py-1.5 font-medium text-[#111111] truncate max-w-[130px]">
                            {camp.ward || camp.name.split(' - ')[1] || camp.name}
                          </td>
                          <td className="py-1.5 text-[#6B7280]">{camp.ward || 'Central'}</td>
                          <td className="py-1.5 font-semibold text-right">
                            <span
                              className={
                                camp.active_cases > 0 ? 'text-[#DC2626]' : 'text-[#6B7280]'
                              }
                            >
                              {camp.active_cases || 0}
                            </span>
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
            )}
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
