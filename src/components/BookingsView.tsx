import React, { useState, useMemo } from 'react';
import { Booking, Driver, Vehicle, BookingStatus, PaymentStatus } from '../types';
import {
  Send,
  Plane,
  Search,
  X,
  Printer,
  Plus,
  CalendarCheck,
  Car,
  DollarSign,
  Clock,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { useI18n } from '../utils/i18n';
import { formatHumanDate, formatHumanDateRange } from '../utils/dates';

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
  onOpenNewBooking,
  onSelectBookingForDispatch,
  onAcknowledgeCheckin,
  onUpdateBookingStatus,
  onUpdateFlightStatus,
  onUpdateBooking,
  onDeleteBooking,
}) => {
  const { formatMoney, tr } = useI18n();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPayment, setFilterPayment] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

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

  const statusTabs: { value: string; label: string }[] = [
    { value: 'All', label: `${tr('All')} (${bookings.length})` },
    { value: 'Confirmed', label: `${tr('Booked')} (${bookings.filter((b) => b.status === 'Confirmed').length})` },
    { value: 'In Progress', label: `${tr('On trip')} (${bookings.filter((b) => b.status === 'In Progress').length})` },
    { value: 'Completed', label: `${tr('Done')} (${bookings.filter((b) => b.status === 'Completed').length})` },
    { value: 'Cancelled', label: `${tr('Cancelled')} (${bookings.filter((b) => b.status === 'Cancelled').length})` },
  ];

  const getStatusDotClass = (status: BookingStatus) => {
    if (status === 'In Progress') return 'bg-amber-500';
    if (status === 'Completed') return 'bg-emerald-500';
    if (status === 'Cancelled') return 'bg-rose-500';
    return 'bg-blue-500';
  };

  const getStatusTextClass = (status: BookingStatus) => {
    if (status === 'In Progress') return 'text-amber-700 dark:text-amber-400';
    if (status === 'Completed') return 'text-emerald-700 dark:text-emerald-400';
    if (status === 'Cancelled') return 'text-rose-700 dark:text-rose-400';
    return 'text-blue-700 dark:text-blue-400';
  };

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Bookings')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('All customer trips, dates, prices, and payments in one simple list.')}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewBooking}
          className="accent-bg inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 transition-opacity shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{tr('New Booking')}</span>
        </button>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('All bookings')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {metrics.total}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {metrics.confirmed} booked · {metrics.completed} done
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('On trip')}</span>
            <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {metrics.inProgress}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Active trips out on the road
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Total money')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {formatMoney(metrics.totalRevenueRwf)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Active & completed bookings
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Still unpaid')}</span>
            <span className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-rose-600 dark:text-rose-400 mt-2 font-mono tabular-nums">
            {formatMoney(metrics.pendingBalanceRwf)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Pending customer payment
          </p>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        {/* Segmented Filter Tabs & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg overflow-x-auto">
            {statusTabs.map((tab) => {
              const active = filterStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilterStatus(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr('Search customer, plate, flight or place')}
                className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg pl-9 pr-8 py-1.5 w-64 outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="All">{tr('All payments')}</option>
              <option value="Fully Paid">{tr('Fully paid')}</option>
              <option value="Deposit Paid (MoMo)">{tr('Deposit paid')}</option>
              <option value="Pending Payment">{tr('Unpaid')}</option>
            </select>
          </div>
        </div>

        {/* Clean Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[920px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">{tr('Customer')}</th>
                <th className="py-3 px-4">{tr('Car & driver')}</th>
                <th className="py-3 px-4">{tr('Trip & flight')}</th>
                <th className="py-3 px-4 text-right">{tr('Total')}</th>
                <th className="py-3 px-4">{tr('Status')}</th>
                <th className="py-3 px-4 text-right">{tr('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-slate-500 dark:text-slate-400">
                    {tr('No bookings match your search.')}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
                  const driver = drivers.find((d) => d.id === b.driver_id);

                  return (
                    <tr
                      key={b.id}
                      onClick={() => {
                        setSelectedBookingDetails(b);
                        setConfirmCancelId(null);
                      }}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 align-top cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedBookingDetails(b)}
                          className="font-mono text-xs font-semibold accent-text hover:underline"
                        >
                          #{b.id}
                        </button>
                        <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                          {b.client_name}
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {b.client_phone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {vehicle?.model_name || 'No car'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {vehicle?.plate_number && (
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                              {vehicle.plate_number}
                            </span>
                          )}
                          {driver ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {driver.name}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                              <span>{tr('No driver')}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {b.destination}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span>{formatHumanDateRange(b.start_date, b.end_date)}</span>
                          {b.flight_number && (
                            <span className="inline-flex items-center gap-1.5">
                              <Plane className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {b.flight_number}
                              </span>
                              <select
                                value={b.flight_status || 'Scheduled'}
                                onChange={(e) =>
                                  onUpdateFlightStatus(
                                    b.id,
                                    e.target.value as 'On Time' | 'Delayed' | 'Landed' | 'Scheduled'
                                  )
                                }
                                className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-md px-1.5 py-0.5 outline-none cursor-pointer"
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="On Time">On time</option>
                                <option value="Delayed">Late</option>
                                <option value="Landed">Landed</option>
                              </select>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                          {formatMoney(b.total_rwf)}
                        </div>
                        <div className="mt-1">
                          <select
                            value={b.payment_status}
                            onChange={(e) =>
                              handleUpdatePaymentStatus(b.id, e.target.value as PaymentStatus)
                            }
                            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-md px-2 py-0.5 outline-none cursor-pointer"
                          >
                            <option value="Fully Paid">Fully paid</option>
                            <option value="Deposit Paid (MoMo)">Deposit paid</option>
                            <option value="Pending Payment">Unpaid</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotClass(b.status)}`} />
                          <select
                            value={b.status}
                            onChange={(e) =>
                              onUpdateBookingStatus(b.id, e.target.value as BookingStatus)
                            }
                            className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 outline-none cursor-pointer ${getStatusTextClass(b.status)}`}
                          >
                            <option value="Confirmed">Booked</option>
                            <option value="In Progress">On trip</option>
                            <option value="Completed">Done</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingDetails(b);
                              setConfirmCancelId(null);
                            }}
                            className="accent-text text-xs font-medium hover:underline"
                          >
                            {tr('Details')}
                          </button>

                          {b.dispatch_status === 'Not Sent' && (
                            <button
                              type="button"
                              onClick={() => onSelectBookingForDispatch(b.id)}
                              className="accent-bg inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{tr('Send SMS')}</span>
                            </button>
                          )}

                          {b.dispatch_status === 'Dispatched (SMS)' && (
                            <button
                              type="button"
                              onClick={() => onAcknowledgeCheckin(b.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              {tr('Mark ready')}
                            </button>
                          )}
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

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl kf-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 accent-text">
                    #{selectedBookingDetails.id}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 font-medium ${getStatusTextClass(selectedBookingDetails.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(selectedBookingDetails.status)}`} />
                    <span>{selectedBookingDetails.status}</span>
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-1.5">
                  {selectedBookingDetails.client_name}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono">{selectedBookingDetails.client_phone}</span>
                  <span>·</span>
                  <span>{selectedBookingDetails.client_email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiptOpen(!isReceiptOpen)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Show receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingDetails(null);
                    setIsReceiptOpen(false);
                    setConfirmCancelId(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Key Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Total price</span>
                <p className="text-sm font-semibold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {formatMoney(selectedBookingDetails.total_rwf)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Payment</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                  {selectedBookingDetails.payment_status}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Method</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {selectedBookingDetails.payment_method}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Trip dates</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {formatHumanDate(selectedBookingDetails.start_date)}
                </p>
              </div>
            </div>

            {/* Vehicle & Driver Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(() => {
                const vehicle = vehicles.find((v) => v.id === selectedBookingDetails.vehicle_id);
                return (
                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/40 rounded-xl space-y-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Car</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {vehicle?.model_name || 'Car'}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="font-mono accent-text font-semibold">
                        {vehicle?.plate_number}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{vehicle?.location}</span>
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const driver = drivers.find((d) => d.id === selectedBookingDetails.driver_id);
                return (
                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/40 rounded-xl space-y-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Driver</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {driver?.name || 'No driver yet'}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="font-mono text-slate-500 dark:text-slate-400">{driver?.phone}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{driver?.rating || 5.0} / 5</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {selectedBookingDetails.flight_number && (
              <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold text-blue-700 dark:text-blue-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Plane className="w-4 h-4" />
                    <span>Airport flight</span>
                  </span>
                  <span className="font-mono">{selectedBookingDetails.flight_number}</span>
                </div>
                <div className="text-slate-700 dark:text-slate-200">
                  From <strong className="font-semibold">{selectedBookingDetails.flight_origin || 'Entebbe'}</strong> · Status:{' '}
                  <strong className="font-semibold">{selectedBookingDetails.flight_status || 'On Time'}</strong>
                </div>
              </div>
            )}

            {isReceiptOpen && (
              <div className="p-5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 font-mono text-sm">
                <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-semibold text-base text-slate-900 dark:text-white">Payment receipt</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">KigaliFleet · TIN 100984512</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedBookingDetails.client_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Booking:</span>
                    <span>#{selectedBookingDetails.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Trip:</span>
                    <span className="truncate max-w-[260px]">{selectedBookingDetails.destination}</span>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-700 py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatMoney(Math.round(selectedBookingDetails.total_rwf / 1.18))}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Tax (18%):</span>
                    <span>
                      {formatMoney(Math.round(selectedBookingDetails.total_rwf - selectedBookingDetails.total_rwf / 1.18))}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-sm text-slate-900 dark:text-white pt-1">
                    <span>Total paid:</span>
                    <span>{formatMoney(selectedBookingDetails.total_rwf)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {confirmCancelId === selectedBookingDetails.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Cancel this booking?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteBooking?.(selectedBookingDetails.id);
                      setSelectedBookingDetails(null);
                      setConfirmCancelId(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium"
                  >
                    Yes, cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancelId(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancelId(selectedBookingDetails.id)}
                  className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Cancel booking
                </button>
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReceiptOpen(!isReceiptOpen)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {isReceiptOpen ? 'Hide receipt' : 'Show receipt'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectBookingForDispatch(selectedBookingDetails.id);
                    setSelectedBookingDetails(null);
                  }}
                  className="accent-bg px-4 py-2 text-sm font-medium rounded-lg hover:opacity-95"
                >
                  Send driver SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
