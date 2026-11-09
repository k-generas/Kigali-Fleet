import React, { useState, useEffect } from 'react';
import { Vehicle, Driver, Booking } from '../types';
import { checkBookingCollision, calculateDays, formatRwf } from '../utils/collision';
import { X, ShieldAlert, ShieldCheck, Plane, AlertCircle, Compass, Sparkles, Receipt } from 'lucide-react';
import { ColorTheme } from '../theme';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  existingBookings: Booking[];
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
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('+250 78');
  const [flightNumber, setFlightNumber] = useState('');
  const [destination, setDestination] = useState('Kigali International Airport (KIA) -> Kigali Hotel');
  const [paymentMethod, setPaymentMethod] = useState<'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Credit Card'>('MTN Mobile Money');
  const [notes, setNotes] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Dynamic Pricing State (Part 9 Blueprint Item 5)
  const isUpcountryAuto = /musanze|akagera|volcanoes|rubavu|nyungwe|kivu|gisenyi|karongi/i.test(destination);
  const [isUpcountry, setIsUpcountry] = useState(isUpcountryAuto);
  const [isSafariPeak, setIsSafariPeak] = useState(false);
  const [includeVat, setIncludeVat] = useState(true);

  // Auto-detect upcountry destination when destination changes
  useEffect(() => {
    setIsUpcountry(/musanze|akagera|volcanoes|rubavu|nyungwe|kivu|gisenyi|karongi/i.test(destination));
  }, [destination]);

  // Auto-detect safari peak season (June-Sept, Dec)
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

  // Dynamic calculations
  const safariSurge = isSafariPeak ? Math.round(baseRental * 0.15) : 0;
  const upcountrySurge = isUpcountry ? days * 25000 : 0;
  const subtotalRwf = baseRental + safariSurge + upcountrySurge;
  const vatRwf = includeVat ? Math.round(subtotalRwf * 0.18) : 0;
  const totalRwf = subtotalRwf + vatRwf;

  // Real-time Collision Guard Check
  const collisionResult = checkBookingCollision(
    vehicleId,
    startDate,
    endDate,
    existingBookings
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (collisionResult.hasCollision) {
      setSubmissionError(collisionResult.conflictReason || 'Booking collision detected.');
      return;
    }

    if (!clientName || !clientPhone) {
      setSubmissionError('Please provide client name and phone number.');
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
      setSubmissionError(result.error || 'Failed to create booking.');
    }
  };

  const destinationPresets = [
    'Kigali International Airport (KIA) -> Kigali Hotel',
    'Kigali -> Musanze (Volcanoes NP Gorilla Trek)',
    'Kigali -> Akagera National Park (3-Day Safari)',
    'Kigali Convention Centre (KCC) VIP Shuttle',
    'Kigali -> Rubavu / Lake Kivu Serena',
  ];

  const flightPresets = ['WB 402 (RwandAir)', 'QR 1387 (Qatar)', 'ET 807 (Ethiopian)', 'SN 465 (Brussels)'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">Create Collision-Guarded Booking</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LOCKED INVENTORY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verifies vehicle physical inventory and prevents duplicate schedules down to the millisecond.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Collision Guard Alert Banner */}
        {collisionResult.hasCollision ? (
          <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-600/80 text-rose-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-rose-300">DOUBLE-BOOKING COLLISION BLOCKED</div>
              <p className="leading-relaxed">{collisionResult.conflictReason}</p>
              <p className="text-rose-400 text-[11px]">
                Please select another vehicle or choose alternative dates to protect agency inventory.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 flex items-center gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Inventory Clear:</strong> {selectedVehicle?.model_name} is 100% available for {startDate} to {endDate}.
            </span>
          </div>
        )}

        {submissionError && (
          <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-700 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Dates & Vehicle Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Pickup Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Return Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Duration & Total</label>
              <div className="h-10 bg-slate-950 border border-slate-800 rounded-lg px-3 flex items-center justify-between font-mono text-white">
                <span className="text-amber-400 font-bold">{days} {days === 1 ? 'Day' : 'Days'}</span>
                <span className="font-bold tabular-nums text-xs">{formatRwf(totalRwf)}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Select Fleet Vehicle ({vehicles.length} in fleet)
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-400 text-xs font-medium"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.model_name} [{v.plate_number}] — {formatRwf(v.daily_rate_rwf)}/day ({v.category})
                </option>
              ))}
            </select>
          </div>

          {/* Driver Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Assign Chauffeur ({drivers.length} registered)
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-400 text-xs font-medium"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phone}) · {d.language} · Rating: {d.rating} · Status: {d.status}
                </option>
              ))}
            </select>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Client Name / Organization</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Arthur Mugabo (UNDP)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Client Rwanda Phone / WhatsApp</label>
              <input
                type="text"
                required
                placeholder="+250 788 123 456"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-amber-400 font-mono outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Flight Number & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-amber-400" />
                <span>Flight Number (KIA Terminal)</span>
              </label>
              <input
                type="text"
                placeholder="WB 402 or QR 1387 (Optional)"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono uppercase outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-1 mt-1 overflow-x-auto text-[10px]">
                {flightPresets.map((fp) => (
                  <button
                    key={fp}
                    type="button"
                    onClick={() => setFlightNumber(fp.split(' ')[0] + ' ' + fp.split(' ')[1])}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white shrink-0"
                  >
                    {fp.split(' ')[0]} {fp.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Destination & Itinerary</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-1 mt-1 overflow-x-auto text-[10px]">
                {destinationPresets.slice(0, 2).map((dp) => (
                  <button
                    key={dp}
                    type="button"
                    onClick={() => setDestination(dp)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white truncate max-w-[130px]"
                  >
                    {dp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as 'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Credit Card'
                  )
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-400"
              >
                <option value="MTN Mobile Money">MTN Mobile Money (*182#)</option>
                <option value="Airtel Money">Airtel Money</option>
                <option value="Bank Transfer">Bank Transfer (BK / I&M)</option>
                <option value="Credit Card">Credit Card (Visa / Mastercard)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Rental Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. VIP client, roof rack needed, baby seat"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
              />
            </div>
          </div>

          {/* Dynamic Pricing & Seasonal Surcharges (Blueprint Part 9, Item 5) */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Dynamic Pricing & Seasonal Surcharges</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-semibold">
                RRA EBM v2.0 READY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSafariPeak}
                  onChange={(e) => setIsSafariPeak(e.target.checked)}
                  className="mt-0.5 rounded text-amber-400 focus:ring-0"
                />
                <div className="text-[11px]">
                  <div className="font-semibold text-white flex items-center gap-1">
                    <span>High Safari Season</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>
                  <div className="text-[10px] text-slate-400">+15% peak demand surge</div>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUpcountry}
                  onChange={(e) => setIsUpcountry(e.target.checked)}
                  className="mt-0.5 rounded text-amber-400 focus:ring-0"
                />
                <div className="text-[11px]">
                  <div className="font-semibold text-white">Upcountry Safari</div>
                  <div className="text-[10px] text-slate-400">+25,000 RWF / day per-diem</div>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  className="mt-0.5 rounded text-amber-400 focus:ring-0"
                />
                <div className="text-[11px]">
                  <div className="font-semibold text-white flex items-center gap-1">
                    <span>18% RRA VAT</span>
                    <Receipt className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400">EBM tax compliance invoice</div>
                </div>
              </label>
            </div>

            {/* Itemized Calculation Summary */}
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Base Rate ({days} days @ {formatRwf(dailyRate)}/day):</span>
                <span className="text-white">{formatRwf(baseRental)}</span>
              </div>
              {isSafariPeak && (
                <div className="flex justify-between text-amber-400">
                  <span>+ High Safari Peak Surcharge (+15%):</span>
                  <span>+{formatRwf(safariSurge)}</span>
                </div>
              )}
              {isUpcountry && (
                <div className="flex justify-between text-amber-400">
                  <span>+ Upcountry Safari Distance Allowance ({days} days):</span>
                  <span>+{formatRwf(upcountrySurge)}</span>
                </div>
              )}
              {includeVat && (
                <div className="flex justify-between text-emerald-400">
                  <span>+ Rwanda Revenue Authority VAT (18%):</span>
                  <span>+{formatRwf(vatRwf)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-white pt-1 border-t border-slate-800">
                <span>Grand Total to Collect:</span>
                <span className="text-amber-400 text-sm">{formatRwf(totalRwf)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Total to collect: <span className="font-bold text-white font-mono">{formatRwf(totalRwf)}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={collisionResult.hasCollision}
                className={`px-5 py-2.5 rounded-lg font-bold text-slate-950 transition-colors shadow-sm ${
                  collisionResult.hasCollision
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-400 hover:bg-amber-300'
                }`}
              >
                Confirm & Lock Booking
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
