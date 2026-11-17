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
import { calculateDays } from '../utils/collision';
import { formatHumanDateRange, formatHumanDateTime } from '../utils/dates';
import { useI18n } from '../utils/i18n';
import { Plus, Search, ClipboardCheck, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';
import { ModalShell } from './ModalShell';

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

const inputCls =
  'w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';

export const HandoversView: React.FC<HandoversViewProps> = ({
  handovers,
  bookings,
  vehicles,
  currentUser,
  onAddHandover,
  onOpenAgreement,
}) => {
  const { formatMoney, tr } = useI18n();
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

  const handlePrintSheet = (insp: VehicleHandoverInspection) => {
    const matchedBooking =
      bookings.find((b) => b.id === insp.booking_id) || activeFormBooking;
    const matchedVehicle =
      vehicles.find((v) => v.id === insp.vehicle_id) || activeFormVehicle;
    if (matchedBooking && matchedVehicle) {
      onOpenAgreement(matchedBooking, matchedVehicle);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Car checks')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Check fuel, km, and scratches before giving out a car and when it comes back.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (activeFormBooking && activeFormVehicle) {
                onOpenAgreement(activeFormBooking, activeFormVehicle);
              }
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
          >
            {tr('Car paper')}
          </button>

          <button
            type="button"
            onClick={() => setIsNewInspectionOpen(true)}
            className="accent-bg inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('New car check')}</span>
          </button>
        </div>
      </div>

      {/* 4-Card KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('All checks')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {handovers.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Signed inspection records</p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Cars given out')}</span>
            <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {totalPickups}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Pickup inspections</p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Cars returned')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {totalReturns}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Return condition checks</p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Safety kits')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            100%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">9-point check verified</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 kf-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg overflow-x-auto">
          {[
            { value: 'all', label: `${tr('All')} (${handovers.length})` },
            { value: 'pickup', label: tr('Car going out') },
            { value: 'return', label: tr('Car coming back') },
          ].map((tab) => {
            const active = filterType === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilterType(tab.value as 'all' | 'pickup' | 'return')}
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

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={tr('Search plate, guest, or staff...')}
            className="w-full sm:w-68 pl-9 pr-3 py-1.5 bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500"
          />
        </div>
      </div>

      {/* Modern Handover Inspection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredHandovers.map((insp) => {
          const isPickup = insp.inspection_type === 'pickup';
          const passCount = Object.values(insp.condition_checklist).filter(Boolean).length;
          const totalChecks = Object.keys(insp.condition_checklist).length;

          return (
            <div
              key={insp.id}
              className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card flex flex-col justify-between p-5 space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                        isPickup
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {isPickup ? tr('Going out') : tr('Coming back')}
                    </span>
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500">#{insp.id}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatHumanDateTime(insp.created_at)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {insp.vehicle_model}
                    </h3>
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      {insp.vehicle_plate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Guest: <strong className="font-medium text-slate-800 dark:text-slate-200">{insp.client_name}</strong> · Checked by {insp.inspector_name}
                  </p>
                </div>

                {/* Soft Tonal Spec Well */}
                <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-lg p-3.5 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">{tr('Km reading')}</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                      {insp.odometer_km.toLocaleString()} km
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">{tr('Condition')}</span>
                    <span
                      className={`font-semibold mt-0.5 block ${
                        insp.cleanliness === 'Clean'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : insp.cleanliness === 'Moderate'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tr(insp.cleanliness === 'Moderate' ? 'Okay' : insp.cleanliness)} ({passCount}/{totalChecks} checks)
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">{tr('Fuel')}</span>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                          <span
                            key={bar}
                            className={`inline-block w-3 h-2.5 rounded-xs ${
                              bar <= insp.fuel_level_eighths
                                ? 'accent-bg'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {insp.fuel_level_eighths}/8
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">{tr('Notes')}: </span>
                  {insp.damage_notes || tr('No scratches or issues noted.')}
                </div>

                {insp.additional_charges_rwf ? (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
                    <span>{insp.additional_charges_reason}</span>
                    <span className="font-mono font-semibold shrink-0">+{formatMoney(insp.additional_charges_rwf)}</span>
                  </div>
                ) : null}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="signature-line text-base text-slate-700 dark:text-slate-200">
                  {insp.client_name}
                </div>
                <button
                  type="button"
                  onClick={() => handlePrintSheet(insp)}
                  className="accent-text font-medium hover:underline"
                >
                  {tr('Print car paper')}
                </button>
              </div>
            </div>
          );
        })}

        {filteredHandovers.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {tr('No car checks yet')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tr('Select "New car check" before giving keys to a guest.')}
            </p>
          </div>
        )}
      </div>

      {/* Modal: New Car Check */}
      <ModalShell
        isOpen={isNewInspectionOpen}
        onClose={() => setIsNewInspectionOpen(false)}
        maxWidthClass="max-w-2xl"
        asForm
        onSubmit={handleSubmitNewInspection}
        title={tr('New car check')}
        subtitle={tr('Record fuel, km, and condition')}
        bodyClassName="p-5 sm:p-6 space-y-4 text-sm"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewInspectionOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {tr('Cancel')}
            </button>
            <button
              type="submit"
              className="accent-bg px-5 py-2 rounded-lg font-medium hover:opacity-95 cursor-pointer"
            >
              {tr('Save car check')}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setInspectionType('pickup')}
            className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              inspectionType === 'pickup'
                ? 'accent-border accent-tint text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <strong className="block font-semibold text-sm">{tr('Car going out')}</strong>
            <span className="text-xs block mt-0.5">{tr('Giving car to guest')}</span>
          </button>

          <button
            type="button"
            onClick={() => setInspectionType('return')}
            className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              inspectionType === 'return'
                ? 'accent-border accent-tint text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <strong className="block font-semibold text-sm">{tr('Car coming back')}</strong>
            <span className="text-xs block mt-0.5">{tr('Guest returning car')}</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
            {tr('Pick a trip')}
          </label>
          <select
            value={selectedBookingId}
            onChange={(e) => handleSelectBooking(e.target.value)}
            className={inputCls}
          >
            {bookings.map((b) => {
              const veh = vehicles.find((v) => v.id === b.vehicle_id);
              return (
                <option key={b.id} value={b.id}>
                  {b.client_name} — {veh ? veh.model_name : tr('Car')} ({formatHumanDateRange(b.start_date, b.end_date)})
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              {tr('Km reading')}
            </label>
            <input
              type="number"
              required
              value={odometerKm}
              onChange={(e) => setOdometerKm(parseInt(e.target.value, 10) || 0)}
              className={`${inputCls} font-mono`}
            />
            {activeFormVehicle && (
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                {tr('Before')}: {activeFormVehicle.current_odometer_km.toLocaleString()} km
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              {tr('How clean is it?')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Clean', 'Moderate', 'Dirty'] as VehicleCleanliness[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCleanliness(c)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    cleanliness === c
                      ? 'accent-bg border-transparent'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {tr(c === 'Moderate' ? 'Okay' : c)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              {tr('Fuel level')} ({fuelLevel}/8)
            </label>
            <span className="text-xs font-mono text-slate-900 dark:text-white font-semibold">
              {fuelLevel === 8 ? tr('Full tank') : fuelLevel === 4 ? tr('Half tank') : `${fuelLevel}/8 ${tr('tank')}`}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setFuelLevel(lvl)}
                className={`py-2 rounded-md font-mono font-semibold text-xs border transition-colors cursor-pointer ${
                  fuelLevel >= lvl
                    ? 'accent-bg border-transparent'
                    : 'bg-white dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {lvl}/8
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            {tr('9-point car check')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50/90 dark:bg-slate-800/40 p-3.5 rounded-lg">
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
                className="flex items-center gap-2.5 p-1.5 cursor-pointer text-xs text-slate-800 dark:text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={checklist[item.key as keyof typeof checklist]}
                  onChange={() => handleToggleChecklist(item.key as keyof typeof checklist)}
                  className="w-4 h-4 rounded"
                />
                <span>{tr(item.label)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
            {tr('Scratches or notes')}
          </label>
          <textarea
            rows={2}
            value={damageNotes}
            onChange={(e) => setDamageNotes(e.target.value)}
            placeholder={tr('Write down any scratches, dents, or missing items...')}
            className={inputCls}
          />
        </div>

        {inspectionType === 'return' && returnCalculation.total > 0 && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-lg space-y-1 text-rose-700 dark:text-rose-300 text-xs">
            <div className="font-semibold flex items-center justify-between">
              <span>{tr('Extra fee (km or fuel)')}:</span>
              <span className="font-mono text-sm">+{formatMoney(returnCalculation.total)}</span>
            </div>
            <div className="space-y-0.5">
              {returnCalculation.excessKm > 0 && (
                <p>
                  • {tr('Extra distance')}: {returnCalculation.excessKm} km = {formatMoney(returnCalculation.excessKmCharge)}
                </p>
              )}
              {returnCalculation.fuelCharge > 0 && (
                <p>
                  • {tr('Missing fuel')}: ~{returnCalculation.fuelDeficitLiters} L = {formatMoney(returnCalculation.fuelCharge)}
                </p>
              )}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2.5 p-3.5 bg-slate-50/90 dark:bg-slate-800/40 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            required
            checked={signatureConfirmed}
            onChange={(e) => setSignatureConfirmed(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-slate-800 dark:text-slate-200 text-xs">
            {tr('The guest checked the car and agrees with the fuel, km, and notes above.')}
          </span>
        </label>
      </ModalShell>
    </div>
  );
};
