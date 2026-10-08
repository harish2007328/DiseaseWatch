export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'camp';
  camp_id: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Camp {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  population: number;
  district: string;
  ward: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  created_at: string;
  updated_at: string;
  health_report_count: number;
  environmental_report_count: number;
  active_cases: number;
  top_syndrome: string | null;
  environmental_issues: string[];
  last_report_time: string | null;
}

export interface CampDetail extends Camp {
  total_cases: number;
  health_reports: HealthReport[];
  environmental_reports: EnvironmentalReport[];
  risk_assessments: RiskAssessment[];
  alerts: Alert[];
  actions: Action[];
  symptoms_distribution: Record<string, number>;
  cases_trend: { date: string; cases: number }[];
  risk_trend: { date: string; risk_score: number }[];
}

export interface Symptoms {
  fever: boolean;
  headache: boolean;
  body_pain: boolean;
  cough: boolean;
  diarrhea: boolean;
  vomiting: boolean;
  rash: boolean;
  breathing_difficulty: boolean;
  other: string | null;
}

export interface HealthReport {
  id: string;
  camp_id: string;
  camp_name?: string;
  symptoms: Symptoms;
  case_count: number;
  affected_people: number;
  severity: 'mild' | 'moderate' | 'severe';
  notes: string | null;
  reported_at: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  risk_assessment?: RiskAssessment | null;
}

export interface EnvironmentalReport {
  id: string;
  camp_id: string;
  camp_name?: string;
  issue_type: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string | null;
  location: string | null;
  reported_at: string;
  verification_status: 'pending' | 'verified' | 'rejected';
}

export interface RiskAssessment {
  id: string;
  camp_id: string;
  health_report_id: string | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  suspected_syndrome: string;
  confidence: number;
  reasons: string[];
  features: Record<string, any>;
  created_at: string;
}

export interface Alert {
  id: string;
  camp_id: string;
  camp_name?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  description: string | null;
  trigger_data: Record<string, any>;
  status: 'pending' | 'verified' | 'action_assigned' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at?: string;
  recommended_actions?: string[];
}

export interface Action {
  id: string;
  camp_id: string;
  camp_name?: string;
  alert_id: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  instructions: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_at: string;
  deadline: string | null;
  completed_at: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'action' | 'verification' | 'escalation' | 'cluster' | 'completion' | 'info';
  read: boolean;
  camp_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DashboardSummary {
  total_camps: number;
  total_reports: number;
  active_alerts: number;
  high_risk_camps: number;
  total_affected: number;
  pending_actions: number;
  critical_camps: number;
  verified_reports: number;
  pending_reports: number;
  recent_alerts: Alert[];
  recent_reports: HealthReport[];
  disease_trends: { date: string; cases: number }[];
  risk_distribution: Record<string, number>;
}

export interface RiskAnalysisResult {
  risk_level: string;
  suspected_syndrome: string;
  confidence: number;
  reasons: string[];
  feature_importance?: Record<string, number>;
}

export interface AnomalyResult {
  is_anomaly: boolean;
  anomaly_score: number;
  deviation: number;
  message: string;
  details: Record<string, any>;
}

export interface Cluster {
  id: string;
  affected_camps: string[];
  affected_camp_ids: string[];
  total_cases: number;
  common_syndrome: string;
  environmental_factors: string[];
  center_lat: number;
  center_lng: number;
  radius_km: number;
  severity: string;
}

export interface Recommendation {
  situation_summary: string;
  alert_reason: string;
  immediate_actions: string[];
  prevention_actions: string[];
  environmental_actions: string[];
  awareness_message: string;
  escalation_recommendation: string;
}
