import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  Droplets,
  Megaphone,
  CheckCircle,
  Send,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Alert, Recommendation } from '../types';
import { getRecommendation, createAction } from '../services/api';

interface ActionModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onActionCreated: () => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  alert,
  isOpen,
  onClose,
  onActionCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (isOpen && alert) {
      setPriority(alert.severity || 'high');
      fetchRecommendation();
    }
  }, [isOpen, alert]);

  const fetchRecommendation = async () => {
    if (!alert) return;
    setLoading(true);
    try {
      const res = await getRecommendation({
        alert_reason: alert.reason,
        syndrome: alert.trigger_data?.syndrome || 'Gastrointestinal / Waterborne',
        severity: alert.severity,
        environmental_context: alert.trigger_data?.environmental_factors || ['Water contamination'],
      });
      const rec: Recommendation = res.data;
      setRecommendation(rec);
      setTitle(`Action: ${alert.reason}`);
      setInstructions(
        [
          'IMMEDIATE INTERVENTIONS:',
          ...(rec.immediate_actions || []).map((a) => `• ${a}`),
          '\nWATER & SANITATION MEASURES:',
          ...(rec.environmental_actions || []).map((a) => `• ${a}`),
          '\nCOMMUNITY AWARENESS:',
          rec.awareness_message,
        ].join('\n')
      );
    } catch (err) {
      console.error(err);
      setTitle(`Public Health Response: ${alert.reason}`);
      setInstructions('Deploy field sanitation and verify drinking water sources immediately.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!alert) return;
    setSubmitting(true);
    try {
      await createAction({
        camp_id: alert.camp_id,
        alert_id: alert.id,
        title,
        description: recommendation?.situation_summary || alert.description,
        priority,
        instructions,
        deadline: deadline || undefined,
      });
      onActionCreated();
      onClose();
    } catch (err) {
      console.error(err);
      window.alert('Failed to create action plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 via-teal-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AI Public Health Action Plan Generator
              </h3>
              <p className="text-xs text-slate-500">
                Target: <span className="font-semibold text-slate-700">{alert.camp_name || alert.camp_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              <p className="text-sm font-medium">Synthesizing public-health guidance protocols...</p>
            </div>
          ) : (
            <>
              {/* Trigger Summary */}
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-xs flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Detected Signal: </span>
                  {alert.reason}
                  {alert.description && <div className="text-rose-700 mt-1">{alert.description}</div>}
                </div>
              </div>

              {/* AI Recommended Guidance Accordion / Sections */}
              {recommendation && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    AI Public-Health Recommendations
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5 text-sky-700">
                        <CheckCircle className="w-3.5 h-3.5" /> Priority Response
                      </div>
                      <ul className="space-y-1 text-slate-600">
                        {recommendation.immediate_actions?.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-sky-500 font-bold">•</span> {act}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5 text-teal-700">
                        <Droplets className="w-3.5 h-3.5" /> Water & Vector Controls
                      </div>
                      <ul className="space-y-1 text-slate-600">
                        {recommendation.environmental_actions?.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-teal-500 font-bold">•</span> {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {recommendation.awareness_message && (
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
                      <span className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1">
                        <Megaphone className="w-3.5 h-3.5 text-amber-600" /> Community Broadcast Bulletin
                      </span>
                      <p className="text-amber-800 italic">"{recommendation.awareness_message}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Editable Assignment Form */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assign Formal Action Directive
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Directive Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., Urgent: Chlorination and ORS Depot Setup"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical / Immediate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Target Resolution Time
                    </label>
                    <input
                      type="text"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      placeholder="e.g., Within 6 hours"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Operational Field Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Assigned to Camp Coordinator in-charge
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting || loading || !title}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Dispatch Public Health Directive
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
