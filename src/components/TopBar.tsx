import React from 'react';
import { Sun, Moon, Plus, Car, Calendar, Users, FileText, Share2, Layers, MessageSquare } from 'lucide-react';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewBooking: () => void;
  onOpenStorefront: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewBooking,
  onOpenStorefront,
  theme,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Car },
    { id: 'calendar', label: 'Fleet Timeline', icon: Calendar },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'bookings', label: 'Dispatch & Bookings', icon: FileText },
    { id: 'simulator', label: "Africa's Talking & Flight Hub", icon: MessageSquare },
    { id: 'storefront', label: 'Public Storefront', icon: Share2 },
    { id: 'pricing', label: 'Subscription Plans', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-4 lg:px-8 py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-extrabold text-slate-950 shadow-sm">
            KF
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              KigaliFleet
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Rwanda Dispatch SaaS
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenStorefront}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-md transition-colors whitespace-nowrap"
            title="Open B2B / Tourist Storefront Link"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Storefront Link</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Mobile nav subrow */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto pt-2 pb-1 border-t border-slate-800 mt-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              currentTab === item.id
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
