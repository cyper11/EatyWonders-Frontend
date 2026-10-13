import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/admin/DashboardLayout';
import KPICard, { KPIGrid } from '../components/admin/KPICard';
import UserDirectory from '../components/admin/UserDirectory';
import ApplicationReview from '../components/admin/ApplicationReview';
import ActivityLogViewer from '../components/admin/ActivityLogViewer';
import AuditLogs from '../components/admin/AuditLogs';
import AdminTickets from '../components/admin/AdminTickets';
import api, { API_BASE_URL } from '../api/backend';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import useDocumentTitle from '../hooks/useDocumentTitle';

// Import icons for KPI cards
const Icons = {
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Posts: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Applications: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Health: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Unlock: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Construction: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const toKpiChange = (value, suffix = '%') => {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}${suffix}`;
};

const mapUsersToDirectory = (users) => {
  return (Array.isArray(users) ? users : []).map((u) => {
    const bannedMs = u?.banned_until ? Date.parse(u.banned_until) : NaN;
    const isBanned = Number.isFinite(bannedMs) && bannedMs > Date.now();
    return {
      id: u.id,
      name: u.name || u.email || 'User',
      email: u.email || '',
      role: u.role || 'user',
      status: isBanned ? 'banned' : (u.lockout_until && new Date(u.lockout_until) > new Date() ? 'locked' : 'active'),
      failedLoginAttempts: u.failed_login_attempts || 0,
      lockoutUntil: u.lockout_until || null,
      createdAt: u.created_at || u.createdAt || new Date().toISOString(),
      posts: Number(u.posts_count) || 0,
      avatar: u.profile_url ? (u.profile_url.startsWith('http') ? u.profile_url : `${API_BASE_URL}${u.profile_url}`) : null,
      bannedUntil: u.banned_until || null,
      _raw: u,
    };
  });
};

const mapApplicationsToReview = (applications) => {
  return (Array.isArray(applications) ? applications : []).map((a) => ({
    id: a.id,
    name: a.name || 'Restaurant',
    address: a.address || '',
    applicantName: a.applicant_name || a.applicant_email || 'Applicant',
    applicantEmail: a.applicant_email || '',
    status: a.approval_status || 'pending',
    submittedAt: a.created_at || new Date().toISOString(),
    businessRegDate: a.business_reg_date || null,
    businessRegistrationUrl: a.business_registration_url
      ? (a.business_registration_url.startsWith('http') ? a.business_registration_url : `${API_BASE_URL}${a.business_registration_url}`)
      : null,
    barangayClearanceUrl: a.barangay_clearance_url
      ? (a.barangay_clearance_url.startsWith('http') ? a.barangay_clearance_url : `${API_BASE_URL}${a.barangay_clearance_url}`)
      : null,
    birUrl: a.bir_registration_url
      ? (a.bir_registration_url.startsWith('http') ? a.bir_registration_url : `${API_BASE_URL}${a.bir_registration_url}`)
      : null,
    idUrl: a.owner_id_url
      ? (a.owner_id_url.startsWith('http') ? a.owner_id_url : `${API_BASE_URL}${a.owner_id_url}`)
      : null,
    description: a.description || '',
    rejectionReason: a.rejection_reason || null,
    _raw: a,
  }));
};

const mapLogsToViewer = (logs) => {
  return (Array.isArray(logs) ? logs : []).map((l) => {
    const path = String(l.path || '').toLowerCase();
    const method = String(l.method || '').toUpperCase();
    let action = 'login';
    let description = '';
    
    if (path.includes('/auth/register')) action = 'register';
    else if (path.includes('/owner-applications') && path.includes('/approve')) action = 'approval';
    else if (path.includes('/owner-applications') && path.includes('/reject')) action = 'rejection';
    else if (method === 'DELETE' || path.includes('/delete')) action = 'delete';
    else if (path.includes('/uploads')) action = 'upload';
    else if (path.includes('/unban')) action = 'unban';
    else if (path.includes('/ban')) action = 'ban';
    else if (path.includes('/auth/login')) action = 'login';
    else if (path.includes('/webhooks/deploy-status')) {
      action = 'webhook';
      // Try to extract description from metadata
      try {
        const metadata = l.metadata ? JSON.parse(l.metadata) : {};
        description = metadata.description || `Deployment webhook: ${metadata.event || 'unknown'}`;
      } catch {
        description = 'Deployment webhook received';
      }
    }
    else if (path.includes('/webhooks/force-unlock')) {
      action = 'force-unlock';
      description = 'Admin force-unlocked the system from maintenance mode';
    }

    // Use extracted description or default. Detect failures via status or metadata to mark negative attempts.
    let metadataObj = null;
    try { metadataObj = l.metadata ? JSON.parse(l.metadata) : null; } catch {}
    const failed = (l.status && Number(l.status) >= 400) || (metadataObj && String(metadataObj.event || '').toLowerCase().includes('failed')) || (metadataObj && String(metadataObj.event || '').toLowerCase().includes('error'));

    if (!description) {
      if (failed) {
        const statusText = l.status ? `status=${l.status}` : 'error';
        const metaMsg = metadataObj?.error || metadataObj?.message || '';
        description = `${l.user_email || 'A user'} attempted ${action} — FAILED (${statusText})${metaMsg ? ` — ${metaMsg}` : ''}`;
      } else {
        description = `${l.user_email || 'A user'} performed ${action}`;
      }
    }

    return {
      id: l.id,
      userEmail: l.user_email || 'Unknown',
      userRole: l.user_role || '',
      action,
      description,
      timestamp: l.created_at || new Date().toISOString(),
      _raw: l,
    };
  });
};

// Dashboard Overview Component
const DashboardOverview = ({ summary, systemOverview, onQuickAction, maintenanceStatus, onForceUnlock, forceUnlockLoading, onToggleMaintenance, maintenanceToggleLoading }) => {
  const isMaintenanceMode = maintenanceStatus?.maintenanceMode;
  
  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <KPIGrid>
        <KPICard
          title="Total Users"
          value={summary.total_users}
          change={toKpiChange(summary.total_users_change)}
          changeType={Number(summary.total_users_change) >= 0 ? 'positive' : 'negative'}
          icon={Icons.Users}
          onClick={() => onQuickAction?.('users')}
        />
        <KPICard
          title="Total Posts"
          value={summary.total_posts}
          change={toKpiChange(summary.total_posts_change)}
          changeType={Number(summary.total_posts_change) >= 0 ? 'positive' : 'negative'}
          icon={Icons.Posts}
          onClick={() => onQuickAction?.('posts')}
        />
        <KPICard
          title="Pending Applications"
          value={summary.pending_owner_applications}
          changeType="neutral"
          icon={Icons.Applications}
          onClick={() => onQuickAction?.('applications')}
        />
        <KPICard
          title="System Health"
          value={isMaintenanceMode ? 'Maintenance' : systemOverview.healthLabel}
          status={isMaintenanceMode ? 'warning' : systemOverview.healthStatus}
          subtitle={isMaintenanceMode ? 'Deployment in progress' : systemOverview.healthSubtitle}
          icon={isMaintenanceMode ? Icons.Construction : Icons.Health}
          onClick={() => onQuickAction?.('logs')}
        />
      </KPIGrid>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="admin-kpi-card">
          <h3 className="text-lg font-semibold text-content-primary mb-4">System Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-background-tertiary">
              <span className="text-content-secondary">Server Load</span>
              <span className="font-medium text-content-primary">{systemOverview.serverLoad}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-background-tertiary">
              <span className="text-content-secondary">Database Connections</span>
              <span className="font-medium text-content-primary">{systemOverview.databaseConnections}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-background-tertiary">
              <span className="text-content-secondary">Errors (24h)</span>
              <span className={`font-medium ${systemOverview.errorsLast24h === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {systemOverview.errorsLast24h}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-content-secondary">Last Backup</span>
              <span className="font-medium text-content-primary">
                {systemOverview.lastBackup ? new Date(systemOverview.lastBackup).toLocaleString() : '—'}
              </span>
            </div>
          </div>
        </div>

            {/* System Control Card */}
            <div className="admin-kpi-card border border-background-tertiary">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-content-primary">System Control</h3>
                  <p className="text-xs text-content-secondary">Manage platform availability</p>
                </div>
                {isMaintenanceMode && (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-500/20 animate-pulse">
                    Maintenance Active
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Maintenance Status Info */}
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${isMaintenanceMode ? 'bg-amber-500/5 border-amber-500/20 shadow-inner' : 'bg-emerald-500/5 border-emerald-500/20 shadow-inner'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${isMaintenanceMode ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                      {isMaintenanceMode ? (
                        <Icons.Lock className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Icons.Unlock className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isMaintenanceMode ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {isMaintenanceMode ? 'Platform Restricted' : 'Platform Operational'}
                      </span>
                      <span className="text-[10px] text-content-secondary uppercase font-bold tracking-tight">Current Status</span>
                    </div>
                  </div>
                  <p className="text-sm text-content-secondary leading-relaxed px-1">
                    {isMaintenanceMode 
                      ? maintenanceStatus?.maintenanceReason || 'Manual maintenance mode is active. Public access is currently blocked.'
                      : 'Public access is enabled. The platform is operating normally and accessible to all users.'}
                  </p>
                  {isMaintenanceMode && maintenanceStatus?.maintenanceStartedAt && (
                    <div className="mt-3 pt-3 border-t border-amber-500/10 flex items-center justify-between text-[10px] font-bold text-amber-700/60 uppercase">
                      <span>Started</span>
                      <span>{new Date(maintenanceStatus.maintenanceStartedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Manual Maintenance Toggle */}
                <div className="flex items-center justify-between p-4 bg-background-secondary/50 rounded-2xl border border-background-tertiary hover:border-brand-accent/30 transition-colors group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-content-primary group-hover:text-brand-accent transition-colors">Global Maintenance Mode</span>
                    <span className="text-[10px] text-content-secondary font-medium">Trigger manual system lockout</span>
                  </div>
                  <button
                    onClick={() => onToggleMaintenance(!isMaintenanceMode)}
                    disabled={maintenanceToggleLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none shadow-sm ${
                      isMaintenanceMode ? 'bg-amber-500 shadow-amber-500/20' : 'bg-slate-300'
                    } ${maintenanceToggleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                  >
                    <span
                      className={`${
                        isMaintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-md`}
                    />
                  </button>
                </div>

                {/* Force Unlock Button */}
                <button
                  onClick={onForceUnlock}
                  disabled={forceUnlockLoading || !isMaintenanceMode}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all duration-300 ${
                    isMaintenanceMode
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/25 hover:-translate-y-0.5 active:translate-y-0'
                      : 'bg-background-tertiary text-content-secondary cursor-not-allowed opacity-40'
                  }`}
                >
                  {forceUnlockLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Icons.Unlock className="w-4 h-4" />
                      {isMaintenanceMode ? 'Force Emergency Unlock' : 'System is Unlocked'}
                    </>
                  )}
                </button>

                {/* Help Text */}
                <div className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                  <div className="mt-0.5">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-[10px] text-blue-700/70 font-medium leading-normal">
                    {isMaintenanceMode 
                      ? 'Force Unlock bypasses all deployment locks. Use only if standard procedures fail to restore access.'
                      : 'Automated deployment maintenance is now disabled. All system locks must be performed manually by an administrator.'}
                  </p>
                </div>
              </div>
            </div>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser, startImpersonation } = useAuth();
  useDocumentTitle('Admin Dashboard');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState(null);
  const [busyApplicationId, setBusyApplicationId] = useState(null);

  const [summary, setSummary] = useState({
    total_users: 0,
    total_users_change: 0,
    total_posts: 0,
    total_posts_change: 0,
    pending_owner_applications: 0,
    latest_post_at: null,
  });
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [posts, setPosts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [busyTicketId, setBusyTicketId] = useState(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsTotalPages, setAuditLogsTotalPages] = useState(1);
  const [auditLogsTotalCount, setAuditLogsTotalCount] = useState(0);

  const [maintenanceToggleLoading, setMaintenanceToggleLoading] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    maintenanceMode: false,
    maintenanceReason: null,
    maintenanceStartedAt: null,
    lastBuild: null,
  });
  const [forceUnlockLoading, setForceUnlockLoading] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({
    serverLoad: '—',
    databaseConnections: '—',
    errorsLast24h: 0,
    lastBackup: null,
    healthStatus: 'healthy',
    healthLabel: 'Operational',
  });

  // Toggle Maintenance Mode
  const toggleMaintenance = async (active) => {
    const action = active ? 'enable' : 'disable';
    if (!window.confirm(`Are you sure you want to ${action} maintenance mode?`)) {
      return;
    }

    setMaintenanceToggleLoading(true);
    try {
      const { data } = await api.patch('/api/admin/settings/maintenance', { active });
      if (data.success) {
        toast.success(data.message);
        await fetchMaintenanceStatus();
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.error || `Failed to ${action} maintenance mode`;
      toast.error(errorMsg);
    } finally {
      setMaintenanceToggleLoading(false);
    }
  };

  // Fetch maintenance status
  const fetchMaintenanceStatus = async () => {
    try {
      const response = await api.get('/api/webhooks/maintenance-status');
      setMaintenanceStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    }
  };

  // Fetch live system stats
  const fetchSystemStats = async () => {
    try {
      const { data } = await api.get('/api/admin/system-stats');
      setSystemMetrics(data);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  // Force unlock maintenance mode
  const forceUnlock = async () => {
    if (!window.confirm('Are you sure you want to force unlock? This will disable maintenance mode and allow public access immediately.')) {
      return;
    }
    
    setForceUnlockLoading(true);
    try {
      await api.post('/api/webhooks/force-unlock');
      await fetchMaintenanceStatus();
      alert('Maintenance mode has been forcefully disabled. The site is now accessible to the public.');
    } catch (error) {
      const errorMsg = error?.response?.data?.error || 'Failed to force unlock';
      alert(`Error: ${errorMsg}`);
    } finally {
      setForceUnlockLoading(false);
    }
  };

  const systemOverview = useMemo(() => {
    const recentActivity = mapLogsToViewer(logs).slice(0, 10);
    return {
      ...systemMetrics,
      recentActivity,
      healthSubtitle: summary.latest_post_at ? `Latest post: ${new Date(summary.latest_post_at).toLocaleDateString()}` : 'All systems normal',
    };
  }, [logs, summary.latest_post_at, systemMetrics]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, usersRes, appsRes, logsRes] = await Promise.all([
        api.get('/api/admin/summary'),
        api.get('/api/admin/users?limit=500'),
        api.get('/api/admin/owner-applications?status=all'),
        api.get('/api/admin/logs?page=1&limit=50'),
      ]);

      // Fetch supplementary system info
      fetchSystemStats();
      fetchMaintenanceStatus();

      const s = summaryRes?.data?.summary || {};
      setSummary({
        total_users: Number(s.total_users) || 0,
        total_users_change: Number(s.total_users_change) || 0,
        total_posts: Number(s.total_posts) || 0,
        total_posts_change: Number(s.total_posts_change) || 0,
        pending_owner_applications: Number(s.pending_owner_applications) || 0,
        latest_post_at: s.latest_post_at || null,
      });

      setUsers(Array.isArray(usersRes?.data?.users) ? usersRes.data.users : []);
      setApplications(Array.isArray(appsRes?.data?.applications) ? appsRes.data.applications : []);
      setLogs(Array.isArray(logsRes?.data?.logs) ? logsRes.data.logs : []);
      
      const postsRes = await api.get('/api/uploads/posts');
      const postsData = postsRes?.data?.posts || postsRes?.data;
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) navigate('/login');
      setError(e?.response?.data?.error || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAll();
    fetchMaintenanceStatus();

    // Poll maintenance status every 10 seconds
    const maintenanceInterval = setInterval(fetchMaintenanceStatus, 10000);

    return () => clearInterval(maintenanceInterval);
  }, [fetchAll]);

  const directoryUsers = useMemo(() => mapUsersToDirectory(users), [users]);
  const reviewApplications = useMemo(() => mapApplicationsToReview(applications), [applications]);
  const viewerLogs = useMemo(() => mapLogsToViewer(logs), [logs]);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      const response = await api.get(`/api/admin/audit-logs?page=${page}&limit=20`);
      const data = response.data || {};
      setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
      setAuditLogsPage(data.currentPage || 1);
      setAuditLogsTotalPages(data.totalPages || 1);
      setAuditLogsTotalCount(data.totalCount || 0);
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    }
  }, []);

  // Fetch audit logs when audit section becomes active
  useEffect(() => {
    if (activeSection === 'audit') {
      fetchAuditLogs(auditLogsPage);
    }
  }, [activeSection, auditLogsPage, fetchAuditLogs]);

  // Fetch support tickets
  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get('/api/tickets');
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch (e) {
      console.error('Failed to fetch tickets:', e);
    }
  }, []);

  // Fetch tickets when tickets section becomes active
  useEffect(() => {
    if (activeSection === 'tickets') {
      fetchTickets();
    }
  }, [activeSection, fetchTickets]);

  const updateTicketStatus = async (ticketId, status, adminNotes) => {
    setBusyTicketId(ticketId);
    try {
      await api.patch(`/api/tickets/${ticketId}/status`, { status, admin_notes: adminNotes || null });
      await fetchTickets();
      toast.success(`Ticket #${ticketId} updated to ${status}`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to update ticket');
    } finally {
      setBusyTicketId(null);
    }
  };

  const banUser = async (userId, days, reason) => {
    setBusyUserId(userId);
    try {
      await api.post(`/api/admin/users/${userId}/ban`, { days, reason });
      await fetchAll();
    } finally {
      setBusyUserId(null);
    }
  };

  const unbanUser = async (userId) => {
    setBusyUserId(userId);
    try {
      await api.post(`/api/admin/users/${userId}/unban`);
      await fetchAll();
    } finally {
      setBusyUserId(null);
    }
  };

  const unlockUser = async (userId) => {
    setBusyUserId(userId);
    try {
      await api.patch(`/api/admin/users/${userId}/unlock`);
      toast.success('User account has been unlocked successfully.');
      await fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to unlock user.');
    } finally {
      setBusyUserId(null);
    }
  };

  const impersonateUser = async (userId) => {
    setBusyUserId(userId);
    try {
      const { data } = await api.get(`/api/admin/impersonate/${userId}`);
      if (!data?.user) {
        throw new Error('Impersonation target user data was not returned');
      }
      // Dual-Identity pattern: startImpersonation expects the target user object
      await startImpersonation(data.user);
      navigate('/');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to start impersonation');
    } finally {
      setBusyUserId(null);
    }
  };

  const approveApplication = async (applicationId) => {
    setBusyApplicationId(applicationId);
    try {
      await api.post(`/api/admin/owner-applications/${applicationId}/approve`);
      await fetchAll();
    } finally {
      setBusyApplicationId(null);
    }
  };

  const rejectApplication = async (applicationId, reason) => {
    setBusyApplicationId(applicationId);
    try {
      // Backend route currently doesn't take a reason; keep for future extension.
      await api.post(`/api/admin/owner-applications/${applicationId}/reject`, reason ? { reason } : {});
      await fetchAll();
    } finally {
      setBusyApplicationId(null);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm('Delete this post? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await api.delete(`/api/uploads/posts/${id}`);
      await fetchAll();
    } catch (e) {
      // Fallback to POST delete for environments that block DELETE
      try {
        await api.post(`/api/uploads/posts/${id}/delete`);
        await fetchAll();
      } catch (e2) {
        setError(e2?.response?.data?.error || 'Delete failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportLogsToCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Date', 'User Email', 'Role', 'Method', 'Path', 'Status', 'Message'];
    const rows = logs.map(log => {
      const viewerLog = mapLogsToViewer([log])[0];
      return [
        log.created_at || '',
        log.user_email || 'Unknown',
        log.user_role || '',
        log.method || '',
        log.path || '',
        log.status || '',
        viewerLog.description
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardOverview 
            summary={summary} 
            systemOverview={systemOverview} 
            onQuickAction={setActiveSection}
            maintenanceStatus={maintenanceStatus}
            onForceUnlock={forceUnlock}
            forceUnlockLoading={forceUnlockLoading}
            onToggleMaintenance={toggleMaintenance}
            maintenanceToggleLoading={maintenanceToggleLoading}
          />
        );
      case 'users':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">User Directory</h2>
                <p className="text-sm text-[var(--admin-text-muted)]">Manage user accounts and permissions</p>
              </div>
            </div>
            <UserDirectory
              users={directoryUsers}
              onBanUser={banUser}
              onUnbanUser={unbanUser}
              onUnlockUser={unlockUser}
              onImpersonateUser={impersonateUser}
              busyUserId={busyUserId}
              currentAdminId={currentUser?.id}
            />
          </div>
        );
      case 'applications':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Owner Applications</h2>
                <p className="text-sm text-[var(--admin-text-muted)]">Review and process restaurant owner applications</p>
              </div>
            </div>
            <ApplicationReview
              applications={reviewApplications}
              onApprove={approveApplication}
              onReject={rejectApplication}
              busyApplicationId={busyApplicationId}
            />
          </div>
        );
      case 'posts':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Content Moderation</h2>
                <p className="text-sm text-[var(--admin-text-muted)]">Manage community posts and reported content</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {posts.map(post => (
                <div key={post.id} className="admin-kpi-card flex flex-col md:flex-row gap-6">
                  {post.media?.[0] && (
                    <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 bg-background-secondary">
                      <img 
                        src={post.media[0].url.startsWith('http') ? post.media[0].url : `${API_BASE_URL}${post.media[0].url}`} 
                        alt="Post media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent text-xs font-bold">
                            {post.author_name?.[0] || post.author_email?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-content-primary">{post.author_name || 'Unknown'}</p>
                            <p className="text-xs text-content-secondary">{post.author_email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-content-secondary">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-content-primary mb-2">{post.caption}</p>
                      {post.address && (
                        <p className="text-xs text-brand-accent flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {post.address}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => deletePost(post.id)}
                        className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-all"
                      >
                        Delete Post
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="admin-kpi-card text-center py-12">
                  <p className="text-content-secondary">No posts found.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'tickets':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Support Tickets</h2>
                <p className="text-sm text-[var(--admin-text-muted)]">Manage user-submitted support tickets and issues</p>
              </div>
              <button
                onClick={fetchTickets}
                className="px-4 py-2 bg-brand-accent/10 text-brand-accent rounded-xl text-sm font-bold hover:bg-brand-accent/20 transition-all"
              >
                Refresh
              </button>
            </div>
            <AdminTickets
              tickets={tickets}
              onUpdateStatus={updateTicketStatus}
              busyTicketId={busyTicketId}
            />
          </div>
        );
      case 'logs':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Activity Logs</h2>
                <p className="text-sm text-[var(--admin-text-muted)]">System and user activity history</p>
              </div>
            </div>
            <ActivityLogViewer
              logs={viewerLogs}
              onExport={exportLogsToCSV}
              onRefresh={fetchAll}
              isLoading={loading}
            />
          </div>
        );
      case 'audit':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Compliance Audit Logs</h2>
                <p className="text-sm text-[var(--admin-text-muted)]">Permanent record of all admin approval, rejection, and moderation actions</p>
              </div>
            </div>
            <AuditLogs
              logs={auditLogs}
              onRefresh={() => fetchAuditLogs(auditLogsPage)}
              totalCount={auditLogsTotalCount}
              currentPage={auditLogsPage}
              totalPages={auditLogsTotalPages}
              onPageChange={(page) => {
                setAuditLogsPage(page);
                fetchAuditLogs(page);
              }}
              isLoading={loading}
            />
          </div>
        );
      default:
        return <DashboardOverview summary={summary} systemOverview={systemOverview} onQuickAction={setActiveSection} />;
    }
  };

  return (
    <DashboardLayout 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
      isMaintenanceMode={maintenanceStatus.maintenanceMode}
    >
      <div 
        style={{ 
          transition: 'opacity 0.2s ease-in-out',
          ...(loading ? {
            opacity: 0.5,
            pointerEvents: 'none',
            userSelect: 'none'
          } : {})
        }}
      >
        {error ? (
          <div className="admin-kpi-card border-red-200 dark:border-red-800">
            <p className="text-[var(--admin-text-primary)] font-semibold">Something went wrong</p>
            <p className="text-[var(--admin-text-muted)] mt-1">{error}</p>
            <div className="mt-4">
              <button className="admin-btn admin-btn-secondary" onClick={fetchAll} disabled={loading}>
                {loading ? 'Refreshing…' : 'Retry'}
              </button>
            </div>
          </div>
        ) : null}
        {loading ? (
          <div className="admin-kpi-card">
            <p className="text-[var(--admin-text-muted)]">Loading dashboard…</p>
          </div>
        ) : null}
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
