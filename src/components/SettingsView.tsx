import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Users,
  Shield,
  Clock,
  Radio,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Trash2,
  Save,
  Lock,
  Globe,
  Bell,
  Sliders,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
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
  const [activeTab, setActiveTab] = useState<'profile' | 'operations' | 'storefront' | 'sms' | 'employees' | 'subscription'>('profile');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Profile Form State
  const [companyName, setCompanyName] = useState(currentCompany.name);
  const [tinNumber, setTinNumber] = useState(currentCompany.tin_number);
  const [businessType, setBusinessType] = useState(currentCompany.business_type);
  const [phone, setPhone] = useState(currentCompany.phone);
  const [email, setEmail] = useState(currentCompany.email);
  const [city, setCity] = useState(currentCompany.city);

  // Operational Rules State
  const [turnaroundHours, setTurnaroundHours] = useState(settings.turnaround_buffer_hours);
  const [maintenanceAutoLock, setMaintenanceAutoLock] = useState(settings.maintenance_auto_lock);
  const [ctAlertDays, setCtAlertDays] = useState(settings.controle_technique_alert_days);
  const [maxDriverHours, setMaxDriverHours] = useState(settings.max_driver_hours_per_day);
  const [refundPolicy, setRefundPolicy] = useState(settings.cancellation_refund_policy);

  // Storefront Management State (Part 8, Section 33-36)
  const [storefrontTagline, setStorefrontTagline] = useState(
    settings.storefront_tagline || 'Premium 4x4 Safari Rentals, VIP Chauffeurs & Airport Transfers across Rwanda'
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

  // SMS & Notifications State
  const [senderId, setSenderId] = useState(settings.sms_sender_id);
  const [defaultLanguage, setDefaultLanguage] = useState(settings.sms_default_language);
  const [autoFlightAlerts, setAutoFlightAlerts] = useState(settings.auto_flight_delay_alerts);
  const [customerBookingSms, setCustomerBookingSms] = useState(settings.customer_booking_sms);

  // Invite Staff Modal State
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
      cancellation_refund_policy: refundPolicy,
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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl animate-fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>Configuration saved successfully!</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Company Settings & Staff Roster</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                {currentCompany.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configure company profile, RRA tax parameters, collision buffer thresholds, Africa's Talking SMS rules, and employee roles
            </p>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'profile' ? { color: currentTheme.hex } : undefined}
        >
          <Building2 className="w-4 h-4" />
          <span>Business Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'operations'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'operations' ? { color: currentTheme.hex } : undefined}
        >
          <Sliders className="w-4 h-4" />
          <span>Fleet & Collision Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('storefront')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'storefront'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'storefront' ? { color: currentTheme.hex } : undefined}
        >
          <Globe className="w-4 h-4" />
          <span>Storefront Portal (Part 8)</span>
        </button>

        <button
          onClick={() => setActiveTab('sms')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'sms'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'sms' ? { color: currentTheme.hex } : undefined}
        >
          <Radio className="w-4 h-4" />
          <span>Africa's Talking & SMS</span>
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'employees'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'employees' ? { color: currentTheme.hex } : undefined}
        >
          <Users className="w-4 h-4" />
          <span>Staff & Permissions ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'subscription'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          style={activeTab === 'subscription' ? { color: currentTheme.hex } : undefined}
        >
          <CreditCard className="w-4 h-4" />
          <span>Plan & Quota</span>
        </button>
      </div>

      {/* Sub-View 1: Business Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Company Identity & Registration</h3>
              <p className="text-xs text-slate-400">Used for customer invoices, RRA EBM receipts, and storefront branding</p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 transition-transform active:scale-95 shadow-md"
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Rwanda Revenue Authority (RRA) TIN</label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="9-digit TIN"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Business Classification</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
              >
                <option value="Car Rental">Car Rental</option>
                <option value="Tour Operator">Tour Operator</option>
                <option value="Airport Shuttle">Airport Shuttle</option>
                <option value="Corporate Transport">Corporate Transport</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Operating City / Station</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Contact Phone (MoMo)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Operations Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                required
              />
            </div>
          </div>
        </form>
      )}

      {/* Sub-View 2: Fleet & Collision Rules */}
      {activeTab === 'operations' && (
        <form onSubmit={handleSaveOperations} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Collision Guard & Fleet Safety Rules</h3>
              <p className="text-xs text-slate-400">Control turnaround buffers, garage locks, and driver duty limits</p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 transition-transform active:scale-95 shadow-md"
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rules</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">Turnaround Preparation Buffer</div>
                <div className="text-slate-400 mt-0.5">
                  Buffer time between consecutive vehicle rentals for vehicle washing, refueling, and mechanical inspection.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={turnaroundHours}
                  onChange={(e) => setTurnaroundHours(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-800 text-white font-mono font-bold text-center rounded-lg p-2 outline-none"
                />
                <span className="text-slate-400 font-semibold">hours</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">Maintenance Auto-Lock (Grounded Vehicles)</div>
                <div className="text-slate-400 mt-0.5">
                  Automatically reject reservation requests for vehicles currently under maintenance at certified Kigali garages.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceAutoLock}
                  onChange={(e) => setMaintenanceAutoLock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">Contrôle Technique Warning Threshold</div>
                <div className="text-slate-400 mt-0.5">
                  Notify dispatchers when Rwanda National Police vehicle inspection certificate is approaching expiry.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={ctAlertDays}
                  onChange={(e) => setCtAlertDays(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-800 text-white font-mono font-bold text-center rounded-lg p-2 outline-none"
                />
                <span className="text-slate-400 font-semibold">days prior</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">Chauffeur Daily Shift Limit</div>
                <div className="text-slate-400 mt-0.5">
                  Maximum driving duty hours per day before requiring mandatory rest, ensuring passenger safety.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="4"
                  max="16"
                  value={maxDriverHours}
                  onChange={(e) => setMaxDriverHours(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-800 text-white font-mono font-bold text-center rounded-lg p-2 outline-none"
                />
                <span className="text-slate-400 font-semibold">hours/day</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Sub-View: Storefront Management (Part 8, Section 33-36) */}
      {activeTab === 'storefront' && (
        <form onSubmit={handleSaveStorefront} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Public Storefront Portal Management</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your individual business website at /booking/{currentCompany.slug}. Sell your transport services with custom branding and verified inventory.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onOpenStorefront && (
                <button
                  type="button"
                  onClick={onOpenStorefront}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Storefront</span>
                </button>
              )}
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 transition-transform active:scale-95 shadow-md"
                style={{ backgroundColor: currentTheme.hex }}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Storefront</span>
              </button>
            </div>
          </div>

          {/* Storefront Link Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Public Customer Link:</span>
              <span className="font-mono text-amber-400 font-bold text-sm">
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
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 font-semibold self-start sm:self-auto text-xs"
            >
              Copy Public Link
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Storefront Hero Tagline & Introduction</label>
              <textarea
                rows={2}
                value={storefrontTagline}
                onChange={(e) => setStorefrontTagline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer WhatsApp Hotline</label>
              <input
                type="text"
                value={storefrontWhatsapp}
                onChange={(e) => setStorefrontWhatsapp(e.target.value)}
                placeholder="+250 788 312 000"
                className="w-full bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold rounded-lg p-2.5 outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">Direct click-to-chat button on your storefront header and footer</p>
            </div>
          </div>

          {/* Booking Rules Configuration (Section 35) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">Instant Online Confirmation</div>
                <div className="text-slate-400 mt-0.5">
                  When enabled, reservations are atomically confirmed upon deposit payment. If disabled, bookings enter Pending review.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={storefrontInstantBooking}
                  onChange={(e) => setStorefrontInstantBooking(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">Required Deposit Percentage</div>
                <div className="text-slate-400 mt-0.5">
                  Percentage of total rental bill required to guarantee vehicle schedule lock (default: 30%).
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={storefrontDepositPercent}
                  onChange={(e) => setStorefrontDepositPercent(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-800 text-amber-400 font-mono font-bold text-center rounded-lg p-2 outline-none"
                />
                <span className="text-slate-400 font-semibold">%</span>
              </div>
            </div>
          </div>

          {/* Vehicle Visibility & Publishing Matrix (Section 34) */}
          {vehicles.length > 0 && (
            <div className="space-y-3 pt-2">
              <div>
                <h4 className="font-bold text-white text-xs">Vehicle Publishing Controls</h4>
                <p className="text-[11px] text-slate-400">
                  Control which fleet vehicles appear in public storefront search results.
                </p>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="grid grid-cols-12 gap-2 p-3 bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                  <span className="col-span-5">Vehicle Model & Plate</span>
                  <span className="col-span-3">Category</span>
                  <span className="col-span-2">Daily Rate</span>
                  <span className="col-span-2 text-right">Visibility</span>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
                  {vehicles.map((v) => {
                    const isHidden = storefrontPublishedVehicles.includes(v.id);
                    return (
                      <div key={v.id} className="grid grid-cols-12 gap-2 p-3 text-xs items-center">
                        <div className="col-span-5">
                          <strong className="text-white block">{v.model_name}</strong>
                          <span className="font-mono text-slate-400 text-[10px]">{v.plate_number}</span>
                        </div>
                        <div className="col-span-3 text-slate-300">
                          {v.category}
                        </div>
                        <div className="col-span-2 font-mono text-amber-400">
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
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                              !isHidden
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {!isHidden ? 'Published' : 'Hidden'}
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

      {/* Sub-View 3: Africa's Talking & SMS Telemetry */}
      {activeTab === 'sms' && (
        <form onSubmit={handleSaveSms} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Africa's Talking 2G Dispatch & SMS Telemetry</h3>
              <p className="text-xs text-slate-400">Configure zero-data chauffeur SMS and customer airport notifications</p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 transition-transform active:scale-95 shadow-md"
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Telemetry</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Africa's Talking Sender ID</label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none font-mono font-bold"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">Approved alphanumeric ID displayed on driver mobile phones</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default Driver SMS Language</label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                >
                  <option value="EN/RW">Bilingual (Kinyarwanda & English)</option>
                  <option value="RW">Kinyarwanda Only</option>
                  <option value="EN">English Only</option>
                  <option value="FR">French Only</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">KIA Radar Delay SMS Alerts</div>
                <div className="text-slate-400 mt-0.5">
                  Automatically send instant SMS notifications to assigned chauffeurs when incoming international flights are delayed &gt; 15 mins.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFlightAlerts}
                  onChange={(e) => setAutoFlightAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">Customer Booking Confirmation SMS</div>
                <div className="text-slate-400 mt-0.5">
                  Send automated SMS confirmation with assigned car plate and chauffeur phone directly to the guest.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerBookingSms}
                  onChange={(e) => setCustomerBookingSms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>
        </form>
      )}

      {/* Sub-View 4: Staff & Permissions */}
      {activeTab === 'employees' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Employee Roster & Role Permissions</h3>
              <p className="text-xs text-slate-400">Invite dispatchers, managers, and drivers; control workspace access</p>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-950 transition-transform active:scale-95 shadow-md"
              style={{ backgroundColor: currentTheme.hex }}
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Invite Staff Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-center">Assigned Role</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {u.id}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-300 font-mono">{u.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.phone}</div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <select
                          value={u.role}
                          disabled={isCurrent}
                          onChange={(e) => onUpdateStaffRole(u.id, e.target.value as UserRole)}
                          className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1 outline-none capitalize cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="owner">Owner</option>
                          <option value="manager">Manager</option>
                          <option value="dispatcher">Dispatcher</option>
                          <option value="driver">Driver</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.status === 'Deactivated'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {u.status || 'Active'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {!isCurrent && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                const newStatus = u.status === 'Deactivated' ? 'Active' : 'Deactivated';
                                onUpdateStaffStatus(u.id, newStatus);
                              }}
                              className="px-2 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {u.status === 'Deactivated' ? 'Activate' : 'Deactivate'}
                            </button>
                            <button
                              onClick={() => onDeleteStaffMember(u.id)}
                              className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Sub-View 5: Plan & Quota */}
      {activeTab === 'subscription' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscription</span>
              <h3 className="text-xl font-black text-white capitalize mt-0.5">{currentTierObj.name} Plan</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted for {currentTierObj.target_fleet_size} · Maximum {currentTierObj.max_vehicles} commercial vehicles
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-amber-400 font-mono">
                {currentTierObj.monthly_fee_rwf.toLocaleString()} <span className="text-xs font-normal text-slate-400">RWF/mo</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">Active & In Good Standing</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((t) => {
              const isSelected = t.id === currentCompany.tier_id;
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border space-y-3 transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white capitalize">{t.name}</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">{t.monthly_fee_rwf.toLocaleString()} RWF</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{t.target_fleet_size}</p>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    {t.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>

                  {onSelectTier && !isSelected && (
                    <button
                      onClick={() => {
                        onSelectTier(t.id);
                        triggerSavedToast();
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                    >
                      Switch to {t.name}
                    </button>
                  )}
                  {isSelected && (
                    <div className="w-full text-center py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                      Current Plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Modal: Invite Staff Member */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jean-Luc Habineza"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="employee@kigalifleet.rw"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number (MoMo/SMS)</label>
                <input
                  type="text"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                >
                  <option value="dispatcher">Dispatcher (Daily operations & assignments)</option>
                  <option value="manager">Operations Manager (Fleet, drivers & bookings)</option>
                  <option value="driver">Chauffeur (Mobile mission portal & USSD)</option>
                  <option value="owner">Company Owner (Full access & settings)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold text-slate-950"
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
