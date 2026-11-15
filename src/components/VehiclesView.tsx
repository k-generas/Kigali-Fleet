import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleCategory, VehicleStatus, Booking, Driver, ExpenseRecord, MaintenanceRecord } from '../types';
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
  TrendingUp,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  bookings: Booking[];
  drivers?: Driver[];
  expenses?: ExpenseRecord[];
  maintenance?: MaintenanceRecord[];
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
  expenses = [],
  maintenance = [],
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
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 stripe-card">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#0a2540] dark:text-white flex items-center gap-2.5">
              <Car className="w-6 h-6" style={{ color: activeThemeColor }} />
              <span>Cars</span>
            </h2>
            <span
              className="text-xs font-mono px-3 py-1 rounded-full font-semibold"
              style={{
                backgroundColor: `${activeThemeColor}18`,
                color: activeThemeColor,
              }}
            >
              {vehicles.length} cars
            </span>
          </div>
          <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
            All your cars, daily prices in RWF, insurance dates, and repair locks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-all shadow-xs active:scale-95 ${activeBtnText}`}
            style={{ backgroundColor: activeThemeColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Car</span>
          </button>
        </div>
      </div>

      {/* 2. Key Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-[#425466] dark:text-slate-400">
            All Cars
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-[#0a2540] dark:text-white font-mono">
              {metrics.totalCount}
            </span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Ready
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.availableCount}
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Booked
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {metrics.bookedCount}
            </span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
            In Repair
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {metrics.maintenanceCount}
            </span>
            <Wrench className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl stripe-card">
          <span className="text-xs font-medium text-[#425466] dark:text-slate-400">
            Daily Total
          </span>
          <div className="mt-1.5">
            <span className="text-base font-bold text-[#0a2540] dark:text-white font-mono truncate block">
              {formatRwf(metrics.dailyPotentialRwf)}
            </span>
            <span className="text-xs text-[#425466] dark:text-slate-400">per day</span>
          </div>
        </div>

        <div
          onClick={() => setComplianceFilter(complianceFilter === 'Alerts' ? 'All' : 'Alerts')}
          className={`p-4 border rounded-2xl cursor-pointer transition-colors stripe-card ${
            metrics.complianceIssuesCount > 0
              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100/70'
              : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Papers Due
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">
              {metrics.complianceIssuesCount}
            </span>
            <span className="text-xs font-medium text-[#425466] dark:text-slate-300">
              {metrics.complianceIssuesCount > 0 ? 'Check soon' : 'All good'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 stripe-card">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plate, car model, driver, or place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-8 py-2 text-sm text-[#0a2540] dark:text-white outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0a2540]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {['All', 'Available', 'Booked', 'Maintenance'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedStatus === st
                    ? 'bg-white dark:bg-slate-900 text-[#0a2540] dark:text-white shadow-xs'
                    : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                }`}
              >
                {st === 'Available' ? 'Ready' : st === 'Maintenance' ? 'In Repair' : st}
              </button>
            ))}
          </div>

          <button
            onClick={() => setComplianceFilter(complianceFilter === 'Alerts' ? 'All' : 'Alerts')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              complianceFilter === 'Alerts'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-[#f6f9fc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#425466] dark:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Papers Due</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = cat === 'All' ? vehicles.length : vehicles.filter((v) => v.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full px-3 py-2 rounded-full font-semibold transition-all flex items-center justify-between gap-2 min-w-0 ${
                isSelected
                  ? `${activeBtnText} shadow-xs`
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white'
              }`}
              style={isSelected ? { backgroundColor: activeThemeColor } : undefined}
            >
              <span className="truncate">{cat}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-black/20 text-current' : 'bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 stripe-card">
          <Car className="w-12 h-12 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">No cars found</h3>
          <p className="text-sm text-[#425466] dark:text-slate-400 max-w-sm mx-auto">
            Try clearing your search or choosing another filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedStatus('All');
              setSearchQuery('');
              setComplianceFilter('All');
            }}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-200 hover:bg-slate-200"
          >
            Show All Cars
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((vehicle) => {
            const badge = getCategoryBadge(vehicle.category);
            const IconComp = badge.icon;
            const isMaintenance = vehicle.status === 'Maintenance';

            const insStatus = getComplianceStatus(vehicle.insurance_expiry);
            const ctStatus = getComplianceStatus(vehicle.controle_technique_expiry);

            const isServiceDueSoon =
              vehicle.next_service_km &&
              vehicle.next_service_km - vehicle.current_odometer_km <= 2000;

            return (
              <div
                key={vehicle.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all relative flex flex-col justify-between stripe-card ${
                  isMaintenance
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.badgeClass}`}>
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 ${
                        vehicle.status === 'Available'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60'
                          : vehicle.status === 'Booked'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/60'
                      }`}
                    >
                      {vehicle.status === 'Available' ? 'Ready' : vehicle.status === 'Maintenance' ? 'In Repair' : vehicle.status}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-[#0a2540] dark:text-white leading-snug">
                        {vehicle.model_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="inline-flex items-center border border-amber-400/50 bg-amber-50 dark:bg-amber-500/15 px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold text-amber-700 dark:text-amber-300 tracking-wider">
                          {vehicle.plate_number}
                        </div>
                        {vehicle.year && (
                          <span className="text-xs text-[#425466] dark:text-slate-400 font-medium">
                            {vehicle.year}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedVehicleDetails(vehicle)}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="See car details"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#f6f9fc] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[#425466] dark:text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      Main Driver:
                    </span>
                    <span className="font-semibold text-[#0a2540] dark:text-slate-200 truncate max-w-[150px]">
                      {vehicle.assigned_driver_name || 'Any Driver'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                      className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-1 ${ctStatus.badgeClass}`}
                      title={`Safety Check: ${ctStatus.label}`}
                    >
                      <span className="font-semibold truncate">Safety Check:</span>
                      <span className="truncate">{ctStatus.label.replace('Valid to ', '')}</span>
                    </div>
                    <div
                      className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-1 ${insStatus.badgeClass}`}
                      title={`Insurance: ${insStatus.label}`}
                    >
                      <span className="font-semibold truncate">Insurance:</span>
                      <span className="truncate">{insStatus.label.replace('Valid to ', '')}</span>
                    </div>
                  </div>

                  {/* Interactive Daily Rate Box (Editable in RWF) */}
                  <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#425466] dark:text-slate-400 font-semibold">
                        Daily Rate (RWF)
                      </span>
                      {editingRateVehicleId !== vehicle.id && (
                        <button
                          onClick={() => handleStartEditRate(vehicle)}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold inline-flex items-center gap-1"
                          title="Edit daily price in RWF"
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
                          className="bg-white dark:bg-slate-800 border border-amber-400 rounded-xl px-2.5 py-1.5 text-sm font-mono font-bold text-[#0a2540] dark:text-white outline-none w-full"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRate(vehicle.id)}
                          className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                          title="Save Price"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingRateVehicleId(null)}
                          className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-[#0a2540] dark:text-slate-200"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="font-mono text-lg font-extrabold text-[#0a2540] dark:text-white tabular-nums">
                          {formatRwf(vehicle.daily_rate_rwf)}
                        </span>
                        <span className="text-sm text-[#425466] dark:text-slate-400">per day</span>
                      </div>
                    )}
                  </div>

                  {/* Car Details Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-sm text-[#425466] dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{vehicle.seating_capacity} Seats ({vehicle.transmission})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-slate-400" />
                      <span>{vehicle.fuel_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-slate-400" />
                      <span className="font-mono">
                        {vehicle.current_odometer_km.toLocaleString()} km
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{vehicle.location}</span>
                    </div>
                  </div>

                  {/* Service Due alert */}
                  {isServiceDueSoon && (
                    <div className="text-sm px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Checkup soon ({vehicle.current_odometer_km} / {vehicle.next_service_km} km)</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMaintenanceModalVehicle(vehicle)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full border transition-colors ${
                        isMaintenance
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      <span>{isMaintenance ? 'Ready Now' : 'Repair'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedVehicleDetails(vehicle)}
                      className="px-3.5 py-2 text-sm font-semibold rounded-full text-[#425466] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Details
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenBookingForVehicle(vehicle.id)}
                    disabled={isMaintenance}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all shadow-xs ${
                      isMaintenance
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : `${activeBtnText}`
                    }`}
                    style={!isMaintenance ? { backgroundColor: activeThemeColor } : undefined}
                  >
                    + Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Car Details & History Modal */}
      {selectedVehicleDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-sm font-semibold border ${getCategoryBadge(selectedVehicleDetails.category).badgeClass}`}>
                    {selectedVehicleDetails.category}
                  </span>
                  <span
                    className={`text-sm px-3 py-0.5 rounded-full font-mono font-semibold ${
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
                <h3 className="text-xl font-bold text-[#0a2540] dark:text-white mt-2">
                  {selectedVehicleDetails.model_name}
                </h3>
                <div className="flex items-center gap-3 mt-1 font-mono text-sm">
                  <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    {selectedVehicleDetails.plate_number}
                  </span>
                  <span className="text-[#425466] dark:text-slate-400">
                    Parked at: {selectedVehicleDetails.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingVehicle(selectedVehicleDetails);
                  }}
                  className="p-2 rounded-full text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Edit car info"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedVehicleDetails(null)}
                  className="p-2 rounded-full text-slate-400 hover:text-[#0a2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Day Price</span>
                <p className="text-base font-bold text-[#0a2540] dark:text-white font-mono mt-0.5">
                  {formatRwf(selectedVehicleDetails.daily_rate_rwf)}
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Distance Driven</span>
                <p className="text-base font-bold text-[#0a2540] dark:text-white font-mono mt-0.5">
                  {selectedVehicleDetails.current_odometer_km.toLocaleString()} km
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Next Checkup</span>
                <p className="text-base font-bold text-[#0a2540] dark:text-white font-mono mt-0.5">
                  {selectedVehicleDetails.next_service_km ? `${selectedVehicleDetails.next_service_km.toLocaleString()} km` : '70,000 km'}
                </p>
              </div>
              <div className="p-3.5 bg-[#f6f9fc] dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Year</span>
                <p className="text-base font-bold text-[#0a2540] dark:text-white font-mono mt-0.5">
                  {selectedVehicleDetails.year || '2023'}
                </p>
              </div>
            </div>

            {/* Car Money Summary */}
            {(() => {
              const vBookings = bookings.filter((b) => b.vehicle_id === selectedVehicleDetails.id && b.status !== 'Cancelled');
              const grossRevenue = vBookings.reduce((sum, b) => sum + (b.total_rwf || 0), 0);
              const vMaintenance = maintenance.filter((m) => m.vehicle_id === selectedVehicleDetails.id);
              const totalMaintCost = vMaintenance.reduce((sum, m) => sum + (m.cost_rwf || 0), 0);
              const vExpenses = expenses.filter((e) => e.vehicle_id === selectedVehicleDetails.id && e.status !== 'Rejected');
              const totalFuelExpenses = vExpenses.reduce((sum, e) => sum + (e.amount_rwf || 0), 0);
              const totalRecordedCosts = totalMaintCost + totalFuelExpenses;
              const netOperatingContribution = grossRevenue - totalRecordedCosts;
              const marginPct = grossRevenue > 0 ? Math.round((netOperatingContribution / grossRevenue) * 100) : 0;

              return (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#f6f9fc] dark:bg-slate-950/60 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-sm font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>Money Earned by This Car</span>
                    </h4>
                    <span className="text-sm font-mono px-3 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[#0a2540] dark:text-slate-300 font-semibold">
                      {vBookings.length} Trips · {marginPct}% Kept
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold block">Total Earned</span>
                      <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatRwf(grossRevenue)}
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold block">Repairs</span>
                      <span className="text-sm font-bold font-mono text-rose-500">
                        -{formatRwf(totalMaintCost)}
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold block">Fuel & Trip Pay</span>
                      <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                        -{formatRwf(totalFuelExpenses)}
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-sm text-[#425466] dark:text-slate-400 font-semibold block">Profit</span>
                      <span className={`text-sm font-bold font-mono ${netOperatingContribution >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {formatRwf(netOperatingContribution)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Car Papers & Insurance */}
            <div className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#f6f9fc] dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Car Papers & Safety Dates</span>
                </h4>
                <span className="text-sm font-mono text-[#425466] dark:text-slate-400">Rwanda Police & Insurance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#0a2540] dark:text-slate-300">
                      Police Car Check:
                    </span>
                    <span className={`text-sm px-2.5 py-0.5 rounded-full border ${getComplianceStatus(selectedVehicleDetails.controle_technique_expiry).badgeClass}`}>
                      {getComplianceStatus(selectedVehicleDetails.controle_technique_expiry).label}
                    </span>
                  </div>
                  <p className="text-sm text-[#425466] dark:text-slate-400">
                    Rwanda National Police road safety certificate.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#0a2540] dark:text-slate-300">
                      Car Insurance:
                    </span>
                    <span className={`text-sm px-2.5 py-0.5 rounded-full border ${getComplianceStatus(selectedVehicleDetails.insurance_expiry).badgeClass}`}>
                      {getComplianceStatus(selectedVehicleDetails.insurance_expiry).label}
                    </span>
                  </div>
                  <p className="text-sm text-[#425466] dark:text-slate-400">
                    Yellow Card & passenger insurance cover.
                  </p>
                </div>
              </div>
            </div>

            {/* Garage History Section */}
            <div className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#f6f9fc] dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span>Garage & Repair Notes</span>
                </h4>
                <button
                  onClick={() => {
                    setServiceOdometerInput(selectedVehicleDetails.current_odometer_km.toString());
                    setNextServiceKmInput(((selectedVehicleDetails.next_service_km || selectedVehicleDetails.current_odometer_km) + 5000).toString());
                    setIsServiceLogModalOpen(true);
                  }}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Garage Note</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
                <div className="flex items-center justify-between text-sm text-[#425466] dark:text-slate-400">
                  <span>Last Garage Visit: <strong>{selectedVehicleDetails.last_service_date || 'Recent'}</strong></span>
                  <span className="font-mono">Next: {selectedVehicleDetails.next_service_km?.toLocaleString()} km</span>
                </div>
                <p className="text-sm text-[#0a2540] dark:text-slate-300 leading-relaxed italic bg-[#f6f9fc] dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  "{selectedVehicleDetails.last_service_notes || 'Oil, filters, brakes, and tires checked and working well.'}"
                </p>
              </div>
            </div>

            {/* Trip & Booking History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Past & Coming Trips</span>
                </h4>
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Total Earned: {formatRwf(
                    bookings
                      .filter((b) => b.vehicle_id === selectedVehicleDetails.id && b.status !== 'Cancelled')
                      .reduce((sum, b) => sum + b.total_rwf, 0)
                  )}
                </span>
              </div>

              {bookings.filter((b) => b.vehicle_id === selectedVehicleDetails.id).length === 0 ? (
                <div className="p-6 text-center text-sm text-[#425466] dark:text-slate-400 bg-[#f6f9fc] dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                  No trips recorded for this car yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-sm">
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {bookings
                      .filter((b) => b.vehicle_id === selectedVehicleDetails.id)
                      .map((bk) => (
                        <div
                          key={bk.id}
                          className="p-3.5 bg-white dark:bg-slate-900 hover:bg-[#f6f9fc] dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                #{bk.id}
                              </span>
                              <span className="font-semibold text-[#0a2540] dark:text-white">
                                {bk.client_name}
                              </span>
                              <span
                                className={`text-sm px-2.5 py-0.5 rounded-full font-semibold ${
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
                            <div className="text-sm text-[#425466] dark:text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>
                                {bk.start_date} → {bk.end_date}
                              </span>
                              <span>•</span>
                              <span className="truncate">{bk.destination}</span>
                            </div>
                          </div>

                          <div className="text-right sm:self-center">
                            <span className="font-mono font-bold text-[#0a2540] dark:text-white text-sm block">
                              {formatRwf(bk.total_rwf)}
                            </span>
                            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
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
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (onDeleteVehicle) {
                    onDeleteVehicle(selectedVehicleDetails.id);
                    setSelectedVehicleDetails(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Car</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMaintenanceModalVehicle(selectedVehicleDetails);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0a2540] dark:text-slate-200"
                >
                  {selectedVehicleDetails.status === 'Maintenance' ? 'Mark Ready Now' : 'Send to Garage'}
                </button>
                <button
                  onClick={() => {
                    onOpenBookingForVehicle(selectedVehicleDetails.id);
                    setSelectedVehicleDetails(null);
                  }}
                  disabled={selectedVehicleDetails.status === 'Maintenance'}
                  className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
                    selectedVehicleDetails.status === 'Maintenance'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : `${activeBtnText}`
                  }`}
                  style={selectedVehicleDetails.status !== 'Maintenance' ? { backgroundColor: activeThemeColor } : undefined}
                >
                  + Book This Car
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Car Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                Edit Car ({editingVehicle.plate_number})
              </h3>
              <button
                onClick={() => setEditingVehicle(null)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVehicle} className="space-y-4 text-sm">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                  Car Model & Name
                </label>
                <input
                  type="text"
                  required
                  value={editingVehicle.model_name}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, model_name: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Number Plate
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.plate_number}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, plate_number: e.target.value.toUpperCase() })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-amber-600 dark:text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Price per Day (RWF)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    required
                    value={editingVehicle.daily_rate_rwf}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, daily_rate_rwf: Number(e.target.value) })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Main Driver
                  </label>
                  <select
                    value={editingVehicle.assigned_driver_id || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, assigned_driver_id: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="">Any Driver</option>
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Where Parked
                  </label>
                  <input
                    type="text"
                    value={editingVehicle.location}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, location: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Police Car Check End Date
                  </label>
                  <input
                    type="date"
                    value={editingVehicle.controle_technique_expiry || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, controle_technique_expiry: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Insurance End Date
                  </label>
                  <input
                    type="date"
                    value={editingVehicle.insurance_expiry || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, insurance_expiry: e.target.value })}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2 rounded-full text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Add Garage Note Modal */}
      {isServiceLogModalOpen && selectedVehicleDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  Add Garage Note
                </h3>
              </div>
              <button
                onClick={() => setIsServiceLogModalOpen(false)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogService} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Distance Now (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceOdometerInput}
                    onChange={(e) => setServiceOdometerInput(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Next Checkup (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={nextServiceKmInput}
                    onChange={(e) => setNextServiceKmInput(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                  What Was Fixed
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Changed engine oil, oil filter, and front brakes."
                  value={serviceNotesInput}
                  onChange={(e) => setServiceNotesInput(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServiceLogModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Garage Confirmation Modal */}
      {maintenanceModalVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
                  {maintenanceModalVehicle.status === 'Maintenance'
                    ? 'Bring Car Back From Garage'
                    : 'Send Car to Garage'}
                </h3>
              </div>
              <button
                onClick={() => setMaintenanceModalVehicle(null)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#425466] dark:text-slate-300 leading-relaxed">
              Car: <strong>{maintenanceModalVehicle.model_name}</strong> (
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{maintenanceModalVehicle.plate_number}</span>)
            </p>

            {maintenanceModalVehicle.status !== 'Maintenance' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 text-sm font-semibold mb-1">
                    Why Is It Going to the Garage?
                  </label>
                  <input
                    type="text"
                    value={maintenanceReason}
                    onChange={(e) => setMaintenanceReason(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Double-Booking Lock:</strong> This car will be blocked on the calendar so nobody can book it while in repair.
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                This car will show as <strong>Ready Now</strong> so clients can book it again.
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setMaintenanceModalVehicle(null)}
                className="px-4 py-2 text-sm font-semibold text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMaintenance}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Add New Car Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Add New Car</h3>
                <p className="text-sm text-[#425466] dark:text-slate-400">Add a car to your Kigali fleet</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-[#0a2540] dark:hover:text-white p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-sm">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                  Car Model & Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Land Cruiser Prado TXL (2024)"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Number Plate
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="RAD 450 B"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-amber-600 dark:text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Car Type
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
                  >
                    <option value="LandCruiser">LandCruiser (4x4)</option>
                    <option value="RAV4">RAV4 (AWD)</option>
                    <option value="Coaster">Coaster Bus (30-Seat)</option>
                    <option value="Safari Van">Safari Van</option>
                    <option value="Luxury Sedan">Luxury Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    min="2010"
                    max="2027"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Price per Day (RWF)
                  </label>
                  <input
                    type="number"
                    required
                    step="5000"
                    placeholder="180000"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Seats
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={seating}
                    onChange={(e) => setSeating(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Gearbox
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as 'Automatic' | 'Manual')}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Fuel
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as 'Diesel' | 'Petrol')}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Main Driver
                  </label>
                  <select
                    value={assignedDriverId}
                    onChange={(e) => setAssignedDriverId(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  >
                    <option value="">Any Driver</option>
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Where Parked in Kigali
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Kigali Office - Remera"
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Police Car Check End Date
                  </label>
                  <input
                    type="date"
                    value={controleTechniqueExpiry}
                    onChange={(e) => setControleTechniqueExpiry(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">
                    Insurance End Date
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full font-semibold ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Save Car
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
