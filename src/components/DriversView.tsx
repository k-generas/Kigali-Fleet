import React, { useState } from 'react';
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
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Car,
  Calendar,
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
}

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  vehicles,
  bookings,
  currentTheme,
  onAddDriver,
  onUpdateStatus,
  onAssignDriver,
}) => {
  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'roster' | 'assignments'>('assignments');
  const [assignmentNotice, setAssignmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+250 78');
  const [language, setLanguage] = useState<DriverLanguage>('EN/RW');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [notes, setNotes] = useState('');

  const filteredDrivers = drivers.filter((d) => {
    if (selectedLanguageFilter !== 'All' && !d.language.includes(selectedLanguageFilter)) return false;
    return true;
  });

  const activeBookings = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'In Progress');

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    onAddDriver({
      name,
      phone,
      language,
      status: 'Available',
      license_number: licenseNumber || `DL-RWA-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: notes || 'Kigali City & Tourism certified chauffeur.',
    });

    setName('');
    setPhone('+250 78');
    setLicenseNumber('');
    setNotes('');
    setIsAddModalOpen(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: activeThemeColor }} />
              <span>Chauffeur & Driver Assignment Module</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              {drivers.filter((d) => d.status === 'Available').length} READY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Link available drivers to customer itineraries and prevent scheduling double-assignments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'assignments'
                  ? `${activeBtnText} shadow-sm font-bold`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              style={activeTab === 'assignments' ? { backgroundColor: activeThemeColor } : undefined}
            >
              Live Assignments ({activeBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'roster'
                  ? `${activeBtnText} shadow-sm font-bold`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              style={activeTab === 'roster' ? { backgroundColor: activeThemeColor } : undefined}
            >
              Driver Roster ({drivers.length})
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 ${activeBtnText}`}
            style={{ backgroundColor: activeThemeColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Onboard Chauffeur</span>
          </button>
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

      {/* VIEW 1: Driver Assignment Linking Module */}
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

      {/* VIEW 2: Driver Roster Grid */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Language filter */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
            {['All', 'RW', 'EN', 'FR'].map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguageFilter(lang)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedLanguageFilter === lang
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang === 'All' ? 'All Languages' : lang === 'RW' ? 'Kinyarwanda' : lang === 'EN' ? 'English' : 'French'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((driver) => {
              const assignedCar = vehicles.find((v) => v.id === driver.assigned_vehicle_id);

              return (
                <div
                  key={driver.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-amber-500 text-sm">
                        {driver.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{driver.name}</h3>
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{driver.phone}</span>
                        </div>
                      </div>
                    </div>

                    <select
                      value={driver.status}
                      onChange={(e) => onUpdateStatus(driver.id, e.target.value as DriverStatus)}
                      className={`text-xs font-semibold rounded px-2 py-1 border transition-colors outline-none cursor-pointer ${
                        driver.status === 'Available'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                          : driver.status === 'On Trip'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Off Duty">Off Duty</option>
                    </select>
                  </div>

                  {/* Stats Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Language</div>
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
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Trips</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                        {driver.trips_completed}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    "{driver.notes}"
                  </p>

                  <div className="text-[10px] text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
                    <span>License: {driver.license_number}</span>
                    <span className="text-emerald-500 font-semibold">Africa's Talking SMS Ready</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Onboard Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Onboard Driver to Kigali Fleet
              </h3>
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

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Rwanda Phone Number (for Africa's Talking SMS)
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Primary Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as DriverLanguage)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  >
                    <option value="EN/RW">English & Kinyarwanda</option>
                    <option value="RW">Kinyarwanda Only</option>
                    <option value="EN">English Only</option>
                    <option value="FR">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    License No.
                  </label>
                  <input
                    type="text"
                    placeholder="DL-RWA-2024-5510"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Specialization / Route Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Kigali Airport VIP, Nyungwe Canopy, fluent in English & French"
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
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
