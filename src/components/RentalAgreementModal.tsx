import React, { useState } from 'react';
import { Booking, Vehicle, Company, User } from '../types';
import { ColorTheme } from '../theme';
import { calculateDays } from '../utils/collision';
import { formatHumanDate } from '../utils/dates';
import { useI18n } from '../utils/i18n';
import {
  FileText,
  Printer,
  Copy,
  Check,
  X,
  ShieldCheck,
  Building2,
  Car,
  User as UserIcon,
} from 'lucide-react';

interface RentalAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  vehicle: Vehicle | null;
  currentCompany?: Company;
  currentUser?: User;
  currentTheme?: ColorTheme;
}

export const RentalAgreementModal: React.FC<RentalAgreementModalProps> = ({
  isOpen,
  onClose,
  booking,
  vehicle,
  currentCompany,
  currentUser,
  currentTheme: _currentTheme,
}) => {
  const { currency, formatMoney, tr } = useI18n();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !booking || !vehicle) return null;

  const companyName = currentCompany?.name || 'Kigali Executive Fleet & Safaris Ltd';
  const companyPhone = currentCompany?.phone || '+250 788 312 000';
  const companyEmail = currentCompany?.email || 'dispatch@kigaliexecutive.rw';
  const companyTin = '109823471';
  const companyRdb = '109823471';

  const contractReference = `AGR-${booking.id.toUpperCase()}`;
  const agreementDate = formatHumanDate(new Date().toISOString().slice(0, 10));
  const durationDays = calculateDays(booking.start_date, booking.end_date);

  const handlePrint = () => {
    window.print();
  };

  const contractTextSummary = `
CAR RENTAL PAPER (RWANDA)
Paper No: ${contractReference}
Date: ${agreementDate}
Car Owner: ${companyName} (TIN: ${companyTin})
Guest: ${booking.client_name} (Phone: ${booking.client_phone}, Email: ${booking.client_email})
Car: ${vehicle.model_name} [${vehicle.plate_number}]
Dates: ${formatHumanDate(booking.start_date)} to ${formatHumanDate(booking.end_date)} (${durationDays} Days)
Price Per Day: ${formatMoney(vehicle.daily_rate_rwf)} | Total: ${formatMoney(booking.total_rwf)}
Refundable Deposit: ${formatMoney(150000)}
Fuel Rule: Return with the same fuel level.
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(contractTextSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px] overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl kf-modal overflow-hidden print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none text-slate-900 dark:text-white my-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {tr('Car Rental Agreement Paper')}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {contractReference}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? tr('Copied') : tr('Copy')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg accent-bg text-sm font-medium hover:opacity-95 transition-opacity"
            >
              <Printer className="w-4 h-4" />
              <span>{tr('Print Agreement')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              aria-label={tr('Close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-6 sm:p-10 space-y-6 text-sm leading-relaxed max-h-[78vh] overflow-y-auto print:max-h-none print:overflow-visible">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 font-semibold text-xl text-slate-900 dark:text-white">
                <Car className="w-5 h-5 accent-text" />
                <span>{companyName}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Remera, Gasabo District, Kigali, Rwanda
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 font-mono text-xs mt-1.5 tabular-nums">
                <span>RDB: <strong className="font-semibold text-slate-900 dark:text-white">{companyRdb}</strong></span>
                <span>Tax ID: <strong className="font-semibold text-slate-900 dark:text-white">{companyTin}</strong></span>
                <span>Phone: <strong className="font-semibold text-slate-900 dark:text-white">{companyPhone}</strong></span>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-xs accent-text">
                {contractReference}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Date: {agreementDate}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Kigali, Rwanda</p>
            </div>
          </div>

          <div className="text-center py-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Car Rental Agreement
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official car hire agreement under Rwanda commercial law
            </p>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white pb-1">
                <Building2 className="w-4 h-4 accent-text" />
                <span>1. Car Owner</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <p><strong className="font-semibold text-slate-900 dark:text-white">Company:</strong> {companyName}</p>
                <p><strong className="font-semibold text-slate-900 dark:text-white">Staff Name:</strong> {currentUser?.name || 'Company Manager'}</p>
                <p><strong className="font-semibold text-slate-900 dark:text-white">Phone:</strong> <span className="font-mono">{companyPhone}</span></p>
                <p><strong className="font-semibold text-slate-900 dark:text-white">Email:</strong> {companyEmail}</p>
              </div>
            </div>

            <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white pb-1">
                <UserIcon className="w-4 h-4 accent-text" />
                <span>2. Guest / Renter</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <p><strong className="font-semibold text-slate-900 dark:text-white">Full Name:</strong> {booking.client_name}</p>
                <p><strong className="font-semibold text-slate-900 dark:text-white">Phone:</strong> <span className="font-mono">{booking.client_phone}</span></p>
                <p><strong className="font-semibold text-slate-900 dark:text-white">Email:</strong> {booking.client_email}</p>
                <p><strong className="font-semibold text-slate-900 dark:text-white">ID / Passport:</strong> Checked at car pickup</p>
              </div>
            </div>
          </div>

          {/* Car & Dates */}
          <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Car className="w-4 h-4 accent-text" />
              <span>3. Car & Rental Dates</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <span className="block">Car Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">{vehicle.model_name}</span>
              </div>
              <div>
                <span className="block">Plate Number:</span>
                <span className="font-semibold font-mono accent-text text-sm">{vehicle.plate_number}</span>
              </div>
              <div>
                <span className="block">Type & Fuel:</span>
                <span className="text-slate-900 dark:text-white text-sm">{vehicle.category} · {vehicle.fuel_type}</span>
              </div>
              <div>
                <span className="block">Km Now:</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white text-sm">
                  {vehicle.current_odometer_km.toLocaleString()} km
                </span>
              </div>

              <div>
                <span className="block">Pickup Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {formatHumanDate(booking.start_date)}
                </span>
              </div>
              <div>
                <span className="block">Return Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {formatHumanDate(booking.end_date)}
                </span>
              </div>
              <div>
                <span className="block">Total Days:</span>
                <span className="font-semibold font-mono tabular-nums text-slate-900 dark:text-white text-sm">
                  {durationDays} Days
                </span>
              </div>
              <div>
                <span className="block">Safety Check:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">Valid</span>
              </div>
            </div>
          </div>

          {/* Money */}
          <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">4. {tr('Price & Payment')}</span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {currency === 'USD' ? tr('US Dollars (USD)') : tr('Rwandan Francs (RWF)')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <span className="block">{tr('Price / Day')}:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white text-sm">
                  {formatMoney(vehicle.daily_rate_rwf)}
                </span>
              </div>
              <div>
                <span className="block">{tr('Total Price')}:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white text-sm">
                  {formatMoney(booking.total_rwf)}
                </span>
              </div>
              <div>
                <span className="block">{tr('Refundable Deposit')}:</span>
                <span className="font-mono tabular-nums font-semibold accent-text text-sm">
                  {formatMoney(150000)}
                </span>
              </div>
              <div>
                <span className="block">{tr('Payment Method')}:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">{booking.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Simple Rules */}
          <div className="space-y-3 pt-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">5. {tr('Important Rules')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-50/90 dark:bg-slate-800/40 rounded-lg">
                <strong className="block font-semibold text-slate-900 dark:text-white mb-1">1. {tr('Who Drives & Where')}</strong>
                {tr('Only the named guest or approved driver may drive this car. Do not leave Rwanda without written approval and cross-border insurance.')}
              </div>

              <div className="p-4 bg-slate-50/90 dark:bg-slate-800/40 rounded-lg">
                <strong className="block font-semibold text-slate-900 dark:text-white mb-1">2. {tr('Fuel & Km Limit')}</strong>
                {tr('Return the car with the same fuel level. Up to 350 km per day is included. Extra fuel is billed at pump price plus')} {formatMoney(10000)}.
              </div>

              <div className="p-4 bg-slate-50/90 dark:bg-slate-800/40 rounded-lg">
                <strong className="block font-semibold text-slate-900 dark:text-white mb-1">3. Traffic & Speed Fines</strong>
                The guest pays any traffic tickets or speed camera fines received during the rental dates.
              </div>

              <div className="p-4 bg-slate-50/90 dark:bg-slate-800/40 rounded-lg">
                <strong className="block font-semibold text-slate-900 dark:text-white mb-1">4. Road Help</strong>
                If you have a flat tire or car trouble, call our 24/7 line ({companyPhone}) right away before visiting any garage.
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
            <div className="space-y-6">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">For {companyName}:</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Company Staff</span>
              </div>
              <div className="border-b border-slate-300 dark:border-slate-700 pb-2 flex justify-between items-end">
                <span className="signature-line text-lg text-slate-900 dark:text-white">
                  {currentUser?.name || 'Company Manager'}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">Signed</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Date: {agreementDate}</div>
            </div>

            <div className="space-y-6">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">For the Guest:</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">I read and agree to these rules</span>
              </div>
              <div className="border-b border-slate-300 dark:border-slate-700 pb-2 flex justify-between items-end">
                <span className="signature-line text-lg text-slate-900 dark:text-white">{booking.client_name}</span>
                <span className="accent-text font-semibold text-xs">Agreed</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Date: {agreementDate}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ready to print or save as PDF</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 font-medium text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {tr('Close')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg font-medium text-sm accent-bg hover:opacity-95 transition-opacity flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{tr('Print Agreement')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
