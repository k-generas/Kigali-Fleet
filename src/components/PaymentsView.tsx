import React, { useState, useMemo } from 'react';
import { PaymentRecord, PaymentMethod, PaymentRecordStatus, Booking, Customer } from '../types';
import {
  Search,
  Download,
  Plus,
  Printer,
  X,
  Wallet,
  Smartphone,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { useI18n } from '../utils/i18n';
import { formatHumanDate } from '../utils/dates';

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
        bg: 'text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-500',
      };
    case 'Airtel Money':
      return {
        label: 'Airtel Money',
        bg: 'text-rose-700 dark:text-rose-400',
        dot: 'bg-rose-500',
      };
    case 'Bank Transfer':
      return {
        label: 'Bank transfer',
        bg: 'text-blue-700 dark:text-blue-400',
        dot: 'bg-blue-500',
      };
    case 'Credit Card':
      return {
        label: 'Bank card',
        bg: 'text-slate-900 dark:text-white',
        dot: 'bg-slate-500',
      };
    default:
      return {
        label: 'Cash',
        bg: 'text-slate-600 dark:text-slate-400',
        dot: 'bg-slate-400',
      };
  }
}

export function getStatusBadge(status: PaymentRecordStatus) {
  switch (status) {
    case 'Paid':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'Partially Paid':
      return 'text-amber-700 dark:text-amber-400';
    case 'Pending':
      return 'text-blue-700 dark:text-blue-400';
    case 'Overdue':
      return 'text-rose-700 dark:text-rose-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}

function getFriendlyStatus(status: PaymentRecordStatus): string {
  switch (status) {
    case 'Paid':
      return 'Paid';
    case 'Partially Paid':
      return 'Partly paid';
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
  currentCompany,
  onAddPayment,
  onUpdatePaymentStatus,
  onGenerateEBM,
}) => {
  const { currency, formatMoney, tr } = useI18n();

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
    let paidCount = 0;

    payments.forEach((p) => {
      totalCollected += p.amount_rwf || 0;
      const unpaid = (p.expected_amount_rwf || 0) - (p.amount_rwf || 0);
      if (unpaid > 0) totalUnpaid += unpaid;
      if (p.status === 'Paid') paidCount += 1;

      if (p.payment_method === 'MTN Mobile Money' || p.payment_method === 'Airtel Money') {
        momoTotal += p.amount_rwf || 0;
      }
    });

    return { totalCollected, totalUnpaid, momoTotal, paidCount };
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
      setMomoNotice('Paid! Received ' + formatMoney(momoModalPayment.expected_amount_rwf) + ' via MTN MoMo.');
      setTimeout(() => {
        setMomoModalPayment(null);
        setMomoNotice(null);
      }, 1400);
    }, 700);
  };

  const methodTabs = [
    { id: 'All', label: 'All ways' },
    { id: 'MTN Mobile Money', label: 'MTN MoMo' },
    { id: 'Bank Transfer', label: 'Bank transfer' },
    { id: 'Credit Card', label: 'Bank card' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Payments & Money')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('See all money paid by guests, send MTN MoMo payment requests, and print receipts.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadList}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download list</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddPaymentOpen(true)}
            className="accent-bg inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add payment</span>
          </button>
        </div>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Money received')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 font-mono tabular-nums">
            {formatMoney(totals.totalCollected)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Cleared payments recorded
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Mobile money')}</span>
            <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {formatMoney(totals.momoTotal)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            MTN MoMo & Airtel Money
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Still unpaid')}</span>
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                totals.totalUnpaid > 0
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div
            className={`text-2xl font-semibold mt-2 font-mono tabular-nums ${
              totals.totalUnpaid > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatMoney(totals.totalUnpaid)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Remaining open balances
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Paid receipts</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {totals.paidCount} <span className="text-sm font-normal text-slate-400">/ {payments.length}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Settled in full
          </p>
        </div>
      </div>

      {/* Main Payments Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg overflow-x-auto">
            {methodTabs.map((meth) => {
              const active = methodFilter === meth.id;
              return (
                <button
                  key={meth.id}
                  type="button"
                  onClick={() => setMethodFilter(meth.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {meth.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search guest, booking # or receipt"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg pl-9 pr-8 py-1.5 w-64 outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="All">All statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partly paid</option>
              <option value="Pending">Waiting</option>
              <option value="Overdue">Late</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Receipt & date</th>
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">Paid by</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt & actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
                    No payments match your search.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const methodBadge = getMethodBadge(p.payment_method);
                  const isUnpaid = (p.expected_amount_rwf || 0) > (p.amount_rwf || 0);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-slate-900 dark:text-white">{p.id}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                          #{p.booking_id} · {formatHumanDate(p.date)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{p.customer_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.organization || p.customer_phone || 'Walk-in guest'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-medium text-xs ${methodBadge.bg}`}>
                          {methodBadge.label}
                        </span>
                        {p.momo_tx_id && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {p.momo_tx_id}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatMoney(p.amount_rwf)}
                        </div>
                        {isUnpaid && (
                          <div className="text-xs text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-0.5">
                            Left: {formatMoney(p.expected_amount_rwf - p.amount_rwf)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-medium text-xs ${getStatusBadge(p.status)}`}>
                          {getFriendlyStatus(p.status)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          {p.ebm_receipt_number ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(p)}
                              className="font-mono text-xs font-medium accent-text hover:underline"
                            >
                              {p.ebm_receipt_number}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onGenerateEBM(p.id)}
                              className="accent-text text-xs font-medium hover:underline"
                            >
                              + Make receipt
                            </button>
                          )}

                          {p.ebm_receipt_number && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(p)}
                              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              Print
                            </button>
                          )}

                          {isUnpaid && (
                            <button
                              type="button"
                              onClick={() => handleOpenMoMoPrompt(p)}
                              className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                            >
                              Ask MoMo
                            </button>
                          )}

                          {p.status !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => onUpdatePaymentStatus(p.id, 'Paid', p.expected_amount_rwf)}
                              className="accent-bg px-2.5 py-1 rounded-md text-xs font-medium hover:opacity-95"
                            >
                              Mark paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto kf-modal">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Payment receipt</h3>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              id="printable-ebm-receipt"
              className="bg-slate-50 text-slate-900 p-5 rounded-xl border border-slate-200 font-mono text-xs space-y-3"
            >
              <div className="text-center border-b border-dashed border-slate-300 pb-2.5">
                <div className="font-semibold text-sm text-slate-900">
                  {currentCompany?.name || 'KIGALI EXPEDITION TOURS & FLEET LTD'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  TIN: {currentCompany?.tin_number || '102938475'} · {currentCompany?.phone || '+250 788 123 456'}
                </div>
                <div className="font-semibold text-slate-900 mt-1 text-xs">
                  Official tax receipt (RRA EBM)
                </div>
              </div>

              <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-2.5">
                <div>
                  Receipt #: <strong className="font-semibold">{selectedReceipt.ebm_receipt_number || 'EBM-2026-00482'}</strong>
                </div>
                <div>
                  Date: <strong className="font-semibold">{formatHumanDate(selectedReceipt.date)}</strong>
                </div>
                <div>
                  Guest: <strong className="font-semibold">{selectedReceipt.customer_name}</strong>
                </div>
                {selectedReceipt.organization && (
                  <div>
                    Company: <strong className="font-semibold">{selectedReceipt.organization}</strong>
                  </div>
                )}
                <div>
                  Paid by: <strong className="font-semibold">{selectedReceipt.payment_method}</strong>
                </div>
                {selectedReceipt.momo_tx_id && (
                  <div>
                    MoMo code: <strong className="font-semibold">{selectedReceipt.momo_tx_id}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-300 pb-2.5">
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>Item</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between text-slate-900">
                  <span>Car rental (#{selectedReceipt.booking_id})</span>
                  <span>{formatMoney(selectedReceipt.amount_rwf)}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-2.5">
                <div className="flex justify-between text-slate-500">
                  <span>Before tax:</span>
                  <span>{formatMoney(Math.round((selectedReceipt.amount_rwf * 100) / 118))}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax (18% VAT):</span>
                  <span>{formatMoney(Math.round((selectedReceipt.amount_rwf * 18) / 118))}</span>
                </div>
                <div className="flex justify-between font-semibold text-sm text-slate-900 pt-1">
                  <span>Total paid:</span>
                  <span>{formatMoney(selectedReceipt.amount_rwf)}</span>
                </div>
              </div>

              <div className="text-center pt-1 text-xs font-semibold text-slate-500">
                Murakoze cyane / Thank you
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="accent-bg px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MTN MoMo Request Modal */}
      {momoModalPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 kf-modal">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">MTN MoMo payment</h3>
              <button
                type="button"
                onClick={() => setMomoModalPayment(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {momoNotice && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-sm font-medium">
                {momoNotice}
              </div>
            )}

            <div className="bg-slate-50/90 dark:bg-slate-800/40 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
              <div>
                Pay to: <strong className="font-semibold text-slate-900 dark:text-white">KigaliFleet (Code: 049281)</strong>
              </div>
              <div>
                Guest: <strong className="font-semibold text-slate-900 dark:text-white">{momoModalPayment.customer_name}</strong>
              </div>
              <div>
                Phone:{' '}
                <strong className="font-semibold text-slate-900 dark:text-white font-mono">
                  {momoModalPayment.customer_phone || '+250 788 123 456'}
                </strong>
              </div>
              <div>
                Amount:{' '}
                <strong className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {formatMoney(momoModalPayment.expected_amount_rwf)}
                </strong>
              </div>
            </div>

            <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-xl p-4 text-center space-y-2.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Message sent to guest phone:
              </span>
              <span className="text-sm text-slate-900 dark:text-white font-semibold block">
                &ldquo;Kwemera kwishyura {formatMoney(momoModalPayment.expected_amount_rwf)} kuri KigaliFleet?&rdquo;
              </span>
              <input
                type="password"
                maxLength={4}
                placeholder="PIN (e.g. 1234)"
                value={momoPinInput}
                onChange={(e) => setMomoPinInput(e.target.value)}
                className="w-36 mx-auto text-center bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 font-mono tracking-widest text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMomoModalPayment(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMoMoPayment}
                className="accent-bg px-4 py-2 rounded-lg text-sm font-medium shadow-xs"
              >
                Mark as paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 kf-modal">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add payment</h3>
              <button
                type="button"
                onClick={() => setIsAddPaymentOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPayment} className="space-y-3.5 text-sm">
              <div>
                <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Which booking?</label>
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
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} · {b.client_name} ({formatMoney(b.total_rwf)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Guest name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Company (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank of Kigali"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Paid by *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Bank Transfer">Bank transfer</option>
                    <option value="Credit Card">Bank card</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Cash on Delivery">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">
                    {tr('Money Paid (RWF)')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.amount_rwf}
                    onChange={(e) => setFormData({ ...formData, amount_rwf: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono font-semibold outline-none focus:border-slate-400"
                  />
                  {currency === 'USD' && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                      ≈ {formatMoney(formData.amount_rwf)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentRecordStatus })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="Paid">Paid in full</option>
                    <option value="Partially Paid">Partly paid</option>
                    <option value="Pending">Waiting</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Payment code</label>
                  <input
                    type="text"
                    placeholder="e.g. MOMO-992819"
                    value={formData.momo_tx_id}
                    onChange={(e) => setFormData({ ...formData, momo_tx_id: e.target.value })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg text-sm font-medium shadow-xs"
                >
                  Save payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
