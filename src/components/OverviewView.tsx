import React, { useState } from 'react';
import { Vehicle, Driver, Booking, ActivityLog, User, Company } from '../types';
import { formatRwf } from '../utils/collision';
import {
  ShieldCheck,
  Plane,
  Car,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
  Wrench,
  Smartphone,
  Check,
  Building2,
  ExternalLink,
  MapPin,
  FileText,
  CreditCard,
  PhoneCall,
  Sparkles,
  ArrowRight,
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

  // Financial calculations
  const depositPaidRwf = activeBookings
    .filter((b) => b.payment_status.includes('Paid'))
    .reduce((sum, b) => sum + (b.payment_status === 'Fully Paid' ? b.total_rwf : b.total_rwf * 0.4), 0);
  const pendingBalanceRwf = Math.max(0, totalRevenueRwf - depositPaidRwf);

  const fleetUtilizationRate = Math.round((bookedVehicles.length / (vehicles.length || 1)) * 100);

  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  const userRole = currentUser?.role || 'owner';
  const isDriverView = userRole === 'driver';

  // Filter bookings for table
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

  // Actionable operational alerts
  const unassignedBookings = bookings.filter((b) => !b.driver_id || b.driver_id === 'Pending');
  const delayedFlightBookings = bookings.filter((b) => b.flight_status === 'Delayed');
  const momoPendingBookings = bookings.filter((b) => b.payment_status === 'Pending Payment');

  return (
    <div className="space-y-6">
      {/* 1. Header Welcome & Operational Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: activeThemeColor }}>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono tracking-wider">
              {currentCompany ? currentCompany.name.toUpperCase() : 'KIGALI FLEET & DISPATCH HUB'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-mono">
              ROLE: {userRole.toUpperCase()} ({currentUser?.name || 'Administrator'})
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
            {isDriverView ? 'My Chauffeur Missions & Daily Schedule' : 'Fleet Operations & Dispatch Command'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            {isDriverView
              ? 'Real-time assignments for Kigali pickups, Volcanoes National Park safaris, and airport meet-and-greets.'
              : 'Live telemetry, physical collision prevention, Africa’s Talking driver SMS, and Kigali Airport flight radar.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenStorefront}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>Public Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {!isDriverView && (
            <button
              onClick={onOpenNewBooking}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1.5 ${activeBtnText}`}
              style={{ backgroundColor: activeThemeColor }}
            >
              <span>+ Create Guarded Booking</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Actionable Operational Alerts Bar (Part 3 Core Blueprint Feature) */}
      {!isDriverView && (
        <div className="space-y-2">
          {unassignedBookings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong className="font-bold text-white">{unassignedBookings.length} Confirmed Booking(s)</strong>{' '}
                  need a chauffeur assignment before departure time.
                </span>
              </div>
              <button
                onClick={() => onNavigateTab?.('calendar')}
                className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[11px] hover:bg-amber-300 transition-colors"
              >
                Assign Chauffeur
              </button>
            </div>
          )}

          {delayedFlightBookings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between text-xs text-cyan-200">
              <div className="flex items-center gap-2.5">
                <Plane className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong className="font-bold text-white">KIA Flight Radar Alert:</strong> Flight{' '}
                  {delayedFlightBookings[0].flight_number} is delayed (+35m). Chauffeur can be notified via SMS.
                </span>
              </div>
              <button
                onClick={() => onSelectBookingForDispatch(delayedFlightBookings[0].id)}
                className="px-2.5 py-1 rounded bg-cyan-400 text-slate-950 font-bold text-[11px] hover:bg-cyan-300 transition-colors"
              >
                Dispatch Delay SMS
              </button>
            </div>
          )}

          {maintenanceVehicles.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <span className="text-white font-semibold">Workshop Inspection Active:</span>{' '}
                  {maintenanceVehicles[0].model_name} ({maintenanceVehicles[0].plate_number}) is locked in maintenance.
                  Dates cannot overlap.
                </span>
              </div>
              <button
                onClick={() => onNavigateTab?.('vehicles')}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
              >
                View Maintenance Log →
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Driver Highlight Card (Shown when logged in as Driver) */}
      {isDriverView && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ACTIVE MISSION ASSIGNMENT</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Terminal: Kigali International (KIA)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[11px] mb-1">Client & Destination</div>
              <div className="font-bold text-white text-sm">Dr. Sarah Jenkins (UNHCR)</div>
              <div className="text-amber-400 font-mono text-[11px] mt-0.5">KIA Arrivals → Musanze Gorilla Lodge</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[11px] mb-1">Assigned Vehicle</div>
              <div className="font-bold text-white text-sm">Toyota Land Cruiser Prado TXL</div>
              <div className="text-slate-300 font-mono text-[11px] mt-0.5">Plate: RAD 450 B (4x4 Expedition)</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-[11px] mb-1">Flight Status</div>
                <div className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                  <Plane className="w-4 h-4" />
                  <span>WB 402 · Delayed +35m</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">Est. Touchdown: 10:05 AM</div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAcknowledgeCheckin('bk-101')}
                className={`px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                <Check className="w-4 h-4" />
                <span>Confirm *134# Arrival at Airport</span>
              </button>

              <button
                onClick={() => onNavigateTab?.('simulator')}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Africa’s Talking SMS</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Remera Operations Hotline: +250 788 100 200</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Complete Business Statistics Strip (PART 4 Section 5 of Blueprint) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Fleet Utilization */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Fleet Utilization</span>
            <Car className="w-4 h-4" style={{ color: activeThemeColor }} />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {fleetUtilizationRate}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {bookedVehicles.length} of {vehicles.length} cars deployed · {maintenanceVehicles.length} in garage
          </div>
        </div>

        {/* Metric 2: Active Revenue (RWF) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Booking Value</span>
            <span className="text-[11px] font-mono font-bold text-emerald-400">RWF</span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono truncate">
            {formatRwf(totalRevenueRwf)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>MoMo: <span className="text-emerald-400 font-semibold">{formatRwf(depositPaidRwf)}</span></span>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold hover:underline"
              >
                Analytics →
              </button>
            )}
          </div>
        </div>

        {/* Metric 3: Chauffeur Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Chauffeur Fleet</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {availableDrivers.length} / {drivers.length}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {onTripDrivers.length} on trip · {drivers.filter((d) => d.status === 'Off Duty').length} off duty
          </div>
        </div>

        {/* Metric 4: Collision Guard Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Collision Guard</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-extrabold text-emerald-400 flex items-center gap-1.5 font-mono">
            <span>0 Collisions</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Physical inventory locked exact
          </div>
        </div>
      </div>

      {/* 5. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Upcoming & Active Bookings Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: activeThemeColor }} />
              <span>Upcoming & Active Dispatches ({filteredBookings.length})</span>
            </h2>

            {/* Segmented Filter Controls */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterMode === 'all' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('today')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterMode === 'today' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilterMode('airport')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterMode === 'airport' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Airport (KIA)
              </button>
              <button
                onClick={() => setFilterMode('safari')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterMode === 'safari' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Safaris
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Client & Route</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Chauffeur</th>
                    <th className="py-3 px-4">Flight / Schedule</th>
                    <th className="py-3 px-4">Total (RWF)</th>
                    <th className="py-3 px-4 text-right">Dispatch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredBookings.map((b) => {
                    const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
                    const driver = drivers.find((d) => d.id === b.driver_id);

                    return (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{b.client_name}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{b.destination}</div>
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{b.payment_status}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{vehicle?.model_name || 'Unassigned'}</div>
                          <div className="font-mono text-[11px] font-bold" style={{ color: activeThemeColor }}>
                            {vehicle?.plate_number}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{driver?.name || 'Pending Assignment'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{driver?.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          {b.flight_number && (
                            <div
                              className="flex items-center gap-1 text-[11px] font-mono font-bold"
                              style={{ color: activeThemeColor }}
                            >
                              <Plane className="w-3 h-3" />
                              <span>{b.flight_number}</span>
                              {b.flight_status === 'Delayed' && (
                                <span className="text-[9px] text-rose-400 uppercase bg-rose-950 px-1 rounded">
                                  +{b.flight_delay_minutes || 35}m
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 font-mono">
                            {b.start_date} → {b.end_date}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-100">
                          {formatRwf(b.total_rwf)}
                        </td>
                        <td className="py-3 px-4 text-right space-y-1">
                          {b.dispatch_status === 'Not Sent' && (
                            <button
                              onClick={() => onSelectBookingForDispatch(b.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded transition-all whitespace-nowrap active:scale-95 ${activeBtnText}`}
                              style={{ backgroundColor: activeThemeColor }}
                            >
                              <Send className="w-3 h-3" />
                              <span>Send SMS</span>
                            </button>
                          )}
                          {b.dispatch_status === 'Dispatched (SMS)' && (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-mono font-semibold" style={{ color: activeThemeColor }}>
                                SMS Sent
                              </span>
                              <button
                                onClick={() => onAcknowledgeCheckin(b.id)}
                                className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-mono"
                                title="Simulate driver SMS reply"
                              >
                                Driver *134# Check-in
                              </button>
                            </div>
                          )}
                          {b.dispatch_status === 'Acknowledged by Driver' && (
                            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Driver Confirmed</span>
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
        </div>

        {/* Right Column (1 col): Kigali Airport Status & Real-Time Audit Log */}
        <div className="space-y-4">
          {/* Flight Tracker Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Plane className="w-4 h-4" style={{ color: activeThemeColor }} />
                <span>Kigali Airport (KIA / HRYR) Radar</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                Live Feed
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">RwandAir WB 402</div>
                  <div className="text-[11px] text-slate-400">Entebbe (EBB) → Kigali (KGL)</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  Delayed +35m
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Kenya Airways KQ 448</div>
                  <div className="text-[11px] text-slate-400">Nairobi (NBO) → Kigali (KGL)</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  On Time
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Ethiopian Airlines ET 807</div>
                  <div className="text-[11px] text-slate-400">Addis Ababa (ADD) → Kigali (KGL)</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Scheduled
                </span>
              </div>
            </div>
          </div>

          {/* Operational Log Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Live Audit & Africa’s Talking Logs</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Active Audit</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto text-xs pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200">{log.action}</span>
                    <span className="font-mono text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
