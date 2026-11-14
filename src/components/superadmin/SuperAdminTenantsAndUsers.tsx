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
  ShieldAlert,
  Users,
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
import { ReasonActionModal, getStatusStyles } from './SuperAdminShared';

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
  // Companies state
  const [compSearch, setCompSearch] = useState('');
  const [compStatusFilter, setCompStatusFilter] = useState<'all' | CompanyStatus>('all');
  const [compTierFilter, setCompTierFilter] = useState<'all' | 'starter' | 'growth' | 'enterprise'>('all');
  const [dossierCompany, setDossierCompany] = useState<Company | null>(null);
  const [dossierTab, setDossierTab] = useState<'profile' | 'users' | 'fleet' | 'bookings' | 'billing' | 'audit'>('profile');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add company form
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

  // Users state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Shared reason modal
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search global users by name, email, or phone..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="accountant">Accountant</option>
              <option value="fleet_manager">Fleet Manager</option>
              <option value="mechanic">Mechanic</option>
              <option value="driver">Driver</option>
              <option value="receptionist">Receptionist</option>
              <option value="superadmin">Platform Owner</option>
            </select>

            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Invited">Invited</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">User Account</th>
                  <th className="px-4 py-3">Tenant Company</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Last Login / Security</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-slate-800 dark:text-slate-200">
                {filteredUsers.map((u) => {
                  const comp = companies.find((c) => c.id === u.company_id);
                  const isMasterOwner = isSuperAdminEmail(u.email) || u.role === 'superadmin';
                  const st = u.status || 'Active';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {isMasterOwner ? 'KigaliFleet Platform Root' : comp?.name || u.company_id}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">{u.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono text-[10px] capitalize">
                          {isMasterOwner ? 'platform_owner' : u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        <div>{u.last_login ? u.last_login.slice(0, 16).replace('T', ' ') : 'Active session'}</div>
                        {u.sessions_revoked_at && (
                          <div className="text-amber-500 text-[10px]">
                            Revoked {u.sessions_revoked_at.slice(0, 10)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getStatusStyles(st)}`}>
                          {st}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold whitespace-nowrap"
                          >
                            Inspect
                          </button>
                          {!isMasterOwner && canSuspendUsers && (
                            <button
                              onClick={() =>
                                setPendingAction({
                                  title: st === 'Suspended' ? `Reactivate ${u.name}` : `Suspend ${u.name}`,
                                  description: `${u.email} · ${comp?.name || u.company_id}`,
                                  confirmLabel: st === 'Suspended' ? 'Reactivate User' : 'Suspend User',
                                  danger: st !== 'Suspended',
                                  execute: (reason) =>
                                    onUpdateUserStatus(u.id, st === 'Suspended' ? 'Active' : 'Suspended', reason),
                                })
                              }
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap border ${
                                st === 'Suspended'
                                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                  : 'border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                              }`}
                            >
                              {st === 'Suspended' ? 'Reactivate' : 'Suspend'}
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
        </div>

        {/* User Detail Drawer Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                  <p className="text-xs font-mono text-slate-500">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Assigned Role</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 capitalize">
                    {selectedUser.role}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Account Status</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedUser.status || 'Active'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Telephone</div>
                  <div className="font-mono text-slate-900 dark:text-white mt-0.5">{selectedUser.phone}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Recovery History</div>
                  <div className="font-mono text-slate-900 dark:text-white mt-0.5">
                    {selectedUser.recovery_requested_at
                      ? selectedUser.recovery_requested_at.slice(0, 10)
                      : 'None'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  Security Policy: Superadmins cannot view or set user passwords. Only out-of-band account recovery and
                  session revocation are permitted.
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    onTriggerUserRecovery(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Send Recovery Link</span>
                </button>
                <button
                  onClick={() => {
                    const target = selectedUser;
                    setSelectedUser(null);
                    setPendingAction({
                      title: `Revoke Active Sessions for ${target.name}`,
                      description: `Forces immediate token invalidation for ${target.email}.`,
                      confirmLabel: 'Force Revoke Sessions',
                      danger: true,
                      execute: (reason) => onRevokeUserSessions(target.id, reason),
                    });
                  }}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Force Revoke Sessions
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
      {/* Search, Filters & Onboard CTA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={compSearch}
            onChange={(e) => setCompSearch(e.target.value)}
            placeholder="Search company name, RRA TIN, city, or owner..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={compStatusFilter}
            onChange={(e) => setCompStatusFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none"
          >
            <option value="all">All Statuses ({companies.length})</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st} ({companies.filter((c) => (c.status || 'Active') === st).length})
              </option>
            ))}
          </select>

          <select
            value={compTierFilter}
            onChange={(e) => setCompTierFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none"
          >
            <option value="all">All Plans</option>
            <option value="enterprise">Enterprise</option>
            <option value="growth">Growth</option>
            <option value="starter">Starter</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Company</span>
          </button>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Company & TIN</th>
                <th className="px-4 py-3">Owner & City</th>
                <th className="px-4 py-3">Plan & Usage</th>
                <th className="px-4 py-3 text-right">Monthly Fee</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-slate-800 dark:text-slate-200">
              {filteredCompanies.map((comp) => {
                const status = comp.status || 'Active';
                const isPending = status === 'Pending' || status === 'Pending Verification';
                const isCurrent = comp.id === currentCompany.id;
                const fee =
                  comp.monthly_fee_rwf ??
                  (comp.tier_id === 'enterprise' ? 150000 : comp.tier_id === 'growth' ? 75000 : 35000);

                return (
                  <tr key={comp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{comp.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Active Context
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        TIN: {comp.tin_number} · {comp.business_type}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {comp.owner_name || 'Managing Director'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{comp.city}</span>
                        <span>·</span>
                        <span className="font-mono">{comp.phone}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold uppercase text-[11px]">{comp.tier_id}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        {comp.vehicle_count || 0} cars · {comp.branches_count || 1} branch(es)
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {fee.toLocaleString()} RWF
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {comp.renewal_date ? `Renews ${comp.renewal_date}` : 'Trial / Pending'}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getStatusStyles(status)}`}>
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setDossierCompany(comp);
                            setDossierTab('profile');
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Dossier</span>
                        </button>

                        {isPending && canApproveCompanies && (
                          <button
                            onClick={() =>
                              setPendingAction({
                                title: `Approve Company Registration: ${comp.name}`,
                                description: `TIN ${comp.tin_number} will be activated for tenant operations.`,
                                confirmLabel: 'Approve & Activate',
                                execute: (reason) => onUpdateCompanyStatus(comp.id, 'Active', reason),
                              })
                            }
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onSwitchCompanyContext(comp.id, `Switched context from Superadmin Companies Directory`);
                            onNavigateToTenantDashboard?.();
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" style={{ color: currentTheme.hex }} />
                          <span>Switch</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Full Dossier Drawer/Modal */}
      {dossierCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-4xl w-full p-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{dossierCompany.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getStatusStyles(
                      dossierCompany.status || 'Active'
                    )}`}
                  >
                    {dossierCompany.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  ID: {dossierCompany.id} · TIN: {dossierCompany.tin_number} · {dossierCompany.city}
                </p>
              </div>
              <button
                onClick={() => setDossierCompany(null)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 py-2 overflow-x-auto">
              {(
                [
                  { id: 'profile', label: 'Profile & Controls' },
                  { id: 'users', label: `Company Users (${dossierUsers.length})` },
                  { id: 'fleet', label: `Fleet Snapshot` },
                  { id: 'bookings', label: `Recent Bookings` },
                  { id: 'billing', label: `SaaS Billing (${dossierPayments.length})` },
                  { id: 'audit', label: `Audit History (${dossierAudits.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDossierTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    dossierTab === tab.id
                      ? 'bg-slate-900 text-white dark:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {dossierTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">Primary Owner</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {dossierCompany.owner_name || 'Managing Director'}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{dossierCompany.email}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">Subscription Plan</div>
                      <div className="font-bold text-slate-900 dark:text-white uppercase mt-0.5">
                        {dossierCompany.tier_id}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {(dossierCompany.monthly_fee_rwf || 0).toLocaleString()} RWF / month
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">Assigned Support Admin</div>
                      <div className="font-mono text-slate-900 dark:text-white mt-0.5">
                        {dossierCompany.assigned_support_admin || 'support.lead@kigalifleet.rw'}
                      </div>
                    </div>
                  </div>

                  {dossierCompany.suspension_reason && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300">
                      <strong>Last Administrative Reason:</strong> {dossierCompany.suspension_reason}
                    </div>
                  )}

                  {canSuspendCompanies && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        Lifecycle State Transitions (Reason Logged)
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
                                  confirmLabel: `Confirm ${targetStatus}`,
                                  danger: targetStatus === 'Suspended' || targetStatus === 'Closed',
                                  execute: (reason) => {
                                    onUpdateCompanyStatus(dossierCompany.id, targetStatus, reason);
                                    setDossierCompany({ ...dossierCompany, status: targetStatus, suspension_reason: reason });
                                  },
                                })
                              }
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 font-semibold whitespace-nowrap"
                            >
                              {targetStatus}
                            </button>
                          )
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                        <span className="text-slate-500">Change Plan Tier:</span>
                        {(['starter', 'growth', 'enterprise'] as const).map((tier) => (
                          <button
                            key={tier}
                            onClick={() =>
                              setPendingAction({
                                title: `Change ${dossierCompany.name} Plan to ${tier.toUpperCase()}`,
                                description: `Updates tenant quota and monthly SaaS billing rate.`,
                                confirmLabel: `Switch to ${tier.toUpperCase()}`,
                                execute: (reason) => {
                                  onUpdateCompanyPlan(dossierCompany.id, tier, reason);
                                  setDossierCompany({ ...dossierCompany, tier_id: tier });
                                },
                              })
                            }
                            className={`px-3 py-1 rounded-md font-mono uppercase text-[11px] font-bold border ${
                              dossierCompany.tier_id === tier
                                ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
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
                    <p className="text-slate-500">No individual staff accounts linked yet for this tenant.</p>
                  ) : (
                    dossierUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                          <div className="font-mono text-[11px] text-slate-500">{u.email} · {u.phone}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] capitalize">
                          {u.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierTab === 'fleet' && (
                <div className="space-y-2">
                  <p className="text-slate-500">
                    Showing allocated live vehicles ({vehicles.length} vehicles in active database stream):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vehicles.slice(0, 6).map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{v.model_name}</div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {v.plate_number} · {v.daily_rate_rwf.toLocaleString()} RWF/d
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded border text-[10px] ${getStatusStyles(v.status)}`}>
                          {v.status}
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
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {b.client_name} · {b.destination}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {b.start_date} → {b.end_date} · {b.total_rwf.toLocaleString()} RWF
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${getStatusStyles(b.status)}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {dossierTab === 'billing' && (
                <div className="space-y-3">
                  {dossierSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{sub.plan_name} Subscription</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          Renews {sub.renewal_date} · {sub.monthly_fee_rwf.toLocaleString()} RWF/mo
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${getStatusStyles(sub.status)}`}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                  {dossierPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {p.transaction_ref} · {p.amount_rwf.toLocaleString()} RWF
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.method} ({p.provider_ref}) · {p.created_at}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${getStatusStyles(p.status)}`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {dossierTab === 'audit' && (
                <div className="space-y-2">
                  {dossierAudits.length === 0 ? (
                    <p className="text-slate-500">No direct platform audit changes recorded for this company ID yet.</p>
                  ) : (
                    dossierAudits.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{a.action}</span>
                          <span className="font-mono text-[10px] text-slate-500">{a.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
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

      {/* Modal: Onboard New Tenant Company */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" style={{ color: currentTheme.hex }} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Onboard Transport Operator Company
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="e.g. Nyungwe Canopy Tours Ltd"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Type</label>
                  <select
                    value={newCompType}
                    onChange={(e) => setNewCompType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Car Rental">Car Rental</option>
                    <option value="Tour Operator">Tour Operator</option>
                    <option value="Airport Shuttle">Airport Shuttle</option>
                    <option value="Corporate Transport">Corporate Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">RRA TIN</label>
                  <input
                    type="text"
                    value={newCompTin}
                    onChange={(e) => setNewCompTin(e.target.value)}
                    placeholder="109283746"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 font-mono text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={newCompCity}
                    onChange={(e) => setNewCompCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan Tier</label>
                  <select
                    value={newCompTier}
                    onChange={(e) => setNewCompTier(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="starter">Starter (35k)</option>
                    <option value="growth">Growth (75k)</option>
                    <option value="enterprise">Enterprise (150k)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={newCompStatus}
                    onChange={(e) => setNewCompStatus(e.target.value as CompanyStatus)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial (14d)</option>
                    <option value="Pending">Pending Approval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Email</label>
                  <input
                    type="email"
                    value={newCompEmail}
                    onChange={(e) => setNewCompEmail(e.target.value)}
                    placeholder="ops@company.rw"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Phone</label>
                  <input
                    type="text"
                    value={newCompPhone}
                    onChange={(e) => setNewCompPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 font-mono text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500">Company Owner Account</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Owner Name"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
                    required
                  />
                  <input
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="owner@company.rw"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    placeholder="+250 788..."
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Onboard Tenant
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
