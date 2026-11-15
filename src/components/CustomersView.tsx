import React, { useState, useMemo } from 'react';
import { Customer, CustomerCategory, Booking, Vehicle } from '../types';
import { formatRwf } from '../utils/collision';
import {
  Users,
  Building2,
  Briefcase,
  Globe,
  Compass,
  User,
  Phone,
  Mail,
  MapPin,
  Search,
  Plus,
  DollarSign,
  CheckCircle,
  X,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Edit2,
  Receipt,
} from 'lucide-react';
import { ColorTheme } from '../theme';

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
        badgeClass:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
      };
    case 'NGO / Diplomatic':
      return {
        label: 'NGO / Group',
        icon: Briefcase,
        badgeClass:
          'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
      };
    case 'Tourist / Expat':
      return {
        label: 'Visitor / Tourist',
        icon: Compass,
        badgeClass:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
      };
    case 'Travel Agency':
      return {
        label: 'Tour Partner',
        icon: Globe,
        badgeClass:
          'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
      };
    default:
      return {
        label: 'Person',
        icon: User,
        badgeClass:
          'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
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
  currentTheme,
  onAddCustomer,
  onUpdateCustomer,
  onRecordPayment,
  onOpenNewBookingForCustomer,
}) => {
  const activeThemeColor = currentTheme?.hex || '#635bff';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyWithBalances, setOnlyWithBalances] = useState(false);

  // Modals state
  const [selectedDossierCustomer, setSelectedDossierCustomer] = useState<Customer | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'MTN Mobile Money' | 'Bank Transfer'>('MTN Mobile Money');

  // Form State for Add / Edit
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

  // Calculate summary totals
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

  // Filtered customers list
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
    { value: 'All', label: 'Everyone' },
    { value: 'Corporate', label: 'Companies' },
    { value: 'NGO / Diplomatic', label: 'NGOs & Embassies' },
    { value: 'Tourist / Expat', label: 'Visitors' },
    { value: 'Travel Agency', label: 'Tour Partners' },
    { value: 'Individual', label: 'People' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Summary */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white tracking-tight">
              Customers & Groups
            </h1>
            <p className="text-base text-[#425466] dark:text-slate-300 mt-1 max-w-2xl">
              Save people, companies, and tour groups you work with. Track what they paid and what they still owe.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity shrink-0"
            style={{ backgroundColor: activeThemeColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* 4 Simple Number Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400 block">
              All Customers
            </span>
            <span className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono mt-1 block">
              {summary.totalCount}
            </span>
          </div>

          <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400 block">
              Company Accounts
            </span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1 block">
              {summary.groupCount}
            </span>
          </div>

          <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400 block">
              Total Paid
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block truncate">
              {formatRwf(summary.totalPaid)}
            </span>
          </div>

          <div className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400 block">
              Still Owed
            </span>
            <span
              className={`text-xl sm:text-2xl font-extrabold font-mono mt-1 block truncate ${
                summary.totalOwed > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatRwf(summary.totalOwed)}
            </span>
          </div>
        </div>

        {/* Search & Simple Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, company, phone, or tax ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-[#0a2540] dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
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
            {categoryTabs.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all border ${
                    isSelected
                      ? 'text-white border-transparent shadow-xs'
                      : 'bg-white dark:bg-slate-950 text-[#425466] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  style={isSelected ? { backgroundColor: activeThemeColor } : undefined}
                >
                  {cat.label}
                </button>
              );
            })}

            <button
              onClick={() => setOnlyWithBalances(!onlyWithBalances)}
              className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all border ${
                onlyWithBalances
                  ? 'bg-rose-600 border-rose-600 text-white'
                  : 'bg-white dark:bg-slate-950 text-[#425466] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Owes Money Only
            </button>
          </div>
        </div>
      </div>

      {/* Customer Directory Horizontal Grid */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3.5 bg-[#f6f9fc] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-[#425466] dark:text-slate-400">
          <div className="lg:col-span-3">Name & Company</div>
          <div className="lg:col-span-2">Type</div>
          <div className="lg:col-span-2">Phone & Email</div>
          <div className="lg:col-span-2">Payment Rules</div>
          <div className="lg:col-span-1 text-right">Paid</div>
          <div className="lg:col-span-1 text-right">Owed</div>
          <div className="lg:col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-[#425466] dark:text-slate-400 text-base">
              No customers match your search.
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const badge = getCategoryBadge(c.category);
              const IconComp = badge.icon;
              const hasBalance = (c.outstanding_balance_rwf || 0) > 0;

              return (
                <div
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedDossierCustomer(c)}
                >
                  <div className="lg:col-span-3 min-w-0">
                    <div className="font-bold text-[#0a2540] dark:text-white text-base truncate">
                      {c.name}
                    </div>
                    {c.organization ? (
                      <div className="text-xs text-[#425466] dark:text-slate-400 flex items-center gap-1.5 mt-0.5 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.organization}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">Personal Account</div>
                    )}
                  </div>

                  <div className="lg:col-span-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${badge.badgeClass}`}
                    >
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className="lg:col-span-2 min-w-0">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#0a2540] dark:text-slate-200 whitespace-nowrap">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                    <div className="text-xs text-[#425466] dark:text-slate-400 truncate mt-0.5">
                      {c.email}
                    </div>
                  </div>

                  <div className="lg:col-span-2 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-200 px-2.5 py-0.5 rounded-lg font-medium whitespace-nowrap">
                        {getFriendlyTerms(c.credit_terms)}
                      </span>
                      {c.discount_rate_pct ? (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold whitespace-nowrap">
                          {c.discount_rate_pct}% off
                        </span>
                      ) : null}
                    </div>
                    {c.tin_number && (
                      <div className="text-xs text-[#425466] dark:text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                        TIN: {c.tin_number}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-1 lg:text-right min-w-0">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono whitespace-nowrap tabular-nums">
                      {formatRwf(c.total_spent_rwf || 0)}
                    </div>
                    <div className="text-xs text-[#425466] dark:text-slate-400 whitespace-nowrap">
                      {c.total_bookings_count || 0} trips
                    </div>
                  </div>

                  <div className="lg:col-span-1 lg:text-right min-w-0">
                    {hasBalance ? (
                      <div className="space-y-1">
                        <span className="inline-block font-bold text-xs text-rose-700 dark:text-rose-300 font-mono bg-rose-50 dark:bg-rose-500/15 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-500/30 whitespace-nowrap">
                          {formatRwf(c.outstanding_balance_rwf)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPayment(c);
                          }}
                          className="block text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold lg:ml-auto whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap text-xs">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Paid</span>
                      </span>
                    )}
                  </div>

                  <div
                    className="lg:col-span-1 flex items-center lg:justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onOpenNewBookingForCustomer(c.name, c.phone, c.email)}
                      className="p-1.5 bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white rounded-lg transition-colors"
                      title="Book a trip for this customer"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-lg transition-colors"
                      title="Edit customer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-lg transition-colors"
                      title="Message on WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedDossierCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 rounded-xl">
                  {(() => {
                    const Icon = getCategoryBadge(selectedDossierCustomer.category).icon;
                    return <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0a2540] dark:text-white">
                    {selectedDossierCustomer.name}
                  </h3>
                  <div className="text-sm text-[#425466] dark:text-slate-400">
                    {selectedDossierCustomer.organization || getCategoryBadge(selectedDossierCustomer.category).label}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDossierCustomer(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f6f9fc] dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
              <div>
                <span className="text-[#425466] dark:text-slate-400 block">Total Paid</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatRwf(selectedDossierCustomer.total_spent_rwf || 0)}
                </span>
              </div>

              <div>
                <span className="text-[#425466] dark:text-slate-400 block">Still Owed</span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    (selectedDossierCustomer.outstanding_balance_rwf || 0) > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-[#0a2540] dark:text-slate-300'
                  }`}
                >
                  {formatRwf(selectedDossierCustomer.outstanding_balance_rwf || 0)}
                </span>
              </div>

              <div>
                <span className="text-[#425466] dark:text-slate-400 block">Payment Rule</span>
                <span className="font-bold text-[#0a2540] dark:text-white">
                  {getFriendlyTerms(selectedDossierCustomer.credit_terms)}
                </span>
              </div>

              <div>
                <span className="text-[#425466] dark:text-slate-400 block">Discount</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {selectedDossierCustomer.discount_rate_pct || 0}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-[#f6f9fc] dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <div className="text-[#425466] dark:text-slate-400 font-bold">Phone & Email</div>
                <div className="flex items-center gap-2 text-[#0a2540] dark:text-white font-mono">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{selectedDossierCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[#425466] dark:text-slate-300">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="truncate">{selectedDossierCustomer.email || 'No email'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[#425466] dark:text-slate-400 font-bold">Tax ID & Address</div>
                <div className="text-[#0a2540] dark:text-slate-200">
                  Tax ID (TIN): <strong className="font-mono">{selectedDossierCustomer.tin_number || 'None'}</strong>
                </div>
                <div className="text-[#425466] dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{selectedDossierCustomer.address || 'Kigali, Rwanda'}</span>
                </div>
              </div>
            </div>

            {selectedDossierCustomer.notes && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl text-sm text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold block">Notes:</span>
                <p className="leading-relaxed">{selectedDossierCustomer.notes}</p>
              </div>
            )}

            {/* Trip History */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#0a2540] dark:text-white">
                  Past & Current Trips ({customerBookings.length})
                </h4>
                <button
                  onClick={() => {
                    onOpenNewBookingForCustomer(
                      selectedDossierCustomer.name,
                      selectedDossierCustomer.phone,
                      selectedDossierCustomer.email
                    );
                    setSelectedDossierCustomer(null);
                  }}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Book New Trip</span>
                </button>
              </div>

              {customerBookings.length === 0 ? (
                <div className="text-center py-6 text-[#425466] dark:text-slate-400 text-sm bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  No trips recorded for this customer yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {customerBookings.map((b) => {
                    const veh = vehicles.find((v) => v.id === b.vehicle_id);
                    return (
                      <div
                        key={b.id}
                        className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between text-sm"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0a2540] dark:text-white">{b.destination}</span>
                            <span
                              className={`text-sm px-2 py-0.5 rounded-full font-semibold ${
                                b.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  : b.status === 'In Progress'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                              }`}
                            >
                              {b.status === 'In Progress' ? 'On Road' : b.status === 'Completed' ? 'Done' : b.status}
                            </span>
                          </div>
                          <div className="text-sm text-[#425466] dark:text-slate-400 font-mono">
                            {b.start_date} → {b.end_date} · {veh?.model_name || 'Car'} ({veh?.plate_number})
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                            {formatRwf(b.total_rwf)}
                          </span>
                          <div className="text-sm text-[#425466] dark:text-slate-400">{b.payment_status}</div>
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
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Mark {formatRwf(selectedDossierCustomer.outstanding_balance_rwf)} Paid</span>
                </button>
              ) : (
                <div className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Everything is paid (0 RWF owed)
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(selectedDossierCustomer);
                    setSelectedDossierCustomer(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full text-sm font-semibold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDossierCustomer(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 rounded-full text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Customer Type *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CustomerCategory })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 outline-none font-medium"
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
                <div className="space-y-1">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Company or Group</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank of Kigali"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Tax Number (TIN)</label>
                  <input
                    type="text"
                    placeholder="e.g. 100293847"
                    value={formData.tin_number}
                    onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+250 788 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">When They Pay</label>
                  <select
                    value={formData.credit_terms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credit_terms: e.target.value as 'Immediate MoMo' | 'Net-15' | 'Net-30' | 'Pre-paid 50%',
                      })
                    }
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="Immediate MoMo">Pay Now (MoMo / Card)</option>
                    <option value="Net-15">Pay in 15 Days</option>
                    <option value="Net-30">Pay in 30 Days</option>
                    <option value="Pre-paid 50%">Half Before Trip</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Price Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="0"
                    value={formData.discount_rate_pct}
                    onChange={(e) => setFormData({ ...formData, discount_rate_pct: Number(e.target.value) })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Street or Area in Kigali</label>
                <input
                  type="text"
                  placeholder="e.g. Kiyovu or Kimihurura"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Special Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Likes Land Cruiser, needs French-speaking driver..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-300 rounded-full text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-white rounded-full text-sm font-bold shadow-sm"
                  style={{ backgroundColor: activeThemeColor }}
                >
                  {editingCustomer ? 'Save Changes' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Balance / Record Payment Modal */}
      {paymentModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Record Payment</h3>
              </div>
              <button
                onClick={() => setPaymentModalCustomer(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-[#425466] dark:text-slate-300 bg-[#f6f9fc] dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div>Customer: <strong className="text-[#0a2540] dark:text-white">{paymentModalCustomer.name}</strong></div>
              <div>Company: <strong className="text-[#0a2540] dark:text-slate-200">{paymentModalCustomer.organization || 'Personal'}</strong></div>
              <div>Still Owed: <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatRwf(paymentModalCustomer.outstanding_balance_rwf || 0)}</strong></div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">Amount Paid (RWF) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={paymentModalCustomer.outstanding_balance_rwf || 99999999}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-500 outline-none font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#0a2540] dark:text-slate-200 font-semibold block">How They Paid</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'MTN Mobile Money' | 'Bank Transfer')}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-white rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 outline-none font-medium"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money (MoMo)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalCustomer(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-300 rounded-full text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-bold shadow-sm"
                >
                  Save {formatRwf(paymentAmountInput)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
