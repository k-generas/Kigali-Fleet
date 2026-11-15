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
import { ColorTheme, COLOR_THEMES } from '../theme';
import { Vehicle, Driver, Booking, User, Company, Customer } from '../types';

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
  customers,
  currentUser,
  currentCompany,
}) => {
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

  const activeThemeObj = COLOR_THEMES.find((t) => t.id === accentColorId) || currentTheme;

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col bg-white dark:bg-[#0d1424] border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-xs transition-colors shrink-0 ${activeThemeObj.btnText}`}
              style={{ backgroundColor: activeThemeObj.hex }}
            >
              KF
            </div>
            <div className="min-w-0">
              <div
                className="text-base font-bold tracking-tight text-[#0a2540] dark:text-white truncate"
                title={currentCompany?.name || 'KigaliFleet'}
              >
                {isSuperAdminMode
                  ? 'KigaliFleet Admin'
                  : currentCompany?.name
                  ? currentCompany.name.split(' ')[0] + ' Fleet'
                  : 'KigaliFleet'}
              </div>
              <p className="text-sm text-[#425466] dark:text-slate-400 truncate">
                {currentUser
                  ? `${currentUser.name.split(' ')[0]} · ${PLAIN_ROLE_LABELS[currentUser.role] || currentUser.role}`
                  : 'Car Rental App'}
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-2 rounded-lg text-slate-500 hover:text-[#0a2540] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action */}
        {!isSuperAdminMode && (
          <div className="px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
            <button
              onClick={() => {
                onOpenNewBooking();
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full py-2.5 px-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] ${activeThemeObj.btnText}`}
              style={{ backgroundColor: activeThemeObj.hex }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Booking</span>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pb-2 text-xs font-semibold text-[#425466] dark:text-slate-400">
            {isSuperAdminMode ? 'Main Admin' : 'Menu'}
          </div>

          {superAdminPrimaryNav.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[15px] transition-all ${
                  isActive
                    ? 'font-semibold'
                    : 'font-medium text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `${activeThemeObj.hex}18`,
                        color: activeThemeObj.hex,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className="w-[18px] h-[18px] shrink-0"
                    style={isActive ? { color: activeThemeObj.hex } : undefined}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 ${
                      isActive
                        ? ''
                        : 'bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: activeThemeObj.hex,
                            color: activeThemeObj.btnText === 'text-white' ? '#ffffff' : '#0a2540',
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

          {isSuperAdminMode && superAdminTenantNav.length > 0 && (
            <details className="pt-4 group" open={currentTab !== 'super-admin' && currentTab !== 'landing'}>
              <summary className="px-3 py-2 text-xs font-semibold text-[#425466] dark:text-slate-400 cursor-pointer list-none flex items-center justify-between hover:text-[#0a2540] dark:hover:text-white">
                <span>Company View ({currentCompany?.name?.split(' ')[0] || 'Active'})</span>
                <span className="text-sm font-mono">+</span>
              </summary>
              <div className="mt-1 space-y-1">
                {superAdminTenantNav.map((item) => {
                  const isActive = currentTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                        isActive
                          ? 'font-semibold bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-white'
                          : 'font-medium text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </details>
          )}

          <div className="pt-3">
            <button
              onClick={() => {
                onOpenStorefront();
                if (isOpenMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors border border-dashed border-slate-300 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <Share2 className="w-4 h-4 text-[#425466] dark:text-slate-400" />
                <span>Share Booking Link</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-[#f6f9fc] dark:bg-[#0a0f1c] flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#425466] dark:text-slate-400 truncate">
            Kigali, Rwanda
          </span>

          <button
            onClick={onResetDemoData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#425466] hover:text-[#0a2540] dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            title="Restore sample cars, drivers, and bookings"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        </div>
      </aside>
    </>
  );
};
