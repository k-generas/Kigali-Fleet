import React, { useState } from 'react';
import { Booking, Driver, Vehicle, BookingStatus } from '../types';
import { formatRwf } from '../utils/collision';
import { FileText, Send, CheckCircle2, Plane, AlertTriangle, ShieldCheck, Phone } from 'lucide-react';
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
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus !== 'All' && b.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchClient = b.client_name.toLowerCase().includes(q);
      const matchDest = b.destination.toLowerCase().includes(q);
      const matchFlight = b.flight_number?.toLowerCase().includes(q);
      const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
      const matchPlate = vehicle?.plate_number.toLowerCase().includes(q);
      if (!matchClient && !matchDest && !matchFlight && !matchPlate) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: activeThemeColor }} />
            <span>Collision-Guarded Bookings & Automated Dispatch</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time itinerary lock, MTN/Airtel MoMo payment verification, and Africa's Talking driver dispatch.
          </p>
        </div>

        <button
          onClick={onOpenNewBooking}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm self-start sm:self-auto active:scale-95 ${activeBtnText}`}
          style={{ backgroundColor: activeThemeColor }}
        >
          + New Collision-Guarded Booking
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((st) => {
            const isSelected = filterStatus === st;
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? `${activeBtnText} font-bold shadow-xs`
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                style={isSelected ? { backgroundColor: activeThemeColor } : undefined}
              >
                {st} {st === 'All' ? `(${bookings.length})` : ''}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Search client, plate, flight or destination..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 outline-none w-full sm:w-72"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/70 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Booking Ref & Client</th>
                <th className="py-3 px-4">Vehicle Details</th>
                <th className="py-3 px-4">Assigned Chauffeur</th>
                <th className="py-3 px-4">Mission Itinerary & Dates</th>
                <th className="py-3 px-4">Flight Tracking</th>
                <th className="py-3 px-4">Ledger Total</th>
                <th className="py-3 px-4">Trip Status</th>
                <th className="py-3 px-4 text-right">Dispatch Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No bookings found matching filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
                  const driver = drivers.find((d) => d.id === b.driver_id);

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Booking ID & Client */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-xs" style={{ color: activeThemeColor }}>
                          #{b.id}
                        </div>
                        <div className="font-bold text-white text-xs mt-0.5">{b.client_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{b.client_phone}</div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{vehicle?.model_name || 'Unassigned'}</div>
                        <div className="font-mono text-[11px] font-semibold" style={{ color: activeThemeColor }}>
                          {vehicle?.plate_number}
                        </div>
                        <span className="text-[10px] text-slate-400">{vehicle?.category}</span>
                      </td>

                      {/* Driver */}
                      <td className="py-3 px-4">
                        {driver ? (
                          <>
                            <div className="font-semibold text-white">{driver.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{driver.phone}</div>
                            <span className="text-[10px] text-slate-400">Lang: {driver.language}</span>
                          </>
                        ) : (
                          <span className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Unassigned</span>
                          </span>
                        )}
                      </td>

                      {/* Itinerary */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200 truncate max-w-xs">{b.destination}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {b.start_date} → {b.end_date}
                        </div>
                      </td>

                      {/* Flight */}
                      <td className="py-3 px-4">
                        {b.flight_number ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-mono text-[11px]" style={{ color: activeThemeColor }}>
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
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                                  : b.flight_status === 'On Time'
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="On Time">On Time</option>
                              <option value="Delayed">Delayed 45m</option>
                              <option value="Landed">Landed</option>
                            </select>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Direct Transfer</span>
                        )}
                      </td>

                      {/* Total & Payment */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white text-xs tabular-nums">
                          {formatRwf(b.total_rwf)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {b.payment_status}
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: activeThemeColor }}>
                          {b.payment_method}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <select
                          value={b.status}
                          onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as BookingStatus)}
                          className={`text-xs font-semibold rounded px-2 py-1 outline-none border cursor-pointer ${
                            b.status === 'Confirmed'
                              ? 'bg-sky-950/60 text-sky-300 border-sky-700'
                              : b.status === 'In Progress'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                              : b.status === 'Completed'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                              : 'bg-rose-950/60 text-rose-300 border-rose-700'
                          }`}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Dispatch Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {b.dispatch_status === 'Not Sent' && (
                            <button
                              onClick={() => onSelectBookingForDispatch(b.id)}
                              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded transition-all whitespace-nowrap shadow-sm active:scale-95 ${activeBtnText}`}
                              style={{ backgroundColor: activeThemeColor }}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Dispatch SMS</span>
                            </button>
                          )}

                          {b.dispatch_status === 'Dispatched (SMS)' && (
                            <>
                              <div className="text-[10px] font-semibold flex items-center gap-1" style={{ color: activeThemeColor }}>
                                <Send className="w-3 h-3" />
                                <span>Dispatched</span>
                              </div>
                              <button
                                onClick={() => onAcknowledgeCheckin(b.id)}
                                className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-medium"
                                title="Simulate driver dialing *134# USSD to confirm pickup"
                              >
                                Driver *134# Check-in
                              </button>
                            </>
                          )}

                          {b.dispatch_status === 'Acknowledged by Driver' && (
                            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Acknowledged</span>
                            </div>
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
    </div>
  );
};
