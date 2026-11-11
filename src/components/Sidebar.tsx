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
  Sun,
  Moon,
  RotateCcw,
  Check,
  Share2,
  X,
  Palette,
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
import { ThemeAppearanceMenu } from './ThemeAppearanceMenu';

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

  const allNavItems = [
    {
      id: 'landing',
      label: 'SaaS Homepage',
      icon: Compass,
      badge: 'Public',
      roles: ['owner', 'manager', 'dispatcher', 'driver', 'superadmin'],
    },
    {
      id: 'overview',
      label: userRole === 'driver' ? 'My Missions' : userRole === 'mechanic' ? 'Workshop Desk' : 'Overview',
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
      label: userRole === 'driver' ? 'My Schedule' : 'Fleet Timeline',
      icon: CalendarDays,
      badge: 'Live',
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'driver', 'superadmin'],
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      icon: Car,
      badge: vehicles.length.toString(),
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'mechanic', 'superadmin'],
    },
    {
      id: 'maintenance',
      label: 'Workshop & Repairs',
      icon: Wrench,
      badge:
        vehicles.filter((v) => v.status === 'Maintenance').length > 0
          ? `${vehicles.filter((v) => v.status === 'Maintenance').length} Grounded`
          : undefined,
      roles: ['owner', 'manager', 'fleet_manager', 'mechanic', 'superadmin'],
    },
    {
      id: 'handovers',
      label: 'Handovers & Audits',
      icon: ClipboardCheck,
      badge: 'Checklist',
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'receptionist', 'superadmin'],
    },
    {
      id: 'drivers',
      label: userRole === 'driver' ? 'Driver Portal' : 'Drivers',
      icon: Users,
      badge: drivers.length.toString(),
      roles: ['owner', 'manager', 'dispatcher', 'fleet_manager', 'driver', 'superadmin'],
    },
    {
      id: 'bookings',
      label: userRole === 'driver' ? 'Assigned Trips' : 'Bookings & Invoices',
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
      label: userRole === 'driver' ? 'Chauffeur Terminal' : 'Dispatch Control',
      icon: Radio,
      badge: 'Live',
      roles: ['owner', 'manager', 'dispatcher', 'driver', 'superadmin'],
    },
    {
      id: 'tasks',
      label: 'Operational Tasks',
      icon: CheckSquare,
      badge: 'Queue',
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
      label: 'Clients & CRM',
      icon: Building2,
      badge: customers?.length ? customers.length.toString() : undefined,
      roles: ['owner', 'manager', 'dispatcher', 'accountant', 'receptionist', 'superadmin'],
    },
    {
      id: 'payments',
      label: 'Payments & EBM',
      icon: DollarSign,
      badge: 'MoMo',
      roles: ['owner', 'manager', 'accountant', 'superadmin'],
    },
    {
      id: 'expenses',
      label: 'Expenses & Costs',
      icon: DollarSign,
      badge: 'ROI',
      roles: ['owner', 'manager', 'accountant', 'fleet_manager', 'driver', 'superadmin'],
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: 'KPIs',
      roles: ['owner', 'manager', 'accountant', 'superadmin'],
    },
    {
      id: 'simulator',
      label: "Africa's Talking Hub",
      icon: Globe,
      badge: 'KIA',
      roles: ['owner', 'manager', 'dispatcher', 'driver', 'superadmin'],
    },
    {
      id: 'storefront',
      label: 'Public Storefront',
      icon: Globe,
      badge: 'B2B',
      roles: ['owner', 'manager', 'dispatcher', 'receptionist', 'superadmin'],
    },
    {
      id: 'pricing',
      label: 'Subscription Plans',
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
      label: 'Super Admin Portal',
      icon: ShieldCheck,
      badge: 'SaaS',
      roles: ['superadmin'],
    },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

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
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[130px]" title={currentCompany?.name || 'KigaliFleet'}>
                  {currentCompany?.name ? currentCompany.name.split(' ')[0] + ' Fleet' : 'KigaliFleet'}
                </span>
                <span
                  className="w-2 h-2 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: activeThemeObj.hex }}
                  title="System Online"
                />
              </div>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 capitalize truncate">
                {currentUser ? `${currentUser.name.split(' ')[0]} · ${currentUser.role}` : 'Rwanda Dispatch SaaS'}
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

        {/* Unified Appearance & Quick Demo Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between text-xs">
          <ThemeAppearanceMenu
            currentTheme={currentTheme}
            accentColorId={accentColorId}
            onSelectAccentColor={onSelectAccentColor}
            themeMode={themeMode}
            onToggleThemeMode={onToggleThemeMode}
            align="left"
          />

          <button
            onClick={onResetDemoData}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
            title="Reset sample vehicles, drivers and bookings to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Reset Demo</span>
          </button>
        </div>
      </aside>
    </>
  );
};
