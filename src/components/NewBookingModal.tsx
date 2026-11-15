import React, { useState, useEffect } from 'react';
import { Vehicle, Driver, Booking, MaintenanceRecord } from '../types';
import { checkBookingCollision, calculateDays, formatRwf, datesOverlap } from '../utils/collision';
import { X, ShieldAlert, ShieldCheck, Plane, AlertCircle, Compass, Receipt, Wrench } from 'lucide-react';
import { ColorTheme } from '../theme';

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
  currentTheme,
}) => {
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

  if (!isOpen) return null;

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

  const activeThemeColor = currentTheme?.hex || '#635bff';
  const activeBtnText = currentTheme?.btnText || 'text-white';

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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#0a2540] dark:text-white">Book a Car</h2>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              Checks automatically so two people never book the same car on the same day.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Availability Banner */}
        {collisionResult.hasCollision ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700 text-rose-900 dark:text-rose-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <div className="font-bold">Car Already Booked</div>
              <p className="leading-relaxed">{collisionResult.conflictReason}</p>
              <p className="text-rose-700 dark:text-rose-300 text-xs">
                Pick another car or change the dates above.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Car is Free:</strong> {selectedVehicle?.model_name} is open from {startDate} to {endDate}.
            </span>
          </div>
        )}

        {submissionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Dates & Price Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Pickup Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Return Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Days & Total</label>
              <div className="h-[44px] bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 flex items-center justify-between font-mono text-[#0a2540] dark:text-white">
                <span className="font-bold" style={{ color: activeThemeColor }}>
                  {days} {days === 1 ? 'Day' : 'Days'}
                </span>
                <span className="font-bold tabular-nums">{formatRwf(totalRwf)}</span>
              </div>
            </div>
          </div>

          {/* Car */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold">
                Choose Car ({vehicles.length})
              </label>
              {selectedVehicle?.status === 'Maintenance' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>In Repair</span>
                </span>
              )}
            </div>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white outline-none focus:border-indigo-500 font-medium"
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
                    {v.model_name} ({v.plate_number}) — {formatRwf(v.daily_rate_rwf)}/day
                    {isGrounded ? ' [In Repair]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">
              Choose Driver ({drivers.length})
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white outline-none focus:border-indigo-500 font-medium"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phone}) · {d.language} · {d.status}
                </option>
              ))}
            </select>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Customer Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Jean Paul or Sarah"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Phone or WhatsApp</label>
              <input
                type="text"
                required
                placeholder="+250 788 123 456"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Flight & Trip Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5 flex items-center gap-1.5">
                <Plane className="w-4 h-4" style={{ color: activeThemeColor }} />
                <span>Flight Number (optional)</span>
              </label>
              <input
                type="text"
                placeholder="WB 402 or QR 1387"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-mono uppercase outline-none focus:border-indigo-500"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
                {flightPresets.map((fp) => (
                  <button
                    key={fp}
                    type="button"
                    onClick={() => setFlightNumber(fp)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white shrink-0 font-medium"
                  >
                    {fp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Where are they going?</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white outline-none focus:border-indigo-500"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
                {destinationPresets.slice(0, 2).map((dp) => (
                  <button
                    key={dp}
                    type="button"
                    onClick={() => setDestination(dp)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white truncate max-w-[160px]"
                  >
                    {dp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as 'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Credit Card'
                  )
                }
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white outline-none focus:border-indigo-500"
              >
                <option value="MTN Mobile Money">MTN Mobile Money</option>
                <option value="Airtel Money">Airtel Money</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Bank Card</option>
              </select>
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1.5">Notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. Baby seat or roof rack"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Price Options */}
          <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-sm font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4" style={{ color: activeThemeColor }} />
              <span>Extra Trip Options</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSafariPeak}
                  onChange={(e) => setIsSafariPeak(e.target.checked)}
                  className="mt-1 rounded"
                />
                <div className="text-xs">
                  <div className="font-semibold text-[#0a2540] dark:text-white">Busy Season</div>
                  <div className="text-[#425466] dark:text-slate-400">+15% extra</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUpcountry}
                  onChange={(e) => setIsUpcountry(e.target.checked)}
                  className="mt-1 rounded"
                />
                <div className="text-xs">
                  <div className="font-semibold text-[#0a2540] dark:text-white">Outside Kigali</div>
                  <div className="text-[#425466] dark:text-slate-400">+25,000 RWF / day</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  className="mt-1 rounded"
                />
                <div className="text-xs">
                  <div className="font-semibold text-[#0a2540] dark:text-white flex items-center gap-1">
                    <span>18% Tax (VAT)</span>
                    <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-[#425466] dark:text-slate-400">Official receipt</div>
                </div>
              </label>
            </div>

            {/* Price Breakdown */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-[#425466] dark:text-slate-400">
                <span>Car price ({days} days × {formatRwf(dailyRate)}):</span>
                <span className="text-[#0a2540] dark:text-white font-semibold">{formatRwf(baseRental)}</span>
              </div>
              {isSafariPeak && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Busy season (+15%):</span>
                  <span>+{formatRwf(safariSurge)}</span>
                </div>
              )}
              {isUpcountry && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Driver outside Kigali ({days} days):</span>
                  <span>+{formatRwf(upcountrySurge)}</span>
                </div>
              )}
              {includeVat && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>18% Tax (VAT):</span>
                  <span>+{formatRwf(vatRwf)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#0a2540] dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total Price:</span>
                <span style={{ color: activeThemeColor }}>{formatRwf(totalRwf)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-sm text-[#425466] dark:text-slate-400">
              Total: <strong className="font-bold text-[#0a2540] dark:text-white font-mono">{formatRwf(totalRwf)}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full text-sm font-semibold text-[#425466] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={collisionResult.hasCollision}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-xs ${
                  collisionResult.hasCollision
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : activeBtnText
                }`}
                style={!collisionResult.hasCollision ? { backgroundColor: activeThemeColor } : undefined}
              >
                Save Booking
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
