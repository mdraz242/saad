import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  Users2,
  FileSpreadsheet,
  MessageSquare,
  Package,
  User,
  KeyRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { api, staffAuthStorage } from '../../services/api';
import { StaffUser } from '../../types';

export const EmployeeLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    const token = staffAuthStorage.getToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    api
      .staffMe()
      .then((res) => {
        if (res.staff) {
          setCurrentStaff(res.staff);
        } else {
          staffAuthStorage.clearToken();
          navigate('/admin/login');
        }
      })
      .catch(() => {
        staffAuthStorage.clearToken();
        navigate('/admin/login');
      })
      .finally(() => setLoading(false));

    api.getMessagesInbox({ unreadOnly: 'true' })
      .then((data) => {
        if (typeof data.unreadCount === 'number') {
          setUnreadMsgCount(data.unreadCount);
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.staffLogout();
    } catch (e) {
      // ignore
    } finally {
      staffAuthStorage.clearToken();
      navigate('/admin/login');
    }
  };

  const isActive = (path: string) => {
    if (path === '/employee/dashboard') {
      return location.pathname === '/employee' || location.pathname === '/employee/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-xs">Loading Employee Workspace...</span>
        </div>
      </div>
    );
  }

  const workspaceNav = [
    { label: 'My Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { label: 'Case Inbox', path: '/employee/cases', icon: Inbox },
    { label: 'Projects', path: '/employee/projects', icon: FolderKanban },
    { label: 'Customers', path: '/employee/customers', icon: Users2 },
    { label: 'Quotations', path: '/employee/quotations', icon: FileSpreadsheet },
    { label: 'Messages', path: '/employee/messages', icon: MessageSquare, badge: unreadMsgCount > 0 ? unreadMsgCount : null },
    { label: 'Products (Catalog)', path: '/employee/products', icon: Package },
  ];

  const accountNav = [
    { label: 'My Profile', path: '/employee/profile', icon: User },
    { label: 'Change Password', path: '/employee/change-password', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-200 sticky top-0 h-screen z-40 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
          <Link to="/employee/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-400 font-bold text-sm">BP</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-white text-sm tracking-tight leading-tight">
                  BETONGPORTALEN
                </span>
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide">
                  Staff Workspace
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* Workspace */}
          <div>
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Workspace
              </p>
            )}
            <nav className="space-y-1">
              {workspaceNav.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition group ${
                      active
                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Account */}
          <div>
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Account
              </p>
            )}
            <nav className="space-y-1">
              {accountNav.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition group ${
                      active
                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition px-2 py-1 rounded hover:bg-slate-800 w-full"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {!collapsed && <span>Public Website</span>}
            </Link>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400 flex-shrink-0">
                {currentStaff?.name?.charAt(0) || 'E'}
              </div>
              {!collapsed && (
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {currentStaff?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentStaff?.role === 'ADMINISTRATOR' ? 'Admin' : 'Employee'}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 text-white px-4 h-14 flex items-center justify-between sticky top-0 z-30">
          <Link to="/employee/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-xs">BP</span>
            </div>
            <span className="font-bold text-sm tracking-tight">BETONGPORTALEN</span>
            <span className="text-[10px] text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Staff</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-4 z-30">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-500 px-2 mb-1">Workspace</p>
              {workspaceNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded text-xs text-slate-300 hover:bg-slate-800"
                >
                  <item.icon className="h-4 w-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-500 px-2 mb-1">Account</p>
              {accountNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded text-xs text-slate-300 hover:bg-slate-800"
                >
                  <item.icon className="h-4 w-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">{currentStaff?.name}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-400 hover:underline flex items-center gap-1"
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;

