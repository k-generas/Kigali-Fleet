import React, { useState, useMemo } from 'react';
import { Vehicle, Driver, Booking, VehicleCategory, BookingStatus } from '../types';
import { datesOverlap, formatRwf, checkDriverCollision, calculateDays } from '../utils/collision';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
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
  Search,
  Filter,
  Ban,
  Clock,
  Phone,
  CheckCircle,
  Maximize2,
  Minimize2,
  Wrench,
  Info,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface CalendarTimelineViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  currentTheme?: ColorTheme;
  onOpenBookingForVehicle: (vehicleId: string, date: string) => void;
  onAssignDriver: (bookingId: string, driverId: string) => { success: boolean; error?: string };
  onToggleMaintenance?: (vehicleId: string, notes?: string) => void;
  onUpdateBookingStatus?: (bookingId: string, status: BookingStatus) => void;
  onSelectBookingForDispatch?: (booking: Booking) => void;
}

// Vehicle nickname mapper for authentic fleet identity (matches screenshot style)
export function getVehicleNickname(vehicle: Vehicle): { nickname: string; subtitle: string } {
  if (vehicle.category === 'LandCruiser') {
    if (vehicle.model_name.includes('V8')) {
      return { nickname: 'Black Stallion', subtitle: `${vehicle.model_name.split('(')[0].trim()} ${vehicle.year || 2024}` };
    }
    return { nickname: 'Karisimbi 4x4', subtitle: `${vehicle.model_name.split('(')[0].trim()} ${vehicle.year || 2023}` };
  }
  if (vehicle.category === 'RAV4') {
    if (vehicle.model_name.includes('Hybrid')) {
      return { nickname: 'Blanco Hybrid', subtitle: `Toyota RAV4 AWD Hybrid ${vehicle.year || 2022}` };
    }
    return { nickname: 'Blueberry 4x4', subtitle: `Toyota RAV4 Expedition ${vehicle.year || 2023}` };
  }
  if (vehicle.category === 'Safari Van') {
    return { nickname: 'Casper Safari', subtitle: `Safari Pop-Top Land Cruiser ${vehicle.year || 2023}` };
  }
  if (vehicle.category === 'Coaster') {
    return { nickname: 'Clifford Bus', subtitle: `Toyota Coaster 30-Passenger ${vehicle.year || 2023}` };
  }
  if (vehicle.category === 'Luxury Sedan') {
    return { nickname: 'Frost VIP', subtitle: `Mercedes-Benz E-Class VIP ${vehicle.year || 2023}` };
  }
  // Fallback
  const firstWord = vehicle.model_name.split(' ')[0] || 'Unit';
  return { nickname: `${firstWord} #${vehicle.plate_number.slice(-3)}`, subtitle: vehicle.model_name };
}

// Visual category icons & badges (exported for VehiclesView & Storefront)
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

export function getCategoryIcon(category: VehicleCategory) {
  return getCategoryBadge(category).icon;
}

export const CalendarTimelineView: React.FC<CalendarTimelineViewProps> = ({
  vehicles,
  drivers,
  bookings,
  currentTheme,
  onOpenBookingForVehicle,
  onAssignDriver,
  onToggleMaintenance,
  onUpdateBookingStatus,
  onSelectBookingForDispatch,
}) => {
  const activeThemeColor = currentTheme?.hex || '#3b82f6';
  
  // Base month date - defaults to November 2026 (matching dataset) with quick toggle
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date('2026-11-01T00:00:00'));
  
  // View controls matching screenshot: Mode, Zoom, Search, Filters
  const [viewMode, setViewMode] = useState<'Fleet' | 'Vehicle' | 'Booked'>('Fleet');
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 100, 125 %
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All'); // 'All' | 'Completed' | 'Booked' | 'In Progress' | 'Cancelled'
  
  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isBlockVehicleModalOpen, setIsBlockVehicleModalOpen] = useState(false);
  const [blockSelectedVehicleId, setBlockSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [blockReason, setBlockReason] = useState<string>('Contrôle Technique (RNP Mandatory Inspection)');
  const [blockNotes, setBlockNotes] = useState<string>('');

  // Calculate year, month, days in current month
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth(); // 0-indexed
  const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shortMonthName = currentMonthDate.toLocaleDateString('en-US', { month: 'short' });

  // Number of days in this month
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Generate array of day objects
  const daysList = useMemo(() => {
    const list: {
      dayIndex: number; // 1..daysInMonth
      dateStr: string;  // YYYY-MM-DD
      weekdayShort: string; // FRI, SAT, SUN
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
      // Define 'today' anchor as Nov 1, 2026 for demo or current system date
      const isToday = dateStr === '2026-11-01';

      list.push({
        dayIndex: day,
        dateStr,
        weekdayShort,
        isToday,
        isWeekend,
      });
    }
    return list;
  }, [currentYear, currentMonth, daysInMonth]);

  // Navigate months
  const shiftMonth = (delta: number) => {
    const newDate = new Date(currentYear, currentMonth + delta, 1);
    setCurrentMonthDate(newDate);
  };

  const jumpToToday = () => {
    setCurrentMonthDate(new Date('2026-11-01T00:00:00'));
  };

  // Zoom column width in pixels
  const colWidth = useMemo(() => {
    if (zoomLevel === 75) return 46;
    if (zoomLevel === 125) return 72;
    return 58; // 100% default
  }, [zoomLevel]);

  // Month date range boundaries
  const monthStartStr = daysList[0]?.dateStr || '';
  const monthEndStr = daysList[daysList.length - 1]?.dateStr || '';

  // Calculate monthly utilization per vehicle
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

  // Global fleet utilization metrics for top bar (matching screenshot)
  const fleetMetrics = useMemo(() => {
    // 1. On trips today count
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

    // 2. Total days booked across fleet in this month
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

  // Filter vehicles based on search, category, and viewMode
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Category filter
      if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
      
      // View Mode filter
      if (viewMode === 'Booked') {
        const hasBookingsInMonth = bookings.some(
          (b) =>
            b.vehicle_id === v.id &&
            b.status !== 'Cancelled' &&
            datesOverlap(monthStartStr, monthEndStr, b.start_date, b.end_date)
        );
        if (!hasBookingsInMonth) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const { nickname, subtitle } = getVehicleNickname(v);
        const matchNick = nickname.toLowerCase().includes(q);
        const matchSub = subtitle.toLowerCase().includes(q);
        const matchPlate = v.plate_number.toLowerCase().includes(q);
        const matchModel = v.model_name.toLowerCase().includes(q);
        if (!matchNick && !matchSub && !matchPlate && !matchModel) return false;
      }

      return true;
    });
  }, [vehicles, bookings, categoryFilter, viewMode, searchQuery, monthStartStr, monthEndStr]);

  // Status counts for pills
  const statusCounts = useMemo(() => {
    const monthBookings = bookings.filter(
      (b) => datesOverlap(monthStartStr, monthEndStr, b.start_date, b.end_date)
    );
    return {
      Completed: monthBookings.filter((b) => b.status === 'Completed').length,
      Booked: monthBookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending Dispatch').length,
      InProgress: monthBookings.filter((b) => b.status === 'In Progress').length,
      Cancelled: monthBookings.filter((b) => b.status === 'Cancelled').length,
    };
  }, [bookings, monthStartStr, monthEndStr]);

  // Conflict scanner
  const detectedConflicts = useMemo(() => {
    const conflicts: { vehicle: Vehicle; bookings: [Booking, Booking] }[] = [];
    vehicles.forEach((veh) => {
      const vehBookings = bookings.filter((b) => b.vehicle_id === veh.id && b.status !== 'Cancelled');
      for (let i = 0; i < vehBookings.length; i++) {
        for (let j = i + 1; j < vehBookings.length; j++) {
          if (datesOverlap(vehBookings[i].start_date, vehBookings[i].end_date, vehBookings[j].start_date, vehBookings[j].end_date)) {
            conflicts.push({ vehicle: veh, bookings: [vehBookings[i], vehBookings[j]] });
          }
        }
      }
    });
    return conflicts;
  }, [vehicles, bookings]);

  // Chauffeur assignment handler
  const handleReassignDriver = (bookingId: string, driverId: string) => {
    setAssignmentNotice(null);
    const res = onAssignDriver(bookingId, driverId);
    if (res.success) {
      setAssignmentNotice({ type: 'success', message: 'Driver linked successfully to this mission!' });
      const updated = bookings.find((b) => b.id === bookingId);
      if (updated) setSelectedBooking({ ...updated, driver_id: driverId });
    } else {
      setAssignmentNotice({ type: 'error', message: res.error || 'Failed to assign driver.' });
    }
  };

  // Submit vehicle block
  const handleConfirmBlockVehicle = () => {
    if (onToggleMaintenance && blockSelectedVehicleId) {
      const combinedNotes = `${blockReason}${blockNotes ? ` - ${blockNotes}` : ''}`;
      onToggleMaintenance(blockSelectedVehicleId, combinedNotes);
      setIsBlockVehicleModalOpen(false);
      setBlockNotes('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Real-time Fleet Conflict Alert Strip */}
      {detectedConflicts.length > 0 ? (
        <div className="bg-rose-950/80 border border-rose-600 rounded-xl p-3.5 text-rose-200 flex items-start gap-3 shadow-md">
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Collision Guard Active · 0 Overlapping Assignments Across Kigali Fleet</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            Timeline active: {monthStartStr} to {monthEndStr}
          </span>
        </div>
      )}

      {/* Main Calendar Navigation & Control Bar (Exact match to screenshot) */}
      <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3.5">
        {/* Top Row: Title, Month Selector, Block Vehicle, View Mode, Zoom, Search, Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Side: Calendar ✨ + Month Navigator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Calendar</h1>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>

            {/* Month Navigator: < May 2026 > */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => shiftMonth(-1)}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold px-3 text-slate-100 whitespace-nowrap min-w-[110px] text-center">
                {monthName}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={jumpToToday}
              className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-700/60 font-medium transition-colors hidden sm:inline-block"
            >
              Today
            </button>
          </div>

          {/* Right Side: Block Vehicle, View Mode, Zoom, Search, Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Block Vehicle Button */}
            <button
              onClick={() => setIsBlockVehicleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>Block Vehicle</span>
            </button>

            {/* View Mode Segmented Controls: [ Fleet | Vehicle | Booked ] */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setViewMode('Fleet')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  viewMode === 'Fleet'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Fleet</span>
              </button>
              <button
                onClick={() => setViewMode('Vehicle')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  viewMode === 'Vehicle'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Vehicle</span>
              </button>
              <button
                onClick={() => setViewMode('Booked')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  viewMode === 'Booked'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Booked</span>
              </button>
            </div>

            {/* Zoom Controls: — 100% + */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-300">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 25))}
                disabled={zoomLevel <= 75}
                className="px-2 py-1 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-400 hover:text-white font-bold"
                title="Zoom out"
              >
                —
              </button>
              <span className="px-2 font-mono text-[11px] font-semibold text-slate-200">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(125, z + 25))}
                disabled={zoomLevel >= 125}
                className="px-2 py-1 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-400 hover:text-white font-bold"
                title="Zoom in"
              >
                +
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search nickname, plate, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-medium"
            >
              <option value="All">All Types ({vehicles.length})</option>
              <option value="LandCruiser">Land Cruiser 4x4</option>
              <option value="RAV4">RAV4 AWD</option>
              <option value="Coaster">Coaster Bus</option>
              <option value="Safari Van">Safari Pop-Top</option>
              <option value="Luxury Sedan">VIP Sedan</option>
            </select>
          </div>
        </div>

        {/* Second Row: Status Filter Pills + Real-Time Fleet Utilization Banner (Matching screenshot) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {/* Completed: Green #10b981 */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'Completed' ? 'All' : 'Completed')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-500 text-slate-950 font-bold ring-2 ring-emerald-400'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Completed</span>
              <span className="font-mono text-[10px] opacity-80">({statusCounts.Completed})</span>
            </button>

            {/* Booked: Blue #3b82f6 */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'Booked' ? 'All' : 'Booked')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'Booked'
                  ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Booked</span>
              <span className="font-mono text-[10px] opacity-80">({statusCounts.Booked})</span>
            </button>

            {/* In Progress: Amber #f59e0b */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'In Progress'
                  ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-400'
                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>In Progress</span>
              <span className="font-mono text-[10px] opacity-80">({statusCounts.InProgress})</span>
            </button>

            {/* Cancelled: Slate */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'Cancelled' ? 'All' : 'Cancelled')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                statusFilter === 'Cancelled'
                  ? 'bg-slate-700 text-white font-bold ring-2 ring-slate-500'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Cancelled ({statusCounts.Cancelled})</span>
            </button>

            {statusFilter !== 'All' && (
              <button
                onClick={() => setStatusFilter('All')}
                className="text-[11px] text-slate-400 hover:text-white underline ml-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Metric Banner: Exactly matches screenshot text: "24 vehicles shown | 21/24 on trips today (88%) | Fleet utilization — 612/744 days (82%) · May 2026" */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">
              {filteredVehicles.length} vehicles shown
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {fleetMetrics.activeTodayCount}/{fleetMetrics.totalVehicles} on trips today ({fleetMetrics.tripsTodayPct}%)
            </span>
            <span className="text-slate-600 hidden md:inline">·</span>
            <span className="text-slate-300 font-medium hidden md:inline">
              Fleet utilization — <strong className="text-emerald-400">{fleetMetrics.totalFleetDaysBooked}/{fleetMetrics.totalPossibleFleetDays} days</strong> ({fleetMetrics.fleetUtilPct}%) · {shortMonthName} {currentYear}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Fleet Grid Container */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div
            className="inline-block min-w-full align-middle"
            style={{ width: `${230 + daysList.length * colWidth}px` }}
          >
            {/* Header Row: Sticky Left Vehicle Column + Day Headers */}
            <div className="flex border-b border-slate-800 bg-[#0f172a] sticky top-0 z-20">
              {/* Left Column Header: "24 vehicles" */}
              <div className="w-[230px] shrink-0 px-4 py-3 border-r border-slate-800 font-bold text-white text-xs flex items-center justify-between">
                <span>{filteredVehicles.length} vehicles</span>
                <span className="text-[10px] text-slate-500 font-mono uppercase">Status · Util</span>
              </div>

              {/* Day Headers (FRI 1, SAT 2, SUN 3 ...) */}
              <div className="flex">
                {daysList.map((d) => (
                  <div
                    key={d.dateStr}
                    style={{ width: `${colWidth}px` }}
                    className={`shrink-0 py-2 text-center border-r border-slate-800/60 flex flex-col items-center justify-center transition-colors ${
                      d.isToday ? 'bg-blue-600/10' : d.isWeekend ? 'bg-slate-900/40' : ''
                    }`}
                  >
                    <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 font-mono">
                      {d.weekdayShort}
                    </div>

                    {d.isToday ? (
                      /* Today highlighted with vibrant blue rounded pill matching screenshot */
                      <div className="w-6 h-6 mt-0.5 rounded-md bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        {d.dayIndex}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-200 mt-0.5">
                        {d.dayIndex}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Rows */}
            <div className="divide-y divide-slate-800/80">
              {filteredVehicles.map((vehicle) => {
                const { nickname, subtitle } = getVehicleNickname(vehicle);
                const stats = vehicleStats.get(vehicle.id) || { daysBooked: 0, ratePct: 0 };
                const IconComp = getCategoryIcon(vehicle.category);

                // Bookings for this vehicle
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

                // Turnaround buffer detection: check back-to-back rentals on this vehicle
                const turnaroundAlerts: { prevBooking: Booking; nextBooking: Booking; dateStr: string; gapHours: number }[] = [];
                for (let i = 0; i < vehBookings.length - 1; i++) {
                  const curr = vehBookings[i];
                  const next = vehBookings[i + 1];
                  // If next booking starts on the same day or next day after curr ends
                  if (curr.end_date === next.start_date) {
                    turnaroundAlerts.push({
                      prevBooking: curr,
                      nextBooking: next,
                      dateStr: curr.end_date,
                      gapHours: 2, // 2-4 hour turnaround buffer window
                    });
                  } else {
                    const d1 = new Date(curr.end_date).getTime();
                    const d2 = new Date(next.start_date).getTime();
                    const diffDays = Math.round((d2 - d1) / (1000 * 3600 * 24));
                    if (diffDays === 1) {
                      turnaroundAlerts.push({
                        prevBooking: curr,
                        nextBooking: next,
                        dateStr: curr.end_date,
                        gapHours: 4,
                      });
                    }
                  }
                }

                return (
                  <div
                    key={vehicle.id}
                    className="flex hover:bg-slate-900/40 transition-colors group relative"
                  >
                    {/* Left Sticky Column: Vehicle Details, Plate, Utilization Badge */}
                    <div className="w-[230px] shrink-0 p-3 border-r border-slate-800 bg-[#0b0f17] flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-1">
                        <div className="truncate">
                          <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                            {nickname}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {subtitle}
                          </div>
                        </div>

                        {/* Utilization Badge (e.g. 68% · 21/31d) matching screenshot */}
                        <div className="text-right shrink-0">
                          <span
                            className={`text-[11px] font-bold font-mono ${
                              stats.ratePct >= 60
                                ? 'text-emerald-400'
                                : stats.ratePct >= 30
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {stats.ratePct}%
                          </span>
                          <div className="text-[9px] text-slate-500 font-mono">
                            {stats.daysBooked}/{daysInMonth}d
                          </div>
                        </div>
                      </div>

                      {/* Plate number & daily rate */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800/40">
                        <span className="font-mono text-amber-300 font-semibold">
                          {vehicle.plate_number}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {formatRwf(vehicle.daily_rate_rwf)}/d
                        </span>
                      </div>
                    </div>

                    {/* Timeline Grid: Day Cells and Spanning Booking Bars */}
                    <div className="flex relative h-[62px] items-center">
                      {/* Underlying Day Grid Cells (Clickable to create new booking) */}
                      {daysList.map((d) => (
                        <div
                          key={d.dateStr}
                          style={{ width: `${colWidth}px` }}
                          onClick={() => onOpenBookingForVehicle(vehicle.id, d.dateStr)}
                          className={`h-full shrink-0 border-r border-slate-800/60 relative cursor-pointer hover:bg-blue-600/10 group/cell transition-colors ${
                            d.isWeekend ? 'bg-slate-900/30' : ''
                          }`}
                          title={`Click to book ${vehicle.model_name} on ${d.dateStr}`}
                        >
                          <span className="opacity-0 group-hover/cell:opacity-100 absolute inset-0 flex items-center justify-center text-[10px] text-blue-400 font-bold pointer-events-none">
                            +
                          </span>
                        </div>
                      ))}

                      {/* Turnaround Buffer Badges (Between adjacent bookings) */}
                      {turnaroundAlerts.map((alert, idx) => {
                        const alertDay = daysList.find((d) => d.dateStr === alert.dateStr);
                        if (!alertDay) return null;
                        const alertColIndex = alertDay.dayIndex - 1;
                        const leftPx = alertColIndex * colWidth + colWidth - 28;

                        return (
                          <div
                            key={`turnaround-${idx}`}
                            style={{ left: `${leftPx}px`, top: '4px' }}
                            className="absolute z-15 pointer-events-none flex items-center justify-center"
                          >
                            <span className="bg-amber-500/90 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-lg ring-1 ring-amber-300 uppercase tracking-tighter whitespace-nowrap">
                              {alert.gapHours}h turnaround
                            </span>
                          </div>
                        );
                      })}

                      {/* Continuous Spanning Booking Bars (Absolute positioned across dates) */}
                      {vehBookings.map((bk) => {
                        // Find start day index and end day index in current month
                        const bkStart = new Date(bk.start_date);
                        const bkEnd = new Date(bk.end_date);
                        
                        // Check if booking touches this month
                        if (bk.end_date < monthStartStr || bk.start_date > monthEndStr) {
                          return null;
                        }

                        // Bound within visible month
                        const effectiveStartStr = bk.start_date < monthStartStr ? monthStartStr : bk.start_date;
                        const effectiveEndStr = bk.end_date > monthEndStr ? monthEndStr : bk.end_date;

                        const startDayObj = daysList.find((d) => d.dateStr === effectiveStartStr);
                        const endDayObj = daysList.find((d) => d.dateStr === effectiveEndStr);

                        if (!startDayObj || !endDayObj) return null;

                        const startIndex = startDayObj.dayIndex - 1; // 0-indexed column
                        const endIndex = endDayObj.dayIndex - 1;
                        const spanDays = endIndex - startIndex + 1;

                        const leftOffset = startIndex * colWidth + 4;
                        const barWidth = Math.max(36, spanDays * colWidth - 8);

                        // Color theme matching screenshot:
                        // Completed = emerald green (#10b981)
                        // Booked = vibrant blue (#3b82f6)
                        // In Progress = warm amber (#f59e0b)
                        // Cancelled = slate
                        const isCompleted = bk.status === 'Completed';
                        const isInProgress = bk.status === 'In Progress';
                        const isCancelled = bk.status === 'Cancelled';
                        const isBooked = !isCompleted && !isInProgress && !isCancelled;

                        let barBg = 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40';
                        if (isCompleted) {
                          barBg = 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40';
                        } else if (isInProgress) {
                          barBg = 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/40 font-bold';
                        } else if (isCancelled) {
                          barBg = 'bg-slate-700 hover:bg-slate-600 text-slate-300';
                        }

                        // Has adjacent turnaround buffer
                        const hasTurnaround = turnaroundAlerts.some(
                          (t) => t.prevBooking.id === bk.id || t.nextBooking.id === bk.id
                        );

                        const totalDays = calculateDays(bk.start_date, bk.end_date);
                        const driver = drivers.find((d) => d.id === bk.driver_id);

                        return (
                          <div
                            key={bk.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(bk);
                            }}
                            style={{
                              left: `${leftOffset}px`,
                              width: `${barWidth}px`,
                              top: '12px',
                              height: '38px',
                            }}
                            className={`absolute z-10 rounded-lg px-2.5 flex items-center justify-between text-xs font-semibold cursor-pointer shadow-md transition-transform hover:-translate-y-0.5 select-none ${barBg} ${
                              hasTurnaround ? 'ring-2 ring-amber-400/90' : ''
                            }`}
                            title={`#${bk.id} · ${bk.client_name} · ${bk.destination} · ${totalDays} days · ${formatRwf(bk.total_rwf)}`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-[11px] whitespace-nowrap">
                                {totalDays}d · {formatRwf(bk.total_rwf)}
                              </span>
                              {barWidth > 120 && (
                                <span className="opacity-90 font-medium truncate text-[10px]">
                                  · {bk.client_name.split(' ')[0]}
                                </span>
                              )}
                            </div>

                            {/* Icons on right side of bar */}
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              {bk.flight_number && (
                                <span title={`Flight: ${bk.flight_number}`}>
                                  <Plane className="w-3 h-3 opacity-90" />
                                </span>
                              )}
                              {hasTurnaround && (
                                <Sparkles className="w-3 h-3 text-amber-200" />
                              )}
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
        </div>
      </div>

      {/* Footer Guidance Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 py-1">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-300">Status Keys:</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Completed
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-2.5 h-2.5 rounded bg-blue-600"></span> Booked / Confirmed
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> In Progress
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <span className="w-2.5 h-2.5 rounded border border-amber-400"></span> 2h/4h Turnaround Prep
          </span>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Click empty date cells to create new booking · Click colored bar to view dossier
        </div>
      </div>

      {/* Booking Dossier & Chauffeur Reassignment Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    #{selectedBooking.id}
                  </span>
                  <h3 className="text-base font-bold text-white">Booking Dossier & Dispatch</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Route: {selectedBooking.destination}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setAssignmentNotice(null);
                }}
                className="text-slate-400 hover:text-white p-1"
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

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Client:</span>
                <span className="font-bold text-white text-sm">{selectedBooking.client_name}</span>
                <div className="text-slate-400 text-[11px] font-mono">{selectedBooking.client_phone}</div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Status & Payment:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedBooking.status === 'Completed'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : selectedBooking.status === 'In Progress'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {selectedBooking.status}
                </span>
                <div className="text-emerald-400 font-bold font-mono mt-0.5">
                  {formatRwf(selectedBooking.total_rwf)}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Rental Dates:</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {selectedBooking.start_date} → {selectedBooking.end_date}
                </span>
                <div className="text-[10px] text-slate-400">
                  {calculateDays(selectedBooking.start_date, selectedBooking.end_date)} days total
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Flight / Arrival:</span>
                {selectedBooking.flight_number ? (
                  <span className="text-blue-400 font-mono font-bold flex items-center gap-1">
                    <Plane className="w-3 h-3" />
                    {selectedBooking.flight_number} ({selectedBooking.flight_status || 'Scheduled'})
                  </span>
                ) : (
                  <span className="text-slate-400">Standard Pickup</span>
                )}
              </div>
            </div>

            {/* Driver Assignment Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Assigned Chauffeur (Collision Guard Protected):</span>
                <span className="text-[10px] text-slate-500">Live conflict validation</span>
              </label>

              <select
                value={selectedBooking.driver_id}
                onChange={(e) => handleReassignDriver(selectedBooking.id, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 text-xs outline-none focus:border-blue-500"
              >
                <option value="">-- No Chauffeur Assigned (Self-Drive) --</option>
                {drivers.map((drv) => {
                  const collision = checkDriverCollision(
                    drv.id,
                    selectedBooking.start_date,
                    selectedBooking.end_date,
                    bookings,
                    selectedBooking.id
                  );

                  return (
                    <option
                      key={drv.id}
                      value={drv.id}
                      disabled={collision.hasCollision}
                      className={collision.hasCollision ? 'text-rose-400 bg-slate-900' : 'text-slate-100 bg-slate-900'}
                    >
                      {drv.name} ({drv.phone}) · {drv.language}
                      {collision.hasCollision ? ` [OCCUPIED: ${collision.conflictingBooking?.client_name || 'Booked'}]` : ' [AVAILABLE]'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {onSelectBookingForDispatch && (
                <button
                  onClick={() => {
                    onSelectBookingForDispatch(selectedBooking);
                    setSelectedBooking(null);
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Dispatch SMS (*134#)</span>
                </button>
              )}

              {onUpdateBookingStatus && selectedBooking.status !== 'Completed' && (
                <button
                  onClick={() => {
                    onUpdateBookingStatus(selectedBooking.id, 'Completed');
                    setSelectedBooking(null);
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark Completed</span>
                </button>
              )}

              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Vehicle / Maintenance Modal (Launched by "Block Vehicle" button) */}
      {isBlockVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Block Vehicle / Maintenance</h3>
              </div>
              <button
                onClick={() => setIsBlockVehicleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Lock out a fleet vehicle from the booking calendar to prevent collisions during mandatory Rwanda Contrôle Technique or scheduled mechanical maintenance.
            </p>

            {/* Vehicle Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Select Vehicle:</label>
              <select
                value={blockSelectedVehicleId}
                onChange={(e) => setBlockSelectedVehicleId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 text-xs outline-none focus:border-blue-500 font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.model_name} ({v.plate_number}) · Currently: {v.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Maintenance Reason:</label>
              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 text-xs outline-none focus:border-blue-500 font-medium"
              >
                <option value="Contrôle Technique (RNP Mandatory Inspection)">
                  Contrôle Technique (RNP Inspection)
                </option>
                <option value="Regular Engine Oil & Filter Service">
                  Regular Engine Oil & Filter Service
                </option>
                <option value="Brake Pads & Suspension Overhaul">
                  Brake Pads & Suspension Overhaul
                </option>
                <option value="Tire Replacement & Wheel Balancing">
                  Tire Replacement & Wheel Balancing
                </option>
                <option value="VIP Deep Interior Detailing & Sanitization">
                  VIP Deep Interior Detailing & Sanitization
                </option>
                <option value="Bodywork & Paint Touch-Up">
                  Bodywork & Paint Touch-Up
                </option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Workshop Notes / Garage:</label>
              <input
                type="text"
                placeholder="e.g. Remera Inspection Center / Toyota Rwanda"
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBlockVehicleModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlockVehicle}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Vehicle Lock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
