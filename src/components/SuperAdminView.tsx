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
        groupLabel: 'Overview & Numbers',
        items: [
          { id: 'overview', label: 'Home Summary', icon: LayoutDashboard },
          { id: 'analytics', label: 'Growth & Usage', icon: BarChart3 },
        ],
      },
      {
        groupLabel: 'Companies & People',
        items: [
          { id: 'companies', label: 'Companies', icon: Building2, badge: pendingCompaniesCount || undefined },
          { id: 'users', label: 'All People', icon: Users },
        ],
      },
      {
        groupLabel: 'Plans & Money',
        items: [
          { id: 'subscriptions', label: 'Active Plans', icon: Layers },
          { id: 'plans', label: 'Price List', icon: FileText },
          { id: 'saas_payments', label: 'Plan Payments', icon: CreditCard },
          { id: 'revenue', label: 'Money Summary', icon: DollarSign },
        ],
      },
      {
        groupLabel: 'Trips & Help',
        items: [
          { id: 'bookings', label: 'All Bookings', icon: ClipboardList },
          { id: 'fleet', label: 'All Cars', icon: Car },
          { id: 'support', label: 'Help Desk', icon: LifeBuoy, badge: openTicketCount || undefined },
          { id: 'notifications', label: 'SMS & Emails', icon: Mail },
        ],
      },
      {
        groupLabel: 'Safety & Rules',
        items: [
          { id: 'integrations', label: 'Connected Tools', icon: Radio },
          { id: 'health', label: 'System Status', icon: Activity },
          { id: 'security', label: 'Safety Alerts', icon: ShieldAlert, badge: openSecCount || undefined },
          { id: 'audit', label: 'Change History', icon: Lock },
          { id: 'content', label: 'Notices & Rules', icon: FileText },
          { id: 'settings', label: 'Main Settings', icon: Settings },
          { id: 'admins', label: 'Admin Team', icon: ShieldCheck },
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
    { id: 'overview', label: 'Summary' },
    { id: 'companies', label: 'Companies' },
    { id: 'revenue', label: 'Money' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-4">
      {/* Compact Context Bar (Identity & role now live cleanly in the Profile Menu) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-semibold text-[#425466] dark:text-slate-400 shrink-0">
            Company:
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
            className="min-w-0 flex-1 sm:max-w-[280px] text-sm font-semibold text-[#0a2540] dark:text-white bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
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
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Mobile All-Section Dropdown Picker */}
        <div className="lg:hidden flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="admin-mobile-section" className="text-xs font-semibold text-[#425466] dark:text-slate-400 shrink-0">
            Section:
          </label>
          <select
            id="admin-mobile-section"
            value={activeModule}
            onChange={(e) => setActiveModule(e.target.value as SuperAdminModuleId)}
            className="flex-1 sm:w-56 text-sm font-semibold text-[#0a2540] dark:text-white bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            {navGroups.map((group) => (
              <optgroup key={group.groupLabel} label={group.groupLabel}>
                {group.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
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
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              <strong>Site Pause Is On:</strong> {platformSettings.maintenance_message}
            </span>
          </div>
          <button
            onClick={() => setActiveModule('settings')}
            className="px-4 py-1.5 rounded-full bg-rose-600 text-white font-semibold whitespace-nowrap text-sm"
          >
            Change
          </button>
        </div>
      )}

      {/* Compact Mobile Quick Tabs (4 main actions, zero clutter) */}
      <div className="lg:hidden grid grid-cols-4 gap-1.5">
        {quickMobileModules
          .filter((qm) => allNavItems.some((item) => item.id === qm.id))
          .map((qm) => {
            const isActive = activeModule === qm.id;
            return (
              <button
                key={qm.id}
                onClick={() => setActiveModule(qm.id)}
                className={`px-2 py-2 rounded-xl text-xs sm:text-sm font-semibold text-center truncate border transition-colors ${
                  isActive
                    ? `${currentTheme.primaryBg} ${currentTheme.btnText} border-transparent`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-300'
                }`}
              >
                {qm.label}
              </button>
            );
          })}
      </div>

      {/* Desktop Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="hidden lg:block lg:col-span-3 stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-5 sticky top-20">
          {navGroups.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              <div className="px-3 py-1 text-sm font-bold text-[#425466] dark:text-slate-400">
                {group.groupLabel}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      isActive
                        ? 'font-bold text-[#0a2540] dark:text-white bg-[#f6f9fc] dark:bg-slate-800'
                        : 'font-medium text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? currentTheme.primaryText : ''}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono text-sm font-bold">
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
