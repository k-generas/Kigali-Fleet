import React from 'react';
import { Vehicle, Driver, Booking, ActivityLog } from '../types';
import { formatRwf } from '../utils/collision';
import { ShieldCheck, Plane, Car, Send, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { ColorTheme } from '../theme';

interface OverviewViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  logs: ActivityLog[];
  currentTheme?: ColorTheme;
  onOpenNewBooking: () => void;
  onOpenStorefront: () => void;
  onSelectBookingForDispatch: (bookingId: string) => void;
  onAcknowledgeCheckin: (bookingId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  vehicles,
  drivers,
  bookings,
  logs,
  currentTheme,
  onOpenNewBooking,
  onOpenStorefront,
  onSelectBookingForDispatch,
  onAcknowledgeCheckin,
}) => {
  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  const bookedVehicles = vehicles.filter((v) => v.status === 'Booked');
  const activeBookings = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'In Progress');
  const availableDrivers = drivers.filter((d) => d.status === 'Available');

  const totalRevenueRwf = activeBookings.reduce((sum, b) => sum + b.total_rwf, 0);
  const fleetUtilizationRate = Math.round((bookedVehicles.length / (vehicles.length || 1)) * 100);

  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Operational Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: activeThemeColor }}>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span>KIGALI HUB · OPERATIONAL DISPATCH READY</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Kigali Fleet & Dispatch Control
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Live schedule for private car rentals, safari expeditions, and Kigali International Airport (KIA) VIP transfers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenStorefront}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            WhatsApp Storefront
          </button>
          <button
            onClick={onOpenNewBooking}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm active:scale-95 ${activeBtnText}`}
            style={{ backgroundColor: activeThemeColor }}
          >
            + Create Guarded Booking
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Fleet Utilization */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Fleet Utilization</span>
            <Car className="w-4 h-4" style={{ color: activeThemeColor }} />
          </div>
          <div className="mt-2 text-2xl font-bold text-white tabular-nums">
            {fleetUtilizationRate}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {bookedVehicles.length} of {vehicles.length} vehicles deployed
          </div>
        </div>

        {/* Metric 2: Active Revenue */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Active Bookings Ledger</span>
            <span className="text-[11px] font-semibold text-emerald-400">RWF</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tabular-nums truncate">
            {formatRwf(totalRevenueRwf)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {activeBookings.length} confirmed orders
          </div>
        </div>

        {/* Metric 3: Ready Drivers */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Available Drivers</span>
            <span className="text-[11px] font-semibold text-slate-400">EN / RW</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tabular-nums">
            {availableDrivers.length} / {drivers.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {drivers.filter((d) => d.status === 'On Trip').length} currently on route
          </div>
        </div>

        {/* Metric 4: Collision Guard Status */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Collision Guard</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-emerald-400 flex items-center gap-1.5">
            <span>0 Collisions</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Inventory locked millisecond-exact
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Active Bookings & Dispatch Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Upcoming & Active Dispatches
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Africa's Talking SMS & Flight Sync
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client & Mission</th>
                    <th className="py-3 px-4">Vehicle & Plate</th>
                    <th className="py-3 px-4">Assigned Driver</th>
                    <th className="py-3 px-4">Flight & Dates</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4 text-right">Dispatch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {bookings.map((b) => {
                    const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
                    const driver = drivers.find((d) => d.id === b.driver_id);

                    return (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{b.client_name}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {b.destination}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">
                            {vehicle?.model_name || 'Unassigned'}
                          </div>
                          <div className="font-mono text-[11px] font-semibold" style={{ color: activeThemeColor }}>
                            {vehicle?.plate_number}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">
                            {driver?.name || 'Pending'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {driver?.phone} ({driver?.language})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {b.flight_number && (
                            <div className="flex items-center gap-1 text-[11px] font-mono" style={{ color: activeThemeColor }}>
                              <Plane className="w-3 h-3" />
                              <span>{b.flight_number}</span>
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400">
                            {b.start_date} → {b.end_date}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold tabular-nums text-slate-200">
                          {formatRwf(b.total_rwf)}
                        </td>
                        <td className="py-3 px-4 text-right space-y-1">
                          {b.dispatch_status === 'Not Sent' && (
                            <button
                              onClick={() => onSelectBookingForDispatch(b.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded transition-all whitespace-nowrap active:scale-95 ${activeBtnText}`}
                              style={{ backgroundColor: activeThemeColor }}
                            >
                              <Send className="w-3 h-3" />
                              <span>SMS Dispatch</span>
                            </button>
                          )}
                          {b.dispatch_status === 'Dispatched (SMS)' && (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-medium" style={{ color: activeThemeColor }}>
                                SMS Dispatched
                              </span>
                              <button
                                onClick={() => onAcknowledgeCheckin(b.id)}
                                className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                                title="Simulate driver dialing *134# USSD checkin"
                              >
                                Driver *134# Check-in
                              </button>
                            </div>
                          )}
                          {b.dispatch_status === 'Acknowledged by Driver' && (
                            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirmed & Active</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Plane className="w-4 h-4" style={{ color: activeThemeColor }} />
                <span>KIA Flight Monitor (Kigali Terminal)</span>
              </div>
              <span className="text-[10px] text-slate-400">Live</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">RwandAir WB 402</div>
                  <div className="text-[11px] text-slate-400">Entebbe (EBB) → Kigali (KGL)</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  On Time
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Qatar Airways QR 1387</div>
                  <div className="text-[11px] text-slate-400">Doha (DOH) → Kigali (KGL)</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  Delayed 45m
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">KLM KL 535</div>
                  <div className="text-[11px] text-slate-400">Amsterdam (AMS) → Kigali (KGL)</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Scheduled
                </span>
              </div>
            </div>
          </div>

          {/* Operational Log Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Live Audit & Africa's Talking Logs</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Active</span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto text-xs pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded bg-slate-950/70 border border-slate-800/60 space-y-1"
                >
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
