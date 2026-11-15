import React, { useState, useMemo } from 'react';
import { Vehicle, Driver, Booking, VehicleCategory, BookingStatus, MaintenanceRecord } from '../types';
import { datesOverlap, formatRwf, checkDriverCollision, calculateDays } from '../utils/collision';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Plane,
  X,
  Compass,
  Bus,
  Car,
  Sparkles,
  Mountain,
  Search,
  Ban,
  Phone,
  CheckCircle,
  Wrench,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface CalendarTimelineViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  maintenance?: MaintenanceRecord[];
  currentTheme?: ColorTheme;
  onOpenBookingForVehicle: (vehicleId: string, date: string) => void;
  onAssignDriver: (bookingId: string, driverId: string) => { success: boolean; error?: string };
  onToggleMaintenance?: (vehicleId: string, notes?: string) => void;
  onUpdateBookingStatus?: (bookingId: string, status: BookingStatus) => void;
  onSelectBookingForDispatch?: (booking: Booking) => void;
}

export function getVehicleNickname(vehicle: Vehicle): { nickname: string; subtitle: string } {
  if (vehicle.category === 'LandCruiser') {
    if (vehicle.model_name.includes('V8')) {
      return { nickname: 'Black Stallion', subtitle: `${vehicle.model_name.split('(')[0].trim()} ${vehicle.year || 2024}` };
    }
    return { nickname: 'Karisimbi 4x4', subtitle: `${vehicle.model_name.split('(')[0].trim()} ${vehicle.year || 2023}` };
  }
  if (vehicle.category === 'RAV4') {
    if (vehicle.model_name.includes('Hybrid')) {
      return { nickname: 'Blanco Hybrid', subtitle: `Toyota RAV4 Hybrid ${vehicle.year || 2022}` };
    }
    return { nickname: 'Blueberry 4x4', subtitle: `Toyota RAV4 4x4 ${vehicle.year || 2023}` };
  }
  if (vehicle.category === 'Safari Van') {
    return { nickname: 'Casper Safari', subtitle: `Safari Land Cruiser ${vehicle.year || 2023}` };
  }
  if (vehicle.category === 'Coaster') {
    return { nickname: 'Clifford Bus', subtitle: `Toyota Coaster 30-Seat ${vehicle.year || 2023}` };
  }
  if (vehicle.category === 'Luxury Sedan') {
    return { nickname: 'Frost VIP', subtitle: `Mercedes-Benz E-Class ${vehicle.year || 2023}` };
  }
  const firstWord = vehicle.model_name.split(' ')[0] || 'Car';
  return { nickname: `${firstWord} #${vehicle.plate_number.slice(-3)}`, subtitle: vehicle.model_name };
}

export function getCategoryBadge(category: VehicleCategory) {
  switch (category) {
    case 'LandCruiser':
      return {
        label: 'Land Cruiser 4x4',
        icon: Mountain,
        badgeClass: 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
        blockClass: 'bg-amber-600/90 text-white border-amber-400',
      };
    case 'RAV4':
      return {
        label: 'RAV4 AWD',
        icon: Car,
        badgeClass: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
        blockClass: 'bg-emerald-600/90 text-white border-emerald-400',
      };
    case 'Coaster':
      return {
        label: 'Coaster Bus (30-Seat)',
        icon: Bus,
        badgeClass: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
        blockClass: 'bg-indigo-600/90 text-white border-indigo-400',
      };
    case 'Safari Van':
      return {
        label: 'Safari Pop-Top',
        icon: Compass,
        badgeClass: 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
        blockClass: 'bg-cyan-600/90 text-white border-cyan-400',
      };
    case 'Luxury Sedan':
      return {
        label: 'VIP Luxury Car',
        icon: Sparkles,
        badgeClass: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
        blockClass: 'bg-purple-600/90 text-white border-purple-400',
      };
    default:
      return {
        label: category,
        icon: Car,
        badgeClass: 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
        blockClass: 'bg-slate-600/90 text-white border-slate-400',
      };
  }
}

export function getCategoryIcon(category: VehicleCategory) {
  return getCategoryBadge(category).icon;
}

export const CalendarTimelineView: React.FC<CalendarTimelineViewProps> = ({
  vehicles,
  drivers,
  bookings,
  maintenance = [],
  currentTheme,
  onOpenBookingForVehicle,
  onAssignDriver,
  onToggleMaintenance,
  onUpdateBookingStatus,
  onSelectBookingForDispatch,
}) => {
  const activeThemeColor = currentTheme?.hex || '#635bff';
  const activeBtnText = currentTheme?.btnText || 'text-white';

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date('2026-11-01T00:00:00'));
  const [viewMode, setViewMode] = useState<'Fleet' | 'Vehicle' | 'Booked'>('Fleet');
  const [rangeMode, setRangeMode] = useState<'month' | 'first_half' | 'second_half'>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isBlockVehicleModalOpen, setIsBlockVehicleModalOpen] = useState(false);
  const [blockSelectedVehicleId, setBlockSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [blockReason, setBlockReason] = useState<string>('Police Safety Check');
  const [blockNotes, setBlockNotes] = useState<string>('');

  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shortMonthName = currentMonthDate.toLocaleDateString('en-US', { month: 'short' });

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const daysList = useMemo(() => {
    const list: {
      dayIndex: number;
      dateStr: string;
      weekdayShort: string;
      isToday: boolean;
      isWeekend: boolean;
    }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const padMonth = String(currentMonth + 1).padStart(2, '0');
      const padDay = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${padMonth}-${padDay}`;
      const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isToday = dateStr === '2026-11-01';

      list.push({ dayIndex: day, dateStr, weekdayShort, isToday, isWeekend });
    }
    return list;
  }, [currentYear, currentMonth, daysInMonth]);

  const shiftMonth = (delta: number) => {
    setCurrentMonthDate(new Date(currentYear, currentMonth + delta, 1));
  };

  const jumpToToday = () => {
    setCurrentMonthDate(new Date('2026-11-01T00:00:00'));
  };

  const visibleDaysList = useMemo(() => {
    if (rangeMode === 'first_half') return daysList.slice(0, 15);
    if (rangeMode === 'second_half') return daysList.slice(15);
    return daysList;
  }, [daysList, rangeMode]);

  const monthStartStr = daysList[0]?.dateStr || '';
  const monthEndStr = daysList[daysList.length - 1]?.dateStr || '';
  const windowStartStr = visibleDaysList[0]?.dateStr || monthStartStr;
  const windowEndStr = visibleDaysList[visibleDaysList.length - 1]?.dateStr || monthEndStr;

  const vehicleStats = useMemo(() => {
    const map = new Map<string, { daysBooked: number; ratePct: number }>();
    vehicles.forEach((veh) => {
      let daysCount = 0;
      daysList.forEach((d) => {
        const isBooked = bookings.some(
          (b) =>
            b.vehicle_id === veh.id &&
            b.status !== 'Cancelled' &&
            d.dateStr >= b.start_date &&
            d.dateStr <= b.end_date
        );
        if (isBooked) daysCount++;
      });
      const ratePct = Math.round((daysCount / daysInMonth) * 100);
      map.set(veh.id, { daysBooked: daysCount, ratePct });
    });
    return map;
  }, [vehicles, bookings, daysList, daysInMonth]);

  const fleetMetrics = useMemo(() => {
    const todayStr = '2026-11-01';
    const activeTodayCount = vehicles.filter((v) =>
      bookings.some(
        (b) =>
          b.vehicle_id === v.id &&
          b.status !== 'Cancelled' &&
          todayStr >= b.start_date &&
          todayStr <= b.end_date
      )
    ).length;

    const tripsTodayPct = vehicles.length > 0 ? Math.round((activeTodayCount / vehicles.length) * 100) : 0;

    let totalFleetDaysBooked = 0;
    vehicleStats.forEach((stat) => {
      totalFleetDaysBooked += stat.daysBooked;
    });
    const totalPossibleFleetDays = vehicles.length * daysInMonth;
    const fleetUtilPct = totalPossibleFleetDays > 0 ? Math.round((totalFleetDaysBooked / totalPossibleFleetDays) * 100) : 0;

    return {
      activeTodayCount,
      totalVehicles: vehicles.length,
      tripsTodayPct,
      totalFleetDaysBooked,
      totalPossibleFleetDays,
      fleetUtilPct,
    };
  }, [vehicles, bookings, vehicleStats, daysInMonth]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
      if (viewMode === 'Booked') {
        const hasBookingsInMonth = bookings.some(
          (b) =>
            b.vehicle_id === v.id &&
            b.status !== 'Cancelled' &&
            datesOverlap(monthStartStr, monthEndStr, b.start_date, b.end_date)
        );
        if (!hasBookingsInMonth) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const { nickname, subtitle } = getVehicleNickname(v);
        if (
          !nickname.toLowerCase().includes(q) &&
          !subtitle.toLowerCase().includes(q) &&
          !v.plate_number.toLowerCase().includes(q) &&
          !v.model_name.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [vehicles, bookings, categoryFilter, viewMode, searchQuery, monthStartStr, monthEndStr]);

  const statusCounts = useMemo(() => {
    const monthBookings = bookings.filter((b) =>
      datesOverlap(monthStartStr, monthEndStr, b.start_date, b.end_date)
    );
    return {
      Completed: monthBookings.filter((b) => b.status === 'Completed').length,
      Booked: monthBookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending Dispatch').length,
      InProgress: monthBookings.filter((b) => b.status === 'In Progress').length,
      Cancelled: monthBookings.filter((b) => b.status === 'Cancelled').length,
    };
  }, [bookings, monthStartStr, monthEndStr]);

  const detectedConflicts = useMemo(() => {
    const conflicts: { vehicle: Vehicle; bookings: [Booking, Booking] }[] = [];
    vehicles.forEach((veh) => {
      const vehBookings = bookings.filter((b) => b.vehicle_id === veh.id && b.status !== 'Cancelled');
      for (let i = 0; i < vehBookings.length; i++) {
        for (let j = i + 1; j < vehBookings.length; j++) {
          if (
            datesOverlap(
              vehBookings[i].start_date,
              vehBookings[i].end_date,
              vehBookings[j].start_date,
              vehBookings[j].end_date
            )
          ) {
            conflicts.push({ vehicle: veh, bookings: [vehBookings[i], vehBookings[j]] });
          }
        }
      }
    });
    return conflicts;
  }, [vehicles, bookings]);

  const handleReassignDriver = (bookingId: string, driverId: string) => {
    setAssignmentNotice(null);
    const res = onAssignDriver(bookingId, driverId);
    if (res.success) {
      setAssignmentNotice({ type: 'success', message: 'Driver saved to this trip!' });
      const updated = bookings.find((b) => b.id === bookingId);
      if (updated) setSelectedBooking({ ...updated, driver_id: driverId });
    } else {
      setAssignmentNotice({ type: 'error', message: res.error || 'Could not assign driver.' });
    }
  };

  const handleConfirmBlockVehicle = () => {
    if (onToggleMaintenance && blockSelectedVehicleId) {
      const combinedNotes = `${blockReason}${blockNotes ? ` - ${blockNotes}` : ''}`;
      onToggleMaintenance(blockSelectedVehicleId, combinedNotes);
      setIsBlockVehicleModalOpen(false);
      setBlockNotes('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Safety Banner */}
      {detectedConflicts.length > 0 ? (
        <div className="bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 rounded-2xl p-4 text-rose-900 dark:text-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <div className="font-bold">Same Car Booked Twice on Same Days!</div>
            {detectedConflicts.map((c, idx) => (
              <p key={idx}>
                Check <strong>{c.vehicle.model_name} ({c.vehicle.plate_number})</strong>: "{c.bookings[0].client_name}" and "{c.bookings[1].client_name}".
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>Zero Double Bookings · All cars have clear schedules</span>
          </div>
          <span className="text-[#425466] dark:text-slate-400 font-mono text-xs hidden sm:inline">
            {monthStartStr} to {monthEndStr}
          </span>
        </div>
      )}

      {/* Control Bar */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#0a2540] dark:text-white tracking-tight">
              Trip Calendar
            </h1>

            <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1">
              <button
                onClick={() => shiftMonth(-1)}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-full text-[#425466] dark:text-slate-300 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold px-3 text-[#0a2540] dark:text-white whitespace-nowrap min-w-[130px] text-center">
                {monthName}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-full text-[#425466] dark:text-slate-300 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={jumpToToday}
              className="text-sm px-3.5 py-2 bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full border border-slate-200 dark:border-slate-700 font-semibold transition-colors hidden sm:inline-block"
            >
              Today
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsBlockVehicleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-full text-sm font-bold transition-colors"
            >
              <Ban className="w-4 h-4" />
              <span>Block a Car</span>
            </button>

            <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-sm font-semibold">
              {[
                { id: 'Fleet' as const, label: 'All Cars' },
                { id: 'Booked' as const, label: 'Booked Only' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setViewMode(m.id)}
                  className={`px-3.5 py-1 rounded-full transition-all ${
                    viewMode === m.id
                      ? `${activeBtnText} shadow-xs`
                      : 'text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white'
                  }`}
                  style={viewMode === m.id ? { backgroundColor: activeThemeColor } : undefined}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-xs font-semibold">
              {[
                { id: 'month' as const, label: 'Full Month' },
                { id: 'first_half' as const, label: 'Days 1–15' },
                { id: 'second_half' as const, label: `Days 16–${daysInMonth}` },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRangeMode(r.id)}
                  className={`px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                    rangeMode === r.id
                      ? `${activeBtnText} shadow-xs`
                      : 'text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white'
                  }`}
                  style={rangeMode === r.id ? { backgroundColor: activeThemeColor } : undefined}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-0 sm:min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search car or plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-9 pr-8 py-2 text-sm text-[#0a2540] dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 font-semibold"
            >
              <option value="All">All Types ({vehicles.length})</option>
              <option value="LandCruiser">Land Cruiser 4x4</option>
              <option value="RAV4">RAV4</option>
              <option value="Coaster">Coaster Bus</option>
              <option value="Safari Van">Safari Van</option>
              <option value="Luxury Sedan">VIP Car</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills + Quick Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <button
              onClick={() => setStatusFilter(statusFilter === 'Completed' ? 'All' : 'Completed')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Done ({statusCounts.Completed})</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'Booked' ? 'All' : 'Booked')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                statusFilter === 'Booked'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Booked ({statusCounts.Booked})</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                statusFilter === 'In Progress'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>On Trip ({statusCounts.InProgress})</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'Cancelled' ? 'All' : 'Cancelled')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                statusFilter === 'Cancelled'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Cancelled ({statusCounts.Cancelled})</span>
            </button>

            {statusFilter !== 'All' && (
              <button
                onClick={() => setStatusFilter('All')}
                className="text-sm text-[#425466] dark:text-slate-300 hover:underline ml-1"
              >
                Show All
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-[#425466] dark:text-slate-400 font-medium">
              {filteredVehicles.length} cars
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {fleetMetrics.activeTodayCount}/{fleetMetrics.totalVehicles} out today ({fleetMetrics.tripsTodayPct}%)
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden md:inline">|</span>
            <span className="text-[#425466] dark:text-slate-300 font-medium hidden md:inline">
              Booked {fleetMetrics.fleetUtilPct}% in {shortMonthName} {currentYear}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Fluid Fit-Screen Horizontal Timeline Grid (Zero Horizontal Scroll) */}
      <div className="hidden lg:block stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Header Row */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-[#f6f9fc] dark:bg-slate-800/90 sticky top-0 z-20">
          <div className="w-[205px] xl:w-[225px] shrink-0 px-3.5 py-3 border-r border-slate-200 dark:border-slate-800 font-bold text-[#0a2540] dark:text-white text-sm flex items-center justify-between">
            <span>{filteredVehicles.length} Cars</span>
            <span className="text-xs text-[#425466] dark:text-slate-400 font-mono">Days Booked</span>
          </div>

          <div
            className="flex-1 min-w-0 grid"
            style={{ gridTemplateColumns: `repeat(${visibleDaysList.length}, minmax(0, 1fr))` }}
          >
            {visibleDaysList.map((d) => (
              <div
                key={d.dateStr}
                className={`py-2 text-center border-r border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center min-w-0 ${
                  d.isToday
                    ? 'bg-blue-50 dark:bg-blue-600/15'
                    : d.isWeekend
                    ? 'bg-slate-100/70 dark:bg-slate-900/40'
                    : ''
                }`}
              >
                <div className="text-xs font-bold uppercase text-[#425466] dark:text-slate-400 font-mono leading-none">
                  {rangeMode === 'month' ? d.weekdayShort.slice(0, 1) : d.weekdayShort}
                </div>

                {d.isToday ? (
                  <div className="w-6 h-6 mt-1 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    {d.dayIndex}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-[#0a2540] dark:text-slate-200 mt-1 tabular-nums">
                    {d.dayIndex}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredVehicles.map((vehicle) => {
            const { nickname, subtitle } = getVehicleNickname(vehicle);
            const stats = vehicleStats.get(vehicle.id) || { daysBooked: 0, ratePct: 0 };

            const vehBookings = bookings
              .filter(
                (b) =>
                  b.vehicle_id === vehicle.id &&
                  (statusFilter === 'All'
                    ? b.status !== 'Cancelled'
                    : statusFilter === 'Completed'
                    ? b.status === 'Completed'
                    : statusFilter === 'Booked'
                    ? b.status === 'Confirmed' || b.status === 'Pending Dispatch'
                    : statusFilter === 'In Progress'
                    ? b.status === 'In Progress'
                    : b.status === 'Cancelled')
              )
              .sort((a, b) => a.start_date.localeCompare(b.start_date));

            const turnaroundAlerts: { prevBooking: Booking; nextBooking: Booking; dateStr: string; gapHours: number }[] = [];
            for (let i = 0; i < vehBookings.length - 1; i++) {
              const curr = vehBookings[i];
              const next = vehBookings[i + 1];
              if (curr.end_date === next.start_date) {
                turnaroundAlerts.push({ prevBooking: curr, nextBooking: next, dateStr: curr.end_date, gapHours: 2 });
              } else {
                const diffDays = Math.round(
                  (new Date(next.start_date).getTime() - new Date(curr.end_date).getTime()) / (1000 * 3600 * 24)
                );
                if (diffDays === 1) {
                  turnaroundAlerts.push({ prevBooking: curr, nextBooking: next, dateStr: curr.end_date, gapHours: 4 });
                }
              }
            }

            const totalVisibleDays = Math.max(1, visibleDaysList.length);

            return (
              <div
                key={vehicle.id}
                className="flex hover:bg-[#f6f9fc]/70 dark:hover:bg-slate-800/30 transition-colors group relative"
              >
                {/* Left Car Column */}
                <div className="w-[205px] xl:w-[225px] shrink-0 p-3 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-center min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#0a2540] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {nickname}
                      </div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 truncate mt-0.5">
                        {subtitle}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold font-mono tabular-nums ${
                          stats.ratePct >= 60
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : stats.ratePct >= 30
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[#425466] dark:text-slate-400'
                        }`}
                      >
                        {stats.ratePct}%
                      </span>
                      <div className="text-xs text-[#425466] dark:text-slate-500 font-mono tabular-nums">
                        {stats.daysBooked}/{daysInMonth}d
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#425466] dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 gap-2">
                    <span className="font-mono text-[#0a2540] dark:text-amber-300 font-bold whitespace-nowrap">
                      {vehicle.plate_number}
                    </span>
                    <span className="font-mono whitespace-nowrap tabular-nums">
                      {formatRwf(vehicle.daily_rate_rwf)}/d
                    </span>
                  </div>
                </div>

                {/* Fluid Percentage Timeline Grid */}
                <div
                  className="flex-1 min-w-0 grid relative h-[72px]"
                  style={{ gridTemplateColumns: `repeat(${visibleDaysList.length}, minmax(0, 1fr))` }}
                >
                  {visibleDaysList.map((d) => (
                    <div
                      key={d.dateStr}
                      onClick={() => onOpenBookingForVehicle(vehicle.id, d.dateStr)}
                      className={`h-full border-r border-slate-100 dark:border-slate-800/70 relative cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-600/10 group/cell transition-colors min-w-0 ${
                        d.isWeekend ? 'bg-slate-50/70 dark:bg-slate-900/30' : ''
                      }`}
                      title={`Click to book ${vehicle.model_name} on ${d.dateStr}`}
                    >
                      <span className="opacity-0 group-hover/cell:opacity-100 absolute inset-0 flex items-center justify-center text-xs text-blue-600 dark:text-blue-400 font-bold pointer-events-none">
                        +
                      </span>
                    </div>
                  ))}

                  {turnaroundAlerts.map((alert, idx) => {
                    const alertPos = visibleDaysList.findIndex((d) => d.dateStr === alert.dateStr);
                    if (alertPos < 0) return null;
                    const leftPct = Math.min(92, ((alertPos + 0.5) / totalVisibleDays) * 100);

                    return (
                      <div
                        key={`turnaround-${idx}`}
                        style={{ left: `${leftPct}%`, top: '3px' }}
                        className="absolute z-15 pointer-events-none"
                      >
                        <span className="bg-amber-400 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                          {alert.gapHours}h wash
                        </span>
                      </div>
                    );
                  })}

                  {vehBookings.map((bk) => {
                    if (bk.end_date < windowStartStr || bk.start_date > windowEndStr) return null;

                    const effectiveStartStr = bk.start_date < windowStartStr ? windowStartStr : bk.start_date;
                    const effectiveEndStr = bk.end_date > windowEndStr ? windowEndStr : bk.end_date;

                    const startIndex = visibleDaysList.findIndex((d) => d.dateStr === effectiveStartStr);
                    const endIndex = visibleDaysList.findIndex((d) => d.dateStr === effectiveEndStr);
                    if (startIndex < 0 || endIndex < 0) return null;

                    const spanDays = Math.max(1, endIndex - startIndex + 1);
                    const leftPct = (startIndex / totalVisibleDays) * 100;
                    const widthPct = (spanDays / totalVisibleDays) * 100;

                    const isCompleted = bk.status === 'Completed';
                    const isInProgress = bk.status === 'In Progress';
                    const isCancelled = bk.status === 'Cancelled';

                    let barBg = 'bg-blue-600 hover:bg-blue-500 text-white';
                    if (isCompleted) {
                      barBg = 'bg-emerald-600 hover:bg-emerald-500 text-white';
                    } else if (isInProgress) {
                      barBg = 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold';
                    } else if (isCancelled) {
                      barBg = 'bg-slate-400 dark:bg-slate-700 text-white';
                    }

                    const hasTurnaround = turnaroundAlerts.some(
                      (t) => t.prevBooking.id === bk.id || t.nextBooking.id === bk.id
                    );
                    const totalDays = calculateDays(bk.start_date, bk.end_date);

                    return (
                      <div
                        key={bk.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(bk);
                        }}
                        style={{
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                          top: '16px',
                          height: '40px',
                        }}
                        className={`absolute z-10 rounded-xl px-2 flex items-center justify-between text-xs font-semibold cursor-pointer shadow-sm transition-transform hover:-translate-y-0.5 select-none overflow-hidden ${barBg} ${
                          hasTurnaround ? 'ring-2 ring-amber-300' : ''
                        }`}
                        title={`#${bk.id} · ${bk.client_name} · ${bk.destination} (${bk.start_date} to ${bk.end_date})`}
                      >
                        <div className="flex items-center gap-1 min-w-0 truncate">
                          <span className="font-bold whitespace-nowrap tabular-nums">
                            {spanDays >= 2 ? `${totalDays}d · ${formatRwf(bk.total_rwf)}` : `${totalDays}d`}
                          </span>
                          {spanDays >= 4 && (
                            <span className="opacity-90 font-medium truncate">
                              · {bk.client_name.split(' ')[0]}
                            </span>
                          )}
                        </div>

                        {spanDays >= 3 && (
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {bk.flight_number && <Plane className="w-3.5 h-3.5 opacity-90" />}
                            {hasTurnaround && <Sparkles className="w-3.5 h-3.5 text-amber-200" />}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {maintenance
                    .filter(
                      (m) =>
                        m.vehicle_id === vehicle.id &&
                        m.status !== 'Completed' &&
                        datesOverlap(windowStartStr, windowEndStr, m.start_date, m.expected_completion_date || m.start_date)
                    )
                    .map((m) => {
                      const mEnd = m.expected_completion_date || m.start_date;
                      const effectiveStartStr = m.start_date < windowStartStr ? windowStartStr : m.start_date;
                      const effectiveEndStr = mEnd > windowEndStr ? windowEndStr : mEnd;

                      const startIndex = visibleDaysList.findIndex((d) => d.dateStr === effectiveStartStr);
                      const endIndex = visibleDaysList.findIndex((d) => d.dateStr === effectiveEndStr);
                      if (startIndex < 0 || endIndex < 0) return null;

                      const spanDays = Math.max(1, endIndex - startIndex + 1);
                      const leftPct = (startIndex / totalVisibleDays) * 100;
                      const widthPct = (spanDays / totalVisibleDays) * 100;

                      return (
                        <div
                          key={m.id}
                          style={{
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                            top: '16px',
                            height: '40px',
                          }}
                          className="absolute z-20 rounded-xl px-2 flex items-center justify-between text-xs font-bold shadow-sm bg-rose-600 text-white border border-rose-400 select-none overflow-hidden"
                          title={`In Garage: ${m.garage_name} (${m.service_type})`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <Wrench className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">In Garage: {m.service_type}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tablet & Mobile Horizontal Car Schedule Grid (Zero Horizontal Scroll) */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredVehicles.map((vehicle) => {
          const { nickname, subtitle } = getVehicleNickname(vehicle);
          const stats = vehicleStats.get(vehicle.id) || { daysBooked: 0, ratePct: 0 };
          const vehBookings = bookings
            .filter(
              (b) =>
                b.vehicle_id === vehicle.id &&
                datesOverlap(monthStartStr, monthEndStr, b.start_date, b.end_date) &&
                (statusFilter === 'All'
                  ? b.status !== 'Cancelled'
                  : statusFilter === 'Completed'
                  ? b.status === 'Completed'
                  : statusFilter === 'Booked'
                  ? b.status === 'Confirmed' || b.status === 'Pending Dispatch'
                  : statusFilter === 'In Progress'
                  ? b.status === 'In Progress'
                  : b.status === 'Cancelled')
            )
            .sort((a, b) => a.start_date.localeCompare(b.start_date));

          const activeMaint = maintenance.filter(
            (m) =>
              m.vehicle_id === vehicle.id &&
              m.status !== 'Completed' &&
              datesOverlap(monthStartStr, monthEndStr, m.start_date, m.expected_completion_date || m.start_date)
          );

          return (
            <div
              key={vehicle.id}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#0a2540] dark:text-white truncate">{nickname}</div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 truncate">{subtitle}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                    <span className="font-bold text-[#0a2540] dark:text-amber-300">{vehicle.plate_number}</span>
                    <span className="text-[#425466] dark:text-slate-400">{formatRwf(vehicle.daily_rate_rwf)}/d</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {stats.ratePct}%
                  </div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 font-mono tabular-nums">
                    {stats.daysBooked}/{daysInMonth}d
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                {activeMaint.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Wrench className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">In Garage: {m.service_type}</span>
                    </span>
                    <span className="font-mono whitespace-nowrap shrink-0">{m.start_date}</span>
                  </div>
                ))}

                {vehBookings.length === 0 && activeMaint.length === 0 ? (
                  <div className="text-xs text-[#425466] dark:text-slate-400 py-2">
                    Free all {shortMonthName} {currentYear}
                  </div>
                ) : (
                  vehBookings.map((bk) => (
                    <button
                      key={bk.id}
                      onClick={() => setSelectedBooking(bk)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs hover:border-indigo-400 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#0a2540] dark:text-white truncate">{bk.client_name}</div>
                        <div className="text-[#425466] dark:text-slate-400 font-mono whitespace-nowrap">
                          {bk.start_date} → {bk.end_date}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#0a2540] dark:text-amber-400 whitespace-nowrap shrink-0">
                        {formatRwf(bk.total_rwf)}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => onOpenBookingForVehicle(vehicle.id, monthStartStr)}
                className={`w-full py-2 rounded-xl text-xs font-bold ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                + Book {nickname}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#425466] dark:text-slate-400 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-[#0a2540] dark:text-slate-200">Colors:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span> Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span> Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span> On Trip
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
            <Wrench className="w-4 h-4" /> In Garage
          </span>
        </div>

        <div className="text-xs text-[#425466] dark:text-slate-400">
          Click any empty day to book a car · Click a colored bar to see trip details
        </div>
      </div>

      {/* Trip Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-bold">
                    #{selectedBooking.id}
                  </span>
                  <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Trip Details</h3>
                </div>
                <p className="text-sm text-[#425466] dark:text-slate-400 mt-0.5">
                  Going to: {selectedBooking.destination}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setAssignmentNotice(null);
                }}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignmentNotice && (
              <div
                className={`p-3.5 rounded-xl text-sm font-medium ${
                  assignmentNotice.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                }`}
              >
                {assignmentNotice.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 bg-[#f6f9fc] dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
              <div>
                <span className="text-[#425466] dark:text-slate-400 block text-xs">Guest:</span>
                <span className="font-bold text-[#0a2540] dark:text-white text-base">
                  {selectedBooking.client_name}
                </span>
                <div className="text-[#425466] dark:text-slate-400 text-xs font-mono mt-0.5">
                  {selectedBooking.client_phone}
                </div>
              </div>

              <div>
                <span className="text-[#425466] dark:text-slate-400 block text-xs">Price & Status:</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  {selectedBooking.status}
                </span>
                <div className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono mt-1">
                  {formatRwf(selectedBooking.total_rwf)}
                </div>
              </div>

              <div>
                <span className="text-[#425466] dark:text-slate-400 block text-xs">Dates:</span>
                <span className="text-[#0a2540] dark:text-slate-200 font-mono text-xs font-semibold">
                  {selectedBooking.start_date} → {selectedBooking.end_date}
                </span>
                <div className="text-xs text-[#425466] dark:text-slate-400 mt-0.5">
                  {calculateDays(selectedBooking.start_date, selectedBooking.end_date)} days total
                </div>
              </div>

              <div>
                <span className="text-[#425466] dark:text-slate-400 block text-xs">Airport Flight:</span>
                {selectedBooking.flight_number ? (
                  <span className="text-blue-600 dark:text-blue-400 font-mono font-bold flex items-center gap-1">
                    <Plane className="w-3.5 h-3.5" />
                    {selectedBooking.flight_number} ({selectedBooking.flight_status || 'On Time'})
                  </span>
                ) : (
                  <span className="text-[#425466] dark:text-slate-400">City Pickup</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#0a2540] dark:text-slate-200 block">
                Driver for This Trip
              </label>
              <select
                value={selectedBooking.driver_id}
                onChange={(e) => handleReassignDriver(selectedBooking.id, e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">-- No Driver (Guest Drives Self) --</option>
                {drivers.map((drv) => {
                  const collision = checkDriverCollision(
                    drv.id,
                    selectedBooking.start_date,
                    selectedBooking.end_date,
                    bookings,
                    selectedBooking.id
                  );

                  return (
                    <option key={drv.id} value={drv.id} disabled={collision.hasCollision}>
                      {drv.name} ({drv.phone}) · {drv.language}
                      {collision.hasCollision
                        ? ` [Busy: ${collision.conflictingBooking?.client_name || 'Booked'}]`
                        : ' [Free]'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              {onSelectBookingForDispatch && (
                <button
                  onClick={() => {
                    onSelectBookingForDispatch(selectedBooking);
                    setSelectedBooking(null);
                  }}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  <Phone className="w-4 h-4" />
                  <span>Send Driver SMS</span>
                </button>
              )}

              {onUpdateBookingStatus && selectedBooking.status !== 'Completed' && (
                <button
                  onClick={() => {
                    onUpdateBookingStatus(selectedBooking.id, 'Completed');
                    setSelectedBooking(null);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Trip Done</span>
                </button>
              )}

              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full text-sm font-semibold ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Car Modal */}
      {isBlockVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Block a Car</h3>
              </div>
              <button
                onClick={() => setIsBlockVehicleModalOpen(false)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#425466] dark:text-slate-300">
              Lock a car so nobody can book it while it is in the garage or being checked.
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#0a2540] dark:text-slate-200 block">Choose Car</label>
              <select
                value={blockSelectedVehicleId}
                onChange={(e) => setBlockSelectedVehicleId(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 text-sm outline-none focus:border-blue-500 font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.model_name} ({v.plate_number}) · {v.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#0a2540] dark:text-slate-200 block">Why is it blocked?</label>
              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 text-sm outline-none focus:border-blue-500 font-medium"
              >
                <option value="Police Safety Check">Police Safety Check (Inspection)</option>
                <option value="Oil & Filter Service">Oil & Filter Service</option>
                <option value="Brakes & Wheel Repair">Brakes & Wheel Repair</option>
                <option value="New Tires">New Tires</option>
                <option value="Deep Wash & Inside Clean">Deep Wash & Inside Clean</option>
                <option value="Body Paint & Dent Repair">Body Paint & Dent Repair</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#0a2540] dark:text-slate-200 block">Garage Name or Note</label>
              <input
                type="text"
                placeholder="e.g. Remera Inspection / Toyota Garage"
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBlockVehicleModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-300 rounded-full text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlockVehicle}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-sm font-bold shadow-sm flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Block Car Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
