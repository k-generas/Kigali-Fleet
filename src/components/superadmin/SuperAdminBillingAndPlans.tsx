import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  Download,
  Edit3,
  Plus,
  RefreshCw,
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
  // Subscriptions filter & modals
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | CompanySubscriptionStatus>('all');
  const [extendTarget, setExtendTarget] = useState<CompanySubscription | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  const [trialTarget, setTrialTarget] = useState<CompanySubscription | null>(null);
  const [trialDays, setTrialDays] = useState(14);
  const [trialReason, setTrialReason] = useState('');

  // Plans editor modal
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);
  const [planFeaturesText, setPlanFeaturesText] = useState('');
  const [planReason, setPlanReason] = useState('');

  // Payments filter & modals
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
  // MODULE 4: COMPANY SUBSCRIPTIONS
  // -------------------------------------------------------------------------
  if (mode === 'subscriptions') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tenant Subscriptions & Lifecycle Controls
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage renewal dates, trial extensions, grace periods, and tier upgrades with mandatory audit reasons.
            </p>
          </div>
          <select
            value={subStatusFilter}
            onChange={(e) => setSubStatusFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="all">All Subscriptions ({subscriptions.length})</option>
            {(['Active', 'Trial', 'Past Due', 'Suspended', 'Cancelled', 'Expired'] as CompanySubscriptionStatus[]).map(
              (st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              )
            )}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3 text-right">Monthly Fee</th>
                  <th className="px-4 py-3">Renewal / Trial End</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-slate-800 dark:text-slate-200">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{sub.company_name}</div>
                      {sub.last_adjustment_reason && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          Note: {sub.last_adjustment_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">{sub.plan_name}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">
                      {sub.monthly_fee_rwf.toLocaleString()} RWF
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-[11px]">
                      <div>Renews: {sub.renewal_date}</div>
                      {sub.trial_end_date && <div className="text-sky-500">Trial Ends: {sub.trial_end_date}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getStatusStyles(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEditBilling && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setExtendTarget(sub);
                              setNewRenewalDate(sub.renewal_date);
                              setExtendReason('');
                            }}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
                          >
                            Extend Date
                          </button>
                          <button
                            onClick={() => {
                              setTrialTarget(sub);
                              setTrialDays(14);
                              setTrialReason('');
                            }}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 whitespace-nowrap"
                          >
                            Grant Trial
                          </button>
                          <select
                            value=""
                            onChange={(e) => {
                              const nextTier = e.target.value as 'starter' | 'growth' | 'enterprise';
                              if (!nextTier) return;
                              setPendingAction({
                                title: `Change ${sub.company_name} Tier to ${nextTier.toUpperCase()}`,
                                description: `Current plan: ${sub.plan_name}`,
                                confirmLabel: `Apply ${nextTier.toUpperCase()}`,
                                execute: (reason) => onUpdateCompanyPlan(sub.company_id, nextTier, reason),
                              });
                            }}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-[11px] outline-none"
                          >
                            <option value="">Switch Tier...</option>
                            <option value="starter">Starter (35k)</option>
                            <option value="growth">Growth (75k)</option>
                            <option value="enterprise">Enterprise (150k)</option>
                          </select>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Extend Renewal Modal */}
        {extendTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRenewalDate || extendReason.trim().length < 4) return;
                onExtendSubscription(extendTarget.id, newRenewalDate, extendReason.trim());
                setExtendTarget(null);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" style={{ color: currentTheme.hex }} />
                  <span>Extend Renewal: {extendTarget.company_name}</span>
                </h4>
                <button type="button" onClick={() => setExtendTarget(null)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Renewal Date
                </label>
                <input
                  type="date"
                  value={newRenewalDate}
                  onChange={(e) => setNewRenewalDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Audit Reason</label>
                <textarea
                  rows={2}
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Verified RTGS wire clearing slip pending settlement."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendTarget(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Save Extension
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grant Trial Modal */}
        {trialTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (trialReason.trim().length < 4) return;
                onGrantTrial(trialTarget.company_id, trialDays, trialReason.trim());
                setTrialTarget(null);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Grant Trial Window: {trialTarget.company_name}
                </h4>
                <button type="button" onClick={() => setTrialTarget(null)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Trial Days</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Audit Reason</label>
                <textarea
                  rows={2}
                  value={trialReason}
                  onChange={(e) => setTrialReason(e.target.value)}
                  placeholder="e.g. Extended evaluation for seasonal safari fleet onboarding."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTrialTarget(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Grant {trialDays}-Day Trial
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
        features: ['Multi-branch telemetry', 'MTN MoMo & RRA EBM v2.0'],
        updated_at: new Date().toISOString().slice(0, 10),
      });
      setPlanFeaturesText('Multi-branch telemetry\nMTN MoMo & RRA EBM v2.0');
      setPlanReason('');
    };

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Subscription Plans, Quotas & Pricing Catalog
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Updates to Starter, Growth, and Enterprise sync directly with tenant Subscription Plans views.
            </p>
          </div>
          {canEditBilling && (
            <button
              onClick={openCreatePlan}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${currentTheme.btnText}`}
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Plan Tier</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const count = companies.filter((c) => c.tier_id === plan.tier_key).length;
            return (
              <div
                key={plan.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {plan.target_fleet_size}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getStatusStyles(
                        plan.is_active ? 'Active' : 'Inactive'
                      )}`}
                    >
                      {plan.is_active ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {plan.monthly_fee_rwf.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">RWF/mo</span>
                    <div className="text-[11px] text-slate-500">
                      Annual: {plan.annual_fee_rwf.toLocaleString()} RWF · {plan.trial_days}d trial
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Vehicles</span>
                      <span className="font-bold text-slate-900 dark:text-white">{plan.max_vehicles}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Employees</span>
                      <span className="font-bold text-slate-900 dark:text-white">{plan.max_employees}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Branches</span>
                      <span className="font-bold text-slate-900 dark:text-white">{plan.max_branches}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Bookings/mo</span>
                      <span className="font-bold text-slate-900 dark:text-white">{plan.max_monthly_bookings}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                    {plan.features.slice(0, 4).map((f, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">{count} active companies</span>
                  {canEditBilling && (
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanFeaturesText(plan.features.join('\n'));
                        setPlanReason('');
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Quotas</span>
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-3 text-xs max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white">Configure Plan Quotas & Pricing</h4>
                <button type="button" onClick={() => setEditingPlan(null)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tier Mapping</label>
                  <select
                    value={editingPlan.tier_key}
                    onChange={(e) => setEditingPlan({ ...editingPlan, tier_key: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white"
                  >
                    <option value="trial">trial</option>
                    <option value="starter">starter</option>
                    <option value="growth">growth</option>
                    <option value="enterprise">enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Monthly (RWF)</label>
                  <input
                    type="number"
                    value={editingPlan.monthly_fee_rwf}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, monthly_fee_rwf: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Annual (RWF)</label>
                  <input
                    type="number"
                    value={editingPlan.annual_fee_rwf}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, annual_fee_rwf: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Trial Days</label>
                  <input
                    type="number"
                    value={editingPlan.trial_days}
                    onChange={(e) => setEditingPlan({ ...editingPlan, trial_days: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Max Cars</label>
                  <input
                    type="number"
                    value={editingPlan.max_vehicles}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_vehicles: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Staff</label>
                  <input
                    type="number"
                    value={editingPlan.max_employees}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_employees: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Branches</label>
                  <input
                    type="number"
                    value={editingPlan.max_branches}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_branches: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bookings/mo</label>
                  <input
                    type="number"
                    value={editingPlan.max_monthly_bookings}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, max_monthly_bookings: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Included Features (one per line)</label>
                <textarea
                  rows={3}
                  value={planFeaturesText}
                  onChange={(e) => setPlanFeaturesText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_public}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_public: e.target.checked })}
                  />
                  <span>Publicly Listed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                  />
                  <span>Active for New Signups</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold mb-1">Audit Reason</label>
                <input
                  type="text"
                  value={planReason}
                  onChange={(e) => setPlanReason(e.target.value)}
                  placeholder="e.g. Q4 pricing calibration for Rwanda transport operators."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold ${currentTheme.btnText}`}
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
  // MODULE 6: SAAS PAYMENTS LEDGER
  // -------------------------------------------------------------------------
  if (mode === 'saas_payments') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={paySearch}
              onChange={(e) => setPaySearch(e.target.value)}
              placeholder="Search transaction ref, MoMo/Bank provider ref, or company..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg pl-9 pr-3 py-2 outline-none"
            />
          </div>
          <select
            value={payStatusFilter}
            onChange={(e) => setPayStatusFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="all">All Payment Statuses ({saasPayments.length})</option>
            {(['Successful', 'Pending', 'Failed', 'Refunded', 'Partially Refunded', 'Cancelled'] as SaasPaymentStatus[]).map(
              (st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              )
            )}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Transaction & Provider Ref</th>
                  <th className="px-4 py-3">Company & Plan</th>
                  <th className="px-4 py-3">Method / Gateway</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Reconcile / Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-slate-800 dark:text-slate-200">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white">{p.transaction_ref}</div>
                      <div className="text-[11px] text-slate-500">{p.provider_ref}</div>
                      {p.ebm_invoice_ref && (
                        <div className="text-[10px] text-emerald-500">{p.ebm_invoice_ref}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{p.company_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.plan_name} · {p.created_at}
                      </div>
                      {p.failure_reason && (
                        <div className="text-[11px] text-rose-500 mt-0.5">{p.failure_reason}</div>
                      )}
                      {p.reconciliation_notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5">Note: {p.reconciliation_notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{p.method}</div>
                      <div className="text-[11px] text-slate-500">{p.provider}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">
                      <div>
                        {p.amount_rwf.toLocaleString()} {p.currency}
                      </div>
                      {p.refunded_amount_rwf && (
                        <div className="text-[10px] text-violet-500">
                          -{p.refunded_amount_rwf.toLocaleString()} refunded
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getStatusStyles(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEditBilling && (
                        <div className="flex items-center justify-end gap-1.5">
                          {(p.status === 'Pending' || p.status === 'Failed') && (
                            <button
                              onClick={() => {
                                setReconcileTarget(p);
                                setReconcileStatus('Successful');
                                setReconcileNotes('');
                              }}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap"
                            >
                              Reconcile
                            </button>
                          )}
                          {(p.status === 'Successful' || p.status === 'Partially Refunded') && (
                            <button
                              onClick={() => {
                                setRefundTarget(p);
                                setRefundAmount(p.amount_rwf - (p.refunded_amount_rwf || 0));
                                setRefundReason('');
                              }}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 whitespace-nowrap"
                            >
                              Issue Refund
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
        </div>

        {/* Reconcile Payment Modal */}
        {reconcileTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (reconcileNotes.trim().length < 5) return;
                onReconcilePayment(reconcileTarget.id, reconcileStatus, reconcileNotes.trim());
                setReconcileTarget(null);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Reconcile Payment {reconcileTarget.transaction_ref}
                </h4>
                <button type="button" onClick={() => setReconcileTarget(null)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono">
                {reconcileTarget.company_name} · {reconcileTarget.amount_rwf.toLocaleString()} RWF
              </div>
              <div>
                <label className="block font-semibold mb-1">Reconciled Outcome</label>
                <select
                  value={reconcileStatus}
                  onChange={(e) => setReconcileStatus(e.target.value as SaasPaymentStatus)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5"
                >
                  <option value="Successful">Successful (Activate Tenant & Issue EBM)</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Mandatory Reconciliation Notes</label>
                <textarea
                  rows={2}
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="e.g. Verified Bank of Kigali RTGS deposit slip #449182."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReconcileTarget(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Record Reconciliation
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Refund Payment Modal */}
        {refundTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (refundAmount <= 0 || refundReason.trim().length < 5) return;
                onRefundPayment(refundTarget.id, refundAmount, refundReason.trim());
                setRefundTarget(null);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Refund Payment {refundTarget.transaction_ref}
                </h4>
                <button type="button" onClick={() => setRefundTarget(null)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block font-semibold mb-1">Refund Amount (RWF)</label>
                <input
                  type="number"
                  min={1000}
                  max={refundTarget.amount_rwf - (refundTarget.refunded_amount_rwf || 0)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mandatory Refund Reason</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Duplicate MoMo billing debited on renewal."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg font-bold bg-rose-600 text-white">
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
  // MODULE 7: PLATFORM REVENUE INTELLIGENCE
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Platform Revenue Intelligence (Verified vs. Theoretical MRR)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Strictly separates verified settled SaaS collections from pending invoices, failed charges, and refunds.
          </p>
        </div>
        <button
          onClick={() =>
            exportToCsv(
              `kigalifleet-saas-revenue-${new Date().toISOString().slice(0, 10)}.csv`,
              ['TxRef', 'Company', 'Plan', 'AmountRWF', 'RefundedRWF', 'Method', 'Status', 'EBM', 'Date'],
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
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${currentTheme.btnText}`}
          style={{ backgroundColor: currentTheme.hex }}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Revenue CSV</span>
        </button>
      </div>

      {/* 5 Financial Buckets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Net Collected</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1.5">
            {revenueSummary.netCollected.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Settled minus refunds</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Outstanding / Pending</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1.5">
            {revenueSummary.outstandingTotal.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting clearing</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Failed Charges</div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1.5">
            {revenueSummary.failedTotal.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requires retry / contact</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Refunded Total</div>
          <div className="text-xl font-bold text-violet-600 dark:text-violet-400 font-mono tabular-nums mt-1.5">
            {revenueSummary.refundedTotal.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Credited back to tenants</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Active MRR / ARPU</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1.5">
            {revenueSummary.activeMrr.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            ARPU: {revenueSummary.arpu.toLocaleString()} RWF
          </div>
        </div>
      </div>

      {/* Breakdown by Plan & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Net Collected Revenue by Plan</h4>
          <div className="space-y-2.5 text-xs">
            {revenueSummary.byPlan.map(([planName, amount]) => {
              const pct = Math.round((amount / Math.max(1, revenueSummary.netCollected)) * 100);
              return (
                <div key={planName} className="space-y-1">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{planName}</span>
                    <span>
                      {amount.toLocaleString()} RWF ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: currentTheme.hex }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Net Collected Revenue by Payment Method</h4>
          <div className="space-y-2.5 text-xs">
            {revenueSummary.byMethod.map(([method, amount]) => {
              const pct = Math.round((amount / Math.max(1, revenueSummary.netCollected)) * 100);
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{method}</span>
                    <span>
                      {amount.toLocaleString()} RWF ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
