import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  KeyRound,
  Lock,
  MapPin,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  Booking,
  Company,
  CompanyStatus,
  CompanySubscription,
  PlatformAuditLog,
  SaasPaymentRecord,
  User,
  Vehicle,
} from '../../types';
import { ColorTheme } from '../../theme';
import { isSuperAdminEmail } from '../../utils/auth';
import { ReasonActionModal, getStatusDotColor, getStatusStyles } from './SuperAdminShared';
import { useI18n } from '../../utils/i18n';
import { formatHumanDate, formatHumanDateRange, formatHumanDateTime } from '../../utils/dates';

interface SuperAdminTenantsAndUsersProps {
  mode: 'companies' | 'users';
  companies: Company[];
  currentCompany: Company;
  users: User[];
  vehicles: Vehicle[];
  bookings: Booking[];
  subscriptions: CompanySubscription[];
  saasPayments: SaasPaymentRecord[];
  auditLogs: PlatformAuditLog[];
  currentTheme: ColorTheme;
  canApproveCompanies: boolean;
  canSuspendCompanies: boolean;
  canSuspendUsers: boolean;
  onUpdateCompanyStatus: (companyId: string, status: CompanyStatus, reason?: string) => void;
  onUpdateCompanyPlan: (companyId: string, tierId: 'starter' | 'growth' | 'enterprise', reason?: string) => void;
  onSwitchCompanyContext: (companyId: string, reason?: string) => void;
  onAddTenantCompany: (
    companyData: Omit<Company, 'id' | 'created_at'>,
    ownerName: string,
    ownerEmail: string,
    ownerPhone: string
  ) => void;
  onUpdateUserStatus: (userId: string, status: 'Active' | 'Suspended' | 'Deactivated', reason: string) => void;
  onRevokeUserSessions: (userId: string, reason: string) => void;
  onTriggerUserRecovery: (userId: string) => void;
  onNavigateToTenantDashboard?: () => void;
}

const STATUS_OPTIONS: CompanyStatus[] = [
  'Pending',
  'Pending Verification',
  'Trial',
  'Active',
  'Grace Period',
  'Suspended',
  'Restricted',
  'Inactive',
  'Closed',
];

export const SuperAdminTenantsAndUsers: React.FC<SuperAdminTenantsAndUsersProps> = ({
  mode,
  companies,
  currentCompany,
  users,
  vehicles,
  bookings,
  subscriptions,
  saasPayments,
  auditLogs,
  currentTheme,
  canApproveCompanies,
  canSuspendCompanies,
  canSuspendUsers,
  onUpdateCompanyStatus,
  onUpdateCompanyPlan,
  onSwitchCompanyContext,
  onAddTenantCompany,
  onUpdateUserStatus,
  onRevokeUserSessions,
  onTriggerUserRecovery,
  onNavigateToTenantDashboard,
}) => {
  const { formatMoney, tr } = useI18n();
  const [compSearch, setCompSearch] = useState('');
  const [compStatusFilter, setCompStatusFilter] = useState<'all' | CompanyStatus>('all');
  const [compTierFilter, setCompTierFilter] = useState<'all' | 'starter' | 'growth' | 'enterprise'>('all');
  const [dossierCompany, setDossierCompany] = useState<Company | null>(null);
  const [dossierTab, setDossierTab] = useState<'profile' | 'users' | 'fleet' | 'bookings' | 'billing' | 'audit'>('profile');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newCompName, setNewCompName] = useState('');
  const [newCompType, setNewCompType] = useState<Company['business_type']>('Car Rental');
  const [newCompTin, setNewCompTin] = useState('');
  const [newCompPhone, setNewCompPhone] = useState('+250 788 ');
  const [newCompEmail, setNewCompEmail] = useState('');
  const [newCompCity, setNewCompCity] = useState('Kigali');
  const [newCompTier, setNewCompTier] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [newCompStatus, setNewCompStatus] = useState<CompanyStatus>('Active');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('+250 788 ');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    danger?: boolean;
    execute: (reason: string) => void;
  } | null>(null);

  const filteredCompanies = useMemo(() => {
    const q = compSearch.trim().toLowerCase();
    return companies.filter((c) => {
      const matchesQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.tin_number.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.owner_name || '').toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      const matchesStatus = compStatusFilter === 'all' || (c.status || 'Active') === compStatusFilter;
      const matchesTier = compTierFilter === 'all' || c.tier_id === compTierFilter;
      return matchesQ && matchesStatus && matchesTier;
    });
  }, [companies, compSearch, compStatusFilter, compTierFilter]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q);
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesStatus = userStatusFilter === 'all' || (u.status || 'Active') === userStatusFilter;
      return matchesQ && matchesRole && matchesStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim() || !newCompTin.trim()) return;
    onAddTenantCompany(
      {
        name: newCompName.trim(),
        slug: newCompName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        business_type: newCompType,
        tin_number: newCompTin.trim(),
        phone: newCompPhone.trim(),
        email: newCompEmail.trim(),
        city: newCompCity.trim(),
        country: 'Rwanda',
        currency: 'RWF',
        tier_id: newCompTier,
        status: newCompStatus,
        renewal_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        vehicle_count: 5,
        monthly_fee_rwf: newCompTier === 'enterprise' ? 150000 : newCompTier === 'growth' ? 75000 : 35000,
      },
      newOwnerName.trim() || 'Managing Director',
      newOwnerEmail.trim() || newCompEmail.trim(),
      newOwnerPhone.trim() || newCompPhone.trim()
    );
    setIsAddModalOpen(false);
    setNewCompName('');
    setNewCompTin('');
    setNewCompEmail('');
    setNewOwnerName('');
    setNewOwnerEmail('');
  };

  if (mode === 'users') {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search people by name, email, or phone..."
              className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg pl-9 pr-3 py-2 outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="all">All roles ({users.length})</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="accountant">Accountant</option>
              <option value="fleet_manager">Car manager</option>
              <option value="mechanic">Mechanic</option>
              <option value="driver">Driver</option>
              <option value="receptionist">Front desk</option>
              <option value="superadmin">Main owner</option>
            </select>

            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Invited">Invited</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">{tr('Person')}</th>
                <th className="py-3 px-4">{tr('Company')}</th>
                <th className="py-3 px-4">{tr('Role')}</th>
                <th className="py-3 px-4">{tr('Last sign in')}</th>
                <th className="py-3 px-4">{tr('Status')}</th>
                <th className="py-3 px-4 text-right">{tr('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-900 dark:text-slate-100">
              {filteredUsers.map((u) => {
                const comp = companies.find((c) => c.id === u.company_id);
                const isMasterOwner = isSuperAdminEmail(u.email) || u.role === 'superadmin';
                const st = u.status || 'Active';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{isMasterOwner ? 'Main platform' : comp?.name || u.company_id}</div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">{u.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs capitalize whitespace-nowrap">
                        {isMasterOwner ? 'Main owner' : u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <div className="whitespace-nowrap">
                        {u.last_login ? formatHumanDateTime(u.last_login) : 'Signed in now'}
                      </div>
                      {u.sessions_revoked_at && (
                        <div className="text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          Signed out {formatHumanDate(u.sessions_revoked_at)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
                        <span className={`w-2 h-2 rounded-full ${getStatusDotColor(st)}`} />
                        <span>{st}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold whitespace-nowrap transition-colors"
                        >
                          View
                        </button>
                        {!isMasterOwner && canSuspendUsers && (
                          <button
                            onClick={() =>
                              setPendingAction({
                                title: st === 'Suspended' ? `Turn account on for ${u.name}` : `Pause account for ${u.name}`,
                                description: `${u.email} · ${comp?.name || u.company_id}`,
                                confirmLabel: st === 'Suspended' ? 'Turn on' : 'Pause account',
                                danger: st !== 'Suspended',
                                execute: (reason) =>
                                  onUpdateUserStatus(u.id, st === 'Suspended' ? 'Active' : 'Suspended', reason),
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors ${
                              st === 'Suspended'
                                ? 'border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                                : 'border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                            }`}
                          >
                            {st === 'Suspended' ? 'Turn on' : 'Pause'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]">
            <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-modal max-w-lg w-full p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{selectedUser.name}</h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Role</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 capitalize">
                    {selectedUser.role.replace('_', ' ')}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Status</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedUser.status || 'Active'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Phone</div>
                  <div className="font-mono text-slate-900 dark:text-slate-100 mt-0.5">{selectedUser.phone}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Password help sent</div>
                  <div className="font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedUser.recovery_requested_at
                      ? formatHumanDate(selectedUser.recovery_requested_at)
                      : 'Never'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-xs text-amber-800 dark:text-amber-400 flex items-center gap-2.5">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  For safety, nobody can see or change another person&apos;s password. You can only send a reset link or sign them out.
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    onTriggerUserRecovery(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Send reset link</span>
                </button>
                <button
                  onClick={() => {
                    const target = selectedUser;
                    setSelectedUser(null);
                    setPendingAction({
                      title: `Log out ${target.name} everywhere`,
                      description: `Signs out ${target.email} from all phones and computers right now.`,
                      confirmLabel: 'Log out everywhere',
                      danger: true,
                      execute: (reason) => onRevokeUserSessions(target.id, reason),
                    });
                  }}
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                >
                  Log out everywhere
                </button>
              </div>
            </div>
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
  }

  // COMPANIES DIRECTORY (Module 2)
  const dossierSubs = dossierCompany
    ? subscriptions.filter((s) => s.company_id === dossierCompany.id)
    : [];
  const dossierPayments = dossierCompany
    ? saasPayments.filter((p) => p.company_id === dossierCompany.id)
    : [];
  const dossierUsers = dossierCompany ? users.filter((u) => u.company_id === dossierCompany.id) : [];
  const dossierAudits = dossierCompany
    ? auditLogs.filter((a) => a.affected_entity_id === dossierCompany.id)
    : [];

  return (
    <div className="space-y-4">
      {/* Search, Filters & Add Company CTA */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={compSearch}
            onChange={(e) => setCompSearch(e.target.value)}
            placeholder="Search company, tax number, city, or owner..."
            className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg pl-9 pr-3 py-2 outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={compStatusFilter}
            onChange={(e) => setCompStatusFilter(e.target.value as any)}
            className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">All statuses ({companies.length})</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st} ({companies.filter((c) => (c.status || 'Active') === st).length})
              </option>
            ))}
          </select>

          <select
            value={compTierFilter}
            onChange={(e) => setCompTierFilter(e.target.value as any)}
            className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">All plans</option>
            <option value="enterprise">Enterprise</option>
            <option value="growth">Growth</option>
            <option value="starter">Starter</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap accent-bg"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('Add company')}</span>
          </button>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">{tr('Company & tax ID')}</th>
              <th className="py-3 px-4">{tr('Owner & city')}</th>
              <th className="py-3 px-4">{tr('Plan & cars')}</th>
              <th className="py-3 px-4 text-right">{tr('Price/mo')}</th>
              <th className="py-3 px-4">{tr('Status')}</th>
              <th className="py-3 px-4 text-right">{tr('Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-900 dark:text-slate-100">
            {filteredCompanies.map((comp) => {
              const status = comp.status || 'Active';
              const isPending = status === 'Pending' || status === 'Pending Verification';
              const isCurrent = comp.id === currentCompany.id;
              const fee =
                comp.monthly_fee_rwf ??
                (comp.tier_id === 'enterprise' ? 150000 : comp.tier_id === 'growth' ? 75000 : 35000);

              return (
                <tr key={comp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{comp.name}</span>
                      {isCurrent && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                          Open now
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      TIN {comp.tin_number} · {comp.business_type}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div>{comp.owner_name || 'Company owner'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{comp.city}</span>
                      <span>·</span>
                      <span className="font-mono whitespace-nowrap">{comp.phone}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono font-semibold text-xs capitalize">{comp.tier_id}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {comp.vehicle_count || 0} cars · {comp.branches_count || 1} office(s)
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <div className="font-semibold whitespace-nowrap">{formatMoney(fee)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {comp.renewal_date ? formatHumanDate(comp.renewal_date) : tr('Trial')}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
                      <span className={`w-2 h-2 rounded-full ${getStatusDotColor(status)}`} />
                      <span>{tr(status)}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        onClick={() => {
                          setDossierCompany(comp);
                          setDossierTab('profile');
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>

                      {isPending && canApproveCompanies && (
                        <button
                          onClick={() =>
                            setPendingAction({
                              title: `Approve company: ${comp.name}`,
                              description: `TIN ${comp.tin_number} will be turned on so they can use the system.`,
                              confirmLabel: 'Approve now',
                              execute: (reason) => onUpdateCompanyStatus(comp.id, 'Active', reason),
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap inline-flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onSwitchCompanyContext(comp.id, `Opened company workspace from Admin Desk`);
                          onNavigateToTenantDashboard?.();
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap inline-flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 accent-text" />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Company Full Info Modal */}
      {dossierCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-modal max-w-4xl w-full p-5 max-h-[90vh] flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{dossierCompany.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles(
                      dossierCompany.status || 'Active'
                    )}`}
                  >
                    {dossierCompany.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                  ID {dossierCompany.id} · TIN {dossierCompany.tin_number} · {dossierCompany.city}
                </p>
              </div>
              <button
                onClick={() => setDossierCompany(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Tabs */}
            <div className="pt-3 overflow-x-auto">
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg gap-1">
                {(
                  [
                    { id: 'profile', label: 'Details & controls' },
                    { id: 'users', label: `People (${dossierUsers.length})` },
                    { id: 'fleet', label: 'Cars' },
                    { id: 'bookings', label: 'Recent trips' },
                    { id: 'billing', label: `Payments (${dossierPayments.length})` },
                    { id: 'audit', label: `Change history (${dossierAudits.length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDossierTab(tab.id)}
                    className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
                      dossierTab === tab.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm">
              {dossierTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Company owner</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {dossierCompany.owner_name || 'Owner'}
                      </div>
                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{dossierCompany.email}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{tr('Plan')}</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
                        {dossierCompany.tier_id}
                      </div>
                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatMoney(dossierCompany.monthly_fee_rwf || 0)} / {tr('month')}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Support person</div>
                      <div className="font-mono text-xs text-slate-900 dark:text-slate-100 mt-1 break-all">
                        {dossierCompany.assigned_support_admin || 'support.lead@kigalifleet.rw'}
                      </div>
                    </div>
                  </div>

                  {dossierCompany.suspension_reason && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
                      <strong className="font-semibold">Last reason saved:</strong> {dossierCompany.suspension_reason}
                    </div>
                  )}

                  {canSuspendCompanies && (
                    <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 space-y-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Change company status (reason saved)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['Active', 'Trial', 'Grace Period', 'Restricted', 'Suspended', 'Closed'] as CompanyStatus[]).map(
                          (targetStatus) => (
                            <button
                              key={targetStatus}
                              onClick={() =>
                                setPendingAction({
                                  title: `Set ${dossierCompany.name} to ${targetStatus}`,
                                  description: `Current status: ${dossierCompany.status || 'Active'}`,
                                  confirmLabel: `Set ${targetStatus}`,
                                  danger: targetStatus === 'Suspended' || targetStatus === 'Closed',
                                  execute: (reason) => {
                                    onUpdateCompanyStatus(dossierCompany.id, targetStatus, reason);
                                    setDossierCompany({ ...dossierCompany, status: targetStatus, suspension_reason: reason });
                                  },
                                })
                              }
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold whitespace-nowrap transition-colors"
                            >
                              {targetStatus}
                            </button>
                          )
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Change plan:</span>
                        {(['starter', 'growth', 'enterprise'] as const).map((tier) => (
                          <button
                            key={tier}
                            onClick={() =>
                              setPendingAction({
                                title: `Change ${dossierCompany.name} plan to ${tier}`,
                                description: 'Updates how many cars they can add and their monthly price.',
                                confirmLabel: `Switch to ${tier}`,
                                execute: (reason) => {
                                  onUpdateCompanyPlan(dossierCompany.id, tier, reason);
                                  setDossierCompany({ ...dossierCompany, tier_id: tier });
                                },
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg font-mono capitalize text-xs font-semibold border transition-colors ${
                              dossierCompany.tier_id === tier
                                ? 'accent-border accent-text accent-tint'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {dossierTab === 'users' && (
                <div className="space-y-2">
                  {dossierUsers.length === 0 ? (
                    <p className="p-4 text-slate-500 dark:text-slate-400">No staff accounts added for this company yet.</p>
                  ) : (
                    dossierUsers.map((u) => (
                      <div key={u.id} className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {u.email} · {u.phone}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs capitalize">
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierTab === 'fleet' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing cars in the system ({vehicles.length} total):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {vehicles.slice(0, 6).map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{v.model_name}</div>
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {v.plate_number} · {formatMoney(v.daily_rate_rwf)}{tr('/day')}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md border text-xs font-medium ${getStatusStyles(v.status)}`}>
                          {tr(v.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dossierTab === 'bookings' && (
                <div className="space-y-2">
                  {bookings.slice(0, 6).map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {b.client_name} · {b.destination}
                        </div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatHumanDateRange(b.start_date, b.end_date)} · {formatMoney(b.total_rwf)}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md border text-xs font-medium ${getStatusStyles(b.status)}`}>
                        {tr(b.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {dossierTab === 'billing' && (
                <div className="space-y-2.5">
                  {dossierSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{sub.plan_name} {tr('plan')}</div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {tr('Renews')} {formatHumanDate(sub.renewal_date)} · {formatMoney(sub.monthly_fee_rwf)}/{tr('month')}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md border text-xs font-medium ${getStatusStyles(sub.status)}`}>
                        {tr(sub.status)}
                      </span>
                    </div>
                  ))}
                  {dossierPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {p.transaction_ref} · {formatMoney(p.amount_rwf)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {p.method} ({p.provider_ref}) · {formatHumanDate(p.created_at)}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md border text-xs font-medium ${getStatusStyles(p.status)}`}>
                        {tr(p.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {dossierTab === 'audit' && (
                <div className="space-y-2">
                  {dossierAudits.length === 0 ? (
                    <p className="p-4 text-slate-500 dark:text-slate-400">No changes saved for this company yet.</p>
                  ) : (
                    dossierAudits.map((a) => (
                      <div key={a.id} className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{a.action}</span>
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {formatHumanDateTime(a.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {a.actor_email}: {a.reason}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Company */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-modal max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 accent-text" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Add new company
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company name
                </label>
                <input
                  type="text"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="e.g. Nyungwe Canopy Tours Ltd"
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Type of work</label>
                  <select
                    value={newCompType}
                    onChange={(e) => setNewCompType(e.target.value as any)}
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="Car Rental">Car rental</option>
                    <option value="Tour Operator">Tour operator</option>
                    <option value="Airport Shuttle">Airport shuttle</option>
                    <option value="Corporate Transport">Company transport</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tax number (TIN)</label>
                  <input
                    type="text"
                    value={newCompTin}
                    onChange={(e) => setNewCompTin(e.target.value)}
                    placeholder="109283746"
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={newCompCity}
                    onChange={(e) => setNewCompCity(e.target.value)}
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Plan</label>
                  <select
                    value={newCompTier}
                    onChange={(e) => setNewCompTier(e.target.value as any)}
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="starter">Starter (35k)</option>
                    <option value="growth">Growth (75k)</option>
                    <option value="enterprise">Enterprise (150k)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Start status</label>
                  <select
                    value={newCompStatus}
                    onChange={(e) => setNewCompStatus(e.target.value as CompanyStatus)}
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Free trial (14d)</option>
                    <option value="Pending">Waiting approval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Company email</label>
                  <input
                    type="email"
                    value={newCompEmail}
                    onChange={(e) => setNewCompEmail(e.target.value)}
                    placeholder="ops@company.rw"
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Company phone</label>
                  <input
                    type="text"
                    value={newCompPhone}
                    onChange={(e) => setNewCompPhone(e.target.value)}
                    className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">Company owner login</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Owner name"
                    className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                    required
                  />
                  <input
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="owner@company.rw"
                    className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                  />
                  <input
                    type="text"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    placeholder="+250 788..."
                    className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold accent-bg">
                  Add company
                </button>
              </div>
            </form>
          </div>
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
