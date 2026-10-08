"""Pydantic models for DiseaseWatch API."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Severity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class AlertStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    ACTION_ASSIGNED = "action_assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class ActionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationType(str, Enum):
    ALERT = "alert"
    ACTION = "action"
    VERIFICATION = "verification"
    ESCALATION = "escalation"
    CLUSTER = "cluster"
    COMPLETION = "completion"
    INFO = "info"


# Auth models
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: Dict[str, Any]
    role: str
    camp_id: Optional[str] = None


# Camp models
class CampBase(BaseModel):
    name: str
    location_lat: float
    location_lng: float
    population: int = 0
    district: str = "Tirunelveli"
    ward: Optional[str] = None
    risk_level: RiskLevel = RiskLevel.LOW
    risk_score: float = 0


class CampResponse(CampBase):
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    health_report_count: int = 0
    environmental_report_count: int = 0
    active_cases: int = 0
    top_syndrome: Optional[str] = None
    environmental_issues: List[str] = []
    last_report_time: Optional[str] = None


class CampDetailResponse(CampResponse):
    health_reports: List[Dict[str, Any]] = []
    environmental_reports: List[Dict[str, Any]] = []
    risk_assessments: List[Dict[str, Any]] = []
    alerts: List[Dict[str, Any]] = []
    actions: List[Dict[str, Any]] = []
    symptoms_distribution: Dict[str, int] = {}
    cases_trend: List[Dict[str, Any]] = []
    risk_trend: List[Dict[str, Any]] = []


# Health report models
class SymptomsInput(BaseModel):
    fever: bool = False
    headache: bool = False
    body_pain: bool = False
    cough: bool = False
    diarrhea: bool = False
    vomiting: bool = False
    rash: bool = False
    breathing_difficulty: bool = False
    other: Optional[str] = None


class HealthReportCreate(BaseModel):
    camp_id: str
    symptoms: SymptomsInput
    case_count: int = 1
    affected_people: int = 1
    severity: Severity = Severity.MILD
    notes: Optional[str] = None


class HealthReportResponse(BaseModel):
    id: str
    camp_id: str
    camp_name: Optional[str] = None
    symptoms: Dict[str, Any]
    case_count: int
    affected_people: int
    severity: str
    notes: Optional[str] = None
    reported_at: str
    verification_status: str
    risk_assessment: Optional[Dict[str, Any]] = None


# Environmental report models
class EnvironmentalReportCreate(BaseModel):
    camp_id: str
    issue_type: str
    severity: Severity = Severity.MODERATE
    description: Optional[str] = None
    location: Optional[str] = None


class EnvironmentalReportResponse(BaseModel):
    id: str
    camp_id: str
    camp_name: Optional[str] = None
    issue_type: str
    severity: str
    description: Optional[str] = None
    location: Optional[str] = None
    reported_at: str
    verification_status: str


# Risk assessment models
class RiskAnalysisRequest(BaseModel):
    camp_id: str
    health_report_id: Optional[str] = None
    symptoms: SymptomsInput
    case_count: int = 1
    case_growth_rate: float = 0
    severity: Severity = Severity.MILD
    water_contamination: bool = False
    sanitation_problems: bool = False
    stagnant_water: bool = False
    mosquito_breeding: bool = False
    population: int = 100
    population_density: float = 1.0


class RiskAnalysisResponse(BaseModel):
    risk_level: str
    suspected_syndrome: str
    confidence: float
    reasons: List[str]
    feature_importance: Optional[Dict[str, float]] = None


# Anomaly detection models
class AnomalyRequest(BaseModel):
    camp_id: str
    current_cases: int
    historical_average: float = 0
    historical_std: float = 0
    time_window_days: int = 7


class AnomalyResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    deviation: float
    message: str
    details: Dict[str, Any] = {}


# Cluster detection models
class ClusterRequest(BaseModel):
    pass  # Uses all camp data


class ClusterResponse(BaseModel):
    clusters: List[Dict[str, Any]]
    total_clusters: int


# Alert models
class AlertResponse(BaseModel):
    id: str
    camp_id: str
    camp_name: Optional[str] = None
    alert_type: str
    severity: str
    reason: str
    description: Optional[str] = None
    trigger_data: Dict[str, Any] = {}
    status: str
    created_at: str
    updated_at: Optional[str] = None
    recommended_actions: Optional[List[str]] = None


class AlertVerifyRequest(BaseModel):
    action: str = Field(..., pattern="^(verify|reject)$")


# Action models
class ActionCreate(BaseModel):
    camp_id: str
    alert_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    instructions: Optional[str] = None
    deadline: Optional[str] = None


class ActionUpdate(BaseModel):
    status: ActionStatus


class ActionResponse(BaseModel):
    id: str
    camp_id: str
    camp_name: Optional[str] = None
    alert_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: str
    instructions: Optional[str] = None
    status: str
    assigned_at: str
    deadline: Optional[str] = None
    completed_at: Optional[str] = None


# Notification models
class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    read: bool
    camp_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: str


# Dashboard models
class DashboardSummary(BaseModel):
    total_camps: int = 0
    total_reports: int = 0
    active_alerts: int = 0
    high_risk_camps: int = 0
    total_affected: int = 0
    pending_actions: int = 0
    critical_camps: int = 0
    verified_reports: int = 0
    pending_reports: int = 0
    recent_alerts: List[AlertResponse] = []
    recent_reports: List[HealthReportResponse] = []
    disease_trends: List[Dict[str, Any]] = []
    risk_distribution: Dict[str, int] = {}


# AI Recommendation models
class RecommendationRequest(BaseModel):
    suspected_syndrome: str
    risk_level: str
    symptoms: List[str]
    environmental_conditions: List[str]
    case_count: int
    growth_trend: float = 0
    camp_name: Optional[str] = None
    nearby_affected_camps: List[str] = []


class RecommendationResponse(BaseModel):
    situation_summary: str
    alert_reason: str
    immediate_actions: List[str]
    prevention_actions: List[str]
    environmental_actions: List[str]
    awareness_message: str
    escalation_recommendation: str
