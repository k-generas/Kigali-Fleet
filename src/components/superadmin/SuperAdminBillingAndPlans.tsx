import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  Download,
  Edit3,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  Company,
  CompanySubscription,
  CompanySubscriptionStatus,
  PlatformPlan,
  SaasPaymentRecord,
  SaasPaymentStatus,
} from '../../types';
import { ColorTheme } from '../../theme';
import { ReasonActionModal, exportToCsv, getStatusStyles } from './SuperAdminShared';

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
      <div className="space-y-5">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
              Company Plans
            </h3>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              Change renewal dates, give free trial days, or upgrade a company plan. Every change saves a reason.
            </p>
          </div>
          <select
            value={subStatusFilter}
            onChange={(e) => setSubStatusFilter(e.target.value as any)}
            className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm rounded-xl px-3.5 py-2.5 text-[#0a2540] dark:text-slate-200 outline-none"
          >
            <option value="all">All Plans ({subscriptions.length})</option>
            {(['Active', 'Trial', 'Past Due', 'Suspended', 'Cancelled', 'Expired'] as CompanySubscriptionStatus[]).map(
              (st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              )
            )}
          </select>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-[#425466] dark:text-slate-400 font-semibold">
            <div className="col-span-3">Company</div>
            <div className="col-span-1">Plan</div>
            <div className="col-span-2 text-right">Monthly Price</div>
            <div className="col-span-2">Next Date / Trial</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm text-[#0a2540] dark:text-slate-200">
            {filteredSubs.map((sub) => (
              <div
                key={sub.id}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40"
              >
                <div className="lg:col-span-3 min-w-0">
                  <div className="font-bold text-[#0a2540] dark:text-white truncate">{sub.company_name}</div>
                  {sub.last_adjustment_reason && (
                    <div className="text-xs text-[#425466] dark:text-slate-400 truncate">
                      Note: {sub.last_adjustment_reason}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-1 font-mono font-semibold text-xs truncate">{sub.plan_name}</div>
                <div className="lg:col-span-2 lg:text-right font-mono tabular-nums font-bold whitespace-nowrap">
                  {sub.monthly_fee_rwf.toLocaleString()} RWF
                </div>
                <div className="lg:col-span-2 font-mono tabular-nums text-xs">
                  <div className="whitespace-nowrap">Renews: {sub.renewal_date}</div>
                  {sub.trial_end_date && (
                    <div className="text-sky-600 dark:text-sky-400 whitespace-nowrap">Free ends: {sub.trial_end_date}</div>
                  )}
                </div>
                <div className="lg:col-span-1 lg:text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${getStatusStyles(sub.status)}`}>
                    {sub.status}
                  </span>
                </div>
                <div className="lg:col-span-3 flex items-center lg:justify-end gap-1.5 flex-wrap">
                  {canEditBilling && (
                    <>
                      <button
                        onClick={() => {
                          setExtendTarget(sub);
                          setNewRenewalDate(sub.renewal_date);
                          setExtendReason('');
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
                      >
                        More Time
                      </button>
                      <button
                        onClick={() => {
                          setTrialTarget(sub);
                          setTrialDays(14);
                          setTrialReason('');
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 whitespace-nowrap"
                      >
                        Free Days
                      </button>
                      <select
                        value=""
                        onChange={(e) => {
                          const nextTier = e.target.value as 'starter' | 'growth' | 'enterprise';
                          if (!nextTier) return;
                          setPendingAction({
                            title: `Change ${sub.company_name} Plan to ${nextTier.toUpperCase()}`,
                            description: `Current plan: ${sub.plan_name}`,
                            confirmLabel: `Set ${nextTier.toUpperCase()}`,
                            execute: (reason) => onUpdateCompanyPlan(sub.company_id, nextTier, reason),
                          });
                        }}
                        className="bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1.5 text-xs outline-none"
                      >
                        <option value="">Change Plan...</option>
                        <option value="starter">Starter (35k)</option>
                        <option value="growth">Growth (75k)</option>
                        <option value="enterprise">Enterprise (150k)</option>
                      </select>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* More Time Modal */}
        {extendTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRenewalDate || extendReason.trim().length < 4) return;
                onExtendSubscription(extendTarget.id, newRenewalDate, extendReason.trim());
                setExtendTarget(null);
              }}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-base font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <CalendarClock className="w-5 h-5" style={{ color: currentTheme.hex }} />
                  <span>Give More Time: {extendTarget.company_name}</span>
                </h4>
                <button type="button" onClick={() => setExtendTarget(null)} className="text-slate-400 p-1 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">
                  New Renewal Date
                </label>
                <input
                  type="date"
                  value={newRenewalDate}
                  onChange={(e) => setNewRenewalDate(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-[#0a2540] dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">Reason for Change</label>
                <textarea
                  rows={2}
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Bank transfer slip received, waiting to clear."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[#0a2540] dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendTarget(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Save New Date
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Free Days Modal */}
        {trialTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (trialReason.trim().length < 4) return;
                onGrantTrial(trialTarget.company_id, trialDays, trialReason.trim());
                setTrialTarget(null);
              }}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-base font-bold text-[#0a2540] dark:text-white">
                  Give Free Days: {trialTarget.company_name}
                </h4>
                <button type="button" onClick={() => setTrialTarget(null)} className="text-slate-400 p-1 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">Number of Free Days</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-[#0a2540] dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0a2540] dark:text-slate-300 mb-1">Reason for Change</label>
                <textarea
                  rows={2}
                  value={trialReason}
                  onChange={(e) => setTrialReason(e.target.value)}
                  placeholder="e.g. Giving extra free days while they add their cars."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[#0a2540] dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTrialTarget(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Give {trialDays} Free Days
                </button>
              </div>
            </form>
          </div>
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
      <div className="space-y-5">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
              Prices & Plans
            </h3>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              Changes to Starter, Growth, and Enterprise update on the pricing page right away.
            </p>
          </div>
          {canEditBilling && (
            <button
              onClick={openCreatePlan}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap ${currentTheme.btnText}`}
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Plan</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const count = companies.filter((c) => c.tier_id === plan.tier_key).length;
            return (
              <div
                key={plan.id}
                className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-[#0a2540] dark:text-white">{plan.name}</h4>
                      <p className="text-sm text-[#425466] dark:text-slate-400 mt-0.5">
                        {plan.target_fleet_size}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(
                        plan.is_active ? 'Active' : 'Inactive'
                      )}`}
                    >
                      {plan.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <div className="font-mono tabular-nums">
                    <span className="text-2xl font-bold text-[#0a2540] dark:text-white">
                      {plan.monthly_fee_rwf.toLocaleString()}
                    </span>
                    <span className="text-sm text-[#425466] dark:text-slate-400 ml-1">RWF/mo</span>
                    <div className="text-sm text-[#425466] dark:text-slate-400 mt-0.5">
                      Yearly: {plan.annual_fee_rwf.toLocaleString()} RWF · {plan.trial_days} free days
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-sm font-mono tabular-nums">
                    <div className="p-2.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block text-sm">Cars</span>
                      <span className="font-bold text-[#0a2540] dark:text-white">{plan.max_vehicles}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block text-sm">Staff</span>
                      <span className="font-bold text-[#0a2540] dark:text-white">{plan.max_employees}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block text-sm">Offices</span>
                      <span className="font-bold text-[#0a2540] dark:text-white">{plan.max_branches}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block text-sm">Trips/mo</span>
                      <span className="font-bold text-[#0a2540] dark:text-white">{plan.max_monthly_bookings}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                    {plan.features.slice(0, 4).map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[#425466] dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
                  <span className="text-[#425466] dark:text-slate-400 font-mono">{count} companies</span>
                  {canEditBilling && (
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanFeaturesText(plan.features.join('\n'));
                        setPlanReason('');
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Limits</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Plan Editor Modal */}
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
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
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-sm max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-base font-bold text-[#0a2540] dark:text-white">Edit Plan Prices & Limits</h4>
                <button type="button" onClick={() => setEditingPlan(null)} className="text-slate-400 p-1 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Plan Name</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Plan Level</label>
                  <select
                    value={editingPlan.tier_key}
                    onChange={(e) => setEditingPlan({ ...editingPlan, tier_key: e.target.value as any })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
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
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Monthly (RWF)</label>
                  <input
                    type="number"
                    value={editingPlan.monthly_fee_rwf}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, monthly_fee_rwf: Number(e.target.value) })
                    }
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Yearly (RWF)</label>
                  <input
                    type="number"
                    value={editingPlan.annual_fee_rwf}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, annual_fee_rwf: Number(e.target.value) })
                    }
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Free Days</label>
                  <input
                    type="number"
                    value={editingPlan.trial_days}
                    onChange={(e) => setEditingPlan({ ...editingPlan, trial_days: Number(e.target.value) })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Max Cars</label>
                  <input
                    type="number"
                    value={editingPlan.max_vehicles}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_vehicles: Number(e.target.value) })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Max Staff</label>
                  <input
                    type="number"
                    value={editingPlan.max_employees}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_employees: Number(e.target.value) })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Offices</label>
                  <input
                    type="number"
                    value={editingPlan.max_branches}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_branches: Number(e.target.value) })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Trips/mo</label>
                  <input
                    type="number"
                    value={editingPlan.max_monthly_bookings}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, max_monthly_bookings: Number(e.target.value) })
                    }
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">What Is Included (one per line)</label>
                <textarea
                  rows={3}
                  value={planFeaturesText}
                  onChange={(e) => setPlanFeaturesText(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_public}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_public: e.target.checked })}
                  />
                  <span>Show on Public Page</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                  />
                  <span>Open for New Companies</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Reason for Change</label>
                <input
                  type="text"
                  value={planReason}
                  onChange={(e) => setPlanReason(e.target.value)}
                  placeholder="e.g. Updated prices for new year."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 6: COMPANY PAYMENTS LEDGER
  // -------------------------------------------------------------------------
  if (mode === 'saas_payments') {
    return (
      <div className="space-y-5">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={paySearch}
              onChange={(e) => setPaySearch(e.target.value)}
              placeholder="Search receipt code, MoMo code, or company..."
              className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-100 text-sm rounded-xl pl-10 pr-3.5 py-2.5 outline-none"
            />
          </div>
          <select
            value={payStatusFilter}
            onChange={(e) => setPayStatusFilter(e.target.value as any)}
            className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm rounded-xl px-3.5 py-2.5 text-[#0a2540] dark:text-slate-200 outline-none"
          >
            <option value="all">All Payments ({saasPayments.length})</option>
            {(['Successful', 'Pending', 'Failed', 'Refunded', 'Partially Refunded', 'Cancelled'] as SaasPaymentStatus[]).map(
              (st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              )
            )}
          </select>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-[#425466] dark:text-slate-400 font-semibold">
            <div className="col-span-3">Payment Code</div>
            <div className="col-span-3">Company & Plan</div>
            <div className="col-span-2">How Paid</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm text-[#0a2540] dark:text-slate-200">
            {filteredPayments.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40"
              >
                <div className="lg:col-span-3 font-mono min-w-0">
                  <div className="font-bold text-[#0a2540] dark:text-white truncate">{p.transaction_ref}</div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 truncate">{p.provider_ref}</div>
                  {p.ebm_invoice_ref && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 truncate">{p.ebm_invoice_ref}</div>
                  )}
                </div>
                <div className="lg:col-span-3 min-w-0">
                  <div className="font-semibold text-[#0a2540] dark:text-white truncate">{p.company_name}</div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 whitespace-nowrap truncate">
                    {p.plan_name} · {p.created_at}
                  </div>
                  {p.failure_reason && <div className="text-xs text-rose-500 mt-0.5 truncate">{p.failure_reason}</div>}
                  {p.reconciliation_notes && (
                    <div className="text-xs text-[#425466] dark:text-slate-400 mt-0.5 truncate">Note: {p.reconciliation_notes}</div>
                  )}
                </div>
                <div className="lg:col-span-2 min-w-0">
                  <div className="truncate">{p.method}</div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 truncate">{p.provider}</div>
                </div>
                <div className="lg:col-span-2 lg:text-right font-mono tabular-nums font-bold">
                  <div className="whitespace-nowrap">
                    {p.amount_rwf.toLocaleString()} {p.currency}
                  </div>
                  {p.refunded_amount_rwf && (
                    <div className="text-xs text-violet-600 dark:text-violet-400 whitespace-nowrap">
                      -{p.refunded_amount_rwf.toLocaleString()} sent back
                    </div>
                  )}
                </div>
                <div className="lg:col-span-1 lg:text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${getStatusStyles(p.status)}`}>
                    {p.status}
                  </span>
                </div>
                <div className="lg:col-span-1 flex items-center lg:justify-end gap-1.5 flex-wrap">
                  {canEditBilling && (
                    <>
                      {(p.status === 'Pending' || p.status === 'Failed') && (
                        <button
                          onClick={() => {
                            setReconcileTarget(p);
                            setReconcileStatus('Successful');
                            setReconcileNotes('');
                          }}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap"
                        >
                          Confirm Paid
                        </button>
                      )}
                      {(p.status === 'Successful' || p.status === 'Partially Refunded') && (
                        <button
                          onClick={() => {
                            setRefundTarget(p);
                            setRefundAmount(p.amount_rwf - (p.refunded_amount_rwf || 0));
                            setRefundReason('');
                          }}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 whitespace-nowrap"
                        >
                          Refund
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Paid Modal */}
        {reconcileTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (reconcileNotes.trim().length < 5) return;
                onReconcilePayment(reconcileTarget.id, reconcileStatus, reconcileNotes.trim());
                setReconcileTarget(null);
              }}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-base font-bold text-[#0a2540] dark:text-white">
                  Check Payment {reconcileTarget.transaction_ref}
                </h4>
                <button type="button" onClick={() => setReconcileTarget(null)} className="text-slate-400 p-1 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono">
                {reconcileTarget.company_name} · {reconcileTarget.amount_rwf.toLocaleString()} RWF
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Payment Result</label>
                <select
                  value={reconcileStatus}
                  onChange={(e) => setReconcileStatus(e.target.value as SaasPaymentStatus)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
                >
                  <option value="Successful">Paid (Turn On Company & Make Receipt)</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Note (Required)</label>
                <textarea
                  rows={2}
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="e.g. Checked Bank of Kigali slip #449182."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReconcileTarget(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Refund Modal */}
        {refundTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (refundAmount <= 0 || refundReason.trim().length < 5) return;
                onRefundPayment(refundTarget.id, refundAmount, refundReason.trim());
                setRefundTarget(null);
              }}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-base font-bold text-[#0a2540] dark:text-white">
                  Send Money Back ({refundTarget.transaction_ref})
                </h4>
                <button type="button" onClick={() => setRefundTarget(null)} className="text-slate-400 p-1 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Amount to Return (RWF)</label>
                <input
                  type="number"
                  min={1000}
                  max={refundTarget.amount_rwf - (refundTarget.refunded_amount_rwf || 0)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Reason for Refund</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Company paid twice by mistake on MoMo."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-full font-semibold bg-rose-600 text-white">
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 7: MONEY SUMMARY
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
            Money Summary
          </h3>
          <p className="text-sm text-[#425466] dark:text-slate-400">
            Shows money already paid, money still waiting, failed payments, and money sent back.
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
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap ${currentTheme.btnText}`}
          style={{ backgroundColor: currentTheme.hex }}
        >
          <Download className="w-4 h-4" />
          <span>Download CSV</span>
        </button>
      </div>

      {/* 5 Financial Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Money Paid (Net)</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1.5">
            {revenueSummary.netCollected.toLocaleString()} RWF
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">Paid minus refunds</div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Still Waiting</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1.5">
            {revenueSummary.outstandingTotal.toLocaleString()} RWF
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">Not paid yet</div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Failed Payments</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1.5">
            {revenueSummary.failedTotal.toLocaleString()} RWF
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">Needs retry</div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Sent Back</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 font-mono tabular-nums mt-1.5">
            {revenueSummary.refundedTotal.toLocaleString()} RWF
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">Refunded to companies</div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Monthly Total</div>
          <div className="text-2xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-1.5">
            {revenueSummary.activeMrr.toLocaleString()} RWF
          </div>
          <div className="text-sm text-[#425466] dark:text-slate-400 mt-1 font-mono tabular-nums">
            Average: {revenueSummary.arpu.toLocaleString()} RWF
          </div>
        </div>
      </div>

      {/* Breakdown by Plan & Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-lg font-bold text-[#0a2540] dark:text-white">Money Paid by Plan</h4>
          <div className="space-y-3 text-sm">
            {revenueSummary.byPlan.map(([planName, amount]) => {
              const pct = Math.round((amount / Math.max(1, revenueSummary.netCollected)) * 100);
              return (
                <div key={planName} className="space-y-1.5">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="font-semibold text-[#0a2540] dark:text-slate-200">{planName}</span>
                    <span>
                      {amount.toLocaleString()} RWF ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: currentTheme.hex }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-lg font-bold text-[#0a2540] dark:text-white">Money Paid by Method</h4>
          <div className="space-y-3 text-sm">
            {revenueSummary.byMethod.map(([method, amount]) => {
              const pct = Math.round((amount / Math.max(1, revenueSummary.netCollected)) * 100);
              return (
                <div key={method} className="space-y-1.5">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="font-semibold text-[#0a2540] dark:text-slate-200">{method}</span>
                    <span>
                      {amount.toLocaleString()} RWF ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
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
