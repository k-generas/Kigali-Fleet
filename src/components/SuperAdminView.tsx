import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Layers,
  ArrowUpRight,
  Server,
  Radio,
  FileText,
  Phone,
  Mail,
  MapPin,
  X,
  Power,
  RefreshCw,
  Globe,
  Lock,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Company, CompanyStatus, SubscriptionTier, User } from '../types';
import { ColorTheme } from '../theme';

interface SuperAdminViewProps {
  companies: Company[];
  currentCompany: Company;
  tiers: SubscriptionTier[];
  currentUser: User;
  currentTheme: ColorTheme;
  onUpdateCompanyStatus: (companyId: string, status: CompanyStatus) => void;
  onUpdateCompanyPlan: (companyId: string, tierId: 'starter' | 'growth' | 'enterprise') => void;
  onSwitchCompanyContext: (companyId: string) => void;
  onAddTenantCompany: (
    companyData: Omit<Company, 'id' | 'created_at'>,
    ownerName: string,
    ownerEmail: string,
    ownerPhone: string
  ) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  companies,
  currentCompany,
  tiers,
  currentUser,
  currentTheme,
  onUpdateCompanyStatus,
  onUpdateCompanyPlan,
  onSwitchCompanyContext,
  onAddTenantCompany,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'subscriptions' | 'infrastructure' | 'audit'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CompanyStatus>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'starter' | 'growth' | 'enterprise'>('all');
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [selectedCompanyForDossier, setSelectedCompanyForDossier] = useState<Company | null>(null);
  const [changingPlanCompany, setChangingPlanCompany] = useState<Company | null>(null);
  const [newPlanSelected, setNewPlanSelected] = useState<'starter' | 'growth' | 'enterprise'>('growth');

  // New Company Form State
  const [newCompName, setNewCompName] = useState('');
  const [newCompType, setNewCompType] = useState<Company['business_type']>('Car Rental');
  const [newCompTin, setNewCompTin] = useState('');
  const [newCompPhone, setNewCompPhone] = useState('+250 788 ');
  const [newCompEmail, setNewCompEmail] = useState('');
  const [newCompCity, setNewCompCity] = useState('Kigali');
  const [newCompTier, setNewCompTier] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('+250 788 ');

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tin_number.includes(searchQuery) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.owner_name && c.owner_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesTier = tierFilter === 'all' || c.tier_id === tierFilter;

      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [companies, searchQuery, statusFilter, tierFilter]);

  // Aggregate SaaS Platform Metrics
  const platformStats = useMemo(() => {
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter((c) => c.status === 'Active').length;
    const gracePeriodCompanies = companies.filter((c) => c.status === 'Grace Period').length;
    const suspendedCompanies = companies.filter((c) => c.status === 'Suspended').length;

    // Monthly Recurring Revenue (MRR)
    const totalMRR = companies.reduce((sum, c) => {
      if (c.status === 'Suspended') return sum;
      const fee =
        c.monthly_fee_rwf ||
        (c.tier_id === 'enterprise' ? 150000 : c.tier_id === 'growth' ? 75000 : 35000);
      return sum + fee;
    }, 0);

    const totalFleetVehicles = companies.reduce((sum, c) => sum + (c.vehicle_count || 10), 0);

    return {
      totalCompanies,
      activeCompanies,
      gracePeriodCompanies,
      suspendedCompanies,
      totalMRR,
      annualRunRate: totalMRR * 12,
      totalFleetVehicles,
    };
  }, [companies]);

  // Handle Add New Tenant Company
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
        status: 'Active',
        renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        vehicle_count: 5,
        monthly_fee_rwf: newCompTier === 'enterprise' ? 150000 : newCompTier === 'growth' ? 75000 : 35000,
      },
      newOwnerName.trim() || 'Managing Director',
      newOwnerEmail.trim() || newCompEmail.trim(),
      newOwnerPhone.trim() || newCompPhone.trim()
    );

    setIsAddCompanyModalOpen(false);
    // Reset form
    setNewCompName('');
    setNewCompTin('');
    setNewCompEmail('');
    setNewOwnerName('');
    setNewOwnerEmail('');
  };

  // Handle Plan Change
  const handleChangePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingPlanCompany) return;
    onUpdateCompanyPlan(changingPlanCompany.id, newPlanSelected);
    setChangingPlanCompany(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Super Admin Master Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-slate-950 shadow-md"
            style={{ backgroundColor: currentTheme.hex }}
          >
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">KigaliFleet Super Admin Portal</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Multi-Tenant Cloud Control
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Platform-wide company directory, subscription revenue in RWF, fleet quotas, and tenant isolation management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Tenant Workspace</span>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[160px]">{currentCompany.name}</span>
            </div>
          </div>

          <button
            onClick={() => setIsAddCompanyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-950 transition-all active:scale-95 shadow-md"
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Onboard Tenant</span>
          </button>
        </div>
      </div>

      {/* 2. Platform KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Monthly SaaS Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Platform MRR (SaaS)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl lg:text-2xl font-black text-white tracking-tight font-mono">
              {platformStats.totalMRR.toLocaleString()} <span className="text-xs font-normal text-slate-400">RWF</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>ARR: {platformStats.annualRunRate.toLocaleString()} RWF</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Registered Companies */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tenant Operators</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl lg:text-2xl font-black text-white tracking-tight font-mono">
              {platformStats.activeCompanies} <span className="text-xs font-normal text-slate-400">/ {platformStats.totalCompanies} Active</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">{platformStats.activeCompanies} Active</span>
              <span>· {platformStats.gracePeriodCompanies} Grace</span>
              <span>· {platformStats.suspendedCompanies} Suspended</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Total Managed Fleet */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Managed Fleet</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl lg:text-2xl font-black text-white tracking-tight font-mono">
              {platformStats.totalFleetVehicles} <span className="text-xs font-normal text-slate-400">vehicles</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span>Across Rwanda safari & rental fleets</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Platform Cloud Uptime */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SaaS Infrastructure</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl lg:text-2xl font-black text-emerald-400 tracking-tight font-mono flex items-center gap-1.5">
              <span>99.98%</span>
              <span className="text-xs font-normal text-slate-400">Uptime</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span>Kigali Telecom & GCP Edge</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'companies'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'companies' ? { color: currentTheme.hex } : undefined}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenant Companies ({companies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'subscriptions' ? { color: currentTheme.hex } : undefined}
        >
          <CreditCard className="w-4 h-4" />
          <span>SaaS Subscriptions & Billing</span>
        </button>

        <button
          onClick={() => setActiveTab('infrastructure')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'infrastructure'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'infrastructure' ? { color: currentTheme.hex } : undefined}
        >
          <Radio className="w-4 h-4" />
          <span>API Gateways & Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'audit' ? { color: currentTheme.hex } : undefined}
        >
          <Activity className="w-4 h-4" />
          <span>Platform Audit Trail</span>
        </button>
      </div>

      {/* Sub-View 1: Tenant Companies Directory */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company name, TIN, city, or owner..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('Active')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    statusFilter === 'Active' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active ({companies.filter((c) => c.status === 'Active').length})
                </button>
                <button
                  onClick={() => setStatusFilter('Grace Period')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    statusFilter === 'Grace Period' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Grace Period ({companies.filter((c) => c.status === 'Grace Period').length})
                </button>
                <button
                  onClick={() => setStatusFilter('Suspended')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    statusFilter === 'Suspended' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Suspended ({companies.filter((c) => c.status === 'Suspended').length})
                </button>
              </div>

              {/* Tier Filter */}
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
              >
                <option value="all">All Plan Tiers</option>
                <option value="enterprise">Enterprise (150k)</option>
                <option value="growth">Growth (75k)</option>
                <option value="starter">Starter (35k)</option>
              </select>
            </div>
          </div>

          {/* Companies Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Transport Company</th>
                    <th className="px-4 py-3">TIN & Location</th>
                    <th className="px-4 py-3">Owner Contact</th>
                    <th className="px-4 py-3 text-center">Subscription Tier</th>
                    <th className="px-4 py-3 text-right">Monthly Fee</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredCompanies.map((comp) => {
                    const isCurrent = comp.id === currentCompany.id;
                    const fee =
                      comp.monthly_fee_rwf ||
                      (comp.tier_id === 'enterprise' ? 150000 : comp.tier_id === 'growth' ? 75000 : 35000);

                    return (
                      <tr key={comp.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Company Name & Slug */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{comp.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            slug: /{comp.slug} · Type: {comp.business_type}
                          </div>
                        </td>

                        {/* TIN & City */}
                        <td className="px-4 py-3">
                          <div className="font-mono text-slate-300">TIN: {comp.tin_number}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{comp.city}</span>
                          </div>
                        </td>

                        {/* Owner Contact */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">{comp.owner_name || 'Managing Director'}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{comp.phone}</div>
                        </td>

                        {/* Subscription Tier */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                              comp.tier_id === 'enterprise'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : comp.tier_id === 'growth'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {comp.tier_id}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {comp.vehicle_count || 10} cars allocated
                          </div>
                        </td>

                        {/* Monthly Fee */}
                        <td className="px-4 py-3 text-right">
                          <div className="font-mono font-bold text-white">{fee.toLocaleString()} RWF</div>
                          {comp.renewal_date && (
                            <div className="text-[10px] text-slate-500 font-mono">Renews: {comp.renewal_date}</div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              comp.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : comp.status === 'Grace Period'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {comp.status === 'Active' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                            <span>{comp.status || 'Active'}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Switch to this tenant workspace */}
                            <button
                              onClick={() => {
                                onSwitchCompanyContext(comp.id);
                                if (onNavigateToTab) onNavigateToTab('overview');
                              }}
                              className="px-2.5 py-1 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
                              title="Audit this company's fleet, drivers, and bookings"
                            >
                              <ExternalLink className="w-3 h-3 text-amber-400" />
                              <span>Switch</span>
                            </button>

                            {/* Plan button */}
                            <button
                              onClick={() => {
                                setChangingPlanCompany(comp);
                                setNewPlanSelected(comp.tier_id);
                              }}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Upgrade or change subscription tier"
                            >
                              Tier
                            </button>

                            {/* Suspend / Activate toggle */}
                            <button
                              onClick={() => {
                                const newStatus: CompanyStatus =
                                  comp.status === 'Suspended' ? 'Active' : 'Suspended';
                                onUpdateCompanyStatus(comp.id, newStatus);
                              }}
                              className={`p-1 rounded text-xs transition-colors ${
                                comp.status === 'Suspended'
                                  ? 'text-emerald-400 hover:bg-emerald-500/10'
                                  : 'text-rose-400 hover:bg-rose-500/10'
                              }`}
                              title={comp.status === 'Suspended' ? 'Re-activate Account' : 'Suspend Tenant Access'}
                            >
                              <Power className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Sub-View 2: SaaS Subscriptions & Billing */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => {
              const countInTier = companies.filter((c) => c.tier_id === tier.id).length;
              const subtotal = countInTier * tier.monthly_fee_rwf;

              return (
                <div key={tier.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-white capitalize">{tier.name} Plan</h3>
                      <p className="text-xs text-slate-400">{tier.target_fleet_size}</p>
                    </div>
                    <span className="text-xl font-black text-amber-400 font-mono">
                      {tier.monthly_fee_rwf.toLocaleString()} <span className="text-xs text-slate-400">RWF/mo</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Enrolled Tenants:</span>
                    <span className="font-bold text-white font-mono">{countInTier} companies</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Monthly Subtotal:</span>
                    <span className="font-bold text-emerald-400 font-mono">{subtotal.toLocaleString()} RWF</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Includes:</div>
                    {tier.features.slice(0, 4).map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Billing Channels Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">SaaS Tenant Billing & Automated Collections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>MTN Rwanda MoMo Merchant Collection</span>
                </div>
                <p className="text-slate-400">
                  Automated monthly USSD push reminders sent to registered company owners at 7 days before renewal.
                </p>
                <div className="font-mono text-amber-400 text-[11px]">Merchant Code: *182*8*1*049281#</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span>Rwanda Revenue Authority (RRA) EBM SaaS Invoices</span>
                </div>
                <p className="text-slate-400">
                  Every SaaS renewal generates an official SDC tax invoice with 18% VAT and delivers it to the company email.
                </p>
                <div className="font-mono text-blue-400 text-[11px]">RRA TIN: 109845231 (KigaliFleet Tech Ltd)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 3: API Gateways & Integrations */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Africa's Talking SMS Gateway</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Online (99.4%)
              </span>
            </div>
            <p className="text-slate-400">
              Dispatches zero-data SMS mission assignments to Rwandan chauffeurs on MTN Rwanda and Airtel networks.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1">
              <div>Sender ID: KIGALIFLEET</div>
              <div>USSD Code: *134# (Driver 2G Portal)</div>
              <div>Latency: 118ms (Kigali Switch)</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Rwanda Contrôle Technique Gateway</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>
            <p className="text-slate-400">
              Synchronizes official RNP automobile inspection certificates and Yellow Card COMESA insurance validity.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1">
              <div>Protocol: RNP Vehicle Registry API v2</div>
              <div>Auto-Lock: Immediate Grounding on Expiry</div>
              <div>Last Sync: Today at 04:00 AM CAT</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Kigali Int'l Airport (KIA) Radar</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Radar Active
              </span>
            </div>
            <p className="text-slate-400">
              Live flight telemetry for RwandAir, Qatar Airways, Ethiopian Airlines, and KLM landing at Kanombe Airport.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1">
              <div>Airport Code: HRYR / KGL</div>
              <div>Delay Threshold: +15 minutes alerts dispatcher</div>
              <div>Driver SMS Auto-Update: Enabled</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Firebase Cloud Firestore DB</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Real-Time Synchronized
              </span>
            </div>
            <p className="text-slate-400">
              Multi-tenant document storage with strict company isolation rules and instant multi-device event streaming.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1">
              <div>Database: ai-studio-remixkigalifleet</div>
              <div>Collections: /vehicles, /bookings, /maintenance</div>
              <div>Listener Status: 7 active stream subscriptions</div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 4: Global Platform Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Platform-Wide Tenant Activity Stream</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Akagera Wildlife Safaris</span>
                <span className="text-slate-400"> upgraded subscription to Enterprise Plan (20+ vehicles)</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Today 10:14</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Kigali Executive Fleet</span>
                <span className="text-slate-400"> grounded Mercedes-Benz RAE 550 L for CFAO garage inspection</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Today 08:30</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Lake Kivu & Rubavu Shuttles</span>
                <span className="text-slate-400"> renewed Starter subscription via MTN MoMo</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Yesterday 16:45</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Congo Nile Trail 4x4</span>
                <span className="text-rose-400"> subscription suspended due to overdue invoice</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Nov 01 09:00</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Onboard New Tenant Company */}
      {isAddCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Onboard New Transport Company</h3>
              </div>
              <button
                onClick={() => setIsAddCompanyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="e.g. Nyungwe Canopy Tours & Transfers Ltd"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Business Type</label>
                  <select
                    value={newCompType}
                    onChange={(e) => setNewCompType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                  >
                    <option value="Car Rental">Car Rental</option>
                    <option value="Tour Operator">Tour Operator</option>
                    <option value="Airport Shuttle">Airport Shuttle</option>
                    <option value="Corporate Transport">Corporate Transport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">RRA TIN Number</label>
                  <input
                    type="text"
                    value={newCompTin}
                    onChange={(e) => setNewCompTin(e.target.value)}
                    placeholder="9-digit TIN e.g. 109283746"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registered City</label>
                  <input
                    type="text"
                    value={newCompCity}
                    onChange={(e) => setNewCompCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subscription Plan</label>
                  <select
                    value={newCompTier}
                    onChange={(e) => setNewCompTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                  >
                    <option value="starter">Starter (35,000 RWF / 5 cars)</option>
                    <option value="growth">Growth (75,000 RWF / 20 cars)</option>
                    <option value="enterprise">Enterprise (150,000 RWF / Large)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="block text-slate-400 font-semibold uppercase text-[10px] mb-2">
                  Company Owner / Master Account
                </span>

                <div className="space-y-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Owner Full Name</label>
                    <input
                      type="text"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      placeholder="e.g. Jean-Baptiste Habimana"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Owner Email</label>
                      <input
                        type="email"
                        value={newOwnerEmail}
                        onChange={(e) => setNewOwnerEmail(e.target.value)}
                        placeholder="owner@company.rw"
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Owner Phone (MoMo)</label>
                      <input
                        type="text"
                        value={newOwnerPhone}
                        onChange={(e) => setNewOwnerPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold text-slate-950"
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Change Plan Tier */}
      {changingPlanCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Change Subscription Plan</h3>
              </div>
              <button
                onClick={() => setChangingPlanCompany(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="font-bold text-white">{changingPlanCompany.name}</div>
              <div className="text-slate-400 mt-0.5">Current Plan: <span className="text-amber-400 font-bold uppercase">{changingPlanCompany.tier_id}</span></div>
            </div>

            <form onSubmit={handleChangePlanSubmit} className="space-y-3 text-xs">
              <label className="block text-slate-300 font-semibold">Select New Plan Tier</label>
              <div className="space-y-2">
                {tiers.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      newPlanSelected === t.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="plan_tier"
                        checked={newPlanSelected === t.id}
                        onChange={() => setNewPlanSelected(t.id)}
                        className="accent-amber-500"
                      />
                      <div>
                        <div className="font-bold text-white capitalize">{t.name} Plan</div>
                        <div className="text-[10px] text-slate-400">{t.target_fleet_size}</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-400">
                      {t.monthly_fee_rwf.toLocaleString()} RWF
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setChangingPlanCompany(null)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold text-slate-950"
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Update Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
