import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleCategory, VehicleStatus, Booking, Driver } from '../types';
import { formatRwf } from '../utils/collision';
import { getCategoryBadge } from './CalendarTimelineView';
import {
  Plus,
  Car,
  Fuel,
  Users,
  Gauge,
  MapPin,
  X,
  Edit2,
  Wrench,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Check,
  Search,
  Filter,
  Calendar,
  DollarSign,
  History,
  Trash2,
  Clock,
  ArrowUpRight,
  UserCheck,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  bookings: Booking[];
  drivers?: Driver[];
  currentTheme?: ColorTheme;
  onAddVehicle: (v: Omit<Vehicle, 'id'>) => void;
  onUpdateStatus: (id: string, status: VehicleStatus) => void;
  onUpdateRate: (id: string, newRateRwf: number) => void;
  onToggleMaintenance: (id: string, notes?: string) => void;
  onOpenBookingForVehicle: (vehicleId: string) => void;
  onUpdateVehicle?: (id: string, updates: Partial<Vehicle>) => void;
  onDeleteVehicle?: (id: string) => void;
}

function getComplianceStatus(expiryDate?: string): {
  status: 'valid' | 'expiring' | 'expired' | 'unknown';
  label: string;
  badgeClass: string;
} {
  if (!expiryDate) {
    return {
      status: 'unknown',
      label: 'Not Recorded',
      badgeClass: 'text-slate-400 border-slate-700 bg-slate-800/40',
    };
  }
  const today = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      label: `Expired (${expiryDate})`,
      badgeClass: 'text-rose-400 border-rose-800/80 bg-rose-950/50 font-bold',
    };
  } else if (diffDays <= 30) {
    return {
      status: 'expiring',
      label: `Expires in ${diffDays}d`,
      badgeClass: 'text-amber-400 border-amber-800/80 bg-amber-950/50 font-bold',
    };
  } else {
    return {
      status: 'valid',
      label: `Valid to ${expiryDate}`,
      badgeClass: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
    };
  }
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  bookings,
  drivers = [],
  currentTheme,
  onAddVehicle,
  onUpdateStatus,
  onUpdateRate,
  onToggleMaintenance,
  onOpenBookingForVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}) => {
  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [complianceFilter, setComplianceFilter] = useState<'All' | 'Alerts'>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [maintenanceModalVehicle, setMaintenanceModalVehicle] = useState<Vehicle | null>(null);
  const [maintenanceReason, setMaintenanceReason] = useState<string>(
    'Routine 50,000 km oil & brake service'
  );

  // In-line rate editing
  const [editingRateVehicleId, setEditingRateVehicleId] = useState<string | null>(null);
  const [newRateInput, setNewRateInput] = useState<string>('');

  // Add vehicle form state
  const [modelName, setModelName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('LandCruiser');
  const [year, setYear] = useState<number>(2023);
  const [dailyRate, setDailyRate] = useState('180000');
  const [seating, setSeating] = useState('7');
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>('Automatic');
  const [fuelType, setFuelType] = useState<'Diesel' | 'Petrol'>('Diesel');
  const [location, setLocation] = useState('Kigali HQ - Remera');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('2027-02-28');
  const [controleTechniqueExpiry, setControleTechniqueExpiry] = useState('2027-01-31');

  // Service Log Modal Form state
  const [isServiceLogModalOpen, setIsServiceLogModalOpen] = useState(false);
  const [serviceOdometerInput, setServiceOdometerInput] = useState<string>('');
  const [serviceNotesInput, setServiceNotesInput] = useState<string>('');
  const [nextServiceKmInput, setNextServiceKmInput] = useState<string>('');

  const categories = ['All', 'LandCruiser', 'RAV4', 'Coaster', 'Safari Van', 'Luxury Sedan'];

  // Metrics computation
  const metrics = useMemo(() => {
    const totalCount = vehicles.length;
    const availableCount = vehicles.filter((v) => v.status === 'Available').length;
    const bookedCount = vehicles.filter((v) => v.status === 'Booked').length;
    const maintenanceCount = vehicles.filter((v) => v.status === 'Maintenance').length;
    const dailyPotentialRwf = vehicles.reduce((sum, v) => sum + v.daily_rate_rwf, 0);

    const complianceIssuesCount = vehicles.filter((v) => {
      const ins = getComplianceStatus(v.insurance_expiry);
      const ct = getComplianceStatus(v.controle_technique_expiry);
      return (
        ins.status === 'expired' ||
        ins.status === 'expiring' ||
        ct.status === 'expired' ||
        ct.status === 'expiring'
      );
    }).length;

    return {
      totalCount,
      availableCount,
      bookedCount,
      maintenanceCount,
      dailyPotentialRwf,
      complianceIssuesCount,
    };
  }, [vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (selectedCategory !== 'All' && v.category !== selectedCategory) return false;
      if (selectedStatus !== 'All' && v.status !== selectedStatus) return false;

      if (complianceFilter === 'Alerts') {
        const ins = getComplianceStatus(v.insurance_expiry);
        const ct = getComplianceStatus(v.controle_technique_expiry);
        const hasIssue =
          ins.status === 'expired' ||
          ins.status === 'expiring' ||
          ct.status === 'expired' ||
          ct.status === 'expiring';
        if (!hasIssue) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPlate = v.plate_number.toLowerCase().includes(q);
        const matchesModel = v.model_name.toLowerCase().includes(q);
        const matchesLocation = v.location.toLowerCase().includes(q);
        const matchesDriver = v.assigned_driver_name?.toLowerCase().includes(q);
        if (!matchesPlate && !matchesModel && !matchesLocation && !matchesDriver) return false;
      }

      return true;
    });
  }, [vehicles, selectedCategory, selectedStatus, complianceFilter, searchQuery]);

  const handleStartEditRate = (v: Vehicle) => {
    setEditingRateVehicleId(v.id);
    setNewRateInput(v.daily_rate_rwf.toString());
  };

  const handleSaveRate = (id: string) => {
    const parsed = Number(newRateInput);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateRate(id, parsed);
    }
    setEditingRateVehicleId(null);
  };

  const handleConfirmMaintenance = () => {
    if (maintenanceModalVehicle) {
      onToggleMaintenance(maintenanceModalVehicle.id, maintenanceReason);
      setMaintenanceModalVehicle(null);
      if (selectedVehicleDetails?.id === maintenanceModalVehicle.id) {
        setSelectedVehicleDetails({
          ...selectedVehicleDetails,
          status: selectedVehicleDetails.status === 'Maintenance' ? 'Available' : 'Maintenance',
        });
      }
    }
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName || !plateNumber) return;

    const matchedDriver = drivers.find((d) => d.id === assignedDriverId);

    onAddVehicle({
      model_name: modelName,
      plate_number: plateNumber.toUpperCase(),
      category,
      year: Number(year) || 2023,
      daily_rate_rwf: Number(dailyRate) || 100000,
      status: 'Available',
      seating_capacity: Number(seating) || 5,
      transmission,
      fuel_type: fuelType,
      current_odometer_km: 35000,
      location,
      assigned_driver_id: assignedDriverId || undefined,
      assigned_driver_name: matchedDriver ? matchedDriver.name : undefined,
      insurance_expiry: insuranceExpiry,
      controle_technique_expiry: controleTechniqueExpiry,
      last_service_date: new Date().toISOString().split('T')[0],
      last_service_notes: 'Initial pre-delivery vehicle inspection passed.',
      next_service_km: 40000,
    });

    setModelName('');
    setPlateNumber('');
    setIsAddModalOpen(false);
  };

  const handleSaveEditVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !onUpdateVehicle) return;

    const matchedDriver = drivers.find((d) => d.id === editingVehicle.assigned_driver_id);

    onUpdateVehicle(editingVehicle.id, {
      ...editingVehicle,
      assigned_driver_name: matchedDriver ? matchedDriver.name : editingVehicle.assigned_driver_name,
    });

    if (selectedVehicleDetails?.id === editingVehicle.id) {
      setSelectedVehicleDetails({
        ...editingVehicle,
        assigned_driver_name: matchedDriver ? matchedDriver.name : editingVehicle.assigned_driver_name,
      });
    }

    setEditingVehicle(null);
  };

  const handleLogService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleDetails || !onUpdateVehicle) return;

    const newOdometer = Number(serviceOdometerInput) || selectedVehicleDetails.current_odometer_km;
    const newNextKm = Number(nextServiceKmInput) || newOdometer + 5000;
    const todayStr = new Date().toISOString().split('T')[0];

    const updates: Partial<Vehicle> = {
      current_odometer_km: newOdometer,
      last_service_date: todayStr,
      last_service_notes: serviceNotesInput || 'Routine maintenance and diagnostic test completed.',
      next_service_km: newNextKm,
    };

    onUpdateVehicle(selectedVehicleDetails.id, updates);
    setSelectedVehicleDetails({ ...selectedVehicleDetails, ...updates });
    setIsServiceLogModalOpen(false);
    setServiceNotesInput('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Fleet Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="w-5 h-5" style={{ color: activeThemeColor }} />
              <span>Kigali Fleet & Physical Inventory</span>
            </h2>
            <span
              className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold"
              style={{
                backgroundColor: `${activeThemeColor}20`,
                color: activeThemeColor,
              }}
            >
              {vehicles.length} VEHICLES
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Physical vehicle tracking, Rwanda Contrôle Technique compliance, daily rates in RWF, and maintenance locks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 ${activeBtnText}`}
            style={{ backgroundColor: activeThemeColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Register New Vehicle</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Fleet
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              {metrics.totalCount}
            </span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
            Available for Booking
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.availableCount}
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
            Active On Trip
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {metrics.bookedCount}
            </span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-400">
            In Workshop
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {metrics.maintenanceCount}
            </span>
            <Wrench className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Daily Potential
          </span>
          <div className="mt-1">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono truncate block">
              {formatRwf(metrics.dailyPotentialRwf)}
            </span>
            <span className="text-[10px] text-slate-400">per 24 hours</span>
          </div>
        </div>

        <div
          onClick={() => setComplianceFilter(complianceFilter === 'Alerts' ? 'All' : 'Alerts')}
          className={`p-3.5 border rounded-xl cursor-pointer transition-colors ${
            metrics.complianceIssuesCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
              Inspection / Yellow Card
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {metrics.complianceIssuesCount}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {metrics.complianceIssuesCount > 0 ? 'Needs Attention' : 'All Valid'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search and Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plate (RAD 450 B), model, chauffeur, or hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Status selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {['All', 'Available', 'Booked', 'Maintenance'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  selectedStatus === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Compliance Alert Filter Toggle */}
          <button
            onClick={() => setComplianceFilter(complianceFilter === 'Alerts' ? 'All' : 'Alerts')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
              complianceFilter === 'Alerts'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Inspection Alerts</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = cat === 'All' ? vehicles.length : vehicles.filter((v) => v.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? `${activeBtnText} shadow-sm font-bold`
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              style={isSelected ? { backgroundColor: activeThemeColor } : undefined}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-current' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <Car className="w-12 h-12 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No vehicles found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, status filters, or category tab to view other fleet inventory.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedStatus('All');
              setSearchQuery('');
              setComplianceFilter('All');
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const badge = getCategoryBadge(vehicle.category);
            const IconComp = badge.icon;
            const isMaintenance = vehicle.status === 'Maintenance';
            const isBooked = vehicle.status === 'Booked';

            const insStatus = getComplianceStatus(vehicle.insurance_expiry);
            const ctStatus = getComplianceStatus(vehicle.controle_technique_expiry);

            const vehicleBookings = bookings.filter(
              (b) => b.vehicle_id === vehicle.id && b.status !== 'Cancelled'
            );
            const totalRevenue = vehicleBookings.reduce((sum, b) => sum + b.total_rwf, 0);

            const isServiceDueSoon =
              vehicle.next_service_km &&
              vehicle.next_service_km - vehicle.current_odometer_km <= 2000;

            return (
              <div
                key={vehicle.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 space-y-4 transition-all relative flex flex-col justify-between ${
                  isMaintenance
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Category and Status Header */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${badge.badgeClass}`}>
                      <IconComp className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          vehicle.status === 'Available'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                            : vehicle.status === 'Booked'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            vehicle.status === 'Available'
                              ? 'bg-emerald-500 animate-pulse'
                              : vehicle.status === 'Booked'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {vehicle.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Rwandan Plate */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {vehicle.model_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Rwanda Standard Plate Badge */}
                        <div className="inline-flex items-center border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded font-mono text-xs font-extrabold text-amber-600 dark:text-amber-300 tracking-wider">
                          <span className="text-[9px] bg-amber-500 text-slate-950 px-1 py-0.1 rounded mr-1 font-sans font-bold">
                            RW
                          </span>
                          {vehicle.plate_number}
                        </div>
                        {vehicle.year && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {vehicle.year}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedVehicleDetails(vehicle)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="View full lifecycle, booking & maintenance history"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Assigned Chauffeur Pill */}
                  <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      Primary Chauffeur:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {vehicle.assigned_driver_name || 'Unassigned'}
                    </span>
                  </div>

                  {/* Rwanda Compliance Status Strip */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div
                      className={`px-2 py-1 rounded border flex items-center justify-between gap-1 ${ctStatus.badgeClass}`}
                      title={`Contrôle Technique: ${ctStatus.label}`}
                    >
                      <span className="font-semibold truncate">Contrôle Tech:</span>
                      <span className="truncate">{ctStatus.label.replace('Valid to ', '')}</span>
                    </div>
                    <div
                      className={`px-2 py-1 rounded border flex items-center justify-between gap-1 ${insStatus.badgeClass}`}
                      title={`Insurance Yellow Card: ${insStatus.label}`}
                    >
                      <span className="font-semibold truncate">Yellow Card:</span>
                      <span className="truncate">{insStatus.label.replace('Valid to ', '')}</span>
                    </div>
                  </div>

                  {/* Interactive Daily Rate Box (Editable in RWF) */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        Daily Rate (RWF)
                      </span>
                      {editingRateVehicleId !== vehicle.id && (
                        <button
                          onClick={() => handleStartEditRate(vehicle)}
                          className="text-[11px] text-amber-500 hover:text-amber-400 font-semibold inline-flex items-center gap-1"
                          title="Edit rental rate in Rwandan Francs"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Rate</span>
                        </button>
                      )}
                    </div>

                    {editingRateVehicleId === vehicle.id ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <input
                          type="number"
                          step="5000"
                          value={newRateInput}
                          onChange={(e) => setNewRateInput(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-amber-400 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none w-full"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRate(vehicle.id)}
                          className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                          title="Save Rate"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingRateVehicleId(null)}
                          className="p-1.5 rounded bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                          {formatRwf(vehicle.daily_rate_rwf)}
                        </span>
                        <span className="text-[11px] text-slate-400">per 24h</span>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{vehicle.seating_capacity} Seats ({vehicle.transmission})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-slate-400" />
                      <span>{vehicle.fuel_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">
                        {vehicle.current_odometer_km.toLocaleString()} km
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{vehicle.location}</span>
                    </div>
                  </div>

                  {/* Service Due alert if approaching threshold */}
                  {isServiceDueSoon && (
                    <div className="text-[10px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Service recommended ({vehicle.current_odometer_km} / {vehicle.next_service_km} km)</span>
                    </div>
                  )}
                </div>

                {/* Operator Action Bar: Maintenance Toggle, Quick Schedule & Details */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setMaintenanceModalVehicle(vehicle)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        isMaintenance
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                      }`}
                      title={isMaintenance ? 'Clear vehicle back to Available status' : 'Ground car for maintenance'}
                    >
                      <Wrench className="w-3 h-3" />
                      <span>{isMaintenance ? 'Clear Service' : 'Maintenance'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedVehicleDetails(vehicle)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Inspect history and compliance"
                    >
                      Details
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenBookingForVehicle(vehicle.id)}
                    disabled={isMaintenance}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs ${
                      isMaintenance
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : `${activeBtnText}`
                    }`}
                    style={!isMaintenance ? { backgroundColor: activeThemeColor } : undefined}
                    title={isMaintenance ? 'Locked: Vehicle is in workshop repair' : 'Create reservation for this vehicle'}
                  >
                    + Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Rich Vehicle Lifecycle & History Modal / Drawer */}
      {selectedVehicleDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadge(selectedVehicleDetails.category).badgeClass}`}>
                    {selectedVehicleDetails.category}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                      selectedVehicleDetails.status === 'Available'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : selectedVehicleDetails.status === 'Booked'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {selectedVehicleDetails.status}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {selectedVehicleDetails.model_name}
                </h3>
                <div className="flex items-center gap-3 mt-1 font-mono text-xs">
                  <span className="font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    {selectedVehicleDetails.plate_number}
                  </span>
                  <span className="text-slate-400">
                    Location: {selectedVehicleDetails.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingVehicle(selectedVehicleDetails);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Edit specs"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedVehicleDetails(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Daily Rate</span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRwf(selectedVehicleDetails.daily_rate_rwf)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Odometer</span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {selectedVehicleDetails.current_odometer_km.toLocaleString()} km
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Next Service</span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {selectedVehicleDetails.next_service_km ? `${selectedVehicleDetails.next_service_km.toLocaleString()} km` : '70,000 km'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Year Built</span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {selectedVehicleDetails.year || '2023'}
                </p>
              </div>
            </div>

            {/* Rwanda Regulatory Compliance Section */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Rwanda Regulatory & Police Compliance</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">RNP & Insurers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Contrôle Technique (RNP):
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getComplianceStatus(selectedVehicleDetails.controle_technique_expiry).badgeClass}`}>
                      {getComplianceStatus(selectedVehicleDetails.controle_technique_expiry).label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Rwanda National Police roadworthiness inspection certificate.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Insurance (Carte Jaune):
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getComplianceStatus(selectedVehicleDetails.insurance_expiry).badgeClass}`}>
                      {getComplianceStatus(selectedVehicleDetails.insurance_expiry).label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Comprehensive motor third-party & commercial passenger cover.
                  </p>
                </div>
              </div>
            </div>

            {/* Service & Workshop History Section */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span>Workshop & Service Log</span>
                </h4>
                <button
                  onClick={() => {
                    setServiceOdometerInput(selectedVehicleDetails.current_odometer_km.toString());
                    setNextServiceKmInput(((selectedVehicleDetails.next_service_km || selectedVehicleDetails.current_odometer_km) + 5000).toString());
                    setIsServiceLogModalOpen(true);
                  }}
                  className="text-[11px] text-amber-500 hover:text-amber-400 font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Service</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Last Workshop Visit: <strong>{selectedVehicleDetails.last_service_date || 'Recent'}</strong></span>
                  <span className="font-mono">Next: {selectedVehicleDetails.next_service_km?.toLocaleString()} km</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded border border-slate-200/60 dark:border-slate-800">
                  "{selectedVehicleDetails.last_service_notes || 'All routine filters, fluids, and safety checks verified in good working order.'}"
                </p>
              </div>
            </div>

            {/* Trip & Booking History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Associated Trips & Booking Records</span>
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-500">
                  Total Earned: {formatRwf(
                    bookings
                      .filter((b) => b.vehicle_id === selectedVehicleDetails.id && b.status !== 'Cancelled')
                      .reduce((sum, b) => sum + b.total_rwf, 0)
                  )}
                </span>
              </div>

              {bookings.filter((b) => b.vehicle_id === selectedVehicleDetails.id).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                  No active or completed bookings recorded for this vehicle yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {bookings
                      .filter((b) => b.vehicle_id === selectedVehicleDetails.id)
                      .map((bk) => (
                        <div
                          key={bk.id}
                          className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-500">
                                #{bk.id}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {bk.client_name}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  bk.status === 'Confirmed'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : bk.status === 'In Progress'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {bk.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>
                                {bk.start_date} → {bk.end_date}
                              </span>
                              <span>•</span>
                              <span className="truncate">{bk.destination}</span>
                            </div>
                          </div>

                          <div className="text-right sm:self-center">
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                              {formatRwf(bk.total_rwf)}
                            </span>
                            <span className="text-[10px] text-emerald-500 font-medium">
                              {bk.payment_status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  if (onDeleteVehicle && confirm(`Are you sure you want to archive ${selectedVehicleDetails.model_name}?`)) {
                    onDeleteVehicle(selectedVehicleDetails.id);
                    setSelectedVehicleDetails(null);
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive Car</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMaintenanceModalVehicle(selectedVehicleDetails);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  {selectedVehicleDetails.status === 'Maintenance' ? 'Clear Maintenance' : 'Set Maintenance'}
                </button>
                <button
                  onClick={() => {
                    onOpenBookingForVehicle(selectedVehicleDetails.id);
                    setSelectedVehicleDetails(null);
                  }}
                  disabled={selectedVehicleDetails.status === 'Maintenance'}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    selectedVehicleDetails.status === 'Maintenance'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : `${activeBtnText}`
                  }`}
                  style={selectedVehicleDetails.status !== 'Maintenance' ? { backgroundColor: activeThemeColor } : undefined}
                >
                  + New Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Vehicle Details ({editingVehicle.plate_number})
              </h3>
              <button
                onClick={() => setEditingVehicle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVehicle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Model & Specification
                </label>
                <input
                  type="text"
                  required
                  value={editingVehicle.model_name}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, model_name: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.plate_number}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, plate_number: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-amber-500 font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Daily Rate (RWF)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    required
                    value={editingVehicle.daily_rate_rwf}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, daily_rate_rwf: Number(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Primary Chauffeur
                  </label>
                  <select
                    value={editingVehicle.assigned_driver_id || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, assigned_driver_id: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Hub Location
                  </label>
                  <input
                    type="text"
                    value={editingVehicle.location}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, location: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Contrôle Technique Expiry
                  </label>
                  <input
                    type="date"
                    value={editingVehicle.controle_technique_expiry || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, controle_technique_expiry: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Insurance Yellow Card Expiry
                  </label>
                  <input
                    type="date"
                    value={editingVehicle.insurance_expiry || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, insurance_expiry: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Update Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Log Workshop Service Modal */}
      {isServiceLogModalOpen && selectedVehicleDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Record Workshop Service Log
                </h3>
              </div>
              <button
                onClick={() => setIsServiceLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogService} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Current Odometer (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceOdometerInput}
                    onChange={(e) => setServiceOdometerInput(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Next Service Target (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={nextServiceKmInput}
                    onChange={(e) => setNextServiceKmInput(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Service Work Done & Garage Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Engine oil replaced (15W-40 Synthetic), oil filter, front brake pads, suspension check passed."
                  value={serviceNotesInput}
                  onChange={(e) => setServiceNotesInput(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServiceLogModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors"
                >
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Maintenance Confirmation Modal */}
      {maintenanceModalVehicle && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {maintenanceModalVehicle.status === 'Maintenance'
                    ? 'Clear Vehicle from Maintenance'
                    : 'Send Vehicle to Workshop Maintenance'}
                </h3>
              </div>
              <button
                onClick={() => setMaintenanceModalVehicle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Target Vehicle: <strong>{maintenanceModalVehicle.model_name}</strong> (
              <span className="font-mono text-amber-500 font-bold">{maintenanceModalVehicle.plate_number}</span>)
            </p>

            {maintenanceModalVehicle.status !== 'Maintenance' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
                    Maintenance Reason / Workshop Service:
                  </label>
                  <input
                    type="text"
                    value={maintenanceReason}
                    onChange={(e) => setMaintenanceReason(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[11px] text-rose-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Collision Engine Lock:</strong> Setting maintenance locks this vehicle across the calendar, preventing double-bookings and storefront reservations while in repair.
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                This vehicle will be restored to <strong>Available</strong> status for customer bookings.
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setMaintenanceModalVehicle(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMaintenance}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Register New Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Register New Fleet Vehicle</h3>
                <p className="text-xs text-slate-400">Add physical inventory to your Kigali rental fleet</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Model & Specification
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Land Cruiser Prado TXL (2024)"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="RAD 450 B"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-amber-500 font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  >
                    <option value="LandCruiser">LandCruiser (4x4)</option>
                    <option value="RAV4">RAV4 (AWD)</option>
                    <option value="Coaster">Coaster Bus (30-Seat)</option>
                    <option value="Safari Van">Safari Van (Pop-Top)</option>
                    <option value="Luxury Sedan">Luxury Sedan</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    min="2010"
                    max="2027"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Daily Rate (RWF)
                  </label>
                  <input
                    type="number"
                    required
                    step="5000"
                    placeholder="180000"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Passenger Capacity
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={seating}
                    onChange={(e) => setSeating(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Transmission
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as 'Automatic' | 'Manual')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as 'Diesel' | 'Petrol')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Assign Primary Chauffeur
                  </label>
                  <select
                    value={assignedDriverId}
                    onChange={(e) => setAssignedDriverId(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Hub Location in Kigali
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Kigali HQ - Remera"
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Contrôle Technique Expiry (RNP)
                  </label>
                  <input
                    type="date"
                    value={controleTechniqueExpiry}
                    onChange={(e) => setControleTechniqueExpiry(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Insurance Yellow Card Expiry
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Save to Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
