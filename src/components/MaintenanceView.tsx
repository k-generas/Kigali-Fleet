import React, { useState, useMemo } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  Search,
  ShieldAlert,
  Building2,
  MapPin,
  FileText,
  X,
  Check,
} from 'lucide-react';
import { Vehicle, MaintenanceRecord, MaintenanceStatus, ServiceType } from '../types';
import { ColorTheme } from '../theme';

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
  { value: 'Brake System & Pads', label: 'Brakes & Pads' },
  { value: 'Tire Replacement (4x4)', label: 'New 4x4 Tires' },
  { value: 'Safari Suspension Overhaul', label: 'Suspension Repair' },
  { value: 'Contrôle Technique Prep', label: 'Car Safety Inspection Prep' },
  { value: 'Transmission & Gearbox', label: 'Gearbox Repair' },
  { value: 'AC & Electrical System', label: 'AC & Lights' },
  { value: 'General Inspection', label: 'General Checkup' },
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

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenance,
  vehicles,
  currentTheme,
  onAddMaintenance,
  onCompleteMaintenance,
  onNavigateToTab,
}) => {
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
      const matchesSearch =
        m.vehicle_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.vehicle_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.garage_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesType = serviceTypeFilter === 'all' || m.service_type === serviceTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [maintenance, searchQuery, statusFilter, serviceTypeFilter]);

  const stats = useMemo(() => {
    const inRepairCount = vehicles.filter((v) => v.status === 'Maintenance').length;
    const scheduledRecords = maintenance.filter((m) => m.status === 'Scheduled').length;
    const completedRecords = maintenance.filter((m) => m.status === 'Completed').length;
    const totalSpent = maintenance.reduce((sum, m) => sum + (m.cost_rwf || 0), 0);
    const serviceDueSoon = vehicles.filter((v) => {
      if (!v.next_service_km) return false;
      return v.next_service_km - v.current_odometer_km <= 2500;
    });

    return {
      inRepairCount,
      scheduledRecords,
      completedRecords,
      totalSpent,
      serviceDueSoonCount: serviceDueSoon.length,
    };
  }, [vehicles, maintenance]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="stripe-card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <div className="flex items-start gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white tracking-tight">
              Car Repairs & Garages
            </h1>
            <p className="text-base text-[#425466] dark:text-slate-300 mt-1">
              Track cars in the garage, repair bills, and block bookings while a car is being fixed.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (vehicles.length > 0) {
              handleSelectVehicleChange(vehicles[0].id);
            }
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity shrink-0"
          style={{ backgroundColor: currentTheme.hex }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Repair</span>
        </button>
      </div>

      {/* 4 Simple Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">In Garage Now</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {stats.inRepairCount} cars
            </div>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">Blocked from bookings</p>
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Planned Repairs</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.scheduledRecords} jobs
            </div>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
              {stats.serviceDueSoonCount} cars due soon
            </p>
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Fixed & Ready</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.completedRecords} done
            </div>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">Back on the road</p>
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Total Repair Cost</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono truncate">
              {stats.totalSpent.toLocaleString()} RWF
            </div>
            <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">All garage bills</p>
          </div>
        </div>
      </div>

      {/* Cars In Garage Warning */}
      {stats.inRepairCount > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-sm">
              <div className="font-bold text-rose-900 dark:text-rose-200">
                {stats.inRepairCount} {stats.inRepairCount === 1 ? 'car is' : 'cars are'} blocked for repairs
              </div>
              <div className="text-rose-700 dark:text-rose-300 mt-0.5">
                Customers cannot book these cars until you mark the repair done and release the car.
              </div>
            </div>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('calendar')}
              className="text-sm font-bold px-4 py-2 rounded-full bg-white dark:bg-rose-900/40 hover:bg-rose-100 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 transition-colors whitespace-nowrap w-fit"
            >
              See Calendar →
            </button>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search car plate, model, or garage..."
            className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white text-sm rounded-xl pl-10 pr-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { value: 'all', label: `All (${maintenance.length})` },
            { value: 'In Garage', label: `In Garage (${maintenance.filter((m) => m.status === 'In Garage').length})` },
            { value: 'Scheduled', label: `Planned (${maintenance.filter((m) => m.status === 'Scheduled').length})` },
            { value: 'Completed', label: `Done (${maintenance.filter((m) => m.status === 'Completed').length})` },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value as 'all' | MaintenanceStatus)}
              className={`px-3.5 py-2 rounded-full text-sm font-semibold border transition-colors ${
                statusFilter === btn.value
                  ? 'text-white border-transparent'
                  : 'bg-[#f6f9fc] dark:bg-slate-950 text-[#425466] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={statusFilter === btn.value ? { backgroundColor: currentTheme.hex } : undefined}
            >
              {btn.label}
            </button>
          ))}

          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-slate-200 text-sm rounded-xl px-3 py-2 outline-none cursor-pointer font-medium"
          >
            <option value="all">All Repair Types</option>
            {SERVICE_TYPES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Repairs Grid */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3.5 bg-[#f6f9fc] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-400 text-xs font-bold uppercase">
          <div className="lg:col-span-3">Car</div>
          <div className="lg:col-span-2">What Is Fixed</div>
          <div className="lg:col-span-2">Garage</div>
          <div className="lg:col-span-2 text-center">Dates & Cost</div>
          <div className="lg:col-span-1 text-center">Status</div>
          <div className="lg:col-span-2 text-right">Action</div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-[#0a2540] dark:text-slate-200">
          {filteredRecords.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#425466] dark:text-slate-400 text-base">
              No repair jobs match your search.
            </div>
          ) : (
            filteredRecords.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="lg:col-span-3 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-lg font-bold border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
                      {m.vehicle_plate}
                    </span>
                    <span className="font-bold text-[#0a2540] dark:text-white truncate" title={m.vehicle_model}>
                      {m.vehicle_model}
                    </span>
                  </div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 font-mono mt-1 whitespace-nowrap">
                    #{m.id}
                  </div>
                </div>

                <div className="lg:col-span-2 min-w-0">
                  <div className="font-semibold text-[#0a2540] dark:text-white truncate">
                    {getServiceLabel(m.service_type)}
                  </div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 truncate" title={m.description}>
                    {m.description}
                  </div>
                </div>

                <div className="lg:col-span-2 min-w-0">
                  <div className="font-semibold text-[#0a2540] dark:text-white flex items-center gap-1.5 min-w-0">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate" title={m.garage_name}>
                      {m.garage_name}
                    </span>
                  </div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 flex items-center gap-1 mt-0.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate" title={m.garage_location}>
                      {m.garage_location}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-2 lg:text-center min-w-0">
                  <div className="font-mono font-bold text-[#0a2540] dark:text-white whitespace-nowrap">
                    {m.cost_rwf.toLocaleString()} RWF
                  </div>
                  <div className="font-mono text-xs text-[#425466] dark:text-slate-400 mt-0.5 whitespace-nowrap">
                    {m.start_date} → {m.expected_completion_date}
                  </div>
                  <div className="text-xs text-[#425466] dark:text-slate-400 font-mono whitespace-nowrap">
                    {m.odometer_at_service_km.toLocaleString()} km
                  </div>
                </div>

                <div className="lg:col-span-1 flex lg:justify-center">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                      m.status === 'In Garage'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/20'
                        : m.status === 'Scheduled'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20'
                        : m.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20'
                        : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span>{m.status === 'Scheduled' ? 'Planned' : m.status === 'Completed' ? 'Done' : m.status}</span>
                  </span>
                </div>

                <div className="lg:col-span-2 flex items-center lg:justify-end gap-2 flex-wrap">
                  {m.status === 'In Garage' && (
                    <button
                      onClick={() => handleOpenCompleteModal(m)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Release Car</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedTicketForDetail(m)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap"
                  >
                    See Info
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: New Repair */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Send Car to Garage</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-4 text-sm">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Pick a Car</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleSelectVehicleChange(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none cursor-pointer"
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
                  <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">What Needs Fixing</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    {SERVICE_TYPES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Status</label>
                  <select
                    value={workStatus}
                    onChange={(e) => setWorkStatus(e.target.value as MaintenanceStatus)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    <option value="In Garage">In Garage Now (Block car)</option>
                    <option value="Scheduled">Planned for Later</option>
                    <option value="Awaiting Parts">Waiting for Parts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Garage Name</label>
                <select
                  value={garageName}
                  onChange={(e) => handleSelectGarageChange(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none cursor-pointer"
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
                  <label className="block text-[#425466] dark:text-slate-400 font-semibold mb-1">Garage Phone</label>
                  <input
                    type="text"
                    value={garagePhone}
                    onChange={(e) => setGaragePhone(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#425466] dark:text-slate-400 font-semibold mb-1">Garage Area</label>
                  <input
                    type="text"
                    value={garageLocation}
                    onChange={(e) => setGarageLocation(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Ready Date</label>
                  <input
                    type="date"
                    value={expectedCompletionDate}
                    onChange={(e) => setExpectedCompletionDate(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Cost (RWF)</label>
                  <input
                    type="number"
                    value={costRwf}
                    onChange={(e) => setCostRwf(Number(e.target.value))}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Car Km Now</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(Number(e.target.value))}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Mechanic Name</label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g. Mugisha Christian"
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Work Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write what is wrong or what needs checking..."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">New Parts (comma separated)</label>
                <input
                  type="text"
                  value={partsReplacedInput}
                  onChange={(e) => setPartsReplacedInput(e.target.value)}
                  placeholder="e.g. Brake pads, Oil filter"
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none"
                />
              </div>

              {workStatus === 'In Garage' && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-200 flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>
                    This car will be blocked so nobody can book it while it is in the garage.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-[#0a2540] dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full font-bold text-white"
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Save Repair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Release Car */}
      {completingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Finish & Release Car</h3>
              </div>
              <button
                onClick={() => setCompletingTicket(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#f6f9fc] dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
              <div className="font-bold text-[#0a2540] dark:text-white flex items-center justify-between">
                <span>{completingTicket.vehicle_model}</span>
                <span className="font-mono text-amber-700 dark:text-amber-400">{completingTicket.vehicle_plate}</span>
              </div>
              <div className="text-[#425466] dark:text-slate-400 mt-1">
                {completingTicket.garage_name} · {getServiceLabel(completingTicket.service_type)}
              </div>
            </div>

            <form onSubmit={handleSubmitComplete} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Car Km Reading (km)</label>
                <input
                  type="number"
                  value={completionOdometer}
                  onChange={(e) => setCompletionOdometer(Number(e.target.value))}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Final Bill (RWF)</label>
                <input
                  type="number"
                  value={completionCost}
                  onChange={(e) => setCompletionCost(Number(e.target.value))}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-semibold mb-1">Next Service At (km)</label>
                <input
                  type="number"
                  value={nextServiceDue}
                  onChange={(e) => setNextServiceDue(Number(e.target.value))}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0a2540] dark:text-white rounded-xl p-2.5 outline-none font-mono"
                  required
                />
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-sm">
                This car will become <strong>Ready</strong> again so people can book it.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingTicket(null)}
                  className="px-4 py-2.5 rounded-full text-[#0a2540] dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                >
                  Release Car
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Repair Details */}
      {selectedTicketForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  Repair #{selectedTicketForDetail.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#0a2540] dark:text-white text-base">
                    {selectedTicketForDetail.vehicle_model}
                  </div>
                  <div className="font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                    {selectedTicketForDetail.vehicle_plate}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-sm ${
                    selectedTicketForDetail.status === 'In Garage'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                  }`}
                >
                  {selectedTicketForDetail.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Repair Type</span>
                  <div className="font-bold text-[#0a2540] dark:text-white mt-0.5">
                    {getServiceLabel(selectedTicketForDetail.service_type)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Total Cost</span>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                    {selectedTicketForDetail.cost_rwf.toLocaleString()} RWF
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Garage</span>
                <div className="font-bold text-[#0a2540] dark:text-white">{selectedTicketForDetail.garage_name}</div>
                <div className="text-[#425466] dark:text-slate-400">{selectedTicketForDetail.garage_location}</div>
                {selectedTicketForDetail.garage_phone && (
                  <div className="text-[#425466] dark:text-slate-400 font-mono">{selectedTicketForDetail.garage_phone}</div>
                )}
                {selectedTicketForDetail.technician_name && (
                  <div className="text-amber-700 dark:text-amber-400 pt-1 font-medium">
                    Mechanic: {selectedTicketForDetail.technician_name}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Work Notes</span>
                <div className="text-[#0a2540] dark:text-slate-200 mt-1">{selectedTicketForDetail.description}</div>
              </div>

              {selectedTicketForDetail.parts_replaced && selectedTicketForDetail.parts_replaced.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Parts Changed</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedTicketForDetail.parts_replaced.map((part, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-[#0a2540] dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="px-5 py-2.5 rounded-full text-[#0a2540] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
