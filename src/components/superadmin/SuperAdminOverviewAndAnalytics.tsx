import React, { useMemo } from 'react';
import {
  Building2,
  Users,
  Car,
  ClipboardList,
  CreditCard,
  AlertTriangle,
  LifeBuoy,
  ArrowRight,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import {
  Booking,
  Company,
  CompanySubscription,
  PlatformAuditLog,
  PlatformPlan,
  SaasPaymentRecord,
  SecurityIncident,
  SuperAdminModuleId,
  SupportTicket,
  User,
  Vehicle,
} from '../../types';
import { ColorTheme } from '../../theme';
import { getStatusStyles } from './SuperAdminShared';

interface SuperAdminOverviewAndAnalyticsProps {
  mode: 'overview' | 'analytics';
  companies: Company[];
  users: User[];
  vehicles: Vehicle[];
  bookings: Booking[];
  subscriptions: CompanySubscription[];
  saasPayments: SaasPaymentRecord[];
  plans: PlatformPlan[];
  supportTickets: SupportTicket[];
  securityIncidents: SecurityIncident[];
  auditLogs: PlatformAuditLog[];
  currentTheme: ColorTheme;
  onNavigateModule: (mod: SuperAdminModuleId) => void;
}

export const SuperAdminOverviewAndAnalytics: React.FC<SuperAdminOverviewAndAnalyticsProps> = ({
  mode,
  companies,
  users,
  vehicles,
  bookings,
  subscriptions,
  saasPayments,
  plans,
  supportTickets,
  securityIncidents,
  auditLogs,
  currentTheme,
  onNavigateModule,
}) => {
  const metrics = useMemo(() => {
    const activeCompanies = companies.filter((c) => c.status === 'Active').length;
    const pendingCompanies = companies.filter(
      (c) => c.status === 'Pending' || c.status === 'Pending Verification'
    );
    const trialCompanies = companies.filter((c) => c.status === 'Trial').length;
    const graceCompanies = companies.filter((c) => c.status === 'Grace Period').length;
    const suspendedCompanies = companies.filter(
      (c) => c.status === 'Suspended' || c.status === 'Restricted'
    ).length;

    const totalFleetCount = Math.max(
      vehicles.length,
      companies.reduce((sum, c) => sum + (c.vehicle_count || 0), 0)
    );

    const openTickets = supportTickets.filter(
      (t) => t.status !== 'Resolved' && t.status !== 'Closed'
    );
    const escalatedTickets = openTickets.filter((t) => t.status === 'Escalated' || t.escalated);

    const verifiedCollectedRwf = saasPayments
      .filter((p) => p.status === 'Successful' || p.status === 'Partially Refunded')
      .reduce((sum, p) => sum + (p.amount_rwf - (p.refunded_amount_rwf || 0)), 0);

    const failedPayments = saasPayments.filter((p) => p.status === 'Failed');
    const pendingPayments = saasPayments.filter((p) => p.status === 'Pending');
    const pastDueSubs = subscriptions.filter((s) => s.status === 'Past Due' || s.status === 'Suspended');
    const openIncidents = securityIncidents.filter((i) => i.status !== 'Resolved');

    const theoreticalMrrRwf = subscriptions
      .filter((s) => s.status === 'Active')
      .reduce((sum, s) => sum + s.monthly_fee_rwf, 0);

    const planDist = plans
      .filter((p) => p.is_active)
      .map((plan) => {
        const count = subscriptions.filter(
          (s) => s.plan_id === plan.id || s.plan_name.toLowerCase() === plan.name.toLowerCase()
        ).length;
        return { name: plan.name, count, tierKey: plan.tier_key };
      });

    const monthlyMap: Record<string, { collected: number; failed: number }> = {};
    saasPayments.forEach((p) => {
      const month = (p.created_at || p.paid_at || '2026-11').slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { collected: 0, failed: 0 };
      if (p.status === 'Successful' || p.status === 'Partially Refunded') {
        monthlyMap[month].collected += p.amount_rwf - (p.refunded_amount_rwf || 0);
      } else if (p.status === 'Failed') {
        monthlyMap[month].failed += p.amount_rwf;
      }
    });
    const monthlySeries = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({ month, ...vals }));

    const cityCounts: Record<string, number> = {};
    companies.forEach((c) => {
      const city = c.city || 'Kigali';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
    const citySeries = Object.entries(cityCounts).sort(([, a], [, b]) => b - a);

    const paidCompanies = subscriptions.filter((s) => s.status === 'Active').length;
    const conversionDenominator = Math.max(1, paidCompanies + trialCompanies);
    const trialToPaidPct = Math.round((paidCompanies / conversionDenominator) * 100);
    const churnedCount = subscriptions.filter(
      (s) => s.status === 'Cancelled' || s.status === 'Expired' || s.status === 'Suspended'
    ).length;
    const churnPct = companies.length ? Math.round((churnedCount / companies.length) * 100) : 0;

    return {
      activeCompanies,
      pendingCompanies,
      trialCompanies,
      graceCompanies,
      suspendedCompanies,
      totalFleetCount,
      openTickets,
      escalatedTickets,
      verifiedCollectedRwf,
      failedPayments,
      pendingPayments,
      pastDueSubs,
      openIncidents,
      theoreticalMrrRwf,
      planDist,
      monthlySeries,
      citySeries,
      trialToPaidPct,
      churnPct,
    };
  }, [companies, vehicles, supportTickets, saasPayments, subscriptions, securityIncidents, plans]);

  const maxMonthlyVal = Math.max(
    1,
    ...metrics.monthlySeries.map((m) => Math.max(m.collected, m.failed))
  );

  if (mode === 'analytics') {
    const activeUsersCount = users.filter((u) => (u.status || 'Active') === 'Active').length;
    const completedBookings = bookings.filter((b) => b.status === 'Completed').length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">
              Trials Turned Paid
            </span>
            <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
              {metrics.trialToPaidPct}%
            </div>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
              {metrics.activeCompanies} paid · {metrics.trialCompanies} free trial
            </p>
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">
              Companies That Left
            </span>
            <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
              {metrics.churnPct}%
            </div>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
              {metrics.suspendedCompanies} paused or stopped
            </p>
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">
              Active Users
            </span>
            <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
              {activeUsersCount}
            </div>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
              Across {companies.length} companies
            </p>
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">
              Finished Trips
            </span>
            <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
              {bookings.length ? Math.round((completedBookings / bookings.length) * 100) : 0}%
            </div>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
              {bookings.length} total trips recorded
            </p>
          </div>
        </div>

        {/* How Companies Start & Cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                How Companies Start
              </h3>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-4 text-sm">
              {[
                { label: 'All Joined Companies', value: companies.length, pct: 100, color: '#38bdf8' },
                {
                  label: 'Active & Free Trial',
                  value: metrics.activeCompanies + metrics.trialCompanies,
                  pct: Math.round(
                    ((metrics.activeCompanies + metrics.trialCompanies) / Math.max(1, companies.length)) * 100
                  ),
                  color: '#10b981',
                },
                {
                  label: 'Paying Every Month',
                  value: metrics.activeCompanies,
                  pct: Math.round((metrics.activeCompanies / Math.max(1, companies.length)) * 100),
                  color: currentTheme.hex,
                },
                {
                  label: 'Waiting / Extra Time / Paused',
                  value: metrics.pendingCompanies.length + metrics.graceCompanies + metrics.suspendedCompanies,
                  pct: Math.round(
                    ((metrics.pendingCompanies.length + metrics.graceCompanies + metrics.suspendedCompanies) /
                      Math.max(1, companies.length)) *
                      100
                  ),
                  color: '#f43f5e',
                },
              ].map((stage) => (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#425466] dark:text-slate-300 font-medium">{stage.label}</span>
                    <span className="font-mono tabular-nums font-bold text-[#0a2540] dark:text-white">
                      {stage.value} ({stage.pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max(4, stage.pct)}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                Companies by City in Rwanda
              </h3>
              <MapPin className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-4 text-sm">
              {metrics.citySeries.map(([city, count]) => {
                const pct = Math.round((count / Math.max(1, companies.length)) * 100);
                return (
                  <div key={city} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0a2540] dark:text-slate-200">{city}</span>
                      <span className="font-mono tabular-nums text-[#425466] dark:text-slate-400">
                        {count} {count === 1 ? 'company' : 'companies'} · {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(8, pct)}%`, backgroundColor: currentTheme.hex }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-sm text-[#425466] dark:text-slate-400">Driver SMS</div>
                <div className="font-mono font-bold text-[#0a2540] dark:text-white mt-0.5">100% Used</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-sm text-[#425466] dark:text-slate-400">MoMo Pay</div>
                <div className="font-mono font-bold text-[#0a2540] dark:text-white mt-0.5">78% Used</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-sm text-[#425466] dark:text-slate-400">Tax Receipts</div>
                <div className="font-mono font-bold text-[#0a2540] dark:text-white mt-0.5">67% Used</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // OVERVIEW DASHBOARD (Module 1)
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <button
          onClick={() => onNavigateModule('companies')}
          className="stripe-card text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-[#425466] dark:text-slate-400">
            <span className="text-sm font-semibold">Companies</span>
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
            {companies.length}
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">
            {metrics.activeCompanies} active · {metrics.pendingCompanies.length} waiting
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('users')}
          className="stripe-card text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-[#425466] dark:text-slate-400">
            <span className="text-sm font-semibold">All People</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
            {users.length}
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">
            Owners, staff & drivers
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('fleet')}
          className="stripe-card text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-[#425466] dark:text-slate-400">
            <span className="text-sm font-semibold">All Cars</span>
            <Car className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
            {metrics.totalFleetCount}
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">
            In {companies.length} companies
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('bookings')}
          className="stripe-card text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-[#425466] dark:text-slate-400">
            <span className="text-sm font-semibold">Bookings</span>
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
            {bookings.length}
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">
            All trips across site
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('revenue')}
          className="stripe-card text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-[#425466] dark:text-slate-400">
            <span className="text-sm font-semibold">Money Paid</span>
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-2">
            {metrics.verifiedCollectedRwf.toLocaleString()} <span className="text-sm font-normal">RWF</span>
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1 font-mono tabular-nums">
            Monthly: {metrics.theoreticalMrrRwf.toLocaleString()} RWF
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('support')}
          className="stripe-card text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-[#425466] dark:text-slate-400">
            <span className="text-sm font-semibold">Help Requests</span>
            <LifeBuoy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-2">
            {metrics.openTickets.length}
          </div>
          <div className="text-sm text-rose-500 mt-1">
            {metrics.escalatedTickets.length} urgent · {metrics.openIncidents.length} alerts
          </div>
        </button>
      </div>

      {/* Main Split: Money Chart vs Needs Attention Now */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Money Collected vs Failed */}
        <div className="lg:col-span-2 stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                Money Collected vs. Failed Payments
              </h3>
              <p className="text-sm text-[#425466] dark:text-slate-400">
                Counted only from confirmed payment records (RWF)
              </p>
            </div>
            <button
              onClick={() => onNavigateModule('saas_payments')}
              className="text-sm font-semibold flex items-center gap-1.5 hover:underline whitespace-nowrap"
              style={{ color: currentTheme.hex }}
            >
              <span>See All Payments</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {metrics.monthlySeries.map((row) => (
              <div key={row.month} className="space-y-1.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono tabular-nums">
                  <span className="font-semibold text-[#0a2540] dark:text-slate-300">{row.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Paid: {row.collected.toLocaleString()} RWF
                    </span>
                    {row.failed > 0 && (
                      <span className="text-rose-500">Failed: {row.failed.toLocaleString()} RWF</span>
                    )}
                  </div>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.round((row.collected / maxMonthlyVal) * 100)}%` }}
                  />
                  {row.failed > 0 && (
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${Math.round((row.failed / maxMonthlyVal) * 100)}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.planDist.map((item) => (
              <div
                key={item.name}
                className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                <div className="text-sm text-[#425466] dark:text-slate-400 truncate">{item.name}</div>
                <div className="text-xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-1">
                  {item.count} <span className="text-sm font-normal text-slate-400">companies</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Needs Attention Now */}
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Needs Attention Now</h3>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3 text-sm">
            <button
              onClick={() => onNavigateModule('companies')}
              className="w-full p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-[#0a2540] dark:text-white">Companies Waiting</div>
                <div className="text-sm text-[#425466] dark:text-slate-400">
                  New companies waiting for approval
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full font-mono font-bold text-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {metrics.pendingCompanies.length}
              </span>
            </button>

            <button
              onClick={() => onNavigateModule('saas_payments')}
              className="w-full p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-[#0a2540] dark:text-white">Failed & Waiting Payments</div>
                <div className="text-sm text-[#425466] dark:text-slate-400">
                  MoMo or bank payments to check
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full font-mono font-bold text-sm bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {metrics.failedPayments.length + metrics.pendingPayments.length}
              </span>
            </button>

            <button
              onClick={() => onNavigateModule('subscriptions')}
              className="w-full p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-[#0a2540] dark:text-white">Late & Paused Companies</div>
                <div className="text-sm text-[#425466] dark:text-slate-400">
                  Plans that need more time or renewal
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full font-mono font-bold text-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {metrics.pastDueSubs.length}
              </span>
            </button>

            <button
              onClick={() => onNavigateModule('security')}
              className="w-full p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-[#0a2540] dark:text-white">Safety Alerts</div>
                <div className="text-sm text-[#425466] dark:text-slate-400">
                  Wrong logins & blocked tries
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full font-mono font-bold text-sm bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {metrics.openIncidents.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Changes */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Recent Changes</h3>
          <button
            onClick={() => onNavigateModule('audit')}
            className="text-sm font-semibold flex items-center gap-1.5 hover:underline"
            style={{ color: currentTheme.hex }}
          >
            <span>See All Changes ({auditLogs.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#0a2540] dark:text-white">{log.action}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-medium text-[#425466] dark:text-slate-300 truncate">
                    {log.affected_entity_label}
                  </span>
                </div>
                <p className="text-sm text-[#425466] dark:text-slate-400 truncate mt-0.5">
                  By {log.actor_name} ({log.actor_email}) — {log.reason}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full border text-sm font-mono ${getStatusStyles('Published')}`}>
                  {log.correlation_id}
                </span>
                <span className="text-sm font-mono tabular-nums text-[#425466] dark:text-slate-400">
                  {log.timestamp.slice(0, 16).replace('T', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
