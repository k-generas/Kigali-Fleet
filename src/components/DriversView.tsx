import React, { useState, useMemo } from 'react';
import { Driver, DriverLanguage, DriverStatus, Vehicle, Booking, User } from '../types';
import { checkDriverCollision } from '../utils/collision';
import { formatHumanDateRange, formatHumanDate } from '../utils/dates';
import { useI18n } from '../utils/i18n';
import {
  Plus,
  Search,
  Smartphone,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Plane,
  Radio,
  Users,
  UserCheck,
  Navigation,
  Star,
  Phone,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface DriversViewProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  bookings: Booking[];
  currentUser?: User;
  currentTheme?: ColorTheme;
  onAddDriver: (d: Omit<Driver, 'id' | 'trips_completed' | 'rating'>) => void;
  onUpdateStatus: (id: string, status: DriverStatus) => void;
  onAssignDriver: (bookingId: string, driverId: string) => { success: boolean; error?: string };
  onUpdateDriver?: (id: string, updates: Partial<Driver>) => void;
  onDeleteDriver?: (id: string) => void;
  onAcknowledgeCheckin?: (
    bookingId: string,
    targetStage?: 'Acknowledged by Driver' | 'Driver at Terminal' | 'Client Onboard'
  ) => void;
  onCompleteTrip?: (bookingId: string) => void;
  onDispatchSMS?: (bookingId: string, language?: 'RW' | 'EN') => void;
}

const formatDriverLanguages = (lang: string) => {
  if (!lang) return '';
  return lang.replace(/\//g, ', ');
};

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  vehicles,
  bookings,
  currentUser,
  onAddDriver,
  onUpdateStatus,
  onAssignDriver,
  onUpdateDriver,
  onDeleteDriver,
  onAcknowledgeCheckin,
  onCompleteTrip,
}) => {
  const { formatMoney, tr } = useI18n();

  const isDriverUser = currentUser?.role === 'driver';
  const matchedDriverId =
    currentUser?.driver_id ||
    drivers.find((d) => d.email === currentUser?.email || d.phone === currentUser?.phone)?.id ||
    drivers[0]?.id ||
    '';

  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'portal'>(
    isDriverUser ? 'portal' : 'roster'
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDriverDetails, setSelectedDriverDetails] = useState<Driver | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Driver Portal State
  const [activePortalDriverId, setActivePortalDriverId] = useState<string>(matchedDriverId);
  const [driverReportNotice, setDriverReportNotice] = useState<string | null>(null);
  const [isLowSignalMode, setIsLowSignalMode] = useState<boolean>(false);

  // Onboard Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+250 78');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2028-12-31');
  const [experienceYears, setExperienceYears] = useState('6');
  const [emergencyPhone, setEmergencyPhone] = useState('+250 788 000 111');
  const [language, setLanguage] = useState<DriverLanguage>('EN/RW');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [notes, setNotes] = useState('');

  const metrics = useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter((d) => d.status === 'Available').length;
    const onTrip = drivers.filter((d) => d.status === 'On Trip').length;
    const offDuty = drivers.filter((d) => d.status === 'Off Duty' || d.status === 'Rest Day' || d.status === 'On Leave').length;
    const avgRating = (
      drivers.reduce((sum, d) => sum + (d.rating || 5), 0) / (drivers.length || 1)
    ).toFixed(2);
    const totalTripsCompleted = drivers.reduce((sum, d) => sum + d.trips_completed, 0);

    return { total, available, onTrip, offDuty, avgRating, totalTripsCompleted };
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      if (selectedLanguageFilter !== 'All' && !d.language.includes(selectedLanguageFilter)) return false;
      if (selectedStatusFilter !== 'All' && d.status !== selectedStatusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesPhone = d.phone.toLowerCase().includes(q);
        const matchesLicense = d.license_number.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesLicense) return false;
      }

      return true;
    });
  }, [drivers, selectedLanguageFilter, selectedStatusFilter, searchQuery]);

  const activeBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'Confirmed' || b.status === 'In Progress');
  }, [bookings]);

  const portalDriver = useMemo(() => {
    return drivers.find((d) => d.id === activePortalDriverId) || drivers[0];
  }, [drivers, activePortalDriverId]);

  const portalDriverBookings = useMemo(() => {
    if (!portalDriver) return [];
    return bookings.filter(
      (b) => b.driver_id === portalDriver.id && b.status !== 'Cancelled'
    );
  }, [bookings, portalDriver]);

  const activeMission = useMemo(() => {
    return portalDriverBookings.find((b) => b.status === 'Confirmed' || b.status === 'In Progress');
  }, [portalDriverBookings]);

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    onAddDriver({
      name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@kigalifleet.rw`,
      national_id: nationalId || '1199080012345678',
      license_expiry: licenseExpiry,
      experience_years: Number(experienceYears) || 5,
      emergency_phone: emergencyPhone,
      language,
      status: 'Available',
      license_number: licenseNumber || `DL-RWA-${Math.floor(1000 + Math.random() * 9000)}`,
      assigned_vehicle_id: assignedVehicleId || undefined,
      notes: notes || 'Kigali City & Tourism certified professional chauffeur.',
    });

    setName('');
    setPhone('+250 78');
    setEmail('');
    setNationalId('');
    setLicenseNumber('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handleSaveEditDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver || !onUpdateDriver) return;

    onUpdateDriver(editingDriver.id, editingDriver);
    if (selectedDriverDetails?.id === editingDriver.id) {
      setSelectedDriverDetails(editingDriver);
    }
    setEditingDriver(null);
  };

  const handleLinkDriver = (bookingId: string, driverId: string) => {
    setAssignmentNotice(null);
    const res = onAssignDriver(bookingId, driverId);
    if (res.success) {
      setAssignmentNotice({ type: 'success', message: 'Driver assigned to trip.' });
      setTimeout(() => setAssignmentNotice(null), 3500);
    } else {
      setAssignmentNotice({ type: 'error', message: res.error || 'Conflict detected.' });
    }
  };

  const getDriverStatusStyle = (status: DriverStatus) => {
    if (status === 'Available') {
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25';
    }
    if (status === 'On Trip') {
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Drivers')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Phone numbers, current trips, and driver phone check-in.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'roster'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tr('Roster')} ({drivers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'assignments'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tr('Trips')} ({activeBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('portal')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
                activeTab === 'portal'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{tr('Phone view')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="accent-bg inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 transition-opacity shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('Add driver')}</span>
          </button>
        </div>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Drivers')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {metrics.total}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {metrics.offDuty} off duty or on leave
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Free')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {metrics.available}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Ready for immediate dispatch
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('On a trip')}</span>
            <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {metrics.onTrip}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {metrics.totalTripsCompleted} total trips completed
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Average rating')}</span>
            <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {metrics.avgRating}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              / 5
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Guest feedback across roster
          </p>
        </div>
      </div>

      {assignmentNotice && (
        <div
          className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2.5 ${
            assignmentNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          {assignmentNotice.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{assignmentNotice.message}</span>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        {/* VIEW 1: Phone Roster Table */}
        {activeTab === 'roster' && (
          <div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800">
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg overflow-x-auto">
                {[
                  { value: 'All', label: tr('All') },
                  { value: 'Available', label: tr('Available') },
                  { value: 'On Trip', label: tr('On trip') },
                  { value: 'Off Duty', label: tr('Off duty') },
                ].map((tab) => {
                  const active = selectedStatusFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedStatusFilter(tab.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                        active
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                <select
                  value={selectedLanguageFilter}
                  onChange={(e) => setSelectedLanguageFilter(e.target.value)}
                  className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                >
                  <option value="All">{tr('Language')}: {tr('All')}</option>
                  <option value="RW">Kinyarwanda</option>
                  <option value="EN">English</option>
                  <option value="FR">{tr('French')}</option>
                </select>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={tr('Search name or phone...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-1.5 w-60 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[780px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">{tr('Driver')}</th>
                    <th className="py-3 px-4">{tr('Phone')}</th>
                    <th className="py-3 px-4">{tr('Status')}</th>
                    <th className="py-3 px-4">{tr('Usual car')}</th>
                    <th className="py-3 px-4 text-right">{tr('Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
                        {tr('No drivers match your filters.')}
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((driver) => {
                      const assignedCar = vehicles.find((v) => v.id === driver.assigned_vehicle_id);
                      const telHref = `tel:${driver.phone.replace(/\s+/g, '')}`;

                      return (
                        <tr
                          key={driver.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {driver.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {formatDriverLanguages(driver.language)} · {driver.trips_completed} trips
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                            {driver.phone}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <select
                              value={driver.status}
                              onChange={(e) => onUpdateStatus(driver.id, e.target.value as DriverStatus)}
                              aria-label={`Status for ${driver.name}`}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md border outline-none cursor-pointer ${getDriverStatusStyle(
                                driver.status
                              )}`}
                            >
                              <option value="Available" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">
                                {tr('Available')}
                              </option>
                              <option value="On Trip" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">
                                {tr('On trip')}
                              </option>
                              <option value="Off Duty" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">
                                {tr('Off duty')}
                              </option>
                              <option value="Rest Day" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">
                                {tr('Rest day')}
                              </option>
                              <option value="On Leave" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">
                                {tr('On leave')}
                              </option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4">
                            {assignedCar ? (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-900 dark:text-white font-medium">
                                  {assignedCar.model_name.split('(')[0].trim()}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                  {assignedCar.plate_number}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">{tr('Not set')}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <a
                                href={telHref}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{tr('Call')}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => setSelectedDriverDetails(driver)}
                                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                {tr('Details')}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePortalDriverId(driver.id);
                                  setActiveTab('portal');
                                }}
                                className="accent-tint accent-text px-2.5 py-1 rounded-md text-xs font-medium hover:opacity-90"
                              >
                                {tr('Phone view')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: Assign Drivers to Trips */}
        {activeTab === 'assignments' && (
          <div>
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {tr('Trips needing a driver')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {tr('Pick or change the driver for each trip. Busy drivers on the same dates are blocked automatically.')}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">{tr('Guest & trip')}</th>
                    <th className="py-3 px-4">{tr('Car')}</th>
                    <th className="py-3 px-4">{tr('Dates')}</th>
                    <th className="py-3 px-4">{tr('Driver')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {activeBookings.map((booking) => {
                    const vehicle = vehicles.find((v) => v.id === booking.vehicle_id);
                    const currentDriver = drivers.find((d) => d.id === booking.driver_id);

                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {booking.client_name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-mono">#{booking.id}</span> · {booking.destination}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-900 dark:text-white font-medium">
                            {vehicle?.model_name || 'Car'}
                          </div>
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {vehicle?.plate_number}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-900 dark:text-white tabular-nums">
                            {formatHumanDateRange(booking.start_date, booking.end_date)}
                          </div>
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                            {formatMoney(booking.total_rwf)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={booking.driver_id}
                            onChange={(e) => handleLinkDriver(booking.id, e.target.value)}
                            className="w-full max-w-xs bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400"
                          >
                            <option value="">{tr('No driver yet')}</option>
                            {drivers.map((drv) => {
                              const driverConflict = checkDriverCollision(
                                drv.id,
                                booking.start_date,
                                booking.end_date,
                                bookings,
                                booking.id
                              );

                              return (
                                <option
                                  key={drv.id}
                                  value={drv.id}
                                  disabled={driverConflict.hasCollision && drv.id !== booking.driver_id}
                                >
                                  {drv.name} ({drv.phone}) · {drv.language}
                                  {driverConflict.hasCollision && drv.id !== booking.driver_id
                                    ? ` [${tr('Busy')}]`
                                    : ''}
                                </option>
                              );
                            })}
                          </select>
                          {!currentDriver && (
                            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
                              {tr('No driver yet')}
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

        {/* VIEW 3: Driver Phone Screen */}
        {activeTab === 'portal' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {tr('Driver phone screen & SMS check-in')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {tr('See what the driver sees on their phone on the road in Rwanda.')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">{tr('Driver')}:</span>
                <select
                  value={activePortalDriverId}
                  onChange={(e) => setActivePortalDriverId(e.target.value)}
                  className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-white outline-none"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-slate-100 kf-modal">
              <div className="flex items-center justify-between text-sm text-slate-400 pb-3 border-b border-slate-800">
                <span className="font-semibold text-white">KigaliFleet Driver</span>
                <button
                  type="button"
                  onClick={() => setIsLowSignalMode(!isLowSignalMode)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors"
                  title="Switch between internet and offline park mode"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLowSignalMode ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span>{isLowSignalMode ? 'Offline park mode' : 'Online'}</span>
                </button>
              </div>

              {isLowSignalMode && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300 flex items-start gap-2.5">
                  <Radio className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Weak signal mode (Parks)</span>
                    Updates save on this phone and send via *134# SMS or when signal returns.
                  </div>
                </div>
              )}

              <div className="bg-slate-800/70 p-3.5 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-white">{portalDriver?.name}</h4>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{portalDriver?.phone}</div>
                </div>
                <div className="text-right text-sm">
                  <span className="font-medium text-emerald-400">
                    {portalDriver?.status}
                  </span>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {portalDriver?.trips_completed} trips done
                  </div>
                </div>
              </div>

              {activeMission ? (
                <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white uppercase tracking-wide">Current trip</span>
                    <span className="font-mono text-slate-400">#{activeMission.id}</span>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-white">{activeMission.client_name}</h4>
                    <p className="text-sm text-slate-400 mt-0.5">{activeMission.destination}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-900/70 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Dates</span>
                      <span className="font-medium text-white tabular-nums">
                        {formatHumanDateRange(activeMission.start_date, activeMission.end_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Guest phone</span>
                      <span className="font-mono font-medium text-white">
                        {activeMission.client_phone}
                      </span>
                    </div>
                  </div>

                  {activeMission.flight_number && (
                    <div className="p-3 rounded-lg bg-slate-900/70 text-sm space-y-1">
                      <div className="flex items-center justify-between font-medium text-white">
                        <span className="flex items-center gap-1.5">
                          <Plane className="w-4 h-4 text-slate-400" />
                          <span>Airport flight</span>
                        </span>
                        <span className="font-mono">{activeMission.flight_number}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        From: {activeMission.flight_origin || 'Entebbe (EBB)'} ·{' '}
                        <strong
                          className={
                            activeMission.flight_status === 'Delayed' ? 'text-rose-400' : 'text-emerald-400'
                          }
                        >
                          {activeMission.flight_status || 'On time'}
                        </strong>
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-slate-700/70">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Trip step</span>
                      <span className="font-mono text-slate-200">{activeMission.dispatch_status}</span>
                    </div>

                    {activeMission.dispatch_status === 'Not Sent' ||
                    activeMission.dispatch_status === 'Dispatched (SMS)' ? (
                      <button
                        type="button"
                        onClick={() => onAcknowledgeCheckin?.(activeMission.id, 'Acknowledged by Driver')}
                        className="accent-bg w-full py-2.5 rounded-lg font-medium text-sm"
                      >
                        1. Confirm trip (*134#)
                      </button>
                    ) : activeMission.dispatch_status === 'Acknowledged by Driver' ? (
                      <button
                        type="button"
                        onClick={() => onAcknowledgeCheckin?.(activeMission.id, 'Driver at Terminal')}
                        className="accent-bg w-full py-2.5 rounded-lg font-medium text-sm"
                      >
                        2. I arrived at pickup
                      </button>
                    ) : activeMission.dispatch_status === 'Driver at Terminal' ? (
                      <button
                        type="button"
                        onClick={() => onAcknowledgeCheckin?.(activeMission.id, 'Client Onboard')}
                        className="accent-bg w-full py-2.5 rounded-lg font-medium text-sm"
                      >
                        3. Guest in car (Start trip)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCompleteTrip?.(activeMission.id)}
                        className="accent-bg w-full py-2.5 rounded-lg font-medium text-sm"
                      >
                        4. Finish trip
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setDriverReportNotice('Problem sent: Office alerted by SMS.');
                        setTimeout(() => setDriverReportNotice(null), 4000);
                      }}
                      className="w-full py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      Report delay or car problem
                    </button>

                    {driverReportNotice && (
                      <div className="p-2.5 text-center text-sm text-rose-300 bg-rose-500/10 rounded-lg border border-rose-500/30">
                        {driverReportNotice}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 text-xs text-slate-400">
                    <div className="flex items-center justify-between font-mono">
                      <span>No-internet SMS code:</span>
                      <span className="text-white font-semibold">2121</span>
                    </div>
                    <p className="mt-1">
                      Send <strong className="text-white">KIGALI ACK {activeMission.id}</strong> to check in by SMS.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/60 rounded-xl p-6 text-center space-y-1">
                  <h4 className="text-base font-semibold text-white">No trip right now</h4>
                  <p className="text-sm text-slate-400">
                    {portalDriver?.name} is free for new bookings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Driver Details & History Modal */}
      {selectedDriverDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 kf-modal">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedDriverDetails.name}
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {selectedDriverDetails.phone} · {selectedDriverDetails.email || 'kigalifleet.rw'}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingDriver(selectedDriverDetails)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit driver details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDriverDetails(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 text-sm">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">National ID</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white mt-0.5 block truncate">
                  {selectedDriverDetails.national_id || '1199080012345678'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">License number</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white mt-0.5 block">
                  {selectedDriverDetails.license_number}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">License ends</span>
                <span className="font-medium text-slate-900 dark:text-white mt-0.5 block tabular-nums">
                  {formatHumanDate(selectedDriverDetails.license_expiry || '2027-12-31')}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Years driving</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white mt-0.5 block">
                  {selectedDriverDetails.experience_years || 7} years
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Languages</span>
                <span className="font-medium text-slate-900 dark:text-white mt-0.5 block">
                  {formatDriverLanguages(selectedDriverDetails.language)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Emergency phone</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white mt-0.5 block">
                  {selectedDriverDetails.emergency_phone || '+250 788 000 111'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  Trips by {selectedDriverDetails.name}
                </h4>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {bookings.filter((b) => b.driver_id === selectedDriverDetails.id).length} trips
                </span>
              </div>

              {bookings.filter((b) => b.driver_id === selectedDriverDetails.id).length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50/90 dark:bg-slate-800/40 rounded-lg">
                  No trips for this driver yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {bookings
                    .filter((b) => b.driver_id === selectedDriverDetails.id)
                    .map((bk) => (
                      <div key={bk.id} className="p-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {bk.client_name}{' '}
                            <span className="font-mono text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                              #{bk.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatHumanDateRange(bk.start_date, bk.end_date)} · {bk.destination} · {bk.status}
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                          {formatMoney(bk.total_rwf)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (onDeleteDriver) {
                    onDeleteDriver(selectedDriverDetails.id);
                    setSelectedDriverDetails(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Trash2 className="w-4 h-4" />
                <span>{tr('Remove driver')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePortalDriverId(selectedDriverDetails.id);
                  setActiveTab('portal');
                  setSelectedDriverDetails(null);
                }}
                className="accent-bg px-4 py-2 text-sm font-medium rounded-lg shadow-xs"
              >
                {tr('Open phone view')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto kf-modal">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {tr('Add new driver')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {tr('Enter driver details and driving license')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jean-Baptiste Habineza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    Phone (+250)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+250 788 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="driver@kigalifleet.rw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    National ID (16 numbers)
                  </label>
                  <input
                    type="text"
                    placeholder="1199080012345678"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    Driving license number
                  </label>
                  <input
                    type="text"
                    placeholder="DL-RWA-2024-5510"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    Languages
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as DriverLanguage)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="EN/RW">English & Kinyarwanda</option>
                    <option value="RW">Kinyarwanda Only</option>
                    <option value="EN">English Only</option>
                    <option value="FR">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    Years driving
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    License end date
                  </label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    Usual car
                  </label>
                  <select
                    value={assignedVehicleId}
                    onChange={(e) => setAssignedVehicleId(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Any car</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model_name} ({v.plate_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    Emergency phone
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                  Routes & notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Kigali Airport pickups, Nyungwe forest trips, Akagera park"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {tr('Cancel')}
                </button>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg font-medium shadow-xs"
                >
                  {tr('Save driver')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 kf-modal">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Edit driver ({editingDriver.name})
              </h3>
              <button
                type="button"
                onClick={() => setEditingDriver(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDriver} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={editingDriver.name}
                  onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    Phone (+250)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDriver.phone}
                    onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                    Usual car
                  </label>
                  <select
                    value={editingDriver.assigned_vehicle_id || ''}
                    onChange={(e) =>
                      setEditingDriver({
                        ...editingDriver,
                        assigned_vehicle_id: e.target.value || undefined,
                      })
                    }
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Any car</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model_name} ({v.plate_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editingDriver.notes}
                  onChange={(e) => setEditingDriver({ ...editingDriver, notes: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {tr('Cancel')}
                </button>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg font-medium shadow-xs"
                >
                  {tr('Save changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
