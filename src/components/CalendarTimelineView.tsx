import React, { useState, useMemo } from 'react';
import { Vehicle, Driver, Booking, VehicleCategory, BookingStatus, MaintenanceRecord } from '../types';
import { datesOverlap, checkDriverCollision, calculateDays } from '../utils/collision';
import { formatHumanDate, formatHumanDateRange } from '../utils/dates';
import { useI18n, AppCurrency, USD_RATE } from '../utils/i18n';
import {
  ChevronLeft,
  ChevronRight,
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
  SlidersHorizontal,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { ModalShell } from './ModalShell';

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
        badgeClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
        blockClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'RAV4':
      return {
        label: 'RAV4 AWD',
        icon: Car,
        badgeClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
        blockClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'Coaster':
      return {
        label: 'Coaster Bus (30-Seat)',
        icon: Bus,
        badgeClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
        blockClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'Safari Van':
      return {
        label: 'Safari Pop-Top',
        icon: Compass,
        badgeClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
        blockClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'Luxury Sedan':
      return {
        label: 'VIP Luxury Car',
        icon: Sparkles,
        badgeClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
        blockClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    default:
      return {
        label: category,
        icon: Car,
        badgeClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
        blockClass: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
}

export function getCategoryIcon(category: VehicleCategory) {
  return getCategoryBadge(category).icon;
}

function formatCompactMoney(amountRwf: number, currency: AppCurrency = 'RWF'): string {
  if (currency === 'USD') {
    if (amountRwf === 0) return '$0';
    const usd = Math.max(1, Math.round(amountRwf / USD_RATE));
    if (usd >= 1000) {
      const k = usd / 1000;
      return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return `$${usd}`;
  }
  if (amountRwf >= 1000000) {
    const m = amountRwf / 1000000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (amountRwf >= 1000) {
    return `${Math.round(amountRwf / 1000)}k`;
  }
  return `${amountRwf}`;
}

export const CalendarTimelineView: React.FC<CalendarTimelineViewProps> = ({
  vehicles,
  drivers,
  bookings,
  maintenance = [],
  onOpenBookingForVehicle,
  onAssignDriver,
  onToggleMaintenance,
  onUpdateBookingStatus,
  onSelectBookingForDispatch,
}) => {
  const { currency, language, formatMoney, tr } = useI18n();

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date('2026-11-01T00:00:00'));
  const [viewMode, setViewMode] = useState<'Fleet' | 'Vehicle' | 'Booked'>('Fleet');
  const [rangeMode, setRangeMode] = useState<'week' | 'first_half' | 'second_half' | 'month'>(() => {
    if (typeof window === 'undefined') return 'first_half';
    if (window.innerWidth < 640) return 'week';
    if (window.innerWidth < 1024) return 'first_half';
    return 'first_half';
  });
  const [weekIndex, setWeekIndex] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedCarId, setSelectedCarId] = useState<string>('all');
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
  const dateLocale = language === 'FR' ? 'fr-FR' : 'en-US';
  const monthName = currentMonthDate.toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' });
  const shortMonthName = currentMonthDate.toLocaleDateString(dateLocale, { month: 'short' });

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
      const weekdayShort = d.toLocaleDateString(dateLocale, { weekday: 'short' }).toUpperCase();
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isToday = dateStr === '2026-11-01';

      list.push({ dayIndex: day, dateStr, weekdayShort, isToday, isWeekend });
    }
    return list;
  }, [currentYear, currentMonth, daysInMonth, dateLocale]);

  const shiftMonth = (delta: number) => {
    setCurrentMonthDate(new Date(currentYear, currentMonth + delta, 1));
    setWeekIndex(0);
  };

  const jumpToToday = () => {
    setCurrentMonthDate(new Date('2026-11-01T00:00:00'));
    setWeekIndex(0);
  };

  const maxWeekIndex = Math.max(0, Math.ceil(daysInMonth / 7) - 1);
  const safeWeekIndex = Math.min(weekIndex, maxWeekIndex);

  const visibleDaysList = useMemo(() => {
    if (rangeMode === 'week') {
      const start = safeWeekIndex * 7;
      return daysList.slice(start, start + 7);
    }
    if (rangeMode === 'first_half') return daysList.slice(0, 15);
    if (rangeMode === 'second_half') return daysList.slice(15);
    return daysList;
  }, [daysList, rangeMode, safeWeekIndex]);

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

    let totalFleetDaysBooked = 0;
    vehicleStats.forEach((stat) => {
      totalFleetDaysBooked += stat.daysBooked;
    });
    const totalPossibleFleetDays = vehicles.length * daysInMonth;
    const fleetUtilPct = totalPossibleFleetDays > 0 ? Math.round((totalFleetDaysBooked / totalPossibleFleetDays) * 100) : 0;

    return {
      activeTodayCount,
      totalVehicles: vehicles.length,
      fleetUtilPct,
    };
  }, [vehicles, bookings, vehicleStats, daysInMonth]);

  const selectedCar = useMemo(() => {
    if (selectedCarId === 'all') return null;
    return vehicles.find((v) => v.id === selectedCarId) || null;
  }, [vehicles, selectedCarId]);

  const filteredVehicles = useMemo(() => {
    if (selectedCar) return [selectedCar];
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
  }, [vehicles, selectedCar, bookings, categoryFilter, viewMode, searchQuery, monthStartStr, monthEndStr]);

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

  const activeFiltersCount =
    (viewMode !== 'Fleet' ? 1 : 0) +
    (categoryFilter !== 'All' ? 1 : 0) +
    (statusFilter !== 'All' ? 1 : 0) +
    (selectedCarId !== 'all' ? 1 : 0);

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

  const rangeStartDay = visibleDaysList[0]?.dayIndex || 1;
  const rangeEndDay = visibleDaysList[visibleDaysList.length - 1]?.dayIndex || daysInMonth;

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Trip calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Visual fleet schedule for {monthName} · {fleetMetrics.activeTodayCount}/{fleetMetrics.totalVehicles} cars out today
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBlockVehicleModalOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
          >
            {tr('Block a Car')}
          </button>
          <button
            type="button"
            onClick={() => onOpenBookingForVehicle(vehicles[0]?.id || '', windowStartStr)}
            className="px-4 py-2 rounded-lg text-sm font-medium accent-bg hover:opacity-95 shadow-xs"
          >
            + {tr('New Booking')}
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        {/* Control Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-base text-slate-900 dark:text-white px-2 whitespace-nowrap">
                {monthName}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {rangeMode === 'week' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekIndex((w) => Math.max(0, w - 1))}
                  disabled={safeWeekIndex === 0}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-35"
                  aria-label="Previous 7 days"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs px-1.5 text-slate-800 dark:text-slate-200">
                  {rangeStartDay}–{rangeEndDay}
                </span>
                <button
                  type="button"
                  onClick={() => setWeekIndex((w) => Math.min(maxWeekIndex, w + 1))}
                  disabled={safeWeekIndex >= maxWeekIndex}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-35"
                  aria-label="Next 7 days"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={jumpToToday}
              className="text-xs font-medium accent-text hover:underline px-1"
            >
              {tr('Today')}
            </button>

            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg gap-0.5">
              {[
                { id: 'week' as const, label: tr('7d') },
                { id: 'first_half' as const, label: '1–15' },
                { id: 'second_half' as const, label: `16–${daysInMonth}` },
                { id: 'month' as const, label: tr('Month') },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRangeMode(r.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    rangeMode === r.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={tr('Search car or plate...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 sm:w-56 bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-7 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                {tr('Filters')}
                {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Collapsible Filters Drawer */}
        {showFilters && (
          <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                aria-label={tr('Select car')}
                className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-medium"
              >
                <option value="all">{tr('All Cars')} ({vehicles.length})</option>
                {vehicles.map((v) => {
                  const { nickname } = getVehicleNickname(v);
                  const st = vehicleStats.get(v.id);
                  return (
                    <option key={v.id} value={v.id}>
                      {nickname} · {v.plate_number} ({st?.ratePct ?? 0}%)
                    </option>
                  );
                })}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-medium"
              >
                <option value="All">{tr('All Types')} ({vehicles.length})</option>
                <option value="LandCruiser">Land Cruiser 4x4</option>
                <option value="RAV4">RAV4</option>
                <option value="Coaster">Coaster Bus</option>
                <option value="Safari Van">Safari Van</option>
                <option value="Luxury Sedan">{tr('VIP Car')}</option>
              </select>

              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'Fleet' | 'Booked')}
                className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-medium"
              >
                <option value="Fleet">{tr('All Cars')}</option>
                <option value="Booked">{tr('Booked Only')}</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'Completed', label: `${tr('Done')} (${statusCounts.Completed})`, dot: 'bg-emerald-500' },
                { key: 'Booked', label: `${tr('Booked')} (${statusCounts.Booked})`, dot: 'bg-blue-500' },
                { key: 'In Progress', label: `${tr('On Trip')} (${statusCounts.InProgress})`, dot: 'bg-amber-500' },
                { key: 'Cancelled', label: `${tr('Cancelled')} (${statusCounts.Cancelled})`, dot: 'bg-slate-400' },
              ].map((item) => {
                const active = statusFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStatusFilter(active ? 'All' : item.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
                      active
                        ? 'border-slate-400 dark:border-slate-500 font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-[#0f172a]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setCategoryFilter('All');
                    setViewMode('Fleet');
                    setSearchQuery('');
                    setSelectedCarId('all');
                  }}
                  className="text-xs font-medium accent-text hover:underline ml-auto"
                >
                  {tr('Clear All')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conflict / Status Strip */}
        {detectedConflicts.length > 0 ? (
          <div className="px-5 py-3 bg-rose-50 dark:bg-rose-500/15 border-b border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">{tr('Same Car Booked Twice on Same Days!')}</strong>{' '}
              {detectedConflicts.map((c, idx) => (
                <span key={idx} className="ml-1">
                  {c.vehicle.model_name} ({c.vehicle.plate_number}): "{c.bookings[0].client_name}" & "{c.bookings[1].client_name}".
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40 dark:bg-slate-900/30">
            <span>
              Booked {fleetMetrics.fleetUtilPct}% in {shortMonthName}. Zero scheduling conflicts detected.
            </span>
            <span className="font-mono tabular-nums">
              {fleetMetrics.activeTodayCount}/{fleetMetrics.totalVehicles} out today
            </span>
          </div>
        )}

        {/* Selected Car Focus Header */}
        {selectedCar && (
          <div className="px-5 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {getVehicleNickname(selectedCar).nickname}
              </span>{' '}
              <span className="font-mono text-slate-500 dark:text-slate-400">{selectedCar.plate_number}</span>{' '}
              <span className="text-slate-500 dark:text-slate-400">
                · {formatMoney(selectedCar.daily_rate_rwf)} per day
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCarId('all')}
              className="font-medium accent-text hover:underline"
            >
              Show all cars
            </button>
          </div>
        )}

        {/* Timeline Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[740px]">
            {/* Day Columns Header */}
            <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
              {!selectedCar && (
                <div className="w-[180px] sm:w-[200px] shrink-0 px-4 py-2.5 border-r border-slate-200/80 dark:border-slate-800 font-medium text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>{filteredVehicles.length} Cars</span>
                  <span className="text-slate-400 font-normal">Tap car</span>
                </div>
              )}

              <div
                className="flex-1 min-w-0 grid"
                style={{ gridTemplateColumns: `repeat(${visibleDaysList.length}, minmax(0, 1fr))` }}
              >
                {visibleDaysList.map((d) => (
                  <div
                    key={d.dateStr}
                    className={`py-2 text-center border-l border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center ${
                      d.isWeekend ? 'bg-slate-100/60 dark:bg-slate-800/40' : ''
                    }`}
                  >
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-none">
                      {rangeMode === 'week' ? d.weekdayShort.slice(0, 2) : d.weekdayShort.slice(0, 1)}
                    </div>
                    {d.isToday ? (
                      <div className="w-6 h-6 mt-1 rounded-full accent-bg font-semibold text-xs flex items-center justify-center tabular-nums">
                        {d.dayIndex}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 tabular-nums">
                        {d.dayIndex}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Rows */}
            {filteredVehicles.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                {tr('No cars match your filters.')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setCategoryFilter('All');
                    setViewMode('Fleet');
                    setSearchQuery('');
                  }}
                  className="font-medium accent-text hover:underline"
                >
                  {tr('Show all cars')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVehicles.map((vehicle) => {
                  const { nickname } = getVehicleNickname(vehicle);
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

                  const totalVisibleDays = Math.max(1, visibleDaysList.length);

                  return (
                    <div key={vehicle.id} className="flex relative">
                      {!selectedCar && (
                        <button
                          type="button"
                          onClick={() => setSelectedCarId(vehicle.id)}
                          className="w-[180px] sm:w-[200px] shrink-0 px-4 py-2.5 border-r border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 text-left transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {nickname}
                            </span>
                            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                              {stats.ratePct}%
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            <span className="font-mono">{vehicle.plate_number}</span> ·{' '}
                            <span>{formatCompactMoney(vehicle.daily_rate_rwf, currency)}/d</span>
                          </div>
                        </button>
                      )}

                      <div
                        className={`flex-1 min-w-0 grid relative ${selectedCar ? 'h-[72px]' : 'h-[62px]'}`}
                        style={{ gridTemplateColumns: `repeat(${visibleDaysList.length}, minmax(0, 1fr))` }}
                      >
                        {visibleDaysList.map((d) => (
                          <div
                            key={d.dateStr}
                            onClick={() => onOpenBookingForVehicle(vehicle.id, d.dateStr)}
                            className={`h-full border-l border-slate-100 dark:border-slate-800 relative cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-500/10 group/cell transition-colors ${
                              d.isWeekend ? 'bg-slate-50/70 dark:bg-slate-800/20' : ''
                            }`}
                            title={`Book ${vehicle.model_name} on ${formatHumanDate(d.dateStr)}`}
                          >
                            <span className="opacity-0 group-hover/cell:opacity-100 absolute inset-0 flex items-center justify-center text-sm font-semibold accent-text pointer-events-none">
                              +
                            </span>
                          </div>
                        ))}

                        {/* Booking Bars */}
                        {vehBookings.map((bk) => {
                          if (bk.end_date < windowStartStr || bk.start_date > windowEndStr) return null;

                          const effectiveStartStr = bk.start_date < windowStartStr ? windowStartStr : bk.start_date;
                          const effectiveEndStr = bk.end_date > windowEndStr ? windowEndStr : bk.end_date;

                          const startIndex = visibleDaysList.findIndex((d) => d.dateStr === effectiveStartStr);
                          const endIndex = visibleDaysList.findIndex((d) => d.dateStr === effectiveEndStr);
                          if (startIndex < 0 || endIndex < 0) return null;

                          const spanDays = Math.max(1, endIndex - startIndex + 1);
                          const totalDays = calculateDays(bk.start_date, bk.end_date);
                          const leftPct = (startIndex / totalVisibleDays) * 100;
                          const widthPct = (spanDays / totalVisibleDays) * 100;

                          const isDone = bk.status === 'Completed';
                          const isOnTrip = bk.status === 'In Progress';
                          const isCancelled = bk.status === 'Cancelled';

                          const barClass = isDone
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/40'
                            : isOnTrip
                            ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/40'
                            : isCancelled
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            : 'bg-blue-50 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-500/40';

                          const statusWord = isDone
                            ? 'Done'
                            : isOnTrip
                            ? 'On trip'
                            : isCancelled
                            ? 'Cancelled'
                            : 'Booked';

                          return (
                            <div
                              key={bk.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(bk);
                              }}
                              style={{
                                left: `calc(${leftPct}% + 3px)`,
                                width: `calc(${widthPct}% - 6px)`,
                                top: '7px',
                                bottom: '7px',
                              }}
                              className={`absolute z-10 rounded-lg border px-2.5 flex flex-col justify-center cursor-pointer select-none overflow-hidden text-xs leading-tight shadow-xs hover:opacity-90 transition-opacity ${barClass}`}
                              title={`#${bk.id} · ${statusWord} · ${bk.client_name} (${formatHumanDateRange(
                                bk.start_date,
                                bk.end_date
                              )})`}
                            >
                              <div className="font-semibold whitespace-nowrap truncate">
                                {statusWord} · {totalDays}d
                              </div>
                              {spanDays >= 2 && (
                                <div className="truncate opacity-85 text-[11px]">
                                  {formatMoney(bk.total_rwf)} · {bk.client_name}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Maintenance / Repair Bars */}
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
                                  left: `calc(${leftPct}% + 3px)`,
                                  width: `calc(${widthPct}% - 6px)`,
                                  top: '7px',
                                  bottom: '7px',
                                }}
                                className="absolute z-20 rounded-lg border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 px-2.5 flex flex-col justify-center text-xs leading-tight select-none overflow-hidden shadow-xs"
                                title={`In repair: ${m.garage_name} (${m.service_type})`}
                              >
                                <div className="font-semibold truncate">{tr('In repair')}</div>
                                {spanDays >= 2 && (
                                  <div className="truncate text-[11px]">until {formatHumanDate(mEnd)}</div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{tr('Booked')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{tr('Done')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{tr('On Trip')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{tr('In repair')}</span>
            </span>
          </div>
          <span className="hidden sm:inline">Tap any empty day to book · Tap any bar for details</span>
        </div>
      </div>

      {/* Trip Details Modal */}
      {selectedBooking && (
        <ModalShell
          isOpen={true}
          onClose={() => {
            setSelectedBooking(null);
            setAssignmentNotice(null);
          }}
          maxWidthClass="max-w-lg"
          title={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 accent-text">
                #{selectedBooking.id}
              </span>
              <span>{tr('Trip Details')}</span>
            </div>
          }
          subtitle={`${tr('Going to')}: ${selectedBooking.destination}`}
          bodyClassName="p-5 sm:p-6 space-y-4 text-sm"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              {onSelectBookingForDispatch && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectBookingForDispatch(selectedBooking);
                    setSelectedBooking(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 accent-bg hover:opacity-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>{tr('Send Driver SMS')}</span>
                </button>
              )}

              {onUpdateBookingStatus && selectedBooking.status !== 'Completed' && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateBookingStatus(selectedBooking.id, 'Completed');
                    setSelectedBooking(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{tr('Mark Trip Done')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedBooking(null);
                  setAssignmentNotice(null);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium ml-auto hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {tr('Close')}
              </button>
            </div>
          }
        >

            {assignmentNotice && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  assignmentNotice.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {assignmentNotice.message}
              </div>
            )}

            <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Guest')}</span>
                <span className="text-slate-900 dark:text-white font-semibold mt-0.5 block">
                  {selectedBooking.client_name}
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {selectedBooking.client_phone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Price')}</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block tabular-nums">
                  {formatMoney(selectedBooking.total_rwf)}
                </span>
                <span className="text-slate-500 dark:text-slate-400">{selectedBooking.status}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Dates')}</span>
                <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {formatHumanDateRange(selectedBooking.start_date, selectedBooking.end_date, { includeYear: true })} (
                  {calculateDays(selectedBooking.start_date, selectedBooking.end_date)} days)
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Airport Flight')}</span>
                <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedBooking.flight_number ? (
                    <span className="font-mono inline-flex items-center gap-1">
                      <Plane className="w-3.5 h-3.5 accent-text" />
                      {selectedBooking.flight_number} ({selectedBooking.flight_status || tr('On Time')})
                    </span>
                  ) : (
                    tr('City Pickup')
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block">
                {tr('Driver for This Trip')}
              </label>
              <select
                value={selectedBooking.driver_id}
                onChange={(e) => handleReassignDriver(selectedBooking.id, e.target.value)}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="">-- {tr('No Driver')} ({tr('Self-Drive')}) --</option>
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
                        ? ` [${tr('Busy')}: ${collision.conflictingBooking?.client_name || tr('Booked')}]`
                        : ` [${tr('Free')}]`}
                    </option>
                  );
                })}
              </select>
            </div>

        </ModalShell>
      )}

      {/* Block Car Modal */}
      {isBlockVehicleModalOpen && (
        <ModalShell
          isOpen={true}
          onClose={() => setIsBlockVehicleModalOpen(false)}
          maxWidthClass="max-w-md"
          icon={<Ban className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          title={tr('Block a Car')}
          bodyClassName="p-5 sm:p-6 space-y-4 text-sm"
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBlockVehicleModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {tr('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmBlockVehicle}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>{tr('Block Car Now')}</span>
              </button>
            </div>
          }
        >

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tr('Lock a car so nobody can book it while it is in the garage or being checked.')}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block">{tr('Choose Car')}</label>
              <select
                value={blockSelectedVehicleId}
                onChange={(e) => setBlockSelectedVehicleId(e.target.value)}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.model_name} ({v.plate_number}) · {tr(v.status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block">{tr('Why is it blocked?')}</label>
              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="Police Safety Check">{tr('Police Safety Check')}</option>
                <option value="Oil & Filter Service">{tr('Oil & Filter Service')}</option>
                <option value="Brakes & Wheel Repair">{tr('Brakes & Wheel Repair')}</option>
                <option value="New Tires">{tr('New Tires')}</option>
                <option value="Deep Wash & Inside Clean">{tr('Deep Wash & Inside Clean')}</option>
                <option value="Body Paint & Dent Repair">{tr('Body Paint & Dent Repair')}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block">{tr('Garage Name or Note')}</label>
              <input
                type="text"
                placeholder="e.g. Remera Inspection / Toyota Garage"
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>

        </ModalShell>
      )}
    </div>
  );
};
