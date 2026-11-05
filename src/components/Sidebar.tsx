import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Car,
  Users,
  ClipboardList,
  Radio,
  Globe,
  Layers,
  Plus,
  Sun,
  Moon,
  RotateCcw,
  Check,
  Share2,
  X,
  Palette,
} from 'lucide-react';
import { ColorTheme, COLOR_THEMES } from '../theme';
import { Vehicle, Driver, Booking } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewBooking: () => void;
  onOpenStorefront: () => void;
  currentTheme: ColorTheme;
  accentColorId: string;
  onSelectAccentColor: (themeId: string) => void;
  themeMode: 'dark' | 'light';
  onToggleThemeMode: () => void;
  onResetDemoData: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewBooking,
  onOpenStorefront,
  currentTheme,
  accentColorId,
  onSelectAccentColor,
  themeMode,
  onToggleThemeMode,
  onResetDemoData,
  isOpenMobile,
  onCloseMobile,
  vehicles,
  drivers,
  bookings,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'calendar',
      label: 'Fleet Timeline',
      icon: CalendarDays,
      badge: 'Live',
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      icon: Car,
      badge: vehicles.length.toString(),
    },
    {
      id: 'drivers',
      label: 'Drivers',
      icon: Users,
      badge: drivers.length.toString(),
    },
    {
      id: 'bookings',
      label: 'Dispatch & Bookings',
      icon: ClipboardList,
      badge: bookings.length.toString(),
    },
    {
      id: 'simulator',
      label: "Africa's Talking Hub",
      icon: Radio,
      badge: 'KIA',
    },
    {
      id: 'storefront',
      label: 'Public Storefront',
      icon: Globe,
      badge: 'B2B',
    },
    {
      id: 'pricing',
      label: 'Subscription Plans',
      icon: Layers,
      badge: undefined,
    },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const activeThemeObj = COLOR_THEMES.find((t) => t.id === accentColorId) || currentTheme;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold shadow-sm transition-colors ${activeThemeObj.btnText}`}
              style={{ backgroundColor: activeThemeObj.hex }}
            >
              KF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  KigaliFleet
                </span>
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: activeThemeObj.hex }}
                  title="System Online"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Rwanda Dispatch SaaS
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <button
            onClick={() => {
              onOpenNewBooking();
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full py-2.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] ${activeThemeObj.btnText}`}
            style={{ backgroundColor: activeThemeObj.hex }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Booking</span>
          </button>
        </div>

        {/* Navigation Items - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Fleet Operations
          </div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `${activeThemeObj.hex}1a`, // 10% opacity tint
                        color: activeThemeObj.hex,
                        borderLeft: `4px solid ${activeThemeObj.hex}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={isActive ? { color: activeThemeObj.hex } : undefined}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                      isActive
                        ? 'text-slate-950 font-semibold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: activeThemeObj.hex,
                            color: activeThemeObj.btnText === 'text-white' ? '#ffffff' : '#020617',
                          }
                        : undefined
                    }
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick link to Storefront */}
          <div className="pt-2">
            <button
              onClick={() => {
                onOpenStorefront();
                if (isOpenMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors border border-dashed border-slate-300 dark:border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Storefront Modal</span>
              </div>
              <span className="text-[10px] text-slate-400">Share</span>
            </button>
          </div>
        </div>

        {/* 12-Color Theme Palette Switcher Section */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Palette className="w-3.5 h-3.5" style={{ color: activeThemeObj.hex }} />
              <span>12 System Colors</span>
            </div>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold truncate max-w-[110px]"
              style={{
                backgroundColor: `${activeThemeObj.hex}22`,
                color: activeThemeObj.hex,
              }}
              title={activeThemeObj.badge}
            >
              {activeThemeObj.badge}
            </span>
          </div>

          {/* 12 Swatches Grid */}
          <div className="grid grid-cols-6 gap-1.5 mb-2.5" role="radiogroup" aria-label="12 Color Themes">
            {COLOR_THEMES.map((t) => {
              const isSelected = t.id === accentColorId;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectAccentColor(t.id)}
                  title={`${t.name} • ${t.badge}`}
                  aria-label={t.name}
                  aria-checked={isSelected}
                  role="radio"
                  className={`group relative w-7 h-7 rounded-md transition-all duration-150 flex items-center justify-center cursor-pointer shadow-xs ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110 z-10'
                      : 'hover:scale-110 opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: t.hex }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 stroke-[3] ${
                        t.btnText === 'text-white' ? 'text-white' : 'text-slate-950'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span className="truncate">{activeThemeObj.name}</span>
            <span className="font-mono text-[10px] shrink-0 text-slate-400">{activeThemeObj.hex}</span>
          </div>
        </div>

        {/* Distinct Appearance Controls: Dark/Light Mode & Reset Data */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleThemeMode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              title={`Switch background to ${themeMode === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mode: Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Mode: Dark</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onResetDemoData}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset sample vehicles, drivers and bookings to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </aside>
    </>
  );
};
