import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Car,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Mail,
  Radio,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  BackgroundJob,
  Booking,
  Company,
  CompanyStatus,
  CompanySubscription,
  MaintenanceRecord,
  NotificationDeliveryLog,
  NotificationTemplate,
  PlatformAdmin,
  PlatformAuditLog,
  PlatformContentItem,
  PlatformIntegration,
  PlatformPlan,
  PlatformSettings,
  SaasPaymentRecord,
  SaasPaymentStatus,
  SecurityIncident,
  SubscriptionTier,
  SuperAdminModuleId,
  SuperAdminSubRole,
  SupportTicket,
  SystemErrorLog,
  User,
  Vehicle,
} from '../types';
import { ColorTheme } from '../theme';
import { hasPlatformPermission } from '../utils/auth';
import { SuperAdminOverviewAndAnalytics } from './superadmin/SuperAdminOverviewAndAnalytics';
import { SuperAdminTenantsAndUsers } from './superadmin/SuperAdminTenantsAndUsers';
import { SuperAdminBillingAndPlans } from './superadmin/SuperAdminBillingAndPlans';
import { SuperAdminOperationsAndSupport } from './superadmin/SuperAdminOperationsAndSupport';
import { SuperAdminPlatformGovernance } from './superadmin/SuperAdminPlatformGovernance';
import { useI18n } from '../utils/i18n';

interface SuperAdminViewProps {
  companies: Company[];
  currentCompany: Company;
  tiers: SubscriptionTier[];
  currentUser: User;
  users: User[];
  vehicles: Vehicle[];
  bookings: Booking[];
  maintenance: MaintenanceRecord[];
  platformAdmins: PlatformAdmin[];
  platformPlans: PlatformPlan[];
  companySubscriptions: CompanySubscription[];
  saasPayments: SaasPaymentRecord[];
  supportTickets: SupportTicket[];
  platformAuditLogs: PlatformAuditLog[];
  notificationTemplates: NotificationTemplate[];
  notificationDeliveryLogs: NotificationDeliveryLog[];
  platformIntegrations: PlatformIntegration[];
  backgroundJobs: BackgroundJob[];
  systemErrorLogs: SystemErrorLog[];
  securityIncidents: SecurityIncident[];
  platformContent: PlatformContentItem[];
  platformSettings: PlatformSettings;
  isFirebaseConnected: boolean;
  currentTheme: ColorTheme;
  onUpdateCompanyStatus: (companyId: string, status: CompanyStatus, reason?: string) => void;
  onUpdateCompanyPlan: (companyId: string, tierId: 'starter' | 'growth' | 'enterprise', reason?: string) => void;
  onSwitchCompanyContext: (companyId: string, reason?: string) => void;
  onAddTenantCompany: (
    companyData: Omit<Company, 'id' | 'created_at'>,
    ownerName: string,
    ownerEmail: string,
    ownerPhone: string
  ) => void;
  onUpdateUserStatusByAdmin: (
    userId: string,
    status: 'Active' | 'Suspended' | 'Deactivated',
    reason: string
  ) => void;
  onRevokeUserSessions: (userId: string, reason: string) => void;
  onTriggerUserRecovery: (userId: string) => void;
  onSavePlatformPlan: (plan: PlatformPlan, reason: string) => void;
  onExtendCompanySubscription: (subscriptionId: string, newRenewalDate: string, reason: string) => void;
  onGrantCompanyTrial: (companyId: string, trialDays: number, reason: string) => void;
  onReconcileSaasPayment: (paymentId: string, nextStatus: SaasPaymentStatus, notes: string) => void;
  onRefundSaasPayment: (paymentId: string, refundAmountRwf: number, reason: string) => void;
  onInspectBooking: (bookingId: string, label: string) => void;
  onUpdateSupportTicket: (ticketId: string, updates: Partial<SupportTicket>, newInternalNote?: string) => void;
  onSaveNotificationTemplate: (template: NotificationTemplate) => void;
  onSendPlatformNotification: (templateId: string, recipient: string, companyName?: string) => void;
  onToggleIntegration: (integrationId: string, reason: string) => void;
  onTestIntegrationConnection: (
    integrationId: string
  ) => Promise<{ status: PlatformIntegration['status']; latencyMs: number }>;
  onRetryBackgroundJob: (jobId: string) => void;
  onResolveSystemError: (errorId: string) => void;
  onResolveSecurityIncident: (incidentId: string, status: SecurityIncident['status'], notes: string) => void;
  onSavePlatformContent: (item: PlatformContentItem) => void;
  onUpdatePlatformSettings: (updates: Partial<PlatformSettings>, reason: string) => void;
  onCreatePlatformAdmin: (
    data: { name: string; email: string; phone: string; sub_role: SuperAdminSubRole },
    reason: string
  ) => { success: boolean; error?: string };
  onUpdatePlatformAdmin: (
    adminId: string,
    updates: Partial<PlatformAdmin>,
    reason: string
  ) => { success: boolean; error?: string };
  onNavigateToTab?: (tab: string) => void;
  requestedModule?: SuperAdminModuleId | null;
  onClearRequestedModule?: () => void;
}

interface NavGroup {
  groupLabel: string;
  items: { id: SuperAdminModuleId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[];
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  companies,
  currentCompany,
  currentUser,
  users,
  vehicles,
  bookings,
  maintenance,
  platformAdmins,
  platformPlans,
  companySubscriptions,
  saasPayments,
  supportTickets,
  platformAuditLogs,
  notificationTemplates,
  notificationDeliveryLogs,
  platformIntegrations,
  backgroundJobs,
  systemErrorLogs,
  securityIncidents,
  platformContent,
  platformSettings,
  isFirebaseConnected,
  currentTheme,
  onUpdateCompanyStatus,
  onUpdateCompanyPlan,
  onSwitchCompanyContext,
  onAddTenantCompany,
  onUpdateUserStatusByAdmin,
  onRevokeUserSessions,
  onTriggerUserRecovery,
  onSavePlatformPlan,
  onExtendCompanySubscription,
  onGrantCompanyTrial,
  onReconcileSaasPayment,
  onRefundSaasPayment,
  onInspectBooking,
  onUpdateSupportTicket,
  onSaveNotificationTemplate,
  onSendPlatformNotification,
  onToggleIntegration,
  onTestIntegrationConnection,
  onRetryBackgroundJob,
  onResolveSystemError,
  onResolveSecurityIncident,
  onSavePlatformContent,
  onUpdatePlatformSettings,
  onCreatePlatformAdmin,
  onUpdatePlatformAdmin,
  onNavigateToTab,
  requestedModule,
  onClearRequestedModule,
}) => {
  const { tr } = useI18n();
  const [activeModule, setActiveModule] = useState<SuperAdminModuleId>('overview');

  useEffect(() => {
    if (requestedModule) {
      setActiveModule(requestedModule);
      onClearRequestedModule?.();
    }
  }, [requestedModule, onClearRequestedModule]);

  const activePlatformAdmin = useMemo(() => {
    return (
      platformAdmins.find((a) => a.email.toLowerCase() === currentUser.email.toLowerCase()) || null
    );
  }, [platformAdmins, currentUser.email]);

  const openTicketCount = supportTickets.filter(
    (t) => t.status !== 'Resolved' && t.status !== 'Closed'
  ).length;
  const openSecCount = securityIncidents.filter((s) => s.status !== 'Resolved').length;
  const pendingCompaniesCount = companies.filter(
    (c) => c.status === 'Pending' || c.status === 'Pending Verification'
  ).length;

  const navGroups: NavGroup[] = useMemo(() => {
    const raw: NavGroup[] = [
      {
        groupLabel: 'Overview & numbers',
        items: [
          { id: 'overview', label: 'Home summary', icon: LayoutDashboard },
          { id: 'analytics', label: 'Growth & usage', icon: BarChart3 },
        ],
      },
      {
        groupLabel: 'Companies & people',
        items: [
          { id: 'companies', label: 'Companies', icon: Building2, badge: pendingCompaniesCount || undefined },
          { id: 'users', label: 'All people', icon: Users },
        ],
      },
      {
        groupLabel: 'Plans & money',
        items: [
          { id: 'subscriptions', label: 'Active plans', icon: Layers },
          { id: 'plans', label: 'Price list', icon: FileText },
          { id: 'saas_payments', label: 'Plan payments', icon: CreditCard },
          { id: 'revenue', label: 'Money summary', icon: DollarSign },
        ],
      },
      {
        groupLabel: 'Trips & help',
        items: [
          { id: 'bookings', label: 'All bookings', icon: ClipboardList },
          { id: 'fleet', label: 'All cars', icon: Car },
          { id: 'support', label: 'Help desk', icon: LifeBuoy, badge: openTicketCount || undefined },
          { id: 'notifications', label: 'SMS & emails', icon: Mail },
        ],
      },
      {
        groupLabel: 'Safety & rules',
        items: [
          { id: 'integrations', label: 'Connected tools', icon: Radio },
          { id: 'health', label: 'System status', icon: Activity },
          { id: 'security', label: 'Safety alerts', icon: ShieldAlert, badge: openSecCount || undefined },
          { id: 'audit', label: 'Change history', icon: Lock },
          { id: 'content', label: 'Notices & rules', icon: FileText },
          { id: 'settings', label: 'Main settings', icon: Settings },
          { id: 'admins', label: 'Admin team', icon: ShieldCheck },
        ],
      },
    ];

    return raw
      .map((g) => ({
        ...g,
        items: g.items.filter((it) =>
          hasPlatformPermission(activePlatformAdmin, it.id, 'view', currentUser.email)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [activePlatformAdmin, currentUser.email, pendingCompaniesCount, openTicketCount, openSecCount]);

  const canApproveCompanies = hasPlatformPermission(
    activePlatformAdmin,
    'companies',
    'approve',
    currentUser.email
  );
  const canSuspendCompanies = hasPlatformPermission(
    activePlatformAdmin,
    'companies',
    'suspend',
    currentUser.email
  );
  const canSuspendUsers = hasPlatformPermission(
    activePlatformAdmin,
    'users',
    'suspend',
    currentUser.email
  );
  const canEditBilling = hasPlatformPermission(
    activePlatformAdmin,
    'saas_payments',
    'edit',
    currentUser.email
  );

  const defaultTenantId = companies[0]?.id || 'comp-kigali-exec';
  const isContextSwitched = currentCompany.id !== defaultTenantId;

  const allNavItems = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups]);
  const quickMobileModules: { id: SuperAdminModuleId; label: string }[] = [
    { id: 'overview', label: tr('Summary') },
    { id: 'companies', label: tr('Companies') },
    { id: 'revenue', label: tr('Money') },
    { id: 'settings', label: tr('Settings') },
  ];

  const selectModule = (mod: SuperAdminModuleId) => {
    setActiveModule(mod);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Compact Sticky Context & Section Bar */}
      <div className="sticky top-[64px] z-20 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
            {tr('Company')}:
          </span>
          <select
            value={currentCompany.id}
            onChange={(e) => {
              const targetId = e.target.value;
              const targetComp = companies.find((c) => c.id === targetId);
              onSwitchCompanyContext(
                targetId,
                `Switched view to ${targetComp?.name || targetId}.`
              );
            }}
            aria-label="Select company to view"
            className="min-w-0 flex-1 sm:max-w-[300px] text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {isContextSwitched && (
            <button
              onClick={() =>
                onSwitchCompanyContext(defaultTenantId, 'Switched back to main company view.')
              }
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{tr('Reset')}</span>
            </button>
          )}
        </div>

        {/* Mobile All-Section Dropdown Picker */}
        <div className="lg:hidden flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="admin-mobile-section" className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            {tr('Section')}:
          </label>
          <select
            id="admin-mobile-section"
            value={activeModule}
            onChange={(e) => selectModule(e.target.value as SuperAdminModuleId)}
            className="flex-1 sm:w-56 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {navGroups.map((group) => (
              <optgroup key={group.groupLabel} label={tr(group.groupLabel)}>
                {group.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {tr(item.label)}
                    {item.badge ? ` (${item.badge})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Maintenance Mode Banner */}
      {platformSettings.maintenance_mode && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong className="font-semibold">{tr('Site pause is on:')}</strong> {platformSettings.maintenance_message}
            </span>
          </div>
          <button
            onClick={() => setActiveModule('settings')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold whitespace-nowrap text-xs transition-colors"
          >
            {tr('Change')}
          </button>
        </div>
      )}

      {/* Compact Mobile Quick Tabs */}
      <div className="lg:hidden inline-flex w-full items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg gap-1">
        {quickMobileModules
          .filter((qm) => allNavItems.some((item) => item.id === qm.id))
          .map((qm) => {
            const isActive = activeModule === qm.id;
            return (
              <button
                key={qm.id}
                onClick={() => selectModule(qm.id)}
                className={`flex-1 px-2 py-2 text-xs rounded-md text-center truncate transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'font-medium text-slate-500 dark:text-slate-400'
                }`}
              >
                {qm.label}
              </button>
            );
          })}
      </div>

      {/* Desktop Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-3 space-y-4 sticky top-[132px] max-h-[calc(100vh-9rem)] overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tr(group.groupLabel)}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectModule(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'font-semibold accent-tint accent-text'
                        : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'accent-text' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="truncate">{tr(item.label)}</span>
                    </span>
                    {item.badge ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-semibold tabular-nums">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <section className="lg:col-span-9 min-w-0">
          {(activeModule === 'overview' || activeModule === 'analytics') && (
            <SuperAdminOverviewAndAnalytics
              mode={activeModule}
              companies={companies}
              users={users}
              vehicles={vehicles}
              bookings={bookings}
              subscriptions={companySubscriptions}
              saasPayments={saasPayments}
              plans={platformPlans}
              supportTickets={supportTickets}
              securityIncidents={securityIncidents}
              auditLogs={platformAuditLogs}
              currentTheme={currentTheme}
              onNavigateModule={setActiveModule}
            />
          )}

          {(activeModule === 'companies' || activeModule === 'users') && (
            <SuperAdminTenantsAndUsers
              mode={activeModule}
              companies={companies}
              currentCompany={currentCompany}
              users={users}
              vehicles={vehicles}
              bookings={bookings}
              subscriptions={companySubscriptions}
              saasPayments={saasPayments}
              auditLogs={platformAuditLogs}
              currentTheme={currentTheme}
              canApproveCompanies={canApproveCompanies}
              canSuspendCompanies={canSuspendCompanies}
              canSuspendUsers={canSuspendUsers}
              onUpdateCompanyStatus={onUpdateCompanyStatus}
              onUpdateCompanyPlan={onUpdateCompanyPlan}
              onSwitchCompanyContext={onSwitchCompanyContext}
              onAddTenantCompany={onAddTenantCompany}
              onUpdateUserStatus={onUpdateUserStatusByAdmin}
              onRevokeUserSessions={onRevokeUserSessions}
              onTriggerUserRecovery={onTriggerUserRecovery}
              onNavigateToTenantDashboard={() => onNavigateToTab?.('overview')}
            />
          )}

          {(activeModule === 'subscriptions' ||
            activeModule === 'plans' ||
            activeModule === 'saas_payments' ||
            activeModule === 'revenue') && (
            <SuperAdminBillingAndPlans
              mode={activeModule}
              companies={companies}
              subscriptions={companySubscriptions}
              plans={platformPlans}
              saasPayments={saasPayments}
              currentTheme={currentTheme}
              canEditBilling={canEditBilling}
              onExtendSubscription={onExtendCompanySubscription}
              onGrantTrial={onGrantCompanyTrial}
              onUpdateCompanyPlan={onUpdateCompanyPlan}
              onSavePlan={onSavePlatformPlan}
              onReconcilePayment={onReconcileSaasPayment}
              onRefundPayment={onRefundSaasPayment}
            />
          )}

          {(activeModule === 'bookings' ||
            activeModule === 'fleet' ||
            activeModule === 'support' ||
            activeModule === 'notifications') && (
            <SuperAdminOperationsAndSupport
              mode={activeModule}
              companies={companies}
              currentCompany={currentCompany}
              bookings={bookings}
              vehicles={vehicles}
              maintenance={maintenance}
              supportTickets={supportTickets}
              notificationTemplates={notificationTemplates}
              notificationLogs={notificationDeliveryLogs}
              platformAdmins={platformAdmins}
              currentTheme={currentTheme}
              onInspectBooking={onInspectBooking}
              onUpdateTicket={onUpdateSupportTicket}
              onSaveTemplate={onSaveNotificationTemplate}
              onSendNotification={onSendPlatformNotification}
            />
          )}

          {(activeModule === 'integrations' ||
            activeModule === 'health' ||
            activeModule === 'security' ||
            activeModule === 'audit' ||
            activeModule === 'content' ||
            activeModule === 'settings' ||
            activeModule === 'admins') && (
            <SuperAdminPlatformGovernance
              mode={activeModule}
              integrations={platformIntegrations}
              backgroundJobs={backgroundJobs}
              systemErrors={systemErrorLogs}
              securityIncidents={securityIncidents}
              auditLogs={platformAuditLogs}
              contentItems={platformContent}
              platformSettings={platformSettings}
              platformAdmins={platformAdmins}
              activeAdmin={activePlatformAdmin}
              currentUserEmail={currentUser.email}
              isFirebaseConnected={isFirebaseConnected}
              currentTheme={currentTheme}
              onToggleIntegration={onToggleIntegration}
              onTestIntegration={onTestIntegrationConnection}
              onRetryJob={onRetryBackgroundJob}
              onResolveSystemError={onResolveSystemError}
              onResolveSecurityIncident={onResolveSecurityIncident}
              onSaveContent={onSavePlatformContent}
              onUpdatePlatformSettings={onUpdatePlatformSettings}
              onCreateAdmin={onCreatePlatformAdmin}
              onUpdateAdmin={onUpdatePlatformAdmin}
            />
          )}
        </section>
      </div>
    </div>
  );
};
