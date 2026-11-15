import React, { useState } from 'react';
import { Booking, Driver, Vehicle } from '../types';
import { generateDriverSMS, generateFlightDelaySMS } from '../utils/collision';
import {
  MessageSquare,
  Plane,
  Phone,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface AfricasTalkingSimulatorProps {
  bookings: Booking[];
  drivers: Driver[];
  vehicles: Vehicle[];
  currentTheme?: ColorTheme;
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
}

export const AfricasTalkingSimulator: React.FC<AfricasTalkingSimulatorProps> = ({
  bookings,
  drivers,
  vehicles,
  currentTheme,
  onDispatchSMS,
  onAdvanceCheckin,
  onUpdateFlightStatus,
}) => {
  const activeThemeColor = currentTheme?.hex || '#635bff';
  const activeBookings = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'In Progress');
  const [selectedBookingId, setSelectedBookingId] = useState<string>(activeBookings[0]?.id || bookings[0]?.id || '');
  const [ussdInput, setUssdInput] = useState('*134#');
  const [ussdResponse, setUssdResponse] = useState<string | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(45);
  const [customLanguage, setCustomLanguage] = useState<'AUTO' | 'RW' | 'EN'>('AUTO');

  const currentBooking = bookings.find((b) => b.id === selectedBookingId) || activeBookings[0] || bookings[0];
  const currentDriver = currentBooking ? drivers.find((d) => d.id === currentBooking.driver_id) : null;
  const currentVehicle = currentBooking ? vehicles.find((v) => v.id === currentBooking.vehicle_id) : null;

  const effectiveLang: 'RW' | 'EN' =
    customLanguage === 'AUTO'
      ? currentDriver?.language === 'RW'
        ? 'RW'
        : 'RW'
      : customLanguage;

  const smsPayload =
    currentBooking && currentDriver && currentVehicle
      ? generateDriverSMS({
          driver: currentDriver,
          vehicle: currentVehicle,
          booking: currentBooking,
          language: effectiveLang,
        })
      : null;

  const flightDelayPayload =
    currentBooking && currentDriver
      ? generateFlightDelaySMS({
          driver: currentDriver,
          booking: currentBooking,
          delayMinutes,
          language: effectiveLang,
        })
      : null;

  const handleSimulateUSSD = () => {
    setUssdResponse('Dialing *134#...');
    setTimeout(() => {
      if (currentBooking) {
        onAdvanceCheckin(currentBooking.id);
        setUssdResponse(
          `Murakoze ${currentDriver?.name || 'Driver'}.\nTrip #${currentBooking.id.slice(-4)} confirmed.\nCar: ${currentVehicle?.plate_number}.\nPickup: Kigali Airport.`
        );
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <Radio className="w-4 h-4" />
              <span>Driver Text & Phone Line Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white tracking-tight">
              Driver Text & Phone Demo
            </h2>
            <p className="text-base text-[#425466] dark:text-slate-300 max-w-2xl">
              Send trip texts to your driver in Kinyarwanda or English, and test how drivers check in with *134# with zero internet.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#f6f9fc] dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm shrink-0">
            <div>
              <div className="text-[#425466] dark:text-slate-400">Phone Line</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold">MTN / Airtel Ready</div>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div>
              <div className="text-[#425466] dark:text-slate-400">Speed</div>
              <div className="text-[#0a2540] dark:text-white font-mono font-bold">Under 3 sec</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trip Picker */}
      <div className="space-y-2 text-sm">
        <div className="text-[#425466] dark:text-slate-400 font-bold">Pick a Trip:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeBookings.map((b) => {
            const isSelected = (currentBooking?.id || '') === b.id;
            const v = vehicles.find((veh) => veh.id === b.vehicle_id);

            return (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBookingId(b.id);
                  setUssdResponse(null);
                }}
                className={`w-full px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-between gap-2 border min-w-0 ${
                  isSelected
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-[#0a2540] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
                style={isSelected ? { backgroundColor: activeThemeColor } : undefined}
              >
                <span className="truncate">{b.client_name}</span>
                <span className="font-mono text-xs opacity-90 shrink-0">({v?.plate_number || 'Car'})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: SMS & Flight Delay */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Send Text to Driver */}
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  Send Text to Driver
                </h3>
              </div>
              <span className="text-sm font-semibold px-3 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                SMS Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[#425466] dark:text-slate-400 font-semibold">Driver</span>
                <div className="font-bold text-[#0a2540] dark:text-white mt-0.5">{currentDriver?.name || 'Not picked'}</div>
                <div className="text-amber-700 dark:text-amber-400 font-mono">{currentDriver?.phone}</div>
              </div>

              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[#425466] dark:text-slate-400 font-semibold">Car</span>
                <div className="font-bold text-[#0a2540] dark:text-white mt-0.5">{currentVehicle?.model_name}</div>
                <div className="text-amber-700 dark:text-amber-400 font-mono font-bold">{currentVehicle?.plate_number}</div>
              </div>
            </div>

            <div>
              <label className="block text-[#0a2540] dark:text-slate-200 text-sm font-bold mb-2">
                Text Language:
              </label>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {[
                  { id: 'AUTO' as const, label: 'Auto' },
                  { id: 'RW' as const, label: 'Kinyarwanda' },
                  { id: 'EN' as const, label: 'English' },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setCustomLanguage(lang.id)}
                    className={`py-2.5 px-3 rounded-full font-bold border transition-all ${
                      customLanguage === lang.id
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-[#f6f9fc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-300'
                    }`}
                    style={customLanguage === lang.id ? { backgroundColor: activeThemeColor } : undefined}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-semibold text-[#425466] dark:text-slate-400">
                Message Preview
              </div>
              <div className="p-4 bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-[#0a2540] dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {smsPayload?.messageText}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-sm text-[#425466] dark:text-slate-400">
                Status:{' '}
                <strong className="text-amber-700 dark:text-amber-400">
                  {currentBooking?.dispatch_status || 'Not Sent'}
                </strong>
              </span>

              <button
                onClick={() => currentBooking && onDispatchSMS(currentBooking.id, effectiveLang)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full text-white transition-opacity hover:opacity-95 shadow-sm"
                style={{ backgroundColor: activeThemeColor }}
              >
                <Send className="w-4 h-4" />
                <span>Send Text to Driver</span>
              </button>
            </div>
          </div>

          {/* Card 2: Airport Flight Delay Test */}
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Plane className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  Airport Flight Delay Test
                </h3>
              </div>
              <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Kigali Airport</span>
            </div>

            <p className="text-sm text-[#425466] dark:text-slate-300 leading-relaxed">
              If a guest&apos;s plane is late, the driver gets a text right away with the new pickup time.
            </p>

            <div className="p-4 bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div>
                <span className="text-[#425466] dark:text-slate-400 font-semibold">Flight</span>
                <div className="font-mono text-base font-bold text-[#0a2540] dark:text-white mt-0.5">
                  {currentBooking?.flight_number || 'No flight on this trip'}
                </div>
                <div className="text-[#425466] dark:text-slate-400 mt-0.5">
                  Status:{' '}
                  <strong className={currentBooking?.flight_status === 'Delayed' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {currentBooking?.flight_status || 'On Time'}
                  </strong>
                  {currentBooking?.flight_delay_minutes ? ` (+${currentBooking.flight_delay_minutes} mins)` : ''}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3 py-2 text-sm font-mono"
                >
                  <option value={30}>+30 Min Late</option>
                  <option value={45}>+45 Min Late</option>
                  <option value={90}>+90 Min Late</option>
                </select>

                <button
                  onClick={() => currentBooking && onUpdateFlightStatus(currentBooking.id, 'Delayed', delayMinutes)}
                  className="px-4 py-2 text-sm font-bold rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  Test Late Flight
                </button>

                <button
                  onClick={() => currentBooking && onUpdateFlightStatus(currentBooking.id, 'On Time', 0)}
                  className="px-4 py-2 text-sm font-semibold rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-200"
                >
                  Reset
                </button>
              </div>
            </div>

            {currentBooking?.flight_status === 'Delayed' && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-2 text-sm">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Text Sent to Driver About Late Flight</span>
                </div>
                <div className="font-mono text-sm text-rose-900 dark:text-rose-200 bg-white dark:bg-slate-950 p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 whitespace-pre-line">
                  {flightDelayPayload?.messageText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Driver Phone (*134#) */}
        <div className="lg:col-span-5">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  Driver Phone (*134#)
                </h3>
              </div>
              <span className="text-sm px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
                Free · No Internet
              </span>
            </div>

            <p className="text-sm text-[#425466] dark:text-slate-300 leading-relaxed">
              Drivers dial <strong>*134#</strong> on any phone to confirm they got the job—no mobile data needed.
            </p>

            <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between text-sm text-[#425466] dark:text-slate-400 font-mono border-b border-slate-200 dark:border-slate-800 pb-2">
                <span>MTN / AIRTEL</span>
                <span>READY</span>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 text-sm font-mono text-emerald-900 dark:text-emerald-200 min-h-[100px] flex flex-col justify-center whitespace-pre-line leading-relaxed">
                {ussdResponse ? (
                  ussdResponse
                ) : (
                  <div>
                    <div className="font-bold">Phone Screen Ready</div>
                    <div className="mt-1">Dial *134# to confirm trip #{currentBooking?.id.slice(-4)}.</div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ussdInput}
                  onChange={(e) => setUssdInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-mono text-sm text-center font-bold tracking-widest outline-none"
                />
                <button
                  onClick={handleSimulateUSSD}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-1.5 shrink-0"
                >
                  <Phone className="w-4 h-4" />
                  <span>Dial</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-bold block">
                  Test Driver Updates:
                </span>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {[
                    {
                      stage: 'Acknowledged by Driver' as const,
                      label: '1. Driver Got Text (*134#)',
                    },
                    {
                      stage: 'Driver at Terminal' as const,
                      label: '2. Driver Waiting at Airport',
                    },
                    {
                      stage: 'Client Onboard' as const,
                      label: '3. Guest In Car (Trip Started)',
                    },
                  ].map((item) => {
                    const active = currentBooking?.dispatch_status === item.stage;
                    return (
                      <button
                        key={item.stage}
                        onClick={() => currentBooking && onAdvanceCheckin(currentBooking.id, item.stage)}
                        className={`p-3 rounded-xl text-left border flex items-center justify-between transition-colors ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{item.label}</span>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
