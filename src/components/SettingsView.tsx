import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Users,
  Radio,
  CreditCard,
  CheckCircle2,
  UserPlus,
  Trash2,
  Save,
  Globe,
  Sliders,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { Company, CompanySettings, User, UserRole, SubscriptionTier, Vehicle } from '../types';
import { ColorTheme } from '../theme';

interface SettingsViewProps {
  currentCompany: Company;
  settings: CompanySettings;
  users: User[];
  currentUser: User;
  tiers: SubscriptionTier[];
  currentTheme: ColorTheme;
  onUpdateCompanyProfile: (profile: Partial<Company>) => void;
  onUpdateCompanySettings: (settings: Partial<CompanySettings>) => void;
  onInviteStaffMember: (staff: Omit<User, 'id'>) => void;
  onUpdateStaffRole: (userId: string, role: UserRole) => void;
  onUpdateStaffStatus: (userId: string, status: 'Active' | 'Invited' | 'Deactivated') => void;
  onDeleteStaffMember: (userId: string) => void;
  onSelectTier?: (tierId: 'starter' | 'growth' | 'enterprise') => void;
  vehicles?: Vehicle[];
  onOpenStorefront?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentCompany,
  settings,
  users,
  currentUser,
  tiers,
  currentTheme,
  vehicles = [],
  onOpenStorefront,
  onUpdateCompanyProfile,
  onUpdateCompanySettings,
  onInviteStaffMember,
  onUpdateStaffRole,
  onUpdateStaffStatus,
  onDeleteStaffMember,
  onSelectTier,
}) => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'operations' | 'storefront' | 'sms' | 'employees' | 'subscription'
  >('profile');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Profile Form State
  const [companyName, setCompanyName] = useState(currentCompany.name);
  const [tinNumber, setTinNumber] = useState(currentCompany.tin_number);
  const [businessType, setBusinessType] = useState(currentCompany.business_type);
  const [phone, setPhone] = useState(currentCompany.phone);
  const [email, setEmail] = useState(currentCompany.email);
  const [city, setCity] = useState(currentCompany.city);

  // Rules Form State
  const [turnaroundHours, setTurnaroundHours] = useState(settings.turnaround_buffer_hours);
  const [maintenanceAutoLock, setMaintenanceAutoLock] = useState(settings.maintenance_auto_lock);
  const [ctAlertDays, setCtAlertDays] = useState(settings.controle_technique_alert_days);
  const [maxDriverHours, setMaxDriverHours] = useState(settings.max_driver_hours_per_day);

  // Booking Website State
  const [storefrontTagline, setStorefrontTagline] = useState(
    settings.storefront_tagline || 'Clean 4x4 cars, friendly drivers, and airport pickups across Rwanda'
  );
  const [storefrontInstantBooking, setStorefrontInstantBooking] = useState(
    settings.storefront_instant_booking ?? true
  );
  const [storefrontDepositPercent, setStorefrontDepositPercent] = useState(
    settings.storefront_deposit_percent || 30
  );
  const [storefrontWhatsapp, setStorefrontWhatsapp] = useState(
    settings.storefront_whatsapp || '+250 788 312 000'
  );
  const [storefrontPublishedVehicles, setStorefrontPublishedVehicles] = useState<string[]>(
    settings.storefront_published_vehicles || []
  );

  // Text Alerts State
  const [senderId, setSenderId] = useState(settings.sms_sender_id);
  const [defaultLanguage, setDefaultLanguage] = useState(settings.sms_default_language);
  const [autoFlightAlerts, setAutoFlightAlerts] = useState(settings.auto_flight_delay_alerts);
  const [customerBookingSms, setCustomerBookingSms] = useState(settings.customer_booking_sms);

  // Add Staff Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('+250 788 ');
  const [inviteRole, setInviteRole] = useState<UserRole>('dispatcher');

  const activeBtnText = currentTheme?.btnText || 'text-white';

  const triggerSavedToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanyProfile({
      name: companyName,
      tin_number: tinNumber,
      business_type: businessType,
      phone,
      email,
      city,
    });
    triggerSavedToast();
  };

  const handleSaveOperations = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanySettings({
      turnaround_buffer_hours: Number(turnaroundHours),
      maintenance_auto_lock: maintenanceAutoLock,
      controle_technique_alert_days: Number(ctAlertDays),
      max_driver_hours_per_day: Number(maxDriverHours),
    });
    triggerSavedToast();
  };

  const handleSaveStorefront = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanySettings({
      storefront_tagline: storefrontTagline,
      storefront_instant_booking: storefrontInstantBooking,
      storefront_deposit_percent: Number(storefrontDepositPercent),
      storefront_whatsapp: storefrontWhatsapp,
      storefront_published_vehicles: storefrontPublishedVehicles,
    });
    triggerSavedToast();
  };

  const handleSaveSms = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanySettings({
      sms_sender_id: senderId,
      sms_default_language: defaultLanguage,
      auto_flight_delay_alerts: autoFlightAlerts,
      customer_booking_sms: customerBookingSms,
    });
    triggerSavedToast();
  };

  const handleInviteStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    onInviteStaffMember({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      phone: invitePhone.trim(),
      role: inviteRole,
      company_id: currentCompany.id,
      status: 'Active',
    });

    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    triggerSavedToast();
  };

  const currentTierObj = tiers.find((t) => t.id === currentCompany.tier_id) || tiers[1];

  const tabs = [
    { id: 'profile', label: 'Company Info', icon: Building2 },
    { id: 'operations', label: 'Booking Rules', icon: Sliders },
    { id: 'storefront', label: 'Booking Website', icon: Globe },
    { id: 'sms', label: 'SMS Alerts', icon: Radio },
    { id: 'employees', label: `Your Team (${users.length})`, icon: Users },
    { id: 'subscription', label: 'Your Plan', icon: CreditCard },
  ] as const;

  return (
    <div className="space-y-6">
      {showSavedToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-full shadow-xl text-sm font-bold">
          <CheckCircle2 className="w-5 h-5" />
          <span>Saved!</span>
        </div>
      )}

      {/* Header */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${activeBtnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#0a2540] dark:text-white tracking-tight">
                Settings & Team
              </h1>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#f6f9fc] dark:bg-slate-800 text-[#425466] dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {currentCompany.name}
              </span>
            </div>
            <p className="text-base text-[#425466] dark:text-slate-300 mt-1">
              Update your business details, booking rules, website, SMS messages, and staff.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-sm font-semibold transition-all border min-w-0 ${
                isActive
                  ? `${activeBtnText} border-transparent shadow-sm`
                  : 'bg-white dark:bg-slate-900 text-[#425466] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-[#0a2540] dark:hover:text-white'
              }`}
              style={isActive ? { backgroundColor: currentTheme.hex } : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Company Info */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Company Details</h3>
              <p className="text-sm text-[#425466] dark:text-slate-300 mt-0.5">
                Shown on guest receipts, contracts, and your booking website.
              </p>
            </div>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-opacity hover:opacity-95 shadow-sm ${activeBtnText}`}
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                Tax Number (TIN)
              </label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="9-digit TIN"
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none font-mono focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                Type of Business
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as any)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none focus:border-blue-500"
              >
                <option value="Car Rental">Car Rental</option>
                <option value="Tour Operator">Tour Company</option>
                <option value="Airport Shuttle">Airport Pickup</option>
                <option value="Corporate Transport">Office & Staff Rides</option>
              </select>
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                Main City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                Phone Number (MTN MoMo)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none font-mono focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
        </form>
      )}

      {/* 2. Booking Rules */}
      {activeTab === 'operations' && (
        <form
          onSubmit={handleSaveOperations}
          className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Car & Driver Rules</h3>
              <p className="text-sm text-[#425466] dark:text-slate-300 mt-0.5">
                Keep your cars clean between trips and keep drivers safe.
              </p>
            </div>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm ${activeBtnText}`}
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Save className="w-4 h-4" />
              <span>Save Rules</span>
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0a2540] dark:text-white">Wash & Check Time Between Trips</div>
                <div className="text-[#425466] dark:text-slate-300 mt-1">
                  Extra hours needed to wash and check a car before the next guest picks it up.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={turnaroundHours}
                  onChange={(e) => setTurnaroundHours(Number(e.target.value))}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white font-mono font-bold text-center rounded-xl p-2.5 outline-none"
                />
                <span className="text-[#425466] dark:text-slate-300 font-semibold">hours</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0a2540] dark:text-white">Block Cars in Garage</div>
                <div className="text-[#425466] dark:text-slate-300 mt-1">
                  Stop new bookings on any car currently being fixed in a garage.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={maintenanceAutoLock}
                  onChange={(e) => setMaintenanceAutoLock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0a2540] dark:text-white">Car Inspection Reminder</div>
                <div className="text-[#425466] dark:text-slate-300 mt-1">
                  Warn your team before a car's police safety check expires.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={ctAlertDays}
                  onChange={(e) => setCtAlertDays(Number(e.target.value))}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white font-mono font-bold text-center rounded-xl p-2.5 outline-none"
                />
                <span className="text-[#425466] dark:text-slate-300 font-semibold">days before</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0a2540] dark:text-white">Max Driver Hours Per Day</div>
                <div className="text-[#425466] dark:text-slate-300 mt-1">
                  Keep trips safe by setting how many hours a driver can work in one day.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="4"
                  max="16"
                  value={maxDriverHours}
                  onChange={(e) => setMaxDriverHours(Number(e.target.value))}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white font-mono font-bold text-center rounded-xl p-2.5 outline-none"
                />
                <span className="text-[#425466] dark:text-slate-300 font-semibold">hours / day</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* 3. Booking Website */}
      {activeTab === 'storefront' && (
        <form
          onSubmit={handleSaveStorefront}
          className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Your Booking Website</span>
              </h3>
              <p className="text-sm text-[#425466] dark:text-slate-300 mt-0.5">
                Let guests see your free cars and book online from their phone.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {onOpenStorefront && (
                <button
                  type="button"
                  onClick={onOpenStorefront}
                  className="px-4 py-2.5 rounded-full bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Website</span>
                </button>
              )}
              <button
                type="submit"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm ${activeBtnText}`}
                style={{ backgroundColor: currentTheme.hex }}
              >
                <Save className="w-4 h-4" />
                <span>Save Website</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-[#425466] dark:text-slate-400 block">
                Your Website Link:
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-base break-all">
                https://kigalifleet.rw/booking/{currentCompany.slug}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?tab=storefront`;
                navigator.clipboard?.writeText(url);
                triggerSavedToast();
              }}
              className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700 font-semibold text-sm self-start sm:self-auto"
            >
              Copy Link
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                Welcome Message on Top of Website
              </label>
              <textarea
                rows={2}
                value={storefrontTagline}
                onChange={(e) => setStorefrontTagline(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                WhatsApp Number for Guests
              </label>
              <input
                type="text"
                value={storefrontWhatsapp}
                onChange={(e) => setStorefrontWhatsapp(e.target.value)}
                placeholder="+250 788 312 000"
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white font-mono font-bold rounded-xl p-3 outline-none focus:border-blue-500"
              />
              <p className="text-xs text-[#425466] dark:text-slate-400 mt-1">
                Guests can tap this number to chat with you on WhatsApp.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0a2540] dark:text-white">Confirm Bookings Right Away</div>
                <div className="text-[#425466] dark:text-slate-300 mt-1">
                  If on, bookings are confirmed as soon as the guest pays the deposit.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={storefrontInstantBooking}
                  onChange={(e) => setStorefrontInstantBooking(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0a2540] dark:text-white">Booking Deposit (%)</div>
                <div className="text-[#425466] dark:text-slate-300 mt-1">
                  Part of the total price a guest pays upfront to hold the car.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={storefrontDepositPercent}
                  onChange={(e) => setStorefrontDepositPercent(Number(e.target.value))}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white font-mono font-bold text-center rounded-xl p-2.5 outline-none"
                />
                <span className="text-[#425466] dark:text-slate-300 font-semibold">%</span>
              </div>
            </div>
          </div>

          {vehicles.length > 0 && (
            <div className="space-y-3 pt-2">
              <div>
                <h4 className="font-bold text-[#0a2540] dark:text-white text-base">Cars Shown on Website</h4>
                <p className="text-sm text-[#425466] dark:text-slate-300">
                  Pick which cars guests can see and book online.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <div className="grid grid-cols-12 gap-2 p-3.5 bg-[#f6f9fc] dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-[#425466] dark:text-slate-400 uppercase">
                  <span className="col-span-5">Car & Plate</span>
                  <span className="col-span-3">Type</span>
                  <span className="col-span-2">Price / Day</span>
                  <span className="col-span-2 text-right">Show Online</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {vehicles.map((v) => {
                    const isHidden = storefrontPublishedVehicles.includes(v.id);
                    return (
                      <div key={v.id} className="grid grid-cols-12 gap-2 p-3.5 text-sm items-center">
                        <div className="col-span-5">
                          <strong className="text-[#0a2540] dark:text-white block">{v.model_name}</strong>
                          <span className="font-mono text-[#425466] dark:text-slate-400 text-xs">
                            {v.plate_number}
                          </span>
                        </div>
                        <div className="col-span-3 text-[#425466] dark:text-slate-300">{v.category}</div>
                        <div className="col-span-2 font-mono font-bold text-[#0a2540] dark:text-white">
                          {v.daily_rate_rwf.toLocaleString()} RWF
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (isHidden) {
                                setStorefrontPublishedVehicles(
                                  storefrontPublishedVehicles.filter((id) => id !== v.id)
                                );
                              } else {
                                setStorefrontPublishedVehicles([...storefrontPublishedVehicles, v.id]);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              !isHidden
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {!isHidden ? 'Shown' : 'Hidden'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* 4. SMS Alerts */}
      {activeTab === 'sms' && (
        <form
          onSubmit={handleSaveSms}
          className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Text Message (SMS) Alerts</h3>
              <p className="text-sm text-[#425466] dark:text-slate-300 mt-0.5">
                Send automatic text messages to drivers and guests—works on any simple phone.
              </p>
            </div>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm ${activeBtnText}`}
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Save className="w-4 h-4" />
              <span>Save Alerts</span>
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                  Sender Name on SMS
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none font-mono font-bold focus:border-blue-500"
                  required
                />
                <p className="text-xs text-[#425466] dark:text-slate-400 mt-1">
                  The name drivers see when they get a trip message.
                </p>
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                  Driver Message Language
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value as any)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none focus:border-blue-500"
                >
                  <option value="EN/RW">Kinyarwanda & English</option>
                  <option value="RW">Kinyarwanda Only</option>
                  <option value="EN">English Only</option>
                  <option value="FR">French Only</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0a2540] dark:text-white">Late Flight Alerts for Drivers</div>
                <div className="text-[#425466] dark:text-slate-300 mt-1">
                  Send an automatic SMS to the driver if a guest's plane is more than 15 minutes late.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoFlightAlerts}
                  onChange={(e) => setAutoFlightAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0a2540] dark:text-white">Send Booking SMS to Guest</div>
                <div className="text-[#425466] dark:text-slate-300 mt-1">
                  Automatically send the car plate and driver's phone number to the guest.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={customerBookingSms}
                  onChange={(e) => setCustomerBookingSms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>
        </form>
      )}

      {/* 5. Team & Staff */}
      {activeTab === 'employees' && (
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Your Team</h3>
              <p className="text-sm text-[#425466] dark:text-slate-300 mt-0.5">
                Add staff members and choose what each person is allowed to do.
              </p>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm ${activeBtnText}`}
              style={{ backgroundColor: currentTheme.hex }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3 bg-[#f6f9fc] dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-400 text-xs font-bold uppercase">
              <div className="lg:col-span-3">Name</div>
              <div className="lg:col-span-3">Phone & Email</div>
              <div className="lg:col-span-2 text-center">Role</div>
              <div className="lg:col-span-2 text-center">Status</div>
              <div className="lg:col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center px-4 py-3.5 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="lg:col-span-3 min-w-0">
                      <div className="font-bold text-[#0a2540] dark:text-white flex items-center gap-2 flex-wrap">
                        <span className="truncate">{u.name}</span>
                        {isCurrent && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                            You
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-3 min-w-0">
                      <div className="text-[#0a2540] dark:text-slate-200 font-mono text-xs truncate">{u.email}</div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                        {u.phone}
                      </div>
                    </div>

                    <div className="lg:col-span-2 flex lg:justify-center">
                      <select
                        value={u.role}
                        disabled={isCurrent}
                        onChange={(e) => onUpdateStaffRole(u.id, e.target.value as UserRole)}
                        className="w-full lg:w-auto bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white text-sm rounded-xl px-3 py-1.5 outline-none capitalize cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                      >
                        <option value="owner">Owner</option>
                        <option value="manager">Manager</option>
                        <option value="dispatcher">Trip Coordinator</option>
                        <option value="driver">Driver</option>
                      </select>
                    </div>

                    <div className="lg:col-span-2 flex lg:justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                          u.status === 'Deactivated'
                            ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                            : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                        }`}
                      >
                        {u.status === 'Deactivated' ? 'Paused' : 'Active'}
                      </span>
                    </div>

                    <div className="lg:col-span-2 flex items-center lg:justify-end gap-2">
                      {!isCurrent && (
                        <>
                          <button
                            onClick={() => {
                              const newStatus = u.status === 'Deactivated' ? 'Active' : 'Deactivated';
                              onUpdateStaffStatus(u.id, newStatus);
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 transition-colors whitespace-nowrap"
                          >
                            {u.status === 'Deactivated' ? 'Turn On' : 'Pause'}
                          </button>
                          <button
                            onClick={() => onDeleteStaffMember(u.id)}
                            className="p-2 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Remove person"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Your Plan */}
      {activeTab === 'subscription' && (
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-[#425466] dark:text-slate-400 uppercase tracking-wide">
                Your Current Plan
              </span>
              <h3 className="text-2xl font-extrabold text-[#0a2540] dark:text-white capitalize mt-0.5">
                {currentTierObj.name} Plan
              </h3>
              <p className="text-sm text-[#425466] dark:text-slate-300 mt-1">
                Up to {currentTierObj.max_vehicles >= 999 ? 'unlimited' : currentTierObj.max_vehicles} cars
              </p>
            </div>
            <div className="sm:text-right">
              <div className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono">
                {currentTierObj.monthly_fee_rwf.toLocaleString()}{' '}
                <span className="text-sm font-normal text-[#425466] dark:text-slate-400">RWF / month</span>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Active Now</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tiers.map((t) => {
              const isSelected = t.id === currentCompany.tier_id;
              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border space-y-4 transition-all ${
                    isSelected
                      ? 'bg-[#f6f9fc] dark:bg-slate-800/80 border-2 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                  style={isSelected ? { borderColor: currentTheme.hex } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#0a2540] dark:text-white capitalize">{t.name}</span>
                    <span className="font-mono font-bold text-[#0a2540] dark:text-white text-sm">
                      {t.monthly_fee_rwf.toLocaleString()} RWF
                    </span>
                  </div>
                  <p className="text-sm text-[#425466] dark:text-slate-300">
                    {t.max_vehicles >= 999 ? 'Unlimited cars' : `Up to ${t.max_vehicles} cars`}
                  </p>
                  <div className="space-y-2 text-sm text-[#425466] dark:text-slate-300">
                    {t.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  {onSelectTier && !isSelected && (
                    <button
                      onClick={() => {
                        onSelectTier(t.id);
                        triggerSavedToast();
                      }}
                      className={`w-full mt-2 py-2.5 rounded-full text-sm font-bold transition-opacity hover:opacity-95 ${activeBtnText}`}
                      style={{ backgroundColor: currentTheme.hex }}
                    >
                      Pick {t.name}
                    </button>
                  )}
                  {isSelected && (
                    <div className="w-full text-center py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      Active Now
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add Team Member */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Add Team Member</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteStaffSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jean-Luc Habineza"
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.rw"
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
                  Phone Number (MoMo / SMS)
                </label>
                <input
                  type="text"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none font-mono focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Job Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 outline-none focus:border-blue-500"
                >
                  <option value="dispatcher">Trip Coordinator (Daily trips & drivers)</option>
                  <option value="manager">Manager (Cars, drivers & bookings)</option>
                  <option value="driver">Driver (Phone trip updates)</option>
                  <option value="owner">Owner (Full access & settings)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-[#0a2540] dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-full font-bold shadow-sm ${activeBtnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
