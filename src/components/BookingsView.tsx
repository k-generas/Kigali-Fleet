import React, { useState, useMemo } from 'react';
import { Booking, Driver, Vehicle, BookingStatus, PaymentStatus } from '../types';
import { formatRwf } from '../utils/collision';
import {
  FileText,
  Send,
  CheckCircle2,
  Plane,
  AlertTriangle,
  ShieldCheck,
  Phone,
  Search,
  Filter,
  DollarSign,
  Calendar,
  MapPin,
  Clock,
  Car,
  UserCheck,
  Check,
  X,
  CreditCard,
  Printer,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  ArrowUpRight,
  Activity,
  Layers,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface BookingsViewProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  drivers: Driver[];
  currentTheme?: ColorTheme;
  onOpenNewBooking: () => void;
  onSelectBookingForDispatch: (bookingId: string) => void;
  onAcknowledgeCheckin: (bookingId: string) => void;
  onUpdateBookingStatus: (id: string, status: BookingStatus) => void;
  onUpdateFlightStatus: (
    bookingId: string,
    flightStatus: 'On Time' | 'Delayed' | 'Landed' | 'Scheduled'
  ) => void;
  onUpdateBooking?: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking?: (id: string) => void;
  onAssignDriver?: (bookingId: string, driverId: string) => { success: boolean; error?: string };
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  vehicles,
  drivers,
  currentTheme,
  onOpenNewBooking,
  onSelectBookingForDispatch,
  onAcknowledgeCheckin,
  onUpdateBookingStatus,
  onUpdateFlightStatus,
  onUpdateBooking,
  onDeleteBooking,
  onAssignDriver,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPayment, setFilterPayment] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [isEbmReceiptOpen, setIsEbmReceiptOpen] = useState(false);
  const [momoRefInput, setMomoRefInput] = useState('');
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState<string | null>(null);

  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
    const inProgress = bookings.filter((b) => b.status === 'In Progress').length;
    const completed = bookings.filter((b) => b.status === 'Completed').length;
    const totalRevenueRwf = bookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + b.total_rwf, 0);
    const pendingBalanceRwf = bookings
      .filter((b) => b.status !== 'Cancelled' && b.payment_status === 'Pending Payment')
      .reduce((sum, b) => sum + b.total_rwf, 0);

    return { total, confirmed, inProgress, completed, totalRevenueRwf, pendingBalanceRwf };
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filterStatus !== 'All' && b.status !== filterStatus) return false;
      if (filterPayment !== 'All' && b.payment_status !== filterPayment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchClient = b.client_name.toLowerCase().includes(q);
        const matchId = b.id.toLowerCase().includes(q);
        const matchDest = b.destination.toLowerCase().includes(q);
        const matchFlight = b.flight_number?.toLowerCase().includes(q);
        const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
        const matchPlate = vehicle?.plate_number.toLowerCase().includes(q);
        const driver = drivers.find((d) => d.id === b.driver_id);
        const matchDriver = driver?.name.toLowerCase().includes(q);
        if (!matchClient && !matchId && !matchDest && !matchFlight && !matchPlate && !matchDriver) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, vehicles, drivers, filterStatus, filterPayment, searchQuery]);

  const handleUpdatePaymentStatus = (bookingId: string, payment_status: PaymentStatus) => {
    if (onUpdateBooking) {
      onUpdateBooking(bookingId, { payment_status });
      if (selectedBookingDetails?.id === bookingId) {
        setSelectedBookingDetails({ ...selectedBookingDetails, payment_status });
      }
    }
  };

  const handleReassignDriver = (bookingId: string, newDriverId: string) => {
    if (onAssignDriver) {
      const res = onAssignDriver(bookingId, newDriverId);
      if (res.success) {
        setReassignSuccessMsg('Chauffeur reassigned with zero schedule conflicts!');
        setTimeout(() => setReassignSuccessMsg(null), 3500);
        if (selectedBookingDetails?.id === bookingId) {
          setSelectedBookingDetails({ ...selectedBookingDetails, driver_id: newDriverId });
        }
      } else {
        alert(res.error || 'Failed to reassign chauffeur.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: activeThemeColor }} />
              <span>Collision-Guarded Bookings & Dispatch Ledger</span>
            </h2>
            <span
              className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold"
              style={{
                backgroundColor: `${activeThemeColor}20`,
                color: activeThemeColor,
              }}
            >
              {bookings.length} RESERVATIONS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time itinerary locking, MTN MoMo payment tracking, RRA EBM invoicing, and Africa's Talking driver dispatch.
          </p>
        </div>

        <button
          onClick={onOpenNewBooking}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 self-start sm:self-auto ${activeBtnText}`}
          style={{ backgroundColor: activeThemeColor }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ New Collision-Guarded Booking</span>
        </button>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Bookings
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              {metrics.total}
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-sky-600 dark:text-sky-400">
            Confirmed
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
              {metrics.confirmed}
            </span>
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
            On Road (In Progress)
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {metrics.inProgress}
            </span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-purple-600 dark:text-purple-400">
            Completed Trips
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
              {metrics.completed}
            </span>
            <Check className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
            Gross Bookings Value
          </span>
          <div className="mt-1">
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono truncate block">
              {formatRwf(metrics.totalRevenueRwf)}
            </span>
            <span className="text-[10px] text-slate-400">Rwandan Francs</span>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-400">
            Pending Balance
          </span>
          <div className="mt-1">
            <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 font-mono truncate block">
              {formatRwf(metrics.pendingBalanceRwf)}
            </span>
            <span className="text-[10px] text-slate-400">Uncollected MoMo</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Multi-Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking (#bk...), customer, plate, flight (WB 212), or route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
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
          {/* Trip Status filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {['All', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  filterStatus === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Payment Status filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="All">All Payments</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Deposit Paid (MoMo)">Deposit Paid (MoMo)</option>
            <option value="Pending Payment">Pending Payment</option>
          </select>
        </div>
      </div>

      {/* 4. Bookings Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Ref & Customer</th>
                <th className="py-3 px-4">Vehicle & Plate</th>
                <th className="py-3 px-4">Chauffeur</th>
                <th className="py-3 px-4">Mission Itinerary & Dates</th>
                <th className="py-3 px-4">Flight Tracking</th>
                <th className="py-3 px-4">Payment & Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto opacity-40 mb-2" />
                    <p className="font-semibold">No bookings found matching filters.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
                  const driver = drivers.find((d) => d.id === b.driver_id);

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedBookingDetails(b)}
                    >
                      {/* Booking ID & Client */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div
                          onClick={() => setSelectedBookingDetails(b)}
                          className="font-mono font-bold text-xs cursor-pointer hover:underline"
                          style={{ color: activeThemeColor }}
                        >
                          #{b.id}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                          {b.client_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{b.client_phone}</div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {vehicle?.model_name || 'Unassigned'}
                        </div>
                        <div className="inline-flex items-center border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.2 rounded font-mono text-[10px] font-bold text-amber-500 mt-0.5">
                          <span className="text-[8px] bg-amber-500 text-slate-950 px-1 rounded mr-1 font-bold">
                            RW
                          </span>
                          {vehicle?.plate_number}
                        </div>
                      </td>

                      {/* Driver */}
                      <td className="py-3 px-4">
                        {driver ? (
                          <>
                            <div className="font-semibold text-slate-900 dark:text-white">{driver.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{driver.phone}</div>
                            <span className="text-[10px] text-slate-500">Lang: {driver.language}</span>
                          </>
                        ) : (
                          <span className="text-rose-500 text-[11px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Unassigned</span>
                          </span>
                        )}
                      </td>

                      {/* Itinerary */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{b.destination}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {b.start_date} → {b.end_date}
                        </div>
                      </td>

                      {/* Flight */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {b.flight_number ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-sky-500">
                              <Plane className="w-3.5 h-3.5" />
                              <span>{b.flight_number}</span>
                            </div>
                            <select
                              value={b.flight_status || 'Scheduled'}
                              onChange={(e) =>
                                onUpdateFlightStatus(b.id, e.target.value as any)
                              }
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border outline-none cursor-pointer ${
                                b.flight_status === 'Delayed'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                                  : b.flight_status === 'On Time'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="On Time">On Time</option>
                              <option value="Delayed">Delayed 45m</option>
                              <option value="Landed">Landed</option>
                            </select>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Direct Booking</span>
                        )}
                      </td>

                      {/* Total & Payment */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs tabular-nums">
                          {formatRwf(b.total_rwf)}
                        </div>
                        <select
                          value={b.payment_status}
                          onChange={(e) =>
                            handleUpdatePaymentStatus(b.id, e.target.value as PaymentStatus)
                          }
                          className={`text-[9px] font-bold rounded px-1.5 py-0.5 mt-0.5 border outline-none cursor-pointer ${
                            b.payment_status === 'Fully Paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                              : b.payment_status === 'Deposit Paid (MoMo)'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          <option value="Fully Paid">Fully Paid</option>
                          <option value="Deposit Paid (MoMo)">Deposit Paid (MoMo)</option>
                          <option value="Pending Payment">Pending Payment</option>
                        </select>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {b.payment_method}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={b.status}
                          onChange={(e) =>
                            onUpdateBookingStatus(b.id, e.target.value as BookingStatus)
                          }
                          className={`text-xs font-semibold rounded px-2 py-1 outline-none border cursor-pointer ${
                            b.status === 'Confirmed'
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700'
                              : b.status === 'In Progress'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : b.status === 'Completed'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Dispatch & Dossier Action */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {b.dispatch_status === 'Not Sent' && (
                            <button
                              onClick={() => onSelectBookingForDispatch(b.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap shadow-xs active:scale-95 ${activeBtnText}`}
                              style={{ backgroundColor: activeThemeColor }}
                              title="Send Africa's Talking SMS dispatch to chauffeur"
                            >
                              <Send className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {b.dispatch_status === 'Dispatched (SMS)' && (
                            <button
                              onClick={() => onAcknowledgeCheckin(b.id)}
                              className="px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
                              title="Driver dial *134# USSD check-in"
                            >
                              *134# Check-in
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedBookingDetails(b)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Open full booking dossier and EBM receipt"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detailed Booking Dossier & RRA EBM Receipt Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    #{selectedBookingDetails.id}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      selectedBookingDetails.status === 'Confirmed'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        : selectedBookingDetails.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : selectedBookingDetails.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {selectedBookingDetails.status}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {selectedBookingDetails.client_name}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                  <span>{selectedBookingDetails.client_phone}</span>
                  <span>•</span>
                  <span>{selectedBookingDetails.client_email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEbmReceiptOpen(!isEbmReceiptOpen)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Print / View RRA EBM v2 Tax Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedBookingDetails(null);
                    setIsEbmReceiptOpen(false);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {reassignSuccessMsg && (
              <div className="p-3 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{reassignSuccessMsg}</span>
              </div>
            )}

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Amount</span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRwf(selectedBookingDetails.total_rwf)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Payment Status</span>
                <p className="text-xs font-bold text-amber-500 mt-0.5 truncate">
                  {selectedBookingDetails.payment_status}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Payment Method</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedBookingDetails.payment_method}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Dates (Inclusive)</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {selectedBookingDetails.start_date}
                </p>
              </div>
            </div>

            {/* Physical Vehicle & Assigned Chauffeur Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Vehicle Card */}
              {(() => {
                const vehicle = vehicles.find((v) => v.id === selectedBookingDetails.vehicle_id);
                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-amber-500" />
                        Allocated Fleet Vehicle
                      </span>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">
                        Collision-Locked
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {vehicle?.model_name || 'Vehicle'}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-amber-500 font-bold">
                        {vehicle?.plate_number}
                      </span>
                      <span className="text-slate-400">{vehicle?.location}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Chauffeur Card */}
              {(() => {
                const driver = drivers.find((d) => d.id === selectedBookingDetails.driver_id);
                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                        Assigned Chauffeur
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {driver?.status || 'Active'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {driver?.name || 'Unassigned'}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500">{driver?.phone}</span>
                      <span className="text-slate-400">Rating: {driver?.rating || 5.0} ★</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* KIA Airport Flight Radar section if flight exists */}
            {selectedBookingDetails.flight_number && (
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                    <Plane className="w-4 h-4" />
                    <span>Kigali International Airport (KIA) Flight Radar</span>
                  </span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {selectedBookingDetails.flight_number}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    Origin: <strong>{selectedBookingDetails.flight_origin || 'Entebbe (EBB)'}</strong>
                  </div>
                  <div>
                    Live Radar Status:{' '}
                    <strong
                      className={
                        selectedBookingDetails.flight_status === 'Delayed'
                          ? 'text-rose-500'
                          : 'text-emerald-500'
                      }
                    >
                      {selectedBookingDetails.flight_status || 'On Time'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* RRA EBM Electronic Tax Invoice Preview */}
            {isEbmReceiptOpen && (
              <div className="p-5 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl space-y-3 font-mono text-xs shadow-inner">
                <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    RWANDA REVENUE AUTHORITY (RRA)
                  </h4>
                  <p className="text-[10px] text-slate-500">ELECTRONIC BILLING MACHINE (EBM v2)</p>
                  <p className="text-[10px] text-slate-400">TIN: 100984512 · KIGALI FLEET LTD</p>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span className="font-bold">{selectedBookingDetails.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BOOKING REF:</span>
                    <span>#{selectedBookingDetails.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ROUTE:</span>
                    <span className="truncate max-w-[200px]">{selectedBookingDetails.destination}</span>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-2 space-y-1">
                  <div className="flex justify-between">
                    <span>NET CHARGE (EXCL. VAT):</span>
                    <span>{formatRwf(Math.round(selectedBookingDetails.total_rwf / 1.18))}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>VAT (18%):</span>
                    <span>{formatRwf(Math.round(selectedBookingDetails.total_rwf - selectedBookingDetails.total_rwf / 1.18))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1">
                    <span>TOTAL RWF:</span>
                    <span>{formatRwf(selectedBookingDetails.total_rwf)}</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400">
                  SDC INVOICE NUMBER: SDC-RWA-{selectedBookingDetails.id.replace('bk-', '')}
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  if (onDeleteBooking && confirm(`Cancel & release reservation #${selectedBookingDetails.id}?`)) {
                    onDeleteBooking(selectedBookingDetails.id);
                    setSelectedBookingDetails(null);
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel Reservation</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEbmReceiptOpen(!isEbmReceiptOpen)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  {isEbmReceiptOpen ? 'Hide EBM Receipt' : 'Print EBM Receipt'}
                </button>
                <button
                  onClick={() => {
                    onSelectBookingForDispatch(selectedBookingDetails.id);
                    setSelectedBookingDetails(null);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Dispatch via SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
