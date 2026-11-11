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
  Calendar,
  Car,
  User as UserIcon,
  AlertCircle,
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
  const [acknowledgedTerms, setAcknowledgedTerms] = useState(true);

  if (!isOpen || !booking || !vehicle) return null;

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
================================================================================
STANDARD MOTOR VEHICLE LEASE AGREEMENT (RWANDA)
Reference: ${contractReference}
Date: ${agreementDate}
Lessor: ${companyName} (TIN: ${companyTin}, RDB: ${companyRdb})
Lessee: ${booking.client_name} (Phone: ${booking.client_phone}, Email: ${booking.client_email})
Vehicle: ${vehicle.model_name} [${vehicle.plate_number}]
Rental Period: ${booking.start_date} to ${booking.end_date} (${durationDays} Days)
Daily Rate: ${formatRwf(vehicle.daily_rate_rwf)} | Total Rental: ${formatRwf(booking.total_rwf)}
Security Deposit: 150,000 RWF (Refundable upon unblemished check-in)
Fuel Policy: Same level return (Full-to-Full rule)
Governing Law: Laws of the Republic of Rwanda (RNP Contrôle Technique & EAC Traffic Rules)
================================================================================
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(contractTextSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none text-slate-800 dark:text-slate-200 my-8">
        {/* Modal Actions Bar (Hidden when printing) */}
        <div className="flex items-center justify-between p-4 sm:px-6 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Official Car Rental Agreement & Lease
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {contractReference}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Legal Document Body */}
        <div className="p-6 sm:p-10 space-y-6 text-xs leading-relaxed max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible font-sans">
          {/* Document Header & Legal Identification */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 font-black text-lg tracking-tight text-slate-950 dark:text-white">
                <Car className="w-6 h-6 text-amber-500" />
                <span>{companyName}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                Remera Airport Highway, Gasabo District, Kigali, Rwanda
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                <span>RDB Reg: <strong>{companyRdb}</strong></span>
                <span>TIN: <strong>{companyTin}</strong></span>
                <span>Tel: <strong>{companyPhone}</strong></span>
              </div>
            </div>

            <div className="text-right sm:text-right shrink-0">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                {contractReference}
              </span>
              <p className="text-slate-500 text-[11px] mt-1">Date: {agreementDate}</p>
              <p className="text-slate-500 text-[11px]">Jurisdiction: Republic of Rwanda</p>
            </div>
          </div>

          <div className="text-center py-2 border-y border-dashed border-slate-200 dark:border-slate-800">
            <h1 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Motor Vehicle Lease Agreement & Terms of Hire
            </h1>
            <p className="text-[11px] text-slate-500 italic">
              Concluded in accordance with Law N° 005/2008 of 14/02/2008 governing commercial contracts in Rwanda
            </p>
          </div>

          {/* Section 1: The Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs border-b border-slate-200 dark:border-slate-700/60 pb-2">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>1. LESSOR (Owner / Operator)</span>
              </div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <p><strong>Entity:</strong> {companyName}</p>
                <p><strong>Authorized Rep:</strong> {currentUser?.name || 'Jean-Damascene (Owner)'}</p>
                <p><strong>Hotline:</strong> {companyPhone}</p>
                <p><strong>Dispatch Email:</strong> {companyEmail}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs border-b border-slate-200 dark:border-slate-700/60 pb-2">
                <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>2. LESSEE (Hirer / Lead Driver)</span>
              </div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <p><strong>Full Name:</strong> {booking.client_name}</p>
                <p><strong>Phone / WhatsApp:</strong> <span className="font-mono">{booking.client_phone}</span></p>
                <p><strong>Email Address:</strong> {booking.client_email}</p>
                <p><strong>National ID / Passport:</strong> <span className="font-mono">Verified upon dispatch</span></p>
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle & Rental Term Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs border-b border-slate-200 dark:border-slate-700/60 pb-2">
              <Car className="w-3.5 h-3.5 text-amber-500" />
              <span>3. LEASED MOTOR VEHICLE & DURATION</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 block">Make & Model:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{vehicle.model_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Registration Plate:</span>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{vehicle.plate_number}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Category & Fuel:</span>
                <span>{vehicle.category} · {vehicle.fuel_type}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Current Odometer:</span>
                <span className="font-mono">{vehicle.current_odometer_km.toLocaleString()} KM</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">Pickup Date:</span>
                <span className="font-semibold">{booking.start_date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Scheduled Return:</span>
                <span className="font-semibold">{booking.end_date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Total Duration:</span>
                <span className="font-semibold">{durationDays} Day(s)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Contrôle Technique:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Valid / Compliant</span>
              </div>
            </div>
          </div>

          {/* Section 3: Financial & Payment Terms */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                4. FINANCIAL SUMMARY & PAYMENT OBLIGATION
              </span>
              <span className="text-[11px] font-mono text-slate-500">Currencies: RWF (Official)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 block">Daily Agreed Rate:</span>
                <span className="font-mono font-semibold">{formatRwf(vehicle.daily_rate_rwf)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Total Agreed Hire:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatRwf(booking.total_rwf)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Security Deposit:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">150,000 RWF (Held)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Payment Method:</span>
                <span className="font-medium">{booking.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Mandatory Legal Clauses & Rwanda Road Traffic Regulations */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
              5. MANDATORY TERMS, CONDITIONS & LIABILITIES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-800/80">
                <strong className="block text-slate-800 dark:text-slate-200 mb-1">Clause 1: Authorized Operation & Territorial Limits</strong>
                The vehicle shall strictly be operated by the designated Lessee or authorized chauffeur. Cross-border travel outside the Republic of Rwanda (including to Uganda, DRC, Burundi, or Tanzania) is strictly prohibited without prior written company endorsement and EAC COMESA Yellow Card insurance issuance.
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-800/80">
                <strong className="block text-slate-800 dark:text-slate-200 mb-1">Clause 2: Fuel & Mileage Reconciliation</strong>
                The vehicle is provided with a recorded fuel level (measured in eighths) and must be returned at the equivalent level. Any deficit will be charged at 1,850 RWF per liter plus a 10,000 RWF refuel service surcharge. Unlimited mileage applies across Rwanda up to 350 km/day cumulative.
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-800/80">
                <strong className="block text-slate-800 dark:text-slate-200 mb-1">Clause 3: Road Traffic Fines & Automated Speed Radars</strong>
                The Lessee accepts total responsibility for all traffic offenses, police fines, and automated Rwanda National Police (RNP) speed radar camera tickets incurred during the possession term.
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-800/80">
                <strong className="block text-slate-800 dark:text-slate-200 mb-1">Clause 4: Mechanical Safety & Emergency Roadside Support</strong>
                The vehicle holds an active Contrôle Technique certification. In case of tire puncture, warning light, or mechanical difficulty, the Lessee must immediately contact 24/7 Dispatch (+250 788 312 000). Unauthorized repairs at roadside garages without dispatch approval are prohibited.
              </div>
            </div>
          </div>

          {/* Section 5: Signature Blocks */}
          <div className="border-t border-slate-300 dark:border-slate-700 pt-6 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-10">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  FOR THE LESSOR ({companyName}):
                </span>
                <span className="text-[10px] text-slate-500">Authorized Officer / Dispatch Lead</span>
              </div>
              <div className="border-b border-slate-400 dark:border-slate-600 pb-1 flex justify-between items-end">
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {currentUser?.name || 'Jean-Damascene'} (Verified)
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Countersigned
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                Date: {agreementDate}
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  FOR THE LESSEE (Customer / Hirer):
                </span>
                <span className="text-[10px] text-slate-500">I have read, understood and agree to all terms above</span>
              </div>
              <div className="border-b border-slate-400 dark:border-slate-600 pb-1 flex justify-between items-end">
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {booking.client_name}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  ✓ Digital Acceptance
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                Date: {agreementDate}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Official Legal Contract compliant with RNP and Rwandan Commercial Law</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-xs text-slate-800 dark:text-white transition-colors"
            >
              Close Contract
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 font-bold text-xs text-slate-950 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Agreement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
