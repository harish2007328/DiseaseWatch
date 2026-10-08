/// <reference types="vite/client" />
import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const demoLogin = (email: string, password: string) =>
  api.post('/api/auth/demo-login', { email, password });
export const roleSelect = (data: { role: string; camp_id?: string; name?: string }) =>
  api.post('/api/auth/role-select', data);

// Camps
export const getCamps = () => api.get('/api/camps');
export const getCamp = (id: string) => api.get(`/api/camps/${id}`);

// Reports
export const getHealthReports = (campId?: string) =>
  api.get('/api/reports/health', { params: campId ? { camp_id: campId } : {} });
export const getEnvironmentalReports = (campId?: string) =>
  api.get('/api/reports/environmental', { params: campId ? { camp_id: campId } : {} });
export const createHealthReport = (data: any) =>
  api.post('/api/reports/health', data);
export const createEnvironmentalReport = (data: any) =>
  api.post('/api/reports/environmental', data);
export const verifyHealthReport = (id: string, status: string) =>
  api.patch(`/api/reports/health/${id}/verify`, null, { params: { status } });
export const verifyEnvironmentalReport = (id: string, status: string) =>
  api.patch(`/api/reports/environmental/${id}/verify`, null, { params: { status } });

// Analysis
export const analyzeRisk = (data: any) => api.post('/api/analyze/risk', data);
export const detectAnomaly = (data: any) => api.post('/api/analyze/anomaly', data);
export const detectClusters = () => api.post('/api/analyze/cluster');
export const getRecommendation = (data: any) => api.post('/api/analyze/recommend', data);

// Alerts
export const getAlerts = (campId?: string, status?: string) =>
  api.get('/api/alerts', { params: { ...(campId && { camp_id: campId }), ...(status && { status }) } });
export const getAlert = (id: string) => api.get(`/api/alerts/${id}`);
export const verifyAlert = (id: string, action: string) =>
  api.patch(`/api/alerts/${id}/verify`, { action });

// Actions
export const getActions = (campId?: string, status?: string) =>
  api.get('/api/actions', { params: { ...(campId && { camp_id: campId }), ...(status && { status }) } });
export const createAction = (data: any) => api.post('/api/actions', data);
export const updateAction = (id: string, status: string) =>
  api.patch(`/api/actions/${id}`, { status });

// Dashboard
export const getDashboardSummary = () => api.get('/api/dashboard/summary');

// Notifications
export const getNotifications = (campId?: string, role?: string) =>
  api.get('/api/notifications', { params: { ...(campId && { camp_id: campId }), ...(role && { role }) } });
export const markNotificationRead = (id: string) =>
  api.patch(`/api/notifications/${id}/read`);

export default api;
