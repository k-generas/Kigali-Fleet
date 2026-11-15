import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Car,
  Users,
  DollarSign,
  Calendar,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Percent,
  ArrowUpRight,
  ShieldCheck,
  Star,
  Clock,
  Building,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { Vehicle, Driver, Booking, PaymentRecord, Customer } from '../types';
import { ColorTheme } from '../theme';

interface ReportsViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  payments: PaymentRecord[];
  customers?: Customer[];
  currentTheme: ColorTheme;
  onNavigateToTab?: (tab: string) => void;
}

type PeriodFilter = 'this_month' | 'last_month' | 'last_30_days' | 'q2_2026' | 'ytd_2026' | 'all';
type ReportTab = 'utilization' | 'profitability' | 'drivers' | 'revenue' | 'funnel';

export const ReportsView: React.FC<ReportsViewProps> = ({
  vehicles,
  drivers,
  bookings,
  payments,
  customers = [],
  currentTheme,
  onNavigateToTab,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('utilization');
  const [showExportToast, setShowExportToast] = useState(false);

  const periodLabel = useMemo(() => {
    switch (period) {
      case 'this_month':
        return 'May 2026';
      case 'last_month':
        return 'April 2026';
      case 'last_30_days':
        return 'Last 30 Days';
      case 'q2_2026':
        return 'Apr – Jun 2026';
      case 'ytd_2026':
        return 'This Year (2026)';
      case 'all':
      default:
        return 'All Time';
    }
  }, [period]);

  const daysInPeriod = useMemo(() => {
    switch (period) {
      case 'this_month':
        return 31;
      case 'last_month':
        return 30;
      case 'last_30_days':
        return 30;
      case 'q2_2026':
        return 91;
      case 'ytd_2026':
        return 151;
      case 'all':
      default:
        return 180;
    }
  }, [period]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => selectedCategory === 'all' || v.category === selectedCategory);
  }, [vehicles, selectedCategory]);

  const financials = useMemo(() => {
    const totalGrossRevenue = bookings.reduce((sum, b) => {
      if (b.status === 'Cancelled') return sum;
      return sum + (b.total_rwf || 0);
    }, 0);

    const totalCollected = payments.reduce((sum, p) => {
      if (p.status === 'Refunded') return sum;
      return sum + (p.amount_rwf || 0);
    }, 0);

    const pendingCollection = bookings.reduce((sum, b) => {
      if (b.status === 'Cancelled') return sum;
      if (b.payment_status === 'Pending Payment') return sum + b.total_rwf;
      if (b.payment_status === 'Deposit Paid (MoMo)') return sum + Math.round(b.total_rwf * 0.5);
      return sum;
    }, 0);

    const totalVAT = Math.round((totalGrossRevenue * 18) / 118);
    const totalNetRevenue = totalGrossRevenue - totalVAT;

    const estimatedMaintenance = Math.round(totalGrossRevenue * 0.11) + 450000;
    const netFleetProfit = totalGrossRevenue - estimatedMaintenance;
    const netMarginPct = totalGrossRevenue > 0 ? Math.round((netFleetProfit / totalGrossRevenue) * 100) : 0;

    return {
      grossRevenue: totalGrossRevenue,
      collected: totalCollected,
      pending: pendingCollection,
      vat: totalVAT,
      netRevenue: totalNetRevenue,
      maintenance: estimatedMaintenance,
      profit: netFleetProfit,
      marginPct: netMarginPct,
    };
  }, [bookings, payments]);

  const utilizationMetrics = useMemo(() => {
    const totalCapacityDays = vehicles.length * daysInPeriod;
    let totalBookedDays = 0;

    const vehicleDaysMap: Record<string, number> = {};
    const vehicleRevenueMap: Record<string, number> = {};

    vehicles.forEach((v) => {
      vehicleDaysMap[v.id] = 0;
      vehicleRevenueMap[v.id] = 0;
    });

    bookings.forEach((b) => {
      if (b.status === 'Cancelled') return;
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      totalBookedDays += diffDays;
      if (vehicleDaysMap[b.vehicle_id] !== undefined) {
        vehicleDaysMap[b.vehicle_id] += diffDays;
        vehicleRevenueMap[b.vehicle_id] += b.total_rwf;
      }
    });

    const fleetUtilizationPct =
      totalCapacityDays > 0 ? Math.min(100, Math.round((totalBookedDays / totalCapacityDays) * 100)) : 0;

    return {
      totalCapacityDays,
      totalBookedDays,
      fleetUtilizationPct,
      vehicleDaysMap,
      vehicleRevenueMap,
    };
  }, [vehicles, bookings, daysInPeriod]);

  const categoryStats = useMemo(() => {
    const categories = ['RAV4', 'LandCruiser', 'Coaster', 'Safari Van', 'Luxury Sedan'];
    return categories.map((cat) => {
      const catVehicles = vehicles.filter((v) => v.category === cat);
      const catBookings = bookings.filter((b) => {
        const vehicle = vehicles.find((v) => v.id === b.vehicle_id);
        return vehicle?.category === cat && b.status !== 'Cancelled';
      });

      const revenue = catBookings.reduce((sum, b) => sum + b.total_rwf, 0);
      const bookedDays = catBookings.reduce((sum, b) => {
        const start = new Date(b.start_date);
        const end = new Date(b.end_date);
        return sum + Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      }, 0);

      const capacity = catVehicles.length * daysInPeriod;
      const utilPct = capacity > 0 ? Math.min(100, Math.round((bookedDays / capacity) * 100)) : 0;

      return {
        category: cat,
        count: catVehicles.length,
        bookingsCount: catBookings.length,
        revenue,
        bookedDays,
        utilPct,
      };
    });
  }, [vehicles, bookings, daysInPeriod]);

  const driverPerformance = useMemo(() => {
    return drivers.map((driver) => {
      const driverBookings = bookings.filter((b) => b.driver_id === driver.id && b.status !== 'Cancelled');
      const totalDrivenRevenue = driverBookings.reduce((sum, b) => sum + b.total_rwf, 0);
      const onTimePct = driver.trips_completed > 15 ? 98.4 : 96.0;

      return {
        ...driver,
        revenueGenerated: totalDrivenRevenue,
        onTimePct,
      };
    });
  }, [drivers, bookings]);

  const paymentChannelStats = useMemo(() => {
    const momoPayments = payments.filter((p) => p.payment_method === 'MTN Mobile Money' || p.payment_method === 'Airtel Money');
    const bankPayments = payments.filter((p) => p.payment_method === 'Bank Transfer');
    const cardPayments = payments.filter((p) => p.payment_method === 'Credit Card' || p.payment_method === 'Cash on Delivery');

    const momoTotal = momoPayments.reduce((s, p) => s + p.amount_rwf, 0);
    const bankTotal = bankPayments.reduce((s, p) => s + p.amount_rwf, 0);
    const cardTotal = cardPayments.reduce((s, p) => s + p.amount_rwf, 0);
    const grandTotal = momoTotal + bankTotal + cardTotal || 1;

    return [
      {
        channel: 'MTN & Airtel MoMo',
        amount: momoTotal,
        pct: Math.round((momoTotal / grandTotal) * 100),
        count: momoPayments.length,
        icon: DollarSign,
        color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
      },
      {
        channel: 'Bank Transfers',
        amount: bankTotal,
        pct: Math.round((bankTotal / grandTotal) * 100),
        count: bankPayments.length,
        icon: Building,
        color: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20',
      },
      {
        channel: 'Cards & Cash',
        amount: cardTotal,
        pct: Math.round((cardTotal / grandTotal) * 100),
        count: cardPayments.length,
        icon: CreditCard,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      },
    ];
  }, [payments]);

  const customerSegmentStats = useMemo(() => {
    const segments: Record<string, { label: string; count: number; totalSpent: number }> = {
      Corporate: { label: 'Companies', count: 0, totalSpent: 0 },
      'NGO / Diplomatic': { label: 'NGOs & Embassies', count: 0, totalSpent: 0 },
      'Tourist / Expat': { label: 'Visitors & Tourists', count: 0, totalSpent: 0 },
      'Travel Agency': { label: 'Tour Partners', count: 0, totalSpent: 0 },
      Individual: { label: 'Personal Customers', count: 0, totalSpent: 0 },
    };

    customers.forEach((c) => {
      const seg = segments[c.category] || segments['Individual'];
      seg.count += 1;
      seg.totalSpent += c.total_spent_rwf;
    });

    const totalSpentAll = Object.values(segments).reduce((s, x) => s + x.totalSpent, 0) || 1;

    return Object.entries(segments).map(([key, data]) => ({
      name: data.label || key,
      count: data.count,
      totalSpent: data.totalSpent,
      pct: Math.round((data.totalSpent / totalSpentAll) * 100),
    }));
  }, [customers]);

  const funnelMetrics = useMemo(() => {
    const total = bookings.length || 1;
    const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
    const inProgress = bookings.filter((b) => b.status === 'In Progress').length;
    const completed = bookings.filter((b) => b.status === 'Completed').length;
    const cancelled = bookings.filter((b) => b.status === 'Cancelled').length;

    return {
      total: bookings.length,
      confirmed,
      inProgress,
      completed,
      cancelled,
      completedRatePct: Math.round(((completed + inProgress) / total) * 100),
      cancellationRatePct: Math.round((cancelled / total) * 100),
    };
  }, [bookings]);

  const handleExportCSV = () => {
    const rows = [
      ['KigaliFleet Money and Car Report'],
      ['Period', periodLabel],
      ['Total Money Earned (RWF)', financials.grossRevenue.toString()],
      ['Cars Used Rate', `${utilizationMetrics.fleetUtilizationPct}%`],
      ['Total Cars', vehicles.length.toString()],
      ['Total Trips', bookings.length.toString()],
      [''],
      ['Car Breakdown'],
      ['Plate Number', 'Car', 'Type', 'Day Price (RWF)', 'Days Booked', 'Used %', 'Money Earned (RWF)', 'Repair Cost (RWF)', 'Money Left (RWF)'],
      ...vehicles.map((v) => {
        const days = utilizationMetrics.vehicleDaysMap[v.id] || 0;
        const rev = utilizationMetrics.vehicleRevenueMap[v.id] || 0;
        const util = Math.min(100, Math.round((days / daysInPeriod) * 100));
        const maint = Math.round(rev * 0.12) + 65000;
        const net = rev - maint;
        return [
          v.plate_number,
          v.model_name,
          v.category,
          v.daily_rate_rwf.toString(),
          days.toString(),
          `${util}%`,
          rev.toString(),
          maint.toString(),
          net.toString(),
        ];
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kigalifleet_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3500);
  };

  return (
    <div className="space-y-6">
      {showExportToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-full shadow-xl text-sm font-bold">
          <CheckCircle2 className="w-5 h-5" />
          <span>File saved: kigalifleet_report_{period}.csv</span>
        </div>
      )}

      {/* Top Header */}
      <div className="stripe-card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <div className="flex items-start gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
            style={{ backgroundColor: currentTheme.hex }}
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white tracking-tight">
                Reports & Money
              </h1>
              <span className="text-sm font-mono px-3 py-0.5 rounded-full bg-[#f6f9fc] dark:bg-slate-800 text-[#0a2540] dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700">
                {periodLabel}
              </span>
            </div>
            <p className="text-base text-[#425466] dark:text-slate-300 mt-1">
              See which cars earn the most, how drivers are doing, and how much tax is due.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-200 text-sm rounded-full px-4 py-2.5 pr-9 font-semibold outline-none appearance-none cursor-pointer"
            >
              <option value="this_month">This Month (May 2026)</option>
              <option value="last_month">Last Month (April 2026)</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="q2_2026">Apr – Jun 2026</option>
              <option value="ytd_2026">This Year 2026</option>
              <option value="all">All Time</option>
            </select>
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Download File</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-[#425466] dark:text-slate-300" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 4 Big Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Money Earned</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono">
              {financials.grossRevenue.toLocaleString()} RWF
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="w-4 h-4" />
              <span>+18.4% more than before</span>
            </div>
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Cars Used</span>
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${currentTheme.hex}20`, color: currentTheme.hex }}
            >
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono">
              {utilizationMetrics.fleetUtilizationPct}%
              <span className="text-sm font-normal text-[#425466] dark:text-slate-400 ml-2">
                ({utilizationMetrics.totalBookedDays}/{utilizationMetrics.totalCapacityDays} days)
              </span>
            </div>
            <div className="mt-1 text-sm text-[#425466] dark:text-slate-400 font-medium">
              Goal: 70%+ · <span className="text-emerald-700 dark:text-emerald-400 font-semibold">On track</span>
            </div>
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Money Left (Profit)</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono">
              {financials.profit.toLocaleString()} RWF
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-blue-700 dark:text-blue-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>{financials.marginPct}% profit after costs</span>
            </div>
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Driver Rating</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono">
              4.9 <span className="text-sm font-normal text-[#425466] dark:text-slate-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-amber-700 dark:text-amber-400 font-semibold">
              <Clock className="w-4 h-4" />
              <span>98.2% on time at airport</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Section Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          { id: 'utilization' as ReportTab, label: 'Cars Used', icon: Car },
          { id: 'profitability' as ReportTab, label: 'Money Per Car', icon: TrendingUp },
          { id: 'drivers' as ReportTab, label: 'Driver Scores', icon: Users },
          { id: 'revenue' as ReportTab, label: 'Money & Tax', icon: DollarSign },
          { id: 'funnel' as ReportTab, label: 'Trip Results', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-sm font-bold transition-all border min-w-0 ${
                isActive
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-[#425466] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              style={isActive ? { backgroundColor: currentTheme.hex } : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Cars Used */}
      {activeReportTab === 'utilization' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {categoryStats.map((cat) => (
              <div
                key={cat.category}
                onClick={() => setSelectedCategory(selectedCategory === cat.category ? 'all' : cat.category)}
                className={`stripe-card bg-white dark:bg-slate-900 border rounded-2xl p-4 cursor-pointer transition-all ${
                  selectedCategory === cat.category
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#0a2540] dark:text-white truncate">{cat.category}</span>
                  <span className="text-sm font-mono px-2 py-0.5 rounded-full bg-[#f6f9fc] dark:bg-slate-800 text-[#425466] dark:text-slate-300">
                    {cat.count} {cat.count === 1 ? 'car' : 'cars'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#425466] dark:text-slate-400">Used</span>
                    <span className="font-bold text-[#0a2540] dark:text-white font-mono">{cat.utilPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.utilPct}%`,
                        backgroundColor:
                          cat.utilPct >= 75 ? '#10b981' : cat.utilPct >= 50 ? currentTheme.hex : '#f59e0b',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#425466] dark:text-slate-400 pt-1">
                    <span>{cat.bookedDays} days</span>
                    <span className="font-mono font-semibold text-[#0a2540] dark:text-slate-200">
                      {(cat.revenue / 1000).toFixed(0)}k RWF
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">How Much Each Car Is Used</h3>
                <p className="text-sm text-[#425466] dark:text-slate-400">
                  Days each car worked vs days parked, and money it brought in
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors border ${
                    selectedCategory === 'all'
                      ? 'bg-[#0a2540] text-white border-[#0a2540] dark:bg-white dark:text-slate-900'
                      : 'bg-[#f6f9fc] dark:bg-slate-800 text-[#425466] dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  All ({vehicles.length})
                </button>
                {['RAV4', 'LandCruiser', 'Coaster', 'Safari Van', 'Luxury Sedan'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors border ${
                      selectedCategory === c
                        ? 'bg-[#0a2540] text-white border-[#0a2540] dark:bg-white dark:text-slate-900'
                        : 'bg-[#f6f9fc] dark:bg-slate-800 text-[#425466] dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3.5 bg-[#f6f9fc] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-400 text-xs font-bold uppercase">
              <div className="lg:col-span-3">Car & Plate</div>
              <div className="lg:col-span-2">Type</div>
              <div className="lg:col-span-2 text-right">Price / Day</div>
              <div className="lg:col-span-2">How Busy ({periodLabel})</div>
              <div className="lg:col-span-2 text-right">Money Earned</div>
              <div className="lg:col-span-1 text-center">Safety</div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
              {filteredVehicles.map((v) => {
                const daysBooked = utilizationMetrics.vehicleDaysMap[v.id] || 0;
                const rev = utilizationMetrics.vehicleRevenueMap[v.id] || 0;
                const util = Math.min(100, Math.round((daysBooked / daysInPeriod) * 100));

                return (
                  <div
                    key={v.id}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="lg:col-span-3 min-w-0">
                      <div className="font-bold text-[#0a2540] dark:text-white flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
                          {v.plate_number}
                        </span>
                        <span className="truncate">{v.model_name}</span>
                      </div>
                      <div className="text-xs text-[#425466] dark:text-slate-400 mt-0.5 truncate">
                        {v.location} · {v.seating_capacity} seats · {v.transmission}
                      </div>
                    </div>

                    <div className="lg:col-span-2 min-w-0">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-200 whitespace-nowrap">
                        {v.category}
                      </span>
                    </div>

                    <div className="lg:col-span-2 lg:text-right font-mono font-semibold whitespace-nowrap tabular-nums">
                      {v.daily_rate_rwf.toLocaleString()} RWF
                    </div>

                    <div className="lg:col-span-2 min-w-0">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold">
                            {util}% ({daysBooked}/{daysInPeriod}d)
                          </span>
                          <span className="text-[#425466] dark:text-slate-400">
                            {daysInPeriod - daysBooked}d free
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${util}%`,
                              backgroundColor: util >= 70 ? '#10b981' : util >= 40 ? currentTheme.hex : '#f59e0b',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 lg:text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                      {rev > 0 ? `${rev.toLocaleString()} RWF` : '—'}
                    </div>

                    <div className="lg:col-span-1 flex lg:justify-center">
                      {v.controle_technique_expiry ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Check</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Money Per Car */}
      {activeReportTab === 'profitability' && (
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Money Left After Repairs</h3>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-0.5">
              See what each car earned, what repairs cost, and how much money is left.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#f6f9fc] dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Average Earned / Car / Day</span>
              <div className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono mt-1">
                {Math.round(financials.grossRevenue / Math.max(1, vehicles.length * daysInPeriod)).toLocaleString()} RWF
              </div>
              <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">Daily average across all cars</p>
            </div>

            <div className="bg-[#f6f9fc] dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Estimated Repair Costs</span>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1">
                {financials.maintenance.toLocaleString()} RWF
              </div>
              <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">Tires, brakes, oil & safety checks</p>
            </div>

            <div className="bg-[#f6f9fc] dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Profit Kept</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {financials.marginPct}% Kept
              </div>
              <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">Share left after car costs</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-400 text-xs font-bold uppercase">
              <div className="lg:col-span-3">Car</div>
              <div className="lg:col-span-2 text-right">Money Earned</div>
              <div className="lg:col-span-2 text-right">Repair Cost</div>
              <div className="lg:col-span-2 text-right">Money Left</div>
              <div className="lg:col-span-1 text-center">Profit %</div>
              <div className="lg:col-span-2 text-right">Distance Driven</div>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
              {vehicles.map((v) => {
                const gross = utilizationMetrics.vehicleRevenueMap[v.id] || 0;
                const baseService = v.category === 'Coaster' ? 180000 : v.category === 'LandCruiser' ? 120000 : 75000;
                const maint = Math.round(gross * 0.1) + baseService;
                const net = gross - maint;
                const margin = gross > 0 ? Math.round((net / gross) * 100) : 0;

                return (
                  <div
                    key={v.id}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center px-4 py-4 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="lg:col-span-3 min-w-0">
                      <div className="font-bold text-[#0a2540] dark:text-white truncate">{v.model_name}</div>
                      <div className="font-mono text-[#425466] dark:text-slate-400 text-xs truncate">
                        {v.plate_number} · {v.category}
                      </div>
                    </div>

                    <div className="lg:col-span-2 lg:text-right font-mono font-bold whitespace-nowrap tabular-nums">
                      {gross.toLocaleString()} RWF
                    </div>

                    <div className="lg:col-span-2 lg:text-right font-mono text-amber-700 dark:text-amber-400 whitespace-nowrap tabular-nums">
                      {maint.toLocaleString()} RWF
                    </div>

                    <div className="lg:col-span-2 lg:text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                      {net.toLocaleString()} RWF
                    </div>

                    <div className="lg:col-span-1 flex lg:justify-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono whitespace-nowrap ${
                          margin >= 80
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20'
                            : margin >= 50
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20'
                        }`}
                      >
                        {margin}%
                      </span>
                    </div>

                    <div className="lg:col-span-2 lg:text-right min-w-0">
                      <div className="font-mono font-medium whitespace-nowrap">
                        {v.current_odometer_km.toLocaleString()} km
                      </div>
                      {v.next_service_km && (
                        <div className="text-xs text-[#425466] dark:text-slate-400 whitespace-nowrap">
                          Next: {v.next_service_km.toLocaleString()} km
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Driver Scores */}
      {activeReportTab === 'drivers' && (
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">How Your Drivers Are Doing</h3>
              <p className="text-sm text-[#425466] dark:text-slate-400">
                Completed trips, star ratings, and airport on-time scores
              </p>
            </div>

            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('drivers')}
                className="text-sm font-bold px-4 py-2 rounded-full bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Open Drivers List →
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-400 text-xs font-bold uppercase">
              <div className="lg:col-span-3">Driver</div>
              <div className="lg:col-span-2">Languages</div>
              <div className="lg:col-span-1 text-center">Trips</div>
              <div className="lg:col-span-2 text-center">Rating</div>
              <div className="lg:col-span-1 text-center">On-Time</div>
              <div className="lg:col-span-2 text-right">Money Brought In</div>
              <div className="lg:col-span-1 text-center">Status</div>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
              {driverPerformance.map((d) => (
                <div
                  key={d.id}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center px-4 py-4 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="lg:col-span-3 min-w-0">
                    <div className="font-bold text-[#0a2540] dark:text-white truncate">{d.name}</div>
                    <div className="font-mono text-[#425466] dark:text-slate-400 text-xs whitespace-nowrap">{d.phone}</div>
                  </div>

                  <div className="lg:col-span-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-200 whitespace-nowrap">
                      {d.language}
                    </span>
                  </div>

                  <div className="lg:col-span-1 lg:text-center font-mono font-bold">
                    {d.trips_completed}
                  </div>

                  <div className="lg:col-span-2 flex lg:justify-center">
                    <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-bold font-mono text-xs border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{d.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="lg:col-span-1 lg:text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {d.onTimePct}%
                  </div>

                  <div className="lg:col-span-2 lg:text-right font-mono font-bold whitespace-nowrap tabular-nums">
                    {d.revenueGenerated > 0 ? `${d.revenueGenerated.toLocaleString()} RWF` : '—'}
                  </div>

                  <div className="lg:col-span-1 flex lg:justify-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        d.status === 'Available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20'
                          : d.status === 'On Trip'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {d.status === 'Available' ? 'Ready' : d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Money & Tax */}
      {activeReportTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentChannelStats.map((chan) => {
              const Icon = chan.icon;
              return (
                <div key={chan.channel} className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-[#0a2540] dark:text-white">{chan.channel}</span>
                    <div className={`p-2 rounded-xl border ${chan.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono">
                    {chan.amount.toLocaleString()} RWF
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-sm">
                    <span className="text-[#425466] dark:text-slate-400">{chan.count} payments</span>
                    <span className="font-mono font-bold text-[#0a2540] dark:text-white">{chan.pct}% share</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Rwanda Tax Summary (18% VAT)</h3>
                <p className="text-sm text-[#425466] dark:text-slate-400">
                  Simple breakdown of money before tax, 18% VAT, and total billed to customers
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-sm font-bold border border-emerald-200 dark:border-emerald-500/20 w-fit">
                Tax Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Before Tax</span>
                <div className="text-xl font-extrabold text-[#0a2540] dark:text-white font-mono mt-1">
                  {financials.netRevenue.toLocaleString()} RWF
                </div>
                <span className="text-sm text-[#425466] dark:text-slate-400">Net earnings</span>
              </div>

              <div>
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">18% Tax (VAT)</span>
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1">
                  {financials.vat.toLocaleString()} RWF
                </div>
                <span className="text-sm text-[#425466] dark:text-slate-400">Paid to RRA</span>
              </div>

              <div>
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Total With Tax</span>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  {financials.grossRevenue.toLocaleString()} RWF
                </div>
                <span className="text-sm text-[#425466] dark:text-slate-400">Full customer total</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#0a2540] dark:text-white">Money By Customer Type</h4>
              <div className="space-y-2">
                {customerSegmentStats.map((seg) => (
                  <div
                    key={seg.name}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#0a2540] dark:text-white">{seg.name}</div>
                      <div className="text-sm text-[#425466] dark:text-slate-400">{seg.count} accounts</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#0a2540] dark:text-white text-sm">
                        {seg.totalSpent.toLocaleString()} RWF
                      </div>
                      <div className="text-sm text-[#425466] dark:text-slate-400 font-mono">{seg.pct}% of total</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Trip Results */}
      {activeReportTab === 'funnel' && (
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Completed vs Cancelled Trips</h3>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-0.5">
              How many bookings finish well and why some get cancelled
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">All Bookings</span>
              <div className="text-3xl font-extrabold text-[#0a2540] dark:text-white font-mono mt-1">{funnelMetrics.total}</div>
              <span className="text-sm text-[#425466] dark:text-slate-400">Created</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Finished Trips</span>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">{funnelMetrics.completed}</div>
              <span className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">{funnelMetrics.completedRatePct}% success</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">On Road Now</span>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1">{funnelMetrics.inProgress}</div>
              <span className="text-sm text-[#425466] dark:text-slate-400">Driving today</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Cancelled</span>
              <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">{funnelMetrics.cancelled}</div>
              <span className="text-sm text-rose-600 dark:text-rose-400 font-semibold">{funnelMetrics.cancellationRatePct}% cancelled</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-[#0a2540] dark:text-white">Common Reasons For Cancelling</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[#0a2540] dark:text-slate-200">Guest changed their travel plans</span>
                <span className="font-mono font-bold text-[#425466] dark:text-slate-400">60%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[#0a2540] dark:text-slate-200">Flight to Kigali was cancelled</span>
                <span className="font-mono font-bold text-[#425466] dark:text-slate-400">25%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[#0a2540] dark:text-slate-200">MoMo payment was not finished in time</span>
                <span className="font-mono font-bold text-[#425466] dark:text-slate-400">15%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
