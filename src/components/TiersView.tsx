import React, { useState } from 'react';
import { SubscriptionTier } from '../types';
import { formatRwf } from '../utils/collision';
import { Check, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { ColorTheme } from '../theme';

interface TiersViewProps {
  tiers: SubscriptionTier[];
  activeTierId: 'starter' | 'growth' | 'enterprise';
  vehiclesCount?: number;
  currentTheme?: ColorTheme;
  onSelectTier: (tierId: 'starter' | 'growth' | 'enterprise') => void;
}

const PLAIN_TIER_DESC: Record<string, string> = {
  starter: 'Best for small teams starting with 1 to 5 cars.',
  growth: 'Best for busy car rental companies with up to 25 cars.',
  enterprise: 'Best for big fleets and tour companies with many cars.',
};

export const TiersView: React.FC<TiersViewProps> = ({
  tiers,
  activeTierId,
  vehiclesCount = 7,
  currentTheme,
  onSelectTier,
}) => {
  const [upgradeNotification, setUpgradeNotification] = useState<string | null>(null);

  const activeThemeColor = currentTheme?.hex || '#635bff';
  const activeBtnText = currentTheme?.btnText || 'text-white';

  const handleSelect = (tier: SubscriptionTier) => {
    if (tier.id === 'starter' && vehiclesCount > 5) {
      setUpgradeNotification(
        `You have ${vehiclesCount} cars right now. The Starter plan only fits up to 5 cars. Please pick Growth or Enterprise.`
      );
      return;
    }
    setUpgradeNotification(null);
    onSelectTier(tier.id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center max-w-4xl mx-auto space-y-4">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: `${activeThemeColor}15`,
            color: activeThemeColor,
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Simple Monthly Plans</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white tracking-tight">
          Pick the Plan That Fits Your Cars
        </h2>
        <p className="text-base text-[#425466] dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Stop losing money from double bookings or missed payments. Pick a monthly plan based on how many cars you rent out.
        </p>

        {/* Fleet size status */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 rounded-full bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-[#425466] dark:text-slate-300">
          <span>Your Cars:</span>
          <strong className="font-mono font-bold text-[#0a2540] dark:text-white">
            {vehiclesCount} Cars
          </strong>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>Your Plan Now:</span>
          <strong className="text-emerald-600 dark:text-emerald-400 capitalize font-bold">
            {activeTierId}
          </strong>
        </div>
      </div>

      {upgradeNotification && (
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{upgradeNotification}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tiers.map((tier) => {
          const isCurrent = activeTierId === tier.id;
          const isOverCapacity = tier.id === 'starter' && vehiclesCount > 5;

          return (
            <div
              key={tier.id}
              className={`stripe-card rounded-2xl p-6 sm:p-7 space-y-6 flex flex-col justify-between transition-all relative bg-white dark:bg-slate-900 ${
                isCurrent
                  ? 'border-2 shadow-lg'
                  : 'border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              style={isCurrent ? { borderColor: activeThemeColor } : undefined}
            >
              {isCurrent && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 whitespace-nowrap ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Your Current Plan</span>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <div
                    className="text-sm font-bold uppercase tracking-wide"
                    style={{ color: activeThemeColor }}
                  >
                    {tier.name}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-extrabold text-[#0a2540] dark:text-white font-mono tabular-nums">
                      {formatRwf(tier.monthly_fee_rwf)}
                    </span>
                    <span className="text-sm text-[#425466] dark:text-slate-400">/ month</span>
                  </div>
                  <p className="text-sm text-[#425466] dark:text-slate-300 mt-2 leading-relaxed">
                    {PLAIN_TIER_DESC[tier.id] || tier.target_fleet_size}
                  </p>
                </div>

                {/* Capacity badge */}
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-semibold text-[#425466] dark:text-slate-400">
                    Car Limit
                  </div>
                  <div className="text-base font-bold text-[#0a2540] dark:text-white mt-0.5">
                    {tier.max_vehicles >= 999
                      ? 'Unlimited Cars'
                      : `Up to ${tier.max_vehicles} Cars`}
                  </div>
                </div>

                {/* Features */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-sm text-[#425466] dark:text-slate-300">
                  {tier.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleSelect(tier)}
                  disabled={isCurrent}
                  className={`w-full py-3 px-4 rounded-full font-bold text-sm transition-all active:scale-95 ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                      : isOverCapacity
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      : `${activeBtnText} shadow-sm hover:opacity-95`
                  }`}
                  style={!isCurrent && !isOverCapacity ? { backgroundColor: activeThemeColor } : undefined}
                >
                  {isCurrent
                    ? 'Active Now'
                    : isOverCapacity
                    ? 'Needs 5 or Fewer Cars'
                    : `Pick ${tier.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
