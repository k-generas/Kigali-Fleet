import React, { useState } from 'react';
import { Booking, Driver, Vehicle } from '../types';
import { generateDriverSMS, generateFlightDelaySMS, formatRwf } from '../utils/collision';
import {
  MessageSquare,
  Plane,
  Phone,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  RotateCw,
  Hash,
  Car,
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
  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';
  const activeBookings = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'In Progress');
  const [selectedBookingId, setSelectedBookingId] = useState<string>(activeBookings[0]?.id || bookings[0]?.id || '');
  const [ussdInput, setUssdInput] = useState('*134#');
  const [ussdResponse, setUssdResponse] = useState<string | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(45);
  const [customLanguage, setCustomLanguage] = useState<'AUTO' | 'RW' | 'EN'>('AUTO');

  const currentBooking = bookings.find((b) => b.id === selectedBookingId) || activeBookings[0] || bookings[0];
  const currentDriver = currentBooking ? drivers.find((d) => d.id === currentBooking.driver_id) : null;
  const currentVehicle = currentBooking ? vehicles.find((v) => v.id === currentBooking.vehicle_id) : null;

  // Language selection: AUTO uses driver's registered preference
  const effectiveLang: 'RW' | 'EN' =
    customLanguage === 'AUTO'
      ? currentDriver?.language === 'RW'
        ? 'RW'
        : 'RW' // default to RW or EN
      : customLanguage;

  const smsPayload = currentBooking && currentDriver && currentVehicle
    ? generateDriverSMS({
        driver: currentDriver,
        vehicle: currentVehicle,
        booking: currentBooking,
        language: effectiveLang,
      })
    : null;

  const flightDelayPayload = currentBooking && currentDriver
    ? generateFlightDelaySMS({
        driver: currentDriver,
        booking: currentBooking,
        delayMinutes,
        language: effectiveLang,
      })
    : null;

  const handleSimulateUSSD = (code: string) => {
    setUssdResponse('Connecting to Rwanda USSD Gateway (*134#)...');
    setTimeout(() => {
      if (currentBooking) {
        onAdvanceCheckin(currentBooking.id);
        setUssdResponse(
          `[USSD KIGALI-FLEET]\nMurakoze ${currentDriver?.name || 'Mushoferi'}.\nUrugendo #${currentBooking.id.slice(-4)} rwemejwe neza.\nImodoka: ${currentVehicle?.plate_number}.\nAho kwakira: KIA Terminal.`
        );
      }
    }, 400);
  };

  const handleTriggerFlightDelay = () => {
    if (!currentBooking) return;
    onUpdateFlightStatus(currentBooking.id, 'Delayed', delayMinutes);
  };

  const handleClearDelay = () => {
    if (!currentBooking) return;
    onUpdateFlightStatus(currentBooking.id, 'On Time', 0);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: activeThemeColor }}>
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>AFRICA'S TALKING RWANDA SMS / USSD GATEWAY</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Automated Chauffeur Dispatch & Flight Telemetry Console
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Monitors pickup windows at Kigali International Airport (KIA), generates bilingual Kinyarwanda/English SMS dispatches, and handles zero-data USSD driver check-in hooks.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Gateway Status</div>
              <div className="text-emerald-400 font-bold font-mono">MTN / Airtel Active</div>
            </div>
            <span className="text-slate-600">|</span>
            <div>
              <div className="text-[10px] text-slate-400">Delivery SLA</div>
              <div className="text-white font-mono font-bold">&lt; 3.2s</div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold whitespace-nowrap">Select Active Mission:</span>
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
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? `${activeBtnText} shadow-sm font-bold`
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              style={isSelected ? { backgroundColor: activeThemeColor } : undefined}
            >
              <span>#{b.id}</span>
              <span>·</span>
              <span className="font-normal truncate max-w-[130px]">{b.client_name}</span>
              <span className="font-mono text-[10px]">({v?.plate_number || 'Car'})</span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): SMS Dispatch Engine & Flight Delay Trigger */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Africa's Talking SMS Dispatcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Automated Africa's Talking SMS Dispatch
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold">
                API v1.0
              </span>
            </div>

            {/* Chauffeur and Language settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Chauffeur</span>
                <div className="font-bold text-white mt-0.5">{currentDriver?.name || 'Unassigned'}</div>
                <div className="text-amber-400 font-mono text-[11px]">{currentDriver?.phone}</div>
                <div className="text-slate-400 text-[10px] mt-0.5">Language: {currentDriver?.language}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Fleet Car</span>
                <div className="font-bold text-white mt-0.5">{currentVehicle?.model_name}</div>
                <div className="text-amber-400 font-mono text-[11px] font-bold">
                  {currentVehicle?.plate_number}
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">{currentVehicle?.location}</div>
              </div>
            </div>

            {/* Language switch */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                Format Dispatch Language:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => setCustomLanguage('AUTO')}
                  className={`py-1.5 px-2 rounded-lg font-semibold border transition-all ${
                    customLanguage === 'AUTO'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Auto (Driver Profile)
                </button>
                <button
                  onClick={() => setCustomLanguage('RW')}
                  className={`py-1.5 px-2 rounded-lg font-semibold border transition-all ${
                    customLanguage === 'RW'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Kinyarwanda
                </button>
                <button
                  onClick={() => setCustomLanguage('EN')}
                  className={`py-1.5 px-2 rounded-lg font-semibold border transition-all ${
                    customLanguage === 'EN'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Dispatched Payload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Inbound SMS Dispatch Payload</span>
                <span className="font-mono text-[10px] text-amber-400">POST /version1/messaging</span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-line leading-relaxed shadow-inner">
                {smsPayload?.messageText}
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Dispatch status:{' '}
                <strong className="text-amber-400 font-mono">
                  {currentBooking?.dispatch_status || 'Not Sent'}
                </strong>
              </span>

              <button
                onClick={() => currentBooking && onDispatchSMS(currentBooking.id, effectiveLang)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                <Send className="w-4 h-4" />
                <span>Transmit Africa's Talking SMS</span>
              </button>
            </div>
          </div>

          {/* Card 2: Kigali International Airport Flight Delay Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Kigali International Airport (KIA) Flight Delay Hook
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Terminal Telemetry</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When flights are delayed entering Kigali airspace, the system automatically detects the new ETA and alerts the assigned driver via Africa's Talking SMS, preventing stranded VIPs.
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tracked Flight</span>
                <div className="font-mono text-sm font-bold text-white mt-0.5">
                  {currentBooking?.flight_number || 'Direct Transfer (No Flight)'}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Current Status: <strong className={currentBooking?.flight_status === 'Delayed' ? 'text-rose-400' : 'text-emerald-400'}>
                    {currentBooking?.flight_status || 'On Time'}
                  </strong>
                  {currentBooking?.flight_delay_minutes ? ` (+${currentBooking.flight_delay_minutes} mins)` : ''}
                </div>
              </div>

              {/* Delay simulator controls */}
              <div className="flex items-center gap-2">
                <select
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-white rounded p-1.5 text-xs font-mono"
                >
                  <option value={30}>+30 Min Delay</option>
                  <option value={45}>+45 Min Delay</option>
                  <option value={90}>+90 Min Delay</option>
                </select>

                <button
                  onClick={handleTriggerFlightDelay}
                  className="px-3 py-1.5 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  Trigger Delay
                </button>

                <button
                  onClick={handleClearDelay}
                  className="px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Reset On Time
                </button>
              </div>
            </div>

            {/* Delay SMS Preview */}
            {currentBooking?.flight_status === 'Delayed' && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>AUTOMATED CHAUFFEUR DELAY ALERT SENT</span>
                </div>
                <div className="font-mono text-[11px] text-rose-200 bg-slate-950/80 p-2.5 rounded border border-rose-900/60 whitespace-pre-line">
                  {flightDelayPayload?.messageText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Driver Phone Screen & Zero-Data USSD Check-In */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Zero-Data USSD Check-In Hook
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                NO DATA REQUIRED
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Drivers dial free USSD shortcode <strong>*134#</strong> to acknowledge pickup windows without consuming mobile data bundles.
            </p>

            {/* Virtual Phone Shell */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-b border-slate-800/80 pb-1.5">
                <span>MTN-RW / AIRTEL-RW</span>
                <span>4G · FULL BARS</span>
              </div>

              {/* USSD Dialog Screen */}
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 text-xs font-mono text-emerald-300 min-h-[90px] flex flex-col justify-center whitespace-pre-line leading-relaxed">
                {ussdResponse ? (
                  ussdResponse
                ) : (
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">USSD Hook Ready</div>
                    <div className="text-white mt-1">Dial *134# to confirm pickup or arrival for Booking #{currentBooking?.id.slice(-4)}.</div>
                  </div>
                )}
              </div>

              {/* Dial Pad & Trigger */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ussdInput}
                  onChange={(e) => setUssdInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs text-center font-bold tracking-widest outline-none"
                />
                <button
                  onClick={() => handleSimulateUSSD(ussdInput)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Dial</span>
                </button>
              </div>

              {/* Stage Progression Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Quick Chauffeur Check-In Stages:
                </span>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <button
                    onClick={() => currentBooking && onAdvanceCheckin(currentBooking.id, 'Acknowledged by Driver')}
                    className={`p-2 rounded-lg text-left border flex items-center justify-between transition-colors ${
                      currentBooking?.dispatch_status === 'Acknowledged by Driver'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <span>1. Acknowledge Trip (*134#)</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => currentBooking && onAdvanceCheckin(currentBooking.id, 'Driver at Terminal')}
                    className={`p-2 rounded-lg text-left border flex items-center justify-between transition-colors ${
                      currentBooking?.dispatch_status === 'Driver at Terminal'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <span>2. Chauffeur Arrived at KIA Terminal</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => currentBooking && onAdvanceCheckin(currentBooking.id, 'Client Onboard')}
                    className={`p-2 rounded-lg text-left border flex items-center justify-between transition-colors ${
                      currentBooking?.dispatch_status === 'Client Onboard'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <span>3. Client Met & Onboard (Trip Active)</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
