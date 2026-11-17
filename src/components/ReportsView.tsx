import React, { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  CheckCircle2,
  DollarSign,
  Car,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Vehicle, Driver, Booking, PaymentRecord, Customer } from '../types';
import { ColorTheme } from '../theme';
import { useI18n } from '../utils/i18n';

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
  onNavigateToTab,
}) => {
  const { formatMoney, tr } = useI18n();
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
        return 'Last 30 days';
      case 'q2_2026':
        return 'Apr – Jun 2026';
      case 'ytd_2026':
        return 'This year (2026)';
      case 'all':
      default:
        return 'All time';
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
      },
      {
        channel: 'Bank transfers',
        amount: bankTotal,
        pct: Math.round((bankTotal / grandTotal) * 100),
        count: bankPayments.length,
      },
      {
        channel: 'Cards & cash',
        amount: cardTotal,
        pct: Math.round((cardTotal / grandTotal) * 100),
        count: cardPayments.length,
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

  const reportTabs: { id: ReportTab; label: string }[] = [
    { id: 'utilization', label: 'Cars used' },
    { id: 'profitability', label: 'Money per car' },
    { id: 'drivers', label: 'Driver scores' },
    { id: 'revenue', label: 'Money & tax' },
    { id: 'funnel', label: 'Trip results' },
  ];

  return (
    <div className="space-y-6">
      {showExportToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900 text-white border border-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium kf-modal">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>File saved: kigalifleet_report_{period}.csv</span>
        </div>
      )}

      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Reports & Money')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('See which cars earn the most, how drivers are doing, and how much tax is due.')} ·{' '}
            <span className="font-mono text-slate-700 dark:text-slate-200">{tr(periodLabel)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
          >
            <option value="this_month">{tr('This Month (May 2026)')}</option>
            <option value="last_month">{tr('Last Month (April 2026)')}</option>
            <option value="last_30_days">{tr('Last 30 Days')}</option>
            <option value="q2_2026">Apr – Jun 2026</option>
            <option value="ytd_2026">{tr('This Year 2026')}</option>
            <option value="all">{tr('All Time')}</option>
          </select>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{tr('Download File')}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{tr('Print')}</span>
          </button>
        </div>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Money earned')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {formatMoney(financials.grossRevenue)}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
            +18.4% vs prior period
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Cars used')}</span>
            <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {utilizationMetrics.fleetUtilizationPct}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
            {utilizationMetrics.totalBookedDays}/{utilizationMetrics.totalCapacityDays} {tr('days')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Money left')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 font-mono tabular-nums">
            {formatMoney(financials.profit)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {financials.marginPct}% {tr('after costs')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Driver rating')}</span>
            <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            4.9 / 5.0
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {tr('98.2% on time at airport')}
          </p>
        </div>
      </div>

      {/* Main Reports Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        {/* Segmented Tabs */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg overflow-x-auto">
            {reportTabs.map((tab) => {
              const active = activeReportTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveReportTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tr(tab.label)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Cars Used */}
        {activeReportTab === 'utilization' && (
          <div>
            {/* Category Filter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              {categoryStats.map((cat) => {
                const isSelected = selectedCategory === cat.category;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? 'all' : cat.category)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-[#111827] accent-border shadow-xs'
                        : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">{cat.category}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {cat.count} {cat.count === 1 ? 'car' : 'cars'}
                      </span>
                    </div>
                    <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cat.utilPct}%`,
                          backgroundColor: cat.utilPct >= 75 ? '#16a34a' : 'var(--color-primary-btn-bg)',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {cat.utilPct}% ({cat.bookedDays}d)
                      </span>
                      <span className="font-mono tabular-nums">{formatMoney(cat.revenue)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {tr('How much each car is used')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {tr('Days each car worked vs days parked, and money it brought in')}
                </p>
              </div>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="accent-text text-xs font-medium hover:underline"
                >
                  Show all ({vehicles.length})
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[820px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">{tr('Car & plate')}</th>
                    <th className="py-3 px-4">{tr('Type')}</th>
                    <th className="py-3 px-4 text-right">{tr('Price / day')}</th>
                    <th className="py-3 px-4">{tr('How busy')} ({tr(periodLabel)})</th>
                    <th className="py-3 px-4 text-right">{tr('Money earned')}</th>
                    <th className="py-3 px-4">{tr('Safety')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filteredVehicles.map((v) => {
                    const daysBooked = utilizationMetrics.vehicleDaysMap[v.id] || 0;
                    const rev = utilizationMetrics.vehicleRevenueMap[v.id] || 0;
                    const util = Math.min(100, Math.round((daysBooked / daysInPeriod) * 100));

                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{v.model_name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                              {v.plate_number}
                            </span>{' '}
                            · {v.location} · {v.seating_capacity} seats
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {v.category}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                          {formatMoney(v.daily_rate_rwf)}
                        </td>

                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                              {util}% ({daysBooked}/{daysInPeriod}d)
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                              {daysInPeriod - daysBooked}d free
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${util}%`,
                                backgroundColor: util >= 70 ? '#16a34a' : 'var(--color-primary-btn-bg)',
                              }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                          {rev > 0 ? formatMoney(rev) : '—'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium">
                          {v.controle_technique_expiry ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Valid</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">Check</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Money Per Car */}
        {activeReportTab === 'profitability' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  {tr('Average earned / car / day')}
                </span>
                <div className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                  {formatMoney(Math.round(financials.grossRevenue / Math.max(1, vehicles.length * daysInPeriod)))}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                  {tr('Daily average across all cars')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  {tr('Estimated repair costs')}
                </span>
                <div className="text-xl font-semibold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                  {formatMoney(financials.maintenance)}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                  {tr('Tires, brakes, oil & safety checks')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Profit kept')}</span>
                <div className="text-xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  {financials.marginPct}% {tr('kept')}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                  {tr('Share left after car costs')}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[780px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">{tr('Car')}</th>
                    <th className="py-3 px-4 text-right">{tr('Money earned')}</th>
                    <th className="py-3 px-4 text-right">{tr('Repair cost')}</th>
                    <th className="py-3 px-4 text-right">{tr('Money left')}</th>
                    <th className="py-3 px-4 text-right">{tr('Profit %')}</th>
                    <th className="py-3 px-4 text-right">{tr('Distance driven')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {vehicles.map((v) => {
                    const gross = utilizationMetrics.vehicleRevenueMap[v.id] || 0;
                    const baseService = v.category === 'Coaster' ? 180000 : v.category === 'LandCruiser' ? 120000 : 75000;
                    const maint = Math.round(gross * 0.1) + baseService;
                    const net = gross - maint;
                    const margin = gross > 0 ? Math.round((net / gross) * 100) : 0;

                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{v.model_name}</div>
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {v.plate_number} · {v.category}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                          {formatMoney(gross)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap tabular-nums">
                          {formatMoney(maint)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                          {formatMoney(net)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                          {margin}%
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                          {v.current_odometer_km.toLocaleString()} km
                          {v.next_service_km && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Next: {v.next_service_km.toLocaleString()} km
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Driver Scores */}
        {activeReportTab === 'drivers' && (
          <div>
            <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">How your drivers are doing</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Completed trips, star ratings, and airport on-time scores
                </p>
              </div>

              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('drivers')}
                  className="accent-text text-xs font-medium hover:underline shrink-0"
                >
                  Open drivers list →
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[780px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Languages</th>
                    <th className="py-3 px-4 text-right">Trips</th>
                    <th className="py-3 px-4 text-right">Rating</th>
                    <th className="py-3 px-4 text-right">On-time</th>
                    <th className="py-3 px-4 text-right">Money brought in</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {driverPerformance.map((d) => {
                    const textClass =
                      d.status === 'Available'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : d.status === 'On Trip'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400';

                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{d.name}</div>
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.phone}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {d.language}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                          {d.trips_completed}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                          {d.rating.toFixed(1)} / 5
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {d.onTimePct}%
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                          {d.revenueGenerated > 0 ? formatMoney(d.revenueGenerated) : '—'}
                        </td>

                        <td className={`py-3.5 px-4 font-medium text-xs whitespace-nowrap ${textClass}`}>
                          {tr(d.status === 'Available' ? 'Ready' : d.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Money & Tax */}
        {activeReportTab === 'revenue' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              {paymentChannelStats.map((chan) => (
                <div
                  key={chan.channel}
                  className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">{tr(chan.channel)}</div>
                  <div className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                    {formatMoney(chan.amount)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {chan.count} {tr('payments')} · <span className="font-mono font-semibold text-slate-900 dark:text-white">{chan.pct}%</span> {tr('share')}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {tr('Rwanda Tax Summary (18% VAT)')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tr('Simple breakdown of money before tax, 18% VAT, and total billed to customers')}
                  </p>
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {tr('Tax Ready')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Before Tax')}</span>
                  <div className="text-lg font-semibold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                    {formatMoney(financials.netRevenue)}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{tr('Net earnings')}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('18% Tax (VAT)')}</span>
                  <div className="text-lg font-semibold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                    {formatMoney(financials.vat)}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{tr('Paid to RRA')}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Total With Tax')}</span>
                  <div className="text-lg font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                    {formatMoney(financials.grossRevenue)}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{tr('Full customer total')}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
                  {tr('Money by customer type')}
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4">Group</th>
                        <th className="py-3 px-4 text-right">Accounts</th>
                        <th className="py-3 px-4 text-right">Share</th>
                        <th className="py-3 px-4 text-right">Money spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {customerSegmentStats.map((seg) => (
                        <tr key={seg.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{tr(seg.name)}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                            {seg.count}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                            {seg.pct}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                            {formatMoney(seg.totalSpent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Trip Results */}
        {activeReportTab === 'funnel' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">All bookings</span>
                <div className="text-2xl font-semibold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                  {funnelMetrics.total}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Created</span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Finished trips</span>
                <div className="text-2xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  {funnelMetrics.completed}
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {funnelMetrics.completedRatePct}% success
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">On road now</span>
                <div className="text-2xl font-semibold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                  {funnelMetrics.inProgress}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Driving today</span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Cancelled</span>
                <div className="text-2xl font-semibold font-mono text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
                  {funnelMetrics.cancelled}
                </div>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {funnelMetrics.cancellationRatePct}% cancelled
                </span>
              </div>
            </div>

            <div className="p-5">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
                Common reasons for cancelling
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    <tr>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">Guest changed their travel plans</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                        60%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">Flight to Kigali was cancelled</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                        25%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">
                        MoMo payment was not finished in time
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                        15%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
