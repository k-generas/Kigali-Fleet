import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Driver, Vehicle, BookingStatus } from '../types';
import { generateDriverSMS, checkDriverCollision } from '../utils/collision';
import { formatHumanDate, formatHumanDateRange } from '../utils/dates';
import { useI18n } from '../utils/i18n';
import {
  Send,
  Phone,
  Plane,
  User,
  CheckCircle,
  Printer,
  Search,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { ModalShell } from './ModalShell';

interface DispatchViewProps {
  bookings: Booking[];
  drivers: Driver[];
  vehicles: Vehicle[];
  currentTheme?: ColorTheme;
  currentUser?: any;
  currentCompany?: any;
  onDispatchSMS: (bookingId: string, language?: 'RW' | 'EN') => any;
  onAdvanceCheckin: (
    bookingId: string,
    targetStage?: 'Acknowledged by Driver' | 'Driver at Terminal' | 'Client Onboard'
  ) => void;
  onUpdateFlightStatus: (
    bookingId: string,
    status: 'On Time' | 'Delayed' | 'Landed' | 'Scheduled',
    delayMinutes?: number
  ) => void;
  onAssignDriver: (bookingId: string, driverId: string) => { success: boolean; error?: string };
  onCompleteTrip: (bookingId: string) => void;
  onUpdateBookingStatus?: (bookingId: string, status: BookingStatus) => void;
}

const inputCls =
  'w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';

export const DispatchView: React.FC<DispatchViewProps> = ({
  bookings,
  drivers,
  vehicles,
  currentUser,
  currentCompany,
  onDispatchSMS,
  onAdvanceCheckin,
  onUpdateFlightStatus,
  onAssignDriver,
  onCompleteTrip,
}) => {
  const { language, formatMoney, tr } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const [selectedTicketBooking, setSelectedTicketBooking] = useState<Booking | null>(null);
  const [selectedSMSBooking, setSelectedSMSBooking] = useState<Booking | null>(null);
  const [smsLanguage, setSmsLanguage] = useState<'RW' | 'EN'>(language === 'EN' ? 'EN' : 'RW');
  const [smsSendNotice, setSmsSendNotice] = useState<string | null>(null);

  useEffect(() => {
    if (language === 'EN' || language === 'RW') {
      setSmsLanguage(language);
    }
  }, [language]);

  const [isUSSDSimulatorOpen, setIsUSSDSimulatorOpen] = useState(false);
  const [ussdActiveBookingId, setUssdActiveBookingId] = useState<string>(bookings[0]?.id || '');
  const [ussdScreenText, setUssdScreenText] = useState<string>('');

  const [assignModalBooking, setAssignModalBooking] = useState<Booking | null>(null);
  const [selectedDriverToAssign, setSelectedDriverToAssign] = useState<string>('');
  const [assignmentNotice, setAssignmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [flightModalBooking, setFlightModalBooking] = useState<Booking | null>(null);
  const [delayMinutes, setDelayMinutes] = useState<number>(45);

  const groupedTrips = useMemo(() => {
    const filtered = bookings.filter((b) => {
      if (filterCategory !== 'All') {
        const veh = vehicles.find((v) => v.id === b.vehicle_id);
        if (veh?.category !== filterCategory) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const drv = drivers.find((d) => d.id === b.driver_id);
        const veh = vehicles.find((v) => v.id === b.vehicle_id);
        return (
          b.client_name.toLowerCase().includes(q) ||
          b.destination.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          Boolean(drv?.name.toLowerCase().includes(q)) ||
          Boolean(veh?.plate_number.toLowerCase().includes(q))
        );
      }
      return true;
    });

    const unassigned = filtered.filter(
      (b) => (!b.driver_id || b.driver_id === '') && b.status !== 'Cancelled' && b.status !== 'Completed'
    );
    const dispatched = filtered.filter(
      (b) =>
        b.driver_id &&
        (b.dispatch_status === 'Not Sent' || b.dispatch_status === 'Dispatched (SMS)') &&
        b.status !== 'Cancelled' &&
        b.status !== 'Completed'
    );
    const atTerminal = filtered.filter(
      (b) =>
        b.driver_id &&
        (b.dispatch_status === 'Acknowledged by Driver' || b.dispatch_status === 'Driver at Terminal') &&
        b.status !== 'Cancelled' &&
        b.status !== 'Completed'
    );
    const active = filtered.filter(
      (b) =>
        b.driver_id &&
        b.dispatch_status === 'Client Onboard' &&
        b.status !== 'Cancelled' &&
        b.status !== 'Completed'
    );
    const completed = filtered.filter((b) => b.status === 'Completed');

    const needsAction = [
      ...unassigned.map((b) => ({ booking: b, stage: 'unassigned' as const })),
      ...dispatched.map((b) => ({ booking: b, stage: 'dispatched' as const })),
      ...atTerminal.map((b) => ({ booking: b, stage: 'atTerminal' as const })),
    ];

    return { unassigned, dispatched, atTerminal, needsAction, active, completed };
  }, [bookings, drivers, vehicles, filterCategory, searchQuery]);

  const metrics = useMemo(() => {
    const totalActive = bookings.filter((b) => b.status !== 'Cancelled' && b.status !== 'Completed').length;
    const driversOnTrip = drivers.filter((d) => d.status === 'On Trip').length;
    const driversAvailable = drivers.filter((d) => d.status === 'Available').length;
    const unassignedCount = groupedTrips.unassigned.length;

    return { totalActive, driversOnTrip, driversAvailable, unassignedCount };
  }, [bookings, drivers, groupedTrips]);

  const handleTriggerSMS = (booking: Booking) => {
    setSelectedSMSBooking(booking);
    setSmsSendNotice(null);
  };

  const handleConfirmSendSMS = () => {
    if (!selectedSMSBooking) return;
    const res = onDispatchSMS(selectedSMSBooking.id, smsLanguage);
    if (res) {
      setSmsSendNotice('Text message sent to driver phone!');
      setTimeout(() => {
        setSelectedSMSBooking(null);
        setSmsSendNotice(null);
      }, 1400);
    }
  };

  const handleOpenAssignModal = (booking: Booking) => {
    setAssignModalBooking(booking);
    setSelectedDriverToAssign(booking.driver_id || '');
    setAssignmentNotice(null);
  };

  const handleConfirmAssignDriver = () => {
    if (!assignModalBooking) return;
    const res = onAssignDriver(assignModalBooking.id, selectedDriverToAssign);
    if (res.success) {
      setAssignmentNotice({ type: 'success', message: 'Driver saved to trip!' });
      setTimeout(() => {
        setAssignModalBooking(null);
        setAssignmentNotice(null);
      }, 1100);
    } else {
      setAssignmentNotice({ type: 'error', message: res.error || 'Could not pick driver.' });
    }
  };

  const handleAutoRedispatch = (booking: Booking) => {
    const candidate =
      drivers.find(
        (d) =>
          d.id !== booking.driver_id &&
          d.status === 'Available' &&
          !checkDriverCollision(d.id, booking.start_date, booking.end_date, bookings, booking.id).hasCollision
      ) || drivers.find((d) => d.id !== booking.driver_id);

    if (candidate) {
      const res = onAssignDriver(booking.id, candidate.id);
      if (res.success) {
        onDispatchSMS(booking.id, 'RW');
        setSmsSendNotice(`Switched trip #${booking.id} to ${candidate.name} (${candidate.phone}) and sent SMS.`);
        setTimeout(() => setSmsSendNotice(null), 4000);
      }
    }
  };

  const handleOpenUSSDForBooking = (bookingId: string) => {
    setUssdActiveBookingId(bookingId);
    const bk = bookings.find((b) => b.id === bookingId);
    const drv = bk ? drivers.find((d) => d.id === bk.driver_id) : null;
    const veh = bk ? vehicles.find((v) => v.id === bk.vehicle_id) : null;

    setUssdScreenText(
      `[KIGALI-FLEET *134#]\nMurakaza neza, ${drv?.name || 'Mushoferi'}!\nUrugendo: #${bk?.id.slice(-4)}\nImodoka: ${veh?.plate_number || 'N/A'}\nHitamo:\n1. Emeza Urugendo (Yes, I will drive)\n2. Nageze ku Kibuga (At Airport)\n3. Umukiriya Yinjiyemo (Guest in car)\n4. Rangiza Urugendo (Trip Done)`
    );
    setIsUSSDSimulatorOpen(true);
  };

  const handleSendUSSDCode = (option: string) => {
    if (!ussdActiveBookingId) return;
    const bk = bookings.find((b) => b.id === ussdActiveBookingId);

    if (option === '1') {
      onAdvanceCheckin(ussdActiveBookingId, 'Acknowledged by Driver');
      setUssdScreenText(
        `[KIGALI-FLEET]\n✓ Urugendo #${bk?.id.slice(-4)} rwemejwe neza.\nDriver confirmed this trip.\nMurakoze!`
      );
    } else if (option === '2') {
      onAdvanceCheckin(ussdActiveBookingId, 'Driver at Terminal');
      setUssdScreenText(
        `[KIGALI-FLEET]\n✓ Mugeze ku Kibuga cy'Indege (Kigali Airport).\nGuest notified that driver is waiting.`
      );
    } else if (option === '3') {
      onAdvanceCheckin(ussdActiveBookingId, 'Client Onboard');
      setUssdScreenText(
        `[KIGALI-FLEET]\n✓ Umukiriya ari mu modoka.\nGuest is inside the car. Safe trip!`
      );
    } else if (option === '4') {
      onCompleteTrip(ussdActiveBookingId);
      setUssdScreenText(
        `[KIGALI-FLEET]\n✓ Urugendo rurangiye.\nTrip finished. Car and driver are free again.`
      );
    }
  };

  const handleApplyFlightDelay = () => {
    if (!flightModalBooking) return;
    onUpdateFlightStatus(flightModalBooking.id, 'Delayed', delayMinutes);
    setFlightModalBooking(null);
  };

  const handleClearFlightDelay = () => {
    if (!flightModalBooking) return;
    onUpdateFlightStatus(flightModalBooking.id, 'On Time', 0);
    setFlightModalBooking(null);
  };

  return (
    <div className="space-y-6">
      {smsSendNotice && !selectedSMSBooking && (
        <div className="bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{smsSendNotice}</span>
        </div>
      )}

      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Send drivers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {groupedTrips.needsAction.length} booking{groupedTrips.needsAction.length === 1 ? '' : 's'} need action ·{' '}
            {metrics.driversAvailable} free drivers, {metrics.driversOnTrip} on trip
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUSSDSimulatorOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium accent-bg hover:opacity-95 shadow-xs"
        >
          <Phone className="w-4 h-4" />
          <span>{tr('Open Driver Phone (*134#)')}</span>
        </button>
      </div>

      {/* Main Dispatch Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        {/* Airport Summary + Search / Type Filter */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{tr('Kigali Airport')}:</span>{' '}
            RwandAir WB 402 · Ethiopian ET 807 · Qatar QR 1371 · KLM KL 535
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={tr('Search guest, driver, place, or plate...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none"
            >
              <option value="All">{tr('All Cars')}</option>
              <option value="LandCruiser">Land Cruiser 4x4</option>
              <option value="RAV4">RAV4</option>
              <option value="Coaster">Coaster Bus</option>
              <option value="Safari Van">Safari Van</option>
              <option value="Luxury Sedan">{tr('VIP Car')}</option>
            </select>
          </div>
        </div>

        {/* Section 1: Needs Action */}
        <div className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
          Needs action ({groupedTrips.needsAction.length})
        </div>

        {groupedTrips.needsAction.length === 0 ? (
          <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
            No trips waiting for dispatch action.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {groupedTrips.needsAction.map(({ booking: bk, stage }) => {
              const drv = drivers.find((d) => d.id === bk.driver_id);
              const veh = vehicles.find((v) => v.id === bk.vehicle_id);

              const statusDot =
                stage === 'unassigned'
                  ? 'bg-rose-500'
                  : stage === 'dispatched'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500';
              const statusBadge =
                stage === 'unassigned'
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                  : stage === 'dispatched'
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
              const statusLabel =
                stage === 'unassigned'
                  ? tr('No driver')
                  : stage === 'dispatched'
                  ? tr('Waiting for reply')
                  : tr('Driver at pickup');

              return (
                <div
                  key={bk.id}
                  className="px-5 py-4 grid grid-cols-1 lg:grid-cols-[175px_1.2fr_1.2fr_auto] gap-3 lg:gap-4 items-start text-sm hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${statusBadge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                      <span>{statusLabel}</span>
                    </span>
                    <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1.5">#{bk.id}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatHumanDate(bk.start_date)}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{bk.client_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{bk.destination}</div>
                    <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 tabular-nums">
                      {formatMoney(bk.total_rwf)}
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs">
                    {drv ? (
                      <div>
                        <span className="text-slate-900 dark:text-white font-semibold text-sm">{drv.name}</span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">({drv.language})</span>
                        <div className="font-mono text-slate-500 dark:text-slate-400">{drv.phone}</div>
                      </div>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400">No driver picked yet</div>
                    )}

                    <div className="text-slate-500 dark:text-slate-400">
                      {veh?.model_name || 'Car'}{' '}
                      {veh?.plate_number && (
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {veh.plate_number}
                        </span>
                      )}
                    </div>

                    {bk.flight_number && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => setFlightModalBooking(bk)}
                          className="text-xs font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <span>Flight {bk.flight_number}:</span>
                          {bk.flight_status === 'Delayed' ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              +{bk.flight_delay_minutes || 35}m late
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">on time</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    {stage === 'unassigned' && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(bk)}
                        className="px-3.5 py-2 rounded-lg text-xs font-medium accent-bg hover:opacity-95 whitespace-nowrap"
                      >
                        {tr('Pick Driver')}
                      </button>
                    )}

                    {stage === 'dispatched' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenUSSDForBooking(bk.id)}
                          className="text-xs font-medium accent-text hover:underline whitespace-nowrap"
                        >
                          Phone *134#
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoRedispatch(bk)}
                          className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline whitespace-nowrap"
                        >
                          Switch driver
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdvanceCheckin(bk.id, 'Acknowledged by Driver')}
                          className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline whitespace-nowrap"
                        >
                          Mark ready
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTriggerSMS(bk)}
                          className="px-3.5 py-2 rounded-lg text-xs font-medium accent-bg hover:opacity-95 whitespace-nowrap"
                        >
                          Send SMS again
                        </button>
                      </>
                    )}

                    {stage === 'atTerminal' && (
                      <>
                        {drv?.phone && (
                          <a
                            href={`tel:${drv.phone}`}
                            className="text-xs font-medium accent-text hover:underline whitespace-nowrap"
                          >
                            Call driver
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedTicketBooking(bk)}
                          className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline whitespace-nowrap"
                        >
                          Trip paper
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdvanceCheckin(bk.id, 'Client Onboard')}
                          className="px-3.5 py-2 rounded-lg text-xs font-medium accent-bg hover:opacity-95 whitespace-nowrap"
                        >
                          Guest is in the car
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section 2: On the Road */}
        {groupedTrips.active.length > 0 && (
          <>
            <div className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/40 border-y border-slate-200/80 dark:border-slate-800">
              On the road ({groupedTrips.active.length})
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {groupedTrips.active.map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);
                const veh = vehicles.find((v) => v.id === bk.vehicle_id);
                return (
                  <div
                    key={bk.id}
                    className="px-5 py-4 grid grid-cols-1 lg:grid-cols-[175px_1.2fr_1.2fr_auto] gap-3 lg:gap-4 items-start text-sm"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Driving now</span>
                      </span>
                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1.5">#{bk.id}</div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{bk.client_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{bk.destination}</div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{drv?.name || 'Driver'}</div>
                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {veh?.plate_number} · {veh?.model_name}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedTicketBooking(bk)}
                        className="text-xs font-medium accent-text hover:underline whitespace-nowrap"
                      >
                        Trip paper
                      </button>
                      <button
                        type="button"
                        onClick={() => onCompleteTrip(bk.id)}
                        className="px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                      >
                        Finish trip
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Section 3: Finished Today */}
        {groupedTrips.completed.length > 0 && (
          <>
            <div className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/40 border-y border-slate-200/80 dark:border-slate-800">
              Finished ({groupedTrips.completed.length})
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {groupedTrips.completed.slice(0, 8).map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);
                return (
                  <div
                    key={bk.id}
                    className="px-5 py-3.5 grid grid-cols-1 lg:grid-cols-[175px_1.2fr_1.2fr_auto] gap-3 lg:gap-4 items-center text-sm"
                  >
                    <div>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">#{bk.id}</span>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{bk.payment_status}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{bk.client_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{bk.destination}</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {drv?.name || 'Driver'} ·{' '}
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {formatMoney(bk.total_rwf)}
                      </span>
                    </div>
                    <div className="lg:text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTicketBooking(bk)}
                        className="text-xs font-medium accent-text hover:underline"
                      >
                        Print trip paper
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {(groupedTrips.active.length === 0 || groupedTrips.completed.length === 0) && (
          <div className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
            {groupedTrips.active.length === 0 && 'On the road: none. '}
            {groupedTrips.completed.length === 0 && 'Finished today: none.'}
          </div>
        )}
      </div>

      {/* Trip Paper Modal (Bon de Mission) */}
      {selectedTicketBooking && (
        <ModalShell
          isOpen={!!selectedTicketBooking}
          onClose={() => setSelectedTicketBooking(null)}
          maxWidthClass="max-w-2xl"
          printFullscreen
          title={tr('Trip Paper (Bon de Mission)')}
          subtitle={tr('For police road checks across Rwanda')}
          footer={
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 accent-bg hover:opacity-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{tr('Print Trip Paper')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTicketBooking(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {tr('Close')}
              </button>
            </div>
          }
        >
          <div
            id="printable-bon-de-mission"
            className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 print:border-none print:p-0 space-y-4 text-sm"
          >
            <div className="text-center border-b border-slate-200 pb-3">
              <div className="text-xs font-medium text-slate-500">Republic of Rwanda · City of Kigali</div>
              <h2 className="text-xl font-semibold text-slate-900 mt-0.5">
                {currentCompany?.name || 'KIGALI EXPEDITION TOURS & FLEET LTD'}
              </h2>
              <div className="text-xs text-slate-500 font-mono">TIN: 102938475 · MINITRANS/TR/2026/089</div>
              <div className="inline-block mt-2 px-3 py-1 bg-slate-900 text-white font-medium text-xs rounded-md">
                Official Trip Paper · Bon de Mission
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">1. Driver</h4>
                {(() => {
                  const drv = drivers.find((d) => d.id === selectedTicketBooking.driver_id);
                  return (
                    <div className="space-y-0.5 text-xs text-slate-700">
                      <div>Name: {drv?.name || 'Assigned driver'}</div>
                      <div className="font-mono">National ID: {drv?.national_id || '1 1990 8 0029384 1 20'}</div>
                      <div className="font-mono">License: {drv?.license_number || 'RW-B-2018-092'}</div>
                      <div className="font-mono">Phone: {drv?.phone || '+250 788 123 456'}</div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-1">2. Car</h4>
                {(() => {
                  const veh = vehicles.find((v) => v.id === selectedTicketBooking.vehicle_id);
                  return (
                    <div className="space-y-0.5 text-xs text-slate-700">
                      <div>Car: {veh?.model_name || 'Car'}</div>
                      <div>
                        Plate: <span className="font-mono font-semibold">{veh?.plate_number}</span>
                      </div>
                      <div>
                        Safety check: valid until {formatHumanDate(veh?.controle_technique_expiry || '2027-01-30')}
                      </div>
                      <div>Insurance: valid</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-1 border-b border-slate-200 pb-3">
              <h4 className="font-semibold text-slate-900">3. Guest and trip</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <div>Guest: {selectedTicketBooking.client_name}</div>
                <div className="font-mono">Phone: {selectedTicketBooking.client_phone}</div>
                <div>Dates: {formatHumanDateRange(selectedTicketBooking.start_date, selectedTicketBooking.end_date, { includeYear: true })}</div>
                <div>Route: {selectedTicketBooking.destination}</div>
              </div>
            </div>

            <div className="flex justify-between items-end pt-2">
              <div>
                <div className="text-xs text-slate-500">Manager</div>
                <div className="signature-line text-lg mt-2 border-b border-slate-400 pr-6">
                  {currentUser?.name || 'Office Desk'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Driver signature</div>
                <div className="mt-6 border-b border-slate-400 w-36" />
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Send SMS Modal */}
      {selectedSMSBooking && (
        <ModalShell
          isOpen={!!selectedSMSBooking}
          onClose={() => setSelectedSMSBooking(null)}
          maxWidthClass="max-w-lg"
          title={tr('Send SMS to Driver')}
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedSMSBooking(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {tr('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSendSMS}
                className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 accent-bg hover:opacity-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{tr('Send Text Now')}</span>
              </button>
            </div>
          }
        >
          {smsSendNotice && (
            <div className="bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{smsSendNotice}</span>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/40 p-3 rounded-lg text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">{tr('Language')}:</span>
            <div className="inline-flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setSmsLanguage('RW')}
                className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  smsLanguage === 'RW'
                    ? 'accent-bg'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Kinyarwanda
              </button>
              <button
                type="button"
                onClick={() => setSmsLanguage('EN')}
                className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  smsLanguage === 'EN'
                    ? 'accent-bg'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {(() => {
            const drv = drivers.find((d) => d.id === selectedSMSBooking.driver_id);
            const veh = vehicles.find((v) => v.id === selectedSMSBooking.vehicle_id);
            const smsData =
              drv && veh
                ? generateDriverSMS({
                    booking: selectedSMSBooking,
                    driver: drv,
                    vehicle: veh,
                    language: smsLanguage,
                  })
                : null;

            return (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('Sending to')}:{' '}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {drv?.name} ({drv?.phone})
                  </strong>
                </div>
                <div className="bg-slate-50/90 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 p-3.5 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {smsData?.messageText || tr('Making message...')}
                </div>
              </div>
            );
          })()}
        </ModalShell>
      )}

      {/* Driver Phone View (*134#) */}
      <ModalShell
        isOpen={isUSSDSimulatorOpen}
        onClose={() => setIsUSSDSimulatorOpen(false)}
        maxWidthClass="max-w-sm"
        title={tr('Driver Phone (*134#)')}
        subtitle={tr('Works on any small button phone with no internet. Driver dials *134#.')}
        footer={
          <button
            type="button"
            onClick={() => setIsUSSDSimulatorOpen(false)}
            className="w-full py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            {tr('Close')}
          </button>
        }
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block">{tr('Pick a Trip')}</label>
          <select
            value={ussdActiveBookingId}
            onChange={(e) => handleOpenUSSDForBooking(e.target.value)}
            className={inputCls}
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                #{b.id} · {b.client_name} ({b.destination})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 min-h-[140px] whitespace-pre-wrap leading-relaxed">
          {ussdScreenText || tr('Dialing *134#...')}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleSendUSSDCode('1')}
            className="p-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {tr('1. Accept Trip')}
          </button>
          <button
            type="button"
            onClick={() => handleSendUSSDCode('2')}
            className="p-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {tr('2. At Airport')}
          </button>
          <button
            type="button"
            onClick={() => handleSendUSSDCode('3')}
            className="p-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {tr('3. Guest in Car')}
          </button>
          <button
            type="button"
            onClick={() => handleSendUSSDCode('4')}
            className="p-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {tr('4. Trip Done')}
          </button>
        </div>
      </ModalShell>

      {/* Pick Driver Modal */}
      {assignModalBooking && (
        <ModalShell
          isOpen={!!assignModalBooking}
          onClose={() => setAssignModalBooking(null)}
          maxWidthClass="max-w-md"
          icon={<User className="w-5 h-5 accent-text" />}
          title={`${tr('Pick Driver')} #${assignModalBooking.id}`}
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAssignModalBooking(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {tr('Cancel')}
              </button>
              <button
                type="button"
                disabled={!selectedDriverToAssign}
                onClick={handleConfirmAssignDriver}
                className="px-5 py-2 disabled:opacity-40 rounded-lg text-sm font-medium accent-bg hover:opacity-95 cursor-pointer"
              >
                {tr('Save Driver')}
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

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50/90 dark:bg-slate-800/40 p-3.5 rounded-lg">
            <div>
              {tr('Guest')}: <strong className="font-semibold text-slate-900 dark:text-white">{assignModalBooking.client_name}</strong>
            </div>
            <div>
              {tr('Place')}: <strong className="font-semibold text-slate-900 dark:text-white">{assignModalBooking.destination}</strong>
            </div>
            <div>
              {tr('Dates')}:{' '}
              <strong className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatHumanDateRange(assignModalBooking.start_date, assignModalBooking.end_date)}
              </strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block">
              {tr('Choose a Free Driver')}
            </label>

            <select
              value={selectedDriverToAssign}
              onChange={(e) => setSelectedDriverToAssign(e.target.value)}
              className={inputCls}
            >
              <option value="">-- {tr('Choose Driver')} --</option>
              {drivers.map((drv) => {
                const collision = checkDriverCollision(
                  drv.id,
                  assignModalBooking.start_date,
                  assignModalBooking.end_date,
                  bookings,
                  assignModalBooking.id
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

      {/* Flight Delay Modal */}
      {flightModalBooking && (
        <ModalShell
          isOpen={!!flightModalBooking}
          onClose={() => setFlightModalBooking(null)}
          maxWidthClass="max-w-md"
          icon={<Plane className="w-5 h-5 accent-text" />}
          title={tr('Flight Late?')}
          footer={
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClearFlightDelay}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {tr('On Time Again')}
              </button>
              <button
                type="button"
                onClick={handleApplyFlightDelay}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium cursor-pointer"
              >
                {tr('Tell Driver')} (+{delayMinutes}m)
              </button>
            </div>
          }
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tr('Flight')} <strong className="text-slate-900 dark:text-white">{flightModalBooking.flight_number}</strong> —{' '}
            {tr('Tell the driver the new wait time at Kigali Airport.')}
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block">{tr('How Many Minutes Late?')}</label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDelayMinutes(m)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    delayMinutes === m
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  +{m}m
                </button>
              ))}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};
