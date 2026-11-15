import React, { useState } from 'react';
import { Vehicle, Driver, Booking, ActivityLog, User, Company } from '../types';
import { formatRwf } from '../utils/collision';
import {
  ShieldCheck,
  Plane,
  Car,
  Send,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  AlertCircle,
  Wrench,
  Smartphone,
  Check,
  ExternalLink,
  PhoneCall,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface OverviewViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  logs: ActivityLog[];
  currentTheme?: ColorTheme;
  currentUser?: User;
  currentCompany?: Company;
  onOpenNewBooking: () => void;
  onOpenStorefront: () => void;
  onSelectBookingForDispatch: (bookingId: string) => void;
  onAcknowledgeCheckin: (bookingId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  vehicles,
  drivers,
  bookings,
  logs,
  currentTheme,
  currentUser,
  currentCompany,
  onOpenNewBooking,
  onOpenStorefront,
  onSelectBookingForDispatch,
  onAcknowledgeCheckin,
  onNavigateTab,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'airport' | 'safari'>('all');

  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  const bookedVehicles = vehicles.filter((v) => v.status === 'Booked');
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'Maintenance');

  const availableDrivers = drivers.filter((d) => d.status === 'Available');
  const onTripDrivers = drivers.filter((d) => d.status === 'On Trip');

  const activeBookings = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'In Progress');
  const totalRevenueRwf = activeBookings.reduce((sum, b) => sum + b.total_rwf, 0);

  const depositPaidRwf = activeBookings
    .filter((b) => b.payment_status.includes('Paid'))
    .reduce((sum, b) => sum + (b.payment_status === 'Fully Paid' ? b.total_rwf : b.total_rwf * 0.4), 0);

  const fleetUtilizationRate = Math.round((bookedVehicles.length / (vehicles.length || 1)) * 100);

  const activeThemeColor = currentTheme?.hex || '#635bff';
  const activeBtnText = currentTheme?.btnText || 'text-white';

  const userRole = currentUser?.role || 'owner';
  const isDriverView = userRole === 'driver';

  const filteredBookings = bookings.filter((b) => {
    if (isDriverView && currentUser?.driver_id) {
      if (b.driver_id !== currentUser.driver_id) return false;
    }
    if (filterMode === 'today') {
      return b.start_date <= '2026-11-05' && b.end_date >= '2026-11-05';
    }
    if (filterMode === 'airport') {
      return Boolean(b.flight_number) || b.destination.toLowerCase().includes('airport');
    }
    if (filterMode === 'safari') {
      return (
        b.destination.toLowerCase().includes('volcanoes') ||
        b.destination.toLowerCase().includes('akagera') ||
        b.destination.toLowerCase().includes('nyungwe') ||
        b.destination.toLowerCase().includes('musanze')
      );
    }
    return true;
  });

  const unassignedBookings = bookings.filter((b) => !b.driver_id || b.driver_id === 'Pending');
  const delayedFlightBookings = bookings.filter((b) => b.flight_status === 'Delayed');

  return (
    <div className="space-y-6">
      {/* 1. Welcome Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 stripe-card">
        <div className="space-y-2">
          <div className="text-sm font-semibold" style={{ color: activeThemeColor }}>
            {currentCompany ? currentCompany.name : 'KigaliFleet'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540] dark:text-white">
            {isDriverView ? 'Your Trips Today' : "Today's Overview"}
          </h2>
          <p className="text-base text-[#425466] dark:text-slate-300 max-w-2xl">
            {isDriverView
              ? 'See your pickup times, guest names, and airport flight updates.'
              : 'See which cars are free, who is driving, and how much money you made.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onOpenStorefront}
            className="px-4 py-2.5 text-sm font-semibold rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
          >
            <span>Booking Website</span>
            <ExternalLink className="w-4 h-4 text-[#425466] dark:text-slate-400" />
          </button>

          {!isDriverView && (
            <button
              onClick={onOpenNewBooking}
              className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all shadow-xs active:scale-95 flex items-center gap-2 ${activeBtnText}`}
              style={{ backgroundColor: activeThemeColor }}
            >
              <span>+ New Booking</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Simple Action Alerts */}
      {!isDriverView && (unassignedBookings.length > 0 || delayedFlightBookings.length > 0 || maintenanceVehicles.length > 0) && (
        <div className="space-y-3">
          {unassignedBookings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong className="font-semibold">{unassignedBookings.length} booking(s)</strong> still need a driver before the trip starts.
                </span>
              </div>
              <button
                onClick={() => onNavigateTab?.('calendar')}
                className="px-4 py-2 rounded-full bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 transition-colors self-start sm:self-auto"
              >
                Pick Driver
              </button>
            </div>
          )}

          {delayedFlightBookings.length > 0 && (
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-sky-900 dark:text-sky-200">
              <div className="flex items-center gap-3">
                <Plane className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>
                  <strong className="font-semibold">Flight {delayedFlightBookings[0].flight_number}</strong> is 35 minutes late. Let the driver know by SMS.
                </span>
              </div>
              <button
                onClick={() => onSelectBookingForDispatch(delayedFlightBookings[0].id)}
                className="px-4 py-2 rounded-full bg-sky-600 text-white font-semibold text-sm hover:bg-sky-500 transition-colors self-start sm:self-auto"
              >
                Send SMS
              </button>
            </div>
          )}

          {maintenanceVehicles.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-[#425466] dark:text-slate-300 stripe-card">
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-rose-500 shrink-0" />
                <span>
                  <strong className="text-[#0a2540] dark:text-white font-semibold">
                    {maintenanceVehicles[0].model_name} ({maintenanceVehicles[0].plate_number})
                  </strong>{' '}
                  is in the garage for repairs. Nobody can book it right now.
                </span>
              </div>
              <button
                onClick={() => onNavigateTab?.('vehicles')}
                className="text-sm font-semibold hover:underline self-start sm:self-auto"
                style={{ color: activeThemeColor }}
              >
                See Repairs →
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Driver Active Trip Card */}
      {isDriverView && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 stripe-card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Your Next Trip
            </div>
            <span className="text-sm text-[#425466] dark:text-slate-400">Kigali Airport (KIA)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-sm text-[#425466] dark:text-slate-400 mb-1">Guest & Where to Go</div>
              <div className="font-bold text-[#0a2540] dark:text-white text-base">Dr. Sarah Jenkins</div>
              <div className="text-sm mt-1 font-medium" style={{ color: activeThemeColor }}>
                Kigali Airport → Musanze Lodge
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-sm text-[#425466] dark:text-slate-400 mb-1">Your Car</div>
              <div className="font-bold text-[#0a2540] dark:text-white text-base">Toyota Prado TXL</div>
              <div className="text-sm text-[#425466] dark:text-slate-300 font-mono mt-1">RAD 450 B</div>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-sm text-[#425466] dark:text-slate-400 mb-1">Flight Time</div>
                <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 text-base">
                  <Plane className="w-4 h-4" />
                  <span>WB 402 · 35m Late</span>
                </div>
              </div>
              <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">Lands at 10:05 AM</div>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onAcknowledgeCheckin('bk-101')}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold shadow-xs transition-all active:scale-95 flex items-center gap-2 ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                <Check className="w-4 h-4" />
                <span>I Am At The Airport</span>
              </button>

              <button
                onClick={() => onNavigateTab?.('simulator')}
                className="px-4 py-2.5 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" style={{ color: activeThemeColor }} />
                <span>Test Driver SMS</span>
              </button>
            </div>

            <div className="text-sm text-[#425466] dark:text-slate-300 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              <span>Office Phone: +250 788 100 200</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Top Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 stripe-card">
          <div className="flex items-center justify-between text-sm font-medium text-[#425466] dark:text-slate-400">
            <span>Cars on Trips</span>
            <Car className="w-5 h-5" style={{ color: activeThemeColor }} />
          </div>
          <div className="mt-2.5 text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums">
            {fleetUtilizationRate}%
          </div>
          <div className="mt-1.5 text-sm text-[#425466] dark:text-slate-400">
            {availableVehicles.length} free · {bookedVehicles.length} on trips · {maintenanceVehicles.length} in repair
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 stripe-card">
          <div className="flex items-center justify-between text-sm font-medium text-[#425466] dark:text-slate-400">
            <span>Money Earned</span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">RWF</span>
          </div>
          <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums truncate">
            {formatRwf(totalRevenueRwf)}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm text-[#425466] dark:text-slate-400">
            <span>
              Paid: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatRwf(depositPaidRwf)}</strong>
            </span>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-sm font-semibold hover:underline"
                style={{ color: activeThemeColor }}
              >
                Reports →
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 stripe-card">
          <div className="flex items-center justify-between text-sm font-medium text-[#425466] dark:text-slate-400">
            <span>Drivers Ready</span>
            <Users className="w-5 h-5 text-sky-500" />
          </div>
          <div className="mt-2.5 text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums">
            {availableDrivers.length} / {drivers.length}
          </div>
          <div className="mt-1.5 text-sm text-[#425466] dark:text-slate-400">
            {onTripDrivers.length} driving now · {drivers.filter((d) => d.status === 'Off Duty').length} off duty
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 stripe-card">
          <div className="flex items-center justify-between text-sm font-medium text-[#425466] dark:text-slate-400">
            <span>Double Bookings</span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2.5 text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            0
          </div>
          <div className="mt-1.5 text-sm text-[#425466] dark:text-slate-400">
            Every car can only have one trip at a time
          </div>
        </div>
      </div>

      {/* 5. Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bookings Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: activeThemeColor }} />
              <span>Bookings ({filteredBookings.length})</span>
            </h3>

            <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterMode === 'all'
                    ? 'bg-[#0a2540] text-white dark:bg-white dark:text-[#0a2540] font-semibold'
                    : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('today')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterMode === 'today'
                    ? 'bg-[#0a2540] text-white dark:bg-white dark:text-[#0a2540] font-semibold'
                    : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilterMode('airport')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterMode === 'airport'
                    ? 'bg-[#0a2540] text-white dark:bg-white dark:text-[#0a2540] font-semibold'
                    : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                }`}
              >
                Airport
              </button>
              <button
                onClick={() => setFilterMode('safari')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterMode === 'safari'
                    ? 'bg-[#0a2540] text-white dark:bg-white dark:text-[#0a2540] font-semibold'
                    : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                }`}
              >
                Safaris
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden stripe-card">
            <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-3 bg-[#f6f9fc] dark:bg-slate-800/60 text-[#425466] dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase">
              <div className="md:col-span-4">Guest & Place</div>
              <div className="md:col-span-3">Car & Driver</div>
              <div className="md:col-span-3">Dates & Price</div>
              <div className="md:col-span-2 text-right">Driver SMS</div>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
              {filteredBookings.map((b) => {
                const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
                const driver = drivers.find((d) => d.id === b.driver_id);

                return (
                  <div
                    key={b.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center px-4 py-3.5 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="md:col-span-4 min-w-0">
                      <div className="font-semibold text-[#0a2540] dark:text-white truncate">{b.client_name}</div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 truncate">{b.destination}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 truncate">
                        {b.payment_status}
                      </div>
                    </div>

                    <div className="md:col-span-3 min-w-0">
                      <div className="font-medium text-[#0a2540] dark:text-slate-200 truncate">
                        {vehicle?.model_name || 'No car yet'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5 flex-wrap">
                        <span className="font-mono font-semibold whitespace-nowrap" style={{ color: activeThemeColor }}>
                          {vehicle?.plate_number}
                        </span>
                        <span className="text-[#425466] dark:text-slate-400 truncate">
                          · {driver?.name || 'No driver'}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-3 min-w-0">
                      <div className="font-mono font-semibold text-[#0a2540] dark:text-white whitespace-nowrap">
                        {formatRwf(b.total_rwf)}
                      </div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                        {b.start_date} → {b.end_date}
                      </div>
                      {b.flight_number && (
                        <div
                          className="flex items-center gap-1 text-xs font-mono font-semibold mt-0.5"
                          style={{ color: activeThemeColor }}
                        >
                          <Plane className="w-3 h-3 shrink-0" />
                          <span>{b.flight_number}</span>
                          {b.flight_status === 'Delayed' && (
                            <span className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                              +{b.flight_delay_minutes || 35}m
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 flex md:justify-end">
                      {b.dispatch_status === 'Not Sent' && (
                        <button
                          onClick={() => onSelectBookingForDispatch(b.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap active:scale-95 ${activeBtnText}`}
                          style={{ backgroundColor: activeThemeColor }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send SMS</span>
                        </button>
                      )}
                      {b.dispatch_status === 'Dispatched (SMS)' && (
                        <div className="flex flex-col md:items-end gap-1">
                          <span className="text-xs font-semibold" style={{ color: activeThemeColor }}>
                            SMS Sent
                          </span>
                          <button
                            onClick={() => onAcknowledgeCheckin(b.id)}
                            className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 font-medium whitespace-nowrap"
                            title="Mark driver as checked in"
                          >
                            Mark Ready
                          </button>
                        </div>
                      )}
                      {b.dispatch_status === 'Acknowledged by Driver' && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Driver Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Flights & Recent Activity */}
        <div className="space-y-5">
          {/* Flights Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 stripe-card">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-base font-bold text-[#0a2540] dark:text-white">
                <Plane className="w-4 h-4" style={{ color: activeThemeColor }} />
                <span>Kigali Airport Flights</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full">
                Live
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#0a2540] dark:text-white">RwandAir WB 402</div>
                  <div className="text-xs text-[#425466] dark:text-slate-400">Entebbe → Kigali</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
                  35m Late
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#0a2540] dark:text-white">Kenya Airways KQ 448</div>
                  <div className="text-xs text-[#425466] dark:text-slate-400">Nairobi → Kigali</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                  On Time
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#0a2540] dark:text-white">Ethiopian ET 807</div>
                  <div className="text-xs text-[#425466] dark:text-slate-400">Addis Ababa → Kigali</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                  On Time
                </span>
              </div>
            </div>
          </div>

          {/* Recent Updates */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 stripe-card">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-base font-bold text-[#0a2540] dark:text-white">
                <Clock className="w-4 h-4 text-[#425466] dark:text-slate-400" />
                <span>Recent Updates</span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto text-sm pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#0a2540] dark:text-slate-200">{log.action}</span>
                    <span className="font-mono text-xs text-[#425466] dark:text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#425466] dark:text-slate-400 leading-relaxed">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
