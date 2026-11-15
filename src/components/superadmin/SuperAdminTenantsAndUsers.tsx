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
      <div className="space-y-5">
        {/* Filters */}
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search people by name, email, or phone..."
              className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-100 text-sm rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-300 text-sm rounded-xl px-3 py-2.5 outline-none"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="accountant">Accountant</option>
              <option value="fleet_manager">Car Manager</option>
              <option value="mechanic">Mechanic</option>
              <option value="driver">Driver</option>
              <option value="receptionist">Front Desk</option>
              <option value="superadmin">Main Owner</option>
            </select>

            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-300 text-sm rounded-xl px-3 py-2.5 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Invited">Invited</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Users Grid */}
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-[#425466] dark:text-slate-400 font-semibold">
            <div className="col-span-3">Person</div>
            <div className="col-span-3">Company</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Last Sign In</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm text-[#0a2540] dark:text-slate-200">
            {filteredUsers.map((u) => {
              const comp = companies.find((c) => c.id === u.company_id);
              const isMasterOwner = isSuperAdminEmail(u.email) || u.role === 'superadmin';
              const st = u.status || 'Active';

              return (
                <div
                  key={u.id}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40"
                >
                  <div className="lg:col-span-3 min-w-0">
                    <div className="font-semibold text-[#0a2540] dark:text-white truncate">{u.name}</div>
                    <div className="text-xs font-mono text-[#425466] dark:text-slate-400 truncate">{u.email}</div>
                  </div>
                  <div className="lg:col-span-3 min-w-0">
                    <div className="text-[#0a2540] dark:text-slate-300 font-medium truncate">
                      {isMasterOwner ? 'Main Platform' : comp?.name || u.company_id}
                    </div>
                    <div className="text-xs font-mono text-[#425466] dark:text-slate-400 whitespace-nowrap">{u.phone}</div>
                  </div>
                  <div className="lg:col-span-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-[#f6f9fc] dark:bg-slate-800 font-mono text-xs capitalize whitespace-nowrap">
                      {isMasterOwner ? 'Main Owner' : u.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="lg:col-span-2 font-mono text-xs text-[#425466] dark:text-slate-400">
                    <div className="whitespace-nowrap">{u.last_login ? u.last_login.slice(0, 16).replace('T', ' ') : 'Signed in now'}</div>
                    {u.sessions_revoked_at && (
                      <div className="text-amber-600 dark:text-amber-400 text-xs whitespace-nowrap">
                        Signed out {u.sessions_revoked_at.slice(0, 10)}
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-1 lg:text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${getStatusStyles(st)}`}>
                      {st}
                    </span>
                  </div>
                  <div className="lg:col-span-1 flex items-center lg:justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold whitespace-nowrap"
                    >
                      View
                    </button>
                    {!isMasterOwner && canSuspendUsers && (
                      <button
                        onClick={() =>
                          setPendingAction({
                            title: st === 'Suspended' ? `Turn Account On for ${u.name}` : `Pause Account for ${u.name}`,
                            description: `${u.email} · ${comp?.name || u.company_id}`,
                            confirmLabel: st === 'Suspended' ? 'Turn On' : 'Pause Account',
                            danger: st !== 'Suspended',
                            execute: (reason) =>
                              onUpdateUserStatus(u.id, st === 'Suspended' ? 'Active' : 'Suspended', reason),
                          })
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${
                          st === 'Suspended'
                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                            : 'border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                        }`}
                      >
                        {st === 'Suspended' ? 'Turn On' : 'Pause'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Detail Drawer Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">{selectedUser.name}</h3>
                  <p className="text-sm font-mono text-[#425466] dark:text-slate-400">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-sm text-[#425466] dark:text-slate-400">Role</div>
                  <div className="font-mono font-bold text-[#0a2540] dark:text-white mt-0.5 capitalize">
                    {selectedUser.role.replace('_', ' ')}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-sm text-[#425466] dark:text-slate-400">Status</div>
                  <div className="font-semibold text-[#0a2540] dark:text-white mt-0.5">
                    {selectedUser.status || 'Active'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-sm text-[#425466] dark:text-slate-400">Phone</div>
                  <div className="font-mono text-[#0a2540] dark:text-white mt-0.5">{selectedUser.phone}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-sm text-[#425466] dark:text-slate-400">Password Help Sent</div>
                  <div className="font-mono text-[#0a2540] dark:text-white mt-0.5">
                    {selectedUser.recovery_requested_at
                      ? selectedUser.recovery_requested_at.slice(0, 10)
                      : 'Never'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                <Lock className="w-5 h-5 shrink-0" />
                <span>
                  For safety, nobody can see or change another person&apos;s password. You can only send a reset link or sign them out.
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    onTriggerUserRecovery(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Send Reset Link</span>
                </button>
                <button
                  onClick={() => {
                    const target = selectedUser;
                    setSelectedUser(null);
                    setPendingAction({
                      title: `Log Out ${target.name} Everywhere`,
                      description: `Signs out ${target.email} from all phones and computers right now.`,
                      confirmLabel: 'Log Out Everywhere',
                      danger: true,
                      execute: (reason) => onRevokeUserSessions(target.id, reason),
                    });
                  }}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Log Out Everywhere
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
    <div className="space-y-5">
      {/* Search, Filters & Add Company CTA */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={compSearch}
            onChange={(e) => setCompSearch(e.target.value)}
            placeholder="Search company, tax number, city, or owner..."
            className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-100 text-sm rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={compStatusFilter}
            onChange={(e) => setCompStatusFilter(e.target.value as any)}
            className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-300 text-sm rounded-xl px-3 py-2.5 outline-none"
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
            className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-300 text-sm rounded-xl px-3 py-2.5 outline-none"
          >
            <option value="all">All Plans</option>
            <option value="enterprise">Enterprise</option>
            <option value="growth">Growth</option>
            <option value="starter">Starter</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-[#425466] dark:text-slate-400 font-semibold">
          <div className="col-span-3">Company & Tax ID</div>
          <div className="col-span-3">Owner & City</div>
          <div className="col-span-2">Plan & Cars</div>
          <div className="col-span-1 text-right">Price/mo</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm text-[#0a2540] dark:text-slate-200">
          {filteredCompanies.map((comp) => {
            const status = comp.status || 'Active';
            const isPending = status === 'Pending' || status === 'Pending Verification';
            const isCurrent = comp.id === currentCompany.id;
            const fee =
              comp.monthly_fee_rwf ??
              (comp.tier_id === 'enterprise' ? 150000 : comp.tier_id === 'growth' ? 75000 : 35000);

            return (
              <div
                key={comp.id}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40"
              >
                <div className="lg:col-span-3 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#0a2540] dark:text-white truncate">{comp.name}</span>
                    {isCurrent && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        Open Now
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#425466] dark:text-slate-400 mt-0.5 truncate">
                    TIN: {comp.tin_number} · {comp.business_type}
                  </div>
                </div>

                <div className="lg:col-span-3 min-w-0">
                  <div className="font-medium text-[#0a2540] dark:text-slate-200 truncate">
                    {comp.owner_name || 'Company Owner'}
                  </div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 flex items-center gap-1 mt-0.5 flex-wrap">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{comp.city}</span>
                    <span>·</span>
                    <span className="font-mono whitespace-nowrap">{comp.phone}</span>
                  </div>
                </div>

                <div className="lg:col-span-2 min-w-0">
                  <div className="font-mono font-semibold uppercase text-xs">{comp.tier_id}</div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 tabular-nums">
                    {comp.vehicle_count || 0} cars · {comp.branches_count || 1} office(s)
                  </div>
                </div>

                <div className="lg:col-span-1 lg:text-right font-mono tabular-nums">
                  <div className="font-bold text-[#0a2540] dark:text-white whitespace-nowrap text-xs">
                    {fee.toLocaleString()} RWF
                  </div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 whitespace-nowrap">
                    {comp.renewal_date ? comp.renewal_date : 'Trial'}
                  </div>
                </div>

                <div className="lg:col-span-1 lg:text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${getStatusStyles(status)}`}>
                    {status}
                  </span>
                </div>

                <div className="lg:col-span-2 flex items-center lg:justify-end gap-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      setDossierCompany(comp);
                      setDossierTab('profile');
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>

                  {isPending && canApproveCompanies && (
                    <button
                      onClick={() =>
                        setPendingAction({
                          title: `Approve Company: ${comp.name}`,
                          description: `TIN ${comp.tin_number} will be turned on so they can use the system.`,
                          confirmLabel: 'Approve Now',
                          execute: (reason) => onUpdateCompanyStatus(comp.id, 'Active', reason),
                        })
                      }
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap flex items-center gap-1"
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
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: currentTheme.hex }} />
                    <span>View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Company Full Info Modal */}
      {dossierCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">{dossierCompany.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(
                      dossierCompany.status || 'Active'
                    )}`}
                  >
                    {dossierCompany.status || 'Active'}
                  </span>
                </div>
                <p className="text-sm font-mono text-[#425466] dark:text-slate-400 mt-1">
                  ID: {dossierCompany.id} · TIN: {dossierCompany.tin_number} · {dossierCompany.city}
                </p>
              </div>
              <button
                onClick={() => setDossierCompany(null)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 border-b border-slate-200 dark:border-slate-800 py-3">
              {(
                [
                  { id: 'profile', label: 'Details & Controls' },
                  { id: 'users', label: `People (${dossierUsers.length})` },
                  { id: 'fleet', label: `Cars` },
                  { id: 'bookings', label: `Recent Trips` },
                  { id: 'billing', label: `Payments (${dossierPayments.length})` },
                  { id: 'audit', label: `Change History (${dossierAudits.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDossierTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    dossierTab === tab.id
                      ? 'bg-[#0a2540] text-white dark:bg-slate-800'
                      : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm">
              {dossierTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-sm text-[#425466] dark:text-slate-400">Company Owner</div>
                      <div className="font-bold text-[#0a2540] dark:text-white mt-0.5">
                        {dossierCompany.owner_name || 'Owner'}
                      </div>
                      <div className="font-mono text-sm text-[#425466] dark:text-slate-400">{dossierCompany.email}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-sm text-[#425466] dark:text-slate-400">Plan</div>
                      <div className="font-bold text-[#0a2540] dark:text-white uppercase mt-0.5">
                        {dossierCompany.tier_id}
                      </div>
                      <div className="font-mono text-sm text-[#425466] dark:text-slate-400">
                        {(dossierCompany.monthly_fee_rwf || 0).toLocaleString()} RWF / month
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-sm text-[#425466] dark:text-slate-400">Support Person</div>
                      <div className="font-mono text-[#0a2540] dark:text-white mt-0.5 break-all">
                        {dossierCompany.assigned_support_admin || 'support.lead@kigalifleet.rw'}
                      </div>
                    </div>
                  </div>

                  {dossierCompany.suspension_reason && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                      <strong>Last Reason Saved:</strong> {dossierCompany.suspension_reason}
                    </div>
                  )}

                  {canSuspendCompanies && (
                    <div className="p-5 rounded-2xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="font-bold text-[#0a2540] dark:text-white">
                        Change Company Status (Reason Saved)
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
                              className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 font-semibold whitespace-nowrap"
                            >
                              {targetStatus}
                            </button>
                          )
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                        <span className="text-[#425466] dark:text-slate-400 font-medium">Change Plan:</span>
                        {(['starter', 'growth', 'enterprise'] as const).map((tier) => (
                          <button
                            key={tier}
                            onClick={() =>
                              setPendingAction({
                                title: `Change ${dossierCompany.name} Plan to ${tier.toUpperCase()}`,
                                description: `Updates how many cars they can add and their monthly price.`,
                                confirmLabel: `Switch to ${tier.toUpperCase()}`,
                                execute: (reason) => {
                                  onUpdateCompanyPlan(dossierCompany.id, tier, reason);
                                  setDossierCompany({ ...dossierCompany, tier_id: tier });
                                },
                              })
                            }
                            className={`px-3.5 py-1.5 rounded-full font-mono uppercase text-sm font-bold border ${
                              dossierCompany.tier_id === tier
                                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                : 'border-slate-200 dark:border-slate-700 text-[#425466] dark:text-slate-300'
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
                <div className="space-y-2.5">
                  {dossierUsers.length === 0 ? (
                    <p className="text-[#425466] dark:text-slate-400">No staff accounts added for this company yet.</p>
                  ) : (
                    dossierUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#0a2540] dark:text-white">{u.name}</div>
                          <div className="font-mono text-sm text-[#425466] dark:text-slate-400">{u.email} · {u.phone}</div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-mono text-sm capitalize">
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierTab === 'fleet' && (
                <div className="space-y-3">
                  <p className="text-[#425466] dark:text-slate-400">
                    Showing cars in the system ({vehicles.length} total):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {vehicles.slice(0, 6).map((v) => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#0a2540] dark:text-white">{v.model_name}</div>
                          <div className="font-mono text-sm text-[#425466] dark:text-slate-400">
                            {v.plate_number} · {v.daily_rate_rwf.toLocaleString()} RWF/day
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full border text-sm ${getStatusStyles(v.status)}`}>
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dossierTab === 'bookings' && (
                <div className="space-y-2.5">
                  {bookings.slice(0, 6).map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#0a2540] dark:text-white">
                          {b.client_name} · {b.destination}
                        </div>
                        <div className="font-mono text-sm text-[#425466] dark:text-slate-400">
                          {b.start_date} → {b.end_date} · {b.total_rwf.toLocaleString()} RWF
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full border text-sm ${getStatusStyles(b.status)}`}>
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
                      className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#0a2540] dark:text-white">{sub.plan_name} Plan</div>
                        <div className="font-mono text-sm text-[#425466] dark:text-slate-400">
                          Renews {sub.renewal_date} · {sub.monthly_fee_rwf.toLocaleString()} RWF/month
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full border text-sm ${getStatusStyles(sub.status)}`}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                  {dossierPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-[#0a2540] dark:text-white">
                          {p.transaction_ref} · {p.amount_rwf.toLocaleString()} RWF
                        </div>
                        <div className="text-sm text-[#425466] dark:text-slate-400">
                          {p.method} ({p.provider_ref}) · {p.created_at}
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full border text-sm ${getStatusStyles(p.status)}`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {dossierTab === 'audit' && (
                <div className="space-y-2.5">
                  {dossierAudits.length === 0 ? (
                    <p className="text-[#425466] dark:text-slate-400">No changes saved for this company yet.</p>
                  ) : (
                    dossierAudits.map((a) => (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0a2540] dark:text-white">{a.action}</span>
                          <span className="font-mono text-sm text-[#425466] dark:text-slate-400">{a.timestamp}</span>
                        </div>
                        <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" style={{ color: currentTheme.hex }} />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  Add New Company
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="e.g. Nyungwe Canopy Tours Ltd"
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">Type of Work</label>
                  <select
                    value={newCompType}
                    onChange={(e) => setNewCompType(e.target.value as any)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="Car Rental">Car Rental</option>
                    <option value="Tour Operator">Tour Operator</option>
                    <option value="Airport Shuttle">Airport Shuttle</option>
                    <option value="Corporate Transport">Company Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">Tax Number (TIN)</label>
                  <input
                    type="text"
                    value={newCompTin}
                    onChange={(e) => setNewCompTin(e.target.value)}
                    placeholder="109283746"
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-[#0a2540] dark:text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={newCompCity}
                    onChange={(e) => setNewCompCity(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">Plan</label>
                  <select
                    value={newCompTier}
                    onChange={(e) => setNewCompTier(e.target.value as any)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="starter">Starter (35k)</option>
                    <option value="growth">Growth (75k)</option>
                    <option value="enterprise">Enterprise (150k)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">Start Status</label>
                  <select
                    value={newCompStatus}
                    onChange={(e) => setNewCompStatus(e.target.value as CompanyStatus)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Free Trial (14d)</option>
                    <option value="Pending">Waiting Approval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">Company Email</label>
                  <input
                    type="email"
                    value={newCompEmail}
                    onChange={(e) => setNewCompEmail(e.target.value)}
                    placeholder="ops@company.rw"
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">Company Phone</label>
                  <input
                    type="text"
                    value={newCompPhone}
                    onChange={(e) => setNewCompPhone(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-[#0a2540] dark:text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="text-sm font-bold text-[#0a2540] dark:text-slate-300 block">Company Owner Login</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Owner Name"
                    className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-[#0a2540] dark:text-white outline-none"
                    required
                  />
                  <input
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="owner@company.rw"
                    className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-[#0a2540] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    placeholder="+250 788..."
                    className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Add Company
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
