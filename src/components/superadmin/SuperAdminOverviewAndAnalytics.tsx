import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Car,
  ClipboardList,
  DollarSign,
  LifeBuoy,
  MapPin,
  TrendingUp,
  Users,
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
import { useI18n } from '../../utils/i18n';
import { formatHumanDateTime } from '../../utils/dates';

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
  const { currency, formatMoney, tr } = useI18n();
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
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Trials turned paid')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
              {metrics.trialToPaidPct}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {metrics.activeCompanies} {tr('paid')} · {metrics.trialCompanies} {tr('free trial')}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Companies that left')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
              {metrics.churnPct}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {metrics.suspendedCompanies} {tr('paused or stopped')}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Active users')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
              {activeUsersCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tr('Across')} {companies.length} {tr('companies')}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Finished trips')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
              {bookings.length ? Math.round((completedBookings / bookings.length) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {bookings.length} {tr('total trips recorded')}
            </div>
          </div>
        </div>

        {/* How Companies Start & Cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {tr('How companies start')}
              </h3>
              <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>

            <div className="space-y-3.5 text-sm">
              {[
                { label: 'All joined companies', value: companies.length, pct: 100, color: '#2563eb' },
                {
                  label: 'Active & free trial',
                  value: metrics.activeCompanies + metrics.trialCompanies,
                  pct: Math.round(
                    ((metrics.activeCompanies + metrics.trialCompanies) / Math.max(1, companies.length)) * 100
                  ),
                  color: '#059669',
                },
                {
                  label: 'Paying every month',
                  value: metrics.activeCompanies,
                  pct: Math.round((metrics.activeCompanies / Math.max(1, companies.length)) * 100),
                  color: currentTheme.hex,
                },
                {
                  label: 'Waiting / extra time / paused',
                  value: metrics.pendingCompanies.length + metrics.graceCompanies + metrics.suspendedCompanies,
                  pct: Math.round(
                    ((metrics.pendingCompanies.length + metrics.graceCompanies + metrics.suspendedCompanies) /
                      Math.max(1, companies.length)) *
                      100
                  ),
                  color: '#e11d48',
                },
              ].map((stage) => (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300">{stage.label}</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {stage.value} ({stage.pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(4, stage.pct)}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Companies by city in Rwanda
              </h3>
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>

            <div className="space-y-3.5 text-sm">
              {metrics.citySeries.map(([city, count]) => {
                const pct = Math.round((count / Math.max(1, companies.length)) * 100);
                return (
                  <div key={city} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{city}</span>
                      <span className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
                        {count} {count === 1 ? 'company' : 'companies'} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full accent-bg"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center text-sm">
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500 dark:text-slate-400">Driver SMS</div>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">100% used</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500 dark:text-slate-400">MoMo Pay</div>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">78% used</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500 dark:text-slate-400">Tax receipts</div>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">67% used</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // OVERVIEW DASHBOARD (Module 1)
  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <button
          onClick={() => onNavigateModule('companies')}
          className="text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Companies')}</span>
            <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
            {companies.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {metrics.activeCompanies} {tr('active')} · {metrics.pendingCompanies.length} {tr('waiting')}
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('users')}
          className="text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('All people')}</span>
            <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
            {users.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {tr('Owners, staff & drivers')}
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('fleet')}
          className="text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('All cars')}</span>
            <Car className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
            {metrics.totalFleetCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {tr('In')} {companies.length} {tr('companies')}
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('bookings')}
          className="text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Bookings')}</span>
            <ClipboardList className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
            {bookings.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {tr('All trips across site')}
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('revenue')}
          className="text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Money paid')}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1.5 truncate">
            {formatMoney(metrics.verifiedCollectedRwf)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums truncate">
            {tr('Monthly')}: {formatMoney(metrics.theoreticalMrrRwf)}
          </div>
        </button>

        <button
          onClick={() => onNavigateModule('support')}
          className="text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Help requests')}</span>
            <LifeBuoy className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
            {metrics.openTickets.length}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
            {metrics.escalatedTickets.length} {tr('urgent')} · {metrics.openIncidents.length} {tr('alerts')}
          </div>
        </button>
      </div>

      {/* Main Split: Money Chart vs Needs Attention Now */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns: Money Collected vs Failed */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {tr('Money collected vs. failed payments')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {tr('Counted only from confirmed payment records')} ({currency})
              </p>
            </div>
            <button
              onClick={() => onNavigateModule('saas_payments')}
              className="text-sm font-semibold accent-text flex items-center gap-1 hover:underline whitespace-nowrap"
            >
              <span>{tr('See all payments')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5">
            {metrics.monthlySeries.map((row) => (
              <div key={row.month} className="space-y-1.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{row.month}</span>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {tr('Paid')}: {formatMoney(row.collected)}
                    </span>
                    {row.failed > 0 && (
                      <span className="text-rose-600 dark:text-rose-400">
                        {tr('Failed')}: {formatMoney(row.failed)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400"
                    style={{ width: `${Math.round((row.collected / maxMonthlyVal) * 100)}%` }}
                  />
                  {row.failed > 0 && (
                    <div
                      className="h-full bg-rose-500 dark:bg-rose-400"
                      style={{ width: `${Math.round((row.failed / maxMonthlyVal) * 100)}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.planDist.map((item) => (
              <div
                key={item.name}
                className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40"
              >
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{item.name}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                  {item.count} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">companies</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Needs Attention Now */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Needs attention now</h3>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-2 text-sm">
            <button
              onClick={() => onNavigateModule('companies')}
              className="w-full p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Companies waiting</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  New companies waiting for approval
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md font-mono font-semibold text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 tabular-nums">
                {metrics.pendingCompanies.length}
              </span>
            </button>

            <button
              onClick={() => onNavigateModule('saas_payments')}
              className="w-full p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Failed & waiting payments</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  MoMo or bank payments to check
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md font-mono font-semibold text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 tabular-nums">
                {metrics.failedPayments.length + metrics.pendingPayments.length}
              </span>
            </button>

            <button
              onClick={() => onNavigateModule('subscriptions')}
              className="w-full p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Late & paused companies</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Plans that need more time or renewal
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md font-mono font-semibold text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 tabular-nums">
                {metrics.pastDueSubs.length}
              </span>
            </button>

            <button
              onClick={() => onNavigateModule('security')}
              className="w-full p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Safety alerts</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Wrong logins & blocked tries
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md font-mono font-semibold text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 tabular-nums">
                {metrics.openIncidents.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Changes */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent changes</h3>
          <button
            onClick={() => onNavigateModule('audit')}
            className="text-sm font-semibold accent-text flex items-center gap-1 hover:underline"
          >
            <span>See all changes ({auditLogs.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{log.action}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600 dark:text-slate-300 truncate">
                    {log.affected_entity_label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  By {log.actor_name} ({log.actor_email}) — {log.reason}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-md border text-xs font-mono ${getStatusStyles('Published')}`}>
                  {log.correlation_id}
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {formatHumanDateTime(log.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
