import React, { useMemo, useState } from 'react';
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
}) => {
  const [activeModule, setActiveModule] = useState<SuperAdminModuleId>('overview');

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
        groupLabel: 'Command & Telemetry',
        items: [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'analytics', label: 'Platform Analytics', icon: BarChart3 },
        ],
      },
      {
        groupLabel: 'Tenants & Identity',
        items: [
          { id: 'companies', label: 'Companies', icon: Building2, badge: pendingCompaniesCount || undefined },
          { id: 'users', label: 'Global Users', icon: Users },
        ],
      },
      {
        groupLabel: 'SaaS Billing & Revenue',
        items: [
          { id: 'subscriptions', label: 'Subscriptions', icon: Layers },
          { id: 'plans', label: 'Plans & Pricing', icon: FileText },
          { id: 'saas_payments', label: 'SaaS Payments', icon: CreditCard },
          { id: 'revenue', label: 'Revenue Intelligence', icon: DollarSign },
        ],
      },
      {
        groupLabel: 'Operations & Support',
        items: [
          { id: 'bookings', label: 'Bookings (Audited)', icon: ClipboardList },
          { id: 'fleet', label: 'Global Fleet', icon: Car },
          { id: 'support', label: 'Support Center', icon: LifeBuoy, badge: openTicketCount || undefined },
          { id: 'notifications', label: 'Notifications', icon: Mail },
        ],
      },
      {
        groupLabel: 'Governance & Infrastructure',
        items: [
          { id: 'integrations', label: 'Integrations', icon: Radio },
          { id: 'health', label: 'System Health & Jobs', icon: Activity },
          { id: 'security', label: 'Security Center', icon: ShieldAlert, badge: openSecCount || undefined },
          { id: 'audit', label: 'Immutable Audit Logs', icon: Lock },
          { id: 'content', label: 'Content & Policies', icon: FileText },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
          { id: 'admins', label: 'Admins & Permissions', icon: ShieldCheck },
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

  return (
    <div className="space-y-5">
      {/* Control Center Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                KigaliFleet Platform Control Center
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {activePlatformAdmin?.sub_role || 'platform_owner'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Signed in as <span className="font-mono">{currentUser.email}</span> · Multi-tenant governance, billing
              reconciliation &amp; immutable auditing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Inspected Tenant Context</div>
            <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
              {currentCompany.name}
            </div>
          </div>

          {isContextSwitched && (
            <button
              onClick={() =>
                onSwitchCompanyContext(defaultTenantId, 'Cleared temporary tenant inspection context back to default.')
              }
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Context</span>
            </button>
          )}
        </div>
      </div>

      {/* Maintenance Mode Active Indicator */}
      {platformSettings.maintenance_mode && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Platform Maintenance Mode is ACTIVE:</strong> {platformSettings.maintenance_message}
            </span>
          </div>
          <button
            onClick={() => setActiveModule('settings')}
            className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-semibold whitespace-nowrap"
          >
            Configure
          </button>
        </div>
      )}

      {/* Mobile Horizontal Navigation */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2">
        {navGroups.flatMap((g) => g.items).map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
                isActive
                  ? `${currentTheme.primaryBg} ${currentTheme.btnText} border-transparent`
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="px-1.5 py-0.2 rounded bg-black/15 text-[10px] font-mono">{item.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Desktop Left Sub-Navigation + Active Module Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-4 sticky top-20">
          {navGroups.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.groupLabel}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                        : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? currentTheme.primaryText : ''}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Active Module Workspace */}
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
