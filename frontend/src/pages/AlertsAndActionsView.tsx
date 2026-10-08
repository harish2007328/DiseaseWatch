import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { getAlerts, getActions, updateAction } from '../services/api';
import { Alert, Action } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { ActionModal } from '../components/ActionModal';
import { useAuth } from '../context/AuthContext';

export const AlertsAndActionsView: React.FC = () => {
  const { role, activeCampId } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<Alert | null>(null);
  const [viewTab, setViewTab] = useState<'alerts' | 'actions'>(role === 'camp' ? 'actions' : 'alerts');

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsRes, actionsRes] = await Promise.all([getAlerts(), getActions()]);
      setAlerts(alertsRes.data || []);
      setActions(actionsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleActionStatusChange = async (id: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'pending'
        ? 'in_progress'
        : currentStatus === 'in_progress'
        ? 'completed'
        : 'pending';
    try {
      await updateAction(id, nextStatus);
      setActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: nextStatus as any } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const timelineSteps = ['Detected', 'Verified', 'Assigned', 'In Progress', 'Completed'];

  const displayedAlerts =
    role === 'camp' && activeCampId
      ? alerts.filter((a) => a.camp_id === activeCampId)
      : alerts;

  const displayedActions =
    role === 'camp' && activeCampId
      ? actions.filter((a) => a.camp_id === activeCampId)
      : actions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#111111]">
            {role === 'camp' ? 'Station Action Directives & Alerts' : 'Alerts & Action Directives'}
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            {role === 'camp'
              ? 'Containment tasks and urgent operational directives assigned to your camp'
              : 'Tirunelveli District · Surveillance alerts and field containment tracking'}
          </p>
        </div>

        {/* Minimal Segmented Tab */}
        <div className="flex bg-[#F2F3F5] p-1 rounded-[7px] self-start sm:self-auto">
          <button
            onClick={() => setViewTab('alerts')}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-[5px] transition-colors cursor-pointer ${
              viewTab === 'alerts'
                ? 'bg-[#FFFFFF] text-[#111111]'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            Active Alerts ({displayedAlerts.length})
          </button>
          <button
            onClick={() => setViewTab('actions')}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-[5px] transition-colors cursor-pointer ${
              viewTab === 'actions'
                ? 'bg-[#FFFFFF] text-[#111111]'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            Directives ({displayedActions.length})
          </button>
        </div>
      </div>

      {viewTab === 'alerts' ? (
        <div className="space-y-3">
          {displayedAlerts.length === 0 ? (
            <div className="p-8 text-center text-[#6B7280] text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px]">
              No active alerts for this station.
            </div>
          ) : (
            displayedAlerts.map((alert) => {
              const isHigh = alert.severity === 'high' || alert.severity === 'critical';
              const borderColor = isHigh ? 'border-l-[#DC2626]' : 'border-l-[#0066CC]';

              return (
                <div
                  key={alert.id}
                  className={`bg-[#FFFFFF] border border-[#E5E7EB] border-l-[3px] ${borderColor} rounded-[8px] p-4 text-[12px] flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold ${
                          isHigh ? 'text-[#DC2626]' : 'text-[#0066CC]'
                        } uppercase tracking-wider`}
                      >
                        {alert.severity} RISK
                      </span>
                      <span className="text-[#6B7280]">·</span>
                      <span className="font-semibold text-[#111111]">
                        Camp {alert.camp_name || alert.camp_id}
                      </span>
                    </div>

                    <p className="text-[13px] text-[#111111] font-medium">
                      {alert.reason}
                    </p>

                    <div className="text-[12px] text-[#6B7280]">
                      {alert.trigger_data?.cases_count || 0} cases reported
                    </div>
                  </div>

                  {role === 'admin' && (
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setSelectedAlertForAction(alert)}
                        className="px-3 py-1.5 text-[12px] font-medium rounded-[7px] bg-[#0066CC] hover:bg-[#004C99] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Dispatch Directive</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedActions.length === 0 ? (
            <div className="p-8 text-center text-[#6B7280] text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px]">
              No active containment directives pending.
            </div>
          ) : (
            displayedActions.map((act) => {
            const currentStepIdx =
              act.status === 'completed'
                ? 4
                : act.status === 'in_progress'
                ? 3
                : 2;

            return (
              <div
                key={act.id}
                className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-4 text-[12px] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[14px] text-[#111111]">
                      {act.title}
                    </div>
                    <div className="text-[#6B7280] text-[11px]">
                      Target Camp: {act.camp_id} · Priority: {act.priority.toUpperCase()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleActionStatusChange(act.id, act.status)}
                    className="px-3 py-1 text-[11px] font-medium rounded-[5px] border border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#111111] transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    Advance Status →
                  </button>
                </div>

                <p className="text-[12px] text-[#4B5563] whitespace-pre-line leading-relaxed">
                  {act.instructions || act.description}
                </p>

                {/* Clean Action Timeline: Detected -> Verified -> Assigned -> In Progress -> Completed */}
                <div className="pt-2 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between max-w-lg">
                    {timelineSteps.map((step, idx) => {
                      const isPastOrCurrent = idx <= currentStepIdx;
                      const isComplete = idx < currentStepIdx || (idx === 4 && act.status === 'completed');

                      return (
                        <div key={step} className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isPastOrCurrent ? 'bg-[#0066CC]' : 'bg-[#D1D5DB]'
                            }`}
                          />
                          <span
                            className={`text-[11px] ${
                              isPastOrCurrent ? 'text-[#111111] font-medium' : 'text-[#9CA3AF]'
                            }`}
                          >
                            {step}
                          </span>
                          {idx < timelineSteps.length - 1 && (
                            <span className="text-[#E5E7EB] mx-1">→</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      )}

      {selectedAlertForAction && (
        <ActionModal
          alert={selectedAlertForAction}
          isOpen={!!selectedAlertForAction}
          onClose={() => setSelectedAlertForAction(null)}
          onActionCreated={() => {
            loadData();
            setSelectedAlertForAction(null);
          }}
        />
      )}
    </div>
  );
};
