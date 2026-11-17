import React, { useState, useMemo } from 'react';
import { Customer, CustomerCategory, Booking, Vehicle } from '../types';
import {
  Building2,
  Briefcase,
  Globe,
  Compass,
  User,
  Search,
  Plus,
  X,
  Users,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { useI18n } from '../utils/i18n';
import { formatHumanDateRange } from '../utils/dates';

interface CustomersViewProps {
  customers: Customer[];
  bookings: Booking[];
  vehicles: Vehicle[];
  currentTheme?: ColorTheme;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'created_at'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  onRecordPayment: (customerId: string, amountRwf: number) => void;
  onOpenNewBookingForCustomer: (clientName: string, clientPhone: string, clientEmail: string) => void;
}

export function getCategoryBadge(category: CustomerCategory) {
  switch (category) {
    case 'Corporate':
      return {
        label: 'Company',
        icon: Building2,
        badgeClass: 'text-blue-700 dark:text-blue-400',
      };
    case 'NGO / Diplomatic':
      return {
        label: 'NGO / Group',
        icon: Briefcase,
        badgeClass: 'text-violet-700 dark:text-violet-400',
      };
    case 'Tourist / Expat':
      return {
        label: 'Visitor / Tourist',
        icon: Compass,
        badgeClass: 'text-emerald-700 dark:text-emerald-400',
      };
    case 'Travel Agency':
      return {
        label: 'Tour Partner',
        icon: Globe,
        badgeClass: 'text-cyan-700 dark:text-cyan-400',
      };
    default:
      return {
        label: 'Person',
        icon: User,
        badgeClass: 'text-slate-600 dark:text-slate-400',
      };
  }
}

const getFriendlyTerms = (terms?: string) => {
  switch (terms) {
    case 'Net-15':
      return 'Pay in 15 days';
    case 'Net-30':
      return 'Pay in 30 days';
    case 'Pre-paid 50%':
      return 'Half before trip';
    default:
      return 'Pay now (MoMo)';
  }
};

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  bookings,
  vehicles,
  onAddCustomer,
  onUpdateCustomer,
  onRecordPayment,
  onOpenNewBookingForCustomer,
}) => {
  const { currency, formatMoney, tr } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyWithBalances, setOnlyWithBalances] = useState(false);

  const [selectedDossierCustomer, setSelectedDossierCustomer] = useState<Customer | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'MTN Mobile Money' | 'Bank Transfer'>('MTN Mobile Money');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'Corporate' as CustomerCategory,
    organization: '',
    tin_number: '',
    address: '',
    credit_terms: 'Net-30' as 'Immediate MoMo' | 'Net-15' | 'Net-30' | 'Pre-paid 50%',
    discount_rate_pct: 0,
    notes: '',
  });

  const summary = useMemo(() => {
    const totalCount = customers.length;
    const groupCount = customers.filter(
      (c) => c.category === 'Corporate' || c.category === 'NGO / Diplomatic' || c.category === 'Travel Agency'
    ).length;
    const totalPaid = customers.reduce((sum, c) => sum + (c.total_spent_rwf || 0), 0);
    const totalOwed = customers.reduce((sum, c) => sum + (c.outstanding_balance_rwf || 0), 0);

    return {
      totalCount,
      groupCount,
      totalPaid,
      totalOwed,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) {
        return false;
      }
      if (onlyWithBalances && (!c.outstanding_balance_rwf || c.outstanding_balance_rwf <= 0)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchOrg = c.organization ? c.organization.toLowerCase().includes(q) : false;
        const matchPhone = c.phone.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchTin = c.tin_number ? c.tin_number.toLowerCase().includes(q) : false;
        if (!matchName && !matchOrg && !matchPhone && !matchEmail && !matchTin) {
          return false;
        }
      }
      return true;
    });
  }, [customers, selectedCategory, onlyWithBalances, searchQuery]);

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      category: customer.category,
      organization: customer.organization || '',
      tin_number: customer.tin_number || '',
      address: customer.address || '',
      credit_terms: customer.credit_terms || 'Net-30',
      discount_rate_pct: customer.discount_rate_pct || 0,
      notes: customer.notes || '',
    });
    setIsAddCustomerOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '+250 78',
      email: '',
      category: 'Corporate',
      organization: '',
      tin_number: '',
      address: 'Kigali, Rwanda',
      credit_terms: 'Net-30',
      discount_rate_pct: 0,
      notes: '',
    });
    setIsAddCustomerOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        category: formData.category,
        organization: formData.organization || undefined,
        tin_number: formData.tin_number || undefined,
        address: formData.address || undefined,
        credit_terms: formData.credit_terms,
        discount_rate_pct: Number(formData.discount_rate_pct) || 0,
        notes: formData.notes || undefined,
      });
    } else {
      onAddCustomer({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        category: formData.category,
        organization: formData.organization || undefined,
        tin_number: formData.tin_number || undefined,
        address: formData.address || undefined,
        credit_terms: formData.credit_terms,
        discount_rate_pct: Number(formData.discount_rate_pct) || 0,
        notes: formData.notes || undefined,
        total_spent_rwf: 0,
        total_bookings_count: 0,
        outstanding_balance_rwf: 0,
      });
    }

    setIsAddCustomerOpen(false);
    setEditingCustomer(null);
  };

  const handleOpenPayment = (customer: Customer) => {
    setPaymentModalCustomer(customer);
    setPaymentAmountInput(customer.outstanding_balance_rwf || 0);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCustomer || paymentAmountInput <= 0) return;
    onRecordPayment(paymentModalCustomer.id, paymentAmountInput);
    setPaymentModalCustomer(null);
  };

  const customerBookings = useMemo(() => {
    if (!selectedDossierCustomer) return [];
    return bookings.filter(
      (b) =>
        b.client_email.toLowerCase() === selectedDossierCustomer.email.toLowerCase() ||
        b.client_phone.includes(selectedDossierCustomer.phone.slice(-8)) ||
        b.client_name.toLowerCase().includes(selectedDossierCustomer.name.toLowerCase())
    );
  }, [selectedDossierCustomer, bookings]);

  const categoryTabs: { value: string; label: string }[] = [
    { value: 'All', label: tr('Everyone') },
    { value: 'Corporate', label: tr('Companies') },
    { value: 'NGO / Diplomatic', label: tr('NGOs & Embassies') },
    { value: 'Tourist / Expat', label: tr('Visitors') },
    { value: 'Travel Agency', label: tr('Tour Partners') },
    { value: 'Individual', label: tr('People') },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Customers & Groups')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Save people, companies, and tour groups you work with. Track what they paid and what they still owe.')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="accent-bg inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 transition-opacity shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{tr('Add Customer')}</span>
        </button>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('All customers')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {summary.totalCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Saved accounts & travelers
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Company accounts')}</span>
            <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {summary.groupCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Companies, NGOs & tour partners
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Total paid')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 font-mono tabular-nums">
            {formatMoney(summary.totalPaid)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Lifetime cleared payments
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Still owed')}</span>
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                summary.totalOwed > 0
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div
            className={`text-2xl font-semibold mt-2 font-mono tabular-nums ${
              summary.totalOwed > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatMoney(summary.totalOwed)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Open invoice balances
          </p>
        </div>
      </div>

      {/* Main Customers Table Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg overflow-x-auto">
            {categoryTabs.map((tab) => {
              const active = selectedCategory === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSelectedCategory(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
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

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/70 dark:bg-[#0f172a]">
              <input
                type="checkbox"
                checked={onlyWithBalances}
                onChange={(e) => setOnlyWithBalances(e.target.checked)}
                className="w-3.5 h-3.5 accent-rose-600 rounded"
              />
              <span>Owes money only</span>
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, company, phone, or TIN"
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
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[920px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Name & company</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Phone & email</th>
                <th className="py-3 px-4">Payment rules</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Owed</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
                    No customers match your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const badge = getCategoryBadge(c.category);
                  const hasBalance = (c.outstanding_balance_rwf || 0) > 0;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedDossierCustomer(c)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {c.organization || 'Personal account'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-medium text-xs ${badge.badgeClass}`}>{badge.label}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-900 dark:text-white whitespace-nowrap text-xs">
                          {c.phone}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-0.5">
                          {c.email || '—'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 dark:text-white text-sm">
                          {getFriendlyTerms(c.credit_terms)}
                          {c.discount_rate_pct ? (
                            <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {c.discount_rate_pct}% off
                            </span>
                          ) : null}
                        </div>
                        {c.tin_number && (
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            TIN: {c.tin_number}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatMoney(c.total_spent_rwf || 0)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {c.total_bookings_count || 0} trips
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {hasBalance ? (
                          <div>
                            <div className="font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                              {formatMoney(c.outstanding_balance_rwf)}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(c)}
                              className="accent-text text-xs font-medium hover:underline mt-0.5"
                            >
                              Mark paid
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Paid
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenNewBookingForCustomer(c.name, c.phone, c.email)}
                            className="accent-tint accent-text px-2.5 py-1 rounded-md text-xs font-medium hover:opacity-90"
                          >
                            Book
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          <a
                            href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                          >
                            WhatsApp
                          </a>
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

      {/* Customer Details Modal */}
      {selectedDossierCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto kf-modal">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedDossierCustomer.name}
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDossierCustomer.organization || getCategoryBadge(selectedDossierCustomer.category).label}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDossierCustomer(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Total paid</span>
                <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5 block">
                  {formatMoney(selectedDossierCustomer.total_spent_rwf || 0)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Still owed</span>
                <span
                  className={`text-base font-semibold font-mono tabular-nums mt-0.5 block ${
                    (selectedDossierCustomer.outstanding_balance_rwf || 0) > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatMoney(selectedDossierCustomer.outstanding_balance_rwf || 0)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Payment rule</span>
                <span className="font-medium text-slate-900 dark:text-white mt-0.5 block">
                  {getFriendlyTerms(selectedDossierCustomer.credit_terms)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Discount</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                  {selectedDossierCustomer.discount_rate_pct || 0}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 text-sm">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Phone & email</span>
                <span className="text-slate-900 dark:text-white font-medium mt-0.5 block">
                  <span className="font-mono">{selectedDossierCustomer.phone}</span>
                  {selectedDossierCustomer.email ? ` · ${selectedDossierCustomer.email}` : ''}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Tax ID & address</span>
                <span className="text-slate-900 dark:text-white font-medium mt-0.5 block">
                  TIN: <span className="font-mono">{selectedDossierCustomer.tin_number || 'None'}</span> ·{' '}
                  {selectedDossierCustomer.address || 'Kigali, Rwanda'}
                </span>
              </div>
              {selectedDossierCustomer.notes && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Notes</span>
                  <span className="text-slate-900 dark:text-white mt-0.5 block">
                    {selectedDossierCustomer.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Trip History */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Past & current trips ({customerBookings.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    onOpenNewBookingForCustomer(
                      selectedDossierCustomer.name,
                      selectedDossierCustomer.phone,
                      selectedDossierCustomer.email
                    );
                    setSelectedDossierCustomer(null);
                  }}
                  className="accent-text text-sm font-medium hover:underline"
                >
                  + Book new trip
                </button>
              </div>

              {customerBookings.length === 0 ? (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm bg-slate-50/90 dark:bg-slate-800/40 rounded-xl">
                  No trips recorded for this customer yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                  {customerBookings.map((b) => {
                    const veh = vehicles.find((v) => v.id === b.vehicle_id);
                    return (
                      <div key={b.id} className="p-3 flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {b.destination}
                            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                              ({b.status === 'In Progress' ? 'On road' : b.status === 'Completed' ? 'Done' : b.status})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatHumanDateRange(b.start_date, b.end_date)} · {veh?.model_name || 'Car'}{' '}
                            {veh?.plate_number ? `(${veh.plate_number})` : ''}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                            {formatMoney(b.total_rwf)}
                          </span>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.payment_status}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              {(selectedDossierCustomer.outstanding_balance_rwf || 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenPayment(selectedDossierCustomer);
                    setSelectedDossierCustomer(null);
                  }}
                  className="accent-bg px-4 py-2 rounded-lg text-sm font-medium shadow-xs"
                >
                  Mark {formatMoney(selectedDossierCustomer.outstanding_balance_rwf)} paid
                </button>
              ) : (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  {tr('Everything is paid')} ({formatMoney(0)} {tr('owed')})
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(selectedDossierCustomer);
                    setSelectedDossierCustomer(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {tr('Edit')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDossierCustomer(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {tr('Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto kf-modal">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingCustomer ? 'Edit customer' : 'Add new customer'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Full name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Customer type *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CustomerCategory })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="Corporate">Company</option>
                    <option value="NGO / Diplomatic">NGO / Embassy</option>
                    <option value="Tourist / Expat">Visitor / Tourist</option>
                    <option value="Travel Agency">Tour Partner</option>
                    <option value="Individual">Person</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Company or group</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank of Kigali"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Tax number (TIN)</label>
                  <input
                    type="text"
                    placeholder="e.g. 100293847"
                    value={formData.tin_number}
                    onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Phone number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+250 788 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Email address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">When they pay</label>
                  <select
                    value={formData.credit_terms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credit_terms: e.target.value as 'Immediate MoMo' | 'Net-15' | 'Net-30' | 'Pre-paid 50%',
                      })
                    }
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="Immediate MoMo">Pay now (MoMo / Card)</option>
                    <option value="Net-15">Pay in 15 days</option>
                    <option value="Net-30">Pay in 30 days</option>
                    <option value="Pre-paid 50%">Half before trip</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Price discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="0"
                    value={formData.discount_rate_pct}
                    onChange={(e) => setFormData({ ...formData, discount_rate_pct: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Street or area in Kigali</label>
                <input
                  type="text"
                  placeholder="e.g. Kiyovu or Kimihurura"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">Special notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Likes Land Cruiser, needs French-speaking driver"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none resize-none focus:border-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg text-sm font-medium shadow-xs"
                >
                  {editingCustomer ? 'Save changes' : 'Save customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Balance / Record Payment Modal */}
      {paymentModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 kf-modal">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Record payment</h3>
              <button
                type="button"
                onClick={() => setPaymentModalCustomer(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50/90 dark:bg-slate-800/40 p-4 rounded-xl space-y-1.5">
              <div>
                Customer:{' '}
                <strong className="font-semibold text-slate-900 dark:text-white">
                  {paymentModalCustomer.name}
                </strong>
              </div>
              <div>
                Company:{' '}
                <strong className="font-semibold text-slate-900 dark:text-white">
                  {paymentModalCustomer.organization || 'Personal'}
                </strong>
              </div>
              <div>
                Still owed:{' '}
                <strong className="font-semibold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                  {formatMoney(paymentModalCustomer.outstanding_balance_rwf || 0)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-sm">
              <div>
                <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">
                  {tr('Amount Paid (RWF)')} *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={paymentModalCustomer.outstanding_balance_rwf || 99999999}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono font-semibold outline-none focus:border-slate-400"
                />
                {currency === 'USD' && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                    ≈ {formatMoney(paymentAmountInput)}
                  </span>
                )}
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 text-xs font-medium block mb-1">How they paid</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'MTN Mobile Money' | 'Bank Transfer')}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money (MoMo)</option>
                  <option value="Bank Transfer">Bank transfer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalCustomer(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="accent-bg px-4 py-2 rounded-lg text-sm font-medium shadow-xs"
                >
                  Save {formatMoney(paymentAmountInput)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
