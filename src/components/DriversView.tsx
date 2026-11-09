import React, { useState, useMemo } from 'react';
import { Driver, DriverLanguage, DriverStatus, Vehicle, Booking } from '../types';
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

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'portal'>('roster');

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
  const [activePortalDriverId, setActivePortalDriverId] = useState<string>(drivers[0]?.id || '');
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
      setAssignmentNotice({ type: 'success', message: 'Chauffeur successfully assigned to booking!' });
      setTimeout(() => setAssignmentNotice(null), 3500);
    } else {
      setAssignmentNotice({ type: 'error', message: res.error || 'Conflict detected.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: activeThemeColor }} />
              <span>Chauffeur & Driver Management</span>
            </h2>
            <span
              className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold"
              style={{
                backgroundColor: `${activeThemeColor}20`,
                color: activeThemeColor,
              }}
            >
              {drivers.length} CHAUFFEURS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chauffeur roster, Rwanda driving licenses, Africa's Talking SMS dispatch, and mobile driver portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main View Mode Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'roster'
                  ? `${activeBtnText} shadow-xs font-bold`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={activeTab === 'roster' ? { backgroundColor: activeThemeColor } : undefined}
            >
              Roster ({drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'assignments'
                  ? `${activeBtnText} shadow-xs font-bold`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={activeTab === 'assignments' ? { backgroundColor: activeThemeColor } : undefined}
            >
              Live Assignments ({activeBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('portal')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'portal'
                  ? `${activeBtnText} shadow-xs font-bold`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={activeTab === 'portal' ? { backgroundColor: activeThemeColor } : undefined}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Driver Portal</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 ${activeBtnText}`}
            style={{ backgroundColor: activeThemeColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Onboard Chauffeur</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Chauffeurs
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              {metrics.total}
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
            Available / Ready
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.available}
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
            On Active Trip
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {metrics.onTrip}
            </span>
            <Navigation className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Off Duty / Rest
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-slate-500 dark:text-slate-400 font-mono">
              {metrics.offDuty}
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-amber-500">
            Average Rating
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-amber-500 font-mono">
              {metrics.avgRating} ★
            </span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Completed Trips
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              {metrics.totalTripsCompleted}
            </span>
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
                placeholder="Search chauffeur by name, phone (+250...), or license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
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

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status Pills */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {['All', 'Available', 'On Trip', 'Off Duty'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      selectedStatusFilter === st
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Language Pills */}
              <div className="flex items-center gap-1">
                {['All', 'RW', 'EN', 'FR'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguageFilter(lang)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                      selectedLanguageFilter === lang
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'All' ? 'All Langs' : lang === 'RW' ? 'Kinyarwanda' : lang === 'EN' ? 'English' : 'French'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Roster Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((driver) => {
              const assignedCar = vehicles.find((v) => v.id === driver.assigned_vehicle_id);
              const driverBookings = bookings.filter((b) => b.driver_id === driver.id && b.status !== 'Cancelled');
              const activeBooking = driverBookings.find((b) => b.status === 'Confirmed' || b.status === 'In Progress');

              return (
                <div
                  key={driver.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Avatar, Name & Status Switcher */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-sm">
                          {driver.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{driver.name}</h3>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{driver.phone}</span>
                          </div>
                        </div>
                      </div>

                      <select
                        value={driver.status}
                        onChange={(e) => onUpdateStatus(driver.id, e.target.value as DriverStatus)}
                        className={`text-[10px] font-bold rounded-full px-2.5 py-1 border transition-colors outline-none cursor-pointer uppercase tracking-wider ${
                          driver.status === 'Available'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                            : driver.status === 'On Trip'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                            : driver.status === 'On Leave'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="Available">Available</option>
                        <option value="On Trip">On Trip</option>
                        <option value="Off Duty">Off Duty</option>
                        <option value="Rest Day">Rest Day (Shift Limit)</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>

                    {/* Assigned Vehicle Strip */}
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Car className="w-3 h-3 text-amber-500" />
                        Dedicated Car:
                      </span>
                      {assignedCar ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-mono text-[11px]">
                          <span>{assignedCar.model_name.split('(')[0].trim()}</span>
                          <span className="text-amber-500 font-bold">({assignedCar.plate_number})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Pool / Flexible</span>
                      )}
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Languages</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                          {driver.language}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Rating</div>
                        <div className="text-xs font-bold text-amber-500 flex items-center justify-center gap-0.5 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span>{driver.rating}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Trips Done</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                          {driver.trips_completed}
                        </div>
                      </div>
                    </div>

                    {/* Active Assignment Preview if On Trip */}
                    {activeBooking && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between text-amber-500 font-bold text-[10px] uppercase">
                          <span>Active Mission</span>
                          <span>#{activeBooking.id}</span>
                        </div>
                        <div className="text-slate-900 dark:text-white font-semibold truncate">
                          {activeBooking.client_name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {activeBooking.destination} ({activeBooking.start_date} → {activeBooking.end_date})
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                      "{driver.notes}"
                    </p>
                  </div>

                  {/* Card Action Footer */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedDriverDetails(driver)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      Dossier & History
                    </button>

                    <button
                      onClick={() => {
                        setActivePortalDriverId(driver.id);
                        setActiveTab('portal');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      title="Open chauffeur mobile interface"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Driver Portal</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Driver Assignment Linking Module */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-1">
              Active Customer Missions Requiring Chauffeurs
            </h3>
            <p className="text-xs text-slate-400">
              Managers can reassign or link any available chauffeur below. The collision guard automatically detects if a chauffeur is already booked on another mission.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeBookings.map((booking) => {
              const vehicle = vehicles.find((v) => v.id === booking.vehicle_id);
              const currentDriver = drivers.find((d) => d.id === booking.driver_id);

              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-500 font-bold">
                        <span>#{booking.id}</span>
                        <span>·</span>
                        <span className="text-slate-400 font-normal">{booking.destination}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {booking.client_name}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono">
                        {booking.start_date} → {booking.end_date}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {formatRwf(booking.total_rwf)}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle tag */}
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {vehicle?.model_name || 'Vehicle'}
                      </span>
                    </div>
                    <span className="font-mono text-amber-500 font-bold">
                      {vehicle?.plate_number}
                    </span>
                  </div>

                  {/* Current Assigned Driver & Quick Reassignment */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 uppercase text-[10px] font-semibold">
                        Linked Chauffeur:
                      </span>
                      {currentDriver ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>{currentDriver.name} ({currentDriver.phone})</span>
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold">Unassigned</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={booking.driver_id}
                        onChange={(e) => handleLinkDriver(booking.id, e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-400"
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
                                ? ' [BUSY ON OVERLAPPING TRIP]'
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

      {/* VIEW 3: Dedicated Driver Mobile Portal Simulator */}
      {activeTab === 'portal' && (
        <div className="space-y-6">
          {/* Driver Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Driver Mobile Portal & Zero-Data SMS Dispatch
                </h3>
                <p className="text-xs text-slate-500">
                  Simulate the mobile web chauffeur terminal used by drivers on the road in Rwanda.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Viewing as Chauffeur:</span>
              <select
                value={activePortalDriverId}
                onChange={(e) => setActivePortalDriverId(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Phone Mockup Viewport */}
          <div className="max-w-md mx-auto bg-slate-950 border-4 border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5 text-slate-100">
            {/* Phone Top Notch & Status with Safari Offline Mode */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-2 border-b border-slate-800">
              <span className="font-bold text-white">KigaliFleet Driver</span>
              <button
                type="button"
                onClick={() => setIsLowSignalMode(!isLowSignalMode)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  isLowSignalMode
                    ? 'bg-amber-950/80 text-amber-400 border-amber-600/50'
                    : 'bg-emerald-950/80 text-emerald-400 border-emerald-600/50'
                }`}
                title="Toggle between MTN 4G and Safari Offline Caching (Akagera / Nyungwe)"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLowSignalMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span>{isLowSignalMode ? 'Akagera Offline Cache' : 'MTN 4G / SMS Online'}</span>
              </button>
            </div>

            {isLowSignalMode && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 leading-snug flex items-start gap-2">
                <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Safari Low-Signal Mode Active (Akagera / Nyungwe)</span>
                  Check-ins and odometer updates are saved to device memory and will auto-sync via 2G *134# USSD or upon return to cellular coverage.
                </div>
              </div>
            )}

            {/* Chauffeur Header Card */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-base">
                  {portalDriver?.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{portalDriver?.name}</h4>
                  <div className="text-xs text-amber-400 font-mono">{portalDriver?.phone}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {portalDriver?.status}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  {portalDriver?.trips_completed} trips completed
                </div>
              </div>
            </div>

            {/* Active Mission Card */}
            {activeMission ? (
              <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold uppercase">
                    Current Assignment
                  </span>
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    #{activeMission.id}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white">{activeMission.client_name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{activeMission.destination}</span>
                  </p>
                </div>

                {/* Dates & Passenger Contact */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Dates</span>
                    <p className="font-mono text-white text-[11px] font-semibold mt-0.5">
                      {activeMission.start_date} → {activeMission.end_date}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Passenger Phone</span>
                    <p className="font-mono text-amber-400 text-[11px] font-bold mt-0.5">
                      {activeMission.client_phone}
                    </p>
                  </div>
                </div>

                {/* Flight Radar Info if KIA airport pickup */}
                {activeMission.flight_number && (
                  <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-sky-400 font-bold text-[11px]">
                      <span className="flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5" />
                        <span>KIA Airport Radar</span>
                      </span>
                      <span>{activeMission.flight_number}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Origin: <strong>{activeMission.flight_origin || 'Entebbe (EBB)'}</strong> · Status:{' '}
                      <strong className={activeMission.flight_status === 'Delayed' ? 'text-rose-400' : 'text-emerald-400'}>
                        {activeMission.flight_status || 'On Time'}
                      </strong>
                    </p>
                  </div>
                )}

                {/* 4-Step Interactive Check-In Workflow */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Dispatch Check-in Status:</span>
                    <span className="text-amber-400 font-mono text-[11px]">
                      {activeMission.dispatch_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {activeMission.dispatch_status === 'Not Sent' || activeMission.dispatch_status === 'Dispatched (SMS)' ? (
                      <button
                        onClick={() => {
                          if (onAcknowledgeCheckin) onAcknowledgeCheckin(activeMission.id, 'Acknowledged by Driver');
                        }}
                        className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>1. Acknowledge Mission (*134# USSD)</span>
                      </button>
                    ) : activeMission.dispatch_status === 'Acknowledged by Driver' ? (
                      <button
                        onClick={() => {
                          if (onAcknowledgeCheckin) onAcknowledgeCheckin(activeMission.id, 'Driver at Terminal');
                        }}
                        className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>2. Mark Arrived at Terminal / Hotel</span>
                      </button>
                    ) : activeMission.dispatch_status === 'Driver at Terminal' ? (
                      <button
                        onClick={() => {
                          if (onAcknowledgeCheckin) onAcknowledgeCheckin(activeMission.id, 'Client Onboard');
                        }}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <Users className="w-4 h-4" />
                        <span>3. Client Onboard (Start Trip)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (onCompleteTrip) onCompleteTrip(activeMission.id);
                        }}
                        className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <Award className="w-4 h-4" />
                        <span>4. Complete Trip (Release Vehicle)</span>
                      </button>
                    )}

                    {/* Problem / Incident Report Button */}
                    <button
                      onClick={() => {
                        setDriverReportNotice('Problem reported: Dispatcher and operator alerted via Africa\'s Talking SMS.');
                        setTimeout(() => setDriverReportNotice(null), 4000);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Report Incident / Delay / Flat Tire
                    </button>
                    {driverReportNotice && (
                      <div className="p-2 text-center text-xs text-rose-400 bg-rose-950/60 rounded-lg border border-rose-800">
                        {driverReportNotice}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2G Zero-Data SMS Command Hook Reference */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                  <div className="flex items-center justify-between text-slate-400 font-mono">
                    <span>2G Feature Phone SMS Code:</span>
                    <span className="text-amber-400 font-bold">2121</span>
                  </div>
                  <p className="text-slate-500 italic">
                    Reply <strong>KIGALI ACK {activeMission.id}</strong> to check in without internet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
                <h4 className="text-base font-bold text-white">No Active Missions</h4>
                <p className="text-xs text-slate-400">
                  {portalDriver?.name} is currently available in the roster. Next scheduled trip will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Chauffeur Details & Dossier Drawer */}
      {selectedDriverDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-lg">
                  {selectedDriverDetails.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedDriverDetails.name}
                  </h3>
                  <div className="text-xs text-amber-500 font-mono flex items-center gap-2 mt-0.5">
                    <span>{selectedDriverDetails.phone}</span>
                    <span>•</span>
                    <span>{selectedDriverDetails.email || 'kigalifleet.rw'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingDriver(selectedDriverDetails)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Edit chauffeur details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedDriverDetails(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dossier Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">National ID (Rwanda)</span>
                <p className="font-mono text-slate-900 dark:text-white font-bold mt-0.5">
                  {selectedDriverDetails.national_id || '1199080012345678'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Driving License</span>
                <p className="font-mono text-slate-900 dark:text-white font-bold mt-0.5">
                  {selectedDriverDetails.license_number}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">License Expiry</span>
                <p className="font-mono text-slate-900 dark:text-white font-bold mt-0.5">
                  {selectedDriverDetails.license_expiry || '2027-12-31'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Experience</span>
                <p className="font-mono text-slate-900 dark:text-white font-bold mt-0.5">
                  {selectedDriverDetails.experience_years || 7} Years
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Languages</span>
                <p className="text-slate-900 dark:text-white font-bold mt-0.5">
                  {selectedDriverDetails.language}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Emergency Contact</span>
                <p className="font-mono text-slate-900 dark:text-white font-bold mt-0.5 truncate">
                  {selectedDriverDetails.emergency_phone || '+250 788 000 111'}
                </p>
              </div>
            </div>

            {/* Trip Records */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Trip History for {selectedDriverDetails.name}</span>
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-500">
                  {bookings.filter((b) => b.driver_id === selectedDriverDetails.id).length} Trips Logged
                </span>
              </div>

              {bookings.filter((b) => b.driver_id === selectedDriverDetails.id).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                  No active or past bookings assigned to this chauffeur yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs divide-y divide-slate-200 dark:divide-slate-800">
                  {bookings
                    .filter((b) => b.driver_id === selectedDriverDetails.id)
                    .map((bk) => (
                      <div
                        key={bk.id}
                        className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-500">#{bk.id}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {bk.client_name}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                bk.status === 'Completed'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {bk.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {bk.start_date} → {bk.end_date} • {bk.destination}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatRwf(bk.total_rwf)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  if (onDeleteDriver && confirm(`Are you sure you want to deactivate ${selectedDriverDetails.name}?`)) {
                    onDeleteDriver(selectedDriverDetails.id);
                    setSelectedDriverDetails(null);
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Deactivate Chauffeur</span>
              </button>

              <button
                onClick={() => {
                  setActivePortalDriverId(selectedDriverDetails.id);
                  setActiveTab('portal');
                  setSelectedDriverDetails(null);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                Open Driver Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Onboard Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Onboard Chauffeur to Kigali Fleet
                </h3>
                <p className="text-xs text-slate-400">Register new driver with Rwanda police driving credentials</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Driver Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jean-Baptiste Habineza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Rwanda Phone (+250)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+250 788 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-amber-500 font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="driver@kigalifleet.rw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Rwanda National ID (16 Digits)
                  </label>
                  <input
                    type="text"
                    placeholder="1199080012345678"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Driving License Number
                  </label>
                  <input
                    type="text"
                    placeholder="DL-RWA-2024-5510"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as DriverLanguage)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="EN/RW">English & Kinyarwanda</option>
                    <option value="RW">Kinyarwanda Only</option>
                    <option value="EN">English Only</option>
                    <option value="FR">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    License Expiry
                  </label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Assign Dedicated Vehicle
                  </label>
                  <select
                    value={assignedVehicleId}
                    onChange={(e) => setAssignedVehicleId(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Flexible / Pool Driver</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model_name} ({v.plate_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Specialization / Route Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Kigali Airport VIP protocol, Nyungwe Canopy specialist, Akagera off-road expert"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Save Chauffeur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Driver Modal */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Chauffeur Profile ({editingDriver.name})
              </h3>
              <button
                onClick={() => setEditingDriver(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDriver} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Driver Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingDriver.name}
                  onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Phone (+250)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDriver.phone}
                    onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-amber-500 font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Assigned Vehicle
                  </label>
                  <select
                    value={editingDriver.assigned_vehicle_id || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, assigned_vehicle_id: e.target.value || undefined })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Flexible / Pool Driver</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model_name} ({v.plate_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  License & Certification Notes
                </label>
                <textarea
                  rows={2}
                  value={editingDriver.notes}
                  onChange={(e) => setEditingDriver({ ...editingDriver, notes: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
