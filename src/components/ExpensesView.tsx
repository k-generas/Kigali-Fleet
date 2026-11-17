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
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useI18n } from '../utils/i18n';
import { formatHumanDate } from '../utils/dates';

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
  { value: 'Routine Service', label: 'Regular checkup' },
  { value: 'Repairs & Parts', label: 'Repairs & parts' },
  { value: 'Insurance (Yellow Card)', label: 'Car insurance' },
  { value: 'Contrôle Technique Prep', label: 'Safety inspection' },
  { value: 'Driver Per-Diem', label: 'Driver food & stay' },
  { value: 'Parking & Airport Fees', label: 'Parking & airport' },
  { value: 'Vehicle Wash & Detail', label: 'Car wash' },
  { value: 'Office & Admin', label: 'Office costs' },
  { value: 'Taxes & Licenses', label: 'Taxes & permits' },
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
  onAddExpense,
  onUpdateExpenseStatus,
  onDeleteExpense,
}) => {
  const { currency, formatMoney, tr } = useI18n();
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
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Costs & Profit')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Write down fuel, repairs, and driver costs to see how much profit each car makes.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewExpenseOpen(true)}
          className="accent-bg inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 transition-opacity shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{tr('Add Cost')}</span>
        </button>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Money in')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 font-mono tabular-nums">
            {formatMoney(totalRevenueRwf)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {tr('paid by guests')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Money spent')}</span>
            <span className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-rose-600 dark:text-rose-400 mt-2 font-mono tabular-nums">
            {formatMoney(totalExpensesRwf)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {tr('fuel, repairs & staff')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Money left')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {formatMoney(netOperatingMarginRwf)}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
            {marginPercentage}% {tr('profit')} margin
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Waiting check</span>
            <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {pendingApprovalCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Costs awaiting approval
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tr('All costs')} ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profitability')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'profitability'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tr('Profit per car')}
            </button>
          </div>

          {activeTab === 'expenses' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search item, shop or plate"
                  className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg pl-9 pr-3 py-1.5 w-52 outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="All">All types ({expenses.length})</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="All">All cars</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number} — {v.model_name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Waiting</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: All Costs Table */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[820px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Item & shop</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Car</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
                      No costs match your search.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const textClass =
                      exp.status === 'Paid'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : exp.status === 'Approved'
                        ? 'text-blue-700 dark:text-blue-400'
                        : exp.status === 'Pending'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-rose-700 dark:text-rose-400';

                    return (
                      <tr
                        key={exp.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{exp.title}</div>
                          {(exp.supplier_name || exp.receipt_ref) && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {exp.supplier_name}
                              {exp.receipt_ref ? ` · #${exp.receipt_ref}` : ''}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {getFriendlyCategory(exp.category)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {exp.vehicle_plate ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-medium text-slate-700 dark:text-slate-200">
                              {exp.vehicle_plate}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">General</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatHumanDate(exp.date)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                          {formatMoney(exp.amount_rwf)}
                        </td>

                        <td className={`py-3.5 px-4 font-medium text-xs whitespace-nowrap ${textClass}`}>
                          {exp.status === 'Pending' ? 'Waiting' : exp.status}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {canApprove && exp.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => onUpdateExpenseStatus(exp.id, 'Approved', currentUser?.name)}
                                className="accent-tint accent-text px-2.5 py-1 rounded-md text-xs font-medium hover:opacity-90"
                              >
                                Approve
                              </button>
                            )}

                            {canApprove && exp.status === 'Approved' && (
                              <button
                                type="button"
                                onClick={() => onUpdateExpenseStatus(exp.id, 'Paid', currentUser?.name)}
                                className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                              >
                                Mark paid
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onDeleteExpense(exp.id)}
                              className="px-2.5 py-1 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Profit Per Car Table */}
        {activeTab === 'profitability' && (
          <div className="overflow-x-auto">
            <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              Money each car earned minus fuel, repairs, insurance, and driver costs.
            </div>
            <table className="w-full border-collapse text-sm min-w-[780px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Car</th>
                  <th className="py-3 px-4 text-right">Trips</th>
                  <th className="py-3 px-4 text-right">Money in</th>
                  <th className="py-3 px-4 text-right">Money spent</th>
                  <th className="py-3 px-4 text-right">Money left</th>
                  <th className="py-3 px-4 text-right">Profit %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {vehicleProfitability.map((row) => (
                  <tr
                    key={row.vehicle.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {row.vehicle.model_name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-mono">{row.vehicle.plate_number}</span> · {row.vehicle.category}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                      {row.tripsCount}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                      {formatMoney(row.revenue)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap tabular-nums">
                      {formatMoney(row.expenses)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                      {formatMoney(row.netProfit)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, row.profitMargin))}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white w-10 text-right tabular-nums">
                          {row.profitMargin}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Cost */}
      <ModalShell
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
        maxWidthClass="max-w-lg"
        asForm
        onSubmit={handleSubmitExpense}
        title="Add a cost"
        subtitle="Record money spent on a car or office"
        bodyClassName="p-5 sm:p-6 space-y-3.5 text-sm"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewExpenseOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="accent-bg px-4 py-2 rounded-lg font-medium shadow-xs cursor-pointer"
            >
              Save cost
            </button>
          </div>
        }
      >
        <div>
          <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
            What was bought *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 50L Diesel at Kacyiru"
            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Cost type</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
              {tr('Amount (RWF)')} *
            </label>
            <input
              type="number"
              required
              min={1000}
              value={amountRwf}
              onChange={(e) => setAmountRwf(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono font-semibold outline-none focus:border-slate-400"
            />
            {currency === 'USD' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                ≈ {formatMoney(amountRwf)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">For which car</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="">General office cost</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} — {v.model_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Shop or garage</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. TotalEnergies"
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Receipt number</label>
            <input
              type="text"
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
              placeholder="e.g. TOT-88412"
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 font-mono outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Extra notes</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write any helpful note"
            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none resize-none focus:border-slate-400"
          />
        </div>
      </ModalShell>
    </div>
  );
};
