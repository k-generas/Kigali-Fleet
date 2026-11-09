import React, { useState, useMemo } from 'react';
import { Booking, Driver, Vehicle, DispatchStatus, BookingStatus } from '../types';
import {
  formatRwf,
  calculateDays,
  generateDriverSMS,
  generateFlightDelaySMS,
  checkDriverCollision,
} from '../utils/collision';
import {
  Radio,
  Send,
  Phone,
  Plane,
  Clock,
  User,
  Car,
  CheckCircle,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  X,
  MessageSquare,
  ArrowRight,
  Hash,
  ExternalLink,
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
  onUpdateBookingStatus,
}) => {
  const activeThemeColor = currentTheme?.hex || '#3b82f6';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // Modals state
  const [selectedTicketBooking, setSelectedTicketBooking] = useState<Booking | null>(null);
  const [selectedSMSBooking, setSelectedSMSBooking] = useState<Booking | null>(null);
  const [smsLanguage, setSmsLanguage] = useState<'RW' | 'EN'>('RW');
  const [smsSendNotice, setSmsSendNotice] = useState<string | null>(null);
  const [isUSSDSimulatorOpen, setIsUSSDSimulatorOpen] = useState(false);
  const [ussdActiveBookingId, setUssdActiveBookingId] = useState<string>(bookings[0]?.id || '');
  const [ussdScreenText, setUssdScreenText] = useState<string>('');
  const [ussdInput, setUssdInput] = useState<string>('');
  
  // Quick Chauffeur Assignment modal
  const [assignModalBooking, setAssignModalBooking] = useState<Booking | null>(null);
  const [selectedDriverToAssign, setSelectedDriverToAssign] = useState<string>('');
  const [assignmentNotice, setAssignmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Flight Delay Modal
  const [flightModalBooking, setFlightModalBooking] = useState<Booking | null>(null);
  const [delayMinutes, setDelayMinutes] = useState<number>(45);

  // Group bookings into the 5 Kanban stages
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
        const matchClient = b.client_name.toLowerCase().includes(q);
        const matchDest = b.destination.toLowerCase().includes(q);
        const matchId = b.id.toLowerCase().includes(q);
        const matchDriver = drv?.name.toLowerCase().includes(q);
        const matchPlate = veh?.plate_number.toLowerCase().includes(q);
        return matchClient || matchDest || matchId || matchDriver || matchPlate;
      }
      return true;
    });

    // 1. Unassigned / Needs Chauffeur
    const unassigned = filtered.filter(
      (b) => (!b.driver_id || b.driver_id === '') && b.status !== 'Cancelled' && b.status !== 'Completed'
    );

    // 2. Dispatched / Awaiting Chauffeur Acknowledgment
    const dispatched = filtered.filter(
      (b) =>
        b.driver_id &&
        (b.dispatch_status === 'Not Sent' || b.dispatch_status === 'Dispatched (SMS)') &&
        b.status !== 'Cancelled' &&
        b.status !== 'Completed'
    );

    // 3. Chauffeur Acknowledged / At Terminal
    const atTerminal = filtered.filter(
      (b) =>
        b.driver_id &&
        (b.dispatch_status === 'Acknowledged by Driver' || b.dispatch_status === 'Driver at Terminal') &&
        b.status !== 'Cancelled' &&
        b.status !== 'Completed'
    );

    // 4. Client Onboard / Active Trip
    const active = filtered.filter(
      (b) =>
        b.driver_id &&
        b.dispatch_status === 'Client Onboard' &&
        b.status !== 'Cancelled' &&
        b.status !== 'Completed'
    );

    // 5. Completed Missions Today
    const completed = filtered.filter((b) => b.status === 'Completed');

    return {
      unassigned,
      dispatched,
      atTerminal,
      active,
      completed,
    };
  }, [bookings, drivers, vehicles, filterCategory, searchQuery]);

  // Operational metrics
  const metrics = useMemo(() => {
    const totalActive = bookings.filter((b) => b.status !== 'Cancelled' && b.status !== 'Completed').length;
    const driversOnTrip = drivers.filter((d) => d.status === 'On Trip').length;
    const driversAvailable = drivers.filter((d) => d.status === 'Available').length;
    const unassignedCount = kanbanColumns.unassigned.length;
    const flightBookingsCount = bookings.filter((b) => b.flight_number && b.status !== 'Cancelled').length;

    return {
      totalActive,
      driversOnTrip,
      driversAvailable,
      unassignedCount,
      flightBookingsCount,
    };
  }, [bookings, drivers, kanbanColumns]);

  // Handle Send SMS
  const handleTriggerSMS = (booking: Booking) => {
    setSelectedSMSBooking(booking);
    setSmsSendNotice(null);
  };

  const handleConfirmSendSMS = () => {
    if (!selectedSMSBooking) return;
    const res = onDispatchSMS(selectedSMSBooking.id, smsLanguage);
    if (res) {
      setSmsSendNotice(`SMS successfully dispatched to chauffeur via Africa's Talking gateway!`);
      setTimeout(() => {
        setSelectedSMSBooking(null);
        setSmsSendNotice(null);
      }, 1500);
    }
  };

  // Handle Assign Driver
  const handleOpenAssignModal = (booking: Booking) => {
    setAssignModalBooking(booking);
    setSelectedDriverToAssign(booking.driver_id || '');
    setAssignmentNotice(null);
  };

  const handleConfirmAssignDriver = () => {
    if (!assignModalBooking) return;
    const res = onAssignDriver(assignModalBooking.id, selectedDriverToAssign);
    if (res.success) {
      setAssignmentNotice({ type: 'success', message: 'Chauffeur successfully assigned!' });
      setTimeout(() => {
        setAssignModalBooking(null);
        setAssignmentNotice(null);
      }, 1200);
    } else {
      setAssignmentNotice({ type: 'error', message: res.error || 'Failed to assign driver.' });
    }
  };

  // Auto-Escalate & Re-dispatch if chauffeur declines or fails to acknowledge (Blueprint Part 9, Item 8)
  const handleAutoRedispatch = (booking: Booking) => {
    const candidate = drivers.find(
      (d) =>
        d.id !== booking.driver_id &&
        d.status === 'Available' &&
        !checkDriverCollision(d.id, booking.start_date, booking.end_date, bookings, booking.id).hasCollision
    ) || drivers.find((d) => d.id !== booking.driver_id);

    if (candidate) {
      const res = onAssignDriver(booking.id, candidate.id);
      if (res.success) {
        onDispatchSMS(booking.id, 'RW');
        setSmsSendNotice(`Escalation triggered: Reassigned Trip #${booking.id} to ${candidate.name} (${candidate.phone}) with instant Africa's Talking SMS dispatch.`);
        setTimeout(() => setSmsSendNotice(null), 4000);
      }
    }
  };

  // Launch USSD interactive console for a booking
  const handleOpenUSSDForBooking = (bookingId: string) => {
    setUssdActiveBookingId(bookingId);
    const bk = bookings.find((b) => b.id === bookingId);
    const drv = bk ? drivers.find((d) => d.id === bk.driver_id) : null;
    const veh = bk ? vehicles.find((v) => v.id === bk.vehicle_id) : null;

    setUssdScreenText(
      `[KIGALI-FLEET *134#]\nMurakaza neza, ${drv?.name || 'Mushoferi'}!\nUrugendo: #${bk?.id.slice(-4)}\nImodoka: ${veh?.plate_number || 'N/A'}\nHitamo:\n1. Emeza Urugendo (Acknowledge)\n2. Nageze ku Kibuga (At KIA)\n3. Umukiriya Yinjiyemo (Onboard)\n4. Rangiza Urugendo (Complete)`
    );
    setIsUSSDSimulatorOpen(true);
  };

  const handleSendUSSDCode = (option: string) => {
    if (!ussdActiveBookingId) return;
    const bk = bookings.find((b) => b.id === ussdActiveBookingId);

    if (option === '1') {
      onAdvanceCheckin(ussdActiveBookingId, 'Acknowledged by Driver');
      setUssdScreenText(
        `[USSD KIGALI-FLEET]\n✓ Urugendo #${bk?.id.slice(-4)} rwemejwe neza.\nChauffeur confirmed mission.\nMurakoze!`
      );
    } else if (option === '2') {
      onAdvanceCheckin(ussdActiveBookingId, 'Driver at Terminal');
      setUssdScreenText(
        `[USSD KIGALI-FLEET]\n✓ Mugeze ku Kibuga cy'Indege (KIA Terminal).\nUmukiriya yamenyeshejwe ko mwagezeyo.`
      );
    } else if (option === '3') {
      onAdvanceCheckin(ussdActiveBookingId, 'Client Onboard');
      setUssdScreenText(
        `[USSD KIGALI-FLEET]\n✓ Umukiriya ari mu modoka.\nUrugendo rutangiye neza!\nUrugendo rwiza!`
      );
    } else if (option === '4') {
      onCompleteTrip(ussdActiveBookingId);
      setUssdScreenText(
        `[USSD KIGALI-FLEET]\n✓ Urugendo rurangiye.\nImodoka n'umwirondoro byongeye kuboneka muri sisitemu.\nMurakoze cyane!`
      );
    } else {
      setUssdScreenText(`[USSD]\nHitamo ritari ryo. Kanda 1, 2, 3 cyangwa 4.`);
    }
    setUssdInput('');
  };

  // Trigger flight delay update
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
      {/* Top Banner: Dispatch Telemetry & Africa's Talking Gateway Status */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                Africa's Talking Rwanda SMS / USSD Hub (*134#)
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
              <span>Chauffeur Dispatch & Fleet Operations Control</span>
              <Sparkles className="w-5 h-5 text-blue-400" />
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Real-time multi-stage mission tracking across Kigali, airport arrivals at KIA, 2G SMS driver dispatch, zero-data USSD check-ins, and official Rwanda Bon de Mission generator.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Active Missions</span>
              <span className="text-base font-extrabold text-white">{metrics.totalActive}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Chauffeurs</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-emerald-400 font-bold">{metrics.driversAvailable} Available</span>
                <span className="text-slate-600">/</span>
                <span className="text-amber-400 font-bold">{metrics.driversOnTrip} on Trip</span>
              </div>
            </div>

            {metrics.unassignedCount > 0 ? (
              <div className="bg-rose-950/60 border border-rose-600/70 rounded-xl px-3.5 py-2 text-rose-200 animate-pulse">
                <span className="text-rose-400 block text-[10px] uppercase font-mono font-bold">Unassigned Trips</span>
                <span className="text-base font-extrabold text-rose-300">{metrics.unassignedCount} Needs Driver!</span>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-xl px-3.5 py-2 text-emerald-300">
                <span className="text-emerald-400 block text-[10px] uppercase font-mono font-bold">Driver Guard</span>
                <span className="text-xs font-bold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Assigned
                </span>
              </div>
            )}
          </div>
        </div>

        {/* KIA Flight Radar Widget */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-slate-200">Kigali International Airport (KIA) Radar:</span>
            <span className="text-slate-400 hidden sm:inline">
              RwandAir WB402, Ethiopian ET807, Qatar QR1371, KLM KL535
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUSSDSimulatorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Open USSD Chauffeur Phone (*134#)</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search booking #, client, driver, plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="LandCruiser">Land Cruiser 4x4</option>
              <option value="RAV4">RAV4 AWD</option>
              <option value="Coaster">Coaster Bus</option>
              <option value="Safari Van">Safari Van</option>
              <option value="Luxury Sedan">VIP Sedan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Dispatch Board (5 Operational Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
        {/* Column 1: Awaiting Assignment */}
        <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-3.5 space-y-3 min-h-[500px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Needs Chauffeur ({kanbanColumns.unassigned.length})
              </h3>
            </div>
            <span className="text-[10px] text-rose-400 font-mono font-bold">STAGE 1</span>
          </div>

          <div className="space-y-3">
            {kanbanColumns.unassigned.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500/60" />
                No unassigned bookings. All trips have drivers!
              </div>
            ) : (
              kanbanColumns.unassigned.map((bk) => {
                const veh = vehicles.find((v) => v.id === bk.vehicle_id);

                return (
                  <div
                    key={bk.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 space-y-2.5 shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[11px] text-amber-400 font-bold">#{bk.id}</span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                        Unassigned
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white">{bk.client_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{bk.destination}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800 flex items-center justify-between">
                      <span className="font-mono">{bk.start_date}</span>
                      <span className="font-mono text-emerald-400 font-bold">{formatRwf(bk.total_rwf)}</span>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-lg text-[10px] text-slate-300">
                      <span className="text-slate-500 block">Vehicle:</span>
                      <span className="font-bold text-white truncate block">{veh?.model_name || 'Assigned Car'}</span>
                      <span className="font-mono text-amber-300 font-bold">{veh?.plate_number}</span>
                    </div>

                    <button
                      onClick={() => handleOpenAssignModal(bk)}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Assign Chauffeur</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Dispatched (Awaiting Acknowledgment) */}
        <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-3.5 space-y-3 min-h-[500px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Dispatched ({kanbanColumns.dispatched.length})
              </h3>
            </div>
            <span className="text-[10px] text-blue-400 font-mono font-bold">STAGE 2</span>
          </div>

          <div className="space-y-3">
            {kanbanColumns.dispatched.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                No trips waiting for driver acknowledgment.
              </div>
            ) : (
              kanbanColumns.dispatched.map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);
                const veh = vehicles.find((v) => v.id === bk.vehicle_id);

                return (
                  <div
                    key={bk.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 space-y-2.5 shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[11px] text-amber-400 font-bold">#{bk.id}</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                        {bk.dispatch_status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white">{bk.client_name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{bk.destination}</div>
                    </div>

                    {/* Assigned Driver Box */}
                    <div className="bg-slate-950/60 p-2 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Chauffeur:</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">{drv?.language}</span>
                      </div>
                      <div className="font-bold text-white text-[11px]">{drv?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{drv?.phone}</div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => handleTriggerSMS(bk)}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                        title="Send / Resend SMS via Africa's Talking"
                      >
                        <Send className="w-3 h-3 text-blue-400" />
                        <span>Send SMS</span>
                      </button>

                      <button
                        onClick={() => handleOpenUSSDForBooking(bk.id)}
                        className="py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-colors"
                        title="Simulate *134# USSD Acknowledgment"
                      >
                        <Radio className="w-3 h-3" />
                        <span>*134# Ack</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <button
                        onClick={() => onAdvanceCheckin(bk.id, 'Acknowledged by Driver')}
                        className="text-[10px] text-slate-400 hover:text-white underline"
                      >
                        Quick mark Ack
                      </button>

                      <button
                        onClick={() => handleAutoRedispatch(bk)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-mono font-semibold flex items-center gap-1 hover:underline"
                        title="If chauffeur declined or timeout: Auto-reassign to next collision-free driver"
                      >
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                        <span>Escalate / Re-dispatch</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Chauffeur At Terminal / KIA Airport */}
        <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-3.5 space-y-3 min-h-[500px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                At Terminal ({kanbanColumns.atTerminal.length})
              </h3>
            </div>
            <span className="text-[10px] text-amber-400 font-mono font-bold">STAGE 3</span>
          </div>

          <div className="space-y-3">
            {kanbanColumns.atTerminal.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                No drivers currently staged at terminals.
              </div>
            ) : (
              kanbanColumns.atTerminal.map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);
                const veh = vehicles.find((v) => v.id === bk.vehicle_id);

                return (
                  <div
                    key={bk.id}
                    className="bg-slate-900 border border-amber-600/40 rounded-xl p-3 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[11px] text-amber-400 font-bold">#{bk.id}</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                        {bk.dispatch_status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white">{bk.client_name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{bk.destination}</div>
                    </div>

                    {/* Flight status badge */}
                    {bk.flight_number ? (
                      <div className="bg-blue-950/60 border border-blue-800/60 p-2 rounded-lg text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-blue-300">
                          <Plane className="w-3.5 h-3.5" />
                          <span className="font-mono font-bold">{bk.flight_number}</span>
                        </div>
                        <button
                          onClick={() => setFlightModalBooking(bk)}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            bk.flight_status === 'Delayed'
                              ? 'bg-rose-500 text-white'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {bk.flight_status || 'On Time'}
                          {bk.flight_delay_minutes ? ` (+${bk.flight_delay_minutes}m)` : ''}
                        </button>
                      </div>
                    ) : null}

                    {/* Chauffeur details */}
                    <div className="text-[11px] text-slate-300 flex items-center justify-between bg-slate-950/60 p-2 rounded-lg">
                      <div className="truncate">
                        <span className="font-bold text-white block">{drv?.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{veh?.plate_number}</span>
                      </div>
                      <a
                        href={`tel:${drv?.phone}`}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                        title="Call Chauffeur"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                      </a>
                    </div>

                    {/* Action: Advance to Client Onboard */}
                    <button
                      onClick={() => onAdvanceCheckin(bk.id, 'Client Onboard')}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Passenger Picked Up (Onboard)</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 4: Client Onboard / Active Trip */}
        <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-3.5 space-y-3 min-h-[500px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                On Trip ({kanbanColumns.active.length})
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">STAGE 4</span>
          </div>

          <div className="space-y-3">
            {kanbanColumns.active.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                No active trips currently in transit.
              </div>
            ) : (
              kanbanColumns.active.map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);
                const veh = vehicles.find((v) => v.id === bk.vehicle_id);

                return (
                  <div
                    key={bk.id}
                    className="bg-slate-900 border border-emerald-600/40 rounded-xl p-3 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[11px] text-amber-400 font-bold">#{bk.id}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                        En Route
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white">{bk.client_name}</div>
                      <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span className="truncate">{bk.destination}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Chauffeur & Car:</span>
                        <span className="font-mono text-amber-300 text-[10px] font-bold">{veh?.plate_number}</span>
                      </div>
                      <div className="font-bold text-white text-[11px]">{drv?.name}</div>
                    </div>

                    {/* Mission Ticket & Complete Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => setSelectedTicketBooking(bk)}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-blue-400" />
                        <span>Bon de Mission</span>
                      </button>

                      <button
                        onClick={() => onCompleteTrip(bk.id)}
                        className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Finish Trip</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 5: Completed Missions */}
        <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-3.5 space-y-3 min-h-[500px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Completed ({kanbanColumns.completed.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold">STAGE 5</span>
          </div>

          <div className="space-y-3">
            {kanbanColumns.completed.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                No completed missions recorded yet.
              </div>
            ) : (
              kanbanColumns.completed.slice(0, 8).map((bk) => {
                const drv = drivers.find((d) => d.id === bk.driver_id);
                const veh = vehicles.find((v) => v.id === bk.vehicle_id);

                return (
                  <div
                    key={bk.id}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2 opacity-85 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[11px] text-slate-400">#{bk.id}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                        {bk.payment_status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-200">{bk.client_name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{bk.destination}</div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60 text-slate-400">
                      <span>{drv?.name.split(' ')[0] || 'Chauffeur'}</span>
                      <span className="font-mono text-emerald-400 font-bold">{formatRwf(bk.total_rwf)}</span>
                    </div>

                    <button
                      onClick={() => setSelectedTicketBooking(bk)}
                      className="w-full py-1 text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Print Police Mission Slip</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Rwanda Chauffeur Mission Ticket (Bon de Mission) Modal */}
      {selectedTicketBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Rwanda Bon de Mission (Chauffeur Trip Ticket)</h3>
                  <span className="text-xs text-slate-400">Official RNP Police Checkpoint Itinerary Clearance</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketBooking(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Ticket Area */}
            <div id="printable-bon-de-mission" className="bg-white text-slate-950 p-6 rounded-xl border border-slate-300 space-y-4 font-sans text-xs">
              {/* Header */}
              <div className="text-center border-b border-slate-300 pb-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                  REPUBLIC OF RWANDA · CITY OF KIGALI
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 mt-0.5">
                  {currentCompany?.name || 'KIGALI EXPEDITION TOURS & FLEET LTD'}
                </h2>
                <div className="text-[10px] text-slate-600">
                  RDB Reg: 109248291 · TIN: 102938475 · Lic: MINITRANS/TR/2026/089
                </div>
                <div className="inline-block mt-2 px-3 py-1 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest rounded">
                  OFFICIAL CHAUFFEUR MISSION ORDER · BON DE MISSION
                </div>
              </div>

              {/* Grid: Vehicle & Chauffeur Details */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] mb-1">1. Chauffeur Credentials</h4>
                  {(() => {
                    const drv = drivers.find((d) => d.id === selectedTicketBooking.driver_id);
                    return (
                      <div className="space-y-0.5 text-[11px]">
                        <div><strong>Full Name:</strong> {drv?.name || 'Assigned Chauffeur'}</div>
                        <div><strong>Rwanda National ID:</strong> {drv?.national_id || '1 1990 8 0029384 1 20'}</div>
                        <div><strong>Driver License:</strong> {drv?.license_number || 'RW-B-2018-092'}</div>
                        <div><strong>Phone:</strong> {drv?.phone || '+250 788 123 456'}</div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] mb-1">2. Vehicle Information</h4>
                  {(() => {
                    const veh = vehicles.find((v) => v.id === selectedTicketBooking.vehicle_id);
                    return (
                      <div className="space-y-0.5 text-[11px]">
                        <div><strong>Make/Model:</strong> {veh?.model_name || 'Vehicle'}</div>
                        <div><strong>Rwanda Plate:</strong> <span className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">{veh?.plate_number}</span></div>
                        <div><strong>Contrôle Technique:</strong> Valid until {veh?.controle_technique_expiry || '2027-01-30'} (Clean)</div>
                        <div><strong>Yellow Card Insurance:</strong> Verified Active</div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Itinerary & Passenger */}
              <div className="space-y-1.5 border-b border-slate-300 pb-3">
                <h4 className="font-bold text-slate-900 uppercase text-[10px]">3. Passenger & Mission Scope</h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div><strong>Passenger / Client:</strong> {selectedTicketBooking.client_name}</div>
                  <div><strong>Contact:</strong> {selectedTicketBooking.client_phone}</div>
                  <div><strong>Mission Dates:</strong> {selectedTicketBooking.start_date} to {selectedTicketBooking.end_date}</div>
                  <div><strong>Destination:</strong> {selectedTicketBooking.destination}</div>
                  {selectedTicketBooking.flight_number && (
                    <div><strong>Flight Connection:</strong> {selectedTicketBooking.flight_number} (KIA Terminal)</div>
                  )}
                </div>
              </div>

              {/* Police Warning & Legal Clearance */}
              <div className="text-[10px] text-slate-600 bg-slate-100 p-2.5 rounded border border-slate-200">
                <strong>Legal Clearance Notice:</strong> This commercial mission order is issued under Law N° 55/2013 on Public and Private Passenger Transport in Rwanda. Chauffeur is authorized to convey the named passenger(s) across Rwanda districts.
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-2 text-[10px]">
                <div>
                  <div className="text-slate-500">Fleet Operations Manager:</div>
                  <div className="font-bold mt-4 border-t border-slate-400 pt-0.5">Signature & Stamp: {currentUser?.name || 'Operations Desk'}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500">Driver Acceptance:</div>
                  <div className="font-bold mt-4 border-t border-slate-400 pt-0.5">Signature: __________________</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Slip (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTicketBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Africa's Talking SMS Dispatch Modal */}
      {selectedSMSBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="text-base font-bold text-white">Africa's Talking SMS Dispatch</h3>
              </div>
              <button
                onClick={() => setSelectedSMSBooking(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {smsSendNotice && (
              <div className="bg-emerald-950/60 border border-emerald-700 text-emerald-300 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{smsSendNotice}</span>
              </div>
            )}

            {/* Language toggle */}
            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Chauffeur SMS Template Language:</span>
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setSmsLanguage('RW')}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    smsLanguage === 'RW' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kinyarwanda (Ikinyarwanda)
                </button>
                <button
                  type="button"
                  onClick={() => setSmsLanguage('EN')}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    smsLanguage === 'EN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* SMS Preview Body */}
            {(() => {
              const drv = drivers.find((d) => d.id === selectedSMSBooking.driver_id);
              const veh = vehicles.find((v) => v.id === selectedSMSBooking.vehicle_id);

              const smsData = drv && veh ? generateDriverSMS({
                driver: drv,
                vehicle: veh,
                booking: selectedSMSBooking,
                language: smsLanguage,
              }) : null;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Recipient: <strong className="text-white">{drv?.name} ({drv?.phone})</strong></span>
                    <span>Cost: <strong className="text-emerald-400">1 Africa's Talking Credit</strong></span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {smsData?.messageText || 'Generating message...'}
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSMSBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendSMS}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Live SMS Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive USSD Simulator Drawer / Modal */}
      {isUSSDSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Chauffeur 2G USSD Terminal</h3>
              </div>
              <button
                onClick={() => setIsUSSDSimulatorOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Simulates driver feature phone dialing <strong>*134#</strong> (Rwanda USSD Gateway). Works with zero mobile data!
            </p>

            {/* Booking Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-mono">Active Booking:</label>
              <select
                value={ussdActiveBookingId}
                onChange={(e) => handleOpenUSSDForBooking(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} · {b.client_name} ({b.destination})
                  </option>
                ))}
              </select>
            </div>

            {/* Feature Phone Screen Box */}
            <div className="bg-emerald-950/80 border-2 border-emerald-600/80 rounded-2xl p-4 font-mono text-xs text-emerald-300 shadow-inner min-h-[160px] whitespace-pre-wrap leading-relaxed">
              {ussdScreenText || 'Connecting to *134#...'}
            </div>

            {/* Quick Action Dial Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleSendUSSDCode('1')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white text-center border border-slate-700"
              >
                [ 1 ] Emeza (Ack)
              </button>
              <button
                onClick={() => handleSendUSSDCode('2')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white text-center border border-slate-700"
              >
                [ 2 ] ku Kibuga (KIA)
              </button>
              <button
                onClick={() => handleSendUSSDCode('3')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white text-center border border-slate-700"
              >
                [ 3 ] Yinjiyemo (Onboard)
              </button>
              <button
                onClick={() => handleSendUSSDCode('4')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white text-center border border-slate-700"
              >
                [ 4 ] Rangiza (Finish)
              </button>
            </div>

            <button
              onClick={() => setIsUSSDSimulatorOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Exit Terminal
            </button>
          </div>
        </div>
      )}

      {/* Chauffeur Assignment Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Assign Chauffeur to Booking #{assignModalBooking.id}</h3>
              </div>
              <button
                onClick={() => setAssignModalBooking(null)}
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

            <div className="text-xs text-slate-400 space-y-1">
              <div>Client: <strong className="text-white">{assignModalBooking.client_name}</strong></div>
              <div>Route: <strong className="text-white">{assignModalBooking.destination}</strong></div>
              <div>Dates: <strong className="text-emerald-400">{assignModalBooking.start_date} → {assignModalBooking.end_date}</strong></div>
            </div>

            {/* Chauffeur Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Select Chauffeur (Collision Guard Checked):</span>
                <span className="text-[10px] text-slate-500 font-mono">Live Validation</span>
              </label>

              <select
                value={selectedDriverToAssign}
                onChange={(e) => setSelectedDriverToAssign(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 text-xs outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Chauffeur --</option>
                {drivers.map((drv) => {
                  const collision = checkDriverCollision(
                    drv.id,
                    assignModalBooking.start_date,
                    assignModalBooking.end_date,
                    bookings,
                    assignModalBooking.id
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAssignModalBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedDriverToAssign}
                onClick={handleConfirmAssignDriver}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-md"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flight Delay Alert Adjustment Modal */}
      {flightModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">KIA Flight Delay Adjustment</h3>
              </div>
              <button
                onClick={() => setFlightModalBooking(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Flight <strong>{flightModalBooking.flight_number}</strong> delayed arrival into Kigali International Airport (KIA). Adjust pickup window to alert driver via SMS.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Delay Duration (Minutes):</label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDelayMinutes(m)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      delayMinutes === m
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    +{m} min
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClearFlightDelay}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Clear / On Time
              </button>
              <button
                type="button"
                onClick={handleApplyFlightDelay}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md"
              >
                Broadcast Delay (+{delayMinutes}m)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
