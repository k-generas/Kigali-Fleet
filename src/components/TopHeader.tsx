import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu,
  Plus,
  Share2,
  Check,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Briefcase,
  Bell,
  BellRing,
  Plane,
  Wrench,
  CreditCard,
  CheckCheck,
  AlertTriangle,
  Palette,
  Sun,
  Moon,
  Settings,
  Building2,
  Users,
  X,
} from 'lucide-react';
import { ColorTheme, COLOR_THEMES } from '../theme';
import { User, Company, UserRole, SuperAdminModuleId } from '../types';
import { isSuperAdminUser } from '../utils/auth';

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
  onOpenSuperAdminModule?: (module: SuperAdminModuleId) => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  landing: {
    title: 'KigaliFleet',
    subtitle: 'Simple car rental, driver, and booking management',
  },
  overview: {
    title: 'Dashboard',
    subtitle: 'Today’s cars, drivers, bookings, and airport flights',
  },
  calendar: {
    title: 'Trip Calendar',
    subtitle: 'See which cars are booked or free on any day',
  },
  vehicles: {
    title: 'Cars',
    subtitle: 'All your cars, daily prices in RWF, and car check dates',
  },
  maintenance: {
    title: 'Repairs',
    subtitle: 'Track cars in the garage so nobody books a broken car',
  },
  drivers: {
    title: 'Drivers',
    subtitle: 'Your driver list, phone numbers, and current trips',
  },
  bookings: {
    title: 'Bookings',
    subtitle: 'All customer trips, dates, prices, and payment status',
  },
  dispatch: {
    title: 'Send Drivers',
    subtitle: 'Assign a driver and send trip details by SMS',
  },
  customers: {
    title: 'Customers',
    subtitle: 'Repeat guests, tour companies, and unpaid balances',
  },
  payments: {
    title: 'Payments',
    subtitle: 'Mobile Money, bank payments, and customer receipts',
  },
  reports: {
    title: 'Reports',
    subtitle: 'How much money your cars earned and monthly totals',
  },
  settings: {
    title: 'Settings & Staff',
    subtitle: 'Company details, staff access, and business rules',
  },
  'super-admin': {
    title: 'Admin Control',
    subtitle: 'Manage all companies, plans, money, and safety logs',
  },
  simulator: {
    title: 'SMS Test',
    subtitle: 'Test sending trip text messages to drivers',
  },
  storefront: {
    title: 'Booking Website',
    subtitle: 'The page where customers pick a car and book online',
  },
  handovers: {
    title: 'Car Checks',
    subtitle: 'Check fuel, mileage, and scratches before and after each trip',
  },
  expenses: {
    title: 'Costs',
    subtitle: 'Fuel, repairs, driver allowances, and daily costs',
  },
  tasks: {
    title: 'To-Do List',
    subtitle: 'Daily jobs for your team like car washes and airport pickups',
  },
  pricing: {
    title: 'Plans',
    subtitle: 'Pick a monthly plan that fits the number of cars you own',
  },
};

const ROLE_NAMES: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  dispatcher: 'Booking Staff',
  accountant: 'Accountant',
  fleet_manager: 'Car Manager',
  mechanic: 'Mechanic',
  driver: 'Driver',
  receptionist: 'Front Desk',
  superadmin: 'Admin',
};

type ProfileMenuPanel = 'menu' | 'alerts' | 'theme';

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
  currentUser,
  currentCompany,
  onSwitchRole,
  onLogout,
  onLoginWithGoogle,
  onNavigateTab,
  onOpenSuperAdminModule,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<ProfileMenuPanel>('menu');
  const [avatarError, setAvatarError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; right: number }>({
    top: 64,
    right: 16,
  });
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const [notificationFilter, setNotificationFilter] = useState<
    'all' | 'flight' | 'maintenance' | 'payment' | 'dispatch'
  >('all');

  const [notifications, setNotifications] = useState<InAppNotification[]>([
    {
      id: 'notif-1',
      category: 'flight',
      title: 'Flight Late: RwandAir WB204',
      description: 'Entebbe to Kigali is 45 minutes late (arrives 15:45). Pickup time updated.',
      time: '8m ago',
      read: false,
      targetTab: 'dispatch',
    },
    {
      id: 'notif-2',
      category: 'maintenance',
      title: 'Car Check Due Soon',
      description: 'Land Cruiser V8 (RAD 782P) safety check ends in 12 days.',
      time: '25m ago',
      read: false,
      targetTab: 'maintenance',
    },
    {
      id: 'notif-3',
      category: 'payment',
      title: 'MoMo Payment Received',
      description: '240,000 RWF paid for booking BK-7821. Receipt is ready.',
      time: '1h ago',
      read: false,
      targetTab: 'payments',
    },
    {
      id: 'notif-4',
      category: 'dispatch',
      title: 'Trip Sheet Approved',
      description: 'Driver Innocent Mugisha is ready for the Akagera safari trip.',
      time: '2h ago',
      read: true,
      targetTab: 'dispatch',
    },
    {
      id: 'notif-5',
      category: 'booking',
      title: 'New Company Booking',
      description: 'BK-9912 saved for Bank of Kigali (Prado TXL). Car is free.',
      time: '3h ago',
      read: true,
      targetTab: 'bookings',
    },
  ]);

  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.avatar_url]);

  const updatePopoverPosition = () => {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
    setIsMobile(mobile);
    if (profileButtonRef.current && !mobile) {
      const rect = profileButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  };

  useEffect(() => {
    if (!isUserMenuOpen) {
      setMenuPanel('menu');
      return;
    }
    updatePopoverPosition();
    const onResize = () => updatePopoverPosition();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isUserMenuOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isSuper = isSuperAdminUser(currentUser);
  const showGooglePhoto = Boolean(currentUser?.avatar_url && !avatarError);

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
    setIsUserMenuOpen(false);
    onNavigateTab?.(targetTab);
  };

  const filteredNotifications = notifications.filter(
    (n) => notificationFilter === 'all' || n.category === notificationFilter
  );

  const currentTabInfo = TAB_TITLES[currentTab] || {
    title: 'KigaliFleet',
    subtitle: 'Manage your cars, drivers, and bookings',
  };

  const userInitial = currentUser?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  const profileMenuPortal =
    isUserMenuOpen && currentUser ? (
      <div className="contents">
        <div
          className="fixed inset-0 z-[9998] bg-slate-900/50 backdrop-blur-2xs"
          onClick={() => setIsUserMenuOpen(false)}
          aria-hidden="true"
        />
        <div
          className={
            isMobile
              ? 'fixed inset-x-0 bottom-0 z-[9999] max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4'
              : 'fixed z-[9999] w-[360px] max-h-[86vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3'
          }
          style={
            !isMobile
              ? {
                  top: `${popoverPosition.top}px`,
                  right: `${popoverPosition.right}px`,
                }
              : undefined
          }
        >
          {isMobile && (
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-1" />
          )}

          {/* MAIN ACCOUNT MENU VIEW */}
          {menuPanel === 'menu' && (
            <>
              {/* User & Platform Owner Identity Card */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold text-base shrink-0 border border-slate-200 dark:border-slate-700"
                    style={
                      !showGooglePhoto
                        ? { backgroundColor: `${currentTheme.hex}25`, color: currentTheme.hex }
                        : undefined
                    }
                  >
                    {showGooglePhoto ? (
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-[#0a2540] dark:text-white truncate max-w-[175px]">
                        {currentUser.name}
                      </span>
                      {isSuper && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentTheme.btnText}`}
                          style={{ backgroundColor: currentTheme.hex }}
                        >
                          Platform Owner
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#425466] dark:text-slate-400 truncate mt-0.5 font-mono">
                      {currentUser.email}
                    </div>
                    {currentCompany && (
                      <div
                        className="text-xs font-semibold mt-1 flex items-center gap-1.5 truncate"
                        style={{ color: currentTheme.hex }}
                      >
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{currentCompany.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsUserMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close account menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alerts + Theme Shortcuts */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setMenuPanel('alerts')}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      {unreadCount > 0 ? (
                        <BellRing className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#0a2540] dark:text-white">
                        Alerts & Updates
                      </div>
                      <div className="text-xs text-[#425466] dark:text-slate-400">
                        {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs font-mono">
                        {unreadCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuPanel('theme')}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${currentTheme.hex}20`, color: currentTheme.hex }}
                    >
                      <Palette className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#0a2540] dark:text-white">
                        Screen & Colors
                      </div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 truncate">
                        {currentTheme.name} · {themeMode === 'dark' ? 'Dark' : 'Light'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="w-4 h-4 rounded-full border border-white dark:border-slate-900 shadow-xs"
                      style={{ backgroundColor: currentTheme.hex }}
                    />
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              </div>

              {/* Super Admin Settings Section (Private to verified Super Admins) */}
              {isSuper && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#425466] dark:text-slate-400">
                      Super Admin Settings
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      Owner Access
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSuperAdminModule?.('settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-semibold bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4 shrink-0" style={{ color: currentTheme.hex }} />
                      <span className="truncate">Main Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSuperAdminModule?.('overview');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-semibold bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white flex items-center gap-2 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: currentTheme.hex }} />
                      <span className="truncate">Admin Desk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSuperAdminModule?.('companies');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-semibold bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white flex items-center gap-2 transition-colors"
                    >
                      <Building2 className="w-4 h-4 shrink-0" style={{ color: currentTheme.hex }} />
                      <span className="truncate">Companies</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSuperAdminModule?.('admins');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-semibold bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white flex items-center gap-2 transition-colors"
                    >
                      <Users className="w-4 h-4 shrink-0" style={{ color: currentTheme.hex }} />
                      <span className="truncate">Admin Team</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Switch Role View (Collapsible so menu stays compact) */}
              <details className="pt-2 border-t border-slate-200 dark:border-slate-800 group">
                <summary className="px-1 py-1 text-xs font-bold uppercase tracking-wider text-[#425466] dark:text-slate-400 cursor-pointer list-none flex items-center justify-between hover:text-[#0a2540] dark:hover:text-white">
                  <span>Switch View ({ROLE_NAMES[currentUser.role] || currentUser.role})</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-0.5">
                  {(
                    [
                      { role: 'owner', label: 'Owner' },
                      { role: 'manager', label: 'Manager' },
                      { role: 'dispatcher', label: 'Booking Staff' },
                      { role: 'accountant', label: 'Accountant' },
                      { role: 'fleet_manager', label: 'Car Manager' },
                      { role: 'mechanic', label: 'Mechanic' },
                      { role: 'driver', label: 'Driver' },
                      { role: 'receptionist', label: 'Front Desk' },
                      ...(isSuper ? [{ role: 'superadmin' as UserRole, label: 'Admin Control' }] : []),
                    ] as { role: UserRole; label: string }[]
                  ).map(({ role: r, label }) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        onSwitchRole?.(r);
                        setIsUserMenuOpen(false);
                      }}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        currentUser.role === r
                          ? 'font-semibold'
                          : 'text-[#425466] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      style={
                        currentUser.role === r
                          ? { backgroundColor: `${currentTheme.hex}18`, color: currentTheme.hex }
                          : undefined
                      }
                    >
                      <span className="truncate">{label}</span>
                      {currentUser.role === r && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </details>

              {/* Google Account & Sign Out */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                {onLoginWithGoogle && (
                  <button
                    type="button"
                    onClick={() => {
                      onLoginWithGoogle();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-sm font-semibold text-[#0a2540] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{showGooglePhoto ? 'Switch Google Account' : 'Continue with Google'}</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* ALERTS SUB-PANEL */}
          {menuPanel === 'alerts' && (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setMenuPanel('menu')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <div className="text-sm font-bold text-[#0a2540] dark:text-white">
                  Alerts ({unreadCount})
                </div>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                ) : (
                  <span className="w-12" />
                )}
              </div>

              <div className="grid grid-cols-5 gap-1 text-xs">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'flight', label: 'Flights' },
                    { id: 'maintenance', label: 'Repairs' },
                    { id: 'payment', label: 'Money' },
                    { id: 'dispatch', label: 'Drivers' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setNotificationFilter(f.id)}
                    className={`py-1.5 px-1 rounded-lg font-medium text-center truncate transition-colors ${
                      notificationFilter === f.id
                        ? 'bg-[#0a2540] text-white dark:bg-white dark:text-[#0a2540] font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-6 text-sm text-[#425466] dark:text-slate-400">
                    No alerts here.
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const getCategoryIcon = () => {
                      switch (notif.category) {
                        case 'flight':
                          return <Plane className="w-4 h-4 text-sky-500" />;
                        case 'maintenance':
                          return <Wrench className="w-4 h-4 text-rose-500" />;
                        case 'payment':
                          return <CreditCard className="w-4 h-4 text-emerald-500" />;
                        case 'dispatch':
                          return <ShieldCheck className="w-4 h-4 text-violet-500" />;
                        default:
                          return <AlertTriangle className="w-4 h-4 text-amber-500" />;
                      }
                    };

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.targetTab, notif.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          notif.read
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'
                            : 'bg-white dark:bg-slate-800 border-amber-400/50 shadow-xs'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 shrink-0 mt-0.5">
                          {getCategoryIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-sm font-semibold text-[#0a2540] dark:text-white truncate">
                              {notif.title}
                            </h5>
                            <span className="text-xs text-[#425466] dark:text-slate-400 shrink-0">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-xs text-[#425466] dark:text-slate-300 mt-1 leading-relaxed">
                            {notif.description}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                            <span
                              className="text-xs font-semibold hover:underline"
                              style={{ color: currentTheme.hex }}
                            >
                              Open →
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleToggleRead(notif.id, e)}
                              className="text-xs text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white font-medium"
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
            </>
          )}

          {/* THEME & COLORS SUB-PANEL */}
          {menuPanel === 'theme' && (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setMenuPanel('menu')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <div className="text-sm font-bold text-[#0a2540] dark:text-white">
                  Screen & Colors
                </div>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-bold text-[#0a2540] dark:text-slate-200">
                  Screen Mode
                </span>
                <div className="grid grid-cols-2 gap-2 bg-[#f6f9fc] dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (themeMode !== 'light') onToggleThemeMode();
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
                      themeMode === 'light'
                        ? 'bg-white text-[#0a2540] shadow-xs border border-slate-200'
                        : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light</span>
                    {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (themeMode !== 'dark') onToggleThemeMode();
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
                      themeMode === 'dark'
                        ? 'bg-slate-900 text-white shadow-xs border border-slate-700'
                        : 'text-[#425466] hover:text-[#0a2540] dark:hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>Dark</span>
                    {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0a2540] dark:text-slate-200">
                    Pick a Color
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold truncate max-w-[160px]"
                    style={{
                      backgroundColor: `${currentTheme.hex}20`,
                      color: currentTheme.hex,
                    }}
                  >
                    {currentTheme.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {COLOR_THEMES.map((t) => {
                    const isSelected = t.id === accentColorId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectAccentColor(t.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border ${
                          isSelected
                            ? 'bg-[#f6f9fc] dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                            : 'border-transparent hover:bg-[#f6f9fc] dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-lg shrink-0 flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: t.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3 h-3 stroke-[3] ${
                                t.btnText === 'text-white' ? 'text-white' : 'text-slate-950'
                              }`}
                            />
                          )}
                        </span>
                        <span className="text-sm font-semibold text-[#0a2540] dark:text-slate-200 truncate">
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    ) : null;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0d1424]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile menu + Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-[#0a2540] dark:text-white tracking-tight truncate">
              {currentTabInfo.title}
            </h1>
            <p className="hidden md:block text-sm text-[#425466] dark:text-slate-400 truncate mt-0.5">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Actions: Clean Booking Actions + Unified Profile Icon */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenStorefront}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#0a2540] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full transition-colors whitespace-nowrap"
            title="Share your booking website"
          >
            <Share2 className="w-4 h-4" style={{ color: currentTheme.hex }} />
            <span>Booking Website</span>
          </button>

          <button
            onClick={onOpenNewBooking}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full transition-all shadow-xs active:scale-95 whitespace-nowrap ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">Book</span>
          </button>

          {currentUser && (
            <button
              ref={profileButtonRef}
              onClick={() => {
                if (!isUserMenuOpen) updatePopoverPosition();
                setIsUserMenuOpen(!isUserMenuOpen);
              }}
              className="relative flex items-center gap-2.5 p-1 sm:pr-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Account, Alerts, Theme & Settings"
              aria-label="Open account menu"
              aria-expanded={isUserMenuOpen}
            >
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs border border-white/60 dark:border-slate-700"
                  style={
                    !showGooglePhoto
                      ? { backgroundColor: `${currentTheme.hex}25`, color: currentTheme.hex }
                      : undefined
                  }
                >
                  {showGooglePhoto ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-amber-500 text-slate-950 font-bold text-[10px] leading-none rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                    title={`${unreadCount} unread alerts`}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="hidden xl:block text-left">
                <div className="text-sm font-semibold text-[#0a2540] dark:text-white leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-xs text-[#425466] dark:text-slate-400 leading-tight">
                  {ROLE_NAMES[currentUser.role] || currentUser.role}
                </div>
              </div>
              <ChevronDown className="hidden sm:block w-4 h-4 text-[#425466] dark:text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {typeof document !== 'undefined' && profileMenuPortal && createPortal(profileMenuPortal, document.body)}
    </header>
  );
};
