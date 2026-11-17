import React from 'react';
import {
  Compass,
  LayoutDashboard,
  CalendarDays,
  Car,
  Users,
  ClipboardList,
  Radio,
  Globe,
  Layers,
  Plus,
  RotateCcw,
  Share2,
  X,
  Building2,
  DollarSign,
  BarChart3,
  Wrench,
  ShieldCheck,
  Settings,
  ClipboardCheck,
  CheckSquare,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { Vehicle, Driver, Booking, User, Company, Customer } from '../types';
import { useI18n } from '../utils/i18n';

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
  customers?: Customer[];
  currentUser?: User;
  currentCompany?: Company;
}

const PLAIN_ROLE_LABELS: Record<string, string> = {
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

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewBooking,
  onOpenStorefront,
  currentTheme,
  themeMode,
  onResetDemoData,
  isOpenMobile,
  onCloseMobile,
  vehicles,
  drivers,
  bookings,
  customers,
  currentUser,
  currentCompany,
}) => {
  const { tr } = useI18n();
  const userRole = currentUser?.role || 'owner';
  const carsInRepair = vehicles.filter((v) => v.status === 'Maintenance').length;

  const allNavItems = [
    {
      id: 'landing',
      label: 'Home Page',
      icon: Compass,
      badge: undefined,
      roles: ['owner', 'manager', 'dispatcher', 'driver', 'superadmin'],
    },
    {
      id: 'overview',
      label: userRole === 'driver' ? 'My Trips' : userRole === 'mechanic' ? 'Repair Desk' : 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
      roles: [
        'owner',
        'manager',
        'dispatcher',
        'accountant',
        'fleet_manager',
        'mechanic',
        'driver',
        'receptionist',
        'superadmin',
      ],
    },
    {
      id: 'calendar',
      label: userRole === 'driver' ? 'My Calendar' : 'Calendar',
      icon: CalendarDays,
      badge: undefined,
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'driver', 'superadmin'],
    },
    {
      id: 'vehicles',
      label: 'Cars',
      icon: Car,
      badge: vehicles.length.toString(),
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'mechanic', 'superadmin'],
    },
    {
      id: 'maintenance',
      label: 'Repairs',
      icon: Wrench,
      badge: carsInRepair > 0 ? carsInRepair.toString() : undefined,
      roles: ['owner', 'manager', 'fleet_manager', 'mechanic', 'superadmin'],
    },
    {
      id: 'handovers',
      label: 'Car Checks',
      icon: ClipboardCheck,
      badge: undefined,
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'receptionist', 'superadmin'],
    },
    {
      id: 'drivers',
      label: userRole === 'driver' ? 'Driver Home' : 'Drivers',
      icon: Users,
      badge: drivers.length.toString(),
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'driver', 'superadmin'],
    },
    {
      id: 'bookings',
      label: userRole === 'driver' ? 'My Trips' : 'Bookings',
      icon: ClipboardList,
      badge: bookings.length.toString(),
      roles: [
        'owner',
        'manager',
        'dispatcher',
        'accountant',
        'receptionist',
        'driver',
        'superadmin',
      ],
    },
    {
      id: 'dispatch',
      label: userRole === 'driver' ? 'Driver Screen' : 'Send Drivers',
      icon: Radio,
      badge: undefined,
      roles: ['owner', 'manager', 'dispatcher', 'driver', 'superadmin'],
    },
    {
      id: 'tasks',
      label: 'To-Do List',
      icon: CheckSquare,
      badge: undefined,
      roles: [
        'owner',
        'manager',
        'dispatcher',
        'fleet_manager',
        'mechanic',
        'receptionist',
        'superadmin',
      ],
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Building2,
      badge: customers?.length ? customers.length.toString() : undefined,
      roles: ['owner', 'manager', 'dispatcher', 'accountant', 'receptionist', 'superadmin'],
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: DollarSign,
      badge: undefined,
      roles: ['owner', 'manager', 'accountant', 'superadmin'],
    },
    {
      id: 'expenses',
      label: 'Costs',
      icon: DollarSign,
      badge: undefined,
      roles: ['owner', 'manager', 'accountant', 'fleet_manager', 'driver', 'superadmin'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      badge: undefined,
      roles: ['owner', 'manager', 'accountant', 'superadmin'],
    },
    {
      id: 'simulator',
      label: 'SMS Test',
      icon: Globe,
      badge: undefined,
      roles: ['owner', 'manager', 'dispatcher', 'driver', 'superadmin'],
    },
    {
      id: 'storefront',
      label: 'Booking Website',
      icon: Globe,
      badge: undefined,
      roles: ['owner', 'manager', 'dispatcher', 'receptionist', 'superadmin'],
    },
    {
      id: 'pricing',
      label: 'Plans',
      icon: Layers,
      badge: undefined,
      roles: ['owner', 'manager', 'superadmin'],
    },
    {
      id: 'settings',
      label: 'Settings & Staff',
      icon: Settings,
      badge: undefined,
      roles: ['owner', 'manager', 'superadmin'],
    },
    {
      id: 'super-admin',
      label: 'Admin Control',
      icon: ShieldCheck,
      badge: undefined,
      roles: ['superadmin'],
    },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));
  const isSuperAdminMode = userRole === 'superadmin';
  const primarySuperAdminIds = new Set(['super-admin', 'landing']);
  const superAdminPrimaryNav = isSuperAdminMode
    ? navItems.filter((i) => primarySuperAdminIds.has(i.id))
    : navItems;
  const superAdminTenantNav = isSuperAdminMode
    ? navItems.filter((i) => !primarySuperAdminIds.has(i.id))
    : [];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const activeHex = themeMode === 'dark' ? currentTheme.darkHex : currentTheme.hex;

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px] z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 lg:z-20 w-64 lg:h-screen flex flex-col bg-white dark:bg-[#0f172a] border-r border-slate-200/80 dark:border-slate-800 shrink-0 transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0 accent-bg shadow-xs">
              KF
            </div>
            <div className="min-w-0">
              <div
                className="text-sm font-semibold text-slate-900 dark:text-white truncate"
                title={currentCompany?.name || 'KigaliFleet'}
              >
                {isSuperAdminMode
                  ? 'KigaliFleet Admin'
                  : currentCompany?.name
                  ? currentCompany.name.split(' ')[0] + ' Fleet'
                  : 'KigaliFleet'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {currentUser
                  ? `${currentUser.name.split(' ')[0]} · ${tr(PLAIN_ROLE_LABELS[currentUser.role] || currentUser.role)}`
                  : tr('Car Rental App')}
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action */}
        {!isSuperAdminMode && (
          <div className="px-3.5 pt-3.5 pb-2">
            <button
              onClick={() => {
                onOpenNewBooking();
                if (isOpenMobile) onCloseMobile();
              }}
              className="w-full py-2 px-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 accent-bg hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{tr('New Booking')}</span>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2.5 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
            {tr(isSuperAdminMode ? 'Main Admin' : 'Menu')}
          </div>

          <div className="space-y-0.5">
            {superAdminPrimaryNav.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    isActive
                      ? 'font-medium accent-tint accent-text'
                      : 'font-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={isActive ? { color: activeHex } : undefined}
                    />
                    <span className="truncate">{tr(item.label)}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded-md shrink-0 ${
                        isActive
                          ? 'bg-white/80 dark:bg-slate-900/60 accent-text font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isSuperAdminMode && superAdminTenantNav.length > 0 && (
            <details className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 group" open={currentTab !== 'super-admin' && currentTab !== 'landing'}>
              <summary className="px-2.5 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 cursor-pointer list-none flex items-center justify-between hover:text-slate-900 dark:hover:text-white">
                <span>{currentCompany?.name?.split(' ')[0] || 'Active'}</span>
                <span className="text-xs font-mono">+</span>
              </summary>
              <div className="mt-1 space-y-0.5">
                {superAdminTenantNav.map((item) => {
                  const isActive = currentTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                        isActive
                          ? 'font-medium accent-tint accent-text'
                          : 'font-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{tr(item.label)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </details>
          )}

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onOpenStorefront();
                if (isOpenMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
            >
              <Share2 className="w-4 h-4 shrink-0" style={{ color: activeHex }} />
              <span className="truncate">{tr('Share Booking Link')}</span>
            </button>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {tr('Kigali, Rwanda')}
          </span>

          <button
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            title="Restore sample cars, drivers, and bookings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{tr('Start Over')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
