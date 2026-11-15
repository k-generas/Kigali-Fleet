import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Database,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  BackgroundJob,
  PlatformAdmin,
  PlatformAuditLog,
  PlatformContentItem,
  PlatformIntegration,
  PlatformSettings,
  SecurityIncident,
  SuperAdminSubRole,
  SystemErrorLog,
} from '../../types';
import { ColorTheme } from '../../theme';
import { canModifyPlatformAdmin, isSuperAdminEmail } from '../../utils/auth';
import { ReasonActionModal, getStatusStyles } from './SuperAdminShared';

interface SuperAdminPlatformGovernanceProps {
  mode: 'integrations' | 'health' | 'security' | 'audit' | 'content' | 'settings' | 'admins';
  integrations: PlatformIntegration[];
  backgroundJobs: BackgroundJob[];
  systemErrors: SystemErrorLog[];
  securityIncidents: SecurityIncident[];
  auditLogs: PlatformAuditLog[];
  contentItems: PlatformContentItem[];
  platformSettings: PlatformSettings;
  platformAdmins: PlatformAdmin[];
  activeAdmin?: PlatformAdmin | null;
  currentUserEmail: string;
  isFirebaseConnected: boolean;
  currentTheme: ColorTheme;
  onToggleIntegration: (integrationId: string, reason: string) => void;
  onTestIntegration: (integrationId: string) => Promise<{ status: PlatformIntegration['status']; latencyMs: number }>;
  onRetryJob: (jobId: string) => void;
  onResolveSystemError: (errorId: string) => void;
  onResolveSecurityIncident: (incidentId: string, status: SecurityIncident['status'], notes: string) => void;
  onSaveContent: (item: PlatformContentItem) => void;
  onUpdatePlatformSettings: (updates: Partial<PlatformSettings>, reason: string) => void;
  onCreateAdmin: (
    data: { name: string; email: string; phone: string; sub_role: SuperAdminSubRole },
    reason: string
  ) => { success: boolean; error?: string };
  onUpdateAdmin: (
    adminId: string,
    updates: Partial<PlatformAdmin>,
    reason: string
  ) => { success: boolean; error?: string };
}

const SUB_ROLE_LABELS: Record<SuperAdminSubRole, string> = {
  platform_owner: 'Main Owner',
  platform_admin: 'General Admin',
  finance_admin: 'Money Admin',
  support_admin: 'Help Admin',
  technical_admin: 'Tools Admin',
  security_admin: 'Safety Admin',
};

export const SuperAdminPlatformGovernance: React.FC<SuperAdminPlatformGovernanceProps> = ({
  mode,
  integrations,
  backgroundJobs,
  systemErrors,
  securityIncidents,
  auditLogs,
  contentItems,
  platformSettings,
  platformAdmins,
  activeAdmin,
  currentUserEmail,
  isFirebaseConnected,
  currentTheme,
  onToggleIntegration,
  onTestIntegration,
  onRetryJob,
  onResolveSystemError,
  onResolveSecurityIncident,
  onSaveContent,
  onUpdatePlatformSettings,
  onCreateAdmin,
  onUpdateAdmin,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('all');

  const [editingContent, setEditingContent] = useState<PlatformContentItem | null>(null);
  const [draftSettings, setDraftSettings] = useState<PlatformSettings>(platformSettings);
  const [settingsReason, setSettingsReason] = useState('');

  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('+250 788 ');
  const [newAdminRole, setNewAdminRole] = useState<SuperAdminSubRole>('support_admin');
  const [newAdminReason, setNewAdminReason] = useState('');
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'error' | 'ok'; text: string } | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    danger?: boolean;
    execute: (reason: string) => void;
  } | null>(null);

  const filteredAudits = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter((log) => {
      const matchesQ =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.actor_email.toLowerCase().includes(q) ||
        log.affected_entity_label.toLowerCase().includes(q) ||
        log.correlation_id.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q);
      const matchesType = auditEntityFilter === 'all' || log.affected_entity_type === auditEntityFilter;
      return matchesQ && matchesType;
    });
  }, [auditLogs, auditSearch, auditEntityFilter]);

  // -------------------------------------------------------------------------
  // MODULE 13: CONNECTED TOOLS
  // -------------------------------------------------------------------------
  if (mode === 'integrations') {
    return (
      <div className="space-y-5">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
            Connected Tools
          </h3>
          <p className="text-sm text-[#425466] dark:text-slate-400">
            Secret keys stay hidden. Test any tool below or turn it on or off with a saved reason.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-[#0a2540] dark:text-white">{item.name}</div>
                  <div className="text-sm text-[#425466] dark:text-slate-400">
                    {item.category} · {item.provider}
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm space-y-1">
                <div>Address: {item.endpoint_label}</div>
                <div>Key: {item.masked_key}</div>
                <div>
                  Speed: {item.latency_ms ? `${item.latency_ms}ms` : 'N/A'} · Checked:{' '}
                  {item.last_checked_at.slice(0, 16).replace('T', ' ')}
                </div>
              </div>

              {item.recent_errors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-800 dark:text-amber-300">
                  Last problem: {item.recent_errors[0]}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  disabled={testingId === item.id}
                  onClick={async () => {
                    setTestingId(item.id);
                    await onTestIntegration(item.id);
                    setTestingId(null);
                  }}
                  className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-4 h-4 ${testingId === item.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === item.id ? 'Checking...' : 'Test Now'}</span>
                </button>

                <button
                  onClick={() =>
                    setPendingAction({
                      title: `${item.is_enabled ? 'Turn Off' : 'Turn On'} ${item.name}`,
                      description: `Service: ${item.provider}`,
                      confirmLabel: item.is_enabled ? 'Turn Off' : 'Turn On',
                      danger: item.is_enabled,
                      execute: (reason) => onToggleIntegration(item.id, reason),
                    })
                  }
                  className={`px-4 py-2 rounded-full font-semibold border ${
                    item.is_enabled
                      ? 'border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                      : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {item.is_enabled ? 'Turn Off' : 'Turn On'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <ReasonActionModal
          isOpen={!!pendingAction}
          title={pendingAction?.title || ''}
          description={pendingAction?.description || ''}
          confirmLabel={pendingAction?.confirmLabel || 'Confirm'}
          danger={pendingAction?.danger}
          currentTheme={currentTheme}
          onCancel={() => setPendingAction(null)}
          onConfirm={(reason) => {
            pendingAction?.execute(reason);
            setPendingAction(null);
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 14: SYSTEM HEALTH & AUTOMATIC TASKS
  // -------------------------------------------------------------------------
  if (mode === 'health') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-sm text-[#425466] dark:text-slate-400 font-semibold">
              <span>Live Data Save</span>
              <Database className="w-5 h-5" />
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full border text-sm font-semibold ${getStatusStyles(
                  isFirebaseConnected ? 'Connected' : 'Degraded'
                )}`}
              >
                {isFirebaseConnected ? 'Online' : 'Using Local Save'}
              </span>
            </div>
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-sm text-[#425466] dark:text-slate-400 font-semibold">
              <span>Stopped Tasks</span>
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
              {backgroundJobs.filter((j) => j.status === 'Failed').length} / {backgroundJobs.length}
            </div>
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-sm text-[#425466] dark:text-slate-400 font-semibold">
              <span>Open Errors</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
              {systemErrors.filter((e) => !e.resolved).length}
            </div>
          </div>
        </div>

        {/* Automatic Tasks */}
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-base text-[#0a2540] dark:text-white">
            Automatic Tasks
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {backgroundJobs.map((job) => (
              <div key={job.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#0a2540] dark:text-white">{job.name}</div>
                  <div className="text-sm font-mono text-[#425466] dark:text-slate-400 mt-0.5">
                    Runs: {job.schedule} · Last run: {job.last_run_at.slice(0, 16).replace('T', ' ')} · Checked:{' '}
                    {job.records_processed}
                  </div>
                  {job.error_message && <div className="text-sm text-rose-500 mt-0.5">{job.error_message}</div>}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(job.status)}`}>
                    {job.status}
                  </span>
                  <button
                    onClick={() => onRetryJob(job.id)}
                    className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold whitespace-nowrap"
                  >
                    Run Again
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Errors */}
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-base text-[#0a2540] dark:text-white">
            System Errors
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {systemErrors.map((err) => (
              <div key={err.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#0a2540] dark:text-white">{err.service}</span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(err.severity)}`}>
                      {err.severity}
                    </span>
                    <span className="font-mono text-sm text-[#425466] dark:text-slate-400">{err.correlation_id}</span>
                  </div>
                  <p className="text-[#425466] dark:text-slate-300 mt-1">{err.message}</p>
                </div>
                {err.resolved ? (
                  <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles('Resolved')}`}>
                    Fixed
                  </span>
                ) : (
                  <button
                    onClick={() => onResolveSystemError(err.id)}
                    className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold whitespace-nowrap"
                  >
                    Mark Fixed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 15: SAFETY ALERTS
  // -------------------------------------------------------------------------
  if (mode === 'security') {
    return (
      <div className="space-y-5">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
            Safety Alerts
          </h3>
          <p className="text-sm text-[#425466] dark:text-slate-400">
            Shows wrong sign-in tries, blocked page tries, and password reset requests.
          </p>
        </div>

        <div className="space-y-4">
          {securityIncidents.map((inc) => (
            <div
              key={inc.id}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-[#0a2540] dark:text-white">{inc.title}</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(inc.severity)}`}>
                    {inc.severity}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(inc.status)}`}>
                    {inc.status}
                  </span>
                </div>
                <span className="font-mono text-sm text-[#425466] dark:text-slate-400">
                  {inc.created_at.slice(0, 16).replace('T', ' ')}
                </span>
              </div>
              <p className="text-[#425466] dark:text-slate-300">{inc.details}</p>
              <div className="text-sm font-mono text-[#425466] dark:text-slate-400 flex flex-wrap gap-4">
                <span>Type: {inc.category}</span>
                {inc.target_email && <span>Email: {inc.target_email}</span>}
                {inc.source_ip && <span>From: {inc.source_ip}</span>}
              </div>
              {inc.resolution_notes && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  How fixed: {inc.resolution_notes}
                </div>
              )}
              {inc.status !== 'Resolved' && (
                <div className="flex justify-end gap-2 pt-1">
                  {inc.status === 'Open' && (
                    <button
                      onClick={() =>
                        onResolveSecurityIncident(inc.id, 'Investigating', 'Team is checking this alert.')
                      }
                      className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                    >
                      Checking Now
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setPendingAction({
                        title: `Close Alert: ${inc.title}`,
                        description: `Type: ${inc.category} · Email: ${inc.target_email || 'System'}`,
                        confirmLabel: 'Mark Fixed',
                        execute: (notes) => onResolveSecurityIncident(inc.id, 'Resolved', notes),
                      })
                    }
                    className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    Mark Fixed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <ReasonActionModal
          isOpen={!!pendingAction}
          title={pendingAction?.title || ''}
          description={pendingAction?.description || ''}
          confirmLabel={pendingAction?.confirmLabel || 'Confirm'}
          currentTheme={currentTheme}
          onCancel={() => setPendingAction(null)}
          onConfirm={(reason) => {
            pendingAction?.execute(reason);
            setPendingAction(null);
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 16: CHANGE HISTORY (CANNOT EDIT)
  // -------------------------------------------------------------------------
  if (mode === 'audit') {
    return (
      <div className="space-y-5">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              <span>Change History (Cannot Edit)</span>
            </h3>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              Safe record of every important change. Nothing can be edited or deleted here.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search person, code, or item..."
                className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm rounded-xl pl-10 pr-3.5 py-2.5 outline-none"
              />
            </div>
            <select
              value={auditEntityFilter}
              onChange={(e) => setAuditEntityFilter(e.target.value)}
              className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm rounded-xl px-3.5 py-2.5 outline-none"
            >
              <option value="all">All Records ({auditLogs.length})</option>
              {['Company', 'User', 'Subscription', 'Plan', 'SaasPayment', 'Booking', 'SupportTicket', 'Security', 'Settings', 'PlatformAdmin'].map(
                (t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-[#425466] dark:text-slate-400 font-semibold">
            <div className="col-span-2">Time & Code</div>
            <div className="col-span-2">Changed By</div>
            <div className="col-span-3">What Changed</div>
            <div className="col-span-2">Old → New</div>
            <div className="col-span-3">Reason</div>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm">
            {filteredAudits.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40"
              >
                <div className="lg:col-span-2 font-mono text-xs min-w-0">
                  <div className="text-[#0a2540] dark:text-white whitespace-nowrap">
                    {log.timestamp.slice(0, 19).replace('T', ' ')}
                  </div>
                  <div className="text-[#425466] dark:text-slate-400 truncate">{log.correlation_id}</div>
                </div>
                <div className="lg:col-span-2 min-w-0">
                  <div className="font-semibold text-[#0a2540] dark:text-white truncate">{log.actor_name}</div>
                  <div className="text-xs font-mono text-[#425466] dark:text-slate-400 truncate">{log.actor_email}</div>
                </div>
                <div className="lg:col-span-3 min-w-0">
                  <div className="font-semibold text-[#0a2540] dark:text-white truncate">{log.action}</div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 truncate">
                    [{log.affected_entity_type}] {log.affected_entity_label}
                  </div>
                </div>
                <div className="lg:col-span-2 font-mono text-xs min-w-0">
                  {log.before_value || log.after_value ? (
                    <div className="truncate">
                      {log.before_value && <span className="text-[#425466] dark:text-slate-400">{log.before_value} → </span>}
                      <span className="text-emerald-600 dark:text-emerald-400">{log.after_value}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
                <div className="lg:col-span-3 text-[#425466] dark:text-slate-300 text-xs">{log.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 17: NOTICES & RULES
  // -------------------------------------------------------------------------
  if (mode === 'content') {
    return (
      <div className="space-y-5">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
              Notices & Rules
            </h3>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              Write terms, privacy pages, help questions, and banners for everyone.
            </p>
          </div>
          <button
            onClick={() =>
              setEditingContent({
                id: `cnt-${Date.now().toString().slice(-4)}`,
                type: 'Announcement',
                title: '',
                slug: '',
                body: '',
                version: '1.0',
                status: 'Draft',
                effective_date: new Date().toISOString().slice(0, 10),
                updated_by: currentUserEmail,
                updated_at: new Date().toISOString(),
              })
            }
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Notice</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-mono uppercase text-[#425466] dark:text-slate-400">{item.type} · v{item.version}</span>
                  <h4 className="text-base font-bold text-[#0a2540] dark:text-white mt-0.5">{item.title}</h4>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-[#425466] dark:text-slate-300 leading-relaxed">{item.body}</p>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm text-[#425466] dark:text-slate-400">
                <span>
                  Starts {item.effective_date} · By {item.updated_by}
                </span>
                <button
                  onClick={() => setEditingContent(item)}
                  className="font-semibold hover:underline"
                  style={{ color: currentTheme.hex }}
                >
                  Edit / Publish
                </button>
              </div>
            </div>
          ))}
        </div>

        {editingContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingContent.title.trim()) return;
                onSaveContent({
                  ...editingContent,
                  slug:
                    editingContent.slug ||
                    editingContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                });
                setEditingContent(null);
              }}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-base font-bold text-[#0a2540] dark:text-white">Edit Notice or Rule</h4>
                <button type="button" onClick={() => setEditingContent(null)} className="text-slate-400 p-1 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Type</label>
                  <select
                    value={editingContent.type}
                    onChange={(e) => setEditingContent({ ...editingContent, type: e.target.value as any })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                  >
                    <option value="Announcement">News Notice</option>
                    <option value="Maintenance Banner">Pause Banner</option>
                    <option value="FAQ">Common Question</option>
                    <option value="Terms of Service">Terms of Service</option>
                    <option value="Privacy Policy">Privacy Rules</option>
                    <option value="Subscription Policy">Plan Rules</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Status</label>
                  <select
                    value={editingContent.status}
                    onChange={(e) => setEditingContent({ ...editingContent, status: e.target.value as any })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Live</option>
                    <option value="Scheduled">Planned</option>
                    <option value="Archived">Hidden</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={editingContent.title}
                  onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Version</label>
                  <input
                    type="text"
                    value={editingContent.version}
                    onChange={(e) => setEditingContent({ ...editingContent, version: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Start Date</label>
                  <input
                    type="date"
                    value={editingContent.effective_date}
                    onChange={(e) => setEditingContent({ ...editingContent, effective_date: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Words</label>
                <textarea
                  rows={4}
                  value={editingContent.body}
                  onChange={(e) => setEditingContent({ ...editingContent, body: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingContent(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Save Notice
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULES 18 & 19: SYSTEM RULES & PAY SETTINGS
  // -------------------------------------------------------------------------
  if (mode === 'settings') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (settingsReason.trim().length < 5) return;
          onUpdatePlatformSettings(draftSettings, settingsReason.trim());
          setSettingsReason('');
        }}
        className="space-y-6 text-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Rules */}
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5" style={{ color: currentTheme.hex }} />
              <span>Signup & Company Rules</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">App Name</label>
                <input
                  type="text"
                  value={draftSettings.platform_name}
                  onChange={(e) => setDraftSettings({ ...draftSettings, platform_name: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Help Email</label>
                <input
                  type="email"
                  value={draftSettings.support_email}
                  onChange={(e) => setDraftSettings({ ...draftSettings, support_email: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Free Days</label>
                <input
                  type="number"
                  value={draftSettings.default_trial_days}
                  onChange={(e) => setDraftSettings({ ...draftSettings, default_trial_days: Number(e.target.value) })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Extra Days</label>
                <input
                  type="number"
                  value={draftSettings.grace_period_days}
                  onChange={(e) => setDraftSettings({ ...draftSettings, grace_period_days: Number(e.target.value) })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Pause After</label>
                <input
                  type="number"
                  value={draftSettings.auto_suspend_after_grace_days}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, auto_suspend_after_grace_days: Number(e.target.value) })
                  }
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.require_company_approval}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, require_company_approval: e.target.checked })
                  }
                />
                <span>Admin must approve each new company first</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.allow_public_self_registration}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, allow_public_self_registration: e.target.checked })
                  }
                />
                <span>Let new companies sign up on their own</span>
              </label>
            </div>
          </div>

          {/* Pay Settings & Pause Mode */}
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
              MoMo Code & Site Pause Mode
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">MTN MoMo Pay Code</label>
                <input
                  type="text"
                  value={draftSettings.momo_merchant_code}
                  onChange={(e) => setDraftSettings({ ...draftSettings, momo_merchant_code: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Tax (%)</label>
                <input
                  type="number"
                  value={draftSettings.vat_rate_pct}
                  onChange={(e) => setDraftSettings({ ...draftSettings, vat_rate_pct: Number(e.target.value) })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Company Tax Number (TIN)</label>
              <input
                type="text"
                value={draftSettings.rra_saas_tin}
                onChange={(e) => setDraftSettings({ ...draftSettings, rra_saas_tin: e.target.value })}
                className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
              />
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2.5">
              <label className="flex items-center gap-2.5 font-bold text-rose-600 dark:text-rose-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.maintenance_mode}
                  onChange={(e) => setDraftSettings({ ...draftSettings, maintenance_mode: e.target.checked })}
                />
                <span>Pause Website for Repairs</span>
              </label>
              <input
                type="text"
                value={draftSettings.maintenance_message}
                onChange={(e) => setDraftSettings({ ...draftSettings, maintenance_message: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-rose-500/30 rounded-xl p-2.5"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value={settingsReason}
            onChange={(e) => setSettingsReason(e.target.value)}
            placeholder="Write why you changed these rules (at least 5 letters)..."
            className="flex-1 bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
            required
          />
          <button
            type="submit"
            className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            Save Rules
          </button>
        </div>
      </form>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 20: ADMIN TEAM
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: currentTheme.hex }} />
            <span>Admin Team</span>
          </h3>
          <p className="text-sm text-[#425466] dark:text-slate-400">
            Main Owners control everything. Team helpers cannot give themselves extra power.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAddAdminOpen(true);
            setAdminFeedback(null);
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap ${currentTheme.btnText}`}
          style={{ backgroundColor: currentTheme.hex }}
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Helper</span>
        </button>
      </div>

      {adminFeedback && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            adminFeedback.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {adminFeedback.text}
        </div>
      )}

      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-[#425466] dark:text-slate-400 font-semibold">
          <div className="col-span-4">Name & Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Pages Allowed</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm">
          {platformAdmins.map((adm) => {
            const isMasterOwner = isSuperAdminEmail(adm.email);
            const permKeys = Object.keys(adm.permissions || {});
            const guardCheck = canModifyPlatformAdmin(activeAdmin, adm);

            return (
              <div
                key={adm.id}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40"
              >
                <div className="lg:col-span-4 min-w-0">
                  <div className="font-bold text-[#0a2540] dark:text-white flex items-center gap-2 flex-wrap">
                    <span className="truncate">{adm.name}</span>
                    {isMasterOwner && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono text-xs whitespace-nowrap">
                        Main Owner
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#425466] dark:text-slate-400 truncate">
                    {adm.email} · {adm.phone}
                  </div>
                </div>
                <div className="lg:col-span-2 font-semibold text-[#0a2540] dark:text-white truncate">
                  {SUB_ROLE_LABELS[adm.sub_role] || adm.sub_role}
                </div>
                <div className="lg:col-span-2 text-xs text-[#425466] dark:text-slate-400">
                  {adm.sub_role === 'platform_owner' ? 'All 20 Pages' : `${permKeys.length} pages`}
                </div>
                <div className="lg:col-span-1 lg:text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${getStatusStyles(adm.status)}`}>
                    {adm.status}
                  </span>
                </div>
                <div className="lg:col-span-3 flex items-center lg:justify-end gap-1.5 flex-wrap">
                  {!isMasterOwner && guardCheck.allowed ? (
                    <>
                      <select
                        value={adm.sub_role}
                        onChange={(e) => {
                          const nextRole = e.target.value as SuperAdminSubRole;
                          setPendingAction({
                            title: `Change Role for ${adm.name}`,
                            description: `${SUB_ROLE_LABELS[adm.sub_role]} → ${SUB_ROLE_LABELS[nextRole]}`,
                            confirmLabel: 'Update Role',
                            execute: (reason) => {
                              const res = onUpdateAdmin(adm.id, { sub_role: nextRole }, reason);
                              setAdminFeedback(
                                res.success
                                  ? { type: 'ok', text: `Changed ${adm.name} to ${SUB_ROLE_LABELS[nextRole]}.` }
                                  : { type: 'error', text: res.error || 'Could not update role.' }
                              );
                            },
                          });
                        }}
                        className="bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-xs"
                      >
                        <option value="platform_admin">General Admin</option>
                        <option value="finance_admin">Money Admin</option>
                        <option value="support_admin">Help Admin</option>
                        <option value="technical_admin">Tools Admin</option>
                        <option value="security_admin">Safety Admin</option>
                        <option value="platform_owner">Main Owner</option>
                      </select>

                      <button
                        onClick={() =>
                          setPendingAction({
                            title: `${adm.status === 'Active' ? 'Pause' : 'Turn On'} Admin ${adm.name}`,
                            description: adm.email,
                            confirmLabel: adm.status === 'Active' ? 'Pause Admin' : 'Turn On Admin',
                            danger: adm.status === 'Active',
                            execute: (reason) => {
                              const nextStatus = adm.status === 'Active' ? 'Suspended' : 'Active';
                              const res = onUpdateAdmin(adm.id, { status: nextStatus }, reason);
                              setAdminFeedback(
                                res.success
                                  ? { type: 'ok', text: `${adm.name} set to ${nextStatus}.` }
                                  : { type: 'error', text: res.error || 'Could not change status.' }
                              );
                            },
                          })
                        }
                        className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold whitespace-nowrap"
                      >
                        {adm.status === 'Active' ? 'Pause' : 'Turn On'}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-[#425466] dark:text-slate-400 font-mono">Protected Owner</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Helper Modal */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = onCreateAdmin(
                {
                  name: newAdminName,
                  email: newAdminEmail,
                  phone: newAdminPhone,
                  sub_role: newAdminRole,
                },
                newAdminReason || 'Added admin helper'
              );
              if (res.success) {
                setAdminFeedback({ type: 'ok', text: `Added ${newAdminName} as ${SUB_ROLE_LABELS[newAdminRole]}.` });
                setIsAddAdminOpen(false);
                setNewAdminName('');
                setNewAdminEmail('');
                setNewAdminReason('');
              } else {
                setAdminFeedback({ type: 'error', text: res.error || 'Could not add helper.' });
              }
            }}
            className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-base font-bold text-[#0a2540] dark:text-white">Add Admin Helper</h4>
              <button type="button" onClick={() => setIsAddAdminOpen(false)} className="text-slate-400 p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Full Name</label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Phone</label>
                <input
                  type="text"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Role</label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value as SuperAdminSubRole)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
              >
                <option value="platform_admin">General Admin</option>
                <option value="finance_admin">Money Admin</option>
                <option value="support_admin">Help Admin</option>
                <option value="technical_admin">Tools Admin</option>
                <option value="security_admin">Safety Admin</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Reason</label>
              <input
                type="text"
                value={newAdminReason}
                onChange={(e) => setNewAdminReason(e.target.value)}
                placeholder="e.g. Helping check payments and support."
                className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddAdminOpen(false)}
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-full font-semibold ${currentTheme.btnText}`}
                style={{ backgroundColor: currentTheme.hex }}
              >
                Add Helper
              </button>
            </div>
          </form>
        </div>
      )}

      <ReasonActionModal
        isOpen={!!pendingAction}
        title={pendingAction?.title || ''}
        description={pendingAction?.description || ''}
        confirmLabel={pendingAction?.confirmLabel || 'Confirm'}
        danger={pendingAction?.danger}
        currentTheme={currentTheme}
        onCancel={() => setPendingAction(null)}
        onConfirm={(reason) => {
          pendingAction?.execute(reason);
          setPendingAction(null);
        }}
      />
    </div>
  );
};
