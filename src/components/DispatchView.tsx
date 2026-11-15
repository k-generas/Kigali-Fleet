import React, { useState, useMemo } from 'react';
import { Booking, Driver, Vehicle, BookingStatus } from '../types';
import {
  formatRwf,
  generateDriverSMS,
  checkDriverCollision,
} from '../utils/collision';
import {
  Radio,
  Send,
  Phone,
  Plane,
  User,
  CheckCircle,
  AlertTriangle,
  FileText,
  Printer,
  Search,
  ShieldCheck,
  X,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { ColorTheme } from '../theme';

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

export const DispatchView: React.FC<DispatchViewProps> = ({
  bookings,
  drivers,
  vehicles,
  currentTheme,
  currentUser,
  currentCompany,
  onDispatchSMS,
  onAdvanceCheckin,
  onUpdateFlightStatus,
  onAssignDriver,
  onCompleteTrip,
}) => {
  const activeThemeColor = currentTheme?.hex || '#635bff';
  const activeBtnText = currentTheme?.btnText || 'text-white';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const [selectedTicketBooking, setSelectedTicketBooking] = useState<Booking | null>(null);
  const [selectedSMSBooking, setSelectedSMSBooking] = useState<Booking | null>(null);
  const [smsLanguage, setSmsLanguage] = useState<'RW' | 'EN'>('RW');
  const [smsSendNotice, setSmsSendNotice] = useState<string | null>(null);
  const [isUSSDSimulatorOpen, setIsUSSDSimulatorOpen] = useState(false);
  const [ussdActiveBookingId, setUssdActiveBookingId] = useState<string>(bookings[0]?.id || '');
  const [ussdScreenText, setUssdScreenText] = useState<string>('');

  const [assignModalBooking, setAssignModalBooking] = useState<Booking | null>(null);
  const [selectedDriverToAssign, setSelectedDriverToAssign] = useState<string>('');
  const [assignmentNotice, setAssignmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [flightModalBooking, setFlightModalBooking] = useState<Booking | null>(null);
  const [delayMinutes, setDelayMinutes] = useState<number>(45);

  const kanbanColumns = useMemo(() => {
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

    return { unassigned, dispatched, atTerminal, active, completed };
  }, [bookings, drivers, vehicles, filterCategory, searchQuery]);

  const metrics = useMemo(() => {
    const totalActive = bookings.filter((b) => b.status !== 'Cancelled' && b.status !== 'Completed').length;
    const driversOnTrip = drivers.filter((d) => d.status === 'On Trip').length;
    const driversAvailable = drivers.filter((d) => d.status === 'Available').length;
    const unassignedCount = kanbanColumns.unassigned.length;

    return { totalActive, driversOnTrip, driversAvailable, unassignedCount };
  }, [bookings, drivers, kanbanColumns]);

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
      {/* Top Banner */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0a2540] dark:text-white tracking-tight">
              Driver Trips & Live Updates
            </h1>
            <p className="text-base text-[#425466] dark:text-slate-300 mt-1 max-w-2xl">
              Follow every trip from start to finish, text drivers on any phone, and print trip papers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
              <span className="text-xs font-semibold text-[#425466] dark:text-slate-400 block">Active Trips</span>
              <span className="text-lg font-extrabold text-[#0a2540] dark:text-white">{metrics.totalActive}</span>
            </div>

            <div className="bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
              <span className="text-xs font-semibold text-[#425466] dark:text-slate-400 block">Drivers</span>
              <div className="flex items-center gap-2 text-sm font-bold mt-0.5">
                <span className="text-emerald-600 dark:text-emerald-400">{metrics.driversAvailable} Free</span>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-amber-600 dark:text-amber-400">{metrics.driversOnTrip} Driving</span>
              </div>
            </div>

            {metrics.unassignedCount > 0 ? (
              <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700 rounded-xl px-4 py-2.5">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 block">Needs Driver</span>
                <span className="text-lg font-extrabold text-rose-700 dark:text-rose-300">
                  {metrics.unassignedCount} Trips
                </span>
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 rounded-xl px-4 py-2.5 text-emerald-700 dark:text-emerald-300">
                <span className="text-xs font-semibold block">Drivers</span>
                <span className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-4 h-4" /> All Covered
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Airport & Phone Bar */}
        <div className="bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-bold text-[#0a2540] dark:text-slate-200">Kigali Airport Flights:</span>
            <span className="text-[#425466] dark:text-slate-400 hidden sm:inline">
              RwandAir WB402, Ethiopian ET807, Qatar QR1371, KLM KL535
            </span>
          </div>

          <button
            onClick={() => setIsUSSDSimulatorOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-sm transition-opacity hover:opacity-95 ${activeBtnText}`}
            style={{ backgroundColor: activeThemeColor }}
          >
            <Phone className="w-4 h-4" />
            <span>Open Driver Phone (*134#)</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full md:flex-1 md:max-w-md min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guest, driver, place, or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm text-[#0a2540] dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#425466] dark:text-slate-400 font-semibold">Car Type:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 font-semibold"
            >
              <option value="All">All Cars</option>
              <option value="LandCruiser">Land Cruiser 4x4</option>
              <option value="RAV4">RAV4</option>
              <option value="Coaster">Coaster Bus</option>
              <option value="Safari Van">Safari Van</option>
              <option value="Luxury Sedan">VIP Car</option>
            </select>
          </div>
        </div>
      </div>

      {smsSendNotice && !selectedSMSBooking && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{smsSendNotice}</span>
        </div>
      )}

      {/* 5-Step Trip Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-start">
        {/* Step 1: Needs Driver */}
        <div className="bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 min-h-[420px] min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <h3 className="text-sm font-bold text-[#0a2540] dark:text-white">
                1. Needs Driver ({kanbanColumns.unassigned.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {kanbanColumns.unassigned.length === 0 ? (
              <div className="text-center py-10 text-[#425466] dark:text-slate-400 text-sm">
                <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-emerald-500" />
                Every trip has a driver!
              </div>
            ) : (
              kanbanColumns.unassigned.map((bk) => {
                const veh = vehicles.find((v) => v.id === bk.vehicle_id);
                return (
                  <div
                    key={bk.id}
                    className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs text-[#425466] dark:text-slate-400 font-bold">#{bk.id}</span>
                      <span className="text-xs bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-full font-bold">
                        No Driver
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-[#0a2540] dark:text-white">{bk.client_name}</div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{bk.destination}</span>
                      </div>
                    </div>

                    <div className="text-xs text-[#425466] dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-mono">{bk.start_date}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatRwf(bk.total_rwf)}
                      </span>
                    </div>

                    <div className="bg-[#f6f9fc] dark:bg-slate-800/70 p-2.5 rounded-lg text-xs">
                      <span className="font-bold text-[#0a2540] dark:text-white truncate block">
                        {veh?.model_name || 'Car'}
                      </span>
                      <span className="font-mono text-[#425466] dark:text-amber-300 font-semibold">
                        {veh?.plate_number}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenAssignModal(bk)}
                      className={`w-full py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs ${activeBtnText}`}
                      style={{ backgroundColor: activeThemeColor }}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Pick Driver</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 2: Text Sent */}
        <div className="bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 min-h-[420px] min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
              <h3 className="text-sm font-bold text-[#0a2540] dark:text-white truncate">
                2. Text Sent ({kanbanColumns.dispatched.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {kanbanColumns.dispatched.length === 0 ? (
              <div className="text-center py-10 text-[#425466] dark:text-slate-400 text-sm">
                No drivers waiting to reply.
              </div>
            ) : (
              kanbanColumns.dispatched.map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);
                return (
                  <div
                    key={bk.id}
                    className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2.5 min-w-0"
                  >
                    <div className="flex items-start justify-between gap-1.5 min-w-0">
                      <span className="font-mono text-xs text-[#425466] dark:text-slate-400 font-bold truncate">#{bk.id}</span>
                      <span className="text-xs bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0">
                        Waiting Reply
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#0a2540] dark:text-white truncate">{bk.client_name}</div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 truncate">{bk.destination}</div>
                    </div>

                    <div className="bg-[#f6f9fc] dark:bg-slate-800/70 p-2.5 rounded-lg text-xs space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[#425466] dark:text-slate-400">Driver:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{drv?.language}</span>
                      </div>
                      <div className="font-bold text-[#0a2540] dark:text-white text-sm truncate">{drv?.name}</div>
                      <div className="text-[#425466] dark:text-slate-400 font-mono truncate">{drv?.phone}</div>
                    </div>

                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => handleTriggerSMS(bk)}
                        className="py-2 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full text-xs font-bold flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Send SMS</span>
                      </button>

                      <button
                        onClick={() => handleOpenUSSDForBooking(bk.id)}
                        className="py-2 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <Radio className="w-3.5 h-3.5 shrink-0" />
                        <span>Phone *134#</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => onAdvanceCheckin(bk.id, 'Acknowledged by Driver')}
                        className="text-[#425466] dark:text-slate-300 hover:underline font-semibold"
                      >
                        Mark Ready
                      </button>

                      <button
                        onClick={() => handleAutoRedispatch(bk)}
                        className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Switch Driver</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 3: Driver Waiting */}
        <div className="bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 min-h-[460px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h3 className="text-sm font-bold text-[#0a2540] dark:text-white">
                3. Driver Waiting ({kanbanColumns.atTerminal.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {kanbanColumns.atTerminal.length === 0 ? (
              <div className="text-center py-10 text-[#425466] dark:text-slate-400 text-sm">
                No drivers waiting at pickup.
              </div>
            ) : (
              kanbanColumns.atTerminal.map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);
                const veh = vehicles.find((v) => v.id === bk.vehicle_id);

                return (
                  <div
                    key={bk.id}
                    className="stripe-card bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600/40 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs text-[#425466] dark:text-slate-400 font-bold">#{bk.id}</span>
                      <span className="text-xs bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                        At Pickup
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-[#0a2540] dark:text-white">{bk.client_name}</div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 truncate">{bk.destination}</div>
                    </div>

                    {bk.flight_number && (
                      <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-2 rounded-lg text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold">
                          <Plane className="w-3.5 h-3.5" />
                          <span className="font-mono">{bk.flight_number}</span>
                        </div>
                        <button
                          onClick={() => setFlightModalBooking(bk)}
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            bk.flight_status === 'Delayed'
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {bk.flight_status === 'Delayed' ? `Late +${bk.flight_delay_minutes}m` : 'On Time'}
                        </button>
                      </div>
                    )}

                    <div className="text-xs flex items-center justify-between bg-[#f6f9fc] dark:bg-slate-800/70 p-2.5 rounded-lg">
                      <div className="truncate">
                        <span className="font-bold text-[#0a2540] dark:text-white block text-sm">{drv?.name}</span>
                        <span className="text-[#425466] dark:text-slate-400 font-mono">{veh?.plate_number}</span>
                      </div>
                      <a
                        href={`tel:${drv?.phone}`}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-emerald-600 dark:text-emerald-400"
                        title="Call Driver"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <button
                      onClick={() => onAdvanceCheckin(bk.id, 'Client Onboard')}
                      className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Guest Is Inside Car</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 4: On the Road */}
        <div className="bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 min-h-[420px] min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
              <h3 className="text-sm font-bold text-[#0a2540] dark:text-white truncate">
                4. On the Road ({kanbanColumns.active.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {kanbanColumns.active.length === 0 ? (
              <div className="text-center py-10 text-[#425466] dark:text-slate-400 text-sm">
                No cars on the road right now.
              </div>
            ) : (
              kanbanColumns.active.map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);
                const veh = vehicles.find((v) => v.id === bk.vehicle_id);

                return (
                  <div
                    key={bk.id}
                    className="stripe-card bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-600/40 rounded-xl p-3 space-y-2.5 min-w-0"
                  >
                    <div className="flex items-start justify-between gap-1.5 min-w-0">
                      <span className="font-mono text-xs text-[#425466] dark:text-slate-400 font-bold truncate">#{bk.id}</span>
                      <span className="text-xs bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0">
                        Driving Now
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#0a2540] dark:text-white truncate">{bk.client_name}</div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1 mt-0.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{bk.destination}</span>
                      </div>
                    </div>

                    <div className="bg-[#f6f9fc] dark:bg-slate-800/70 p-2.5 rounded-lg text-xs space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[#425466] dark:text-slate-400">Car:</span>
                        <span className="font-mono text-[#0a2540] dark:text-amber-300 font-bold whitespace-nowrap">{veh?.plate_number}</span>
                      </div>
                      <div className="font-bold text-[#0a2540] dark:text-white text-sm truncate">{drv?.name}</div>
                    </div>

                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => setSelectedTicketBooking(bk)}
                        className="py-2 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full text-xs font-bold flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Trip Paper</span>
                      </button>

                      <button
                        onClick={() => onCompleteTrip(bk.id)}
                        className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center justify-center gap-1 shadow-xs whitespace-nowrap"
                      >
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Finish Trip</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 5: Trip Done */}
        <div className="bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 min-h-[420px] min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0"></div>
              <h3 className="text-sm font-bold text-[#0a2540] dark:text-white truncate">
                5. Trip Done ({kanbanColumns.completed.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {kanbanColumns.completed.length === 0 ? (
              <div className="text-center py-10 text-[#425466] dark:text-slate-400 text-sm">
                No finished trips yet.
              </div>
            ) : (
              kanbanColumns.completed.slice(0, 8).map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);

                return (
                  <div
                    key={bk.id}
                    className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs text-[#425466] dark:text-slate-400">#{bk.id}</span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300 px-2.5 py-0.5 rounded-full font-semibold">
                        {bk.payment_status}
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-[#0a2540] dark:text-white">{bk.client_name}</div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 truncate">{bk.destination}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-[#425466] dark:text-slate-400">
                      <span>{drv?.name.split(' ')[0] || 'Driver'}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatRwf(bk.total_rwf)}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedTicketBooking(bk)}
                      className="w-full py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Print Trip Paper</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Trip Paper Modal */}
      {selectedTicketBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Trip Paper (Bon de Mission)</h3>
                  <span className="text-xs text-[#425466] dark:text-slate-400">
                    For police road checks across Rwanda
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketBooking(null)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-bon-de-mission" className="bg-white text-slate-950 p-6 rounded-xl border border-slate-300 space-y-4 font-sans text-sm">
              <div className="text-center border-b border-slate-300 pb-3">
                <div className="text-xs uppercase tracking-wider text-slate-600 font-bold">
                  REPUBLIC OF RWANDA · CITY OF KIGALI
                </div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 mt-0.5">
                  {currentCompany?.name || 'KIGALI EXPEDITION TOURS & FLEET LTD'}
                </h2>
                <div className="text-xs text-slate-600">TIN: 102938475 · MINITRANS/TR/2026/089</div>
                <div className="inline-block mt-2 px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase rounded">
                  OFFICIAL TRIP PAPER · BON DE MISSION
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-300 pb-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase mb-1">1. Driver</h4>
                  {(() => {
                    const drv = drivers.find((d) => d.id === selectedTicketBooking.driver_id);
                    return (
                      <div className="space-y-0.5">
                        <div><strong>Name:</strong> {drv?.name || 'Assigned Driver'}</div>
                        <div><strong>National ID:</strong> {drv?.national_id || '1 1990 8 0029384 1 20'}</div>
                        <div><strong>License:</strong> {drv?.license_number || 'RW-B-2018-092'}</div>
                        <div><strong>Phone:</strong> {drv?.phone || '+250 788 123 456'}</div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase mb-1">2. Car</h4>
                  {(() => {
                    const veh = vehicles.find((v) => v.id === selectedTicketBooking.vehicle_id);
                    return (
                      <div className="space-y-0.5">
                        <div><strong>Car:</strong> {veh?.model_name || 'Vehicle'}</div>
                        <div>
                          <strong>Plate:</strong>{' '}
                          <span className="font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded">{veh?.plate_number}</span>
                        </div>
                        <div><strong>Safety Check:</strong> Valid until {veh?.controle_technique_expiry || '2027-01-30'}</div>
                        <div><strong>Insurance:</strong> Valid</div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-1.5 border-b border-slate-300 pb-3 text-xs">
                <h4 className="font-bold text-slate-900 uppercase">3. Guest & Trip</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><strong>Guest:</strong> {selectedTicketBooking.client_name}</div>
                  <div><strong>Phone:</strong> {selectedTicketBooking.client_phone}</div>
                  <div><strong>Dates:</strong> {selectedTicketBooking.start_date} to {selectedTicketBooking.end_date}</div>
                  <div><strong>Place:</strong> {selectedTicketBooking.destination}</div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-2 text-xs">
                <div>
                  <div className="text-slate-500">Manager:</div>
                  <div className="font-bold mt-4 border-t border-slate-400 pt-0.5">
                    {currentUser?.name || 'Office Desk'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500">Driver Signature:</div>
                  <div className="font-bold mt-4 border-t border-slate-400 pt-0.5">__________________</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                <Printer className="w-4 h-4" />
                <span>Print Trip Paper</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTicketBooking(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send SMS Modal */}
      {selectedSMSBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Send SMS to Driver</h3>
              </div>
              <button
                onClick={() => setSelectedSMSBooking(null)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {smsSendNotice && (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{smsSendNotice}</span>
              </div>
            )}

            <div className="flex items-center justify-between bg-[#f6f9fc] dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
              <span className="text-[#425466] dark:text-slate-300 font-semibold">Language:</span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSmsLanguage('RW')}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                    smsLanguage === 'RW' ? 'bg-emerald-600 text-white' : 'text-[#425466] dark:text-slate-400'
                  }`}
                >
                  Kinyarwanda
                </button>
                <button
                  type="button"
                  onClick={() => setSmsLanguage('EN')}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                    smsLanguage === 'EN' ? 'bg-blue-600 text-white' : 'text-[#425466] dark:text-slate-400'
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
                      driver: drv,
                      vehicle: veh,
                      booking: selectedSMSBooking,
                      language: smsLanguage,
                    })
                  : null;

              return (
                <div className="space-y-2">
                  <div className="text-sm text-[#425466] dark:text-slate-300">
                    Sending to: <strong className="text-[#0a2540] dark:text-white">{drv?.name} ({drv?.phone})</strong>
                  </div>
                  <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl font-mono text-xs text-[#0a2540] dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {smsData?.messageText || 'Making message...'}
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSMSBooking(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-300 rounded-full text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendSMS}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Send Text Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Phone View (*134#) */}
      {isUSSDSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Driver Phone (*134#)</h3>
              </div>
              <button
                onClick={() => setIsUSSDSimulatorOpen(false)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#425466] dark:text-slate-300">
              Works on any small button phone with no internet. Driver dials <strong>*134#</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-[#425466] dark:text-slate-400 font-semibold block">Pick a Trip:</label>
              <select
                value={ussdActiveBookingId}
                onChange={(e) => handleOpenUSSDForBooking(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-2.5 text-sm"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} · {b.client_name} ({b.destination})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-emerald-950 border-2 border-emerald-600 rounded-2xl p-4 font-mono text-xs text-emerald-200 min-h-[150px] whitespace-pre-wrap leading-relaxed">
              {ussdScreenText || 'Dialing *134#...'}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                onClick={() => handleSendUSSDCode('1')}
                className="p-2.5 bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700"
              >
                1. Accept Trip
              </button>
              <button
                onClick={() => handleSendUSSDCode('2')}
                className="p-2.5 bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700"
              >
                2. At Airport
              </button>
              <button
                onClick={() => handleSendUSSDCode('3')}
                className="p-2.5 bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700"
              >
                3. Guest in Car
              </button>
              <button
                onClick={() => handleSendUSSDCode('4')}
                className="p-2.5 bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700"
              >
                4. Trip Done
              </button>
            </div>

            <button
              onClick={() => setIsUSSDSimulatorOpen(false)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-300 rounded-full text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Pick Driver Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  Pick Driver for #{assignModalBooking.id}
                </h3>
              </div>
              <button
                onClick={() => setAssignModalBooking(null)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignmentNotice && (
              <div
                className={`p-3 rounded-xl text-sm font-medium ${
                  assignmentNotice.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                }`}
              >
                {assignmentNotice.message}
              </div>
            )}

            <div className="text-sm text-[#425466] dark:text-slate-300 space-y-1 bg-[#f6f9fc] dark:bg-slate-800/70 p-3.5 rounded-xl">
              <div>Guest: <strong className="text-[#0a2540] dark:text-white">{assignModalBooking.client_name}</strong></div>
              <div>Place: <strong className="text-[#0a2540] dark:text-white">{assignModalBooking.destination}</strong></div>
              <div>Dates: <strong className="text-emerald-600 dark:text-emerald-400">{assignModalBooking.start_date} → {assignModalBooking.end_date}</strong></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#0a2540] dark:text-slate-200 block">
                Choose a Free Driver
              </label>

              <select
                value={selectedDriverToAssign}
                onChange={(e) => setSelectedDriverToAssign(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Driver --</option>
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
                        ? ` [Busy: ${collision.conflictingBooking?.client_name || 'Booked'}]`
                        : ' [Free]'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssignModalBooking(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-300 rounded-full text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedDriverToAssign}
                onClick={handleConfirmAssignDriver}
                className={`px-5 py-2.5 disabled:opacity-40 rounded-full text-sm font-bold shadow-sm ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                Save Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flight Delay Modal */}
      {flightModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Flight Late?</h3>
              </div>
              <button
                onClick={() => setFlightModalBooking(null)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#425466] dark:text-slate-300">
              Flight <strong>{flightModalBooking.flight_number}</strong> is arriving late at Kigali Airport. Tell the driver the new wait time.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0a2540] dark:text-slate-200 block">How Many Minutes Late?</label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDelayMinutes(m)}
                    className={`py-2.5 rounded-full text-sm font-bold border transition-all ${
                      delayMinutes === m
                        ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                        : 'bg-[#f6f9fc] dark:bg-slate-800 text-[#0a2540] dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    +{m}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClearFlightDelay}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-300 rounded-full text-sm font-semibold"
              >
                On Time Again
              </button>
              <button
                type="button"
                onClick={handleApplyFlightDelay}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-sm font-bold shadow-sm"
              >
                Tell Driver (+{delayMinutes}m)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
