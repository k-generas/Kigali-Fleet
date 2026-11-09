import React, { useState, useMemo } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  Building2,
  Phone,
  MapPin,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  FileText,
  X,
  Gauge,
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

const SERVICE_TYPES: ServiceType[] = [
  'Oil & Filter Change',
  'Brake System & Pads',
  'Tire Replacement (4x4)',
  'Safari Suspension Overhaul',
  'Contrôle Technique Prep',
  'Transmission & Gearbox',
  'AC & Electrical System',
  'General Inspection',
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
    location: 'Remera, Boulevard de l’Aéroport, Kigali',
  },
  {
    name: 'Akagera Motors Heavy Service Hub',
    phone: '+250 788 500 111',
    location: 'Gatsata, RN3 Highway, Kigali',
  },
  {
    name: 'Nyarutarama Auto Precision Garage',
    phone: '+250 788 620 440',
    location: 'Nyarutarama Golf View Road, Kigali',
  },
  {
    name: 'Kicukiro Express Lube & Alignment',
    phone: '+250 788 998 221',
    location: 'Sonatubes Junction, Kicukiro, Kigali',
  },
];

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenance,
  vehicles,
  currentTheme,
  onAddMaintenance,
  onUpdateMaintenance,
  onCompleteMaintenance,
  onDeleteMaintenance,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MaintenanceStatus>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<MaintenanceRecord | null>(null);
  const [completingTicket, setCompletingTicket] = useState<MaintenanceRecord | null>(null);

  // Form State for New Work Order
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

  // Form State for Completing Service
  const [completionOdometer, setCompletionOdometer] = useState<number>(0);
  const [completionCost, setCompletionCost] = useState<number>(0);
  const [nextServiceDue, setNextServiceDue] = useState<number>(0);

  // Auto-fill odometer when vehicle selection changes in modal
  const handleSelectVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find((veh) => veh.id === vId);
    if (v) {
      setOdometerKm(v.current_odometer_km);
    }
  };

  // Auto-fill garage details when garage select changes
  const handleSelectGarageChange = (gName: string) => {
    setGarageName(gName);
    const g = KIGALI_GARAGES.find((gar) => gar.name === gName);
    if (g) {
      setGaragePhone(g.phone);
      setGarageLocation(g.location);
    }
  };

  // Filtered tickets
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

  // Aggregate stats
  const stats = useMemo(() => {
    const groundedCount = vehicles.filter((v) => v.status === 'Maintenance').length;
    const inGarageRecords = maintenance.filter((m) => m.status === 'In Garage').length;
    const scheduledRecords = maintenance.filter((m) => m.status === 'Scheduled').length;
    const completedRecords = maintenance.filter((m) => m.status === 'Completed').length;
    const totalSpent = maintenance.reduce((sum, m) => sum + (m.cost_rwf || 0), 0);

    // Vehicles approaching service threshold (within 2,500 km)
    const serviceDueSoon = vehicles.filter((v) => {
      if (!v.next_service_km) return false;
      return v.next_service_km - v.current_odometer_km <= 2500;
    });

    return {
      groundedCount,
      inGarageRecords,
      scheduledRecords,
      completedRecords,
      totalSpent,
      serviceDueSoonCount: serviceDueSoon.length,
    };
  }, [vehicles, maintenance]);

  // Submit New Work Order
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
      description: description || `Scheduled ${serviceType} at ${garageName}`,
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
    // Reset form
    setDescription('');
    setPartsReplacedInput('');
  };

  // Open Complete Service Modal
  const handleOpenCompleteModal = (ticket: MaintenanceRecord) => {
    setCompletingTicket(ticket);
    const v = vehicles.find((veh) => veh.id === ticket.vehicle_id);
    const curOdo = v?.current_odometer_km || ticket.odometer_at_service_km;
    setCompletionOdometer(curOdo);
    setCompletionCost(ticket.cost_rwf);
    setNextServiceDue(curOdo + 7500);
  };

  // Submit Service Completion
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
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Maintenance & Workshop Center</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                Kigali Garages & Contrôle Technique
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Track vehicle work orders, garage repairs, Contrôle Technique safety compliance, and automatic booking collision locks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              if (vehicles.length > 0) {
                handleSelectVehicleChange(vehicles[0].id);
              }
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-950 transition-transform active:scale-95 shadow-md"
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Open Work Order</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Grounded Vehicles */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">In Workshop (Grounded)</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-400 tracking-tight font-mono">
              {stats.groundedCount} <span className="text-xs font-normal text-slate-400">vehicles</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span className="text-rose-400 font-semibold">Strict calendar lock</span>
              <span>· Zero double-booking</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Scheduled Work Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Scheduled Tickets</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-400 tracking-tight font-mono">
              {stats.scheduledRecords} <span className="text-xs font-normal text-slate-400">orders</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span>{stats.serviceDueSoonCount} cars approaching threshold</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Completed & Released */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed Services</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
              {stats.completedRecords} <span className="text-xs font-normal text-slate-400">released</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">100% Quality Passed</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Total Maintenance Spend */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fleet Service Spend</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white tracking-tight font-mono truncate">
              {stats.totalSpent.toLocaleString()} <span className="text-xs font-normal text-slate-400">RWF</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span>Across authorized Kigali garages</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grounded Vehicles Alert Banner (if any) */}
      {stats.groundedCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-rose-200">
                {stats.groundedCount} Vehicle{stats.groundedCount > 1 ? 's' : ''} Locked in Maintenance
              </div>
              <div className="text-rose-300/80 mt-0.5">
                The collision prevention engine has actively locked these vehicles. Overlapping reservation requests from the storefront or dispatch board are blocked until certified garage release.
              </div>
            </div>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('calendar')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800 transition-colors whitespace-nowrap"
            >
              View on Fleet Calendar →
            </button>
          )}
        </div>
      )}

      {/* 4. Filter Bar & Search */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by plate, model, garage name, ticket ID..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({maintenance.length})
            </button>
            <button
              onClick={() => setStatusFilter('In Garage')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'In Garage' ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              In Garage ({maintenance.filter((m) => m.status === 'In Garage').length})
            </button>
            <button
              onClick={() => setStatusFilter('Scheduled')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'Scheduled' ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Scheduled ({maintenance.filter((m) => m.status === 'Scheduled').length})
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed ({maintenance.filter((m) => m.status === 'Completed').length})
            </button>
          </div>

          {/* Service type filter */}
          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="all">All Service Types</option>
            {SERVICE_TYPES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Work Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Work Order / Vehicle</th>
                <th className="px-4 py-3">Service Scope</th>
                <th className="px-4 py-3">Garage Workshop</th>
                <th className="px-4 py-3 text-center">Dates & Duration</th>
                <th className="px-4 py-3 text-right">Odometer & Cost</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No maintenance records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((m) => {
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Vehicle & Ticket ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px] font-bold border border-amber-500/20">
                            {m.vehicle_plate}
                          </span>
                          <span className="font-bold text-white truncate max-w-[140px]" title={m.vehicle_model}>
                            {m.vehicle_model}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          #{m.id} {m.invoice_ref && `· Ref: ${m.invoice_ref}`}
                        </div>
                      </td>

                      {/* Service Type & Parts */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">{m.service_type}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[220px]" title={m.description}>
                          {m.description}
                        </div>
                        {m.parts_replaced && m.parts_replaced.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {m.parts_replaced.slice(0, 2).map((part, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono"
                              >
                                {part}
                              </span>
                            ))}
                            {m.parts_replaced.length > 2 && (
                              <span className="text-[9px] text-slate-500">+{m.parts_replaced.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Garage Workshop */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]" title={m.garage_name}>
                            {m.garage_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[170px]" title={m.garage_location}>
                            {m.garage_location}
                          </span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3 text-center">
                        <div className="font-mono text-slate-300 text-[11px]">
                          {m.start_date} → {m.expected_completion_date}
                        </div>
                        {m.actual_completion_date && (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            Released: {m.actual_completion_date}
                          </div>
                        )}
                      </td>

                      {/* Odometer & Cost */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-bold text-white">{m.cost_rwf.toLocaleString()} RWF</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {m.odometer_at_service_km.toLocaleString()} km
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            m.status === 'In Garage'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : m.status === 'Scheduled'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : m.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {m.status === 'In Garage' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
                          <span>{m.status}</span>
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.status === 'In Garage' && (
                            <button
                              onClick={() => handleOpenCompleteModal(m)}
                              className="px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-xs"
                              title="Mark repair as done and release vehicle to Available status"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Release Car</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedTicketForDetail(m)}
                            className="px-2 py-1 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="View full garage ticket details"
                          >
                            Details
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
      </div>

      {/* 6. Modal: Create Work Order */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Open Garage Work Order</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-4 text-xs">
              {/* Vehicle Select */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Fleet Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleSelectVehicleChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} — {v.model_name} ({v.category}) · Status: {v.status} · Odo: {v.current_odometer_km.toLocaleString()} km
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {SERVICE_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Status</label>
                  <select
                    value={workStatus}
                    onChange={(e) => setWorkStatus(e.target.value as MaintenanceStatus)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="In Garage">In Garage (Ground vehicle immediately)</option>
                    <option value="Scheduled">Scheduled (Upcoming appointment)</option>
                    <option value="Awaiting Parts">Awaiting Parts</option>
                  </select>
                </div>
              </div>

              {/* Garage Provider Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Garage Workshop Provider</label>
                <select
                  value={garageName}
                  onChange={(e) => handleSelectGarageChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  {KIGALI_GARAGES.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.name} ({g.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Garage Contact details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Garage Phone</label>
                  <input
                    type="text"
                    value={garagePhone}
                    onChange={(e) => setGaragePhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Workshop Location</label>
                  <input
                    type="text"
                    value={garageLocation}
                    onChange={(e) => setGarageLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                  />
                </div>
              </div>

              {/* Dates & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected Completion</label>
                  <input
                    type="date"
                    value={expectedCompletionDate}
                    onChange={(e) => setExpectedCompletionDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimated Cost (RWF)</label>
                  <input
                    type="number"
                    value={costRwf}
                    onChange={(e) => setCostRwf(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Odometer and Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Odometer (km)</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Lead Technician Name</label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g. Mugisha Christian"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              {/* Work Scope Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Scope of Work & Diagnostics</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe repair items, symptoms, or regular maintenance details..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none resize-none"
                />
              </div>

              {/* Parts replaced */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Parts Replaced (comma separated)</label>
                <input
                  type="text"
                  value={partsReplacedInput}
                  onChange={(e) => setPartsReplacedInput(e.target.value)}
                  placeholder="e.g. Brake pads, Fuel filter, 5W-40 Synthetic Oil (8L)"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none"
                />
              </div>

              {/* Grounding Warning */}
              {workStatus === 'In Garage' && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>
                    This car will be marked as <strong>Maintenance (Grounded)</strong>. No customer or dispatcher will be able to book it for overlapping dates.
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold text-slate-950"
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  Open Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Release Car & Complete Service */}
      {completingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Complete & Release Vehicle</h3>
              </div>
              <button
                onClick={() => setCompletingTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="font-bold text-white flex items-center justify-between">
                <span>{completingTicket.vehicle_model}</span>
                <span className="font-mono text-amber-400">{completingTicket.vehicle_plate}</span>
              </div>
              <div className="text-slate-400 mt-1">
                Garage: {completingTicket.garage_name} · Service: {completingTicket.service_type}
              </div>
            </div>

            <form onSubmit={handleSubmitComplete} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Final Verified Odometer (km)</label>
                <input
                  type="number"
                  value={completionOdometer}
                  onChange={(e) => setCompletionOdometer(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Final Invoice Amount (RWF)</label>
                <input
                  type="number"
                  value={completionCost}
                  onChange={(e) => setCompletionCost(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Next Scheduled Service Threshold (km)</label>
                <input
                  type="number"
                  value={nextServiceDue}
                  onChange={(e) => setNextServiceDue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                Releasing this vehicle will automatically set its status back to <strong>Available</strong>, update its service log, and open it for future booking allocations.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingTicket(null)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md"
                >
                  Release to Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: View Ticket Dossier */}
      {selectedTicketForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Work Order #{selectedTicketForDetail.id}</h3>
              </div>
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{selectedTicketForDetail.vehicle_model}</div>
                  <div className="font-mono text-amber-400 mt-0.5">{selectedTicketForDetail.vehicle_plate}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    selectedTicketForDetail.status === 'In Garage'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedTicketForDetail.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Service Type</span>
                  <div className="font-bold text-slate-200 mt-0.5">{selectedTicketForDetail.service_type}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Cost</span>
                  <div className="font-bold text-emerald-400 font-mono mt-0.5">
                    {selectedTicketForDetail.cost_rwf.toLocaleString()} RWF
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Workshop Provider</span>
                <div className="font-bold text-white">{selectedTicketForDetail.garage_name}</div>
                <div className="text-slate-400">{selectedTicketForDetail.garage_location}</div>
                {selectedTicketForDetail.garage_phone && (
                  <div className="text-slate-400 font-mono">{selectedTicketForDetail.garage_phone}</div>
                )}
                {selectedTicketForDetail.technician_name && (
                  <div className="text-amber-400 text-[11px] pt-1">
                    Tech: {selectedTicketForDetail.technician_name}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Diagnostics & Notes</span>
                <div className="text-slate-300 mt-1">{selectedTicketForDetail.description}</div>
              </div>

              {selectedTicketForDetail.parts_replaced && selectedTicketForDetail.parts_replaced.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Parts Replaced</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedTicketForDetail.parts_replaced.map((part, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-800">
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="px-4 py-2 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
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
