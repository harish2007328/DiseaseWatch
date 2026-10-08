import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Shield,
  Tent,
  Bell,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  Layers,
  Cpu,
  UserCheck,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationRead } from '../services/api';
import { Notification } from '../types';

export const Navbar: React.FC = () => {
  const { user, role, activeCampId, switchRole, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications(activeCampId || undefined, role);
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter((n: Notification) => !n.read).length);
    } catch {
      // offline or loading fallback
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [role, activeCampId]);

  const handleRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // fallback
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                    Disease<span className="text-sky-600">Watch</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 tracking-wide uppercase">
                    v1.0 Demo
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Disaster Health Surveillance & Early Warning
                </p>
              </div>
            </NavLink>

            {/* Navigation links based on role */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
              {role === 'admin' ? (
                <>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Layers className="w-4 h-4" />
                    Overview
                  </NavLink>
                  <NavLink
                    to="/map"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <MapPin className="w-4 h-4" />
                    District Map
                  </NavLink>
                  <NavLink
                    to="/verification"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Verification Queue
                  </NavLink>
                  <NavLink
                    to="/alerts-actions"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <AlertOctagon className="w-4 h-4" />
                    Alerts & Actions
                  </NavLink>
                  <NavLink
                    to="/clusters"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Shield className="w-4 h-4" />
                    Outbreak Clusters
                  </NavLink>
                  <NavLink
                    to="/ml-sandbox"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Cpu className="w-4 h-4 text-purple-600" />
                    ML Simulator
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Tent className="w-4 h-4" />
                    Camp Incident Desk
                  </NavLink>
                  <NavLink
                    to="/report"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Activity className="w-4 h-4" />
                    New Health Report
                  </NavLink>
                  <NavLink
                    to="/environmental"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Shield className="w-4 h-4" />
                    Environmental Hazard
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right Action & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Operational Alerts</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400">
                        No notifications currently active
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleRead(n.id)}
                          className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                            !n.read ? 'bg-sky-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-xs font-semibold ${
                                !n.read ? 'text-sky-950 font-bold' : 'text-slate-700'
                              }`}
                            >
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Switcher */}
            <div className="relative group">
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1 justify-end">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>{user?.name || 'User'}</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {role === 'admin' ? 'District Authority' : `Coordinator • ${activeCampId}`}
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={role === 'admin' ? 'admin' : activeCampId || 'camp-1'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'admin') {
                        switchRole('admin');
                      } else {
                        switchRole('camp', val);
                      }
                    }}
                    className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl px-3 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
                  >
                    <option value="admin">District Health Admin (All)</option>
                    <option value="camp-1">Camp 1: Govt High School</option>
                    <option value="camp-2">Camp 2: Community Hall</option>
                    <option value="camp-3">Camp 3: Sports Complex</option>
                  </select>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Sign out / Switch Role"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
