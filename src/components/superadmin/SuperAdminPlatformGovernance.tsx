import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
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
  // MODULE 13: INTEGRATIONS
  // -------------------------------------------------------------------------
  if (mode === 'integrations') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            API Gateways & Rwanda Ecosystem Integrations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Credentials remain masked. Test live gateway responsiveness or disable an integration with an audit reason.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {item.category} · {item.provider}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getStatusStyles(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1">
                <div>Endpoint: {item.endpoint_label}</div>
                <div>API Key: {item.masked_key}</div>
                <div>
                  Latency: {item.latency_ms ? `${item.latency_ms}ms` : 'N/A'} · Checked:{' '}
                  {item.last_checked_at.slice(0, 16).replace('T', ' ')}
                </div>
              </div>

              {item.recent_errors.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                  Last error: {item.recent_errors[0]}
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
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingId === item.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === item.id ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={() =>
                    setPendingAction({
                      title: `${item.is_enabled ? 'Disable' : 'Enable'} ${item.name}`,
                      description: `Provider: ${item.provider}`,
                      confirmLabel: item.is_enabled ? 'Disable Integration' : 'Enable Integration',
                      danger: item.is_enabled,
                      execute: (reason) => onToggleIntegration(item.id, reason),
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg font-semibold border ${
                    item.is_enabled
                      ? 'border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                      : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {item.is_enabled ? 'Disable' : 'Enable'}
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
  // MODULE 14: SYSTEM HEALTH & BACKGROUND JOBS
  // -------------------------------------------------------------------------
  if (mode === 'health') {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Firestore Real-Time Sync</span>
              <Database className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles(
                  isFirebaseConnected ? 'Connected' : 'Degraded'
                )}`}
              >
                {isFirebaseConnected ? 'Connected' : 'Local Fallback Active'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Failed Background Jobs</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1.5">
              {backgroundJobs.filter((j) => j.status === 'Failed').length} / {backgroundJobs.length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Open Error Logs</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1.5">
              {systemErrors.filter((e) => !e.resolved).length}
            </div>
          </div>
        </div>

        {/* Background Jobs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
            Scheduled Jobs & Automated Scanners
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {backgroundJobs.map((job) => (
              <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{job.name}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Schedule: {job.schedule} · Last run: {job.last_run_at.slice(0, 16).replace('T', ' ')} · Records:{' '}
                    {job.records_processed}
                  </div>
                  {job.error_message && <div className="text-[11px] text-rose-500 mt-0.5">{job.error_message}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(job.status)}`}>
                    {job.status}
                  </span>
                  <button
                    onClick={() => onRetryJob(job.id)}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold whitespace-nowrap"
                  >
                    Run / Retry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sanitized Error Logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
            Sanitized System Error Logs
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {systemErrors.map((err) => (
              <div key={err.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{err.service}</span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(err.severity)}`}>
                      {err.severity}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{err.correlation_id}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{err.message}</p>
                </div>
                {err.resolved ? (
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles('Resolved')}`}>
                    Resolved
                  </span>
                ) : (
                  <button
                    onClick={() => onResolveSystemError(err.id)}
                    className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold whitespace-nowrap"
                  >
                    Mark Resolved
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
  // MODULE 15: SECURITY CENTER
  // -------------------------------------------------------------------------
  if (mode === 'security') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Security Center — Threat Telemetry & Access Violations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tracks failed Superadmin/staff authentication attempts, unauthorized cross-tenant route probes, and recovery
            requests.
          </p>
        </div>

        <div className="space-y-3">
          {securityIncidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{inc.title}</span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(inc.severity)}`}>
                    {inc.severity}
                  </span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(inc.status)}`}>
                    {inc.status}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">
                  {inc.created_at.slice(0, 16).replace('T', ' ')}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{inc.details}</p>
              <div className="text-[11px] font-mono text-slate-500 flex flex-wrap gap-4">
                <span>Category: {inc.category}</span>
                {inc.target_email && <span>Target: {inc.target_email}</span>}
                {inc.source_ip && <span>Source: {inc.source_ip}</span>}
              </div>
              {inc.resolution_notes && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  Resolution: {inc.resolution_notes}
                </div>
              )}
              {inc.status !== 'Resolved' && (
                <div className="flex justify-end gap-2 pt-1">
                  {inc.status === 'Open' && (
                    <button
                      onClick={() =>
                        onResolveSecurityIncident(inc.id, 'Investigating', 'Assigned to Security Admin for triage.')
                      }
                      className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                    >
                      Mark Investigating
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setPendingAction({
                        title: `Resolve Security Incident: ${inc.title}`,
                        description: `Category: ${inc.category} · Target: ${inc.target_email || 'System'}`,
                        confirmLabel: 'Resolve Incident',
                        execute: (notes) => onResolveSecurityIncident(inc.id, 'Resolved', notes),
                      })
                    }
                    className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    Resolve with Notes
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
  // MODULE 16: IMMUTABLE AUDIT LOGS
  // -------------------------------------------------------------------------
  if (mode === 'audit') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Immutable Platform Audit Logs (Read-Only)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Append-only security & administrative ledger. Zero edit or delete capability.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search actor, correlation ID, entity..."
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg pl-8 pr-3 py-2 outline-none"
              />
            </div>
            <select
              value={auditEntityFilter}
              onChange={(e) => setAuditEntityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-2.5 py-2 outline-none"
            >
              <option value="all">All Entities ({auditLogs.length})</option>
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

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp & Correlation</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action & Target</th>
                  <th className="px-4 py-3">Before → After</th>
                  <th className="px-4 py-3">Documented Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                {filteredAudits.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="text-slate-900 dark:text-white">{log.timestamp.slice(0, 19).replace('T', ' ')}</div>
                      <div className="text-slate-500">{log.correlation_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{log.actor_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {log.actor_email} ({log.actor_role})
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{log.action}</div>
                      <div className="text-[11px] text-slate-500">
                        [{log.affected_entity_type}] {log.affected_entity_label}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {log.before_value || log.after_value ? (
                        <div>
                          {log.before_value && <span className="text-slate-500">{log.before_value} → </span>}
                          <span className="text-emerald-600 dark:text-emerald-400">{log.after_value}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 17: CONTENT & POLICIES
  // -------------------------------------------------------------------------
  if (mode === 'content') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform Announcements, Maintenance Banners & Legal Policies
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Publish versioned Terms of Service, Privacy Policies, FAQs, and system-wide operator notices.
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
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Content / Policy</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">{item.type} · v{item.version}</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{item.title}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.body}</p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Effective {item.effective_date} · By {item.updated_by}
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white">Edit Platform Content / Policy</h4>
                <button type="button" onClick={() => setEditingContent(null)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Content Type</label>
                  <select
                    value={editingContent.type}
                    onChange={(e) => setEditingContent({ ...editingContent, type: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Maintenance Banner">Maintenance Banner</option>
                    <option value="FAQ">FAQ</option>
                    <option value="Terms of Service">Terms of Service</option>
                    <option value="Privacy Policy">Privacy Policy</option>
                    <option value="Subscription Policy">Subscription Policy</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Publish Status</label>
                  <select
                    value={editingContent.status}
                    onChange={(e) => setEditingContent({ ...editingContent, status: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={editingContent.title}
                  onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Version</label>
                  <input
                    type="text"
                    value={editingContent.version}
                    onChange={(e) => setEditingContent({ ...editingContent, version: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={editingContent.effective_date}
                    onChange={(e) => setEditingContent({ ...editingContent, effective_date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Body Copy</label>
                <textarea
                  rows={4}
                  value={editingContent.body}
                  onChange={(e) => setEditingContent({ ...editingContent, body: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingContent(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Save Content
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULES 18 & 19: PLATFORM SETTINGS & BILLING CONFIG
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
        className="space-y-5 text-xs"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* General & Registration Rules */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4" style={{ color: currentTheme.hex }} />
              <span>General Platform & Registration Policy</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  value={draftSettings.platform_name}
                  onChange={(e) => setDraftSettings({ ...draftSettings, platform_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Support Email</label>
                <input
                  type="email"
                  value={draftSettings.support_email}
                  onChange={(e) => setDraftSettings({ ...draftSettings, support_email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Trial Days</label>
                <input
                  type="number"
                  value={draftSettings.default_trial_days}
                  onChange={(e) => setDraftSettings({ ...draftSettings, default_trial_days: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Grace Days</label>
                <input
                  type="number"
                  value={draftSettings.grace_period_days}
                  onChange={(e) => setDraftSettings({ ...draftSettings, grace_period_days: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Auto-Suspend (d)</label>
                <input
                  type="number"
                  value={draftSettings.auto_suspend_after_grace_days}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, auto_suspend_after_grace_days: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.require_company_approval}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, require_company_approval: e.target.checked })
                  }
                />
                <span>Require Superadmin approval before activating new company registrations</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.allow_public_self_registration}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, allow_public_self_registration: e.target.checked })
                  }
                />
                <span>Allow public company self-registration portal</span>
              </label>
            </div>
          </div>

          {/* Billing Config & Maintenance Mode */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              SaaS Billing & Maintenance Mode
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold mb-1">MTN MoMo Merchant USSD</label>
                <input
                  type="text"
                  value={draftSettings.momo_merchant_code}
                  onChange={(e) => setDraftSettings({ ...draftSettings, momo_merchant_code: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">RRA VAT (%)</label>
                <input
                  type="number"
                  value={draftSettings.vat_rate_pct}
                  onChange={(e) => setDraftSettings({ ...draftSettings, vat_rate_pct: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">KigaliFleet SaaS RRA TIN</label>
              <input
                type="text"
                value={draftSettings.rra_saas_tin}
                onChange={(e) => setDraftSettings({ ...draftSettings, rra_saas_tin: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
              />
            </div>

            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 space-y-2">
              <label className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.maintenance_mode}
                  onChange={(e) => setDraftSettings({ ...draftSettings, maintenance_mode: e.target.checked })}
                />
                <span>Enable Platform-Wide Maintenance Mode</span>
              </label>
              <input
                type="text"
                value={draftSettings.maintenance_message}
                onChange={(e) => setDraftSettings({ ...draftSettings, maintenance_message: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-rose-500/30 rounded-lg p-2"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value={settingsReason}
            onChange={(e) => setSettingsReason(e.target.value)}
            placeholder="Mandatory audit reason for configuration update (min 5 chars)..."
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none"
            required
          />
          <button
            type="submit"
            className={`px-5 py-2.5 rounded-lg font-bold whitespace-nowrap ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            Save Platform Configuration
          </button>
        </div>
      </form>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 20: ADMINISTRATORS & PERMISSIONS
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: currentTheme.hex }} />
            <span>Platform Administrators & Granular Sub-Role Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Both master Platform Owner accounts hold full authority. Privilege self-escalation is blocked at store &amp;
            Firestore rule layers.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAddAdminOpen(true);
            setAdminFeedback(null);
          }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${currentTheme.btnText}`}
          style={{ backgroundColor: currentTheme.hex }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Sub-Admin</span>
        </button>
      </div>

      {adminFeedback && (
        <div
          className={`p-3 rounded-lg border text-xs ${
            adminFeedback.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-500'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
          }`}
        >
          {adminFeedback.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Sub-Role</th>
                <th className="px-4 py-3">Permitted Modules</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
              {platformAdmins.map((adm) => {
                const isMasterOwner = isSuperAdminEmail(adm.email);
                const permKeys = Object.keys(adm.permissions || {});
                const guardCheck = canModifyPlatformAdmin(activeAdmin, adm);

                return (
                  <tr key={adm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{adm.name}</span>
                        {isMasterOwner && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                            Master Owner
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {adm.email} · {adm.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">{adm.sub_role}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {adm.sub_role === 'platform_owner'
                        ? 'All 20 Platform Modules (Unrestricted)'
                        : `${permKeys.length} modules: ${permKeys.slice(0, 5).join(', ')}${
                            permKeys.length > 5 ? '...' : ''
                          }`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(adm.status)}`}>
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isMasterOwner && guardCheck.allowed ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            value={adm.sub_role}
                            onChange={(e) => {
                              const nextRole = e.target.value as SuperAdminSubRole;
                              setPendingAction({
                                title: `Change Role for ${adm.name}`,
                                description: `${adm.sub_role} → ${nextRole}`,
                                confirmLabel: 'Update Role',
                                execute: (reason) => {
                                  const res = onUpdateAdmin(adm.id, { sub_role: nextRole }, reason);
                                  setAdminFeedback(
                                    res.success
                                      ? { type: 'ok', text: `Updated ${adm.name} to ${nextRole}.` }
                                      : { type: 'error', text: res.error || 'Role update blocked.' }
                                  );
                                },
                              });
                            }}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-[11px]"
                          >
                            <option value="platform_admin">platform_admin</option>
                            <option value="finance_admin">finance_admin</option>
                            <option value="support_admin">support_admin</option>
                            <option value="technical_admin">technical_admin</option>
                            <option value="security_admin">security_admin</option>
                            <option value="platform_owner">platform_owner</option>
                          </select>

                          <button
                            onClick={() =>
                              setPendingAction({
                                title: `${adm.status === 'Active' ? 'Suspend' : 'Reactivate'} Admin ${adm.name}`,
                                description: adm.email,
                                confirmLabel: adm.status === 'Active' ? 'Suspend Admin' : 'Reactivate Admin',
                                danger: adm.status === 'Active',
                                execute: (reason) => {
                                  const nextStatus = adm.status === 'Active' ? 'Suspended' : 'Active';
                                  const res = onUpdateAdmin(adm.id, { status: nextStatus }, reason);
                                  setAdminFeedback(
                                    res.success
                                      ? { type: 'ok', text: `${adm.name} set to ${nextStatus}.` }
                                      : { type: 'error', text: res.error || 'Status update blocked.' }
                                  );
                                },
                              })
                            }
                            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-semibold"
                          >
                            {adm.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Protected Owner</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sub-Admin Modal */}
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
                newAdminReason || 'Added platform sub-administrator'
              );
              if (res.success) {
                setAdminFeedback({ type: 'ok', text: `Added ${newAdminName} as ${newAdminRole}.` });
                setIsAddAdminOpen(false);
                setNewAdminName('');
                setNewAdminEmail('');
                setNewAdminReason('');
              } else {
                setAdminFeedback({ type: 'error', text: res.error || 'Could not create admin.' });
              }
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white">Add Platform Sub-Administrator</h4>
              <button type="button" onClick={() => setIsAddAdminOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Phone</label>
                <input
                  type="text"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Assigned Sub-Role</label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value as SuperAdminSubRole)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
              >
                <option value="platform_admin">Platform Admin</option>
                <option value="finance_admin">Finance Admin</option>
                <option value="support_admin">Support Admin</option>
                <option value="technical_admin">Technical Admin</option>
                <option value="security_admin">Security Admin</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Audit Reason</label>
              <input
                type="text"
                value={newAdminReason}
                onChange={(e) => setNewAdminReason(e.target.value)}
                placeholder="e.g. Delegated billing reconciliation duties."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddAdminOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg font-bold ${currentTheme.btnText}`}
                style={{ backgroundColor: currentTheme.hex }}
              >
                Create Sub-Admin
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
