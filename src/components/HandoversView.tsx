import React, { useState, useMemo } from 'react';
import {
  VehicleHandoverInspection,
  Booking,
  Vehicle,
  User,
  InspectionType,
  VehicleCleanliness,
} from '../types';
import { ColorTheme } from '../theme';
import { formatRwf, calculateDays } from '../utils/collision';
import {
  ClipboardCheck,
  Plus,
  Car,
  Fuel,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  FileText,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  X,
  Printer,
  Calendar,
} from 'lucide-react';

interface HandoversViewProps {
  handovers: VehicleHandoverInspection[];
  bookings: Booking[];
  vehicles: Vehicle[];
  currentUser?: User;
  currentTheme?: ColorTheme;
  onAddHandover: (
    inspection: Omit<VehicleHandoverInspection, 'id' | 'created_at'>
  ) => VehicleHandoverInspection;
  onOpenAgreement: (booking: Booking, vehicle: Vehicle) => void;
}

export const HandoversView: React.FC<HandoversViewProps> = ({
  handovers,
  bookings,
  vehicles,
  currentUser,
  currentTheme,
  onAddHandover,
  onOpenAgreement,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pickup' | 'return'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] =
    useState<VehicleHandoverInspection | null>(null);

  // Form State for New Handover Inspection
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    bookings[0]?.id || ''
  );
  const [inspectionType, setInspectionType] = useState<InspectionType>('pickup');
  const [odometerKm, setOdometerKm] = useState<number>(65000);
  const [fuelLevel, setFuelLevel] = useState<number>(8);
  const [cleanliness, setCleanliness] = useState<VehicleCleanliness>('Clean');
  const [checklist, setChecklist] = useState({
    body_scratches_dents: true,
    windshield_windows: true,
    headlights_taillights: true,
    tires_wheels: true,
    spare_tire_jack: true,
    ac_climate_control: true,
    triangle_fire_extinguisher: true,
    interior_clean: true,
    documents_in_glovebox: true,
  });
  const [damageNotes, setDamageNotes] = useState('');
  const [signatureConfirmed, setSignatureConfirmed] = useState(true);

  // Derive selected booking and vehicle for form
  const activeFormBooking = useMemo(
    () => bookings.find((b) => b.id === selectedBookingId) || bookings[0] || null,
    [bookings, selectedBookingId]
  );

  const activeFormVehicle = useMemo(
    () =>
      activeFormBooking
        ? vehicles.find((v) => v.id === activeFormBooking.vehicle_id) || null
        : null,
    [vehicles, activeFormBooking]
  );

  // Auto-fill vehicle current odometer when booking changes
  const handleSelectBooking = (bkId: string) => {
    setSelectedBookingId(bkId);
    const bk = bookings.find((b) => b.id === bkId);
    if (bk) {
      const v = vehicles.find((veh) => veh.id === bk.vehicle_id);
      if (v) {
        setOdometerKm(v.current_odometer_km);
      }
    }
  };

  const handleToggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fuel shortfall and excess mileage estimation for return
  const returnCalculation = useMemo(() => {
    if (inspectionType !== 'return' || !activeFormVehicle) {
      return { excessKm: 0, excessKmCharge: 0, fuelDeficitLiters: 0, fuelCharge: 0, total: 0 };
    }
    const previousOdo = activeFormVehicle.current_odometer_km;
    const drivenKm = Math.max(0, odometerKm - previousOdo);
    const durationDays = activeFormBooking
      ? calculateDays(activeFormBooking.start_date, activeFormBooking.end_date)
      : 3;
    const allowanceKm = durationDays * 350; // 350 km/day standard Rwandan cap
    const excessKm = Math.max(0, drivenKm - allowanceKm);
    const excessKmCharge = excessKm * 200; // 200 RWF/km

    const fuelDeficitEighths = Math.max(0, 8 - fuelLevel);
    // Average 70L tank -> each eighth is ~8.75L
    const fuelDeficitLiters = Math.round(fuelDeficitEighths * 8.75);
    const fuelCharge = fuelDeficitLiters > 0 ? fuelDeficitLiters * 1850 + 10000 : 0; // 1,850 RWF/L + 10,000 RWF refuel fee

    return {
      excessKm,
      excessKmCharge,
      fuelDeficitLiters,
      fuelCharge,
      total: excessKmCharge + fuelCharge,
    };
  }, [inspectionType, odometerKm, fuelLevel, activeFormVehicle, activeFormBooking]);

  const handleSubmitNewInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFormBooking || !activeFormVehicle) return;

    onAddHandover({
      booking_id: activeFormBooking.id,
      vehicle_id: activeFormVehicle.id,
      vehicle_plate: activeFormVehicle.plate_number,
      vehicle_model: activeFormVehicle.model_name,
      client_name: activeFormBooking.client_name,
      client_phone: activeFormBooking.client_phone,
      inspection_type: inspectionType,
      odometer_km: odometerKm,
      fuel_level_eighths: fuelLevel,
      cleanliness,
      condition_checklist: checklist,
      damage_notes: damageNotes.trim() || undefined,
      inspector_name: currentUser?.name || 'Dispatcher on Duty',
      client_signature_confirmed: signatureConfirmed,
      additional_charges_rwf: returnCalculation.total > 0 ? returnCalculation.total : 0,
      additional_charges_reason:
        returnCalculation.total > 0
          ? `${returnCalculation.excessKm > 0 ? `${returnCalculation.excessKm} km excess. ` : ''}${
              returnCalculation.fuelCharge > 0 ? `Fuel shortfall (${returnCalculation.fuelDeficitLiters}L).` : ''
            }`
          : undefined,
    });

    setIsNewInspectionOpen(false);
    setDamageNotes('');
  };

  // Filtered Inspections
  const filteredHandovers = useMemo(() => {
    return handovers.filter((h) => {
      if (filterType !== 'all' && h.inspection_type !== filterType) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          h.vehicle_plate.toLowerCase().includes(q) ||
          h.vehicle_model.toLowerCase().includes(q) ||
          h.client_name.toLowerCase().includes(q) ||
          h.inspector_name.toLowerCase().includes(q) ||
          h.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [handovers, filterType, searchTerm]);

  // Key stats
  const totalPickups = handovers.filter((h) => h.inspection_type === 'pickup').length;
  const totalReturns = handovers.filter((h) => h.inspection_type === 'return').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Vehicle Handover & Return Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Digital condition check-outs, return reconciliations, odometer updates & fuel audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (activeFormBooking && activeFormVehicle) {
                onOpenAgreement(activeFormBooking, activeFormVehicle);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Generate Lease Contract</span>
          </button>

          <button
            onClick={() => setIsNewInspectionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Inspection Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Total Handover Audits
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {handovers.length}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            100% Digital Trail
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Active Dispatches (Out)
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalPickups}
          </div>
          <span className="text-[11px] text-slate-500">Pickups Signed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Returned & Cleared (In)
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalReturns}
          </div>
          <span className="text-[11px] text-slate-500">Odometer Reconciled</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Contrôle Readiness
          </span>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
            100%
          </div>
          <span className="text-[11px] text-slate-500">Extinguishers & Kits Present</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Audits ({handovers.length})
          </button>
          <button
            onClick={() => setFilterType('pickup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'pickup'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Check-out (Pickup)
          </button>
          <button
            onClick={() => setFilterType('return')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'return'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Check-in (Return)
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plate, client or inspector..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Inspections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHandovers.map((insp) => {
          const isPickup = insp.inspection_type === 'pickup';
          const passCount = Object.values(insp.condition_checklist).filter(Boolean).length;
          const totalChecks = Object.keys(insp.condition_checklist).length;

          return (
            <div
              key={insp.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        isPickup
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isPickup ? 'Check-out (Pickup)' : 'Check-in (Return)'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {insp.id}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {insp.vehicle_model}
                  </h3>
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    {insp.vehicle_plate}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[11px] text-slate-500 block">
                    {new Date(insp.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      insp.cleanliness === 'Clean'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    Cleanliness: {insp.cleanliness}
                  </span>
                </div>
              </div>

              {/* Metrics: Odometer & Fuel Level Gauge */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Gauge className="w-3.5 h-3.5 text-amber-500" />
                    <span>Odometer Reading</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {insp.odometer_km.toLocaleString()} KM
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Fuel className="w-3.5 h-3.5 text-amber-500" />
                    <span>Fuel Level Gauge</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 bg-slate-200 dark:bg-slate-950 p-1 rounded-md">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                        <div
                          key={bar}
                          className={`w-2.5 h-3.5 rounded-xs transition-colors ${
                            bar <= insp.fuel_level_eighths
                              ? 'bg-amber-500'
                              : 'bg-slate-300 dark:bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {insp.fuel_level_eighths}/8 ({Math.round((insp.fuel_level_eighths / 8) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Checklist & Damage Overview */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      Condition Checks Passed: <strong>{passCount}/{totalChecks}</strong>
                    </span>
                  </div>
                  {insp.client_signature_confirmed && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      ✓ Client Signed
                    </span>
                  )}
                </div>

                {insp.damage_notes && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-[11px] leading-relaxed">
                    <strong>Condition Notes:</strong> {insp.damage_notes}
                  </div>
                )}

                {insp.additional_charges_rwf ? (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-[11px] flex items-center justify-between">
                    <span>
                      Reconciliation Surcharge: <strong>{insp.additional_charges_reason}</strong>
                    </span>
                    <strong className="font-mono text-xs">
                      +{formatRwf(insp.additional_charges_rwf)}
                    </strong>
                  </div>
                ) : null}
              </div>

              {/* Inspector & Client Details */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  Client: <strong className="text-slate-700 dark:text-slate-300">{insp.client_name}</strong> ({insp.client_phone})
                </div>
                <div>
                  Auditor: <span className="font-medium">{insp.inspector_name}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredHandovers.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Handover Inspections Found
            </h3>
            <p className="text-xs text-slate-500">
              Create a check-out audit before releasing a vehicle to a customer.
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: CONDUCT NEW VEHICLE HANDOVER / RETURN INSPECTION
      ========================================================================= */}
      {isNewInspectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 sm:px-6 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Conduct Vehicle Handover Audit
                  </h2>
                  <span className="text-xs text-slate-500">
                    Physical check-out or return condition sign-off
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsNewInspectionOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewInspection} className="p-5 sm:p-6 space-y-5 text-xs">
              {/* Type Selector: Check-out vs Check-in */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInspectionType('pickup')}
                  className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                    inspectionType === 'pickup'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-500 dark:text-amber-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <strong className="block text-xs">Check-out (Pickup Handover)</strong>
                  <span className="text-[11px] text-slate-500 block font-normal">
                    Releasing vehicle to customer
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectionType('return')}
                  className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                    inspectionType === 'return'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <strong className="block text-xs">Check-in (Vehicle Return)</strong>
                  <span className="text-[11px] text-slate-500 block font-normal">
                    Receiving vehicle & reconciling fuel/km
                  </span>
                </button>
              </div>

              {/* Linked Booking Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Select Active Reservation
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => handleSelectBooking(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                >
                  {bookings.map((b) => {
                    const veh = vehicles.find((v) => v.id === b.vehicle_id);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.id} — {b.client_name} ({veh ? veh.model_name : 'Vehicle'}) [{b.start_date} to {b.end_date}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Odometer and Cleanliness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Current Odometer (KM)
                  </label>
                  <input
                    type="number"
                    required
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  {activeFormVehicle && (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Prior recorded odometer: {activeFormVehicle.current_odometer_km.toLocaleString()} KM
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Interior & Exterior Cleanliness
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Clean', 'Moderate', 'Dirty'] as VehicleCleanliness[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCleanliness(c)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          cleanliness === c
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fuel Level Selector in Eighths */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Fuel Gauge Level ({fuelLevel}/8 — {Math.round((fuelLevel / 8) * 100)}%)
                  </label>
                  <span className="text-[11px] font-mono text-amber-500 font-semibold">
                    {fuelLevel === 8 ? 'Full Tank (8/8)' : fuelLevel === 4 ? 'Half Tank (4/8)' : `${fuelLevel}/8 Tank`}
                  </span>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFuelLevel(lvl)}
                      className={`py-2 rounded-lg font-mono font-bold text-xs transition-colors ${
                        fuelLevel >= lvl
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {lvl}/8
                    </button>
                  ))}
                </div>
              </div>

              {/* 9-Point Mandatory Rwanda Fleet Checklist */}
              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  9-Point Physical & Statutory Inspection Checklist
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {[
                    { key: 'body_scratches_dents', label: 'Body Panels & Paint Free of New Scratches' },
                    { key: 'windshield_windows', label: 'Windshield & Window Glass Intact (No Cracks)' },
                    { key: 'headlights_taillights', label: 'Headlights, Turn Indicators & Brake Lights' },
                    { key: 'tires_wheels', label: '4x4 Tires Tread Depth & Wheel Nuts Secure' },
                    { key: 'spare_tire_jack', label: 'Spare Tire, Jack & Wheel Spanner Present' },
                    { key: 'ac_climate_control', label: 'AC & Climate Control Cooling Operational' },
                    { key: 'triangle_fire_extinguisher', label: 'Fire Extinguisher & 2 Red Safety Triangles' },
                    { key: 'interior_clean', label: 'Seats & Floor Mats Sanitized & Detained' },
                    { key: 'documents_in_glovebox', label: 'Yellow Card Insurance & Contrôle Technique in Glovebox' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={checklist[item.key as keyof typeof checklist]}
                        onChange={() => handleToggleChecklist(item.key as keyof typeof checklist)}
                        className="rounded accent-amber-500 w-4 h-4"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Damage Notes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Damage Notes & Existing Blemishes
                </label>
                <textarea
                  rows={2}
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Record any minor scratches, dents, tire wear, or spare equipment notes..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              {/* Automatic Return Reconciliation (If Return) */}
              {inspectionType === 'return' && returnCalculation.total > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1.5 text-red-800 dark:text-red-200">
                  <div className="font-bold flex items-center justify-between">
                    <span>Automated Return Surcharge Engine:</span>
                    <span className="font-mono text-sm">+{formatRwf(returnCalculation.total)}</span>
                  </div>
                  <div className="text-[11px] space-y-0.5 text-red-700 dark:text-red-300">
                    {returnCalculation.excessKm > 0 && (
                      <p>
                        • Excess Mileage: {returnCalculation.excessKm} km over cap @ 200 RWF = {formatRwf(returnCalculation.excessKmCharge)}
                      </p>
                    )}
                    {returnCalculation.fuelCharge > 0 && (
                      <p>
                        • Fuel Shortfall: ~{returnCalculation.fuelDeficitLiters} Liters missing + service fee = {formatRwf(returnCalculation.fuelCharge)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Digital Signature Confirmation */}
              <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={signatureConfirmed}
                  onChange={(e) => setSignatureConfirmed(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                  Client has personally inspected the vehicle and agreed to the odometer, fuel gauge, and condition checklist above.
                </span>
              </label>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewInspectionOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md transition-transform active:scale-95"
                >
                  Save Handover Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
