import React, { useState, useEffect } from 'react';
import { Vehicle, Driver, Booking, MaintenanceRecord } from '../types';
import { checkBookingCollision, calculateDays, formatRwf, datesOverlap } from '../utils/collision';
import { formatHumanDate } from '../utils/dates';
import { ShieldAlert, ShieldCheck, AlertCircle, Wrench } from 'lucide-react';
import { ColorTheme } from '../theme';
import { useI18n } from '../utils/i18n';
import { ModalShell } from './ModalShell';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  existingBookings: Booking[];
  maintenance?: MaintenanceRecord[];
  onSubmitBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'dispatch_status'>) => {
    success: boolean;
    error?: string;
  };
  initialVehicleId?: string;
  initialDate?: string;
  currentTheme?: ColorTheme;
}

const inputCls =
  'w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  drivers,
  existingBookings,
  maintenance = [],
  onSubmitBooking,
  initialVehicleId,
  initialDate,
}) => {
  const { formatMoney, tr } = useI18n();
  const defaultStartDate = initialDate || '2026-11-04';
  const defaultEndDate = initialDate || '2026-11-07';

  const [vehicleId, setVehicleId] = useState(initialVehicleId || vehicles[0]?.id || '');
  const [driverId, setDriverId] = useState(drivers[0]?.id || '');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [clientName, setClientName] = useState('');
  const [clientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('+250 78');
  const [flightNumber, setFlightNumber] = useState('');
  const [destination, setDestination] = useState('Kigali Airport -> Kigali Hotel');
  const [paymentMethod, setPaymentMethod] = useState<'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Credit Card'>('MTN Mobile Money');
  const [notes, setNotes] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const isUpcountryAuto = /musanze|akagera|volcanoes|rubavu|nyungwe|kivu|gisenyi|karongi/i.test(destination);
  const [isUpcountry, setIsUpcountry] = useState(isUpcountryAuto);
  const [isSafariPeak, setIsSafariPeak] = useState(false);
  const [includeVat, setIncludeVat] = useState(true);

  useEffect(() => {
    setIsUpcountry(/musanze|akagera|volcanoes|rubavu|nyungwe|kivu|gisenyi|karongi/i.test(destination));
  }, [destination]);

  useEffect(() => {
    if (startDate) {
      const month = parseInt(startDate.split('-')[1], 10);
      if ([6, 7, 8, 9, 12].includes(month)) {
        setIsSafariPeak(true);
      }
    }
  }, [startDate]);

  useEffect(() => {
    if (initialVehicleId) setVehicleId(initialVehicleId);
    if (initialDate) {
      setStartDate(initialDate);
      setEndDate(initialDate);
    }
  }, [initialVehicleId, initialDate]);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const days = calculateDays(startDate, endDate);
  const dailyRate = selectedVehicle?.daily_rate_rwf || 0;
  const baseRental = days * dailyRate;

  const safariSurge = isSafariPeak ? Math.round(baseRental * 0.15) : 0;
  const upcountrySurge = isUpcountry ? days * 25000 : 0;
  const subtotalRwf = baseRental + safariSurge + upcountrySurge;
  const vatRwf = includeVat ? Math.round(subtotalRwf * 0.18) : 0;
  const totalRwf = subtotalRwf + vatRwf;

  const collisionResult = checkBookingCollision(
    vehicleId,
    startDate,
    endDate,
    existingBookings,
    undefined,
    maintenance
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (collisionResult.hasCollision) {
      setSubmissionError(collisionResult.conflictReason || 'This car is already booked for those dates.');
      return;
    }

    if (!clientName || !clientPhone) {
      setSubmissionError('Please enter the customer name and phone number.');
      return;
    }

    const result = onSubmitBooking({
      client_name: clientName,
      client_email: clientEmail || `${clientName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
      client_phone: clientPhone,
      vehicle_id: vehicleId,
      driver_id: driverId,
      start_date: startDate,
      end_date: endDate,
      total_rwf: totalRwf,
      flight_number: flightNumber || undefined,
      flight_status: flightNumber ? 'Scheduled' : undefined,
      destination,
      status: 'Confirmed',
      payment_status: 'Deposit Paid (MoMo)',
      payment_method: paymentMethod,
      notes,
    });

    if (result.success) {
      onClose();
    } else {
      setSubmissionError(result.error || 'Could not save booking.');
    }
  };

  const destinationPresets = [
    'Kigali Airport -> Kigali Hotel',
    'Kigali -> Musanze (Volcanoes Park)',
    'Kigali -> Akagera Park (3 Days)',
    'Kigali Convention Centre',
    'Kigali -> Lake Kivu',
  ];

  const flightPresets = ['WB 402', 'QR 1387', 'ET 807', 'SN 465'];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      asForm
      onSubmit={handleSubmit}
      maxWidthClass="max-w-2xl"
      title={tr('New Booking')}
      subtitle={tr('Checks automatically so two people never book the same car on the same day.')}
      bodyClassName="px-5 sm:px-6 py-5 space-y-4 text-sm"
      footer={
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Car, {days} {days === 1 ? 'day' : 'days'} at {formatMoney(dailyRate)}
            </span>
            <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">{formatMoney(baseRental)}</span>
          </div>
          {isSafariPeak && (
            <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400">
              <span>{tr('Busy Season')} (+15%)</span>
              <span className="font-mono tabular-nums">+{formatMoney(safariSurge)}</span>
            </div>
          )}
          {isUpcountry && (
            <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400">
              <span>
                {tr('Outside Kigali')} ({days} {days === 1 ? 'day' : 'days'})
              </span>
              <span className="font-mono tabular-nums">+{formatMoney(upcountrySurge)}</span>
            </div>
          )}
          {includeVat && (
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>VAT 18%</span>
              <span className="font-mono tabular-nums">+{formatMoney(vatRwf)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-slate-900 dark:text-white pt-2 mt-1 border-t border-slate-200/80 dark:border-slate-800">
            <span>{tr('Total')}</span>
            <span className="font-mono tabular-nums">{formatMoney(totalRwf)}</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {tr('Cancel')}
            </button>
            <button
              type="submit"
              disabled={collisionResult.hasCollision}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-opacity ${
                collisionResult.hasCollision
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'accent-bg hover:opacity-95'
              }`}
            >
              Create booking
            </button>
          </div>
        </div>
      }
    >
          {/* Availability Banner */}
          {collisionResult.hasCollision ? (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold">Car already booked</div>
                <p className="text-xs">{collisionResult.conflictReason}</p>
                <p className="text-xs opacity-90">Pick another car or change the dates below.</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                <strong className="font-semibold">Car is free:</strong> {selectedVehicle?.model_name} is open{' '}
                {formatHumanDate(startDate)} to {formatHumanDate(endDate)}.
              </span>
            </div>
          )}

          {submissionError && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* Dates & Car */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                {tr('Pickup Date')}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                {tr('Return Date')} ({tr(`${days} ${days === 1 ? 'day' : 'days'}`)})
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Choose car ({vehicles.length})
              </label>
              {selectedVehicle?.status === 'Maintenance' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>In repair</span>
                </span>
              )}
            </div>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className={inputCls}
            >
              {vehicles.map((v) => {
                const isGrounded =
                  v.status === 'Maintenance' ||
                  maintenance.some(
                    (m) =>
                      m.vehicle_id === v.id &&
                      m.status !== 'Completed' &&
                      datesOverlap(startDate, endDate, m.start_date, m.expected_completion_date || m.start_date)
                  );
                return (
                  <option key={v.id} value={v.id}>
                    {v.model_name}, {v.plate_number} — {formatRwf(v.daily_rate_rwf)}/day
                    {isGrounded ? ' [In repair]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Choose driver ({drivers.length})
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className={inputCls}
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phone}) · {d.language} · {d.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Customer name</label>
              <input
                type="text"
                required
                placeholder="e.g. Jean Paul or Sarah"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Phone or WhatsApp</label>
              <input
                type="text"
                required
                placeholder="+250 788 123 456"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Flight (optional)
              </label>
              <input
                type="text"
                placeholder="WB 402 or QR 1387"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className={`${inputCls} font-mono`}
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {flightPresets.map((fp) => (
                  <button
                    key={fp}
                    type="button"
                    onClick={() => setFlightNumber(fp)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs font-mono text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {fp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Where are they going?</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={inputCls}
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {destinationPresets.slice(0, 3).map((dp) => (
                  <button
                    key={dp}
                    type="button"
                    onClick={() => setDestination(dp)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                  >
                    {dp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Payment method</label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as 'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Credit Card'
                  )
                }
                className={inputCls}
              >
                <option value="MTN Mobile Money">MTN Mobile Money</option>
                <option value="Airtel Money">Airtel Money</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Bank Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. Baby seat or roof rack"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Extras</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSafariPeak}
                  onChange={(e) => setIsSafariPeak(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">{tr('Busy Season')}</div>
                  <div className="text-slate-500 dark:text-slate-400">+15%</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUpcountry}
                  onChange={(e) => setIsUpcountry(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">{tr('Outside Kigali')}</div>
                  <div className="text-slate-500 dark:text-slate-400">
                    +{formatMoney(25000)} per day
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">{tr('18% Tax (VAT)')}</div>
                  <div className="text-slate-500 dark:text-slate-400">{tr('Official receipt')}</div>
                </div>
              </label>
            </div>
          </div>
    </ModalShell>
  );
};
