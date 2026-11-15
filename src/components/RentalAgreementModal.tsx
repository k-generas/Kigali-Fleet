import React, { useState } from 'react';
import { Booking, Vehicle, Company, User } from '../types';
import { ColorTheme } from '../theme';
import { formatRwf, calculateDays } from '../utils/collision';
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
  currentTheme,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !booking || !vehicle) return null;

  const activeColor = currentTheme?.hex || '#635bff';
  const companyName = currentCompany?.name || 'Kigali Executive Fleet & Safaris Ltd';
  const companyPhone = currentCompany?.phone || '+250 788 312 000';
  const companyEmail = currentCompany?.email || 'dispatch@kigaliexecutive.rw';
  const companyTin = '109823471';
  const companyRdb = '109823471';

  const contractReference = `AGR-${booking.id.toUpperCase()}`;
  const agreementDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
Dates: ${booking.start_date} to ${booking.end_date} (${durationDays} Days)
Price Per Day: ${formatRwf(vehicle.daily_rate_rwf)} | Total: ${formatRwf(booking.total_rwf)}
Refundable Deposit: 150,000 RWF
Fuel Rule: Return with the same fuel level.
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(contractTextSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none text-[#0a2540] dark:text-slate-200 my-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-5 bg-[#f6f9fc] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">
                Car Rental Agreement Paper
              </h2>
              <span className="text-sm text-[#425466] dark:text-slate-400 font-mono">
                {contractReference}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-bold shadow-sm transition-opacity hover:opacity-95"
              style={{ backgroundColor: activeColor }}
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-6 sm:p-10 space-y-6 text-sm leading-relaxed max-h-[78vh] overflow-y-auto print:max-h-none print:overflow-visible">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-[#0a2540] dark:text-white">
                <Car className="w-6 h-6 text-amber-500" />
                <span>{companyName}</span>
              </div>
              <p className="text-[#425466] dark:text-slate-400 mt-1">
                Remera, Gasabo District, Kigali, Rwanda
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#425466] dark:text-slate-400 font-mono mt-1">
                <span>RDB: <strong>{companyRdb}</strong></span>
                <span>Tax ID: <strong>{companyTin}</strong></span>
                <span>Phone: <strong>{companyPhone}</strong></span>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-amber-700 dark:text-amber-400">
                {contractReference}
              </span>
              <p className="text-[#425466] dark:text-slate-400 mt-1.5">Date: {agreementDate}</p>
              <p className="text-[#425466] dark:text-slate-400">Kigali, Rwanda</p>
            </div>
          </div>

          <div className="text-center py-3 border-y border-dashed border-slate-200 dark:border-slate-800">
            <h1 className="text-lg font-extrabold text-[#0a2540] dark:text-white">
              Car Rental Agreement
            </h1>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              Official car hire agreement under Rwanda commercial law
            </p>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#0a2540] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>1. Car Owner</span>
              </div>
              <div className="space-y-1 text-[#425466] dark:text-slate-300">
                <p><strong>Company:</strong> {companyName}</p>
                <p><strong>Staff Name:</strong> {currentUser?.name || 'Company Manager'}</p>
                <p><strong>Phone:</strong> {companyPhone}</p>
                <p><strong>Email:</strong> {companyEmail}</p>
              </div>
            </div>

            <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#0a2540] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                <UserIcon className="w-4 h-4 text-amber-500" />
                <span>2. Guest / Renter</span>
              </div>
              <div className="space-y-1 text-[#425466] dark:text-slate-300">
                <p><strong>Full Name:</strong> {booking.client_name}</p>
                <p><strong>Phone:</strong> <span className="font-mono">{booking.client_phone}</span></p>
                <p><strong>Email:</strong> {booking.client_email}</p>
                <p><strong>ID / Passport:</strong> Checked at car pickup</p>
              </div>
            </div>
          </div>

          {/* Car & Dates */}
          <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-[#0a2540] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              <Car className="w-4 h-4 text-amber-500" />
              <span>3. Car & Rental Dates</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#425466] dark:text-slate-300">
              <div>
                <span className="text-sm text-slate-500 block">Car Name:</span>
                <span className="font-bold text-[#0a2540] dark:text-white">{vehicle.model_name}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Plate Number:</span>
                <span className="font-bold font-mono text-amber-700 dark:text-amber-400">{vehicle.plate_number}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Type & Fuel:</span>
                <span>{vehicle.category} · {vehicle.fuel_type}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Km Now:</span>
                <span className="font-mono">{vehicle.current_odometer_km.toLocaleString()} km</span>
              </div>

              <div>
                <span className="text-sm text-slate-500 block">Pickup Date:</span>
                <span className="font-semibold text-[#0a2540] dark:text-white">{booking.start_date}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Return Date:</span>
                <span className="font-semibold text-[#0a2540] dark:text-white">{booking.end_date}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Total Days:</span>
                <span className="font-semibold text-[#0a2540] dark:text-white">{durationDays} Days</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Safety Check:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Valid</span>
              </div>
            </div>
          </div>

          {/* Money */}
          <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-bold text-[#0a2540] dark:text-white">4. Price & Payment</span>
              <span className="font-mono text-[#425466] dark:text-slate-400">Rwandan Francs (RWF)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#425466] dark:text-slate-300">
              <div>
                <span className="text-sm text-slate-500 block">Price / Day:</span>
                <span className="font-mono font-semibold text-[#0a2540] dark:text-white">
                  {formatRwf(vehicle.daily_rate_rwf)}
                </span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Total Price:</span>
                <span className="font-mono font-bold text-[#0a2540] dark:text-white">
                  {formatRwf(booking.total_rwf)}
                </span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Refundable Deposit:</span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">150,000 RWF</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Payment Method:</span>
                <span className="font-semibold text-[#0a2540] dark:text-white">{booking.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Simple Rules */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-[#0a2540] dark:text-white">5. Important Rules</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#425466] dark:text-slate-300 leading-relaxed">
              <div className="p-4 bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="block text-[#0a2540] dark:text-white mb-1">1. Who Drives & Where</strong>
                Only the named guest or approved driver may drive this car. Do not leave Rwanda without written approval and cross-border insurance.
              </div>

              <div className="p-4 bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="block text-[#0a2540] dark:text-white mb-1">2. Fuel & Km Limit</strong>
                Return the car with the same fuel level. Up to 350 km per day is included. Extra fuel is billed at pump price plus 10,000 RWF.
              </div>

              <div className="p-4 bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="block text-[#0a2540] dark:text-white mb-1">3. Traffic & Speed Fines</strong>
                The guest pays any traffic tickets or speed camera fines received during the rental dates.
              </div>

              <div className="p-4 bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="block text-[#0a2540] dark:text-white mb-1">4. Road Help</strong>
                If you have a flat tire or car trouble, call our 24/7 line ({companyPhone}) right away before visiting any garage.
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
            <div className="space-y-8">
              <div>
                <span className="font-bold text-[#0a2540] dark:text-white block">For {companyName}:</span>
                <span className="text-[#425466] dark:text-slate-400">Company Staff</span>
              </div>
              <div className="border-b border-slate-300 dark:border-slate-600 pb-2 flex justify-between items-end">
                <span className="font-mono text-[#0a2540] dark:text-slate-200">
                  {currentUser?.name || 'Company Manager'}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ Signed</span>
              </div>
              <div className="text-[#425466] dark:text-slate-400">Date: {agreementDate}</div>
            </div>

            <div className="space-y-8">
              <div>
                <span className="font-bold text-[#0a2540] dark:text-white block">For the Guest:</span>
                <span className="text-[#425466] dark:text-slate-400">I read and agree to these rules</span>
              </div>
              <div className="border-b border-slate-300 dark:border-slate-600 pb-2 flex justify-between items-end">
                <span className="font-mono text-[#0a2540] dark:text-slate-200">{booking.client_name}</span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold">✓ Agreed</span>
              </div>
              <div className="text-[#425466] dark:text-slate-400">Date: {agreementDate}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-[#f6f9fc] dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-sm text-[#425466] dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ready to print or save as PDF</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-sm text-[#0a2540] dark:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-full font-bold text-sm text-white transition-opacity hover:opacity-95 shadow-sm flex items-center gap-1.5"
              style={{ backgroundColor: activeColor }}
            >
              <Printer className="w-4 h-4" />
              <span>Print Paper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
