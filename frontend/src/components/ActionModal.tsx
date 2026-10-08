import React, { useState, useEffect } from 'react';
import {
  X,
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
          '',
          'ENVIRONMENTAL & SANITATION:',
          ...(rec.environmental_actions || []).map((a) => `• ${a}`),
          '',
          'COMMUNITY BROADCAST:',
          rec.awareness_message ? `"${rec.awareness_message}"` : 'Maintain strict boiling water protocol.',
        ].join('\n')
      );
      setDeadline('Within 6 hours');
    } catch (err) {
      setTitle(`Action: Intervene on ${alert.reason}`);
      setInstructions('1. Deploy medical inspection squad\n2. Distribute clean drinking water containers\n3. Sanitize latrines');
      setDeadline('Within 12 hours');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!alert || !title) return;
    setSubmitting(true);
    try {
      await createAction({
        camp_id: alert.camp_id,
        title,
        description: instructions,
        action_type: 'containment',
        priority,
        target_resolution_hours: 6,
        instructions,
      });
      onActionCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#111111]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[7px] bg-[#EAF3FF] text-[#0066CC] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#111111]">
                Dispatch Public Health Directive
              </h2>
              <p className="text-[12px] text-[#6B7280]">
                Camp {alert.camp_id} · Triggered by {alert.reason}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111111] p-1.5 rounded-[7px] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#6B7280]">
              <Loader2 className="w-5 h-5 animate-spin text-[#0066CC] mb-2" />
              <span className="text-[13px]">Generating public health protocols...</span>
            </div>
          ) : (
            <>
              {recommendation && (
                <div className="space-y-3">
                  <div className="text-[12px] font-semibold text-[#111111] uppercase tracking-wider">
                    Recommended Response
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                    <div className="p-3 rounded-[8px] bg-[#F7F8FA] border border-[#E5E7EB]">
                      <div className="font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0066CC]" /> Immediate Actions
                      </div>
                      <ul className="space-y-1.5 text-[#4B5563]">
                        {recommendation.immediate_actions?.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#0066CC] font-bold">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-[8px] bg-[#F7F8FA] border border-[#E5E7EB]">
                      <div className="font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-[#0066CC]" /> Sanitation & Water
                      </div>
                      <ul className="space-y-1.5 text-[#4B5563]">
                        {recommendation.environmental_actions?.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#0066CC] font-bold">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {recommendation.awareness_message && (
                    <div className="p-3 rounded-[8px] bg-[#F7F8FA] border border-[#E5E7EB] text-[12px]">
                      <div className="font-semibold text-[#111111] flex items-center gap-1.5 mb-1">
                        <Megaphone className="w-3.5 h-3.5 text-[#6B7280]" /> Public Guidance Bulletin
                      </div>
                      <p className="text-[#4B5563]">"{recommendation.awareness_message}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Directive Form */}
              <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                <div>
                  <label className="block text-[12px] font-medium text-[#111111] mb-1">
                    Directive Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#111111] mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#111111] mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#6B7280]" /> Target Resolution
                    </label>
                    <input
                      type="text"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      placeholder="e.g. Within 6 hours"
                      className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#111111] mb-1">
                    Operational Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-2 text-[12px] font-mono bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC] leading-relaxed"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F7F8FA] border-t border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[11px] text-[#6B7280]">
            Assigned to Camp Coordinator in-charge
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] font-medium text-[#4B5563] hover:text-[#111111] rounded-[7px] border border-[#E5E7EB] bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting || loading || !title}
              className="px-4 py-1.5 text-[12px] font-medium rounded-[7px] bg-[#0066CC] hover:bg-[#004C99] text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Dispatch Directive
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
