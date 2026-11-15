import React, { useState, useMemo } from 'react';
import { Driver, DriverLanguage, DriverStatus, Vehicle, Booking, User } from '../types';
import { checkDriverCollision, formatRwf } from '../utils/collision';
import {
  Plus,
  Users,
  Phone,
  Star,
  Award,
  ShieldCheck,
  X,
  CheckCircle,
  AlertCircle,
  Car,
  Calendar,
  Search,
  Smartphone,
  Navigation,
  Clock,
  MapPin,
  FileText,
  UserCheck,
  History,
  Plane,
  Radio,
  Edit2,
  Trash2,
  Send,
  ArrowRight,
  ExternalLink,
  MessageSquare,
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

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  vehicles,
  bookings,
  currentUser,
  currentTheme,
  onAddDriver,
  onUpdateStatus,
  onAssignDriver,
  onUpdateDriver,
  onDeleteDriver,
  onAcknowledgeCheckin,
  onCompleteTrip,
  onDispatchSMS,
}) => {
  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  const isDriverUser = currentUser?.role === 'driver';
  const matchedDriverId = currentUser?.driver_id || drivers.find((d) => d.email === currentUser?.email || d.phone === currentUser?.phone)?.id || drivers[0]?.id || '';

  // Navigation tabs: auto-focus to portal if logged in as driver
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

  // Metrics
  const metrics = useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter((d) => d.status === 'Available').length;
    const onTrip = drivers.filter((d) => d.status === 'On Trip').length;
    const offDuty = drivers.filter((d) => d.status === 'Off Duty').length;
    const avgRating = (
      drivers.reduce((sum, d) => sum + (d.rating || 5), 0) / (drivers.length || 1)
    ).toFixed(2);
    const totalTripsCompleted = drivers.reduce((sum, d) => sum + d.trips_completed, 0);

    return { total, available, onTrip, offDuty, avgRating, totalTripsCompleted };
  }, [drivers]);

  // Filtered drivers
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

  // Active driver for portal view
  const portalDriver = useMemo(() => {
    return drivers.find((d) => d.id === activePortalDriverId) || drivers[0];
  }, [drivers, activePortalDriverId]);

  // Active mission for the selected portal driver
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
      setAssignmentNotice({ type: 'success', message: 'Driver added to trip!' });
      setTimeout(() => setAssignmentNotice(null), 3500);
    } else {
      setAssignmentNotice({ type: 'error', message: res.error || 'Conflict detected.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 stripe-card">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#0a2540] dark:text-white flex items-center gap-2.5">
              <Users className="w-6 h-6" style={{ color: activeThemeColor }} />
              <span>Drivers</span>
            </h2>
            <span
              className="text-xs font-mono px-3 py-1 rounded-full font-semibold"
              style={{
                backgroundColor: `${activeThemeColor}18`,
                color: activeThemeColor,
              }}
            >
              {drivers.length} drivers
            </span>
          </div>
          <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
            All your drivers, phone numbers, active trips, and driver phone screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700 text-sm">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                activeTab === 'roster'
                  ? `${activeBtnText} shadow-xs`
                  : 'text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white'
              }`}
              style={activeTab === 'roster' ? { backgroundColor: activeThemeColor } : undefined}
            >
              All ({drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                activeTab === 'assignments'
                  ? `${activeBtnText} shadow-xs`
                  : 'text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white'
              }`}
              style={activeTab === 'assignments' ? { backgroundColor: activeThemeColor } : undefined}
            >
              Trips ({activeBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('portal')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'portal'
                  ? `${activeBtnText} shadow-xs`
                  : 'text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white'
              }`}
              style={activeTab === 'portal' ? { backgroundColor: activeThemeColor } : undefined}
            >
              <Smartphone className="w-4 h-4" />
              <span>Phone View</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all shadow-xs active:scale-95 ${activeBtnText}`}
            style={{ backgroundColor: activeThemeColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Driver</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-[#425466] dark:text-slate-400">All Drivers</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-[#0a2540] dark:text-white font-mono">{metrics.total}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Free</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{metrics.available}</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">On Trip</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{metrics.onTrip}</span>
            <Navigation className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-[#425466] dark:text-slate-400">Off Duty</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-[#425466] dark:text-slate-300 font-mono">{metrics.offDuty}</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Rating</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{metrics.avgRating} ★</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-[#425466] dark:text-slate-400">Trips Done</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-[#0a2540] dark:text-white font-mono">{metrics.totalTripsCompleted}</span>
            <Award className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {assignmentNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
            assignmentNotice.type === 'success'
              ? 'bg-emerald-950/70 border border-emerald-600 text-emerald-300'
              : 'bg-rose-950/70 border border-rose-600 text-rose-300'
          }`}
        >
          {assignmentNotice.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{assignmentNotice.message}</span>
        </div>
      )}

      {/* VIEW 1: Driver Roster Grid */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search driver by name, phone (+250...), or license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-[#0a2540] dark:text-white outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              {/* Status Pills */}
              <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
                {['All', 'Available', 'On Trip', 'Off Duty'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusFilter(st)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                      selectedStatusFilter === st
                        ? 'bg-white dark:bg-slate-900 text-[#0a2540] dark:text-white shadow-xs font-bold'
                        : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Language Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['All', 'RW', 'EN', 'FR'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguageFilter(lang)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                      selectedLanguageFilter === lang
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                        : 'bg-[#f6f9fc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#425466] dark:text-slate-300'
                    }`}
                  >
                    {lang === 'All' ? 'All Languages' : lang === 'RW' ? 'Kinyarwanda' : lang === 'EN' ? 'English' : 'French'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Driver Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDrivers.map((driver) => {
              const assignedCar = vehicles.find((v) => v.id === driver.assigned_vehicle_id);
              const driverBookings = bookings.filter((b) => b.driver_id === driver.id && b.status !== 'Cancelled');
              const activeBooking = driverBookings.find((b) => b.status === 'Confirmed' || b.status === 'In Progress');

              return (
                <div
                  key={driver.id}
                  className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 text-sm shrink-0">
                          {driver.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-[#0a2540] dark:text-white truncate">{driver.name}</h3>
                          <div className="text-sm text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 mt-0.5 truncate">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{driver.phone}</span>
                          </div>
                        </div>
                      </div>

                      <select
                        value={driver.status}
                        onChange={(e) => onUpdateStatus(driver.id, e.target.value as DriverStatus)}
                        className={`text-xs sm:text-sm font-semibold rounded-full px-2.5 py-1 border transition-colors outline-none cursor-pointer shrink-0 ${
                          driver.status === 'Available'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                            : driver.status === 'On Trip'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                            : driver.status === 'On Leave'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="Available">Available</option>
                        <option value="On Trip">On Trip</option>
                        <option value="Off Duty">Off Duty</option>
                        <option value="Rest Day">Rest Day</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>

                    {/* Assigned Car Strip */}
                    <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-amber-500" />
                        Usual Car:
                      </span>
                      {assignedCar ? (
                        <span className="font-semibold text-[#0a2540] dark:text-slate-200 flex items-center gap-1 font-mono text-sm">
                          <span>{assignedCar.model_name.split('(')[0].trim()}</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">({assignedCar.plate_number})</span>
                        </span>
                      ) : (
                        <span className="text-[#425466] dark:text-slate-400 text-sm">Any Car</span>
                      )}
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                      <div>
                        <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Languages</div>
                        <div className="text-sm font-bold text-[#0a2540] dark:text-white mt-0.5">
                          {driver.language}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Rating</div>
                        <div className="text-sm font-bold text-amber-500 flex items-center justify-center gap-1 mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{driver.rating}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Trips Done</div>
                        <div className="text-sm font-bold text-[#0a2540] dark:text-white mt-0.5 font-mono">
                          {driver.trips_completed}
                        </div>
                      </div>
                    </div>

                    {/* Active Trip Preview */}
                    {activeBooking && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm space-y-1">
                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-sm">
                          <span>Active Trip</span>
                          <span>#{activeBooking.id}</span>
                        </div>
                        <div className="text-[#0a2540] dark:text-white font-semibold truncate">
                          {activeBooking.client_name}
                        </div>
                        <div className="text-sm text-[#425466] dark:text-slate-400 truncate">
                          {activeBooking.destination} ({activeBooking.start_date} → {activeBooking.end_date})
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-[#425466] dark:text-slate-400 italic line-clamp-2">
                      "{driver.notes}"
                    </p>
                  </div>

                  {/* Card Action Footer */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedDriverDetails(driver)}
                      className="px-4 py-1.5 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Details & History
                    </button>

                    <button
                      onClick={() => {
                        setActivePortalDriverId(driver.id);
                        setActiveTab('portal');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      title="Open driver phone screen"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Phone View</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Assign Drivers to Trips */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white mb-1">
              Trips Needing a Driver
            </h3>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              Pick or change the driver for each trip. Busy drivers on the same dates are blocked automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeBookings.map((booking) => {
              const vehicle = vehicles.find((v) => v.id === booking.vehicle_id);
              const currentDriver = drivers.find((d) => d.id === booking.driver_id);

              return (
                <div
                  key={booking.id}
                  className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-sm text-amber-600 dark:text-amber-400 font-bold">
                        <span>#{booking.id}</span>
                        <span>·</span>
                        <span className="text-[#425466] dark:text-slate-400 font-normal">{booking.destination}</span>
                      </div>
                      <h4 className="text-base font-bold text-[#0a2540] dark:text-white mt-0.5">
                        {booking.client_name}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-[#425466] dark:text-slate-400 font-mono">
                        {booking.start_date} → {booking.end_date}
                      </div>
                      <div className="text-sm font-bold text-[#0a2540] dark:text-white font-mono">
                        {formatRwf(booking.total_rwf)}
                      </div>
                    </div>
                  </div>

                  {/* Car tag */}
                  <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-[#0a2540] dark:text-slate-200">
                        {vehicle?.model_name || 'Car'}
                      </span>
                    </div>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {vehicle?.plate_number}
                    </span>
                  </div>

                  {/* Current Driver & Picker */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#425466] dark:text-slate-400 font-semibold">
                        Driver:
                      </span>
                      {currentDriver ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span>{currentDriver.name} ({currentDriver.phone})</span>
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold">No Driver Yet</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={booking.driver_id}
                        onChange={(e) => handleLinkDriver(booking.id, e.target.value)}
                        className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
                      >
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
                                ? ' [BUSY ON THESE DATES]'
                                : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: Driver Phone Screen */}
      {activeTab === 'portal' && (
        <div className="space-y-6">
          {/* Driver Switcher Bar */}
          <div className="stripe-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  Driver Phone Screen & SMS Check-In
                </h3>
                <p className="text-sm text-[#425466] dark:text-slate-400">
                  See what the driver sees on their phone on the road in Rwanda.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#425466] dark:text-slate-400 font-medium">Driver:</span>
              <select
                value={activePortalDriverId}
                onChange={(e) => setActivePortalDriverId(e.target.value)}
                className="bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Phone Viewport */}
          <div className="max-w-md mx-auto bg-slate-950 border-4 border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5 text-slate-100">
            {/* Phone Top Bar */}
            <div className="flex items-center justify-between text-sm text-slate-400 font-mono pb-2.5 border-b border-slate-800">
              <span className="font-bold text-white">KigaliFleet Driver</span>
              <button
                type="button"
                onClick={() => setIsLowSignalMode(!isLowSignalMode)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border transition-colors ${
                  isLowSignalMode
                    ? 'bg-amber-950/80 text-amber-400 border-amber-600/50'
                    : 'bg-emerald-950/80 text-emerald-400 border-emerald-600/50'
                }`}
                title="Switch between internet and offline park mode"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLowSignalMode ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <span>{isLowSignalMode ? 'Offline Park Mode' : 'Online'}</span>
              </button>
            </div>

            {isLowSignalMode && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300 leading-snug flex items-start gap-2.5">
                <Radio className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Weak Signal Mode (Parks)</span>
                  Updates save on this phone and send via *134# SMS or when signal returns.
                </div>
              </div>
            )}

            {/* Driver Header Card */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-base">
                  {portalDriver?.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{portalDriver?.name}</h4>
                  <div className="text-sm text-amber-400 font-mono">{portalDriver?.phone}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {portalDriver?.status}
                </span>
                <div className="text-sm text-slate-400 mt-1">
                  {portalDriver?.trips_completed} trips done
                </div>
              </div>
            </div>

            {/* Active Trip Card */}
            {activeMission ? (
              <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                    Current Trip
                  </span>
                  <span className="font-mono text-sm text-amber-400 font-bold">
                    #{activeMission.id}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white">{activeMission.client_name}</h4>
                  <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span>{activeMission.destination}</span>
                  </p>
                </div>

                {/* Dates & Guest Phone */}
                <div className="grid grid-cols-2 gap-2.5 text-sm bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-sm text-slate-400">Dates</span>
                    <p className="font-mono text-white text-sm font-semibold mt-0.5">
                      {activeMission.start_date} → {activeMission.end_date}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">Client Phone</span>
                    <p className="font-mono text-amber-400 text-sm font-bold mt-0.5">
                      {activeMission.client_phone}
                    </p>
                  </div>
                </div>

                {/* Flight Info */}
                {activeMission.flight_number && (
                  <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/60 text-sm space-y-1">
                    <div className="flex items-center justify-between text-sky-400 font-bold text-sm">
                      <span className="flex items-center gap-1.5">
                        <Plane className="w-4 h-4" />
                        <span>Airport Flight</span>
                      </span>
                      <span>{activeMission.flight_number}</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      From: <strong>{activeMission.flight_origin || 'Entebbe (EBB)'}</strong> ·{' '}
                      <strong className={activeMission.flight_status === 'Delayed' ? 'text-rose-400' : 'text-emerald-400'}>
                        {activeMission.flight_status || 'On Time'}
                      </strong>
                    </p>
                  </div>
                )}

                {/* 4-Step Interactive Check-In */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
                    <span>Trip Step:</span>
                    <span className="text-amber-400 font-mono text-sm">
                      {activeMission.dispatch_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {activeMission.dispatch_status === 'Not Sent' || activeMission.dispatch_status === 'Dispatched (SMS)' ? (
                      <button
                        onClick={() => {
                          if (onAcknowledgeCheckin) onAcknowledgeCheckin(activeMission.id, 'Acknowledged by Driver');
                        }}
                        className="w-full py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>1. Confirm Trip (*134#)</span>
                      </button>
                    ) : activeMission.dispatch_status === 'Acknowledged by Driver' ? (
                      <button
                        onClick={() => {
                          if (onAcknowledgeCheckin) onAcknowledgeCheckin(activeMission.id, 'Driver at Terminal');
                        }}
                        className="w-full py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>2. I Arrived at Pickup</span>
                      </button>
                    ) : activeMission.dispatch_status === 'Driver at Terminal' ? (
                      <button
                        onClick={() => {
                          if (onAcknowledgeCheckin) onAcknowledgeCheckin(activeMission.id, 'Client Onboard');
                        }}
                        className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <Users className="w-4 h-4" />
                        <span>3. Client in Car (Start Trip)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (onCompleteTrip) onCompleteTrip(activeMission.id);
                        }}
                        className="w-full py-3 rounded-full bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <Award className="w-4 h-4" />
                        <span>4. Finish Trip</span>
                      </button>
                    )}

                    {/* Problem Report Button */}
                    <button
                      onClick={() => {
                        setDriverReportNotice('Problem sent: Office alerted by SMS.');
                        setTimeout(() => setDriverReportNotice(null), 4000);
                      }}
                      className="w-full py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                    >
                      Report Delay or Car Problem
                    </button>
                    {driverReportNotice && (
                      <div className="p-2.5 text-center text-sm text-rose-400 bg-rose-950/60 rounded-xl border border-rose-800">
                        {driverReportNotice}
                      </div>
                    )}
                  </div>
                </div>

                {/* SMS Code */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400 font-mono">
                    <span>No-Internet SMS Code:</span>
                    <span className="text-amber-400 font-bold">2121</span>
                  </div>
                  <p className="text-slate-400">
                    Send <strong>KIGALI ACK {activeMission.id}</strong> to check in by SMS.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
                <h4 className="text-base font-bold text-white">No Trip Right Now</h4>
                <p className="text-sm text-slate-400">
                  {portalDriver?.name} is free for new bookings.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Driver Details & History Modal */}
      {selectedDriverDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 text-lg">
                  {selectedDriverDetails.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                    {selectedDriverDetails.name}
                  </h3>
                  <div className="text-sm text-amber-600 dark:text-amber-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>{selectedDriverDetails.phone}</span>
                    <span>•</span>
                    <span>{selectedDriverDetails.email || 'kigalifleet.rw'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingDriver(selectedDriverDetails)}
                  className="p-2 rounded-full text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Edit driver details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedDriverDetails(null)}
                  className="p-2 rounded-full text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Driver Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">National ID</span>
                <p className="font-mono text-[#0a2540] dark:text-white font-bold mt-0.5 truncate">
                  {selectedDriverDetails.national_id || '1199080012345678'}
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">License Number</span>
                <p className="font-mono text-[#0a2540] dark:text-white font-bold mt-0.5">
                  {selectedDriverDetails.license_number}
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">License Ends</span>
                <p className="font-mono text-[#0a2540] dark:text-white font-bold mt-0.5">
                  {selectedDriverDetails.license_expiry || '2027-12-31'}
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Years Driving</span>
                <p className="font-mono text-[#0a2540] dark:text-white font-bold mt-0.5">
                  {selectedDriverDetails.experience_years || 7} Years
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Languages</span>
                <p className="text-[#0a2540] dark:text-white font-bold mt-0.5">
                  {selectedDriverDetails.language}
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Emergency Phone</span>
                <p className="font-mono text-[#0a2540] dark:text-white font-bold mt-0.5 truncate">
                  {selectedDriverDetails.emergency_phone || '+250 788 000 111'}
                </p>
              </div>
            </div>

            {/* Trip Records */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Trips by {selectedDriverDetails.name}</span>
                </h4>
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {bookings.filter((b) => b.driver_id === selectedDriverDetails.id).length} Trips
                </span>
              </div>

              {bookings.filter((b) => b.driver_id === selectedDriverDetails.id).length === 0 ? (
                <div className="p-6 text-center text-sm text-[#425466] dark:text-slate-400 bg-[#f6f9fc] dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                  No trips for this driver yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-sm divide-y divide-slate-200 dark:divide-slate-800">
                  {bookings
                    .filter((b) => b.driver_id === selectedDriverDetails.id)
                    .map((bk) => (
                      <div
                        key={bk.id}
                        className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">#{bk.id}</span>
                            <span className="font-semibold text-[#0a2540] dark:text-white">
                              {bk.client_name}
                            </span>
                            <span
                              className={`text-sm px-2.5 py-0.5 rounded-full font-semibold ${
                                bk.status === 'Completed'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {bk.status}
                            </span>
                          </div>
                          <div className="text-sm text-[#425466] dark:text-slate-400 mt-0.5">
                            {bk.start_date} → {bk.end_date} • {bk.destination}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-[#0a2540] dark:text-white">
                            {formatRwf(bk.total_rwf)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  if (onDeleteDriver) {
                    onDeleteDriver(selectedDriverDetails.id);
                    setSelectedDriverDetails(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Driver</span>
              </button>

              <button
                onClick={() => {
                  setActivePortalDriverId(selectedDriverDetails.id);
                  setActiveTab('portal');
                  setSelectedDriverDetails(null);
                }}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                Open Phone View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  Add New Driver
                </h3>
                <p className="text-sm text-[#425466] dark:text-slate-400">Enter driver details and driving license</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4 text-sm">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jean-Baptiste Habineza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Phone (+250)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+250 788 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-amber-600 dark:text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="driver@kigalifleet.rw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    National ID (16 Numbers)
                  </label>
                  <input
                    type="text"
                    placeholder="1199080012345678"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Driving License Number
                  </label>
                  <input
                    type="text"
                    placeholder="DL-RWA-2024-5510"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Languages
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as DriverLanguage)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="EN/RW">English & Kinyarwanda</option>
                    <option value="RW">Kinyarwanda Only</option>
                    <option value="EN">English Only</option>
                    <option value="FR">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Years Driving
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    License End Date
                  </label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Usual Car
                  </label>
                  <select
                    value={assignedVehicleId}
                    onChange={(e) => setAssignedVehicleId(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="">Any Car</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model_name} ({v.plate_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                  Routes & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Kigali Airport pickups, Nyungwe forest trips, Akagera park"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Driver Modal */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                Edit Driver ({editingDriver.name})
              </h3>
              <button
                onClick={() => setEditingDriver(null)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDriver} className="space-y-4 text-sm">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingDriver.name}
                  onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Phone (+250)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDriver.phone}
                    onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-amber-600 dark:text-amber-400 font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Usual Car
                  </label>
                  <select
                    value={editingDriver.assigned_vehicle_id || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, assigned_vehicle_id: e.target.value || undefined })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="">Any Car</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model_name} ({v.plate_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editingDriver.notes}
                  onChange={(e) => setEditingDriver({ ...editingDriver, notes: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2 rounded-full text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
