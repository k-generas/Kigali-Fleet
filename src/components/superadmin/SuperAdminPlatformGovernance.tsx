import React, { useMemo, useState } from 'react';
import {
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
import { useI18n } from '../../utils/i18n';
import { ReasonActionModal, getStatusDotColor, getStatusStyles } from './SuperAdminShared';
import { formatHumanDate, formatHumanDateTime } from '../../utils/dates';

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
  platform_owner: 'Main owner',
  platform_admin: 'General admin',
  finance_admin: 'Money admin',
  support_admin: 'Help admin',
  technical_admin: 'Tools admin',
  security_admin: 'Safety admin',
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
  const { tr } = useI18n();
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

  // MODULE 13: CONNECTED TOOLS
  if (mode === 'integrations') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {tr('Connected tools')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Secret keys stay hidden. Test any tool below or turn it on or off with a saved reason.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 space-y-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.category} · {item.provider}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
                  <span className={`w-2 h-2 rounded-full ${getStatusDotColor(item.status)}`} />
                  <span>{item.status}</span>
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 font-mono text-xs space-y-1 text-slate-700 dark:text-slate-300">
                <div>Address: {item.endpoint_label}</div>
                <div>Key: {item.masked_key}</div>
                <div>
                  Speed: {item.latency_ms ? `${item.latency_ms}ms` : 'N/A'} · Checked:{' '}
                  {formatHumanDateTime(item.last_checked_at)}
                </div>
              </div>

              {item.recent_errors.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-xs text-amber-800 dark:text-amber-400">
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
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingId === item.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === item.id ? tr('Checking...') : tr('Test now')}</span>
                </button>

                <button
                  onClick={() =>
                    setPendingAction({
                      title: `${item.is_enabled ? tr('Turn off') : tr('Turn on')} ${item.name}`,
                      description: `${tr('Service')}: ${item.provider}`,
                      confirmLabel: item.is_enabled ? tr('Turn off') : tr('Turn on'),
                      danger: item.is_enabled,
                      execute: (reason) => onToggleIntegration(item.id, reason),
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    item.is_enabled
                      ? 'border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                      : 'border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                  }`}
                >
                  {item.is_enabled ? tr('Turn off') : tr('Turn on')}
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

  // MODULE 14: SYSTEM HEALTH & AUTOMATIC TASKS
  if (mode === 'health') {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{tr('Live data save')}</span>
              <Database className="w-4 h-4" />
            </div>
            <div className="mt-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${getStatusStyles(
                  isFirebaseConnected ? 'Connected' : 'Degraded'
                )}`}
              >
                <span className={`w-2 h-2 rounded-full ${getStatusDotColor(isFirebaseConnected ? 'Connected' : 'Degraded')}`} />
                {isFirebaseConnected ? tr('Online') : tr('Using local save')}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Stopped tasks')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
              {backgroundJobs.filter((j) => j.status === 'Failed').length} / {backgroundJobs.length}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{tr('Open errors')}</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
              {systemErrors.filter((e) => !e.resolved).length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 font-semibold text-base text-slate-900 dark:text-slate-100">
            {tr('Automatic tasks')}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 text-sm">
            {backgroundJobs.map((job) => (
              <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{job.name}</div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                    Runs: {job.schedule} · Last run: {formatHumanDateTime(job.last_run_at)} · Checked:{' '}
                    {job.records_processed}
                  </div>
                  {job.error_message && <div className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{job.error_message}</div>}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(job.status)}`} />
                    <span>{job.status}</span>
                  </span>
                  <button
                    onClick={() => onRetryJob(job.id)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold whitespace-nowrap"
                  >
                    {tr('Run again')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 font-semibold text-base text-slate-900 dark:text-slate-100">
            {tr('System errors')}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 text-sm">
            {systemErrors.map((err) => (
              <div key={err.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{err.service}</span>
                    <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles(err.severity)}`}>
                      {tr(err.severity)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{err.correlation_id}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">{err.message}</p>
                </div>
                {err.resolved ? (
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles('Resolved')}`}>
                    {tr('Fixed')}
                  </span>
                ) : (
                  <button
                    onClick={() => onResolveSystemError(err.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    {tr('Mark fixed')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // MODULE 15: SAFETY ALERTS
  if (mode === 'security') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {tr('Safety alerts')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Shows wrong sign-in tries, blocked page tries, and password reset requests.')}
          </p>
        </div>

        <div className="space-y-3">
          {securityIncidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 space-y-2.5 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-base text-slate-900 dark:text-slate-100">{inc.title}</span>
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles(inc.severity)}`}>
                    {inc.severity}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles(inc.status)}`}>
                    {inc.status}
                  </span>
                </div>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {formatHumanDateTime(inc.created_at)}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{inc.details}</p>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex flex-wrap gap-4">
                <span>Type: {inc.category}</span>
                {inc.target_email && <span>Email: {inc.target_email}</span>}
                {inc.source_ip && <span>From: {inc.source_ip}</span>}
              </div>
              {inc.resolution_notes && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">
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
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                    >
                      Checking now
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setPendingAction({
                        title: `Close alert: ${inc.title}`,
                        description: `Type: ${inc.category} · Email: ${inc.target_email || 'System'}`,
                        confirmLabel: 'Mark fixed',
                        execute: (notes) => onResolveSecurityIncident(inc.id, 'Resolved', notes),
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    Mark fixed
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

  // MODULE 16: CHANGE HISTORY
  if (mode === 'audit') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{tr('Change history (cannot edit)')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tr('Safe record of every important change. Nothing can be edited or deleted here.')}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder={tr('Search person, code, or item...')}
                className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-sm rounded-lg pl-9 pr-3 py-2 outline-none"
              />
            </div>
            <select
              value={auditEntityFilter}
              onChange={(e) => setAuditEntityFilter(e.target.value)}
              className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="all">{tr('All records')} ({auditLogs.length})</option>
              {['Company', 'User', 'Subscription', 'Plan', 'SaasPayment', 'Booking', 'SupportTicket', 'Security', 'Settings', 'PlatformAdmin'].map(
                (t) => (
                  <option key={t} value={t}>
                    {tr(t)}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">{tr('Time & code')}</th>
                <th className="py-3 px-4">{tr('Changed by')}</th>
                <th className="py-3 px-4">{tr('What changed')}</th>
                <th className="py-3 px-4">{tr('Old → New')}</th>
                <th className="py-3 px-4">{tr('Reason')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-900 dark:text-slate-100">
              {filteredAudits.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs tabular-nums">
                    <div className="whitespace-nowrap">{formatHumanDateTime(log.timestamp)}</div>
                    <div className="text-slate-500 dark:text-slate-400">{log.correlation_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold">{log.actor_name}</div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">{log.actor_email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold">{log.action}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      [{log.affected_entity_type}] {log.affected_entity_label}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {log.before_value || log.after_value ? (
                      <div>
                        {log.before_value && <span className="text-slate-500 dark:text-slate-400">{log.before_value} → </span>}
                        <span className="text-emerald-600 dark:text-emerald-400">{log.after_value}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // MODULE 17: NOTICES & RULES
  if (mode === 'content') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {tr('Notices & rules')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tr('Write terms, privacy pages, help questions, and banners for everyone.')}
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold accent-bg"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('Add notice')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 space-y-2.5 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {item.type} · v{item.version}
                  </span>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{item.title}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.body}</p>
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Starts {formatHumanDate(item.effective_date)} · By {item.updated_by}
                </span>
                <button
                  onClick={() => setEditingContent(item)}
                  className="font-semibold accent-text hover:underline text-xs"
                >
                  Edit / publish
                </button>
              </div>
            </div>
          ))}
        </div>

        {editingContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]">
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
              className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-modal max-w-lg w-full p-5 space-y-4 text-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">Edit notice or rule</h4>
                <button
                  type="button"
                  onClick={() => setEditingContent(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Type</label>
                  <select
                    value={editingContent.type}
                    onChange={(e) => setEditingContent({ ...editingContent, type: e.target.value as any })}
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  >
                    <option value="Announcement">News notice</option>
                    <option value="Maintenance Banner">Pause banner</option>
                    <option value="FAQ">Common question</option>
                    <option value="Terms of Service">Terms of service</option>
                    <option value="Privacy Policy">Privacy rules</option>
                    <option value="Subscription Policy">Plan rules</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={editingContent.status}
                    onChange={(e) => setEditingContent({ ...editingContent, status: e.target.value as any })}
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Live</option>
                    <option value="Scheduled">Planned</option>
                    <option value="Archived">Hidden</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={editingContent.title}
                  onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Version</label>
                  <input
                    type="text"
                    value={editingContent.version}
                    onChange={(e) => setEditingContent({ ...editingContent, version: e.target.value })}
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Start date</label>
                  <input
                    type="date"
                    value={editingContent.effective_date}
                    onChange={(e) => setEditingContent({ ...editingContent, effective_date: e.target.value })}
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Words</label>
                <textarea
                  rows={4}
                  value={editingContent.body}
                  onChange={(e) => setEditingContent({ ...editingContent, body: e.target.value })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingContent(null)}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold accent-bg">
                  Save notice
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // MODULES 18 & 19: SYSTEM RULES & PAY SETTINGS
  if (mode === 'settings') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (settingsReason.trim().length < 5) return;
          onUpdatePlatformSettings(draftSettings, settingsReason.trim());
          setSettingsReason('');
        }}
        className="space-y-5 text-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Settings className="w-4 h-4 accent-text" />
              <span>{tr('Signup & company rules')}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">App name</label>
                <input
                  type="text"
                  value={draftSettings.platform_name}
                  onChange={(e) => setDraftSettings({ ...draftSettings, platform_name: e.target.value })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Help email</label>
                <input
                  type="email"
                  value={draftSettings.support_email}
                  onChange={(e) => setDraftSettings({ ...draftSettings, support_email: e.target.value })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Free days</label>
                <input
                  type="number"
                  value={draftSettings.default_trial_days}
                  onChange={(e) => setDraftSettings({ ...draftSettings, default_trial_days: Number(e.target.value) })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Extra days</label>
                <input
                  type="number"
                  value={draftSettings.grace_period_days}
                  onChange={(e) => setDraftSettings({ ...draftSettings, grace_period_days: Number(e.target.value) })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Pause after</label>
                <input
                  type="number"
                  value={draftSettings.auto_suspend_after_grace_days}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, auto_suspend_after_grace_days: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
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

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              {tr('MoMo code & site pause mode')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('MTN MoMo pay code')}</label>
                <input
                  type="text"
                  value={draftSettings.momo_merchant_code}
                  onChange={(e) => setDraftSettings({ ...draftSettings, momo_merchant_code: e.target.value })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('Tax (%)')}</label>
                <input
                  type="number"
                  value={draftSettings.vat_rate_pct}
                  onChange={(e) => setDraftSettings({ ...draftSettings, vat_rate_pct: Number(e.target.value) })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('Company tax number (TIN)')}</label>
              <input
                type="text"
                value={draftSettings.rra_saas_tin}
                onChange={(e) => setDraftSettings({ ...draftSettings, rra_saas_tin: e.target.value })}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 space-y-2">
              <label className="flex items-center gap-2.5 font-semibold text-rose-700 dark:text-rose-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.maintenance_mode}
                  onChange={(e) => setDraftSettings({ ...draftSettings, maintenance_mode: e.target.checked })}
                />
                <span>{tr('Pause website for repairs')}</span>
              </label>
              <input
                type="text"
                value={draftSettings.maintenance_message}
                onChange={(e) => setDraftSettings({ ...draftSettings, maintenance_message: e.target.value })}
                className="w-full bg-white dark:bg-[#0f172a] border border-rose-200 dark:border-rose-500/30 rounded-lg p-2.5"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value={settingsReason}
            onChange={(e) => setSettingsReason(e.target.value)}
            placeholder={tr('Write why you changed these rules (at least 5 letters)...')}
            className="flex-1 bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none"
            required
          />
          <button type="submit" className="px-5 py-2.5 rounded-lg font-semibold whitespace-nowrap accent-bg">
            {tr('Save rules')}
          </button>
        </div>
      </form>
    );
  }

  // MODULE 20: ADMIN TEAM
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 accent-text" />
            <span>{tr('Admin team')}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Main owners control everything. Team helpers cannot give themselves extra power.')}
          </p>
        </div>
        <button
          onClick={() => {
            setIsAddAdminOpen(true);
            setAdminFeedback(null);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap accent-bg"
        >
          <UserPlus className="w-4 h-4" />
          <span>{tr('Add helper')}</span>
        </button>
      </div>

      {adminFeedback && (
        <div
          className={`p-3.5 rounded-xl text-sm font-medium ${
            adminFeedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {adminFeedback.text}
        </div>
      )}

      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">{tr('Name & email')}</th>
              <th className="py-3 px-4">{tr('Role')}</th>
              <th className="py-3 px-4">{tr('Pages allowed')}</th>
              <th className="py-3 px-4">{tr('Status')}</th>
              <th className="py-3 px-4 text-right">{tr('Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-900 dark:text-slate-100">
            {platformAdmins.map((adm) => {
              const isMasterOwner = isSuperAdminEmail(adm.email);
              const permKeys = Object.keys(adm.permissions || {});
              const guardCheck = canModifyPlatformAdmin(activeAdmin, adm);

              return (
                <tr key={adm.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold flex items-center gap-2 flex-wrap">
                      <span>{adm.name}</span>
                      {isMasterOwner && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-xs whitespace-nowrap">
                          {tr('Main owner')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {adm.email} · {adm.phone}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    {tr(SUB_ROLE_LABELS[adm.sub_role] || adm.sub_role)}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                    {adm.sub_role === 'platform_owner' ? tr('All 20 pages') : `${permKeys.length} ${tr('pages')}`}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
                      <span className={`w-2 h-2 rounded-full ${getStatusDotColor(adm.status)}`} />
                      <span>{tr(adm.status)}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!isMasterOwner && guardCheck.allowed ? (
                      <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                        <select
                          value={adm.sub_role}
                          onChange={(e) => {
                            const nextRole = e.target.value as SuperAdminSubRole;
                            setPendingAction({
                              title: `Change role for ${adm.name}`,
                              description: `${SUB_ROLE_LABELS[adm.sub_role]} → ${SUB_ROLE_LABELS[nextRole]}`,
                              confirmLabel: 'Update role',
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
                          className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                        >
                          <option value="platform_admin">{tr('General admin')}</option>
                          <option value="finance_admin">{tr('Money admin')}</option>
                          <option value="support_admin">{tr('Help admin')}</option>
                          <option value="technical_admin">{tr('Tools admin')}</option>
                          <option value="security_admin">{tr('Safety admin')}</option>
                          <option value="platform_owner">{tr('Main owner')}</option>
                        </select>

                        <button
                          onClick={() =>
                            setPendingAction({
                              title: `${adm.status === 'Active' ? tr('Pause') : tr('Turn on')} ${tr('admin')} ${adm.name}`,
                              description: adm.email,
                              confirmLabel: adm.status === 'Active' ? tr('Pause admin') : tr('Turn on admin'),
                              danger: adm.status === 'Active',
                              execute: (reason) => {
                                const nextStatus = adm.status === 'Active' ? 'Suspended' : 'Active';
                                const res = onUpdateAdmin(adm.id, { status: nextStatus }, reason);
                                setAdminFeedback(
                                  res.success
                                    ? { type: 'ok', text: `${adm.name} set to ${nextStatus}.` }
                                    : { type: 'error', text: res.error || tr('Could not change status.') }
                                );
                              },
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold whitespace-nowrap"
                        >
                          {adm.status === 'Active' ? tr('Pause') : tr('Turn on')}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{tr('Protected owner')}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]">
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
                setAdminFeedback({ type: 'error', text: res.error || tr('Could not add helper.') });
              }
            }}
            className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-modal max-w-md w-full p-5 space-y-4 text-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tr('Add admin helper')}</h4>
              <button
                type="button"
                onClick={() => setIsAddAdminOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('Full name')}</label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('Email')}</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('Phone')}</label>
                <input
                  type="text"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('Role')}</label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value as SuperAdminSubRole)}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
              >
                <option value="platform_admin">{tr('General admin')}</option>
                <option value="finance_admin">{tr('Money admin')}</option>
                <option value="support_admin">{tr('Help admin')}</option>
                <option value="technical_admin">{tr('Tools admin')}</option>
                <option value="security_admin">{tr('Safety admin')}</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('Reason')}</label>
              <input
                type="text"
                value={newAdminReason}
                onChange={(e) => setNewAdminReason(e.target.value)}
                placeholder={tr('e.g. Helping check payments and support.')}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddAdminOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
              >
                {tr('Cancel')}
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg font-semibold accent-bg">
                {tr('Add helper')}
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
