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
  Fuel,
  Gauge,
  CheckCircle2,
  Search,
  FileText,
  X,
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
  const activeColor = currentTheme?.hex || '#635bff';
  const [filterType, setFilterType] = useState<'all' | 'pickup' | 'return'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);

  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || '');
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

  const returnCalculation = useMemo(() => {
    if (inspectionType !== 'return' || !activeFormVehicle) {
      return { excessKm: 0, excessKmCharge: 0, fuelDeficitLiters: 0, fuelCharge: 0, total: 0 };
    }
    const previousOdo = activeFormVehicle.current_odometer_km;
    const drivenKm = Math.max(0, odometerKm - previousOdo);
    const durationDays = activeFormBooking
      ? calculateDays(activeFormBooking.start_date, activeFormBooking.end_date)
      : 3;
    const allowanceKm = durationDays * 350;
    const excessKm = Math.max(0, drivenKm - allowanceKm);
    const excessKmCharge = excessKm * 200;

    const fuelDeficitEighths = Math.max(0, 8 - fuelLevel);
    const fuelDeficitLiters = Math.round(fuelDeficitEighths * 8.75);
    const fuelCharge = fuelDeficitLiters > 0 ? fuelDeficitLiters * 1850 + 10000 : 0;

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
      inspector_name: currentUser?.name || 'Staff on Duty',
      client_signature_confirmed: signatureConfirmed,
      additional_charges_rwf: returnCalculation.total > 0 ? returnCalculation.total : 0,
      additional_charges_reason:
        returnCalculation.total > 0
          ? `${returnCalculation.excessKm > 0 ? `${returnCalculation.excessKm} extra km. ` : ''}${
              returnCalculation.fuelCharge > 0 ? `Missing fuel (${returnCalculation.fuelDeficitLiters}L).` : ''
            }`
          : undefined,
    });

    setIsNewInspectionOpen(false);
    setDamageNotes('');
  };

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

  const totalPickups = handovers.filter((h) => h.inspection_type === 'pickup').length;
  const totalReturns = handovers.filter((h) => h.inspection_type === 'return').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="stripe-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <div className="flex items-start gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
            style={{ backgroundColor: activeColor }}
          >
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a2540] dark:text-white">
              Car Check-Out & Return
            </h1>
            <p className="text-base text-[#425466] dark:text-slate-300 mt-1">
              Check fuel, km, and scratches before giving out a car and when it comes back.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (activeFormBooking && activeFormVehicle) {
                onOpenAgreement(activeFormBooking, activeFormVehicle);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-[#f6f9fc] dark:bg-slate-800 text-sm font-bold text-[#0a2540] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Car Paper</span>
          </button>

          <button
            onClick={() => setIsNewInspectionOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-sm hover:opacity-95 transition-opacity"
            style={{ backgroundColor: activeColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Car Check</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">All Checks</span>
          <div className="text-3xl font-extrabold text-[#0a2540] dark:text-white font-mono">{handovers.length}</div>
          <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Saved digitally</span>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Cars Given Out</span>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">{totalPickups}</div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Signed by guest</span>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Cars Returned</span>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{totalReturns}</div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Fuel & km checked</span>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Safety Kits</span>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">100%</div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Ready in all cars</span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="stripe-card flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {[
            { value: 'all', label: `All (${handovers.length})` },
            { value: 'pickup', label: 'Car Going Out' },
            { value: 'return', label: 'Car Coming Back' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterType(btn.value as 'all' | 'pickup' | 'return')}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                filterType === btn.value
                  ? 'text-white border-transparent'
                  : 'bg-[#f6f9fc] dark:bg-slate-950 text-[#425466] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={filterType === btn.value ? { backgroundColor: activeColor } : undefined}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plate, guest, or staff..."
            className="w-full pl-10 pr-3 py-2.5 bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-[#0a2540] dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHandovers.map((insp) => {
          const isPickup = insp.inspection_type === 'pickup';
          const passCount = Object.values(insp.condition_checklist).filter(Boolean).length;
          const totalChecks = Object.keys(insp.condition_checklist).length;

          return (
            <div
              key={insp.id}
              className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-0.5 rounded-full text-sm font-bold border ${
                        isPickup
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                      }`}
                    >
                      {isPickup ? 'Going Out' : 'Coming Back'}
                    </span>
                    <span className="text-sm font-mono text-[#425466] dark:text-slate-400">#{insp.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0a2540] dark:text-white pt-1">{insp.vehicle_model}</h3>
                  <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400">
                    {insp.vehicle_plate}
                  </span>
                </div>

                <div className="text-right space-y-1.5">
                  <span className="text-sm text-[#425466] dark:text-slate-400 block">
                    {new Date(insp.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-semibold ${
                      insp.cleanliness === 'Clean'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                    }`}
                  >
                    {insp.cleanliness}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#425466] dark:text-slate-400 text-sm">
                    <Gauge className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Km Reading</span>
                  </div>
                  <div className="font-mono text-base font-bold text-[#0a2540] dark:text-white">
                    {insp.odometer_km.toLocaleString()} km
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#425466] dark:text-slate-400 text-sm">
                    <Fuel className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Fuel Tank</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                        <div
                          key={bar}
                          className={`w-2 h-3.5 rounded-xs ${
                            bar <= insp.fuel_level_eighths ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-sm font-bold text-[#0a2540] dark:text-slate-200">
                      {insp.fuel_level_eighths}/8
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-[#425466] dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Checks passed: <strong>{passCount}/{totalChecks}</strong>
                    </span>
                  </div>
                  {insp.client_signature_confirmed && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ Guest Signed</span>
                  )}
                </div>

                {insp.damage_notes && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-sm">
                    <strong>Notes:</strong> {insp.damage_notes}
                  </div>
                )}

                {insp.additional_charges_rwf ? (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
                    <span>
                      Extra Fee: <strong>{insp.additional_charges_reason}</strong>
                    </span>
                    <strong className="font-mono">+{formatRwf(insp.additional_charges_rwf)}</strong>
                  </div>
                ) : null}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-sm text-[#425466] dark:text-slate-400">
                <div>
                  Guest: <strong className="text-[#0a2540] dark:text-white">{insp.client_name}</strong>
                </div>
                <div>
                  Checked by: <span className="font-semibold text-[#0a2540] dark:text-slate-200">{insp.inspector_name}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredHandovers.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-[#0a2540] dark:text-white">No Car Checks Yet</h3>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              Tap "New Car Check" before giving keys to a guest.
            </p>
          </div>
        )}
      </div>

      {/* Modal: New Car Check */}
      {isNewInspectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 bg-[#f6f9fc] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">New Car Check</h2>
                  <span className="text-sm text-[#425466] dark:text-slate-400">
                    Record fuel, km, and condition
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsNewInspectionOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewInspection} className="p-6 space-y-5 text-sm max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInspectionType('pickup')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    inspectionType === 'pickup'
                      ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-400'
                  }`}
                >
                  <strong className="block text-sm">Car Going Out</strong>
                  <span className="text-sm block opacity-80">Giving car to guest</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectionType('return')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    inspectionType === 'return'
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-400'
                  }`}
                >
                  <strong className="block text-sm">Car Coming Back</strong>
                  <span className="text-sm block opacity-80">Guest returning car</span>
                </button>
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Pick a Trip</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => handleSelectBooking(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-medium"
                >
                  {bookings.map((b) => {
                    const veh = vehicles.find((v) => v.id === b.vehicle_id);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.client_name} — {veh ? veh.model_name : 'Car'} ({b.start_date} to {b.end_date})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Km Reading</label>
                  <input
                    type="number"
                    required
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-mono font-bold"
                  />
                  {activeFormVehicle && (
                    <span className="text-sm text-[#425466] dark:text-slate-400 mt-1 block">
                      Before: {activeFormVehicle.current_odometer_km.toLocaleString()} km
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">How Clean Is It?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Clean', 'Moderate', 'Dirty'] as VehicleCleanliness[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCleanliness(c)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                          cleanliness === c
                            ? 'text-white border-transparent'
                            : 'border-slate-200 dark:border-slate-700 text-[#425466] dark:text-slate-300'
                        }`}
                        style={cleanliness === c ? { backgroundColor: activeColor } : undefined}
                      >
                        {c === 'Moderate' ? 'Okay' : c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold">
                    Fuel Level ({fuelLevel}/8)
                  </label>
                  <span className="text-sm font-mono text-amber-700 dark:text-amber-400 font-semibold">
                    {fuelLevel === 8 ? 'Full Tank' : fuelLevel === 4 ? 'Half Tank' : `${fuelLevel}/8 Tank`}
                  </span>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFuelLevel(lvl)}
                      className={`py-2 rounded-lg font-mono font-bold text-sm transition-colors ${
                        fuelLevel >= lvl
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-[#f6f9fc] dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lvl}/8
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[#0a2540] dark:text-slate-200 font-bold">9-Point Car Check</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#f6f9fc] dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {[
                    { key: 'body_scratches_dents', label: 'Body & paint look good' },
                    { key: 'windshield_windows', label: 'Glass has no cracks' },
                    { key: 'headlights_taillights', label: 'All lights work' },
                    { key: 'tires_wheels', label: 'Tires are good' },
                    { key: 'spare_tire_jack', label: 'Spare tire & jack inside' },
                    { key: 'ac_climate_control', label: 'AC blows cold air' },
                    { key: 'triangle_fire_extinguisher', label: 'Fire extinguisher & triangles' },
                    { key: 'interior_clean', label: 'Seats & floor are clean' },
                    { key: 'documents_in_glovebox', label: 'Insurance & car papers inside' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 cursor-pointer text-sm text-[#0a2540] dark:text-slate-200"
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

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Scratches or Notes</label>
                <textarea
                  rows={2}
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Write down any scratches, dents, or missing items..."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
                />
              </div>

              {inspectionType === 'return' && returnCalculation.total > 0 && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl space-y-1.5 text-rose-800 dark:text-rose-200">
                  <div className="font-bold flex items-center justify-between">
                    <span>Extra Fee (Km or Fuel):</span>
                    <span className="font-mono text-base">+{formatRwf(returnCalculation.total)}</span>
                  </div>
                  <div className="text-sm space-y-0.5">
                    {returnCalculation.excessKm > 0 && (
                      <p>
                        • Extra distance: {returnCalculation.excessKm} km = {formatRwf(returnCalculation.excessKmCharge)}
                      </p>
                    )}
                    {returnCalculation.fuelCharge > 0 && (
                      <p>
                        • Missing fuel: ~{returnCalculation.fuelDeficitLiters} L = {formatRwf(returnCalculation.fuelCharge)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2.5 p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={signatureConfirmed}
                  onChange={(e) => setSignatureConfirmed(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span className="text-[#0a2540] dark:text-slate-200 font-medium text-sm">
                  The guest checked the car and agrees with the fuel, km, and notes above.
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewInspectionOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-white font-bold shadow-sm"
                  style={{ backgroundColor: activeColor }}
                >
                  Save Car Check
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
