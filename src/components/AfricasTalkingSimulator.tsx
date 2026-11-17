import React, { useState } from 'react';
import { Booking, Driver, Vehicle } from '../types';
import { generateDriverSMS, generateFlightDelaySMS } from '../utils/collision';
import { useI18n } from '../utils/i18n';
import { Send, Phone, CheckCircle2 } from 'lucide-react';
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
  onDispatchSMS,
  onAdvanceCheckin,
  onUpdateFlightStatus,
}) => {
  const { language, tr } = useI18n();
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
      ? language === 'EN'
        ? 'EN'
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
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Driver Text & Phone Demo')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Send trip texts to your driver in Kinyarwanda or English, and test how drivers check in with *134# with zero internet.')}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm shrink-0 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-2.5 rounded-xl kf-card">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Phone line')}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">MTN / Airtel Ready</span>
          </div>
          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Speed')}</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">&lt; 3 sec</span>
          </div>
        </div>
      </div>

      {/* Main Operational Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        {/* Active Trip Picker Strip */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
            {tr('Pick a trip')}:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeBookings.map((b) => {
              const isSelected = (currentBooking?.id || '') === b.id;
              const v = vehicles.find((veh) => veh.id === b.vehicle_id);

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBookingId(b.id);
                    setUssdResponse(null);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between gap-2 border transition-colors min-w-0 ${
                    isSelected
                      ? 'accent-bg border-transparent shadow-xs'
                      : 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{b.client_name}</span>
                  <span className="font-mono text-xs opacity-90 shrink-0">{v?.plate_number || 'Car'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-slate-800">
          {/* Left: SMS & Flight Delay */}
          <div className="lg:col-span-7 divide-y divide-slate-200/80 dark:divide-slate-800">
            {/* Send Text to Driver */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {tr('Send text to driver')}
                </h2>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {tr('SMS ready')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Driver')}</span>
                  <div className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {currentDriver?.name || tr('Not picked')}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {currentDriver?.phone}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Car')}</span>
                  <div className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {currentVehicle?.model_name}
                  </div>
                  <div className="text-xs font-mono font-semibold accent-text mt-0.5">
                    {currentVehicle?.plate_number}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1.5">
                  {tr('Pick language')}:
                </label>
                <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg w-full sm:w-auto">
                  {[
                    { id: 'AUTO' as const, label: tr('Auto') },
                    { id: 'RW' as const, label: 'Kinyarwanda' },
                    { id: 'EN' as const, label: 'English' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setCustomLanguage(lang.id)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 sm:flex-initial ${
                        customLanguage === lang.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  {tr('Message preview')}
                </div>
                <div className="p-4 bg-slate-50/90 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">
                  {smsPayload?.messageText}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {tr('Status')}:{' '}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {currentBooking?.dispatch_status || tr('Not sent')}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={() => currentBooking && onDispatchSMS(currentBooking.id, effectiveLang)}
                  className="accent-bg inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg hover:opacity-95 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>{tr('Send text to driver')}</span>
                </button>
              </div>
            </div>

            {/* Airport Flight Delay Test */}
            <div className="p-5 sm:p-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {tr('Airport flight delay test')}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">{tr('Kigali Airport')}</span>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {tr("If a guest's plane is late, the driver gets a text right away with the new pickup time.")}
              </p>

              <div className="p-4 bg-slate-50/90 dark:bg-slate-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Flight')}</span>
                  <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    {currentBooking?.flight_number || tr('No flight on this trip')}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tr('Status')}:{' '}
                    <strong
                      className={`font-semibold ${
                        currentBooking?.flight_status === 'Delayed'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {tr(currentBooking?.flight_status || 'On time')}
                    </strong>
                    {currentBooking?.flight_delay_minutes ? ` (+${currentBooking.flight_delay_minutes} mins)` : ''}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                    className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-sm font-mono outline-none"
                  >
                    <option value={30}>+30 min</option>
                    <option value={45}>+45 min</option>
                    <option value={90}>+90 min</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => currentBooking && onUpdateFlightStatus(currentBooking.id, 'Delayed', delayMinutes)}
                    className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                  >
                    {tr('Test late flight')}
                  </button>

                  <button
                    type="button"
                    onClick={() => currentBooking && onUpdateFlightStatus(currentBooking.id, 'On Time', 0)}
                    className="px-3.5 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {tr('Reset')}
                  </button>
                </div>
              </div>

              {currentBooking?.flight_status === 'Delayed' && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl space-y-2 text-sm">
                  <div className="text-rose-700 dark:text-rose-400 font-semibold">
                    {tr('Text sent to driver about late flight')}
                  </div>
                  <div className="font-mono text-sm text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] p-3.5 rounded-lg border border-rose-100 dark:border-slate-800 whitespace-pre-line">
                    {flightDelayPayload?.messageText}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Driver Phone (*134#) */}
          <div className="lg:col-span-5 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {tr('Driver phone (*134#)')}
              </h2>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {tr('No internet needed')}
              </span>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tr('Drivers dial *134# on any phone to confirm they got the job — no mobile data needed.')}
            </p>

            {/* High-Contrast Offline Phone Screen */}
            <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-800 pb-2.5">
                <span>MTN / AIRTEL</span>
                <span className="text-emerald-400">USSD READY</span>
              </div>

              <div className="bg-slate-800/80 rounded-lg p-3.5 text-sm font-mono text-slate-100 min-h-[104px] flex flex-col justify-center whitespace-pre-line leading-relaxed">
                {ussdResponse ? (
                  ussdResponse
                ) : (
                  <div>
                    <div className="font-semibold text-emerald-400">{tr('Phone screen ready')}</div>
                    <div className="mt-1 text-slate-300">
                      {tr('Dial *134# to confirm trip')} #{currentBooking?.id.slice(-4)}.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ussdInput}
                  onChange={(e) => setUssdInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-sm text-center font-semibold tracking-widest outline-none"
                />
                <button
                  type="button"
                  onClick={handleSimulateUSSD}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm inline-flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{tr('Dial')}</span>
                </button>
              </div>
            </div>

            {/* Interactive 3-Stage Check-in Buttons */}
            <div className="space-y-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                {tr('Test driver updates')}:
              </span>
              <div className="space-y-2 text-sm">
                {[
                  {
                    stage: 'Acknowledged by Driver' as const,
                    label: tr('1. Driver got text (*134#)'),
                  },
                  {
                    stage: 'Driver at Terminal' as const,
                    label: tr('2. Driver waiting at airport'),
                  },
                  {
                    stage: 'Client Onboard' as const,
                    label: tr('3. Guest in car (trip started)'),
                  },
                ].map((item) => {
                  const active = currentBooking?.dispatch_status === item.stage;
                  return (
                    <button
                      key={item.stage}
                      type="button"
                      onClick={() => currentBooking && onAdvanceCheckin(currentBooking.id, item.stage)}
                      className={`w-full p-3 rounded-lg text-left border flex items-center justify-between transition-colors ${
                        active
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium'
                          : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
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
  );
};
