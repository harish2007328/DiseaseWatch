import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
  ShieldAlert,
  Send,
  Plus,
} from 'lucide-react';
import { getAlerts, getActions, updateAction, verifyAlert } from '../services/api';
import { Alert, Action } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { ActionModal } from '../components/ActionModal';

export const AlertsAndActionsView: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<Alert | null>(null);
  const [viewTab, setViewTab] = useState<'alerts' | 'actions'>('alerts');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alerts & Field Directives
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Surveillance alerts and assigned response actions
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewTab('alerts')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              viewTab === 'alerts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Early Warning Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setViewTab('actions')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              viewTab === 'actions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Response Directives ({actions.length})
          </button>
        </div>
      </div>

      {viewTab === 'alerts' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <RiskBadge level={alert.severity} size="sm" />
                  <span className="text-[11px] text-slate-400">
                    {new Date(alert.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {alert.reason}
                  </h3>
                  <div className="text-xs font-semibold text-sky-700 mt-0.5">
                    Location: {alert.camp_name || alert.camp_id}
                  </div>
                </div>

                {alert.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {alert.description}
                  </p>
                )}

                {alert.trigger_data && (
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                    {alert.trigger_data.syndrome && (
                      <div>
                        <strong>Suspected Syndrome:</strong> {alert.trigger_data.syndrome}
                      </div>
                    )}
                    {alert.trigger_data.environmental_factors && (
                      <div>
                        <strong>Environmental Triggers:</strong>{' '}
                        {alert.trigger_data.environmental_factors.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    alert.status === 'action_assigned'
                      ? 'bg-teal-100 text-teal-800'
                      : alert.status === 'verified'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Status: {alert.status.replace('_', ' ')}
                </span>

                <button
                  onClick={() => setSelectedAlertForAction(alert)}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Dispatch Action Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((act) => (
            <div
              key={act.id}
              className={`p-5 rounded-2xl border transition-all bg-white ${
                act.status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        act.priority === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : act.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {act.priority}
                    </span>
                    <span className="text-xs font-bold text-sky-700">
                      Camp: {act.camp_name || act.camp_id}
                    </span>
                    {act.deadline && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Due: {act.deadline}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-sm font-bold ${
                      act.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'
                    }`}
                  >
                    {act.title}
                  </h3>

                  {act.instructions && (
                    <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-line mt-2">
                      {act.instructions}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleActionStatusChange(act.id, act.status)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      act.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : act.status === 'in_progress'
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {act.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </>
                    ) : act.status === 'in_progress' ? (
                      <>
                        <Clock className="w-3.5 h-3.5" /> In Progress (Click to Complete)
                      </>
                    ) : (
                      <>Start Directive</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Plan Modal */}
      <ActionModal
        alert={selectedAlertForAction}
        isOpen={!!selectedAlertForAction}
        onClose={() => setSelectedAlertForAction(null)}
        onActionCreated={() => {
          setSelectedAlertForAction(null);
          loadData();
        }}
      />
    </div>
  );
};
