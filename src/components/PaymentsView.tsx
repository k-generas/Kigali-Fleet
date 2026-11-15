import React, { useState, useMemo } from 'react';
import { PaymentRecord, PaymentMethod, PaymentRecordStatus, Booking, Customer } from '../types';
import { formatRwf } from '../utils/collision';
import {
  Receipt,
  Building2,
  Phone,
  Search,
  Download,
  Plus,
  CheckCircle,
  Printer,
  X,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface PaymentsViewProps {
  payments: PaymentRecord[];
  bookings: Booking[];
  customers: Customer[];
  currentTheme?: ColorTheme;
  currentCompany?: any;
  currentUser?: any;
  onAddPayment: (payment: Omit<PaymentRecord, 'id' | 'created_at'>) => void;
  onUpdatePaymentStatus: (id: string, status: PaymentRecordStatus, amountPaid?: number) => void;
  onGenerateEBM: (paymentId: string) => string | null;
}

export function getMethodBadge(method: PaymentMethod) {
  switch (method) {
    case 'MTN Mobile Money':
      return {
        label: 'MTN MoMo',
        bg: 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
        dot: 'bg-amber-500',
      };
    case 'Airtel Money':
      return {
        label: 'Airtel Money',
        bg: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
        dot: 'bg-rose-500',
      };
    case 'Bank Transfer':
      return {
        label: 'Bank Transfer',
        bg: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
        dot: 'bg-blue-500',
      };
    case 'Credit Card':
      return {
        label: 'Bank Card',
        bg: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
        dot: 'bg-purple-500',
      };
    default:
      return {
        label: 'Cash',
        bg: 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
        dot: 'bg-slate-500',
      };
  }
}

export function getStatusBadge(status: PaymentRecordStatus) {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
    case 'Partially Paid':
      return 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
    case 'Pending':
      return 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
    case 'Overdue':
      return 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30';
    default:
      return 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
  }
}

function getFriendlyStatus(status: PaymentRecordStatus): string {
  switch (status) {
    case 'Paid':
      return 'Paid';
    case 'Partially Paid':
      return 'Partly Paid';
    case 'Pending':
      return 'Waiting';
    case 'Overdue':
      return 'Late';
    default:
      return status;
  }
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  bookings,
  currentTheme,
  currentCompany,
  onAddPayment,
  onUpdatePaymentStatus,
  onGenerateEBM,
}) => {
  const activeThemeColor = currentTheme?.hex || '#635bff';
  const activeBtnText = currentTheme?.btnText || 'text-white';

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [momoModalPayment, setMomoModalPayment] = useState<PaymentRecord | null>(null);
  const [momoPinInput, setMomoPinInput] = useState('');
  const [momoNotice, setMomoNotice] = useState<string | null>(null);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  const [formData, setFormData] = useState({
    booking_id: bookings[0]?.id || '',
    customer_name: bookings[0]?.client_name || '',
    customer_phone: bookings[0]?.client_phone || '+250 788 000 000',
    organization: '',
    amount_rwf: 180000,
    expected_amount_rwf: 180000,
    payment_method: 'MTN Mobile Money' as PaymentMethod,
    momo_tx_id: '',
    status: 'Paid' as PaymentRecordStatus,
    notes: '',
  });

  const totals = useMemo(() => {
    let totalCollected = 0;
    let totalUnpaid = 0;
    let momoTotal = 0;

    payments.forEach((p) => {
      totalCollected += p.amount_rwf || 0;
      const unpaid = (p.expected_amount_rwf || 0) - (p.amount_rwf || 0);
      if (unpaid > 0) totalUnpaid += unpaid;

      if (p.payment_method === 'MTN Mobile Money' || p.payment_method === 'Airtel Money') {
        momoTotal += p.amount_rwf || 0;
      }
    });

    return { totalCollected, totalUnpaid, momoTotal };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (methodFilter !== 'All' && p.payment_method !== methodFilter) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.customer_name.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchBk = p.booking_id.toLowerCase().includes(q);
        const matchOrg = p.organization ? p.organization.toLowerCase().includes(q) : false;
        const matchMomo = p.momo_tx_id ? p.momo_tx_id.toLowerCase().includes(q) : false;
        const matchEbm = p.ebm_receipt_number ? p.ebm_receipt_number.toLowerCase().includes(q) : false;
        return matchName || matchId || matchBk || matchOrg || matchMomo || matchEbm;
      }
      return true;
    });
  }, [payments, methodFilter, statusFilter, searchQuery]);

  const handleDownloadList = () => {
    const headers = 'Payment ID,Booking ID,Guest,Company,Paid By,Amount (RWF),Expected (RWF),Status,Date,Receipt #,MoMo Code\n';
    const rows = filteredPayments
      .map(
        (p) =>
          `"${p.id}","${p.booking_id}","${p.customer_name}","${p.organization || ''}","${p.payment_method}",${p.amount_rwf},${p.expected_amount_rwf},"${p.status}","${p.date}","${p.ebm_receipt_number || ''}","${p.momo_tx_id || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kigalifleet-payments-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitNewPayment = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPayment({
      booking_id: formData.booking_id,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      organization: formData.organization || undefined,
      amount_rwf: Number(formData.amount_rwf),
      expected_amount_rwf: Number(formData.expected_amount_rwf),
      payment_method: formData.payment_method,
      momo_tx_id: formData.momo_tx_id || undefined,
      date: new Date().toISOString().split('T')[0],
      status: formData.status,
      notes: formData.notes || undefined,
    });
    setIsAddPaymentOpen(false);
  };

  const handleOpenMoMoPrompt = (payment: PaymentRecord) => {
    setMomoModalPayment(payment);
    setMomoPinInput('');
    setMomoNotice(null);
  };

  const handleConfirmMoMoPayment = () => {
    if (!momoModalPayment) return;
    setMomoNotice('Sending payment request to phone (*182*8*1#)...');
    setTimeout(() => {
      onUpdatePaymentStatus(momoModalPayment.id, 'Paid', momoModalPayment.expected_amount_rwf);
      setMomoNotice('Paid! Received ' + formatRwf(momoModalPayment.expected_amount_rwf) + ' via MTN MoMo.');
      setTimeout(() => {
        setMomoModalPayment(null);
        setMomoNotice(null);
      }, 1400);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0a2540] dark:text-white tracking-tight">
              Payments & Money
            </h1>
            <p className="text-base text-[#425466] dark:text-slate-300 mt-1 max-w-2xl">
              See all money paid by guests, send MTN MoMo payment requests, and print receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
              <span className="text-xs font-semibold text-[#425466] dark:text-slate-400 block">
                Money Received
              </span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {formatRwf(totals.totalCollected)}
              </span>
            </div>

            <div className="bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
              <span className="text-xs font-semibold text-[#425466] dark:text-slate-400 block">
                Mobile Money
              </span>
              <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                {formatRwf(totals.momoTotal)}
              </span>
            </div>

            {totals.totalUnpaid > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700 rounded-xl px-4 py-2.5">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 block">
                  Still Unpaid
                </span>
                <span className="text-lg font-extrabold text-rose-700 dark:text-rose-300 font-mono tabular-nums">
                  {formatRwf(totals.totalUnpaid)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleDownloadList}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-[#425466] dark:text-slate-300" />
                <span>Download List</span>
              </button>

              <button
                onClick={() => setIsAddPaymentOpen(true)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-opacity hover:opacity-95 ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Payment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full md:flex-1 md:max-w-md min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guest name, booking #, or receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-sm text-[#0a2540] dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'All', label: 'All Ways' },
              { id: 'MTN Mobile Money', label: 'MTN MoMo' },
              { id: 'Bank Transfer', label: 'Bank Transfer' },
              { id: 'Credit Card', label: 'Bank Card' },
            ].map((meth) => {
              const isSelected = methodFilter === meth.id;
              return (
                <button
                  key={meth.id}
                  onClick={() => setMethodFilter(meth.id)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                    isSelected
                      ? `${activeBtnText} shadow-xs`
                      : 'bg-[#f6f9fc] dark:bg-slate-800 text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white border border-slate-200 dark:border-slate-700'
                  }`}
                  style={isSelected ? { backgroundColor: activeThemeColor } : undefined}
                >
                  {meth.label}
                </button>
              );
            })}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 font-semibold"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partly Paid</option>
              <option value="Pending">Waiting</option>
              <option value="Overdue">Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Payments Horizontal Grid */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-[#425466] dark:text-slate-400 uppercase tracking-wide">
          <div className="lg:col-span-2">Receipt & Date</div>
          <div className="lg:col-span-3">Guest</div>
          <div className="lg:col-span-2">Paid By</div>
          <div className="lg:col-span-2 text-right">Amount</div>
          <div className="lg:col-span-1 text-center">Status</div>
          <div className="lg:col-span-2 text-right">Receipt & Actions</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-[#425466] dark:text-slate-400">
              No payments match your search.
            </div>
          ) : (
            filteredPayments.map((p) => {
              const methodBadge = getMethodBadge(p.payment_method);
              const isUnpaid = (p.expected_amount_rwf || 0) > (p.amount_rwf || 0);

              return (
                <div
                  key={p.id}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center px-4 py-3.5 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="lg:col-span-2 min-w-0">
                    <div className="font-mono font-bold text-[#0a2540] dark:text-white truncate">{p.id}</div>
                    <div className="text-xs text-[#425466] dark:text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                      #{p.booking_id} · {p.date}
                    </div>
                  </div>

                  <div className="lg:col-span-3 min-w-0">
                    <div className="font-bold text-[#0a2540] dark:text-white truncate">{p.customer_name}</div>
                    {p.organization ? (
                      <div className="text-xs text-[#425466] dark:text-slate-400 flex items-center gap-1 mt-0.5 min-w-0">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{p.organization}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-[#425466] dark:text-slate-400 font-mono whitespace-nowrap">
                        {p.customer_phone || 'Walk-in Guest'}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${methodBadge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${methodBadge.dot}`}></span>
                      <span>{methodBadge.label}</span>
                    </span>
                    {p.momo_tx_id && (
                      <div className="text-xs text-[#425466] dark:text-slate-400 font-mono mt-1 truncate">
                        Code: {p.momo_tx_id}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 lg:text-right min-w-0">
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums whitespace-nowrap">
                      {formatRwf(p.amount_rwf)}
                    </div>
                    {isUnpaid && (
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-mono font-semibold whitespace-nowrap">
                        Left: {formatRwf(p.expected_amount_rwf - p.amount_rwf)}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-1 flex lg:justify-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusBadge(
                        p.status
                      )}`}
                    >
                      {getFriendlyStatus(p.status)}
                    </span>
                  </div>

                  <div className="lg:col-span-2 flex items-center lg:justify-end gap-2 flex-wrap">
                    {p.ebm_receipt_number ? (
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/30 transition-colors whitespace-nowrap"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>{p.ebm_receipt_number}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onGenerateEBM(p.id)}
                        className="text-xs font-semibold text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white underline whitespace-nowrap"
                      >
                        + Make Receipt
                      </button>
                    )}

                    {p.ebm_receipt_number && (
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 text-[#0a2540] dark:text-slate-200 hover:text-white rounded-full transition-colors"
                        title="Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}

                    {isUnpaid && (
                      <button
                        onClick={() => handleOpenMoMoPrompt(p)}
                        className="px-3 py-1.5 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 rounded-full transition-colors font-bold text-xs flex items-center gap-1.5 whitespace-nowrap"
                        title="Send MTN MoMo Request"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Ask MoMo</span>
                      </button>
                    )}

                    {p.status !== 'Paid' && (
                      <button
                        onClick={() => onUpdatePaymentStatus(p.id, 'Paid', p.expected_amount_rwf)}
                        className="p-2 bg-emerald-100 dark:bg-emerald-600/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-full transition-colors"
                        title="Mark as Paid"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Payment Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              id="printable-ebm-receipt"
              className="bg-white text-slate-950 p-5 rounded-xl border border-slate-300 font-mono text-xs space-y-3 shadow-inner"
            >
              <div className="text-center border-b border-dashed border-slate-400 pb-2.5">
                <div className="font-extrabold text-sm uppercase text-slate-900">
                  {currentCompany?.name || 'KIGALI EXPEDITION TOURS & FLEET LTD'}
                </div>
                <div className="text-xs text-slate-600">
                  TIN: {currentCompany?.tin_number || '102938475'} · {currentCompany?.phone || '+250 788 123 456'}
                </div>
                <div className="font-bold text-slate-900 mt-1 uppercase text-xs">
                  OFFICIAL TAX RECEIPT (RRA EBM)
                </div>
              </div>

              <div className="space-y-1 text-xs border-b border-dashed border-slate-400 pb-2.5">
                <div>Receipt #: <strong>{selectedReceipt.ebm_receipt_number || 'EBM-2026-00482'}</strong></div>
                <div>Date: <strong>{selectedReceipt.date}</strong></div>
                <div>Guest: <strong>{selectedReceipt.customer_name}</strong></div>
                {selectedReceipt.organization && <div>Company: <strong>{selectedReceipt.organization}</strong></div>}
                <div>Paid By: <strong>{selectedReceipt.payment_method}</strong></div>
                {selectedReceipt.momo_tx_id && <div>MoMo Code: <strong>{selectedReceipt.momo_tx_id}</strong></div>}
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Item</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>Car Rental (#{selectedReceipt.booking_id})</span>
                  <span>{formatRwf(selectedReceipt.amount_rwf)}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs border-b border-dashed border-slate-400 pb-2.5">
                <div className="flex justify-between text-slate-600">
                  <span>Before Tax:</span>
                  <span>{formatRwf(Math.round((selectedReceipt.amount_rwf * 100) / 118))}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (18% VAT):</span>
                  <span>{formatRwf(Math.round((selectedReceipt.amount_rwf * 18) / 118))}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-950 pt-1">
                  <span>Total Paid:</span>
                  <span>{formatRwf(selectedReceipt.amount_rwf)}</span>
                </div>
              </div>

              <div className="text-center pt-1 text-xs font-bold text-slate-700">
                MURAKOZE CYANE / THANK YOU
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MTN MoMo Request Modal */}
      {momoModalPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">MTN MoMo Payment</h3>
              </div>
              <button
                onClick={() => setMomoModalPayment(null)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {momoNotice && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 p-3 rounded-xl text-sm font-medium">
                {momoNotice}
              </div>
            )}

            <div className="bg-[#f6f9fc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm text-[#425466] dark:text-slate-300 space-y-1.5">
              <div>Pay To: <strong className="text-[#0a2540] dark:text-white">KigaliFleet (Code: 049281)</strong></div>
              <div>Guest: <strong className="text-[#0a2540] dark:text-white">{momoModalPayment.customer_name}</strong></div>
              <div>Phone: <strong className="text-[#0a2540] dark:text-white font-mono">{momoModalPayment.customer_phone || '+250 788 123 456'}</strong></div>
              <div>Amount: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-base">{formatRwf(momoModalPayment.expected_amount_rwf)}</strong></div>
            </div>

            <div className="bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center space-y-2.5">
              <span className="text-xs text-[#425466] dark:text-slate-400 block font-semibold">
                Message sent to guest phone:
              </span>
              <span className="text-sm text-[#0a2540] dark:text-white font-bold block">
                "Kwemera kwishyura {formatRwf(momoModalPayment.expected_amount_rwf)} kuri KigaliFleet?"
              </span>
              <input
                type="password"
                maxLength={4}
                placeholder="PIN (e.g. 1234)"
                value={momoPinInput}
                onChange={(e) => setMomoPinInput(e.target.value)}
                className="w-36 mx-auto text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-2.5 font-mono tracking-widest text-sm focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMomoModalPayment(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-300 rounded-full text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMoMoPayment}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full text-sm font-bold shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Add Payment</h3>
              </div>
              <button
                onClick={() => setIsAddPaymentOpen(false)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPayment} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Which Booking?</label>
                <select
                  value={formData.booking_id}
                  onChange={(e) => {
                    const bk = bookings.find((b) => b.id === e.target.value);
                    setFormData({
                      ...formData,
                      booking_id: e.target.value,
                      customer_name: bk?.client_name || formData.customer_name,
                      customer_phone: bk?.client_phone || formData.customer_phone,
                      amount_rwf: bk?.total_rwf || formData.amount_rwf,
                      expected_amount_rwf: bk?.total_rwf || formData.expected_amount_rwf,
                    });
                  }}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} · {b.client_name} ({formatRwf(b.total_rwf)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Guest Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Company (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank of Kigali"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Paid By *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none font-medium"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Bank Card</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Cash on Delivery">Cash</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Money Paid (RWF) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.amount_rwf}
                    onChange={(e) => setFormData({ ...formData, amount_rwf: Number(e.target.value) })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentRecordStatus })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="Paid">Paid in Full</option>
                    <option value="Partially Paid">Partly Paid</option>
                    <option value="Pending">Waiting</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Payment Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MOMO-992819"
                    value={formData.momo_tx_id}
                    onChange={(e) => setFormData({ ...formData, momo_tx_id: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-300 rounded-full text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-sm ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
