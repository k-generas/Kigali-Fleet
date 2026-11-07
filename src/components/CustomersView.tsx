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
  Filter,
  DollarSign,
  FileText,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Edit2,
  Trash2,
  Receipt,
  Sparkles,
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
        label: 'Corporate Client',
        icon: Building2,
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      };
    case 'NGO / Diplomatic':
      return {
        label: 'NGO / Diplomatic',
        icon: Briefcase,
        badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      };
    case 'Tourist / Expat':
      return {
        label: 'Tourist / Expat',
        icon: Compass,
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case 'Travel Agency':
      return {
        label: 'Travel Agency',
        icon: Globe,
        badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      };
    default:
      return {
        label: 'Individual',
        icon: User,
        badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      };
  }
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  bookings,
  vehicles,
  currentTheme,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onRecordPayment,
  onOpenNewBookingForCustomer,
}) => {
  const activeThemeColor = currentTheme?.hex || '#3b82f6';

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

  // Calculate dynamic metrics
  const telemetry = useMemo(() => {
    const totalCount = customers.length;
    const corporateCount = customers.filter(
      (c) => c.category === 'Corporate' || c.category === 'NGO / Diplomatic' || c.category === 'Travel Agency'
    ).length;
    const totalLTV = customers.reduce((sum, c) => sum + (c.total_spent_rwf || 0), 0);
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_balance_rwf || 0), 0);

    return {
      totalCount,
      corporateCount,
      totalLTV,
      totalOutstanding,
    };
  }, [customers]);

  // Filtered customers list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Category filter
      if (selectedCategory !== 'All' && c.category !== selectedCategory) {
        return false;
      }
      // Balance filter
      if (onlyWithBalances && (!c.outstanding_balance_rwf || c.outstanding_balance_rwf <= 0)) {
        return false;
      }
      // Search
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

  // Open Edit Customer Modal
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

  // Open Add Modal
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

  // Submit Add / Edit
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

  // Open Payment Settle Modal
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

  // Customer Bookings
  const customerBookings = useMemo(() => {
    if (!selectedDossierCustomer) return [];
    return bookings.filter(
      (b) =>
        b.client_email.toLowerCase() === selectedDossierCustomer.email.toLowerCase() ||
        b.client_phone.includes(selectedDossierCustomer.phone.slice(-8)) ||
        b.client_name.toLowerCase().includes(selectedDossierCustomer.name.toLowerCase())
    );
  }, [selectedDossierCustomer, bookings]);

  return (
    <div className="space-y-6">
      {/* Top Banner: CRM Telemetry & Action Bar */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
                Rwanda Enterprise & Tourist CRM
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
              <span>Client CRM & Corporate Accounts</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Manage corporate accounts, diplomatic delegations (UNHCR, Embassies), tour partners, and individual travelers with RRA TIN billing, credit terms (Net-30), and lifetime value (LTV).
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Total Clients</span>
              <span className="text-base font-extrabold text-white">{telemetry.totalCount}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">B2B & NGO Accounts</span>
              <span className="text-base font-extrabold text-blue-400">{telemetry.corporateCount}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Lifetime Billed (LTV)</span>
              <span className="text-base font-extrabold text-emerald-400">{formatRwf(telemetry.totalLTV)}</span>
            </div>

            {telemetry.totalOutstanding > 0 && (
              <div className="bg-rose-950/60 border border-rose-600/70 rounded-xl px-3.5 py-2 text-rose-200">
                <span className="text-rose-400 block text-[10px] uppercase font-mono font-bold">Unpaid Receivables</span>
                <span className="text-base font-extrabold text-rose-300">{formatRwf(telemetry.totalOutstanding)}</span>
              </div>
            )}

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Customer</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search name, organization, phone, TIN..."
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

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['All', 'Corporate', 'NGO / Diplomatic', 'Tourist / Expat', 'Individual', 'Travel Agency'].map(
              (cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              }
            )}

            <button
              onClick={() => setOnlyWithBalances(!onlyWithBalances)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                onlyWithBalances
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Balances Due Only
            </button>
          </div>
        </div>
      </div>

      {/* Customer Directory Table / Grid */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f172a] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Client & Organization</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Billing & Terms</th>
                <th className="py-3 px-4 text-right">Lifetime Value (LTV)</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 italic">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const badge = getCategoryBadge(c.category);
                  const IconComp = badge.icon;
                  const hasBalance = (c.outstanding_balance_rwf || 0) > 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedDossierCustomer(c)}
                    >
                      {/* Name & Org */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                          {c.name}
                        </div>
                        {c.organization ? (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{c.organization}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-mono">Individual Account</div>
                        )}
                      </td>

                      {/* Category Pill */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}
                        >
                          <IconComp className="w-3 h-3" />
                          <span>{c.category}</span>
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono text-slate-200">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{c.phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          {c.email}
                        </div>
                      </td>

                      {/* Billing & Tax */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                            {c.credit_terms || 'Immediate MoMo'}
                          </span>
                          {c.discount_rate_pct ? (
                            <span className="text-[10px] text-emerald-400 font-bold font-mono">
                              -{c.discount_rate_pct}% VIP
                            </span>
                          ) : null}
                        </div>
                        {c.tin_number && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            RRA TIN: {c.tin_number}
                          </div>
                        )}
                      </td>

                      {/* LTV */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-extrabold text-emerald-400 font-mono">
                          {formatRwf(c.total_spent_rwf || 0)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {c.total_bookings_count || 0} missions
                        </div>
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 text-right">
                        {hasBalance ? (
                          <div>
                            <span className="font-extrabold text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                              {formatRwf(c.outstanding_balance_rwf)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPayment(c);
                              }}
                              className="block text-[10px] text-blue-400 hover:text-blue-300 font-medium underline mt-1 ml-auto"
                            >
                              Settle Balance
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">0 RWF (Clear)</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div
                          className="flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onOpenNewBookingForCustomer(c.name, c.phone, c.email)}
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-colors"
                            title="Create new booking for this customer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Edit customer details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
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

      {/* Customer Dossier Modal / Slide-Over */}
      {selectedDossierCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl">
                  {(() => {
                    const Icon = getCategoryBadge(selectedDossierCustomer.category).icon;
                    return <Icon className="w-6 h-6 text-blue-400" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{selectedDossierCustomer.name}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                      #{selectedDossierCustomer.id}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400">
                    {selectedDossierCustomer.organization || selectedDossierCustomer.category}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDossierCustomer(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile & Financial Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Total Spent (LTV)</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">
                  {formatRwf(selectedDossierCustomer.total_spent_rwf || 0)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Balance Due</span>
                <span
                  className={`text-sm font-extrabold font-mono ${
                    (selectedDossierCustomer.outstanding_balance_rwf || 0) > 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {formatRwf(selectedDossierCustomer.outstanding_balance_rwf || 0)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Terms</span>
                <span className="text-xs font-bold text-white">
                  {selectedDossierCustomer.credit_terms || 'Immediate MoMo'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">VIP Discount</span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {selectedDossierCustomer.discount_rate_pct || 0}%
                </span>
              </div>
            </div>

            {/* Contact & Legal Coordinates */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <div className="space-y-1">
                <div className="text-slate-500 text-[10px] uppercase font-mono font-bold">Contact Coordinates</div>
                <div className="flex items-center gap-1.5 text-white font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedDossierCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span className="truncate">{selectedDossierCustomer.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-500 text-[10px] uppercase font-mono font-bold">RRA Tax & Billing Address</div>
                <div className="text-slate-300">
                  TIN: <strong className="text-white font-mono">{selectedDossierCustomer.tin_number || 'N/A'}</strong>
                </div>
                <div className="text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{selectedDossierCustomer.address || 'Kigali, Rwanda'}</span>
                </div>
              </div>
            </div>

            {/* Customer Special Notes */}
            {selectedDossierCustomer.notes && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-300 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> VIP Preferences & Contract Notes:
                </span>
                <p className="text-slate-300 leading-relaxed">{selectedDossierCustomer.notes}</p>
              </div>
            )}

            {/* Booking History Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Mission & Rental History ({customerBookings.length})
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
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Book New Trip</span>
                </button>
              </div>

              {customerBookings.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic bg-slate-900 rounded-xl border border-slate-800">
                  No previous bookings found for this customer profile yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {customerBookings.map((b) => {
                    const veh = vehicles.find((v) => v.id === b.vehicle_id);

                    return (
                      <div
                        key={b.id}
                        className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-amber-400 font-bold">#{b.id}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                b.status === 'Completed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : b.status === 'In Progress'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <div className="text-white font-medium">{b.destination}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {b.start_date} → {b.end_date} · {veh?.model_name || 'Vehicle'} ({veh?.plate_number})
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-emerald-400 font-mono">
                            {formatRwf(b.total_rwf)}
                          </span>
                          <div className="text-[9px] text-slate-500 font-mono">{b.payment_status}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {(selectedDossierCustomer.outstanding_balance_rwf || 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenPayment(selectedDossierCustomer);
                    setSelectedDossierCustomer(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Settle {formatRwf(selectedDossierCustomer.outstanding_balance_rwf)} Balance</span>
                </button>
              ) : (
                <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Account is fully settled (0 RWF balance)
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(selectedDossierCustomer);
                    setSelectedDossierCustomer(null);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDossierCustomer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {editingCustomer ? 'Edit Customer Profile' : 'Register New Client Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              {/* Full Name & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Client / Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Account Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CustomerCategory })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-2 text-xs focus:border-blue-500 outline-none font-medium"
                  >
                    <option value="Corporate">Corporate Client</option>
                    <option value="NGO / Diplomatic">NGO / Diplomatic</option>
                    <option value="Tourist / Expat">Tourist / Expat</option>
                    <option value="Travel Agency">Travel Agency</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
              </div>

              {/* Organization & TIN */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Organization / Employer</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank of Kigali / UNHCR"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">RRA TIN (Tax Number)</label>
                  <input
                    type="text"
                    placeholder="e.g. 100293847"
                    value={formData.tin_number}
                    onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Telephone (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    placeholder="+250 788 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Email Address</label>
                  <input
                    type="email"
                    placeholder="client@organization.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Terms & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Billing & Credit Terms</label>
                  <select
                    value={formData.credit_terms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credit_terms: e.target.value as 'Immediate MoMo' | 'Net-15' | 'Net-30' | 'Pre-paid 50%',
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-2 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="Immediate MoMo">Immediate MoMo / Card</option>
                    <option value="Net-15">Net-15 (Corporate)</option>
                    <option value="Net-30">Net-30 (Corporate / NGO)</option>
                    <option value="Pre-paid 50%">Pre-paid 50% Deposit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Corporate Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="0"
                    value={formData.discount_rate_pct}
                    onChange={(e) => setFormData({ ...formData, discount_rate_pct: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Physical / Billing Address in Kigali</label>
                <input
                  type="text"
                  placeholder="e.g. Kiyovu, KN 16 Ave / Kimihurura"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Contract Notes & VIP Preferences</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Preferred Land Cruiser V8, English/French chauffeur, airport sign requirement..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  {editingCustomer ? 'Save Changes' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Balance / Record Payment Modal */}
      {paymentModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Record Invoice Payment</h3>
              </div>
              <button
                onClick={() => setPaymentModalCustomer(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <div>Client: <strong className="text-white">{paymentModalCustomer.name}</strong></div>
              <div>Organization: <strong className="text-slate-300">{paymentModalCustomer.organization || 'Individual'}</strong></div>
              <div>Current Outstanding Balance: <strong className="text-rose-400 font-mono">{formatRwf(paymentModalCustomer.outstanding_balance_rwf || 0)}</strong></div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Payment Amount (RWF) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={paymentModalCustomer.outstanding_balance_rwf || 99999999}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Payment Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-blue-500 outline-none font-medium"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money (MoMo Merchant / Code)</option>
                  <option value="Bank Transfer">Bank Wire Transfer (Bank of Kigali / I&M)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalCustomer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Record {formatRwf(paymentAmountInput)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
