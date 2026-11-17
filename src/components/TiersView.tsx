import React, { useState } from 'react';
import { SubscriptionTier } from '../types';
import { useI18n } from '../utils/i18n';
import { AlertCircle, Check } from 'lucide-react';
import { ColorTheme } from '../theme';

interface TiersViewProps {
  tiers: SubscriptionTier[];
  activeTierId: 'starter' | 'growth' | 'enterprise';
  vehiclesCount?: number;
  currentTheme?: ColorTheme;
  onSelectTier: (tierId: 'starter' | 'growth' | 'enterprise') => void;
}

const PLAIN_TIER_DESC: Record<string, string> = {
  starter: 'For small teams starting with 1 to 5 cars.',
  growth: 'Best for busy car rental companies with up to 20 cars.',
  enterprise: 'For big fleets and tour companies with many cars.',
};

export const TiersView: React.FC<TiersViewProps> = ({
  tiers,
  activeTierId,
  vehiclesCount = 7,
  onSelectTier,
}) => {
  const { formatMoney, tr, t } = useI18n();
  const [upgradeNotification, setUpgradeNotification] = useState<string | null>(null);

  const handleSelect = (tier: SubscriptionTier) => {
    if (tier.id === 'starter' && vehiclesCount > 5) {
      setUpgradeNotification(
        t({
          EN: `You have ${vehiclesCount} cars right now. The Starter plan only fits up to 5 cars. Please pick Growth or Enterprise.`,
          RW: `Ufite imodoka ${vehiclesCount} ubu. Gahunda ya Starter ijyana n'imodoka 5 gusa. Hitamo Growth cyangwa Enterprise.`,
          FR: `Vous avez ${vehiclesCount} voitures actuellement. Le forfait Starter est limité à 5 voitures. Choisissez Growth ou Enterprise.`,
        })
      );
      return;
    }
    setUpgradeNotification(null);
    onSelectTier(tier.id);
  };

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Plans')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Pick a monthly plan that fits the number of cars you own.')} · {tr('Your cars')}:{' '}
            <strong className="font-mono font-semibold text-slate-900 dark:text-white">{vehiclesCount}</strong>
          </p>
        </div>
      </div>

      {upgradeNotification && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{upgradeNotification}</span>
        </div>
      )}

      {/* 3-Column Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tiers.map((tier) => {
          const isCurrent = activeTierId === tier.id;
          const isOverCapacity = tier.id === 'starter' && vehiclesCount > 5;

          return (
            <div
              key={tier.id}
              className={`rounded-xl border p-6 flex flex-col justify-between kf-card transition-all ${
                isCurrent
                  ? 'bg-white dark:bg-[#111827] accent-border ring-1 ring-inset'
                  : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {tr(tier.name)}
                  </h4>
                  {isCurrent && (
                    <span className="accent-tint accent-text px-2 py-0.5 rounded-md text-xs font-medium">
                      {tr('Your plan')}
                    </span>
                  )}
                </div>

                <div className="text-2xl font-semibold font-mono text-slate-900 dark:text-white mt-3 tabular-nums">
                  {formatMoney(tier.monthly_fee_rwf)}{' '}
                  <span className="text-xs font-normal font-sans text-slate-500 dark:text-slate-400">
                    / {tr('per month')}
                  </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {tr(PLAIN_TIER_DESC[tier.id] || tier.target_fleet_size)}
                </p>

                <div className="mt-4 px-3 py-2 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 text-xs font-semibold text-slate-900 dark:text-white">
                  {tier.max_vehicles >= 999
                    ? tr('Unlimited cars')
                    : `${tr('Up to')} ${tier.max_vehicles} ${tr('cars')}`}
                </div>

                <ul className="text-sm text-slate-700 dark:text-slate-300 my-5 space-y-2.5">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{tr(feat)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSelect(tier)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                      : isOverCapacity
                      ? 'border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'accent-bg hover:opacity-95 shadow-xs'
                  }`}
                >
                  {isCurrent
                    ? tr('Current plan')
                    : isOverCapacity
                    ? tr('Needs 5 or fewer cars')
                    : `${tr('Choose')} ${tr(tier.name)}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
