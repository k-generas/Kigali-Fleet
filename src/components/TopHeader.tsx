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
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Briefcase,
  Bell,
  BellRing,
  Plane,
  Wrench,
  CreditCard,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react';
import { ColorTheme, COLOR_THEMES } from '../theme';
import { User, Company, UserRole } from '../types';

export interface InAppNotification {
  id: string;
  category: 'flight' | 'maintenance' | 'payment' | 'booking' | 'dispatch';
  title: string;
  description: string;
  time: string;
  read: boolean;
  targetTab: string;
}

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
  currentUser?: User;
  currentCompany?: Company;
  onSwitchRole?: (role: UserRole) => void;
  onLogout?: () => void;
  isFirebaseConnected?: boolean;
  onLoginWithGoogle?: () => void;
  onNavigateTab?: (tab: string) => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  landing: {
    title: 'KigaliFleet SaaS Homepage',
    subtitle: 'Public marketing presentation, platforms ecosystem & customer onboarding',
  },
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
    subtitle: 'Manage daily rates in RWF, Contrôle Technique & category allocation',
  },
  maintenance: {
    title: 'Workshop & Maintenance Management',
    subtitle: 'CFAO & Akagera Motors work orders, vehicle grounding locks & safety compliance',
  },
  drivers: {
    title: 'Chauffeur & Driver Roster',
    subtitle: 'Kinyarwanda/English speaking drivers, ratings & mission status',
  },
  bookings: {
    title: 'Collision-Guarded Bookings',
    subtitle: 'Reservation ledger with zero-overlap protection & flight data',
  },
  dispatch: {
    title: 'Dispatch & Operations Center',
    subtitle: '5-stage mission Kanban, Rwanda Police Bon de Mission & SMS hub',
  },
  customers: {
    title: 'Client CRM & Corporate Accounts',
    subtitle: 'RRA TIN corporate profiles, Net-30 credit terms & balance dossiers',
  },
  payments: {
    title: 'Payments & RRA EBM Tax Ledger',
    subtitle: 'MTN Mobile Money, Bank of Kigali wires & EBM v2.0 18% VAT receipts',
  },
  reports: {
    title: 'Reports & Fleet Analytics',
    subtitle: 'Fleet utilization, RevPAV, vehicle ROI & monthly tax ledger',
  },
  settings: {
    title: 'Company Settings & Staff Permissions',
    subtitle: 'TIN registration, turnaround buffer rules, SMS telemetry & team access control',
  },
  'super-admin': {
    title: 'Multi-Tenant Platform Administration',
    subtitle: 'Global SaaS tenant oversight, MRR metrics in RWF & subscription management',
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
  currentUser,
  currentCompany,
  onSwitchRole,
  onLogout,
  isFirebaseConnected,
  onLoginWithGoogle,
  onNavigateTab,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'flight' | 'maintenance' | 'payment' | 'dispatch'>('all');

  const [notifications, setNotifications] = useState<InAppNotification[]>([
    {
      id: 'notif-1',
      category: 'flight',
      title: 'KIA Flight Delay: RwandAir WB204',
      description: 'Entebbe -> Kigali is delayed +45 min (Est. 15:45 CAT). Pickup buffer auto-extended.',
      time: '8m ago',
      read: false,
      targetTab: 'dispatch',
    },
    {
      id: 'notif-2',
      category: 'maintenance',
      title: 'Contrôle Technique Inspection Due',
      description: 'Land Cruiser V8 (RAD 782P) Rwanda Police safety certificate expires in 12 days.',
      time: '25m ago',
      read: false,
      targetTab: 'maintenance',
    },
    {
      id: 'notif-3',
      category: 'payment',
      title: 'MTN MoMo Payment Received',
      description: 'RWF 240,000 confirmed for BK-7821. RRA EBM v2.0 receipt auto-generated.',
      time: '1h ago',
      read: false,
      targetTab: 'payments',
    },
    {
      id: 'notif-4',
      category: 'dispatch',
      title: 'Bon de Mission Signed by Police',
      description: 'Driver Innocent Mugisha cleared for Inter-District Safari to Akagera NP.',
      time: '2h ago',
      read: true,
      targetTab: 'dispatch',
    },
    {
      id: 'notif-5',
      category: 'booking',
      title: 'Corporate Booking Confirmed',
      description: 'BK-9912 created for Bank of Kigali HQ (4x4 Prado TXL). Zero collision detected.',
      time: '3h ago',
      read: true,
      targetTab: 'bookings',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleNotificationClick = (targetTab: string, id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setIsNotificationsOpen(false);
    onNavigateTab?.(targetTab);
  };

  const filteredNotifications = notifications.filter(
    (n) => notificationFilter === 'all' || n.category === notificationFilter
  );

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

          {/* In-App Notifications Center (Blueprint Section 20) */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Operational Notifications & Dispatch Alerts"
              aria-label="Notifications"
            >
              {unreadCount > 0 ? (
                <BellRing className="w-4 h-4 text-amber-500 animate-pulse" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs"
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Operational Alerts
                        </h4>
                        <div className="text-[10px] text-slate-400">
                          {unreadCount} unread mission & fleet notices
                        </div>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'flight', label: 'KIA Flights' },
                        { id: 'maintenance', label: 'Workshop' },
                        { id: 'payment', label: 'MoMo/EBM' },
                        { id: 'dispatch', label: 'Dispatches' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setNotificationFilter(f.id)}
                        className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                          notificationFilter === f.id
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Notification List */}
                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No notifications in this category.
                      </div>
                    ) : (
                      filteredNotifications.map((notif) => {
                        const getCategoryIcon = () => {
                          switch (notif.category) {
                            case 'flight':
                              return <Plane className="w-3.5 h-3.5 text-sky-400" />;
                            case 'maintenance':
                              return <Wrench className="w-3.5 h-3.5 text-rose-400" />;
                            case 'payment':
                              return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
                            case 'dispatch':
                              return <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />;
                            default:
                              return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
                          }
                        };

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif.targetTab, notif.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                              notif.read
                                ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/80 opacity-75 hover:opacity-100'
                                : 'bg-slate-100/90 dark:bg-slate-800 border-amber-500/40 shadow-xs'
                            }`}
                          >
                            <div className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-900/80 shrink-0 mt-0.5">
                              {getCategoryIcon()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h5 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                                  {notif.title}
                                </h5>
                                <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                  {notif.time}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                                {notif.description}
                              </p>
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/40">
                                <span className="text-[9px] font-mono text-amber-500 font-semibold hover:underline">
                                  Open {notif.targetTab} →
                                </span>
                                <button
                                  onClick={(e) => handleToggleRead(notif.id, e)}
                                  className="text-[9px] text-slate-400 hover:text-slate-200 font-medium"
                                >
                                  {notif.read ? 'Mark unread' : 'Mark read'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Live Firestore DB Badge */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-colors ${
              isFirebaseConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
            }`}
            title="Real-time Firebase Firestore database sync status"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isFirebaseConnected ? 'Firestore Live' : 'Firestore Syncing'}</span>
          </div>

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

          {/* User Profile & Interactive Role Switcher */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Switch active role or log out"
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs font-mono"
                  style={{
                    backgroundColor: `${currentTheme.hex}30`,
                    color: currentTheme.hex,
                  }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize font-mono leading-none mt-0.5">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
                    <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</div>
                      {currentCompany && (
                        <div className="text-[10px] text-amber-500 font-semibold mt-0.5 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          <span className="truncate">{currentCompany.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Switch Role (Part 2 Testing)
                      </div>
                      {(['owner', 'manager', 'dispatcher', 'driver', 'superadmin'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            onSwitchRole?.(r);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                            currentUser.role === r
                              ? 'bg-amber-500/15 text-amber-500 font-bold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="capitalize">{r === 'superadmin' ? 'Super Admin' : r}</span>
                          {currentUser.role === r && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>

                    {onLoginWithGoogle && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => {
                            onLoginWithGoogle();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span>Sign in with Google</span>
                        </button>
                      </div>
                    )}

                    {onLogout && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => {
                            onLogout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out to Homepage</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
