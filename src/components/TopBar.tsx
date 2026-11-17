import React from 'react';
import { Sun, Moon, Plus, Car, Calendar, Users, FileText, Share2, Layers, MessageSquare } from 'lucide-react';
import { useI18n } from '../utils/i18n';

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
  const { tr } = useI18n();
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
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg accent-bg flex items-center justify-center font-semibold text-sm shadow-xs">
            KF
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-slate-900 dark:text-white whitespace-nowrap">
              KigaliFleet
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {tr('Car Rental App')}
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
                className={`px-3 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'font-medium text-slate-900 dark:text-white accent-border'
                    : 'font-normal text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tr(item.label)}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenStorefront}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Share2 className="w-4 h-4 accent-text" />
            <span>{tr('Share Link')}</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title={theme === 'dark' ? tr('Light') : tr('Dark')}
            aria-label={tr('Screen Mode')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium accent-bg rounded-lg hover:opacity-95 transition-opacity whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('New Booking')}</span>
          </button>
        </div>
      </div>

      <div className="md:hidden grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800 mt-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-2 py-1.5 text-xs rounded-md whitespace-nowrap ${
              currentTab === item.id
                ? 'font-semibold accent-tint accent-text'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {tr(item.label)}
          </button>
        ))}
      </div>
    </header>
  );
};
