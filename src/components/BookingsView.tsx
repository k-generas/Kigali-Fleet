import React, { useState, useMemo } from 'react';
import { Booking, Driver, Vehicle, BookingStatus, PaymentStatus } from '../types';
import { formatRwf } from '../utils/collision';
import {
  FileText,
  Send,
  CheckCircle2,
  Plane,
  AlertTriangle,
  Phone,
  Search,
  MapPin,
  Car,
  UserCheck,
  Check,
  X,
  Printer,
  Plus,
  Trash2,
  ArrowUpRight,
  Activity,
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
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPayment, setFilterPayment] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const activeThemeColor = currentTheme?.hex || '#635bff';
  const activeBtnText = currentTheme?.btnText || 'text-white';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 stripe-card">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#0a2540] dark:text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6" style={{ color: activeThemeColor }} />
              <span>Bookings</span>
            </h2>
            <span
              className="text-xs font-mono px-3 py-1 rounded-full font-semibold"
              style={{
                backgroundColor: `${activeThemeColor}18`,
                color: activeThemeColor,
              }}
            >
              {bookings.length} total
            </span>
          </div>
          <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
            All customer trips, dates, prices, and payments in one simple list.
          </p>
        </div>

        <button
          onClick={onOpenNewBooking}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-all shadow-xs active:scale-95 self-start sm:self-auto ${activeBtnText}`}
          style={{ backgroundColor: activeThemeColor }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Booking</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-[#425466] dark:text-slate-400">All Bookings</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-[#0a2540] dark:text-white font-mono">{metrics.total}</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-sky-600 dark:text-sky-400">Booked</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">{metrics.confirmed}</span>
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">On Trip</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{metrics.inProgress}</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Done</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{metrics.completed}</span>
            <Check className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total Money</span>
          <div className="mt-1.5">
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate block">
              {formatRwf(metrics.totalRevenueRwf)}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Still Unpaid</span>
          <div className="mt-1.5">
            <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono truncate block">
              {formatRwf(metrics.pendingBalanceRwf)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 stripe-card">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, car plate, flight, or place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-8 py-2 text-sm text-[#0a2540] dark:text-white outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0a2540] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {['All', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === st
                    ? 'bg-white dark:bg-slate-900 text-[#0a2540] dark:text-white shadow-xs'
                    : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-[#0a2540] dark:text-slate-200 outline-none"
          >
            <option value="All">All Payments</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Deposit Paid (MoMo)">Deposit Paid</option>
            <option value="Pending Payment">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Horizontal Grid Ledger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden stripe-card">
        <div className="hidden xl:grid xl:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-800/70 text-[#425466] dark:text-slate-300 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
          <div className="xl:col-span-3">Customer</div>
          <div className="xl:col-span-2">Car & Driver</div>
          <div className="xl:col-span-3">Trip & Flight</div>
          <div className="xl:col-span-2">Payment</div>
          <div className="xl:col-span-2 text-right">Status & Actions</div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
          {filteredBookings.length === 0 ? (
            <div className="py-12 text-center text-[#425466] dark:text-slate-400">
              <FileText className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p className="font-semibold">No bookings match your search.</p>
            </div>
          ) : (
            filteredBookings.map((b) => {
              const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
              const driver = drivers.find((d) => d.id === b.driver_id);

              return (
                <div
                  key={b.id}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3 items-center px-4 py-4 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedBookingDetails(b);
                    setConfirmCancelId(null);
                  }}
                >
                  <div className="xl:col-span-3 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <div
                      onClick={() => setSelectedBookingDetails(b)}
                      className="font-mono font-bold text-xs cursor-pointer hover:underline whitespace-nowrap"
                      style={{ color: activeThemeColor }}
                    >
                      #{b.id}
                    </div>
                    <div className="font-semibold text-[#0a2540] dark:text-white mt-0.5 truncate">
                      {b.client_name}
                    </div>
                    <div className="text-xs text-[#425466] dark:text-slate-400 font-mono whitespace-nowrap">
                      {b.client_phone}
                    </div>
                  </div>

                  <div className="xl:col-span-2 min-w-0 space-y-1">
                    <div className="font-medium text-[#0a2540] dark:text-white truncate">
                      {vehicle?.model_name || 'No car'}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center border border-amber-400/50 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded font-mono text-xs font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                        {vehicle?.plate_number}
                      </span>
                      {driver ? (
                        <span className="text-xs text-[#425466] dark:text-slate-300 truncate font-medium">
                          {driver.name}
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>No driver</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="xl:col-span-3 min-w-0 space-y-1" onClick={(e) => e.stopPropagation()}>
                    <div className="font-medium text-[#0a2540] dark:text-slate-200 flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#425466] dark:text-slate-400 font-mono whitespace-nowrap">
                        {b.start_date} → {b.end_date}
                      </span>
                      {b.flight_number && (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                            <Plane className="w-3.5 h-3.5 shrink-0" />
                            <span>{b.flight_number}</span>
                          </span>
                          <select
                            value={b.flight_status || 'Scheduled'}
                            onChange={(e) =>
                              onUpdateFlightStatus(b.id, e.target.value as 'On Time' | 'Delayed' | 'Landed' | 'Scheduled')
                            }
                            className="text-xs font-medium px-2 py-0.5 rounded-lg border bg-[#f6f9fc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-200 outline-none cursor-pointer"
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="On Time">On Time</option>
                            <option value="Delayed">Late</option>
                            <option value="Landed">Landed</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="xl:col-span-2 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <div className="font-mono font-bold text-[#0a2540] dark:text-white tabular-nums whitespace-nowrap">
                      {formatRwf(b.total_rwf)}
                    </div>
                    <select
                      value={b.payment_status}
                      onChange={(e) =>
                        handleUpdatePaymentStatus(b.id, e.target.value as PaymentStatus)
                      }
                      className="text-xs font-semibold rounded-lg px-2 py-1 mt-1 border bg-[#f6f9fc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-200 outline-none cursor-pointer max-w-full"
                    >
                      <option value="Fully Paid">Fully Paid</option>
                      <option value="Deposit Paid (MoMo)">Deposit Paid</option>
                      <option value="Pending Payment">Unpaid</option>
                    </select>
                  </div>

                  <div className="xl:col-span-2 flex items-center md:justify-end gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={b.status}
                      onChange={(e) =>
                        onUpdateBookingStatus(b.id, e.target.value as BookingStatus)
                      }
                      className="text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none border bg-[#f6f9fc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-200 cursor-pointer"
                    >
                      <option value="Confirmed">Booked</option>
                      <option value="In Progress">On Trip</option>
                      <option value="Completed">Done</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    {b.dispatch_status === 'Not Sent' && (
                      <button
                        onClick={() => onSelectBookingForDispatch(b.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap shadow-xs active:scale-95 ${activeBtnText}`}
                        style={{ backgroundColor: activeThemeColor }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send SMS</span>
                      </button>
                    )}

                    {b.dispatch_status === 'Dispatched (SMS)' && (
                      <button
                        onClick={() => onAcknowledgeCheckin(b.id)}
                        className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full border border-slate-200 dark:border-slate-700 font-semibold whitespace-nowrap"
                      >
                        Mark Ready
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedBookingDetails(b);
                        setConfirmCancelId(null);
                      }}
                      className="p-2 rounded-lg text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="See booking details"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg"
                    style={{ backgroundColor: `${activeThemeColor}18`, color: activeThemeColor }}
                  >
                    #{selectedBookingDetails.id}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-200">
                    {selectedBookingDetails.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0a2540] dark:text-white mt-2">
                  {selectedBookingDetails.client_name}
                </h3>
                <div className="text-sm text-[#425466] dark:text-slate-400 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {selectedBookingDetails.client_phone}
                  </span>
                  <span>·</span>
                  <span>{selectedBookingDetails.client_email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReceiptOpen(!isReceiptOpen)}
                  className="p-2 rounded-lg text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Show receipt"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedBookingDetails(null);
                    setIsReceiptOpen(false);
                    setConfirmCancelId(null);
                  }}
                  className="p-2 rounded-lg text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-[#425466] dark:text-slate-400 font-medium">Total Price</span>
                <p className="text-base font-bold text-[#0a2540] dark:text-white font-mono mt-1">
                  {formatRwf(selectedBookingDetails.total_rwf)}
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-[#425466] dark:text-slate-400 font-medium">Payment</span>
                <p className="text-sm font-semibold text-[#0a2540] dark:text-white mt-1 truncate">
                  {selectedBookingDetails.payment_status}
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-[#425466] dark:text-slate-400 font-medium">Method</span>
                <p className="text-sm font-semibold text-[#0a2540] dark:text-white mt-1">
                  {selectedBookingDetails.payment_method}
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-[#425466] dark:text-slate-400 font-medium">Start Date</span>
                <p className="text-sm font-semibold text-[#0a2540] dark:text-white font-mono mt-1">
                  {selectedBookingDetails.start_date}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(() => {
                const vehicle = vehicles.find((v) => v.id === selectedBookingDetails.vehicle_id);
                return (
                  <div className="p-4 bg-[#f6f9fc] dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-[#425466] dark:text-slate-400 flex items-center gap-1.5">
                      <Car className="w-4 h-4" style={{ color: activeThemeColor }} />
                      <span>Car</span>
                    </div>
                    <div className="text-base font-bold text-[#0a2540] dark:text-white">
                      {vehicle?.model_name || 'Car'}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-bold" style={{ color: activeThemeColor }}>
                        {vehicle?.plate_number}
                      </span>
                      <span className="text-[#425466] dark:text-slate-400">{vehicle?.location}</span>
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const driver = drivers.find((d) => d.id === selectedBookingDetails.driver_id);
                return (
                  <div className="p-4 bg-[#f6f9fc] dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-[#425466] dark:text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" style={{ color: activeThemeColor }} />
                      <span>Driver</span>
                    </div>
                    <div className="text-base font-bold text-[#0a2540] dark:text-white">
                      {driver?.name || 'No driver yet'}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-[#425466] dark:text-slate-400">{driver?.phone}</span>
                      <span className="text-[#425466] dark:text-slate-400">{driver?.rating || 5.0} ★</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {selectedBookingDetails.flight_number && (
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-1.5 text-sm">
                <div className="flex items-center justify-between font-bold text-sky-800 dark:text-sky-300">
                  <span className="flex items-center gap-2">
                    <Plane className="w-4 h-4" />
                    <span>Airport Flight</span>
                  </span>
                  <span className="font-mono">{selectedBookingDetails.flight_number}</span>
                </div>
                <div className="text-sky-900 dark:text-sky-200">
                  From <strong>{selectedBookingDetails.flight_origin || 'Entebbe'}</strong> · Status:{' '}
                  <strong>{selectedBookingDetails.flight_status || 'On Time'}</strong>
                </div>
              </div>
            )}

            {isReceiptOpen && (
              <div className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 font-mono text-sm">
                <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-bold text-base text-[#0a2540] dark:text-white">Payment Receipt</h4>
                  <p className="text-xs text-[#425466] dark:text-slate-400">KigaliFleet · TIN 100984512</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold">{selectedBookingDetails.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Booking:</span>
                    <span>#{selectedBookingDetails.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trip:</span>
                    <span className="truncate max-w-[240px]">{selectedBookingDetails.destination}</span>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatRwf(Math.round(selectedBookingDetails.total_rwf / 1.18))}</span>
                  </div>
                  <div className="flex justify-between text-[#425466] dark:text-slate-400">
                    <span>Tax (18%):</span>
                    <span>{formatRwf(Math.round(selectedBookingDetails.total_rwf - selectedBookingDetails.total_rwf / 1.18))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#0a2540] dark:text-white pt-1">
                    <span>Total Paid:</span>
                    <span>{formatRwf(selectedBookingDetails.total_rwf)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {confirmCancelId === selectedBookingDetails.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">Cancel this booking?</span>
                  <button
                    onClick={() => {
                      onDeleteBooking?.(selectedBookingDetails.id);
                      setSelectedBookingDetails(null);
                      setConfirmCancelId(null);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setConfirmCancelId(null)}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmCancelId(selectedBookingDetails.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Cancel Booking</span>
                </button>
              )}

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsReceiptOpen(!isReceiptOpen)}
                  className="px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0a2540] dark:text-slate-200"
                >
                  {isReceiptOpen ? 'Hide Receipt' : 'Show Receipt'}
                </button>
                <button
                  onClick={() => {
                    onSelectBookingForDispatch(selectedBookingDetails.id);
                    setSelectedBookingDetails(null);
                  }}
                  className={`px-5 py-2 text-sm font-semibold rounded-full transition-all shadow-xs ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Send Driver SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
