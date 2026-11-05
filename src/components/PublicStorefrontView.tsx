import React, { useState } from 'react';
import { Vehicle, Driver, Booking, VehicleCategory } from '../types';
import {
  calculateDays,
  formatRwf,
  getAvailableVehiclesForClass,
  getCategoryAvailabilitySummary,
  checkBookingCollision,
} from '../utils/collision';
import { getCategoryBadge } from './CalendarTimelineView';
import {
  Calendar,
  Car,
  ShieldCheck,
  ShieldAlert,
  Plane,
  CheckCircle2,
  Users,
  Fuel,
  ArrowRight,
  ArrowLeft,
  Share2,
  ExternalLink,
  Phone,
  MessageSquare,
  Lock,
  Sparkles,
  Check,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface PublicStorefrontViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  currentTheme?: ColorTheme;
  onCompleteClientBooking: (
    booking: Omit<Booking, 'id' | 'created_at' | 'dispatch_status'>
  ) => { success: boolean; booking?: Booking; error?: string };
  onReturnToManager: (newBookingId?: string) => void;
}

export const PublicStorefrontView: React.FC<PublicStorefrontViewProps> = ({
  vehicles,
  drivers,
  bookings,
  currentTheme,
  onCompleteClientBooking,
  onReturnToManager,
}) => {
  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';
  const [copiedLive, setCopiedLive] = useState(false);

  const liveUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?tab=storefront`
    : 'https://kigalifleet.rw/rent/kigali-safari-express';

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Dates & Category
  const [startDate, setStartDate] = useState('2026-11-04');
  const [endDate, setEndDate] = useState('2026-11-07');
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('RAV4');

  // Step 2: Specific Vehicle & Itinerary
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [destination, setDestination] = useState('Kigali International Airport (KIA) -> Kigali Marriott');
  const [flightNumber, setFlightNumber] = useState('WB 402 (RwandAir)');

  // Step 3: Client Contact
  const [clientName, setClientName] = useState('Elizabeth Thorne (African Wildlife Foundation)');
  const [clientPhone, setClientPhone] = useState('+250 788 456 789');
  const [clientEmail, setClientEmail] = useState('e.thorne@awf-conservation.org');
  const [driverLanguagePref, setDriverLanguagePref] = useState<'EN/RW' | 'EN' | 'FR'>('EN/RW');
  const [specialRequests, setSpecialRequests] = useState('Require high clearance for Musanze gorilla trek trailhead.');

  // Step 4: Checkout
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState<'MTN Mobile Money' | 'Airtel Money' | 'Credit Card'>('MTN Mobile Money');
  const [momoNumber, setMomoNumber] = useState('+250 788 456 789');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Rental math
  const days = calculateDays(startDate, endDate);

  // Category availability query
  const categorySummaries = getCategoryAvailabilitySummary(startDate, endDate, vehicles, bookings);
  const selectedSummary = categorySummaries.find((s) => s.category === selectedCategory);

  // Available vehicles for chosen category
  const availableVehicles = getAvailableVehiclesForClass(selectedCategory, startDate, endDate, vehicles, bookings);

  // Choose default vehicle when category changes
  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || availableVehicles[0];

  const dailyRate = activeVehicle ? activeVehicle.daily_rate_rwf : selectedSummary?.lowestDailyRateRwf || 100000;
  const totalRwf = days * dailyRate;
  const depositRwf = Math.round(totalRwf * 0.3);
  const amountToPayNow = paymentOption === 'deposit' ? depositRwf : totalRwf;

  const handleSelectCategory = (cat: VehicleCategory) => {
    setSelectedCategory(cat);
    const available = getAvailableVehiclesForClass(cat, startDate, endDate, vehicles, bookings);
    if (available.length > 0) {
      setSelectedVehicleId(available[0].id);
    } else {
      setSelectedVehicleId('');
    }
  };

  const handleProceedToStep2 = () => {
    if (availableVehicles.length === 0) return;
    if (!selectedVehicleId && availableVehicles.length > 0) {
      setSelectedVehicleId(availableVehicles[0].id);
    }
    setStep(2);
  };

  const handleConfirmReservation = () => {
    if (!activeVehicle) return;
    setIsProcessing(true);
    setSubmissionError(null);

    // Pick an available driver that has no conflict
    const availableDriver = drivers.find((d) => d.status === 'Available') || drivers[0];

    const res = onCompleteClientBooking({
      client_name: clientName,
      client_phone: clientPhone,
      client_email: clientEmail,
      vehicle_id: activeVehicle.id,
      driver_id: availableDriver.id,
      start_date: startDate,
      end_date: endDate,
      total_rwf: totalRwf,
      destination,
      flight_number: flightNumber || undefined,
      flight_status: flightNumber ? 'Scheduled' : undefined,
      status: 'Confirmed',
      payment_status: paymentOption === 'deposit' ? 'Deposit Paid (MoMo)' : 'Fully Paid',
      payment_method: paymentMethod,
      notes: specialRequests,
    });

    setTimeout(() => {
      setIsProcessing(false);
      if (res.success && res.booking) {
        setConfirmedBooking(res.booking);
        setStep(4);
      } else {
        setSubmissionError(res.error || 'Failed to complete booking.');
      }
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Simulation Browser Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-slate-400 font-medium shrink-0">Live Working Link:</span>
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 min-w-0">
            <span className="font-mono truncate max-w-xs sm:max-w-md" style={{ color: activeThemeColor }}>
              {liveUrl}
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(liveUrl);
                setCopiedLive(true);
                setTimeout(() => setCopiedLive(false), 2000);
              }}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 shrink-0 font-sans"
              title="Copy active storefront link"
            >
              {copiedLive ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={() => onReturnToManager(confirmedBooking?.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors self-start sm:self-auto shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Agency Dashboard</span>
        </button>
      </div>

      {/* Brand Hero for Clients */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3 relative overflow-hidden shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: activeThemeColor }}>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Guaranteed Physical Inventory · Kigali, Rwanda</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Reserve 4x4 SUVs, VIP Chauffeurs & Airport Transfers
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
          Collision-guarded live booking for international delegations, NGOs, and tourists. Instant Rwandan Franc (RWF) calculation with zero double-booking risk.
        </p>

        {/* Step Indicators */}
        <div className="pt-4 flex items-center gap-2 sm:gap-4 text-xs font-semibold">
          <div
            className="flex items-center gap-1.5"
            style={{ color: step >= 1 ? activeThemeColor : '#64748b' }}
          >
            <span
              className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold"
              style={step >= 1 ? { backgroundColor: `${activeThemeColor}20` } : { backgroundColor: '#1e293b' }}
            >
              1
            </span>
            <span>Dates & Class</span>
          </div>
          <span className="text-slate-600">→</span>
          <div
            className="flex items-center gap-1.5"
            style={{ color: step >= 2 ? activeThemeColor : '#64748b' }}
          >
            <span
              className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold"
              style={step >= 2 ? { backgroundColor: `${activeThemeColor}20` } : { backgroundColor: '#1e293b' }}
            >
              2
            </span>
            <span>Vehicle & Flight</span>
          </div>
          <span className="text-slate-600">→</span>
          <div
            className="flex items-center gap-1.5"
            style={{ color: step >= 3 ? activeThemeColor : '#64748b' }}
          >
            <span
              className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold"
              style={step >= 3 ? { backgroundColor: `${activeThemeColor}20` } : { backgroundColor: '#1e293b' }}
            >
              3
            </span>
            <span>Checkout</span>
          </div>
        </div>
      </div>

      {/* WIZARD STEP 1: Dates & Vehicle Class */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Date Selector Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Select Rental Window</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Duration: <strong className="text-amber-400">{days} {days === 1 ? 'Day' : 'Days'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pickup Date (Kigali)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Return Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Class Selection with Live Collision Query */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Choose Vehicle Class</h3>
                <p className="text-xs text-slate-400">
                  Live inventory query: locks selections down to the millisecond to eliminate double bookings.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">Live Inventory Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorySummaries.map((catSummary) => {
                const badge = getCategoryBadge(catSummary.category);
                const IconComp = badge.icon;
                const isSelected = selectedCategory === catSummary.category;
                const isAvailable = catSummary.hasInventory;
                const estTotal = catSummary.lowestDailyRateRwf * days;

                return (
                  <div
                    key={catSummary.category}
                    onClick={() => isAvailable && handleSelectCategory(catSummary.category)}
                    className={`rounded-xl p-5 border transition-all flex flex-col justify-between ${
                      !isAvailable
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-65 cursor-not-allowed'
                        : isSelected
                        ? 'bg-slate-900 border-2 border-amber-400 shadow-md shadow-amber-500/10 cursor-pointer'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold border ${badge.badgeClass}`}>
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>

                        {isAvailable ? (
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{catSummary.availableCount} Available</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1 font-bold">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Sold Out</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-xs text-slate-400">Daily from</div>
                        <div className="text-lg font-bold text-white font-mono tabular-nums">
                          {formatRwf(catSummary.lowestDailyRateRwf)}
                        </div>
                        <div className="text-xs text-amber-400 font-mono mt-0.5">
                          Total for {days} days: {formatRwf(estTotal)}
                        </div>
                      </div>

                      {!isAvailable && (
                        <div className="p-2 rounded bg-rose-950/60 border border-rose-800/60 text-[11px] text-rose-300 leading-snug">
                          Collision Guard locked: All vehicles in this class are booked for {startDate} to {endDate}.
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {isAvailable ? 'Instant confirmation' : 'Try alternative dates'}
                      </span>
                      {isAvailable && (
                        <span
                          className="font-bold"
                          style={{ color: isSelected ? activeThemeColor : '#94a3b8' }}
                        >
                          {isSelected ? 'Selected ✓' : 'Select'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Selected: <strong className="text-white">{selectedCategory}</strong> · Estimated Total:{' '}
              <strong className="font-mono text-sm font-bold" style={{ color: activeThemeColor }}>
                {formatRwf(totalRwf)}
              </strong>
            </div>

            <button
              onClick={handleProceedToStep2}
              disabled={availableVehicles.length === 0}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 ${
                availableVehicles.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : activeBtnText
              }`}
              style={availableVehicles.length > 0 ? { backgroundColor: activeThemeColor } : undefined}
            >
              <span>Next: Vehicle & Itinerary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* WIZARD STEP 2: Choose Physical Car, Flight & Itinerary */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Select Your Physical Fleet Vehicle</h3>
                <p className="text-xs text-slate-400">
                  Exact car plate assigned and locked in our Kigali central database.
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs hover:underline flex items-center gap-1 font-semibold"
                style={{ color: activeThemeColor }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Class/Dates</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableVehicles.map((vehicle) => {
                const isSelected = (activeVehicle?.id || '') === vehicle.id;

                return (
                  <div
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-slate-950 border-2 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                    style={isSelected ? { borderColor: activeThemeColor } : undefined}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold" style={{ color: activeThemeColor }}>
                          {vehicle.plate_number}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{vehicle.model_name}</h4>
                      </div>
                      <span className="font-mono text-xs font-bold text-white">
                        {formatRwf(vehicle.daily_rate_rwf)}/d
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{vehicle.seating_capacity} Seats</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-slate-400" />
                        <span>{vehicle.fuel_type} ({vehicle.transmission})</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-emerald-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span>✓ 100% Guaranteed Available</span>
                      <span className="font-bold">{isSelected ? 'Selected' : 'Choose this vehicle'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flight & Mission Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plane className="w-5 h-5 text-amber-400" />
              <span>Kigali Airport & Mission Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Flight Arrival Number (Kigali Terminal / KIA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. WB 402, QR 1387, ET 807, or SN 465"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono uppercase outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Our system auto-tracks flight delays so your chauffeur never leaves you stranded.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination / Itinerary</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  e.g. Volcanoes National Park, Akagera Safari, or Kigali Convention Centre.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white"
            >
              ← Back to Dates
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-sm"
            >
              <span>Next: Client Details & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* WIZARD STEP 3: Client Info & Checkout Simulation */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Client Info & Payment Method */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Client Identification & WhatsApp Contact</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Full Name / Organization Name
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        WhatsApp Phone Number (for Driver Itinerary)
                      </label>
                      <input
                        type="text"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-400 font-mono outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Chauffeur Language</label>
                      <select
                        value={driverLanguagePref}
                        onChange={(e) => setDriverLanguagePref(e.target.value as 'EN/RW' | 'EN' | 'FR')}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                      >
                        <option value="EN/RW">English & Kinyarwanda</option>
                        <option value="EN">English Only</option>
                        <option value="FR">French</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Special Notes</label>
                      <input
                        type="text"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Luggage count, baby seats, route timing..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Rwanda Payment Gateway & MoMo Checkout</span>
                </h3>

                {/* Deposit Option vs Full Payment */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('deposit')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      paymentOption === 'deposit'
                        ? 'bg-slate-950 border-2 text-white shadow-xs'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                    style={paymentOption === 'deposit' ? { borderColor: activeThemeColor } : undefined}
                  >
                    <div className="font-bold text-xs">30% Inventory Lock Deposit</div>
                    <div className="font-mono font-bold mt-1" style={{ color: activeThemeColor }}>
                      {formatRwf(depositRwf)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Pay balance at vehicle delivery</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption('full')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      paymentOption === 'full'
                        ? 'bg-slate-950 border-2 text-white shadow-xs'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                    style={paymentOption === 'full' ? { borderColor: activeThemeColor } : undefined}
                  >
                    <div className="font-bold text-xs">100% Full Payment</div>
                    <div className="font-mono text-emerald-400 font-bold mt-1">
                      {formatRwf(totalRwf)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Includes instant VAT invoice</div>
                  </button>
                </div>

                {/* Gateway channels */}
                <div className="space-y-3 text-xs">
                  <label className="block text-slate-300 font-semibold">Select Payment Channel:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['MTN Mobile Money', 'Airtel Money', 'Credit Card'].map((meth) => (
                      <button
                        key={meth}
                        type="button"
                        onClick={() => setPaymentMethod(meth as any)}
                        className={`p-2.5 rounded-lg border font-semibold text-center transition-all ${
                          paymentMethod === meth
                            ? 'bg-slate-800 border-amber-400 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {meth === 'MTN Mobile Money' ? 'MTN MoMo (*182#)' : meth}
                      </button>
                    ))}
                  </div>

                  {paymentMethod.includes('Money') && (
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                      <label className="block text-slate-400 text-[11px]">Rwanda MoMo Phone Number</label>
                      <input
                        type="text"
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-amber-400 font-mono text-xs outline-none"
                      />
                      <span className="text-[10px] text-slate-500">
                        A USSD prompt will be sent to your phone to authorize {formatRwf(amountToPayNow)}.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Transparent Pricing Ledger & Checkout Button */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 sticky top-20 shadow-md">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  Reservation Summary
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Vehicle:</span>
                    <span className="text-white font-semibold text-right">{activeVehicle?.model_name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Assigned Plate:</span>
                    <span className="text-amber-400 font-mono font-bold">{activeVehicle?.plate_number}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Dates:</span>
                    <span className="text-white font-mono">{startDate} → {endDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Duration:</span>
                    <span className="text-white font-mono">{days} {days === 1 ? 'Day' : 'Days'}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Daily rate:</span>
                      <span className="font-mono text-white">{formatRwf(dailyRate)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Rental:</span>
                      <span className="font-mono text-white font-bold">{formatRwf(totalRwf)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Roadside Rescue:</span>
                      <span className="text-emerald-400 font-semibold">Included</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-white">Amount Due Now:</span>
                    <span className="text-lg font-bold font-mono tabular-nums" style={{ color: activeThemeColor }}>
                      {formatRwf(amountToPayNow)}
                    </span>
                  </div>
                </div>

                {submissionError && (
                  <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg">
                    {submissionError}
                  </div>
                )}

                <button
                  onClick={handleConfirmReservation}
                  disabled={isProcessing}
                  className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  {isProcessing ? (
                    <span>Securing Physical Inventory...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Lock Reservation & Checkout</span>
                    </>
                  )}
                </button>

                <div className="text-[10px] text-slate-400 text-center leading-relaxed">
                  🔒 Zero-collision guarantee. Physical inventory is locked immediately in the Rwanda dispatch ledger.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WIZARD STEP 4: Success Voucher & Instant Confirmation */}
      {step === 4 && confirmedBooking && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Reservation Confirmed & Locked!
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Your physical vehicle inventory is confirmed and locked down to the millisecond in the KigaliFleet central dispatch system.
            </p>
          </div>

          {/* Voucher Card */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Booking Reference</span>
                <div className="font-mono text-sm font-bold text-amber-400">#{confirmedBooking.id}</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold">
                GUARANTEED PHYSICAL INVENTORY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px]">Client / Organization</span>
                <div className="font-bold text-white mt-0.5">{confirmedBooking.client_name}</div>
                <div className="text-slate-400 font-mono text-[11px]">{confirmedBooking.client_phone}</div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px]">Vehicle & Assigned Plate</span>
                <div className="font-bold text-white mt-0.5">{activeVehicle?.model_name}</div>
                <div className="text-amber-400 font-mono font-bold text-xs">{activeVehicle?.plate_number}</div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px]">Pickup & Return Dates</span>
                <div className="font-mono text-white mt-0.5">
                  {confirmedBooking.start_date} → {confirmedBooking.end_date} ({days} Days)
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px]">Total Ledger Amount</span>
                <div className="font-mono text-emerald-400 font-bold text-sm mt-0.5">
                  {formatRwf(confirmedBooking.total_rwf)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{confirmedBooking.payment_status}</div>
              </div>
            </div>

            {confirmedBooking.flight_number && (
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5" />
                  <span>Flight: {confirmedBooking.flight_number}</span>
                </span>
                <span className="text-emerald-400 font-semibold">KIA Terminal Sync Active</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onReturnToManager(confirmedBooking.id)}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 ${activeBtnText}`}
              style={{ backgroundColor: activeThemeColor }}
            >
              <span>View this Booking in Agency Dispatch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setStep(1);
                setConfirmedBooking(null);
              }}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white"
            >
              Book Another Vehicle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
