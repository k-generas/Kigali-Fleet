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
  Receipt,
  Car,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Check,
  X,
  Building2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
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

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Fuel & Gas',
  'Routine Service',
  'Repairs & Parts',
  'Insurance (Yellow Card)',
  'Contrôle Technique Prep',
  'Driver Per-Diem',
  'Parking & Airport Fees',
  'Vehicle Wash & Detail',
  'Office & Admin',
  'Taxes & Licenses',
  'Other',
];

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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'profitability'>('expenses');

  // New Expense Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Fuel & Gas');
  const [amountRwf, setAmountRwf] = useState<number>(50000);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [supplierName, setSupplierName] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [description, setDescription] = useState('');

  // Role permissions
  const canApprove = ['owner', 'manager', 'accountant', 'superadmin'].includes(
    currentUser?.role || 'owner'
  );

  // Financial Calculations: Gross Revenue from Payments
  const totalRevenueRwf = useMemo(() => {
    return payments
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount_rwf, 0);
  }, [payments]);

  // Total Expenses (Paid + Approved)
  const totalExpensesRwf = useMemo(() => {
    return expenses
      .filter((e) => e.status !== 'Rejected')
      .reduce((sum, e) => sum + e.amount_rwf, 0);
  }, [expenses]);

  const netOperatingMarginRwf = totalRevenueRwf - totalExpensesRwf;
  const marginPercentage =
    totalRevenueRwf > 0 ? Math.round((netOperatingMarginRwf / totalRevenueRwf) * 100) : 0;

  const pendingApprovalCount = expenses.filter((e) => e.status === 'Pending').length;

  // Filtered Expenses
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

  // Vehicle Profitability Engine: Real Operating ROI per Vehicle
  const vehicleProfitability = useMemo(() => {
    return vehicles.map((veh) => {
      // Find all completed payments for bookings of this vehicle
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
      recorded_by: currentUser?.name || 'Lead Accountant',
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
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Expenses & Cost Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Direct vehicle operating costs, fuel logs, driver per-diems & true net vehicle profitability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Expense Logs ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('profitability')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'profitability'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Vehicle ROI & Margins
            </button>
          </div>

          <button
            onClick={() => setIsNewExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Revenue, Operating Cost, Net Margin */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Collected Customer Revenue
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatRwf(totalRevenueRwf)}
          </div>
          <span className="text-[11px] text-slate-500">Verified EBM Payments</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Operating Expenses
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-red-500">
            {formatRwf(totalExpensesRwf)}
          </div>
          <span className="text-[11px] text-slate-500">Fuel, Repairs & Per-Diems</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Net Operating Margin
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {formatRwf(netOperatingMarginRwf)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{marginPercentage}% Net Margin</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Pending Approval
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-500">
            {pendingApprovalCount}
          </div>
          <span className="text-[11px] text-slate-500">Awaiting Accountant Sign-off</span>
        </div>
      </div>

      {/* VIEW MODE 1: EXPENSE LOGS & APPROVAL QUEUE */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="All">All Categories ({expenses.length})</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Vehicle Filter */}
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="All">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number} — {v.model_name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search expense, vendor, plate..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Title & Supplier</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Vehicle Assigned</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {exp.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          {exp.supplier_name && <span>Vendor: {exp.supplier_name}</span>}
                          {exp.receipt_ref && (
                            <>
                              <span>·</span>
                              <span className="font-mono">Ref: {exp.receipt_ref}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                          {exp.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {exp.vehicle_plate ? (
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {exp.vehicle_plate}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">General Fleet / Admin</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatRwf(exp.amount_rwf)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {exp.date}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            exp.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : exp.status === 'Approved'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                              : exp.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                          }`}
                        >
                          {exp.status === 'Paid' && <Check className="w-3 h-3" />}
                          {exp.status === 'Pending' && <Clock className="w-3 h-3" />}
                          <span>{exp.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canApprove && exp.status === 'Pending' && (
                            <button
                              onClick={() =>
                                onUpdateExpenseStatus(exp.id, 'Approved', currentUser?.name)
                              }
                              className="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold text-[11px]"
                              title="Approve Expense"
                            >
                              Approve
                            </button>
                          )}

                          {canApprove && exp.status === 'Approved' && (
                            <button
                              onClick={() =>
                                onUpdateExpenseStatus(exp.id, 'Paid', currentUser?.name)
                              }
                              className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]"
                              title="Mark as Disbursed / Paid"
                            >
                              Mark Paid
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete Record"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No expenses match your active filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: TRUE VEHICLE OPERATING ROI & NET PROFITABILITY */}
      {activeTab === 'profitability' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Vehicle Operating ROI & Profitability Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                True net operating contribution per vehicle: Gross Revenue minus direct maintenance, fuel, insurance & driver allowances.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Trips Completed</th>
                    <th className="py-3 px-4">Gross Revenue</th>
                    <th className="py-3 px-4">Operating Cost</th>
                    <th className="py-3 px-4">Net Operating Contribution</th>
                    <th className="py-3 px-4">Net Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {vehicleProfitability.map((row) => (
                    <tr key={row.vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {row.vehicle.model_name}
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {row.vehicle.plate_number}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {row.vehicle.category}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold">
                        {row.tripsCount}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRwf(row.revenue)}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-red-500">
                        {formatRwf(row.expenses)}
                      </td>

                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatRwf(row.netProfit)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, row.profitMargin))}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs">
                            {row.profitMargin}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RECORD NEW FLEET OPERATING EXPENSE
      ========================================================================= */}
      {isNewExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 sm:px-6 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Record Vehicle Operating Expense
                  </h2>
                  <span className="text-xs text-slate-500">
                    Direct cost allocation for vehicle ROI
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsNewExpenseOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Expense Title / Purpose
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 50L Diesel Refuel at TotalEnergies Kacyiru"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Expense Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Amount (RWF)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={amountRwf}
                    onChange={(e) => setAmountRwf(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Linked Vehicle (Cost Center)
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">General Overhead (No vehicle)</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} — {v.model_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Date of Incurrence
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Vendor / Garage / Payee
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. TotalEnergies or Remera Autospa"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Receipt / Invoice Ref #
                  </label>
                  <input
                    type="text"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    placeholder="e.g. TOT-88412"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Additional Notes & Details
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context on route, parts replaced or approval..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md transition-transform active:scale-95"
                >
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
