import React, { useState } from 'react';
import { SubscriptionTier, Vehicle } from '../types';
import { formatRwf } from '../utils/collision';
import { Check, Layers, ShieldCheck, Zap, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { ColorTheme } from '../theme';

interface TiersViewProps {
  tiers: SubscriptionTier[];
  activeTierId: 'starter' | 'growth' | 'enterprise';
  vehiclesCount?: number;
  currentTheme?: ColorTheme;
  onSelectTier: (tierId: 'starter' | 'growth' | 'enterprise') => void;
}

export const TiersView: React.FC<TiersViewProps> = ({
  tiers,
  activeTierId,
  vehiclesCount = 7,
  currentTheme,
  onSelectTier,
}) => {
  const [upgradeNotification, setUpgradeNotification] = useState<string | null>(null);

  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  const handleSelect = (tier: SubscriptionTier) => {
    if (tier.id === 'starter' && vehiclesCount > 5) {
      setUpgradeNotification(
        `Your fleet has ${vehiclesCount} vehicles. The Starter Tier is limited to 5 vehicles. Please select Growth or Enterprise.`
      );
      return;
    }
    setUpgradeNotification(null);
    onSelectTier(tier.id);
  };

  return (
    <div className="space-y-6">
      {/* Monetization Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center max-w-4xl mx-auto space-y-3 shadow-sm">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${activeThemeColor}15`,
            borderColor: `${activeThemeColor}30`,
            color: activeThemeColor,
          }}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>PROVEN ROI · MONETIZATION ARCHITECTURE FOR RWANDA FLEETS</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          KigaliFleet SaaS Subscription Plans
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Private car rentals in Kigali range from <strong>40,000 RWF to over 250,000 RWF per day</strong>. Eliminating a single double-booking scramble or unreported cash leakage completely covers your monthly subscription.
        </p>

        {/* Fleet size status */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <span>Active Agency Fleet:</span>
          <strong className="font-mono" style={{ color: activeThemeColor }}>{vehiclesCount} Registered Vehicles</strong>
          <span>·</span>
          <span>Current Active Tier:</span>
          <strong className="text-emerald-400 uppercase font-mono">{activeTierId}</strong>
        </div>
      </div>

      {upgradeNotification && (
        <div className="max-w-4xl mx-auto p-4 rounded-xl bg-amber-950/70 border border-amber-600 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
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
              className={`rounded-2xl p-6 space-y-6 flex flex-col justify-between transition-all relative ${
                isCurrent
                  ? 'bg-slate-900 border-2 shadow-xl'
                  : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
              }`}
              style={isCurrent ? { borderColor: activeThemeColor } : undefined}
            >
              {isCurrent && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1 ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active Agency Plan</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: activeThemeColor }}>
                    {tier.name}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono tabular-nums">
                      {formatRwf(tier.monthly_fee_rwf)}
                    </span>
                    <span className="text-xs text-slate-400">/ mo</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                    {tier.target_fleet_size}
                  </p>
                </div>

                {/* Capacity badge */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Fleet Capacity</div>
                  <div className="font-bold text-white mt-0.5">
                    {tier.max_vehicles >= 999 ? 'Unlimited Fleet Vehicles' : `Up to ${tier.max_vehicles} Vehicles`}
                  </div>
                </div>

                {/* Features */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                  {tier.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleSelect(tier)}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : isOverCapacity
                      ? 'bg-slate-800 text-slate-500 border border-slate-700'
                      : activeBtnText
                  }`}
                  style={!isCurrent && !isOverCapacity ? { backgroundColor: activeThemeColor } : undefined}
                >
                  {isCurrent
                    ? 'Current Plan Active'
                    : isOverCapacity
                    ? 'Fleet Exceeds 5 Cars'
                    : `Switch to ${tier.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
