import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Share2,
  Sun,
  Moon,
  Sparkles,
  Palette,
  Check,
  X,
} from 'lucide-react';
import { ColorTheme, COLOR_THEMES } from '../theme';

interface TopHeaderProps {
  currentTab: string;
  onOpenMobileMenu: () => void;
  onOpenNewBooking: () => void;
  onOpenStorefront: () => void;
  currentTheme: ColorTheme;
  accentColorId: string;
  onSelectAccentColor: (themeId: string) => void;
  themeMode: 'dark' | 'light';
  onToggleThemeMode: () => void;
  activeTierName: string;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: 'Fleet Operations Overview',
    subtitle: 'Real-time telemetry, active missions & KIA flight monitors',
  },
  calendar: {
    title: 'Live Fleet Timeline',
    subtitle: 'Interactive multi-day visual Gantt scheduling & conflict detection',
  },
  vehicles: {
    title: 'Vehicle Fleet Inventory',
    subtitle: 'Manage daily rates in RWF, workshop service & category allocation',
  },
  drivers: {
    title: 'Chauffeur & Driver Roster',
    subtitle: 'Kinyarwanda/English speaking drivers, ratings & mission status',
  },
  bookings: {
    title: 'Collision-Guarded Bookings',
    subtitle: 'Reservation ledger with zero-overlap protection & flight data',
  },
  simulator: {
    title: "Africa's Talking & Flight Simulator",
    subtitle: 'SMS/USSD dispatch triggers and Kigali International Airport sync',
  },
  storefront: {
    title: 'Public B2B & Tourist Storefront',
    subtitle: 'Mobile-first client reservation portal with MoMo checkout preview',
  },
  pricing: {
    title: 'SaaS Subscription Plans',
    subtitle: 'Starter, Growth & Enterprise tiers tailored for Kigali operators',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenNewBooking,
  onOpenStorefront,
  currentTheme,
  accentColorId,
  onSelectAccentColor,
  themeMode,
  onToggleThemeMode,
  activeTierName,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const currentTabInfo = TAB_TITLES[currentTab] || {
    title: 'KigaliFleet SaaS',
    subtitle: 'Fleet management & dispatch',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {currentTabInfo.title}
              </h1>
              <span
                className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold shrink-0"
                style={{
                  backgroundColor: `${currentTheme.hex}18`,
                  color: currentTheme.hex,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: currentTheme.hex }}
                />
                {currentTheme.name}
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions and Color Theme Picker */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Dedicated 12-Color Theme Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-xs"
              title="Change System Color Theme (12 Rwandan palettes available)"
            >
              <Palette className="w-4 h-4" style={{ color: currentTheme.hex }} />
              <span className="hidden sm:inline">Theme Color</span>
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs shrink-0"
                style={{ backgroundColor: currentTheme.hex }}
              />
            </button>

            {/* 12-Color Modal / Popover */}
            {isPaletteOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs"
                  onClick={() => setIsPaletteOpen(false)}
                />
                <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4.5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" style={{ color: currentTheme.hex }} />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        System Color Palette (12 Themes)
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsPaletteOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Select a Rwandan regional accent. Changes buttons, status badges, timelines, navigation, and live storefront highlights across the entire app.
                  </p>

                  {/* 12 Colors Grid */}
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {COLOR_THEMES.map((t) => {
                      const isSelected = t.id === accentColorId;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            onSelectAccentColor(t.id);
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all border ${
                            isSelected
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 shadow-xs'
                              : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: t.hex }}
                          >
                            {isSelected && (
                              <Check
                                className={`w-3.5 h-3.5 stroke-[3] ${
                                  t.btnText === 'text-white' ? 'text-white' : 'text-slate-950'
                                }`}
                              />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {t.badge}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Live Mini Preview */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Live Color Preview
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs"
                        style={{
                          backgroundColor: currentTheme.hex,
                          color: currentTheme.btnText === 'text-white' ? '#fff' : '#020617',
                        }}
                      >
                        Primary Action
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold font-mono"
                        style={{
                          backgroundColor: `${currentTheme.hex}20`,
                          color: currentTheme.hex,
                        }}
                      >
                        Status Badge
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 pt-2">
                    Looking to toggle Dark/Light mode? Use the Sun/Moon button next to this palette.
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Separate Appearance Mode: Light / Dark Toggle */}
          <button
            onClick={onToggleThemeMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle dark and light background mode"
          >
            {themeMode === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>

          {/* Storefront button */}
          <button
            onClick={onOpenStorefront}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            title="Open B2B / Tourist Storefront Link"
          >
            <Share2 className="w-3.5 h-3.5" style={{ color: currentTheme.hex }} />
            <span>Storefront Link</span>
          </button>

          {/* New Booking CTA */}
          <button
            onClick={onOpenNewBooking}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs active:scale-95 whitespace-nowrap ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">Book</span>
          </button>
        </div>
      </div>
    </header>
  );
};
