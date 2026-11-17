import React, { useState } from 'react';
import { Trash2, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Company, CompanySettings, User, UserRole, SubscriptionTier, Vehicle } from '../types';
import { ColorTheme } from '../theme';
import { CATEGORY_DEFAULT_IMAGES, getVehicleImageUrl } from '../utils/vehicleImages';
import { useI18n } from '../utils/i18n';

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
  const { formatMoney, tr } = useI18n();
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
    { id: 'profile', label: 'Company info' },
    { id: 'operations', label: 'Booking rules' },
    { id: 'storefront', label: 'Booking website' },
    { id: 'sms', label: 'SMS alerts' },
    { id: 'employees', label: `Your team (${users.length})` },
    { id: 'subscription', label: 'Your plan' },
  ] as const;

  return (
    <div className="space-y-6">
      {showSavedToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium kf-modal">
          <CheckCircle2 className="w-4 h-4" />
          <span>{tr('Saved!')}</span>
        </div>
      )}

      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Settings')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {currentCompany.name} · Workspace preferences, website controls, and team access
          </p>
        </div>
      </div>

      {/* Settings Layout Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
          <nav
            aria-label="Settings sections"
            className="border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800 p-3 flex md:flex-col gap-1 overflow-x-auto bg-slate-50/60 dark:bg-slate-900/30"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left px-3.5 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {tr(tab.label)}
                </button>
              );
            })}
          </nav>

          {/* 1. Company Info */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="flex flex-col justify-between min-w-0">
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h5 className="text-base font-semibold text-slate-900 dark:text-white">
                    {tr('Company details')}
                  </h5>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {tr('Company name')}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {tr('Tax number (TIN)')}
                  </label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="9-digit TIN"
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {tr('Type of business')}
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none"
                  >
                    <option value="Car Rental">Car rental</option>
                    <option value="Tour Operator">Tour company</option>
                    <option value="Airport Shuttle">Airport pickup</option>
                    <option value="Corporate Transport">Office & staff rides</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {tr('Main city')}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {tr('Phone number (MTN MoMo)')}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {tr('Business email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('Shown on guest receipts, contracts and your booking website.')}
                </span>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 shadow-xs"
                >
                  {tr('Save changes')}
                </button>
              </div>
            </form>
          )}

          {/* 2. Booking Rules */}
          {activeTab === 'operations' && (
            <form onSubmit={handleSaveOperations} className="flex flex-col justify-between min-w-0">
              <div className="p-6 space-y-4">
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h5 className="text-base font-semibold text-slate-900 dark:text-white">
                    {tr('Car & driver rules')}
                  </h5>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {tr('Wash & check time between trips')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('Extra hours needed to wash and check a car before the next guest picks it up.')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={turnaroundHours}
                        onChange={(e) => setTurnaroundHours(Number(e.target.value))}
                        className="w-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center rounded-lg px-2 py-1.5 outline-none"
                      />
                      <span className="text-slate-500 dark:text-slate-400 text-xs">{tr('hours')}</span>
                    </div>
                  </div>

                  <div className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {tr('Block cars in garage')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('Stop new bookings on any car currently being fixed in a garage.')}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={maintenanceAutoLock}
                        onChange={(e) => setMaintenanceAutoLock(e.target.checked)}
                        className="w-4 h-4 accent-slate-900 dark:accent-white rounded"
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {maintenanceAutoLock ? tr('On') : tr('Off')}
                      </span>
                    </label>
                  </div>

                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {tr('Car inspection reminder')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr("Warn your team before a car's police safety check expires.")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="3"
                        max="60"
                        value={ctAlertDays}
                        onChange={(e) => setCtAlertDays(Number(e.target.value))}
                        className="w-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center rounded-lg px-2 py-1.5 outline-none"
                      />
                      <span className="text-slate-500 dark:text-slate-400 text-xs">{tr('days before')}</span>
                    </div>
                  </div>

                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {tr('Max driver hours per day')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('Keep trips safe by setting how many hours a driver can work in one day.')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="4"
                        max="16"
                        value={maxDriverHours}
                        onChange={(e) => setMaxDriverHours(Number(e.target.value))}
                        className="w-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center rounded-lg px-2 py-1.5 outline-none"
                      />
                      <span className="text-slate-500 dark:text-slate-400 text-xs">{tr('hours / day')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('Keep your cars clean between trips and keep drivers safe.')}
                </span>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 shadow-xs"
                >
                  {tr('Save rules')}
                </button>
              </div>
            </form>
          )}

          {/* 3. Booking Website */}
          {activeTab === 'storefront' && (
            <form onSubmit={handleSaveStorefront} className="flex flex-col justify-between min-w-0">
              <div className="p-6 space-y-5 text-sm">
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <h5 className="text-base font-semibold text-slate-900 dark:text-white">
                    {tr('Your booking website')}
                  </h5>
                  {onOpenStorefront && (
                    <button
                      type="button"
                      onClick={onOpenStorefront}
                      className="accent-text font-medium text-sm inline-flex items-center gap-1 hover:underline"
                    >
                      <span>{tr('Open website')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="p-4 bg-slate-50/90 dark:bg-slate-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      {tr('Your website link')}:
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white break-all mt-0.5 block">
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
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-auto shrink-0"
                  >
                    {tr('Copy link')}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {tr('Welcome message on top of website')}
                    </label>
                    <textarea
                      rows={2}
                      value={storefrontTagline}
                      onChange={(e) => setStorefrontTagline(e.target.value)}
                      className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {tr('WhatsApp number for guests')}
                    </label>
                    <input
                      type="text"
                      value={storefrontWhatsapp}
                      onChange={(e) => setStorefrontWhatsapp(e.target.value)}
                      placeholder="+250 788 312 000"
                      className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {tr('Guests can tap this number to chat with you on WhatsApp.')}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800">
                  <div className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {tr('Confirm bookings right away')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('If on, bookings are confirmed as soon as the guest pays the deposit.')}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={storefrontInstantBooking}
                        onChange={(e) => setStorefrontInstantBooking(e.target.checked)}
                        className="w-4 h-4 accent-slate-900 dark:accent-white rounded"
                      />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {storefrontInstantBooking ? tr('On') : tr('Off')}
                      </span>
                    </label>
                  </div>

                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {tr('Booking deposit (%)')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('Part of the total price a guest pays upfront to hold the car.')}
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
                        className="w-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center rounded-lg px-2 py-1.5 outline-none"
                      />
                      <span className="text-slate-500 dark:text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                {vehicles.length > 0 && (
                  <div className="space-y-2.5">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {tr('Cars shown on website')}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('Pick which cars guests can see and book online.')}
                      </p>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                            <th className="py-2.5 px-3.5">{tr('Car & plate')}</th>
                            <th className="py-2.5 px-3.5">{tr('Type')}</th>
                            <th className="py-2.5 px-3.5 text-right">{tr('Price / day')}</th>
                            <th className="py-2.5 px-3.5 text-right">{tr('Show online')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          {vehicles.map((v) => {
                            const isHidden = storefrontPublishedVehicles.includes(v.id);
                            return (
                              <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                                <td className="py-2.5 px-3.5">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={getVehicleImageUrl(v)}
                                      alt={v.model_name}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[v.category];
                                      }}
                                      className="w-12 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                    />
                                    <div>
                                      <div className="font-medium text-slate-900 dark:text-white">
                                        {v.model_name}
                                      </div>
                                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                        {v.plate_number}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">
                                  {v.category}
                                </td>
                                <td className="py-2.5 px-3.5 text-right font-mono text-slate-900 dark:text-white tabular-nums">
                                  {formatMoney(v.daily_rate_rwf)}
                                </td>
                                <td className="py-2.5 px-3.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isHidden) {
                                        setStorefrontPublishedVehicles(
                                          storefrontPublishedVehicles.filter((id) => id !== v.id)
                                        );
                                      } else {
                                        setStorefrontPublishedVehicles([
                                          ...storefrontPublishedVehicles,
                                          v.id,
                                        ]);
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-md border text-xs font-medium ${
                                      !isHidden
                                        ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    {!isHidden ? tr('Shown') : tr('Hidden')}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('Let guests see your free cars and book online from their phone.')}
                </span>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 shadow-xs"
                >
                  {tr('Save website')}
                </button>
              </div>
            </form>
          )}

          {/* 4. SMS Alerts */}
          {activeTab === 'sms' && (
            <form onSubmit={handleSaveSms} className="flex flex-col justify-between min-w-0">
              <div className="p-6 space-y-4 text-sm">
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h5 className="text-base font-semibold text-slate-900 dark:text-white">
                    {tr('Text message (SMS) alerts')}
                  </h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {tr('Sender name on SMS')}
                    </label>
                    <input
                      type="text"
                      value={senderId}
                      onChange={(e) => setSenderId(e.target.value)}
                      className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono outline-none focus:border-slate-400"
                      required
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {tr('The name drivers see when they get a trip message.')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {tr('Driver message language')}
                    </label>
                    <select
                      value={defaultLanguage}
                      onChange={(e) => setDefaultLanguage(e.target.value as any)}
                      className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none"
                    >
                      <option value="EN/RW">Kinyarwanda & English</option>
                      <option value="RW">Kinyarwanda Only</option>
                      <option value="EN">English Only</option>
                      <option value="FR">French Only</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                  <div className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {tr('Late flight alerts for drivers')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr("Send an automatic SMS to the driver if a guest's plane is more than 15 minutes late.")}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={autoFlightAlerts}
                        onChange={(e) => setAutoFlightAlerts(e.target.checked)}
                        className="w-4 h-4 accent-slate-900 dark:accent-white rounded"
                      />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {autoFlightAlerts ? tr('On') : tr('Off')}
                      </span>
                    </label>
                  </div>

                  <div className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {tr('Send booking SMS to guest')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr("Automatically send the car plate and driver's phone number to the guest.")}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={customerBookingSms}
                        onChange={(e) => setCustomerBookingSms(e.target.checked)}
                        className="w-4 h-4 accent-slate-900 dark:accent-white rounded"
                      />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {customerBookingSms ? tr('On') : tr('Off')}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('Send automatic text messages to drivers and guests—works on any simple phone.')}
                </span>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 shadow-xs"
                >
                  {tr('Save alerts')}
                </button>
              </div>
            </form>
          )}

          {/* 5. Team & Staff */}
          {activeTab === 'employees' && (
            <div className="min-w-0">
              <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h5 className="text-base font-semibold text-slate-900 dark:text-white">
                    {tr('Your team')}
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tr('Add staff members and choose what each person is allowed to do.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="accent-bg px-3.5 py-2 rounded-lg text-sm font-medium hover:opacity-95 shadow-xs"
                >
                  {tr('Add team member')}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">{tr('Name')}</th>
                      <th className="py-3 px-4">{tr('Phone & email')}</th>
                      <th className="py-3 px-4">{tr('Role')}</th>
                      <th className="py-3 px-4">{tr('Status')}</th>
                      <th className="py-3 px-4 text-right">{tr('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {users.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      const isPaused = u.status === 'Deactivated';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                            {u.name}
                            {isCurrent && (
                              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                                ({tr('You')})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-xs text-slate-900 dark:text-white">{u.email}</div>
                            <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              disabled={isCurrent}
                              onChange={(e) => onUpdateStaffRole(u.id, e.target.value as UserRole)}
                              className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer disabled:opacity-60"
                            >
                              <option value="owner">Owner</option>
                              <option value="manager">Manager</option>
                              <option value="dispatcher">Trip coordinator</option>
                              <option value="driver">Driver</option>
                            </select>
                          </td>
                          <td
                            className={`py-3 px-4 font-medium text-xs whitespace-nowrap ${
                              isPaused ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isPaused ? tr('Paused') : tr('Active')}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {!isCurrent && (
                              <div className="inline-flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newStatus = isPaused ? 'Active' : 'Deactivated';
                                    onUpdateStaffStatus(u.id, newStatus);
                                  }}
                                  className="accent-text font-medium text-xs hover:underline"
                                >
                                  {isPaused ? tr('Turn on') : tr('Pause')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteStaffMember(u.id)}
                                  className="text-rose-600 dark:text-rose-400 hover:opacity-80"
                                  title="Remove person"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Your Plan */}
          {activeTab === 'subscription' && (
            <div className="min-w-0 p-6 space-y-5">
              <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    {tr('Your current plan')}
                  </span>
                  <h5 className="text-base font-semibold text-slate-900 dark:text-white capitalize mt-0.5">
                    {currentTierObj.name} ·{' '}
                    {currentTierObj.max_vehicles >= 999
                      ? tr('Unlimited cars')
                      : `${tr('Up to')} ${currentTierObj.max_vehicles} ${tr('cars')}`}
                  </h5>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold font-mono text-slate-900 dark:text-white tabular-nums">
                    {formatMoney(currentTierObj.monthly_fee_rwf)}{' '}
                    <span className="text-xs font-normal font-sans text-slate-500 dark:text-slate-400">
                      / {tr('month')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((t) => {
                  const isSelected = t.id === currentCompany.tier_id;
                  return (
                    <div
                      key={t.id}
                      className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'bg-slate-50/70 dark:bg-slate-800/30 accent-border shadow-xs'
                          : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base font-semibold text-slate-900 dark:text-white capitalize">
                            {t.name}
                          </span>
                          {isSelected && (
                            <span className="accent-text text-xs font-semibold">
                              {tr('Your plan')}
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1.5 tabular-nums">
                          {formatMoney(t.monthly_fee_rwf)}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {t.max_vehicles >= 999
                            ? tr('Unlimited cars')
                            : `${tr('Up to')} ${t.max_vehicles} ${tr('cars')}`}
                        </p>
                        <ul className="list-disc pl-4 text-xs text-slate-700 dark:text-slate-300 my-4 space-y-1.5">
                          {t.features.slice(0, 3).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      {onSelectTier && !isSelected ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTier(t.id);
                            triggerSavedToast();
                          }}
                          className="w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          {tr('Choose')} {t.name}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-default"
                        >
                          {tr('Current plan')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Team Member */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 kf-modal">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {tr('Add team member')}
              </h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteStaffSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                  {tr('Full name')}
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jean-Luc Habineza"
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                  {tr('Email address')}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.rw"
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                  {tr('Phone number (MoMo / SMS)')}
                </label>
                <input
                  type="text"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                  {tr('Job role')}
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none"
                >
                  <option value="dispatcher">Trip coordinator (Daily trips & drivers)</option>
                  <option value="manager">Manager (Cars, drivers & bookings)</option>
                  <option value="driver">Driver (Phone trip updates)</option>
                  <option value="owner">Owner (Full access & settings)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {tr('Cancel')}
                </button>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg font-medium shadow-xs"
                >
                  {tr('Send invite')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
