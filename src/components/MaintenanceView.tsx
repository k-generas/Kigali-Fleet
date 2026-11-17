import React, { useState, useMemo } from 'react';
import { Plus, Search, Wrench, CalendarClock, CheckCircle2, DollarSign } from 'lucide-react';
import { Vehicle, MaintenanceRecord, MaintenanceStatus, ServiceType } from '../types';
import { ColorTheme } from '../theme';
import { useI18n } from '../utils/i18n';
import { formatHumanDateRange } from '../utils/dates';
import { ModalShell } from './ModalShell';

interface MaintenanceViewProps {
  maintenance: MaintenanceRecord[];
  vehicles: Vehicle[];
  currentTheme: ColorTheme;
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id' | 'created_at'>) => void;
  onUpdateMaintenance: (record: MaintenanceRecord) => void;
  onCompleteMaintenance: (
    id: string,
    actualOdometer?: number,
    finalCost?: number,
    nextServiceKm?: number
  ) => void;
  onDeleteMaintenance?: (id: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'Oil & Filter Change', label: 'Oil & Filter Change' },
  { value: 'Brake System & Pads', label: 'Brakes & pads' },
  { value: 'Tire Replacement (4x4)', label: 'New 4x4 tires' },
  { value: 'Safari Suspension Overhaul', label: 'Suspension repair' },
  { value: 'Contrôle Technique Prep', label: 'Safety inspection prep' },
  { value: 'Transmission & Gearbox', label: 'Gearbox repair' },
  { value: 'AC & Electrical System', label: 'AC and lights' },
  { value: 'General Inspection', label: 'General checkup' },
];

const KIGALI_GARAGES = [
  {
    name: 'CFAO Motors Rwanda (Mercedes-Benz Workshop)',
    phone: '+250 788 310 200',
    location: 'Gikondo Industrial Park, Kigali',
  },
  {
    name: 'Kigali Toyota Center (Remera HQ)',
    phone: '+250 788 412 990',
    location: 'Remera, Kigali',
  },
  {
    name: 'Akagera Motors Heavy Service Hub',
    phone: '+250 788 500 111',
    location: 'Gatsata, Kigali',
  },
  {
    name: 'Nyarutarama Auto Precision Garage',
    phone: '+250 788 620 440',
    location: 'Nyarutarama, Kigali',
  },
  {
    name: 'Kicukiro Express Lube & Alignment',
    phone: '+250 788 998 221',
    location: 'Sonatubes, Kicukiro, Kigali',
  },
];

const getServiceLabel = (st: ServiceType) =>
  SERVICE_TYPES.find((item) => item.value === st)?.label || st;

const inputCls =
  'w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenance,
  vehicles,
  onAddMaintenance,
  onCompleteMaintenance,
  onNavigateToTab,
}) => {
  const { currency, formatMoney, tr } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MaintenanceStatus>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<MaintenanceRecord | null>(null);
  const [completingTicket, setCompletingTicket] = useState<MaintenanceRecord | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [serviceType, setServiceType] = useState<ServiceType>('Oil & Filter Change');
  const [garageName, setGarageName] = useState(KIGALI_GARAGES[0].name);
  const [garagePhone, setGaragePhone] = useState(KIGALI_GARAGES[0].phone);
  const [garageLocation, setGarageLocation] = useState(KIGALI_GARAGES[0].location);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [odometerKm, setOdometerKm] = useState<number>(0);
  const [costRwf, setCostRwf] = useState<number>(150000);
  const [workStatus, setWorkStatus] = useState<MaintenanceStatus>('In Garage');
  const [technicianName, setTechnicianName] = useState('');
  const [partsReplacedInput, setPartsReplacedInput] = useState('');

  const [completionOdometer, setCompletionOdometer] = useState<number>(0);
  const [completionCost, setCompletionCost] = useState<number>(0);
  const [nextServiceDue, setNextServiceDue] = useState<number>(0);

  const handleSelectVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find((veh) => veh.id === vId);
    if (v) {
      setOdometerKm(v.current_odometer_km);
    }
  };

  const handleSelectGarageChange = (gName: string) => {
    setGarageName(gName);
    const g = KIGALI_GARAGES.find((gar) => gar.name === gName);
    if (g) {
      setGaragePhone(g.phone);
      setGarageLocation(g.location);
    }
  };

  const filteredRecords = useMemo(() => {
    return maintenance.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        m.vehicle_plate.toLowerCase().includes(q) ||
        m.vehicle_model.toLowerCase().includes(q) ||
        m.garage_name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesType = serviceTypeFilter === 'all' || m.service_type === serviceTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [maintenance, searchQuery, statusFilter, serviceTypeFilter]);

  const stats = useMemo(() => {
    const inRepairCount = vehicles.filter((v) => v.status === 'Maintenance').length;
    const inGarageTickets = maintenance.filter((m) => m.status === 'In Garage').length;
    const scheduledRecords = maintenance.filter((m) => m.status === 'Scheduled').length;
    const completedRecords = maintenance.filter((m) => m.status === 'Completed').length;
    const totalSpent = maintenance.reduce((sum, m) => sum + (m.cost_rwf || 0), 0);
    const serviceDueSoon = vehicles.filter((v) => {
      if (!v.next_service_km) return false;
      return v.next_service_km - v.current_odometer_km <= 2500;
    });

    return {
      inRepairCount,
      inGarageTickets,
      scheduledRecords,
      completedRecords,
      totalSpent,
      serviceDueSoonCount: serviceDueSoon.length,
    };
  }, [vehicles, maintenance]);

  const filteredTotalCost = useMemo(
    () => filteredRecords.reduce((sum, m) => sum + (m.cost_rwf || 0), 0),
    [filteredRecords]
  );

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const v = vehicles.find((veh) => veh.id === selectedVehicleId);
    if (!v) return;

    const parts = partsReplacedInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onAddMaintenance({
      vehicle_id: v.id,
      vehicle_plate: v.plate_number,
      vehicle_model: v.model_name,
      service_type: serviceType,
      garage_name: garageName,
      garage_phone: garagePhone,
      garage_location: garageLocation,
      description: description || `${getServiceLabel(serviceType)} at ${garageName}`,
      start_date: startDate,
      expected_completion_date: expectedCompletionDate,
      odometer_at_service_km: odometerKm || v.current_odometer_km,
      next_service_due_km: (odometerKm || v.current_odometer_km) + 5000,
      cost_rwf: Number(costRwf) || 0,
      status: workStatus,
      technician_name: technicianName,
      parts_replaced: parts.length > 0 ? parts : undefined,
    });

    setIsNewModalOpen(false);
    setDescription('');
    setPartsReplacedInput('');
  };

  const handleOpenCompleteModal = (ticket: MaintenanceRecord) => {
    setCompletingTicket(ticket);
    const v = vehicles.find((veh) => veh.id === ticket.vehicle_id);
    const curOdo = v?.current_odometer_km || ticket.odometer_at_service_km;
    setCompletionOdometer(curOdo);
    setCompletionCost(ticket.cost_rwf);
    setNextServiceDue(curOdo + 7500);
  };

  const handleSubmitComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTicket) return;

    onCompleteMaintenance(
      completingTicket.id,
      Number(completionOdometer) || undefined,
      Number(completionCost) || undefined,
      Number(nextServiceDue) || undefined
    );

    setCompletingTicket(null);
  };

  const statusTabs: { value: 'all' | MaintenanceStatus; label: string }[] = [
    { value: 'all', label: `${tr('All')} (${maintenance.length})` },
    {
      value: 'In Garage',
      label: `${tr('In garage')} (${maintenance.filter((m) => m.status === 'In Garage').length})`,
    },
    {
      value: 'Scheduled',
      label: `${tr('Planned')} (${maintenance.filter((m) => m.status === 'Scheduled').length})`,
    },
    {
      value: 'Completed',
      label: `${tr('Done')} (${maintenance.filter((m) => m.status === 'Completed').length})`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Repairs')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Track cars in the garage, repair bills, and block bookings while a car is being fixed.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (vehicles.length > 0) {
              handleSelectVehicleChange(vehicles[0].id);
            }
            setIsNewModalOpen(true);
          }}
          className="accent-bg inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 transition-opacity shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{tr('New repair')}</span>
        </button>
      </div>

      {/* 4-Card KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">In garage now</span>
            <span className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-rose-600 dark:text-rose-400 mt-2 tabular-nums">
            {stats.inRepairCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {tr('In garage, blocked from bookings')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Planned')}</span>
            <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {stats.scheduledRecords}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {stats.serviceDueSoonCount > 0 ? `${stats.serviceDueSoonCount} ${tr('cars due soon')}` : 'Upcoming shop visits'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Done')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {stats.completedRecords}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Completed & released</p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Total garage bills')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {formatMoney(stats.totalSpent)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Recorded parts & labor</p>
        </div>
      </div>

      {/* Blocked notice */}
      {stats.inRepairCount > 0 && (
        <div className="px-5 py-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-rose-900 dark:text-rose-100 flex items-center gap-2.5">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>
              <strong className="font-semibold">
                {stats.inRepairCount} {stats.inRepairCount === 1 ? 'car is' : 'cars are'} blocked for repairs.
              </strong>{' '}
              <span className="text-rose-700 dark:text-rose-200/80">
                Customers cannot book these cars until you mark the repair done and release the car.
              </span>
            </span>
          </div>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('calendar')}
              className="accent-text text-xs font-semibold hover:underline whitespace-nowrap"
            >
              {tr('See calendar')} →
            </button>
          )}
        </div>
      )}

      {/* Repairs Table Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        {/* Segmented Tabs & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg overflow-x-auto">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
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
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr('Search plate, model or garage')}
                className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg pl-9 pr-3 py-1.5 w-60 outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500"
              />
            </div>

            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">{tr('All repair types')}</option>
              {SERVICE_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {tr(st.label)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Repairs Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[820px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">{tr('Car')}</th>
                <th className="py-3 px-4">{tr('Work')}</th>
                <th className="py-3 px-4">{tr('Garage')}</th>
                <th className="py-3 px-4">{tr('Dates')}</th>
                <th className="py-3 px-4 text-right">{tr('Cost')}</th>
                <th className="py-3 px-4">{tr('Status')}</th>
                <th className="py-3 px-4 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-slate-500 dark:text-slate-400">
                    {tr('No repair jobs match your search.')}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((m) => {
                  const isInGarage = m.status === 'In Garage';
                  const isPlanned = m.status === 'Scheduled';
                  const isDone = m.status === 'Completed';
                  const dotClass = isInGarage
                    ? 'bg-rose-500'
                    : isDone
                    ? 'bg-emerald-500'
                    : 'bg-amber-500';
                  const pillClass = isInGarage
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    : isDone
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
                  const statusLabel = isInGarage
                    ? 'In garage'
                    : isPlanned
                    ? 'Planned'
                    : isDone
                    ? 'Done'
                    : m.status;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 align-top transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                          {m.vehicle_plate}
                        </span>
                        <div className="text-slate-900 dark:text-white font-medium mt-1">{m.vehicle_model}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="text-slate-900 dark:text-white font-medium">
                          {tr(getServiceLabel(m.service_type))}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {m.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="text-slate-900 dark:text-white">{m.garage_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {m.garage_location}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-900 dark:text-white">
                          {formatHumanDateRange(m.start_date, m.expected_completion_date)}
                        </div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {m.odometer_at_service_km.toLocaleString()} km
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                        {formatMoney(m.cost_rwf)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${pillClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                          <span>{tr(statusLabel)}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isInGarage ? (
                          <div className="inline-flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedTicketForDetail(m)}
                              className="accent-text text-xs font-medium hover:underline"
                            >
                              {tr('Details')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenCompleteModal(m)}
                              className="accent-bg px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-95"
                            >
                              {tr('Release car')}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedTicketForDetail(m)}
                            className="accent-text text-xs font-medium hover:underline"
                          >
                            {tr('Details')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="px-5 py-3.5 flex flex-wrap justify-between items-center gap-2 text-xs bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">
            {tr('Customers cannot book a car in the garage until you release it.')}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {tr('Total')}{' '}
            <span className="font-mono ml-1.5 tabular-nums">{formatMoney(filteredTotalCost)}</span>
          </span>
        </div>
      </div>

      {/* Modal: New Repair */}
      {isNewModalOpen && (
        <ModalShell
          isOpen={true}
          onClose={() => setIsNewModalOpen(false)}
          asForm
          onSubmit={handleCreateWorkOrder}
          maxWidthClass="max-w-xl"
          title={tr('Send car to garage')}
          bodyClassName="p-5 sm:p-6 space-y-4 text-sm"
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {tr('Cancel')}
              </button>
              <button
                type="submit"
                className="accent-bg px-5 py-2 rounded-lg font-medium hover:opacity-95"
              >
                {tr('Save repair')}
              </button>
            </div>
          }
        >
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                  {tr('Pick a car')}
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleSelectVehicleChange(e.target.value)}
                  className={inputCls}
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} — {v.model_name} ({v.current_odometer_km.toLocaleString()} km)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                    {tr('What needs fixing')}
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className={inputCls}
                  >
                    {SERVICE_TYPES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                    {tr('Status')}
                  </label>
                  <select
                    value={workStatus}
                    onChange={(e) => setWorkStatus(e.target.value as MaintenanceStatus)}
                    className={inputCls}
                  >
                    <option value="In Garage">In garage now (Block car)</option>
                    <option value="Scheduled">Planned for later</option>
                    <option value="Awaiting Parts">Waiting for parts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                  {tr('Garage name')}
                </label>
                <select
                  value={garageName}
                  onChange={(e) => handleSelectGarageChange(e.target.value)}
                  className={inputCls}
                >
                  {KIGALI_GARAGES.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.name} ({g.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                    {tr('Garage phone')}
                  </label>
                  <input
                    type="text"
                    value={garagePhone}
                    onChange={(e) => setGaragePhone(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                    {tr('Garage area')}
                  </label>
                  <input
                    type="text"
                    value={garageLocation}
                    onChange={(e) => setGarageLocation(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                    {tr('Start date')}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                    {tr('Ready date')}
                  </label>
                  <input
                    type="date"
                    value={expectedCompletionDate}
                    onChange={(e) => setExpectedCompletionDate(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                    {tr('Cost (RWF)')}
                  </label>
                  <input
                    type="number"
                    value={costRwf}
                    onChange={(e) => setCostRwf(Number(e.target.value))}
                    className={`${inputCls} font-mono`}
                    required
                  />
                  {currency === 'USD' && (
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      ≈ {formatMoney(costRwf)}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                    {tr('Car km now')}
                  </label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(Number(e.target.value))}
                    className={`${inputCls} font-mono`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                    {tr('Mechanic name')}
                  </label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g. Mugisha Christian"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                  {tr('Work notes')}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write what is wrong or what needs checking..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                  {tr('New parts (comma separated)')}
                </label>
                <input
                  type="text"
                  value={partsReplacedInput}
                  onChange={(e) => setPartsReplacedInput(e.target.value)}
                  placeholder="e.g. Brake pads, Oil filter"
                  className={inputCls}
                />
              </div>

              {workStatus === 'In Garage' && (
                <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                  This car will be blocked so nobody can book it while it is in the garage.
                </div>
              )}

        </ModalShell>
      )}

      {/* Modal: Release Car */}
      {completingTicket && (
        <ModalShell
          isOpen={true}
          onClose={() => setCompletingTicket(null)}
          asForm
          onSubmit={handleSubmitComplete}
          maxWidthClass="max-w-md"
          title={tr('Finish & release car')}
          bodyClassName="p-5 sm:p-6 space-y-4 text-sm"
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCompletingTicket(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {tr('Cancel')}
              </button>
              <button
                type="submit"
                className="accent-bg px-4 py-2 rounded-lg font-medium hover:opacity-95"
              >
                {tr('Release car')}
              </button>
            </div>
          }
        >
            <div className="bg-slate-50/90 dark:bg-slate-800/40 p-3.5 rounded-lg text-sm">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                <span>{completingTicket.vehicle_model}</span>
                <span className="font-mono text-xs">{completingTicket.vehicle_plate}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {completingTicket.garage_name} · {getServiceLabel(completingTicket.service_type)}
              </div>
            </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                  {tr('Car km reading (km)')}
                </label>
                <input
                  type="number"
                  value={completionOdometer}
                  onChange={(e) => setCompletionOdometer(Number(e.target.value))}
                  className={`${inputCls} font-mono`}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                  {tr('Final bill (RWF)')}
                </label>
                <input
                  type="number"
                  value={completionCost}
                  onChange={(e) => setCompletionCost(Number(e.target.value))}
                  className={`${inputCls} font-mono`}
                  required
                />
                {currency === 'USD' && (
                  <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    ≈ {formatMoney(completionCost)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                  {tr('Next service at (km)')}
                </label>
                <input
                  type="number"
                  value={nextServiceDue}
                  onChange={(e) => setNextServiceDue(Number(e.target.value))}
                  className={`${inputCls} font-mono`}
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
                This car will become <strong className="font-semibold">Ready</strong> again so people can book it.
              </div>

        </ModalShell>
      )}

      {/* Modal: Repair Details */}
      {selectedTicketForDetail && (
        <ModalShell
          isOpen={true}
          onClose={() => setSelectedTicketForDetail(null)}
          maxWidthClass="max-w-lg"
          title={
            <>
              {tr('Repair')} <span className="font-mono text-sm text-slate-500 dark:text-slate-400">#{selectedTicketForDetail.id}</span>
            </>
          }
          bodyClassName="p-5 sm:p-6 space-y-4 text-sm"
          footer={
            <div className="flex items-center justify-end gap-2.5">
              {selectedTicketForDetail.status === 'In Garage' && (
                <button
                  type="button"
                  onClick={() => {
                    const ticket = selectedTicketForDetail;
                    setSelectedTicketForDetail(null);
                    handleOpenCompleteModal(ticket);
                  }}
                  className="accent-bg px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {tr('Release car')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTicketForDetail(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {tr('Close')}
              </button>
            </div>
          }
        >

            <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Car')}</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  {selectedTicketForDetail.vehicle_model}
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">{selectedTicketForDetail.vehicle_plate}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Status')}</span>
                <span
                  className={`font-semibold mt-0.5 block ${
                    selectedTicketForDetail.status === 'In Garage'
                      ? 'text-rose-600 dark:text-rose-400'
                      : selectedTicketForDetail.status === 'Completed'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {selectedTicketForDetail.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Repair type')}</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium mt-0.5 block">
                  {getServiceLabel(selectedTicketForDetail.service_type)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Total cost')}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5 block tabular-nums">
                  {formatMoney(selectedTicketForDetail.cost_rwf)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Dates')}</span>
                <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {formatHumanDateRange(
                    selectedTicketForDetail.start_date,
                    selectedTicketForDetail.expected_completion_date,
                    { includeYear: true }
                  )}{' '}
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    · {selectedTicketForDetail.odometer_at_service_km.toLocaleString()} km
                  </span>
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Garage')}</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  {selectedTicketForDetail.garage_name}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {selectedTicketForDetail.garage_location}
                  {selectedTicketForDetail.garage_phone ? ` · ${selectedTicketForDetail.garage_phone}` : ''}
                  {selectedTicketForDetail.technician_name ? ` · Mechanic: ${selectedTicketForDetail.technician_name}` : ''}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 dark:text-slate-500 block">{tr('Work notes')}</span>
                <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedTicketForDetail.description}
                </span>
              </div>
              {selectedTicketForDetail.parts_replaced && selectedTicketForDetail.parts_replaced.length > 0 && (
                <div className="col-span-2">
                  <span className="text-slate-400 dark:text-slate-500 block">{tr('Parts changed')}</span>
                  <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedTicketForDetail.parts_replaced.join(', ')}
                  </span>
                </div>
              )}
            </div>

        </ModalShell>
      )}
    </div>
  );
};
