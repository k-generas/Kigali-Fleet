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
    { id: 'overview', label: 'Home', icon: Car },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'vehicles', label: 'Cars', icon: Car },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'bookings', label: 'Trips', icon: FileText },
    { id: 'simulator', label: 'Driver Text', icon: MessageSquare },
    { id: 'storefront', label: 'Booking Page', icon: Share2 },
    { id: 'pricing', label: 'Plans', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-100 px-4 lg:px-8 py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-extrabold text-slate-950 shadow-sm">
            KF
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-[#0a2540] dark:text-white whitespace-nowrap">
              KigaliFleet
            </span>
            <span className="text-sm font-medium text-[#425466] dark:text-slate-400 whitespace-nowrap">
              Car Rental Helper
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                    : 'text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white hover:bg-[#f6f9fc] dark:hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenStorefront}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0a2540] dark:text-slate-200 bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full transition-colors whitespace-nowrap"
          >
            <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Share Link</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white rounded-full hover:bg-[#f6f9fc] dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Light or Dark"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#0a2540]" />}
          </button>

          <button
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-full transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Trip</span>
          </button>
        </div>
      </div>

      <div className="md:hidden grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 pb-1 border-t border-slate-200 dark:border-slate-800 mt-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap ${
              currentTab === item.id
                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                : 'text-[#425466] dark:text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
