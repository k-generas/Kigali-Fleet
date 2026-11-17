import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  Download,
  Edit3,
  Plus,
  Search,
} from 'lucide-react';
import { ModalShell } from '../ModalShell';
import {
  Company,
  CompanySubscription,
  CompanySubscriptionStatus,
  PlatformPlan,
  SaasPaymentRecord,
  SaasPaymentStatus,
} from '../../types';
import { ColorTheme } from '../../theme';
import { ReasonActionModal, exportToCsv, getStatusDotColor, getStatusStyles } from './SuperAdminShared';
import { useI18n } from '../../utils/i18n';
import { formatHumanDate } from '../../utils/dates';

interface SuperAdminBillingAndPlansProps {
  mode: 'subscriptions' | 'plans' | 'saas_payments' | 'revenue';
  companies: Company[];
  subscriptions: CompanySubscription[];
  plans: PlatformPlan[];
  saasPayments: SaasPaymentRecord[];
  currentTheme: ColorTheme;
  canEditBilling: boolean;
  onExtendSubscription: (subscriptionId: string, newRenewalDate: string, reason: string) => void;
  onGrantTrial: (companyId: string, trialDays: number, reason: string) => void;
  onUpdateCompanyPlan: (companyId: string, tierId: 'starter' | 'growth' | 'enterprise', reason?: string) => void;
  onSavePlan: (plan: PlatformPlan, reason: string) => void;
  onReconcilePayment: (paymentId: string, nextStatus: SaasPaymentStatus, notes: string) => void;
  onRefundPayment: (paymentId: string, refundAmountRwf: number, reason: string) => void;
}

export const SuperAdminBillingAndPlans: React.FC<SuperAdminBillingAndPlansProps> = ({
  mode,
  companies,
  subscriptions,
  plans,
  saasPayments,
  currentTheme,
  canEditBilling,
  onExtendSubscription,
  onGrantTrial,
  onUpdateCompanyPlan,
  onSavePlan,
  onReconcilePayment,
  onRefundPayment,
}) => {
  const { currency, formatMoney, tr } = useI18n();
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | CompanySubscriptionStatus>('all');
  const [extendTarget, setExtendTarget] = useState<CompanySubscription | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  const [trialTarget, setTrialTarget] = useState<CompanySubscription | null>(null);
  const [trialDays, setTrialDays] = useState(14);
  const [trialReason, setTrialReason] = useState('');

  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);
  const [planFeaturesText, setPlanFeaturesText] = useState('');
  const [planReason, setPlanReason] = useState('');

  const [paySearch, setPaySearch] = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState<'all' | SaasPaymentStatus>('all');
  const [reconcileTarget, setReconcileTarget] = useState<SaasPaymentRecord | null>(null);
  const [reconcileStatus, setReconcileStatus] = useState<SaasPaymentStatus>('Successful');
  const [reconcileNotes, setReconcileNotes] = useState('');

  const [refundTarget, setRefundTarget] = useState<SaasPaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    execute: (reason: string) => void;
  } | null>(null);

  const filteredSubs = useMemo(() => {
    return subscriptions.filter((s) => subStatusFilter === 'all' || s.status === subStatusFilter);
  }, [subscriptions, subStatusFilter]);

  const filteredPayments = useMemo(() => {
    const q = paySearch.trim().toLowerCase();
    return saasPayments.filter((p) => {
      const matchesQ =
        !q ||
        p.transaction_ref.toLowerCase().includes(q) ||
        p.provider_ref.toLowerCase().includes(q) ||
        p.company_name.toLowerCase().includes(q);
      const matchesStatus = payStatusFilter === 'all' || p.status === payStatusFilter;
      return matchesQ && matchesStatus;
    });
  }, [saasPayments, paySearch, payStatusFilter]);

  const revenueSummary = useMemo(() => {
    const invoicedTotal = saasPayments.reduce((s, p) => s + p.amount_rwf, 0);
    const collectedGross = saasPayments
      .filter((p) => p.status === 'Successful' || p.status === 'Partially Refunded')
      .reduce((s, p) => s + p.amount_rwf, 0);
    const refundedTotal = saasPayments.reduce((s, p) => s + (p.refunded_amount_rwf || 0), 0);
    const netCollected = collectedGross - refundedTotal;
    const outstandingTotal = saasPayments
      .filter((p) => p.status === 'Pending')
      .reduce((s, p) => s + p.amount_rwf, 0);
    const failedTotal = saasPayments
      .filter((p) => p.status === 'Failed')
      .reduce((s, p) => s + p.amount_rwf, 0);

    const activeSubs = subscriptions.filter((s) => s.status === 'Active');
    const activeMrr = activeSubs.reduce((s, sub) => s + sub.monthly_fee_rwf, 0);
    const arr = activeMrr * 12;
    const arpu = activeSubs.length ? Math.round(activeMrr / activeSubs.length) : 0;

    const byPlan: Record<string, number> = {};
    saasPayments
      .filter((p) => p.status === 'Successful' || p.status === 'Partially Refunded')
      .forEach((p) => {
        byPlan[p.plan_name] = (byPlan[p.plan_name] || 0) + (p.amount_rwf - (p.refunded_amount_rwf || 0));
      });

    const byMethod: Record<string, number> = {};
    saasPayments
      .filter((p) => p.status === 'Successful' || p.status === 'Partially Refunded')
      .forEach((p) => {
        byMethod[p.method] = (byMethod[p.method] || 0) + (p.amount_rwf - (p.refunded_amount_rwf || 0));
      });

    return {
      invoicedTotal,
      netCollected,
      refundedTotal,
      outstandingTotal,
      failedTotal,
      activeMrr,
      arr,
      arpu,
      byPlan: Object.entries(byPlan),
      byMethod: Object.entries(byMethod),
    };
  }, [saasPayments, subscriptions]);

  // -------------------------------------------------------------------------
  // MODULE 4: COMPANY PLANS
  // -------------------------------------------------------------------------
  if (mode === 'subscriptions') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {tr('Company plans')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tr('Change renewal dates, give free trial days, or upgrade a company plan. Every change saves a reason.')}
            </p>
          </div>
          <select
            value={subStatusFilter}
            onChange={(e) => setSubStatusFilter(e.target.value as any)}
            className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
          >
            <option value="all">{tr('All plans')} ({subscriptions.length})</option>
            {(['Active', 'Trial', 'Past Due', 'Suspended', 'Cancelled', 'Expired'] as CompanySubscriptionStatus[]).map(
              (st) => (
                <option key={st} value={st}>
                  {tr(st)}
                </option>
              )
            )}
          </select>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">{tr('Company')}</th>
                <th className="py-3 px-4">{tr('Plan')}</th>
                <th className="py-3 px-4 text-right">{tr('Monthly price')}</th>
                <th className="py-3 px-4">{tr('Next date / trial')}</th>
                <th className="py-3 px-4">{tr('Status')}</th>
                <th className="py-3 px-4 text-right">{tr('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-900 dark:text-slate-100">
              {filteredSubs.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold">{sub.company_name}</div>
                    {sub.last_adjustment_reason && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        Note: {sub.last_adjustment_reason}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{sub.plan_name}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap">
                    {formatMoney(sub.monthly_fee_rwf)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-xs">
                    <div className="whitespace-nowrap">{tr('Renews')}: {formatHumanDate(sub.renewal_date)}</div>
                    {sub.trial_end_date && (
                      <div className="text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {tr('Free ends')}: {formatHumanDate(sub.trial_end_date)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
                      <span className={`w-2 h-2 rounded-full ${getStatusDotColor(sub.status)}`} />
                      <span>{tr(sub.status)}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canEditBilling && (
                      <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                        <button
                          onClick={() => {
                            setExtendTarget(sub);
                            setNewRenewalDate(sub.renewal_date);
                            setExtendReason('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                        >
                          {tr('More time')}
                        </button>
                        <button
                          onClick={() => {
                            setTrialTarget(sub);
                            setTrialDays(14);
                            setTrialReason('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 whitespace-nowrap"
                        >
                          {tr('Free days')}
                        </button>
                        <select
                          value=""
                          onChange={(e) => {
                            const nextTier = e.target.value as 'starter' | 'growth' | 'enterprise';
                            if (!nextTier) return;
                            setPendingAction({
                              title: `Change ${sub.company_name} plan to ${nextTier}`,
                              description: `Current plan: ${sub.plan_name}`,
                              confirmLabel: `Set ${nextTier}`,
                              execute: (reason) => onUpdateCompanyPlan(sub.company_id, nextTier, reason),
                            });
                          }}
                          className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                        >
                          <option value="">{tr('Change plan...')}</option>
                          <option value="starter">Starter ({formatMoney(35000)})</option>
                          <option value="growth">Growth ({formatMoney(75000)})</option>
                          <option value="enterprise">Enterprise ({formatMoney(150000)})</option>
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* More Time Modal */}
        {extendTarget && (
          <ModalShell
            isOpen={!!extendTarget}
            onClose={() => setExtendTarget(null)}
            maxWidthClass="max-w-md"
            asForm
            onSubmit={(e) => {
              e.preventDefault();
              if (!newRenewalDate || extendReason.trim().length < 4) return;
              onExtendSubscription(extendTarget.id, newRenewalDate, extendReason.trim());
              setExtendTarget(null);
            }}
            icon={<CalendarClock className="w-4 h-4 accent-text" />}
            title={`Give more time: ${extendTarget.company_name}`}
            footer={
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExtendTarget(null)}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold accent-bg cursor-pointer">
                  Save new date
                </button>
              </div>
            }
          >
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                New renewal date
              </label>
              <input
                type="date"
                value={newRenewalDate}
                onChange={(e) => setNewRenewalDate(e.target.value)}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for change</label>
              <textarea
                rows={2}
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                placeholder="e.g. Bank transfer slip received, waiting to clear."
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </ModalShell>
        )}

        {/* Free Days Modal */}
        {trialTarget && (
          <ModalShell
            isOpen={!!trialTarget}
            onClose={() => setTrialTarget(null)}
            maxWidthClass="max-w-md"
            asForm
            onSubmit={(e) => {
              e.preventDefault();
              if (trialReason.trim().length < 4) return;
              onGrantTrial(trialTarget.company_id, trialDays, trialReason.trim());
              setTrialTarget(null);
            }}
            title={`Give free days: ${trialTarget.company_name}`}
            footer={
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTrialTarget(null)}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold accent-bg cursor-pointer">
                  Give {trialDays} free days
                </button>
              </div>
            }
          >
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Number of free days</label>
              <input
                type="number"
                min={1}
                max={90}
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for change</label>
              <textarea
                rows={2}
                value={trialReason}
                onChange={(e) => setTrialReason(e.target.value)}
                placeholder="e.g. Giving extra free days while they add their cars."
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </ModalShell>
        )}

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

  // -------------------------------------------------------------------------
  // MODULE 5: PLANS & PRICING
  // -------------------------------------------------------------------------
  if (mode === 'plans') {
    const openCreatePlan = () => {
      setEditingPlan({
        id: `plan-custom-${Date.now().toString().slice(-4)}`,
        tier_key: 'growth',
        name: '',
        target_fleet_size: '',
        monthly_fee_rwf: 95000,
        annual_fee_rwf: 950000,
        billing_period: 'Monthly',
        trial_days: 14,
        max_vehicles: 30,
        max_employees: 25,
        max_branches: 5,
        max_monthly_bookings: 1000,
        is_public: true,
        is_active: true,
        features: ['Many offices', 'MTN MoMo & Tax Receipts'],
        updated_at: new Date().toISOString().slice(0, 10),
      });
      setPlanFeaturesText('Many offices\nMTN MoMo & Tax Receipts');
      setPlanReason('');
    };

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {tr('Prices & plans')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tr('Changes to Starter, Growth, and Enterprise update on the pricing page right away.')}
            </p>
          </div>
          {canEditBilling && (
            <button
              onClick={openCreatePlan}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap accent-bg"
            >
              <Plus className="w-4 h-4" />
              <span>{tr('Add plan')}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const count = companies.filter((c) => c.tier_id === plan.tier_key).length;
            return (
              <div key={plan.id} className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{plan.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {plan.target_fleet_size}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles(
                        plan.is_active ? 'Active' : 'Inactive'
                      )}`}
                    >
                      {plan.is_active ? tr('Active') : tr('Hidden')}
                    </span>
                  </div>

                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {formatMoney(plan.monthly_fee_rwf)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/mo</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {tr('Yearly')}: {formatMoney(plan.annual_fee_rwf)} · {plan.trial_days} {tr('free days')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm font-mono tabular-nums">
                    <div className="p-2.5 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Cars</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{plan.max_vehicles}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Staff</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{plan.max_employees}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Offices</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{plan.max_branches}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Trips/mo</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{plan.max_monthly_bookings}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                    {plan.features.slice(0, 4).map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">{count} companies</span>
                  {canEditBilling && (
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanFeaturesText(plan.features.join('\n'));
                        setPlanReason('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit limits</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Plan Editor Modal */}
        {editingPlan && (
          <ModalShell
            isOpen={!!editingPlan}
            onClose={() => setEditingPlan(null)}
            maxWidthClass="max-w-lg"
            asForm
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingPlan.name.trim() || planReason.trim().length < 4) return;
              onSavePlan(
                {
                  ...editingPlan,
                  features: planFeaturesText
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean),
                },
                planReason.trim()
              );
              setEditingPlan(null);
            }}
            title="Edit plan prices & limits"
            footer={
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold accent-bg cursor-pointer">
                  Save plan
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Plan name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Plan level</label>
                <select
                  value={editingPlan.tier_key}
                  onChange={(e) => setEditingPlan({ ...editingPlan, tier_key: e.target.value as any })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100"
                >
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Monthly (RWF)</label>
                <input
                  type="number"
                  value={editingPlan.monthly_fee_rwf}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, monthly_fee_rwf: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                  required
                />
                {currency === 'USD' && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                    ≈ {formatMoney(editingPlan.monthly_fee_rwf)}
                  </span>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Yearly (RWF)</label>
                <input
                  type="number"
                  value={editingPlan.annual_fee_rwf}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, annual_fee_rwf: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                  required
                />
                {currency === 'USD' && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                    ≈ {formatMoney(editingPlan.annual_fee_rwf)}
                  </span>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Free days</label>
                <input
                  type="number"
                  value={editingPlan.trial_days}
                  onChange={(e) => setEditingPlan({ ...editingPlan, trial_days: Number(e.target.value) })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Max cars</label>
                <input
                  type="number"
                  value={editingPlan.max_vehicles}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_vehicles: Number(e.target.value) })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Max staff</label>
                <input
                  type="number"
                  value={editingPlan.max_employees}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_employees: Number(e.target.value) })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Offices</label>
                <input
                  type="number"
                  value={editingPlan.max_branches}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_branches: Number(e.target.value) })}
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Trips/mo</label>
                <input
                  type="number"
                  value={editingPlan.max_monthly_bookings}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, max_monthly_bookings: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">What is included (one per line)</label>
              <textarea
                rows={3}
                value={planFeaturesText}
                onChange={(e) => setPlanFeaturesText(e.target.value)}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPlan.is_public}
                  onChange={(e) => setEditingPlan({ ...editingPlan, is_public: e.target.checked })}
                />
                <span>Show on public page</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPlan.is_active}
                  onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                />
                <span>Open for new companies</span>
              </label>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Reason for change</label>
              <input
                type="text"
                value={planReason}
                onChange={(e) => setPlanReason(e.target.value)}
                placeholder="e.g. Updated prices for new year."
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                required
              />
            </div>
          </ModalShell>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 6: COMPANY PAYMENTS LEDGER
  // -------------------------------------------------------------------------
  if (mode === 'saas_payments') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={paySearch}
              onChange={(e) => setPaySearch(e.target.value)}
              placeholder="Search receipt code, MoMo code, or company..."
              className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg pl-9 pr-3 py-2 outline-none"
            />
          </div>
          <select
            value={payStatusFilter}
            onChange={(e) => setPayStatusFilter(e.target.value as any)}
            className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
          >
            <option value="all">All payments ({saasPayments.length})</option>
            {(['Successful', 'Pending', 'Failed', 'Refunded', 'Partially Refunded', 'Cancelled'] as SaasPaymentStatus[]).map(
              (st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              )
            )}
          </select>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Payment code</th>
                <th className="py-3 px-4">Company & plan</th>
                <th className="py-3 px-4">How paid</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-900 dark:text-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-semibold text-xs">{p.transaction_ref}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.provider_ref}</div>
                    {p.ebm_invoice_ref && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">{p.ebm_invoice_ref}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold">{p.company_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {p.plan_name} · {formatHumanDate(p.created_at)}
                    </div>
                    {p.failure_reason && <div className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{p.failure_reason}</div>}
                    {p.reconciliation_notes && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Note: {p.reconciliation_notes}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div>{p.method}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.provider}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                    <div className="whitespace-nowrap">{formatMoney(p.amount_rwf)}</div>
                    {p.refunded_amount_rwf && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        -{formatMoney(p.refunded_amount_rwf)} {tr('sent back')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
                      <span className={`w-2 h-2 rounded-full ${getStatusDotColor(p.status)}`} />
                      <span>{tr(p.status)}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canEditBilling && (
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {(p.status === 'Pending' || p.status === 'Failed') && (
                          <button
                            onClick={() => {
                              setReconcileTarget(p);
                              setReconcileStatus('Successful');
                              setReconcileNotes('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                          >
                            Confirm paid
                          </button>
                        )}
                        {(p.status === 'Successful' || p.status === 'Partially Refunded') && (
                          <button
                            onClick={() => {
                              setRefundTarget(p);
                              setRefundAmount(p.amount_rwf - (p.refunded_amount_rwf || 0));
                              setRefundReason('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Confirm Paid Modal */}
        {reconcileTarget && (
          <ModalShell
            isOpen={!!reconcileTarget}
            onClose={() => setReconcileTarget(null)}
            maxWidthClass="max-w-md"
            asForm
            onSubmit={(e) => {
              e.preventDefault();
              if (reconcileNotes.trim().length < 5) return;
              onReconcilePayment(reconcileTarget.id, reconcileStatus, reconcileNotes.trim());
              setReconcileTarget(null);
            }}
            title={`Check payment ${reconcileTarget.transaction_ref}`}
            footer={
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReconcileTarget(null)}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold accent-bg cursor-pointer">
                  Save result
                </button>
              </div>
            }
          >
            <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 font-mono text-xs tabular-nums">
              {reconcileTarget.company_name} · {formatMoney(reconcileTarget.amount_rwf)}
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Payment result</label>
              <select
                value={reconcileStatus}
                onChange={(e) => setReconcileStatus(e.target.value as SaasPaymentStatus)}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
              >
                <option value="Successful">Paid (turn on company & make receipt)</option>
                <option value="Failed">Failed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Note (required)</label>
              <textarea
                rows={2}
                value={reconcileNotes}
                onChange={(e) => setReconcileNotes(e.target.value)}
                placeholder="e.g. Checked Bank of Kigali slip #449182."
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                required
              />
            </div>
          </ModalShell>
        )}

        {/* Refund Modal */}
        {refundTarget && (
          <ModalShell
            isOpen={!!refundTarget}
            onClose={() => setRefundTarget(null)}
            maxWidthClass="max-w-md"
            asForm
            onSubmit={(e) => {
              e.preventDefault();
              if (refundAmount <= 0 || refundReason.trim().length < 5) return;
              onRefundPayment(refundTarget.id, refundAmount, refundReason.trim());
              setRefundTarget(null);
            }}
            title={`Send money back (${refundTarget.transaction_ref})`}
            footer={
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">
                  Confirm refund
                </button>
              </div>
            }
          >
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Amount to return (RWF)</label>
              <input
                type="number"
                min={1000}
                max={refundTarget.amount_rwf - (refundTarget.refunded_amount_rwf || 0)}
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Reason for refund</label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Company paid twice by mistake on MoMo."
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                required
              />
            </div>
          </ModalShell>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 7: MONEY SUMMARY
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {tr('Money summary')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Shows money already paid, money still waiting, failed payments, and money sent back.')}
          </p>
        </div>
        <button
          onClick={() =>
            exportToCsv(
              `kigalifleet-money-${new Date().toISOString().slice(0, 10)}.csv`,
              ['TxRef', 'Company', 'Plan', 'AmountRWF', 'RefundedRWF', 'Method', 'Status', 'TaxReceipt', 'Date'],
              saasPayments.map((p) => [
                p.transaction_ref,
                p.company_name,
                p.plan_name,
                p.amount_rwf,
                p.refunded_amount_rwf || 0,
                p.method,
                p.status,
                p.ebm_invoice_ref || '',
                p.created_at,
              ])
            )
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap accent-bg"
        >
          <Download className="w-4 h-4" />
          <span>{tr('Download CSV')}</span>
        </button>
      </div>

      {/* 5 Financial Buckets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Money paid (net)')}</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1.5">
            {formatMoney(revenueSummary.netCollected)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('Paid minus refunds')}</div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Still waiting')}</div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-1.5">
            {formatMoney(revenueSummary.outstandingTotal)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('Not paid yet')}</div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Failed payments')}</div>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1.5">
            {formatMoney(revenueSummary.failedTotal)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('Needs retry')}</div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Sent back')}</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
            {formatMoney(revenueSummary.refundedTotal)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('Refunded to companies')}</div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Monthly total')}</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
            {formatMoney(revenueSummary.activeMrr)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {tr('Average')}: {formatMoney(revenueSummary.arpu)}
          </div>
        </div>
      </div>

      {/* Breakdown by Plan & Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            {tr('Money paid by plan')}
          </h4>
          <div className="space-y-3 text-sm">
            {revenueSummary.byPlan.map(([planName, amount]) => {
              const pct = Math.round((amount / Math.max(1, revenueSummary.netCollected)) * 100);
              return (
                <div key={planName} className="space-y-1.5">
                  <div className="flex justify-between font-mono tabular-nums text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{planName}</span>
                    <span>
                      {formatMoney(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full accent-bg" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            {tr('Money paid by method')}
          </h4>
          <div className="space-y-3 text-sm">
            {revenueSummary.byMethod.map(([method, amount]) => {
              const pct = Math.round((amount / Math.max(1, revenueSummary.netCollected)) * 100);
              return (
                <div key={method} className="space-y-1.5">
                  <div className="flex justify-between font-mono tabular-nums text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{method}</span>
                    <span>
                      {formatMoney(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
