import React, { useState, useMemo } from 'react';
import {
  ExpenseRecord,
  ExpenseCategory,
  ExpenseStatus,
  Vehicle,
  Booking,
  PaymentRecord,
  User,
} from '../types';
import { ColorTheme } from '../theme';
import { formatRwf } from '../utils/collision';
import {
  DollarSign,
  Plus,
  TrendingUp,
  Clock,
  Search,
  Check,
  X,
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  vehicles: Vehicle[];
  bookings: Booking[];
  payments: PaymentRecord[];
  currentUser?: User;
  currentTheme?: ColorTheme;
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'created_at'>) => ExpenseRecord;
  onUpdateExpenseStatus: (id: string, status: ExpenseStatus, approved_by?: string) => void;
  onDeleteExpense: (id: string) => void;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'Fuel & Gas', label: 'Fuel' },
  { value: 'Routine Service', label: 'Regular Checkup' },
  { value: 'Repairs & Parts', label: 'Repairs & Parts' },
  { value: 'Insurance (Yellow Card)', label: 'Car Insurance' },
  { value: 'Contrôle Technique Prep', label: 'Safety Inspection' },
  { value: 'Driver Per-Diem', label: 'Driver Food & Stay' },
  { value: 'Parking & Airport Fees', label: 'Parking & Airport' },
  { value: 'Vehicle Wash & Detail', label: 'Car Wash' },
  { value: 'Office & Admin', label: 'Office Costs' },
  { value: 'Taxes & Licenses', label: 'Taxes & Permits' },
  { value: 'Other', label: 'Other' },
];

const getFriendlyCategory = (cat: ExpenseCategory) =>
  EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label || cat;

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  vehicles,
  bookings,
  payments,
  currentUser,
  currentTheme,
  onAddExpense,
  onUpdateExpenseStatus,
  onDeleteExpense,
}) => {
  const activeColor = currentTheme?.hex || '#635bff';
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'profitability'>('expenses');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Fuel & Gas');
  const [amountRwf, setAmountRwf] = useState<number>(50000);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [supplierName, setSupplierName] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [description, setDescription] = useState('');

  const canApprove = ['owner', 'manager', 'accountant', 'superadmin'].includes(
    currentUser?.role || 'owner'
  );

  const totalRevenueRwf = useMemo(() => {
    return payments
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount_rwf, 0);
  }, [payments]);

  const totalExpensesRwf = useMemo(() => {
    return expenses
      .filter((e) => e.status !== 'Rejected')
      .reduce((sum, e) => sum + e.amount_rwf, 0);
  }, [expenses]);

  const netOperatingMarginRwf = totalRevenueRwf - totalExpensesRwf;
  const marginPercentage =
    totalRevenueRwf > 0 ? Math.round((netOperatingMarginRwf / totalRevenueRwf) * 100) : 0;

  const pendingApprovalCount = expenses.filter((e) => e.status === 'Pending').length;

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (selectedVehicleId !== 'All' && e.vehicle_id !== selectedVehicleId) return false;
      if (selectedStatus !== 'All' && e.status !== selectedStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.vehicle_plate && e.vehicle_plate.toLowerCase().includes(q)) ||
          (e.supplier_name && e.supplier_name.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedVehicleId, selectedStatus, searchTerm]);

  const vehicleProfitability = useMemo(() => {
    return vehicles.map((veh) => {
      const vehicleBookings = bookings.filter((b) => b.vehicle_id === veh.id);
      const vehicleBookingIds = new Set(vehicleBookings.map((b) => b.id));

      const vehicleRevenue = payments
        .filter((p) => vehicleBookingIds.has(p.booking_id) && p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount_rwf, 0);

      const vehicleExpenses = expenses
        .filter((e) => e.vehicle_id === veh.id && e.status !== 'Rejected')
        .reduce((sum, e) => sum + e.amount_rwf, 0);

      const netProfit = vehicleRevenue - vehicleExpenses;
      const profitMargin = vehicleRevenue > 0 ? Math.round((netProfit / vehicleRevenue) * 100) : 0;

      return {
        vehicle: veh,
        revenue: vehicleRevenue,
        expenses: vehicleExpenses,
        netProfit,
        profitMargin,
        tripsCount: vehicleBookings.length,
      };
    });
  }, [vehicles, bookings, payments, expenses]);

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVeh = vehicles.find((v) => v.id === vehicleId);

    onAddExpense({
      title: title.trim(),
      category,
      amount_rwf: amountRwf,
      date,
      vehicle_id: vehicleId || undefined,
      vehicle_plate: targetVeh?.plate_number,
      supplier_name: supplierName.trim() || undefined,
      receipt_ref: receiptRef.trim() || undefined,
      description: description.trim() || undefined,
      status: 'Paid',
      recorded_by: currentUser?.name || 'Staff',
      approved_by: canApprove ? currentUser?.name : undefined,
    });

    setIsNewExpenseOpen(false);
    setTitle('');
    setSupplierName('');
    setReceiptRef('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="stripe-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <div className="flex items-start gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
            style={{ backgroundColor: activeColor }}
          >
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a2540] dark:text-white">
              Costs & Profit
            </h1>
            <p className="text-base text-[#425466] dark:text-slate-300 mt-1">
              Write down fuel, repairs, and driver costs to see how much profit each car makes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-bold">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-white dark:bg-slate-900 text-[#0a2540] dark:text-white shadow-xs'
                  : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
              }`}
            >
              All Costs ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('profitability')}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === 'profitability'
                  ? 'bg-white dark:bg-slate-900 text-[#0a2540] dark:text-white shadow-xs'
                  : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
              }`}
            >
              Profit Per Car
            </button>
          </div>

          <button
            onClick={() => setIsNewExpenseOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-sm hover:opacity-95 transition-opacity"
            style={{ backgroundColor: activeColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Cost</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Money In</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {formatRwf(totalRevenueRwf)}
          </div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Paid by guests</span>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Money Spent</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
            {formatRwf(totalExpensesRwf)}
          </div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Fuel, repairs & staff</span>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Money Left</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#0a2540] dark:text-white">
            {formatRwf(netOperatingMarginRwf)}
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400 font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>{marginPercentage}% profit</span>
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Waiting Check</span>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {pendingApprovalCount}
          </div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Needs approval</span>
        </div>
      </div>

      {/* Tab 1: Cost List */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="stripe-card flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-[#0a2540] dark:text-slate-200 rounded-xl p-2.5 font-medium"
              >
                <option value="All">All Types ({expenses.length})</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-[#0a2540] dark:text-slate-200 rounded-xl p-2.5 font-medium"
              >
                <option value="All">All Cars</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number} — {v.model_name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-[#0a2540] dark:text-slate-200 rounded-xl p-2.5 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Waiting</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search item, shop, or plate..."
                className="w-full pl-10 pr-3 py-2.5 bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-[#0a2540] dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3.5 bg-[#f6f9fc] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-400 text-xs font-bold uppercase">
              <div className="lg:col-span-3">Item & Shop</div>
              <div className="lg:col-span-2">Type</div>
              <div className="lg:col-span-2">Car</div>
              <div className="lg:col-span-2">Cost & Date</div>
              <div className="lg:col-span-1 text-center">Status</div>
              <div className="lg:col-span-2 text-right">Action</div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="lg:col-span-3 min-w-0">
                    <div className="font-bold text-[#0a2540] dark:text-white truncate">{exp.title}</div>
                    {(exp.supplier_name || exp.receipt_ref) && (
                      <div className="text-xs text-[#425466] dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        {exp.supplier_name && <span className="truncate">{exp.supplier_name}</span>}
                        {exp.receipt_ref && <span className="font-mono shrink-0">· #{exp.receipt_ref}</span>}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 min-w-0">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-200 font-semibold text-xs whitespace-nowrap">
                      {getFriendlyCategory(exp.category)}
                    </span>
                  </div>

                  <div className="lg:col-span-2 min-w-0">
                    {exp.vehicle_plate ? (
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        {exp.vehicle_plate}
                      </span>
                    ) : (
                      <span className="text-[#425466] dark:text-slate-400">General</span>
                    )}
                  </div>

                  <div className="lg:col-span-2 min-w-0">
                    <div className="font-mono font-bold text-[#0a2540] dark:text-white whitespace-nowrap tabular-nums">
                      {formatRwf(exp.amount_rwf)}
                    </div>
                    <div className="text-xs text-[#425466] dark:text-slate-400 font-mono mt-0.5 whitespace-nowrap tabular-nums">
                      {exp.date}
                    </div>
                  </div>

                  <div className="lg:col-span-1 flex lg:justify-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        exp.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                          : exp.status === 'Approved'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30'
                          : exp.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                      }`}
                    >
                      {exp.status === 'Paid' && <Check className="w-3.5 h-3.5 shrink-0" />}
                      {exp.status === 'Pending' && <Clock className="w-3.5 h-3.5 shrink-0" />}
                      <span>{exp.status === 'Pending' ? 'Waiting' : exp.status}</span>
                    </span>
                  </div>

                  <div className="lg:col-span-2 flex items-center lg:justify-end gap-2">
                    {canApprove && exp.status === 'Pending' && (
                      <button
                        onClick={() => onUpdateExpenseStatus(exp.id, 'Approved', currentUser?.name)}
                        className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold text-xs whitespace-nowrap"
                      >
                        Approve
                      </button>
                    )}

                    {canApprove && exp.status === 'Approved' && (
                      <button
                        onClick={() => onUpdateExpenseStatus(exp.id, 'Paid', currentUser?.name)}
                        className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-xs whitespace-nowrap"
                      >
                        Mark Paid
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredExpenses.length === 0 && (
                <div className="text-center py-10 text-[#425466] dark:text-slate-400 text-base">
                  No costs match your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Profit Per Car */}
      {activeTab === 'profitability' && (
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">Profit Per Car</h2>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              Money each car earned minus fuel, repairs, insurance, and driver costs.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-400 text-xs font-bold uppercase">
              <div className="lg:col-span-3">Car</div>
              <div className="lg:col-span-1 text-center">Trips</div>
              <div className="lg:col-span-2 text-right">Money In</div>
              <div className="lg:col-span-2 text-right">Money Spent</div>
              <div className="lg:col-span-2 text-right">Money Left</div>
              <div className="lg:col-span-2 text-right">Profit %</div>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {vehicleProfitability.map((row) => (
                <div
                  key={row.vehicle.id}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center px-4 py-4 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40"
                >
                  <div className="lg:col-span-3 min-w-0">
                    <div className="font-bold text-[#0a2540] dark:text-white truncate">{row.vehicle.model_name}</div>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        {row.vehicle.plate_number}
                      </span>
                      <span className="text-[#425466] dark:text-slate-400 truncate">· {row.vehicle.category}</span>
                    </div>
                  </div>

                  <div className="lg:col-span-1 lg:text-center font-mono font-semibold text-[#0a2540] dark:text-white">
                    {row.tripsCount} trips
                  </div>

                  <div className="lg:col-span-2 lg:text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                    {formatRwf(row.revenue)}
                  </div>

                  <div className="lg:col-span-2 lg:text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap tabular-nums">
                    {formatRwf(row.expenses)}
                  </div>

                  <div className="lg:col-span-2 lg:text-right font-mono font-extrabold text-[#0a2540] dark:text-white whitespace-nowrap tabular-nums">
                    {formatRwf(row.netProfit)}
                  </div>

                  <div className="lg:col-span-2 flex items-center lg:justify-end gap-2">
                    <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, row.profitMargin))}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-sm text-[#0a2540] dark:text-white whitespace-nowrap">
                      {row.profitMargin}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Cost */}
      {isNewExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 bg-[#f6f9fc] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">Add a Cost</h2>
                  <span className="text-sm text-[#425466] dark:text-slate-400">
                    Record money spent on a car or office
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsNewExpenseOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">What Was Bought *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 50L Diesel at Kacyiru"
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Cost Type</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-medium"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Amount (RWF) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={amountRwf}
                    onChange={(e) => setAmountRwf(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">For Which Car</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-medium"
                  >
                    <option value="">General Office Cost</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} — {v.model_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Shop or Garage</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. TotalEnergies"
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    placeholder="e.g. TOT-88412"
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Extra Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write any helpful note..."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-white font-bold shadow-sm"
                  style={{ backgroundColor: activeColor }}
                >
                  Save Cost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
