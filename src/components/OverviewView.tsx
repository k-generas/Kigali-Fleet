import React, { useState } from 'react';
import { Vehicle, Driver, Booking, ActivityLog, User, Company } from '../types';
import { formatRwf } from '../utils/collision';
import { formatExpiryStatus, formatHumanDateRange } from '../utils/dates';
import { CATEGORY_DEFAULT_IMAGES } from '../utils/vehicleImages';
import {
  Plane,
  Send,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  Check,
  Smartphone,
  Car,
  Users,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  Calendar,
  Plus,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { useI18n } from '../utils/i18n';

interface OverviewViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  logs: ActivityLog[];
  currentTheme?: ColorTheme;
  currentUser?: User;
  currentCompany?: Company;
  onOpenNewBooking: () => void;
  onOpenStorefront: () => void;
  onSelectBookingForDispatch: (bookingId: string) => void;
  onAcknowledgeCheckin: (bookingId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  vehicles,
  drivers,
  bookings,
  logs,
  currentUser,
  currentCompany,
  onOpenNewBooking,
  onOpenStorefront,
  onSelectBookingForDispatch,
  onAcknowledgeCheckin,
  onNavigateTab,
}) => {
  const { formatMoney, tr, t } = useI18n();
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'airport' | 'safari'>('all');

  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  const bookedVehicles = vehicles.filter((v) => v.status === 'Booked');
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'Maintenance');

  const availableDrivers = drivers.filter((d) => d.status === 'Available');
  const onTripDrivers = drivers.filter((d) => d.status === 'On Trip');
  const offDutyDrivers = drivers.filter((d) => d.status === 'Off Duty');

  const activeBookings = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'In Progress');
  const totalRevenueRwf = activeBookings.reduce((sum, b) => sum + b.total_rwf, 0);

  const depositPaidRwf = activeBookings
    .filter((b) => b.payment_status.includes('Paid'))
    .reduce((sum, b) => sum + (b.payment_status === 'Fully Paid' ? b.total_rwf : b.total_rwf * 0.4), 0);

  const fleetUtilizationRate = Math.round((bookedVehicles.length / (vehicles.length || 1)) * 100);

  const userRole = currentUser?.role || 'owner';
  const isDriverView = userRole === 'driver';

  const filteredBookings = bookings.filter((b) => {
    if (isDriverView && currentUser?.driver_id) {
      if (b.driver_id !== currentUser.driver_id) return false;
    }
    if (filterMode === 'today') {
      return b.start_date <= '2026-11-05' && b.end_date >= '2026-11-05';
    }
    if (filterMode === 'airport') {
      return Boolean(b.flight_number) || b.destination.toLowerCase().includes('airport');
    }
    if (filterMode === 'safari') {
      return (
        b.destination.toLowerCase().includes('volcanoes') ||
        b.destination.toLowerCase().includes('akagera') ||
        b.destination.toLowerCase().includes('nyungwe') ||
        b.destination.toLowerCase().includes('musanze')
      );
    }
    return true;
  });

  const unassignedBookings = bookings.filter((b) => !b.driver_id || b.driver_id === 'Pending');
  const delayedFlightBookings = bookings.filter((b) => b.flight_status === 'Delayed');

  const complianceAlerts = vehicles
    .map((v) => {
      const ins = formatExpiryStatus(v.insurance_expiry);
      const ct = formatExpiryStatus(v.controle_technique_expiry);
      if (ins.level === 'problem' || ins.level === 'attention') {
        return {
          vehicle: v,
          message: `Insurance for ${v.plate_number}: ${ins.text.toLowerCase()}.`,
          level: ins.level,
        };
      }
      if (ct.level === 'problem' || ct.level === 'attention') {
        return {
          vehicle: v,
          message: `Safety check for ${v.plate_number}: ${ct.text.toLowerCase()}.`,
          level: ct.level,
        };
      }
      return null;
    })
    .filter((item): item is { vehicle: Vehicle; message: string; level: 'attention' | 'problem' } => Boolean(item))
    .slice(0, 2);

  const attentionCount =
    maintenanceVehicles.length +
    delayedFlightBookings.length +
    (unassignedBookings.length > 0 ? 1 : 0) +
    complianceAlerts.length;

  const hasAttentionItems = !isDriverView && attentionCount > 0;

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {isDriverView ? tr('Your Trips Today') : tr('Dashboard')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {currentCompany ? currentCompany.name : 'KigaliFleet'} ·{' '}
            {isDriverView
              ? tr('See your pickup times, guest names, and airport flight updates.')
              : tr('See which cars are free, who is driving, and how much money you made.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenStorefront}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-xs whitespace-nowrap cursor-pointer"
          >
            <span>{tr('Booking Website')}</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </button>

          {!isDriverView && (
            <button
              type="button"
              onClick={onOpenNewBooking}
              className="px-4 py-2 text-sm font-medium rounded-lg accent-bg hover:opacity-95 transition-opacity inline-flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            >
              <span>+ {tr('New Booking')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Start Bar for < 5-Second Clarity */}
      {!isDriverView && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 kf-card flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300">
            <strong className="font-semibold text-slate-900 dark:text-white">
              {t({
                EN: 'Quick Start:',
                RW: 'Tangira Vuba:',
                FR: 'Accès rapide :',
              })}
            </strong>{' '}
            {t({
              EN: 'Add a trip, update car photos, message drivers via SMS, or open your customer booking link.',
              RW: 'Andika urugendo, ongeramo amafoto y’imodoka, ohereza SMS ku bashoferi, cyangwa ufungure urubuga rw’abakiriya.',
              FR: 'Créez un trajet, mettez à jour les photos, envoyez un SMS au chauffeur ou ouvrez votre lien client.',
            })}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
            <button
              type="button"
              onClick={onOpenNewBooking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold accent-tint accent-text hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tr('New Booking')}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.('vehicles')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Car className="w-3.5 h-3.5 accent-text" />
              <span>
                {t({
                  EN: 'Cars & Photos',
                  RW: 'Imodoka & Amafoto',
                  FR: 'Voitures & Photos',
                })}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.('dispatch')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 accent-text" />
              <span>
                {t({
                  EN: 'Send Driver SMS',
                  RW: 'Ohereza SMS Umushoferi',
                  FR: 'SMS Chauffeur',
                })}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.('calendar')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 accent-text" />
              <span>{tr('Trip Calendar')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. 4-Card Modern KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab?.('vehicles')}
          className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Cars on Trips')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {bookedVehicles.length}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              of {vehicles.length} ({fleetUtilizationRate}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {availableVehicles.length} {tr('free')} · {maintenanceVehicles.length} {tr('Repairs').toLowerCase()}
          </p>
        </div>

        <div
          onClick={() => onNavigateTab?.('reports')}
          className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Money Earned')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white font-mono mt-2 tabular-nums">
            {formatMoney(totalRevenueRwf)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
            <span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {formatMoney(depositPaidRwf)}
              </span>{' '}
              {tr('Paid').toLowerCase()}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTab?.('drivers')}
          className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Drivers Ready')}</span>
            <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {availableDrivers.length}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">of {drivers.length}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {onTripDrivers.length} driving · {offDutyDrivers.length} off duty
          </p>
        </div>

        <div
          onClick={() => onNavigateTab?.(maintenanceVehicles.length > 0 ? 'maintenance' : 'vehicles')}
          className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {tr('Needs attention')}
            </span>
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                attentionCount > 0
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {attentionCount > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {attentionCount}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              {attentionCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {attentionCount > 0
              ? 'Repairs, flights, drivers & papers'
              : 'All fleet checks & flights normal'}
          </p>
        </div>
      </div>

      {/* 2. Needs Attention Panel */}
      {hasAttentionItems && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {tr('Needs attention')}
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {attentionCount} action{attentionCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {maintenanceVehicles.map((v) => (
              <div
                key={`maint-${v.id}`}
                className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-sm hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span>
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {v.model_name} ({v.plate_number})
                    </strong>{' '}
                    is in the garage. Nobody can book it.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('maintenance')}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 shrink-0 transition-colors"
                >
                  See repairs
                </button>
              </div>
            ))}

            {delayedFlightBookings.map((bk) => (
              <div
                key={`flight-${bk.id}`}
                className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-sm hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span>
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      Flight {bk.flight_number}
                    </strong>{' '}
                    is {bk.flight_delay_minutes || 35} minutes late. {bk.client_name} is waiting at pickup.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectBookingForDispatch(bk.id)}
                  className="px-3 py-1 rounded-md text-xs font-medium accent-tint accent-text hover:opacity-90 shrink-0"
                >
                  Send SMS
                </button>
              </div>
            ))}

            {unassignedBookings.length > 0 && (
              <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-sm hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <span className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {unassignedBookings.length} booking(s)
                    </strong>{' '}
                    still need a driver before the trip starts.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('dispatch')}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 shrink-0 transition-colors"
                >
                  Pick driver
                </button>
              </div>
            )}

            {complianceAlerts.map((item) => (
              <div
                key={`comp-${item.vehicle.id}`}
                className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-sm hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.level === 'problem' ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>{item.message}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('vehicles')}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 shrink-0 transition-colors"
                >
                  Open car
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Driver Active Trip View */}
      {isDriverView && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Your Next Trip</span>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kigali Airport (KIA)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Guest and route</div>
              <div className="font-semibold text-slate-900 dark:text-white text-base mt-1">
                Dr. Sarah Jenkins
              </div>
              <div className="text-sm mt-1 font-medium accent-text">
                Kigali Airport to Musanze Lodge
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Your car</div>
              <div className="font-semibold text-slate-900 dark:text-white text-base mt-1">
                Toyota Prado TXL
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">RAD 450 B</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Flight time</div>
              <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 text-base mt-1">
                <Plane className="w-4 h-4" />
                <span className="font-mono">WB 402 · 35m late</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Lands at 10:05</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onAcknowledgeCheckin('bk-101')}
                className="px-4 py-2 rounded-lg text-sm font-medium accent-bg hover:opacity-95 inline-flex items-center gap-2 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>I Am At The Airport</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab?.('simulator')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4 accent-text" />
                <span>Test Driver SMS</span>
              </button>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono">Office: +250 788 100 200</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bookings & Dispatch Table Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {tr('Bookings')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {filteredBookings.length} {tr('Bookings').toLowerCase()} shown
            </p>
          </div>

          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto">
            {(
              [
                { id: 'all', label: tr('All') },
                { id: 'today', label: tr('Today') },
                { id: 'airport', label: tr('Airport') },
                { id: 'safari', label: tr('Safaris') },
              ] as const
            ).map((tab) => {
              const active = filterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-5">Guest</th>
                <th className="py-3 px-4">Car & Driver</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-5 text-right">Driver SMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-5 text-center text-sm text-slate-500 dark:text-slate-400">
                    No bookings match this filter.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
                  const driver = drivers.find((d) => d.id === b.driver_id);
                  const thumb = vehicle?.image_url || CATEGORY_DEFAULT_IMAGES[vehicle?.category || 'LandCruiser'];

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5 align-middle">
                        <div className="font-medium text-slate-900 dark:text-white">{b.client_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.destination}</div>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumb}
                            alt={vehicle?.model_name || 'Car'}
                            referrerPolicy="no-referrer"
                            className="w-11 h-8 rounded-md object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/70 dark:border-slate-700"
                          />
                          <div className="min-w-0">
                            <div className="text-slate-900 dark:text-white font-medium truncate">
                              {vehicle?.model_name || 'No car yet'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-mono">{vehicle?.plate_number || '—'}</span>
                              {' · '}
                              <span>{driver?.name || 'No driver'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {formatHumanDateRange(b.start_date, b.end_date)}
                        </div>
                        {b.flight_number && (
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {b.flight_number}
                            {b.flight_status === 'Delayed' && (
                              <span className="text-red-600 dark:text-red-400 font-semibold ml-1.5">
                                +{b.flight_delay_minutes || 35}m late
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900 dark:text-white">
                          {formatRwf(b.total_rwf)}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{b.payment_status}</div>
                      </td>

                      <td className="py-3.5 px-5 align-middle text-right whitespace-nowrap">
                        {b.dispatch_status === 'Not Sent' && (
                          <button
                            type="button"
                            onClick={() => onSelectBookingForDispatch(b.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg accent-bg hover:opacity-95 transition-opacity shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send SMS</span>
                          </button>
                        )}
                        {b.dispatch_status === 'Dispatched (SMS)' && (
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>SMS sent</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onAcknowledgeCheckin(b.id)}
                              className="text-xs font-medium accent-text hover:underline"
                            >
                              Mark ready
                            </button>
                          </div>
                        )}
                        {b.dispatch_status === 'Acknowledged by Driver' && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Driver ready</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Secondary Panels: Airport Flights & Recent Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Kigali airport flights
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Live</span>
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            <div className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">RwandAir WB 402</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Entebbe to Kigali</div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>35m late</span>
              </span>
            </div>

            <div className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Kenya Airways KQ 448</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nairobi to Kigali</div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>On time</span>
              </span>
            </div>

            <div className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Ethiopian ET 807</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Addis Ababa to Kigali</div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>On time</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent updates</h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-60 overflow-y-auto text-sm">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-900 dark:text-white">{log.action}</span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{log.timestamp}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
