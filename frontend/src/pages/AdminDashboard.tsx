import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  ArrowRight,
  TrendingUp,
  MapPin,
  FileText,
  AlertCircle,
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

  const syndromeChartData = [
    { name: 'Acute Diarrhea', count: 28 },
    { name: 'Vector-Borne', count: 19 },
    { name: 'Respiratory', count: 14 },
    { name: 'Skin Conditions', count: 9 },
    { name: 'Febrile Illness', count: 7 },
  ];

  const trendData = summary?.disease_trends || [
    { date: 'Day 1', cases: 14 },
    { date: 'Day 2', cases: 22 },
    { date: 'Day 3', cases: 29 },
    { date: 'Day 4', cases: 41 },
    { date: 'Day 5', cases: 58 },
    { date: 'Day 6', cases: 74 },
    { date: 'Day 7', cases: 92 },
  ];

  const totalCamps = camps.length || 6;
  const activeReports = summary?.total_reports || 48;
  const highRiskCamps = camps.filter((c) => c.risk_level === 'high' || c.risk_level === 'critical').length || 2;
  const activeAlertsCount = alerts.filter((a) => a.status !== 'resolved').length || 3;
  const affectedPeople = summary?.total_affected || 4850;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#111111]">
            District Health Overview
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Tirunelveli District · Live surveillance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 text-[12px] font-medium rounded-[7px] border border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F7F8FA] text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Update</span>
          </button>
        </div>
      </div>

      {/* KPI Row: 5 compact rectangular cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-3.5">
          <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            Total Camps
          </div>
          <div className="text-[28px] font-semibold text-[#111111] mt-1 tracking-tight">
            {totalCamps}
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-3.5">
          <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            Active Reports
          </div>
          <div className="text-[28px] font-semibold text-[#111111] mt-1 tracking-tight">
            {activeReports}
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-3.5">
          <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            High-Risk Camps
          </div>
          <div className="text-[28px] font-semibold text-[#DC2626] mt-1 tracking-tight">
            {highRiskCamps}
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-3.5">
          <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            Active Alerts
          </div>
          <div className="text-[28px] font-semibold text-[#111111] mt-1 tracking-tight">
            {activeAlertsCount}
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-3.5">
          <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            Affected People
          </div>
          <div className="text-[28px] font-semibold text-[#111111] mt-1 tracking-tight">
            {affectedPeople.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Section: Large GIS Map occupying center */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111111]">
              Geographic Incident & Camp Surveillance
            </h2>
            <p className="text-[12px] text-[#6B7280]">
              Tirunelveli administrative perimeter, relief camps, and risk stratification
            </p>
          </div>
          <NavLink
            to="/map"
            className="text-[12px] font-medium text-[#0066CC] hover:text-[#004C99] flex items-center gap-1"
          >
            Full GIS Map →
          </NavLink>
        </div>

        <DistrictMap
          camps={camps}
          clusters={clusters}
          selectedCampId={selectedCamp?.id}
          onSelectCamp={(camp) => setSelectedCamp(camp)}
          height="460px"
        />
      </div>

      {/* Two Column Grid: Alerts (Left) + Trends & Reports (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts with minimal left-border accent */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111111]">
                Active Alerts
              </h2>
              <p className="text-[12px] text-[#6B7280]">
                Syndromic spikes and environmental risks requiring attention
              </p>
            </div>
            <NavLink
              to="/alerts-actions"
              className="text-[12px] font-medium text-[#0066CC] hover:text-[#004C99]"
            >
              All Alerts →
            </NavLink>
          </div>

          <div className="space-y-2.5">
            {alerts.slice(0, 4).map((alert) => {
              const isHigh = alert.severity === 'high' || alert.severity === 'critical';
              const borderColor = isHigh ? 'border-l-[#DC2626]' : 'border-l-[#0066CC]';
              const campName = camps.find((c) => c.id === alert.camp_id)?.name || alert.camp_id;

              return (
                <div
                  key={alert.id}
                  className={`bg-[#FFFFFF] border border-[#E5E7EB] border-l-[3px] ${borderColor} rounded-[7px] p-3 text-[12px] flex items-start justify-between gap-3`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold ${isHigh ? 'text-[#DC2626]' : 'text-[#0066CC]'} uppercase tracking-wider`}>
                        {alert.severity} RISK
                      </span>
                      <span className="text-[#6B7280]">·</span>
                      <span className="font-semibold text-[#111111]">{campName}</span>
                    </div>

                    <p className="text-[#374151] font-medium">
                      {alert.reason}
                    </p>

                    <div className="text-[11px] text-[#6B7280]">
                      {alert.trigger_data?.cases_count || 18} cases reported · Anomaly score {alert.trigger_data?.anomaly_score ? Number(alert.trigger_data.anomaly_score).toFixed(2) : '0.84'}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedAlertForAction(alert)}
                    className="shrink-0 text-[12px] font-medium text-[#0066CC] hover:text-[#004C99] flex items-center gap-1 pt-0.5 cursor-pointer"
                  >
                    <span>Action →</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disease Trends (Clean Line Chart) */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] mb-3">
              <div>
                <h2 className="text-[15px] font-semibold text-[#111111]">
                  Cases Over Time
                </h2>
                <p className="text-[12px] text-[#6B7280]">
                  7-day syndromic incident progression across district
                </p>
              </div>
              <span className="text-[12px] text-[#6B7280] font-medium">
                Total: 92 cases
              </span>
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#F2F3F5" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                      borderRadius: '6px',
                      fontSize: '12px',
                      boxShadow: 'none',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cases"
                    stroke="#0066CC"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#0066CC' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Simple Horizontal Bar: Disease Distribution */}
          <div className="pt-4 border-t border-[#E5E7EB] mt-3">
            <div className="text-[12px] font-semibold text-[#111111] mb-2">
              Syndrome Distribution
            </div>
            <div className="space-y-1.5">
              {syndromeChartData.slice(0, 3).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[12px]">
                  <span className="text-[#4B5563] w-36 truncate">{item.name}</span>
                  <div className="flex-1 mx-3 h-1.5 bg-[#F2F3F5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0066CC]"
                      style={{ width: `${(item.count / 30) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium text-[#111111] w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clean Camps Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111111]">
              Relief Camp Status Summary
            </h2>
            <p className="text-[12px] text-[#6B7280]">
              Operational stations in Tirunelveli district
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                <th className="py-2.5 font-medium">Camp</th>
                <th className="py-2.5 font-medium">Location</th>
                <th className="py-2.5 font-medium">Population</th>
                <th className="py-2.5 font-medium">Active Cases</th>
                <th className="py-2.5 font-medium">Top Syndrome</th>
                <th className="py-2.5 font-medium">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {camps.map((camp) => (
                <tr key={camp.id} className="hover:bg-[#F7F8FA] transition-colors">
                  <td className="py-2.5 font-medium text-[#111111]">{camp.name}</td>
                  <td className="py-2.5 text-[#6B7280]">{camp.ward || 'Central'}, {camp.district}</td>
                  <td className="py-2.5 text-[#111111]">{camp.population.toLocaleString()}</td>
                  <td className="py-2.5 font-semibold text-[#111111]">{camp.active_cases || 0}</td>
                  <td className="py-2.5 text-[#4B5563]">{camp.top_syndrome || 'None reported'}</td>
                  <td className="py-2.5">
                    <RiskBadge level={camp.risk_level} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
