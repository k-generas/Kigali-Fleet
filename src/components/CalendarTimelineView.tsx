import React, { useState } from 'react';
import { Vehicle, Driver, Booking, VehicleCategory } from '../types';
import { datesOverlap, formatRwf, checkDriverCollision } from '../utils/collision';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
  Plane,
  X,
  Compass,
  Bus,
  Car,
  Sparkles,
  Mountain,
  Phone,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface CalendarTimelineViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  currentTheme?: ColorTheme;
  onOpenBookingForVehicle: (vehicleId: string, date: string) => void;
  onAssignDriver: (bookingId: string, driverId: string) => { success: boolean; error?: string };
}

// Category visual helper
export function getCategoryBadge(category: VehicleCategory) {
  switch (category) {
    case 'LandCruiser':
      return {
        label: 'Land Cruiser 4x4',
        icon: Mountain,
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        blockClass: 'bg-amber-600/90 text-white border-amber-400',
      };
    case 'RAV4':
      return {
        label: 'RAV4 AWD',
        icon: Car,
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        blockClass: 'bg-emerald-600/90 text-white border-emerald-400',
      };
    case 'Coaster':
      return {
        label: 'Coaster Bus (30-Seat)',
        icon: Bus,
        badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
        blockClass: 'bg-indigo-600/90 text-white border-indigo-400',
      };
    case 'Safari Van':
      return {
        label: 'Safari Pop-Top',
        icon: Compass,
        badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        blockClass: 'bg-cyan-600/90 text-white border-cyan-400',
      };
    case 'Luxury Sedan':
      return {
        label: 'VIP Luxury Sedan',
        icon: Sparkles,
        badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        blockClass: 'bg-purple-600/90 text-white border-purple-400',
      };
    default:
      return {
        label: category,
        icon: Car,
        badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        blockClass: 'bg-slate-600/90 text-white border-slate-400',
      };
  }
}

export const CalendarTimelineView: React.FC<CalendarTimelineViewProps> = ({
  vehicles,
  drivers,
  bookings,
  currentTheme,
  onOpenBookingForVehicle,
  onAssignDriver,
}) => {
  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';
  const [baseDate, setBaseDate] = useState<Date>(new Date('2026-11-01T00:00:00'));
  const [daysSpan, setDaysSpan] = useState<7 | 10 | 14>(10);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Generate date array
  const dateList: { dateStr: string; dayLabel: string; isToday: boolean }[] = [];
  for (let i = 0; i < daysSpan; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const isToday = dateStr === '2026-11-01';
    dateList.push({ dateStr, dayLabel, isToday });
  }

  const shiftDays = (amount: number) => {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + amount);
    setBaseDate(next);
  };

  // Fleet Conflict Scanner: Scans for any overlapping bookings on the same physical vehicle
  const detectedConflicts: { vehicle: Vehicle; bookings: [Booking, Booking] }[] = [];
  vehicles.forEach((veh) => {
    const vehBookings = bookings.filter((b) => b.vehicle_id === veh.id && b.status !== 'Cancelled');
    for (let i = 0; i < vehBookings.length; i++) {
      for (let j = i + 1; j < vehBookings.length; j++) {
        if (datesOverlap(vehBookings[i].start_date, vehBookings[i].end_date, vehBookings[j].start_date, vehBookings[j].end_date)) {
          detectedConflicts.push({ vehicle: veh, bookings: [vehBookings[i], vehBookings[j]] });
        }
      }
    }
  });

  const filteredVehicles = vehicles.filter((v) => {
    if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
    return true;
  });

  const handleReassignDriver = (bookingId: string, driverId: string) => {
    setAssignmentNotice(null);
    const res = onAssignDriver(bookingId, driverId);
    if (res.success) {
      setAssignmentNotice({ type: 'success', message: 'Driver linked successfully to this mission!' });
      // update modal view
      const updated = bookings.find((b) => b.id === bookingId);
      if (updated) setSelectedBookingDetails({ ...updated, driver_id: driverId });
    } else {
      setAssignmentNotice({ type: 'error', message: res.error || 'Failed to assign driver.' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Real-time Fleet Conflict Alert Strip */}
      {detectedConflicts.length > 0 ? (
        <div className="bg-rose-950/80 border border-rose-600 rounded-xl p-4 text-rose-200 flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold uppercase tracking-wider text-rose-300">
              Double-Booking Overlap Alert Detected!
            </div>
            {detectedConflicts.map((c, idx) => (
              <p key={idx}>
                Conflict on <strong>{c.vehicle.model_name} ({c.vehicle.plate_number})</strong> between client "{c.bookings[0].client_name}" and "{c.bookings[1].client_name}".
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Collision Guard Active · 0 Overlapping Assignments Across Kigali Fleet</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            Timeline window: {dateList[0]?.dateStr} to {dateList[dateList.length - 1]?.dateStr}
          </span>
        </div>
      )}

      {/* Header controls & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: activeThemeColor }} />
            <span>Live Fleet & Driver Assignment Timeline</span>
          </h2>
          <p className="text-xs text-slate-400">
            Day-by-day interactive matrix. Click any booking block to inspect client itinerary or reassign drivers.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 outline-none font-medium"
          >
            <option value="All">All Categories ({vehicles.length})</option>
            <option value="LandCruiser">Land Cruisers (4x4)</option>
            <option value="RAV4">RAV4 AWDs</option>
            <option value="Coaster">Coaster Buses</option>
            <option value="Safari Van">Safari Vans</option>
            <option value="Luxury Sedan">Luxury Sedans</option>
          </select>

          {/* Day Span Selector */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            {[7, 10, 14].map((span) => {
              const isSelected = daysSpan === span;
              return (
                <button
                  key={span}
                  onClick={() => setDaysSpan(span as 7 | 10 | 14)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                    isSelected ? `${activeBtnText} shadow-xs font-bold` : 'text-slate-400 hover:text-white'
                  }`}
                  style={isSelected ? { backgroundColor: activeThemeColor } : undefined}
                >
                  {span}D
                </button>
              );
            })}
          </div>

          {/* Date Navigator */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => shiftDays(-3)}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Previous 3 days"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-200 whitespace-nowrap">
              {dateList[0]?.dayLabel} – {dateList[dateList.length - 1]?.dayLabel}
            </span>
            <button
              onClick={() => shiftDays(3)}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Next 3 days"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setBaseDate(new Date('2026-11-01T00:00:00'))}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg whitespace-nowrap"
          >
            Today
          </button>
        </div>
      </div>

      {/* Timeline Grid Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
        <div className="min-w-[980px]">
          {/* Header Row */}
          <div className="grid grid-cols-12 border-b border-slate-800 bg-slate-950/70 text-xs font-semibold text-slate-300">
            <div className="col-span-3 py-3 px-4 border-r border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              Vehicle Spec & Kigali Plate
            </div>
            <div
              className="col-span-9 grid divide-x divide-slate-800/60 text-center"
              style={{ gridTemplateColumns: `repeat(${daysSpan}, minmax(0, 1fr))` }}
            >
              {dateList.map((d) => (
                <div
                  key={d.dateStr}
                  className={`py-2 px-1 ${
                    d.isToday ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono">{d.dayLabel.split(',')[0]}</div>
                  <div className="text-xs font-mono">{d.dateStr.slice(-2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rows: Each Vehicle */}
          <div className="divide-y divide-slate-800/80">
            {filteredVehicles.map((vehicle) => {
              const badge = getCategoryBadge(vehicle.category);
              const IconComp = badge.icon;
              const windowStart = dateList[0].dateStr;
              const windowEnd = dateList[dateList.length - 1].dateStr;

              const vehicleBookings = bookings.filter(
                (b) =>
                  b.vehicle_id === vehicle.id &&
                  b.status !== 'Cancelled' &&
                  datesOverlap(windowStart, windowEnd, b.start_date, b.end_date)
              );

              return (
                <div key={vehicle.id} className="grid grid-cols-12 hover:bg-slate-800/30 transition-colors">
                  {/* Left Column: Vehicle Details & Category Tag */}
                  <div className="col-span-3 py-3 px-4 border-r border-slate-800 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.badgeClass}`}>
                        <IconComp className="w-3 h-3" />
                        <span>{vehicle.category}</span>
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          vehicle.status === 'Available'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : vehicle.status === 'Booked'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {vehicle.status}
                      </span>
                    </div>

                    <div className="font-bold text-white text-xs mt-1 truncate" title={vehicle.model_name}>
                      {vehicle.model_name}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="font-mono text-amber-300 font-bold">{vehicle.plate_number}</span>
                      <span>·</span>
                      <span className="font-mono">{formatRwf(vehicle.daily_rate_rwf)}/d</span>
                    </div>
                  </div>

                  {/* Right Column: Date Columns */}
                  <div
                    className="col-span-9 grid divide-x divide-slate-800/60 relative py-1"
                    style={{ gridTemplateColumns: `repeat(${daysSpan}, minmax(0, 1fr))` }}
                  >
                    {dateList.map((d) => {
                      const bookingForDate = vehicleBookings.find(
                        (b) => d.dateStr >= b.start_date && d.dateStr <= b.end_date
                      );

                      if (bookingForDate) {
                        const driver = drivers.find((drv) => drv.id === bookingForDate.driver_id);
                        const isStart = d.dateStr === bookingForDate.start_date;
                        const isEnd = d.dateStr === bookingForDate.end_date;

                        return (
                          <div
                            key={d.dateStr}
                            onClick={() => setSelectedBookingDetails(bookingForDate)}
                            className="p-1 flex flex-col justify-center cursor-pointer group"
                            title={`Click to view itinerary & driver assignment for ${bookingForDate.client_name}`}
                          >
                            <div
                              className={`h-11 rounded px-1.5 py-1 text-[10px] leading-tight flex flex-col justify-center font-medium shadow-sm transition-all group-hover:brightness-110 ${
                                badge.blockClass
                              } ${isStart ? 'rounded-l-md font-semibold ring-1 ring-white/30' : ''} ${
                                isEnd ? 'rounded-r-md' : ''
                              }`}
                            >
                              <div className="truncate font-bold text-[11px]">
                                {bookingForDate.client_name.split(' ')[0]}
                              </div>
                              <div className="truncate text-[9px] text-slate-100 flex items-center gap-0.5">
                                <User className="w-2.5 h-2.5 shrink-0" />
                                <span>{driver?.name ? driver.name.split(' ')[0] : 'Unassigned'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Empty Slot (Clickable to create a new booking)
                      return (
                        <div
                          key={d.dateStr}
                          onClick={() => onOpenBookingForVehicle(vehicle.id, d.dateStr)}
                          className="p-1 flex items-center justify-center cursor-pointer hover:bg-emerald-500/10 group transition-colors"
                          title={`Click to schedule ${vehicle.model_name} on ${d.dateStr}`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-400 font-bold">
                            + Book
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Legend & Conflict Guidance */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-300">Category Tags:</span>
          <span className="inline-flex items-center gap-1 text-amber-400">
            <Mountain className="w-3.5 h-3.5" /> Land Cruiser
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <Car className="w-3.5 h-3.5" /> RAV4
          </span>
          <span className="inline-flex items-center gap-1 text-indigo-400">
            <Bus className="w-3.5 h-3.5" /> Coaster Bus
          </span>
          <span className="inline-flex items-center gap-1 text-cyan-400">
            <Compass className="w-3.5 h-3.5" /> Safari Van
          </span>
          <span className="inline-flex items-center gap-1 text-purple-400">
            <Sparkles className="w-3.5 h-3.5" /> Luxury Sedan
          </span>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Click any active booking block to view or reassign chauffeurs
        </div>
      </div>

      {/* Booking Details & Driver Assignment Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    #{selectedBookingDetails.id}
                  </span>
                  <h3 className="text-base font-bold text-white">Booking & Driver Assignment</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Itinerary: {selectedBookingDetails.destination}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBookingDetails(null);
                  setAssignmentNotice(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignmentNotice && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  assignmentNotice.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-700 text-rose-300'
                }`}
              >
                {assignmentNotice.message}
              </div>
            )}

            {/* Client & Booking Summary */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Client</div>
                  <div className="font-bold text-white">{selectedBookingDetails.client_name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    {selectedBookingDetails.client_phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Dates & Total</div>
                  <div className="font-mono text-white font-bold">
                    {selectedBookingDetails.start_date} → {selectedBookingDetails.end_date}
                  </div>
                  <div className="font-mono text-amber-400 font-bold">
                    {formatRwf(selectedBookingDetails.total_rwf)}
                  </div>
                </div>
              </div>

              {selectedBookingDetails.flight_number && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1 font-mono text-amber-300">
                    <Plane className="w-3.5 h-3.5" />
                    <span>Flight: {selectedBookingDetails.flight_number}</span>
                  </span>
                  <span className="font-semibold text-emerald-400">
                    Status: {selectedBookingDetails.flight_status || 'On Time'}
                  </span>
                </div>
              )}
            </div>

            {/* Driver Assignment Section */}
            <div className="space-y-2 text-xs">
              <label className="block text-slate-300 font-semibold">
                Link Available Chauffeur to This Mission:
              </label>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {drivers.map((drv) => {
                  const isCurrent = selectedBookingDetails.driver_id === drv.id;
                  // Check if this driver is busy with another booking during these exact dates
                  const driverConflict = checkDriverCollision(
                    drv.id,
                    selectedBookingDetails.start_date,
                    selectedBookingDetails.end_date,
                    bookings,
                    selectedBookingDetails.id
                  );

                  return (
                    <div
                      key={drv.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-amber-500/15 border-amber-500/50 text-white'
                          : driverConflict.hasCollision
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{drv.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({drv.language})</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold uppercase">
                              Currently Linked
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{drv.phone} · Rating: {drv.rating} ★</span>
                        </div>
                        {driverConflict.hasCollision && (
                          <div className="text-[10px] text-rose-400 mt-0.5 font-medium">
                            Busy: {driverConflict.conflictReason}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleReassignDriver(selectedBookingDetails.id, drv.id)}
                        disabled={isCurrent || driverConflict.hasCollision}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                          isCurrent
                            ? 'bg-emerald-600 text-white cursor-default'
                            : driverConflict.hasCollision
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        }`}
                      >
                        {isCurrent ? 'Linked' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedBookingDetails(null);
                  setAssignmentNotice(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
