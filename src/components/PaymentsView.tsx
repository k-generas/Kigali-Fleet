import React, { useState, useMemo } from 'react';
import { PaymentRecord, PaymentMethod, PaymentRecordStatus, Booking, Customer } from '../types';
import { formatRwf } from '../utils/collision';
import {
  DollarSign,
  Receipt,
  CreditCard,
  Building2,
  Phone,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Printer,
  Sparkles,
  ExternalLink,
  X,
  FileText,
  Send,
  Radio,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
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
        bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'Airtel Money':
      return {
        label: 'Airtel Money',
        bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
      };
    case 'Bank Transfer':
      return {
        label: 'Bank Wire (BK)',
        bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400',
      };
    case 'Credit Card':
      return {
        label: 'Visa / Mastercard',
        bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        dot: 'bg-purple-400',
      };
    default:
      return {
        label: 'Cash on Delivery',
        bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        dot: 'bg-slate-400',
      };
  }
}

export function getStatusBadge(status: PaymentRecordStatus) {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Partially Paid':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'Pending':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Overdue':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  bookings,
  customers,
  currentTheme,
  currentCompany,
  currentUser,
  onAddPayment,
  onUpdatePaymentStatus,
  onGenerateEBM,
}) => {
  const activeThemeColor = currentTheme?.hex || '#3b82f6';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals
  const [selectedEBMPayment, setSelectedEBMPayment] = useState<PaymentRecord | null>(null);
  const [momoModalPayment, setMomoModalPayment] = useState<PaymentRecord | null>(null);
  const [momoPinInput, setMomoPinInput] = useState('');
  const [momoSimulationNotice, setMomoSimulationNotice] = useState<string | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // New Payment Form State
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

  // Financial Telemetry
  const telemetry = useMemo(() => {
    let totalCollected = 0;
    let totalReceivables = 0;
    let momoTotal = 0;
    let bankTotal = 0;
    let cardTotal = 0;

    payments.forEach((p) => {
      totalCollected += p.amount_rwf || 0;
      const unpaid = (p.expected_amount_rwf || 0) - (p.amount_rwf || 0);
      if (unpaid > 0) totalReceivables += unpaid;

      if (p.payment_method === 'MTN Mobile Money' || p.payment_method === 'Airtel Money') {
        momoTotal += p.amount_rwf || 0;
      } else if (p.payment_method === 'Bank Transfer') {
        bankTotal += p.amount_rwf || 0;
      } else if (p.payment_method === 'Credit Card') {
        cardTotal += p.amount_rwf || 0;
      }
    });

    // 18% Rwanda VAT component calculated
    const estimatedVatRwf = Math.round((totalCollected * 18) / 118);

    return {
      totalCollected,
      totalReceivables,
      momoTotal,
      bankTotal,
      cardTotal,
      estimatedVatRwf,
    };
  }, [payments]);

  // Filtered Payments
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

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Payment ID,Booking ID,Customer,Organization,Method,Amount (RWF),Expected (RWF),Status,Date,EBM Receipt,MoMo Tx ID\n';
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
    link.setAttribute('download', `kigalifleet-financial-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit New Payment
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
    setIsRecordPaymentOpen(false);
  };

  // Trigger MTN MoMo USSD push prompt
  const handleSimulateMoMoPrompt = (payment: PaymentRecord) => {
    setMomoModalPayment(payment);
    setMomoPinInput('');
    setMomoSimulationNotice(null);
  };

  const handleConfirmMoMoPayment = () => {
    if (!momoModalPayment) return;
    setMomoSimulationNotice('Connecting to MTN Rwanda MoMo Gateway (*182*8*1#)...');
    setTimeout(() => {
      onUpdatePaymentStatus(momoModalPayment.id, 'Paid', momoModalPayment.expected_amount_rwf);
      setMomoSimulationNotice('✓ Payment of ' + formatRwf(momoModalPayment.expected_amount_rwf) + ' confirmed via MTN Mobile Money!');
      setTimeout(() => {
        setMomoModalPayment(null);
        setMomoSimulationNotice(null);
      }, 1500);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Financial Telemetry & Action Strip */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                Rwanda Revenue Authority (RRA) EBM v2.0 & MTN MoMo Gateway
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
              <span>Payments Ledger & Financial Management</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Official commercial ledger tracking MTN MoMo Merchant settlements, Bank of Kigali transfers, client accounts receivable, and RRA EBM tax invoices with 18% VAT clearance.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Total Collected (RWF)</span>
              <span className="text-base font-extrabold text-emerald-400">{formatRwf(telemetry.totalCollected)}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">MTN / Airtel MoMo</span>
              <span className="text-base font-extrabold text-amber-400">{formatRwf(telemetry.momoTotal)}</span>
            </div>

            {telemetry.totalReceivables > 0 && (
              <div className="bg-rose-950/60 border border-rose-600/70 rounded-xl px-3.5 py-2 text-rose-200">
                <span className="text-rose-400 block text-[10px] uppercase font-mono font-bold">Unpaid Receivables</span>
                <span className="text-base font-extrabold text-rose-300">{formatRwf(telemetry.totalReceivables)}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                title="Download CSV for QuickBooks / Sage / Excel"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setIsRecordPaymentOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search reference, client, MoMo ID, EBM #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Payment Method Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['All', 'MTN Mobile Money', 'Bank Transfer', 'Credit Card'].map((meth) => {
              const isSelected = methodFilter === meth;
              return (
                <button
                  key={meth}
                  onClick={() => setMethodFilter(meth)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {meth === 'All' ? 'All Channels' : meth}
                </button>
              );
            })}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-500 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Financial Ledger Table */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f172a] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Receipt & Booking</th>
                <th className="py-3 px-4">Client & Organization</th>
                <th className="py-3 px-4">Payment Channel</th>
                <th className="py-3 px-4 text-right">Amount (RWF)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">RRA EBM Invoice</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 italic">
                    No payment records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const methodBadge = getMethodBadge(p.payment_method);
                  const isUnpaid = (p.expected_amount_rwf || 0) > (p.amount_rwf || 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Receipt & Booking */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-amber-400 font-bold">{p.id}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <span>Ref: #{p.booking_id}</span>
                          <span>·</span>
                          <span>{p.date}</span>
                        </div>
                      </td>

                      {/* Client & Org */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{p.customer_name}</div>
                        {p.organization ? (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[190px]">{p.organization}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-mono">{p.customer_phone || 'Private Client'}</div>
                        )}
                      </td>

                      {/* Payment Method Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${methodBadge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${methodBadge.dot}`}></span>
                          <span>{methodBadge.label}</span>
                        </span>
                        {p.momo_tx_id && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Tx: {p.momo_tx_id}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-extrabold text-emerald-400 font-mono text-sm">
                          {formatRwf(p.amount_rwf)}
                        </div>
                        {isUnpaid && (
                          <div className="text-[10px] text-rose-400 font-mono">
                            Due: {formatRwf(p.expected_amount_rwf - p.amount_rwf)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* RRA EBM Receipt */}
                      <td className="py-3 px-4">
                        {p.ebm_receipt_number ? (
                          <button
                            onClick={() => setSelectedEBMPayment(p)}
                            className="flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30 transition-colors"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>{p.ebm_receipt_number}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onGenerateEBM(p.id)}
                            className="text-[10px] text-slate-400 hover:text-white underline font-mono"
                          >
                            + Issue RRA EBM
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.ebm_receipt_number && (
                            <button
                              onClick={() => setSelectedEBMPayment(p)}
                              className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-colors"
                              title="Print RRA EBM Tax Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isUnpaid && (
                            <button
                              onClick={() => handleSimulateMoMoPrompt(p)}
                              className="p-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-lg transition-colors font-bold text-[10px] flex items-center gap-1"
                              title="Send MTN MoMo Prompt to Client Phone"
                            >
                              <Phone className="w-3 h-3" />
                              <span>MoMo Push</span>
                            </button>
                          )}

                          {p.status !== 'Paid' && (
                            <button
                              onClick={() => onUpdatePaymentStatus(p.id, 'Paid', p.expected_amount_rwf)}
                              className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
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

      {/* Official Rwanda Revenue Authority (RRA) EBM Tax Receipt Modal */}
      {selectedEBMPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">RRA EBM v2.0 Electronic Tax Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedEBMPayment(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div
              id="printable-ebm-receipt"
              className="bg-white text-slate-950 p-5 rounded-xl border border-slate-300 font-mono text-[11px] space-y-2.5 shadow-inner"
            >
              {/* Header */}
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <div className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                  {currentCompany?.name || 'KIGALI EXPEDITION TOURS & FLEET LTD'}
                </div>
                <div className="text-[10px] text-slate-600">
                  TIN: {currentCompany?.tin_number || '102938475'} · TEL: {currentCompany?.phone || '+250 788 123 456'}
                </div>
                <div className="text-[10px] text-slate-600">
                  REPUBLIC OF RWANDA · RWANDA REVENUE AUTHORITY
                </div>
                <div className="font-bold text-slate-900 mt-1 uppercase text-[10px]">
                  *** OFFICIAL EBM TAX INVOICE ***
                </div>
              </div>

              {/* Transaction Metadata */}
              <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-400 pb-2">
                <div>RECEIPT NUMBER: <strong>{selectedEBMPayment.ebm_receipt_number || 'EBM-2026-00482'}</strong></div>
                <div>SDC NUMBER: <strong>SDC001004829</strong></div>
                <div>MRC NUMBER: <strong>KIGALIFLEET-EBM-01</strong></div>
                <div>DATE: <strong>{selectedEBMPayment.date} 14:32:10</strong></div>
                <div>CLIENT: <strong>{selectedEBMPayment.customer_name}</strong></div>
                {selectedEBMPayment.organization && <div>ORG: <strong>{selectedEBMPayment.organization}</strong></div>}
                <div>PAYMENT METHOD: <strong>{selectedEBMPayment.payment_method}</strong></div>
                {selectedEBMPayment.momo_tx_id && <div>MOMO TX REF: <strong>{selectedEBMPayment.momo_tx_id}</strong></div>}
              </div>

              {/* Items Table */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>ITEM DESCRIPTION</span>
                  <span>TOTAL (RWF)</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>Commercial Vehicle Rental (#{selectedEBMPayment.booking_id})</span>
                  <span>{formatRwf(selectedEBMPayment.amount_rwf)}</span>
                </div>
              </div>

              {/* Tax Breakdown (18% VAT) */}
              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between text-slate-600">
                  <span>NET TOTAL (TAXABLE A-EX 18%):</span>
                  <span>{formatRwf(Math.round((selectedEBMPayment.amount_rwf * 100) / 118))}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TOTAL VAT 18%:</span>
                  <span>{formatRwf(Math.round((selectedEBMPayment.amount_rwf * 18) / 118))}</span>
                </div>
                <div className="flex justify-between font-black text-xs text-slate-950 pt-1">
                  <span>TOTAL PAID INCL. VAT:</span>
                  <span>{formatRwf(selectedEBMPayment.amount_rwf)}</span>
                </div>
              </div>

              {/* Verification Signature & QR Placeholder */}
              <div className="text-center pt-1 space-y-1">
                <div className="text-[9px] text-slate-500 font-mono break-all">
                  INTERNAL DATA: RRA-KGL-84920491-KIGALIFLEET-VERIFIED
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  RECEIPT SIGNATURE: 9A82-BC49-21E0-449D
                </div>
                <div className="text-[10px] font-bold text-slate-700 mt-1">
                  MURAKOZE CYANE / THANK YOU FOR YOUR BUSINESS
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tax Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEBMPayment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MTN MoMo Push Payment Simulator Modal */}
      {momoModalPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">MTN Mobile Money Gateway</h3>
              </div>
              <button
                onClick={() => setMomoModalPayment(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {momoSimulationNotice && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs font-medium">
                {momoSimulationNotice}
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 space-y-1">
              <div>Merchant: <strong>KigaliFleet (Code: 049281)</strong></div>
              <div>Customer: <strong className="text-white">{momoModalPayment.customer_name}</strong></div>
              <div>Phone: <strong className="text-white font-mono">{momoModalPayment.customer_phone || '+250 788 123 456'}</strong></div>
              <div>Amount Due: <strong className="text-emerald-400 font-mono text-sm">{formatRwf(momoModalPayment.expected_amount_rwf)}</strong></div>
            </div>

            {/* Feature phone PIN box */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center space-y-2">
              <span className="text-[11px] text-slate-400 block font-mono">
                [MTN USSD PROMPT SENT TO PHONE]
              </span>
              <span className="text-xs text-white font-bold block">
                "Kwemera kwishyura {formatRwf(momoModalPayment.expected_amount_rwf)} kuri KigaliFleet?"
              </span>
              <input
                type="password"
                maxLength={4}
                placeholder="Shyiramo PIN (e.g. 1234)"
                value={momoPinInput}
                onChange={(e) => setMomoPinInput(e.target.value)}
                className="w-32 mx-auto text-center bg-slate-950 border border-slate-700 text-white rounded-lg p-2 font-mono tracking-widest text-sm focus:border-amber-400 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMomoModalPayment(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMoMoPayment}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Confirm Settlement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Offline / Wire Payment Modal */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Record Payment / Wire Receipt</h3>
              </div>
              <button
                onClick={() => setIsRecordPaymentOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPayment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Link to Booking:</label>
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
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-blue-500 outline-none"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} · {b.client_name} ({formatRwf(b.total_rwf)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank of Kigali / UNHCR"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Payment Channel *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-blue-500 outline-none font-medium"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Bank Transfer">Bank Wire Transfer (BK)</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Amount Received (RWF) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.amount_rwf}
                    onChange={(e) => setFormData({ ...formData, amount_rwf: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-blue-500 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentRecordStatus })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="Paid">Paid in Full</option>
                    <option value="Partially Paid">Partially Paid (Deposit)</option>
                    <option value="Pending">Pending Wire Clearance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">MoMo Tx / Swift Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. MOMO-99281920"
                    value={formData.momo_tx_id}
                    onChange={(e) => setFormData({ ...formData, momo_tx_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
