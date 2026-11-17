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
  LayoutDashboard,
  Calendar,
  Car,
  FileText,
  Radio,
  BarChart3,
  LayoutGrid,
} from 'lucide-react';
import { ColorTheme, COLOR_THEMES } from '../theme';
import { User, Company, UserRole, SuperAdminModuleId } from '../types';
import { isSuperAdminUser } from '../utils/auth';
import { useI18n } from '../utils/i18n';
import { LocaleCurrencySwitcher } from './LocaleCurrencySwitcher';

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
  isDemoMode?: boolean;
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
    title: 'Trip calendar',
    subtitle: 'See which cars are booked or free on any day',
  },
  vehicles: {
    title: 'Cars',
    subtitle: 'All your cars, daily prices, and car check dates',
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
    title: 'Send drivers',
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
    title: 'Settings',
    subtitle: 'Company details, staff access, and business rules',
  },
  'super-admin': {
    title: 'Admin control',
    subtitle: 'Manage all companies, plans, money, and safety logs',
  },
  simulator: {
    title: 'SMS test',
    subtitle: 'Test sending trip text messages to drivers',
  },
  storefront: {
    title: 'Booking website',
    subtitle: 'The page where customers pick a car and book online',
  },
  handovers: {
    title: 'Car checks',
    subtitle: 'Check fuel, mileage, and scratches before and after each trip',
  },
  expenses: {
    title: 'Costs',
    subtitle: 'Fuel, repairs, driver allowances, and daily costs',
  },
  tasks: {
    title: 'Team to-do list',
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
  onSelectAccentColor,
  themeMode,
  onToggleThemeMode,
  currentUser,
  currentCompany,
  onSwitchRole,
  onLogout,
  isDemoMode = false,
  onLoginWithGoogle,
  onNavigateTab,
  onOpenSuperAdminModule,
}) => {
  const { tr, formatMoney } = useI18n();
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
      description: `${formatMoney(240000)} paid for booking BK-7821. Receipt is ready.`,
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
  const activeHex = themeMode === 'dark' ? currentTheme.darkHex : currentTheme.hex;

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

  const userRole = currentUser?.role || 'owner';
  const quickNavItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      shortLabel: 'Home',
      icon: LayoutDashboard,
      roles: ['owner', 'manager', 'dispatcher', 'accountant', 'fleet_manager', 'mechanic', 'driver', 'receptionist', 'superadmin'],
    },
    {
      id: 'calendar',
      label: 'Trip calendar',
      shortLabel: 'Calendar',
      icon: Calendar,
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'receptionist', 'superadmin'],
    },
    {
      id: 'vehicles',
      label: 'Cars',
      shortLabel: 'Cars',
      icon: Car,
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'mechanic', 'superadmin'],
    },
    {
      id: 'bookings',
      label: 'Bookings',
      shortLabel: 'Trips',
      icon: FileText,
      roles: ['owner', 'manager', 'dispatcher', 'accountant', 'receptionist', 'superadmin'],
    },
    {
      id: 'maintenance',
      label: 'Repairs',
      shortLabel: 'Repairs',
      icon: Wrench,
      roles: ['owner', 'manager', 'fleet_manager', 'mechanic', 'superadmin'],
    },
    {
      id: 'drivers',
      label: 'Drivers',
      shortLabel: 'Drivers',
      icon: Users,
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'driver', 'superadmin'],
    },
    {
      id: 'dispatch',
      label: 'Send drivers',
      shortLabel: 'Send',
      icon: Radio,
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'driver', 'superadmin'],
    },
    {
      id: 'payments',
      label: 'Payments',
      shortLabel: 'Money',
      icon: CreditCard,
      roles: ['owner', 'manager', 'accountant', 'receptionist', 'superadmin'],
    },
    {
      id: 'reports',
      label: 'Reports',
      shortLabel: 'Reports',
      icon: BarChart3,
      roles: ['owner', 'manager', 'accountant', 'superadmin'],
    },
    ...(isSuper
      ? [
          {
            id: 'super-admin',
            label: 'Admin control',
            shortLabel: 'Admin',
            icon: ShieldCheck,
            roles: ['superadmin'],
          },
        ]
      : []),
  ].filter((item) => item.roles.includes(userRole));

  const mobileQuickItems = quickNavItems.slice(0, 4);
  const isSecondaryTab = !quickNavItems.some((item) => item.id === currentTab);
  const userInitial = currentUser?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  const profileMenuPortal =
    isUserMenuOpen && currentUser ? (
      <div className="contents">
        <div
          className="fixed inset-0 z-[9998] bg-slate-950/45 backdrop-blur-[1px]"
          onClick={() => setIsUserMenuOpen(false)}
          aria-hidden="true"
        />
        <div
          className={
            isMobile
              ? 'fixed inset-x-0 bottom-0 z-[9999] max-h-[88vh] overflow-y-auto rounded-t-xl bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 kf-modal p-5 space-y-4'
              : 'fixed z-[9999] w-[360px] max-h-[86vh] overflow-y-auto rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 kf-modal p-4 space-y-3'
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
          {/* MAIN ACCOUNT MENU VIEW */}
          {menuPanel === 'menu' && (
            <>
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center font-semibold text-base shrink-0 border border-slate-200 dark:border-slate-700"
                    style={
                      !showGooglePhoto
                        ? { backgroundColor: `${activeHex}20`, color: activeHex }
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[175px]">
                        {currentUser.name}
                      </span>
                      {isSuper && (
                        <span className="text-xs font-medium accent-text">
                          · {tr('Platform Owner')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono mt-0.5">
                      {currentUser.email}
                    </div>
                    {currentCompany && (
                      <div className="text-xs font-medium mt-1 flex items-center gap-1.5 truncate accent-text">
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{currentCompany.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsUserMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close account menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Currency & Language Switcher inside Menu */}
              <div className="flex items-center justify-between gap-2 pb-1">
                <LocaleCurrencySwitcher currentTheme={currentTheme} compact />
              </div>

              {/* Alerts + Theme Shortcuts */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMenuPanel('alerts')}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-2 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {unreadCount > 0 ? (
                      <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {tr('Alerts & Updates')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {unreadCount > 0 ? tr(`${unreadCount} unread updates`) : tr('All caught up')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {unreadCount > 0 && (
                      <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {unreadCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuPanel('theme')}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-2 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Palette className="w-4 h-4 shrink-0" style={{ color: activeHex }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {tr('Screen & Colors')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {currentTheme.name} · {tr(themeMode === 'dark' ? 'Dark' : 'Light')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="w-4 h-4 rounded-full border border-black/15 dark:border-white/20"
                      style={{ backgroundColor: activeHex }}
                    />
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              </div>

              {/* Super Admin Settings Section */}
              {isSuper && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {tr('Super Admin Settings')}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {tr('Owner Access')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSuperAdminModule?.('settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 shrink-0" style={{ color: activeHex }} />
                      <span className="truncate">{tr('Main Settings')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSuperAdminModule?.('overview');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: activeHex }} />
                      <span className="truncate">{tr('Admin Desk')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSuperAdminModule?.('companies');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: activeHex }} />
                      <span className="truncate">{tr('Companies')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSuperAdminModule?.('admins');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 shrink-0" style={{ color: activeHex }} />
                      <span className="truncate">{tr('Admin Team')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Switch Role View */}
              <details className="pt-2 border-t border-slate-100 dark:border-slate-800 group">
                <summary className="py-1 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer list-none flex items-center justify-between hover:text-slate-900 dark:hover:text-white">
                  <span>{tr(`Switch View (${ROLE_NAMES[currentUser.role] || currentUser.role})`)}</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
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
                      className={`px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentUser.role === r
                          ? 'font-semibold accent-tint accent-text'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{tr(label)}</span>
                      {currentUser.role === r && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </details>

              {/* Google Account & Sign Out */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {onLoginWithGoogle && (
                  <button
                    type="button"
                    onClick={() => {
                      onLoginWithGoogle();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{tr(showGooglePhoto ? 'Switch Google Account' : 'Continue with Google')}</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:bg-red-50/70 dark:hover:bg-red-500/10 flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{tr('Sign Out')}</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* ALERTS SUB-PANEL */}
          {menuPanel === 'alerts' && (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setMenuPanel('menu')}
                  className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{tr('Back')}</span>
                </button>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {tr(`Alerts (${unreadCount})`)}
                </div>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium accent-text hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{tr('Read all')}</span>
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
                    className={`py-1.5 px-1 rounded-md text-center truncate border transition-colors ${
                      notificationFilter === f.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white font-medium'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tr(f.label)}
                  </button>
                ))}
              </div>

              <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                    {tr('No alerts here.')}
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const getCategoryIcon = () => {
                      switch (notif.category) {
                        case 'flight':
                          return <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
                        case 'maintenance':
                          return <Wrench className="w-4 h-4 text-red-600 dark:text-red-400" />;
                        case 'payment':
                          return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
                        case 'dispatch':
                          return <ShieldCheck className="w-4 h-4 accent-text" />;
                        default:
                          return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
                      }
                    };

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.targetTab, notif.id)}
                        className={`p-3 cursor-pointer flex items-start gap-2.5 transition-colors ${
                          notif.read
                            ? 'bg-white dark:bg-[#111827] opacity-75 hover:opacity-100'
                            : 'bg-slate-50/80 dark:bg-slate-800/40'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{getCategoryIcon()}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {notif.title}
                            </h5>
                            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {notif.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-medium accent-text hover:underline">
                              {tr('Open')}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleToggleRead(notif.id, e)}
                              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                              {tr(notif.read ? 'Mark unread' : 'Mark read')}
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
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setMenuPanel('menu')}
                  className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{tr('Back')}</span>
                </button>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {tr('Screen & Colors')}
                </div>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {tr('Screen Mode')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (themeMode !== 'light') onToggleThemeMode();
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      themeMode === 'light'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>{tr('Light')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (themeMode !== 'dark') onToggleThemeMode();
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      themeMode === 'dark'
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>{tr('Dark')}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {tr('Accent color')}
                </span>

                <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {COLOR_THEMES.map((t) => {
                    const isSelected = t.id === currentTheme.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectAccentColor(t.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                          isSelected
                            ? 'bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span
                          className="w-[18px] h-[18px] rounded-full shrink-0 border border-black/15 dark:border-white/20"
                          style={{ backgroundColor: themeMode === 'dark' ? t.darkHex : t.hex }}
                        />
                        <span className="flex-1">{t.name}</span>
                        {isSelected && (
                          <span className="text-xs font-medium accent-text">
                            {tr('Selected')}
                          </span>
                        )}
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
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 pt-3 pb-0 transition-colors">
      <div className="flex items-center justify-between gap-3 sm:gap-4 pb-3">
        {/* Left: Drawer menu (mobile/tablet) + Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
            aria-label="Open all pages menu"
            title="All pages"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                {tr(currentTabInfo.title)}
              </h1>
              {isDemoMode ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {tr('Demo Sandbox')}
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {tr('Live')}
                </span>
              )}
            </div>
            <p className="hidden xl:block text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {tr(currentTabInfo.subtitle)}
            </p>
          </div>
        </div>

        {/* Right Actions: Booking Website, New Booking, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={onOpenStorefront}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            title={tr('Share your booking website')}
          >
            <Share2 className="w-4 h-4" style={{ color: activeHex }} />
            <span>{tr('Booking Website')}</span>
          </button>

          <button
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg accent-bg hover:opacity-95 transition-opacity whitespace-nowrap cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{tr('New Booking')}</span>
            <span className="sm:hidden">{tr('Book')}</span>
          </button>

          {currentUser && (
            <button
              ref={profileButtonRef}
              onClick={() => {
                if (!isUserMenuOpen) updatePopoverPosition();
                setIsUserMenuOpen(!isUserMenuOpen);
              }}
              className="relative flex items-center gap-2 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Account, Alerts, Theme & Settings"
              aria-label="Open account menu"
              aria-expanded={isUserMenuOpen}
            >
              <div className="relative">
                <div
                  className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center font-semibold text-sm border border-slate-200 dark:border-slate-700"
                  style={
                    !showGooglePhoto
                      ? { backgroundColor: `${activeHex}20`, color: activeHex }
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
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-900"
                    title={`${unreadCount} unread alerts`}
                  />
                )}
              </div>

              <div className="hidden xl:block text-left">
                <div className="text-sm font-medium text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Persistent Sticky Top Navigation + Global Currency/Language Switcher (Desktop & Tablet) */}
      {onNavigateTab && (
        <nav
          aria-label="Quick page navigation"
          className="hidden md:flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-1"
        >
          <div className="flex flex-wrap items-center gap-1">
            {quickNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTab(item.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'font-medium text-slate-900 dark:text-white'
                      : 'font-normal text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                  }`}
                  style={isActive ? { borderBottomColor: activeHex } : undefined}
                >
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={isActive ? { color: activeHex } : undefined}
                  />
                  <span>{tr(item.label)}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenMobileMenu}
              className={`lg:hidden inline-flex items-center gap-1.5 px-2.5 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
                isSecondaryTab
                  ? 'font-medium text-slate-900 dark:text-white'
                  : 'font-normal text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
              }`}
              style={isSecondaryTab ? { borderBottomColor: activeHex } : undefined}
            >
              <LayoutGrid
                className="w-4 h-4 shrink-0"
                style={isSecondaryTab ? { color: activeHex } : undefined}
              />
              <span>{tr('All Pages')}</span>
            </button>
          </div>

          <LocaleCurrencySwitcher currentTheme={currentTheme} compact className="py-1" />
        </nav>
      )}

      {/* Mobile Global Currency & Language Row + Persistent Quick Navigation Strip */}
      <div className="md:hidden flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 py-1.5">
        <LocaleCurrencySwitcher currentTheme={currentTheme} compact />
      </div>

      {onNavigateTab && (
        <nav
          aria-label="Mobile quick navigation"
          className="md:hidden grid grid-cols-5 gap-1 border-t border-slate-100 dark:border-slate-800 pt-1"
        >
          {mobileQuickItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateTab(item.id)}
                className={`py-2 px-1 text-xs border-b-2 text-center truncate transition-colors ${
                  isActive
                    ? 'font-semibold text-slate-900 dark:text-white'
                    : 'font-normal text-slate-500 dark:text-slate-400 border-transparent'
                }`}
                style={isActive ? { borderBottomColor: activeHex } : undefined}
              >
                {tr(item.shortLabel)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className={`py-2 px-1 text-xs border-b-2 text-center truncate transition-colors ${
              isSecondaryTab
                ? 'font-semibold text-slate-900 dark:text-white'
                : 'font-normal text-slate-500 dark:text-slate-400 border-transparent'
            }`}
            style={isSecondaryTab ? { borderBottomColor: activeHex } : undefined}
          >
            {tr('More')}
          </button>
        </nav>
      )}

      {typeof document !== 'undefined' && profileMenuPortal && createPortal(profileMenuPortal, document.body)}
    </header>
  );
};
