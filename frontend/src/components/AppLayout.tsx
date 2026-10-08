import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map as MapIcon,
  FileText,
  AlertTriangle,
  Layers,
  Droplets,
  CheckCircle2,
  Sliders,
  Bell,
  Search,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationRead } from '../services/api';
import { Notification } from '../types';
import { DisclaimerBanner } from './DisclaimerBanner';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, activeCampId, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications(activeCampId || undefined, role);
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter((n: Notification) => !n.read).length);
    } catch {
      // offline fallback
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

  const navItems =
    role === 'camp'
      ? [
          { label: 'Camp Station Desk', path: '/', icon: LayoutDashboard },
          { label: 'Tirunelveli Map', path: '/map', icon: MapIcon },
          { label: 'Report Health Incident', path: '/report', icon: FileText },
          { label: 'Environmental Hazard', path: '/environmental', icon: Droplets },
          { label: 'Camp Action Tasks', path: '/alerts-actions', icon: AlertTriangle },
        ]
      : [
          { label: 'Dashboard', path: '/', icon: LayoutDashboard },
          { label: 'District Map', path: '/map', icon: MapIcon },
          { label: 'Verification Queue', path: '/verification', icon: CheckCircle2 },
          { label: 'Alerts & Directives', path: '/alerts-actions', icon: AlertTriangle },
          { label: 'Outbreak Clusters', path: '/clusters', icon: Layers },
          { label: 'ML Risk Sandbox', path: '/ml-sandbox', icon: Sliders },
        ];

  return (
    <div className="h-screen bg-[#F7F8FA] text-[#111111] flex flex-col font-sans overflow-hidden">
      {/* Top Disclaimer Strip */}
      <DisclaimerBanner />

      {/* Top Header Bar */}
      <header className="h-14 shrink-0 bg-[#FFFFFF] border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between z-40">
        {/* Left: Product Wordmark & Context */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#0066CC] text-white flex items-center justify-center font-semibold text-xs tracking-tight">
              DW
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-[#111111]">
              DiseaseWatch
            </span>
          </NavLink>

          <span className="text-[#E5E7EB] text-sm">/</span>

          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0066CC]"></span>
            <span className="font-medium text-[#111111]">Tirunelveli District</span>
            <span>·</span>
            <span>{role === 'camp' ? 'Relief Camp Station' : 'Surveillance Command Desk'}</span>
          </div>
        </div>

        {/* Center: Search Input */}
        <div className="hidden md:flex items-center w-72 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search camps, syndromes, alerts..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:bg-[#FFFFFF] focus:border-[#0066CC] transition-colors"
            />
          </div>
        </div>

        {/* Right: Notifications, Role Switcher, Logout */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-[7px] border border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#4B5563] relative transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] z-50 p-2 overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#E5E7EB] px-2 pt-1">
                  <span className="text-[12px] font-semibold text-[#111111]">
                    Notifications ({notifications.length})
                  </span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#6B7280] hover:text-[#111111] p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-[#6B7280]">
                      No active notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleRead(n.id)}
                        className={`p-2 rounded-[6px] text-[11px] cursor-pointer transition-colors border ${
                          n.read
                            ? 'bg-transparent border-transparent text-[#6B7280]'
                            : 'bg-[#F7F8FA] border-[#E5E7EB] text-[#111111]'
                        }`}
                      >
                        <div className="font-medium text-[#111111]">{n.title}</div>
                        <div className="text-[#6B7280] mt-0.5">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Role Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] border border-[#E5E7EB] bg-[#F7F8FA] text-[12px]">
            <span className="w-2 h-2 rounded-full bg-[#0066CC]"></span>
            <span className="font-medium text-[#111111]">
              {role === 'admin' ? 'District Administrator' : 'Camp Coordinator'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded-[7px] border border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main App Body: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Sidebar (Full screen height, internal scroll if needed) */}
        <aside className="w-56 bg-[#FFFFFF] border-r border-[#E5E7EB] shrink-0 flex flex-col justify-between py-4 px-3 hidden md:flex h-full overflow-y-auto">
          <nav className="space-y-1">
            <div className="px-2.5 py-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              {role === 'camp' ? 'Camp Operations' : 'District Surveillance'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EAF3FF] text-[#0066CC]'
                      : 'text-[#4B5563] hover:text-[#111111] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0066CC]' : 'text-[#6B7280]'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Session Info */}
          <div className="pt-3 border-t border-[#E5E7EB] px-2 text-[11px]">
            <div className="font-medium text-[#111111] truncate">{user?.name || 'Authorized Officer'}</div>
            <div className="text-[#6B7280] truncate">{user?.email || 'admin@diseasewatch.gov.in'}</div>
            <div className="mt-2 text-[10px] text-[#6B7280]">
              Version 1.0 · Tirunelveli Unit
            </div>
          </div>
        </aside>

        {/* Content View Canvas */}
        <main className="flex-1 overflow-y-auto lg:overflow-hidden p-3 lg:p-4 flex flex-col min-h-0">
          <div className="w-full h-full flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
