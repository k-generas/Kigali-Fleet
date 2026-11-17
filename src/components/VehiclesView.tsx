import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleCategory, VehicleStatus, Booking, Driver, ExpenseRecord, MaintenanceRecord } from '../types';
import { formatRwf } from '../utils/collision';
import { formatExpiryStatus, formatHumanDate, formatHumanDateRange } from '../utils/dates';
import { getCategoryBadge } from './CalendarTimelineView';
import {
  Plus,
  Car,
  X,
  Edit2,
  Wrench,
  AlertTriangle,
  ShieldCheck,
  Check,
  Search,
  Trash2,
  LayoutGrid,
  List,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import {
  CATEGORY_DEFAULT_IMAGES,
  VEHICLE_FEATURE_OPTIONS,
  getVehicleGalleryImages,
  normalizeVehicleGallery,
  getVehicleCustomerSummary,
} from '../utils/vehicleImages';
import { VehiclePhotoGallery } from './VehiclePhotoGallery';
import { VehiclePhotoManager } from './VehiclePhotoManager';
import { useI18n } from '../utils/i18n';

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
  companyId?: string;
  isDemoMode?: boolean;
}

const inputCls =
  'w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';

const selectCls =
  'w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  bookings,
  drivers = [],
  expenses = [],
  maintenance = [],
  currentTheme,
  onAddVehicle,
  onUpdateRate,
  onToggleMaintenance,
  onOpenBookingForVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  companyId,
  isDemoMode = false,
}) => {
  const { currency, formatMoney, tr } = useI18n();
  const activeColor = currentTheme?.hex || '#0b6e8a';

  // View mode & Filters
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [complianceFilter, setComplianceFilter] = useState<'All' | 'Alerts'>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicleDetailsState, setSelectedVehicleDetails] = useState<Vehicle | null>(null);
  const selectedVehicleDetails = useMemo(
    () =>
      selectedVehicleDetailsState
        ? vehicles.find((v) => v.id === selectedVehicleDetailsState.id) || selectedVehicleDetailsState
        : null,
    [vehicles, selectedVehicleDetailsState]
  );
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
  const [odometerKm, setOdometerKm] = useState('35000');
  const [location, setLocation] = useState('Kigali HQ - Remera');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('2027-02-28');
  const [controleTechniqueExpiry, setControleTechniqueExpiry] = useState('2027-01-31');
  const [addGalleryUrls, setAddGalleryUrls] = useState<string[]>([]);
  const [addDescription, setAddDescription] = useState('');
  const [addFeatures, setAddFeatures] = useState<string[]>([
    'Air Conditioning',
    'Bluetooth & USB',
    'Unlimited Rwanda km',
  ]);

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
      const ins = formatExpiryStatus(v.insurance_expiry);
      const ct = formatExpiryStatus(v.controle_technique_expiry);
      return (
        ins.level === 'problem' ||
        ins.level === 'attention' ||
        ct.level === 'problem' ||
        ct.level === 'attention'
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
        const ins = formatExpiryStatus(v.insurance_expiry);
        const ct = formatExpiryStatus(v.controle_technique_expiry);
        const hasIssue =
          ins.level === 'problem' ||
          ins.level === 'attention' ||
          ct.level === 'problem' ||
          ct.level === 'attention';
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

  const startEditingVehicle = (v: Vehicle) => {
    const gallery = getVehicleGalleryImages(v);
    setEditingVehicle({
      ...v,
      image_url: gallery[0],
      gallery_urls: gallery,
      description: v.description || '',
      features: v.features || [],
    });
  };

  const toggleAddFeature = (feat: string) => {
    setAddFeatures((prev) =>
      prev.includes(feat) ? prev.filter((item) => item !== feat) : [...prev, feat]
    );
  };

  const toggleEditFeature = (feat: string) => {
    if (!editingVehicle) return;
    const current = editingVehicle.features || [];
    const next = current.includes(feat)
      ? current.filter((item) => item !== feat)
      : [...current, feat];
    setEditingVehicle({ ...editingVehicle, features: next });
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName || !plateNumber) return;

    const matchedDriver = drivers.find((d) => d.id === assignedDriverId);
    const normalized = normalizeVehicleGallery(
      addGalleryUrls.length > 0 ? addGalleryUrls : [CATEGORY_DEFAULT_IMAGES[category]],
      category
    );

    onAddVehicle({
      model_name: modelName.trim(),
      plate_number: plateNumber.trim().toUpperCase(),
      category,
      year: Number(year) || 2023,
      daily_rate_rwf: Number(dailyRate) || 100000,
      status: 'Available',
      seating_capacity: Number(seating) || 5,
      transmission,
      fuel_type: fuelType,
      current_odometer_km: Number(odometerKm) || 35000,
      location: location.trim() || 'Kigali HQ - Remera',
      assigned_driver_id: assignedDriverId || undefined,
      assigned_driver_name: matchedDriver ? matchedDriver.name : undefined,
      image_url: normalized.image_url,
      gallery_urls: normalized.gallery_urls,
      description: addDescription.trim() || undefined,
      features: addFeatures.length > 0 ? addFeatures : undefined,
      insurance_expiry: insuranceExpiry,
      controle_technique_expiry: controleTechniqueExpiry,
      last_service_date: new Date().toISOString().split('T')[0],
      last_service_notes: 'Initial pre-delivery vehicle inspection passed.',
      next_service_km: (Number(odometerKm) || 35000) + 5000,
    });

    setModelName('');
    setPlateNumber('');
    setOdometerKm('35000');
    setAddGalleryUrls([]);
    setAddDescription('');
    setAddFeatures(['Air Conditioning', 'Bluetooth & USB', 'Unlimited Rwanda km']);
    setIsAddModalOpen(false);
  };

  const handleSaveEditVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !onUpdateVehicle) return;

    const matchedDriver = drivers.find((d) => d.id === editingVehicle.assigned_driver_id);
    const normalized = normalizeVehicleGallery(
      editingVehicle.gallery_urls && editingVehicle.gallery_urls.length > 0
        ? editingVehicle.gallery_urls
        : getVehicleGalleryImages(editingVehicle),
      editingVehicle.category
    );

    const updatedRecord: Vehicle = {
      ...editingVehicle,
      model_name: editingVehicle.model_name.trim(),
      plate_number: editingVehicle.plate_number.trim().toUpperCase(),
      location: editingVehicle.location.trim(),
      year: Number(editingVehicle.year) || 2023,
      daily_rate_rwf: Math.max(10000, Number(editingVehicle.daily_rate_rwf) || 100000),
      seating_capacity: Math.max(2, Number(editingVehicle.seating_capacity) || 5),
      current_odometer_km: Math.max(0, Number(editingVehicle.current_odometer_km) || 0),
      image_url: normalized.image_url,
      gallery_urls: normalized.gallery_urls,
      description: editingVehicle.description?.trim() || '',
      features: editingVehicle.features || [],
      assigned_driver_id: editingVehicle.assigned_driver_id || undefined,
      assigned_driver_name: matchedDriver ? matchedDriver.name : undefined,
    };

    onUpdateVehicle(editingVehicle.id, updatedRecord);

    if (selectedVehicleDetails?.id === editingVehicle.id) {
      setSelectedVehicleDetails(updatedRecord);
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

  const expiryTextClass = (level: 'ok' | 'attention' | 'problem') => {
    if (level === 'problem') return 'text-rose-600 dark:text-rose-400 font-semibold';
    if (level === 'attention') return 'text-amber-700 dark:text-amber-400 font-semibold';
    return 'text-slate-800 dark:text-slate-200';
  };

  const statusMeta = (status: VehicleStatus) => {
    if (status === 'Available') {
      return {
        dot: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        label: tr('Ready'),
      };
    }
    if (status === 'Booked') {
      return {
        dot: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        label: tr('Booked'),
      };
    }
    return {
      dot: 'bg-rose-500',
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      label: tr('In repair'),
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Cars')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('All your cars, daily prices, and car check dates')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg accent-bg hover:opacity-95 shadow-xs transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>{tr('Add Car')}</span>
        </button>
      </div>

      {/* 2. 4-Card Modern KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('All Cars')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {metrics.totalCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
            {formatMoney(metrics.dailyPotentialRwf)} {tr('Daily Total').toLowerCase()}
          </p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'Available' ? 'All' : 'Available')}
          className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Ready')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {metrics.availableCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Available for new bookings
          </p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'Booked' ? 'All' : 'Booked')}
          className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Booked')}</span>
            <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {metrics.bookedCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {metrics.maintenanceCount} {tr('In repair').toLowerCase()}
          </p>
        </div>

        <div
          onClick={() => setComplianceFilter(complianceFilter === 'Alerts' ? 'All' : 'Alerts')}
          className={`bg-white dark:bg-[#111827] border rounded-xl p-5 kf-card cursor-pointer transition-colors ${
            complianceFilter === 'Alerts'
              ? 'border-rose-300 dark:border-rose-500/50'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Papers Due')}</span>
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                metrics.complianceIssuesCount > 0
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div
            className={`text-2xl font-semibold mt-2 tabular-nums ${
              metrics.complianceIssuesCount > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {metrics.complianceIssuesCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {complianceFilter === 'Alerts' ? 'Filtered to cars due' : 'Insurance & safety checks'}
          </p>
        </div>
      </div>

      {/* 3. Filter & View Mode Toolbar */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 kf-card flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Status Switch */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg">
            {['All', 'Available', 'Booked', 'Maintenance'].map((st) => {
              const active = selectedStatus === st;
              const label = st === 'Available' ? tr('Ready') : st === 'Maintenance' ? tr('In Repair') : tr(st);
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by car type"
            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none"
          >
            {categories.map((cat) => {
              const count = cat === 'All' ? vehicles.length : vehicles.filter((v) => v.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All car types' : cat} ({count})
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={() => setComplianceFilter(complianceFilter === 'Alerts' ? 'All' : 'Alerts')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              complianceFilter === 'Alerts'
                ? 'border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Papers due</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 lg:w-68">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plate, car, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Grid / Table View Toggle */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid cards view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Inventory table view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Fleet Inventory (Grid Cards or Inventory Table) */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-12 text-center space-y-3 kf-card">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No cars found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try clearing your search or choosing another filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedStatus('All');
              setSearchQuery('');
              setComplianceFilter('All');
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Show all cars
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((vehicle) => {
            const isMaintenance = vehicle.status === 'Maintenance';
            const insStatus = formatExpiryStatus(vehicle.insurance_expiry);
            const ctStatus = formatExpiryStatus(vehicle.controle_technique_expiry);
            const isServiceDueSoon =
              vehicle.next_service_km &&
              vehicle.next_service_km - vehicle.current_odometer_km <= 2000;
            const st = statusMeta(vehicle.status);

            return (
              <div
                key={vehicle.id}
                className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl flex flex-col justify-between overflow-hidden kf-card hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  {/* Photo Banner */}
                  <div className="relative bg-slate-100 dark:bg-slate-800">
                    <VehiclePhotoGallery
                      vehicle={vehicle}
                      aspectClass="h-48 rounded-none border-0"
                      showThumbnails={false}
                      accentColor={activeColor}
                      onImageClick={() => setSelectedVehicleDetails(vehicle)}
                    />
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-4">
                    {/* Header: Model + Plate + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium">
                            {vehicle.plate_number}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {vehicle.year || 2023} · {vehicle.category}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug mt-1.5">
                          {vehicle.model_name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {vehicle.seating_capacity} seats · {vehicle.transmission} · {vehicle.fuel_type}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${st.bg} ${st.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span>{st.label}</span>
                      </span>
                    </div>

                    {/* Price Row */}
                    <div className="flex items-center justify-between">
                      {editingRateVehicleId === vehicle.id ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="number"
                            step="5000"
                            value={newRateInput}
                            onChange={(e) => setNewRateInput(e.target.value)}
                            className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRate(vehicle.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium accent-bg"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRateVehicleId(null)}
                            className="px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="text-lg font-semibold font-mono text-slate-900 dark:text-white tabular-nums">
                              {formatMoney(vehicle.daily_rate_rwf)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/ day</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartEditRate(vehicle)}
                            className="text-xs font-medium accent-text hover:underline"
                          >
                            Edit price
                          </button>
                        </>
                      )}
                    </div>

                    {/* 2x2 Tonal Spec Well (No Drawn Ink Grid Lines) */}
                    <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">Driver</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">
                          {vehicle.assigned_driver_name || 'Any driver'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">Odometer</span>
                        <span className="text-slate-800 dark:text-slate-200 font-mono font-medium tabular-nums">
                          {vehicle.current_odometer_km.toLocaleString()} km
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">Safety check</span>
                        <span className={`block truncate ${expiryTextClass(ctStatus.level)}`}>
                          {ctStatus.text}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">Insurance</span>
                        <span className={`block truncate ${expiryTextClass(insStatus.level)}`}>
                          {insStatus.text}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                      <span className="truncate">{vehicle.location}</span>
                      {isServiceDueSoon && vehicle.next_service_km && (
                        <span className="text-amber-700 dark:text-amber-400 font-medium shrink-0">
                          Service @ {vehicle.next_service_km.toLocaleString()} km
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Spaced Footer Buttons */}
                <div className="px-4 pb-4 pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMaintenanceModalVehicle(vehicle)}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isMaintenance ? 'Mark ready' : 'Repair'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicleDetails(vehicle)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Details & Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenBookingForVehicle(vehicle.id)}
                    disabled={isMaintenance}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-opacity ${
                      isMaintenance
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'accent-bg hover:opacity-95'
                    }`}
                  >
                    Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View Mode (Dealership Inventory Style) */
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Specs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Safety & Insurance</th>
                  <th className="py-3 px-4 text-right">Daily Rate</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVehicles.map((vehicle) => {
                  const isMaintenance = vehicle.status === 'Maintenance';
                  const insStatus = formatExpiryStatus(vehicle.insurance_expiry);
                  const ctStatus = formatExpiryStatus(vehicle.controle_technique_expiry);
                  const st = statusMeta(vehicle.status);
                  const thumb = getVehicleGalleryImages(vehicle)[0];

                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumb}
                            alt={vehicle.model_name}
                            onClick={() => setSelectedVehicleDetails(vehicle)}
                            className="w-16 h-11 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedVehicleDetails(vehicle)}
                              className="font-semibold text-slate-900 dark:text-white hover:underline text-left"
                            >
                              {vehicle.model_name}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                {vehicle.plate_number}
                              </span>
                              <span>{vehicle.location}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>{vehicle.category} · {vehicle.year || 2023}</div>
                        <div className="text-slate-400 dark:text-slate-500 mt-0.5">
                          {vehicle.seating_capacity} seats · {vehicle.transmission} · {vehicle.current_odometer_km.toLocaleString()} km
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          <span>{st.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">
                        {vehicle.assigned_driver_name || 'Any driver'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className={expiryTextClass(ctStatus.level)}>CT: {ctStatus.text}</div>
                        <div className={`mt-0.5 ${expiryTextClass(insStatus.level)}`}>Ins: {insStatus.text}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {formatMoney(vehicle.daily_rate_rwf)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedVehicleDetails(vehicle)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenBookingForVehicle(vehicle.id)}
                            disabled={isMaintenance}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                              isMaintenance
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                : 'accent-bg hover:opacity-95'
                            }`}
                          >
                            Book
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Car Details & History Modal */}
      {selectedVehicleDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl kf-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {getCategoryBadge(selectedVehicleDetails.category).label}
                  </span>
                  {(() => {
                    const st = statusMeta(selectedVehicleDetails.status);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${st.bg} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span>{selectedVehicleDetails.status}</span>
                      </span>
                    );
                  })()}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-2">
                  {selectedVehicleDetails.model_name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                    {selectedVehicleDetails.plate_number}
                  </span>
                  <span>Parked at {selectedVehicleDetails.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEditingVehicle(selectedVehicleDetails)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{tr('Edit Car & Photos')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVehicleDetails(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <VehiclePhotoGallery
              vehicle={selectedVehicleDetails}
              aspectClass="h-56"
              showThumbnails={true}
              accentColor={activeColor}
            />

            {/* Customer-Facing Info Preview */}
            <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {tr('What Customers See on Booking Site')}
                </h4>
                <button
                  type="button"
                  onClick={() => startEditingVehicle(selectedVehicleDetails)}
                  className="text-xs font-medium accent-text hover:underline"
                >
                  {tr('Update Info')}
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {getVehicleCustomerSummary(selectedVehicleDetails)}
              </p>
              {selectedVehicleDetails.features && selectedVehicleDetails.features.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedVehicleDetails.features.map((feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{tr(feat)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Facts Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Day Price')}</span>
                <span className="text-base font-semibold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5 block">
                  {formatMoney(selectedVehicleDetails.daily_rate_rwf)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Distance Driven')}</span>
                <span className="text-base font-semibold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5 block">
                  {selectedVehicleDetails.current_odometer_km.toLocaleString()} km
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Next Checkup')}</span>
                <span className="text-base font-semibold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5 block">
                  {selectedVehicleDetails.next_service_km
                    ? `${selectedVehicleDetails.next_service_km.toLocaleString()} km`
                    : '70,000 km'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{tr('Year')}</span>
                <span className="text-base font-semibold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5 block">
                  {selectedVehicleDetails.year || '2023'}
                </span>
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
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Money earned by this car
                    </h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {vBookings.length} trips · {marginPct}% kept
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Total earned</span>
                      <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
                        {formatRwf(grossRevenue)}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Repairs</span>
                      <span className="font-semibold font-mono text-rose-600 dark:text-rose-400 tabular-nums mt-0.5 block">
                        -{formatRwf(totalMaintCost)}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Fuel and trip pay</span>
                      <span className="font-semibold font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-0.5 block">
                        -{formatRwf(totalFuelExpenses)}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Profit</span>
                      <span
                        className={`font-semibold font-mono tabular-nums mt-0.5 block ${
                          netOperatingContribution >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatRwf(netOperatingContribution)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Car Papers */}
            <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">Car papers and safety dates</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Rwanda Police & Insurance</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Police safety check</span>
                  <span className={`text-xs ${expiryTextClass(formatExpiryStatus(selectedVehicleDetails.controle_technique_expiry).level)}`}>
                    {formatExpiryStatus(selectedVehicleDetails.controle_technique_expiry).text}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Car insurance</span>
                  <span className={`text-xs ${expiryTextClass(formatExpiryStatus(selectedVehicleDetails.insurance_expiry).level)}`}>
                    {formatExpiryStatus(selectedVehicleDetails.insurance_expiry).text}
                  </span>
                </div>
              </div>
            </div>

            {/* Garage History */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-white">Garage and repair notes</h4>
                <button
                  type="button"
                  onClick={() => {
                    setServiceOdometerInput(selectedVehicleDetails.current_odometer_km.toString());
                    setNextServiceKmInput(
                      ((selectedVehicleDetails.next_service_km || selectedVehicleDetails.current_odometer_km) + 5000).toString()
                    );
                    setIsServiceLogModalOpen(true);
                  }}
                  className="text-xs font-medium accent-text hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add garage note</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Last visit:{' '}
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatHumanDate(selectedVehicleDetails.last_service_date) || 'Recent'}
                  </strong>
                </span>
                <span className="font-mono">Next: {selectedVehicleDetails.next_service_km?.toLocaleString()} km</span>
              </div>
              <p className="text-slate-700 dark:text-slate-200 bg-slate-50/90 dark:bg-slate-800/40 p-3 rounded-lg text-sm">
                "{selectedVehicleDetails.last_service_notes || 'Oil, filters, brakes, and tires checked and working well.'}"
              </p>
            </div>

            {/* Past & Coming Trips */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-white">Past and coming trips</h4>
                <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Total earned:{' '}
                  {formatRwf(
                    bookings
                      .filter((b) => b.vehicle_id === selectedVehicleDetails.id && b.status !== 'Cancelled')
                      .reduce((sum, b) => sum + b.total_rwf, 0)
                  )}
                </span>
              </div>

              {bookings.filter((b) => b.vehicle_id === selectedVehicleDetails.id).length === 0 ? (
                <div className="p-5 text-center text-slate-500 dark:text-slate-400 bg-slate-50/90 dark:bg-slate-800/40 rounded-lg text-sm">
                  No trips recorded for this car yet.
                </div>
              ) : (
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {bookings
                    .filter((b) => b.vehicle_id === selectedVehicleDetails.id)
                    .map((bk) => (
                      <div key={bk.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">#{bk.id}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{bk.client_name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">· {bk.status}</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatHumanDateRange(bk.start_date, bk.end_date)} · {bk.destination}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-semibold text-slate-900 dark:text-white block tabular-nums">
                            {formatRwf(bk.total_rwf)}
                          </span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">{bk.payment_status}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onDeleteVehicle) {
                    onDeleteVehicle(selectedVehicleDetails.id);
                    setSelectedVehicleDetails(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove car</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMaintenanceModalVehicle(selectedVehicleDetails)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {selectedVehicleDetails.status === 'Maintenance' ? 'Mark ready now' : 'Send to garage'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenBookingForVehicle(selectedVehicleDetails.id);
                    setSelectedVehicleDetails(null);
                  }}
                  disabled={selectedVehicleDetails.status === 'Maintenance'}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    selectedVehicleDetails.status === 'Maintenance'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'accent-bg hover:opacity-95'
                  }`}
                >
                  + Book this car
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Car Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl kf-modal max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {tr('Edit Car Details & Photos')} ({editingVehicle.plate_number})
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {tr('Updates show immediately on your customer booking website.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVehicle} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  {tr('Car Model & Name')}
                </label>
                <input
                  type="text"
                  required
                  value={editingVehicle.model_name}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, model_name: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Number Plate')}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.plate_number}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, plate_number: e.target.value.toUpperCase() })}
                    className={`${inputCls} font-mono font-semibold`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Car Type')}
                  </label>
                  <select
                    value={editingVehicle.category}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, category: e.target.value as VehicleCategory })}
                    className={selectCls}
                  >
                    <option value="LandCruiser">LandCruiser (4x4)</option>
                    <option value="RAV4">RAV4 (AWD)</option>
                    <option value="Coaster">Coaster Bus (30-Seat)</option>
                    <option value="Safari Van">Safari Van</option>
                    <option value="Luxury Sedan">Luxury Sedan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Year')}</label>
                  <input
                    type="number"
                    min="2005"
                    max="2028"
                    value={editingVehicle.year || 2023}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, year: Number(e.target.value) })}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Price per Day (RWF)')}
                  </label>
                  <input
                    type="number"
                    step="5000"
                    required
                    value={editingVehicle.daily_rate_rwf}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, daily_rate_rwf: Number(e.target.value) })}
                    className={`${inputCls} font-mono`}
                  />
                  {currency === 'USD' && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 block">
                      ≈ {formatMoney(Number(editingVehicle.daily_rate_rwf) || 0)}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Car Status')}</label>
                  <select
                    value={editingVehicle.status}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, status: e.target.value as VehicleStatus })}
                    className={selectCls}
                  >
                    <option value="Available">{tr('Available')}</option>
                    <option value="Booked">{tr('Booked')}</option>
                    <option value="Maintenance">{tr('In Garage')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Seats')}</label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={editingVehicle.seating_capacity}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, seating_capacity: Number(e.target.value) })}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Gearbox')}</label>
                  <select
                    value={editingVehicle.transmission}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, transmission: e.target.value as 'Automatic' | 'Manual' })}
                    className={selectCls}
                  >
                    <option value="Automatic">{tr('Automatic')}</option>
                    <option value="Manual">{tr('Manual')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Fuel')}</label>
                  <select
                    value={editingVehicle.fuel_type}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, fuel_type: e.target.value as 'Diesel' | 'Petrol' })}
                    className={selectCls}
                  >
                    <option value="Diesel">{tr('Diesel')}</option>
                    <option value="Petrol">{tr('Petrol')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Distance Driven (km)')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingVehicle.current_odometer_km}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, current_odometer_km: Number(e.target.value) })}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Main Driver')}</label>
                  <select
                    value={editingVehicle.assigned_driver_id || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, assigned_driver_id: e.target.value })}
                    className={selectCls}
                  >
                    <option value="">{tr('Any Driver')}</option>
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Where Parked')}</label>
                  <input
                    type="text"
                    value={editingVehicle.location}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, location: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Police Car Check End Date')}
                  </label>
                  <input
                    type="date"
                    value={editingVehicle.controle_technique_expiry || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, controle_technique_expiry: e.target.value })}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Insurance End Date')}
                  </label>
                  <input
                    type="date"
                    value={editingVehicle.insurance_expiry || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, insurance_expiry: e.target.value })}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  {tr('About This Car (Shown to Customers)')}
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  placeholder={tr('Tell customers about luggage room, comfort, AC, safari suitability, or airport pickup...')}
                  value={editingVehicle.description || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {tr('Car Features (Tap to Select)')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VEHICLE_FEATURE_OPTIONS.map((feat) => {
                    const active = (editingVehicle.features || []).includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => toggleEditFeature(feat)}
                        className={`px-3 py-2 rounded-lg border text-xs text-left flex items-center gap-2 transition-colors ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 shrink-0 ${active ? 'opacity-100' : 'opacity-25'}`} />
                        <span>{tr(feat)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <VehiclePhotoManager
                category={editingVehicle.category}
                photos={
                  editingVehicle.gallery_urls && editingVehicle.gallery_urls.length > 0
                    ? editingVehicle.gallery_urls
                    : getVehicleGalleryImages(editingVehicle)
                }
                onChange={(nextPhotos) =>
                  setEditingVehicle({
                    ...editingVehicle,
                    image_url: nextPhotos[0],
                    gallery_urls: nextPhotos,
                  })
                }
                accentColor={activeColor}
                companyId={companyId}
                vehicleId={editingVehicle.id}
                useCloudStorage={!isDemoMode}
              />

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {tr('Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-medium accent-bg hover:opacity-95"
                >
                  {tr('Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Add Garage Note Modal */}
      {isServiceLogModalOpen && selectedVehicleDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl kf-modal max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add garage note</h3>
              <button
                type="button"
                onClick={() => setIsServiceLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogService} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Distance now (km)</label>
                  <input
                    type="number"
                    required
                    value={serviceOdometerInput}
                    onChange={(e) => setServiceOdometerInput(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Next checkup (km)</label>
                  <input
                    type="number"
                    required
                    value={nextServiceKmInput}
                    onChange={(e) => setNextServiceKmInput(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">What was fixed</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Changed engine oil, oil filter, and front brakes."
                  value={serviceNotesInput}
                  onChange={(e) => setServiceNotesInput(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServiceLogModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-medium rounded-lg accent-bg hover:opacity-95">
                  Save note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Garage Confirmation Modal */}
      {maintenanceModalVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl kf-modal max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {maintenanceModalVehicle.status === 'Maintenance'
                    ? 'Bring car back from garage'
                    : 'Send car to garage'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceModalVehicle(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Car: <strong className="font-semibold text-slate-900 dark:text-white">{maintenanceModalVehicle.model_name}</strong>{' '}
              (<span className="font-mono">{maintenanceModalVehicle.plate_number}</span>)
            </p>

            {maintenanceModalVehicle.status !== 'Maintenance' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Why is it going to the garage?
                  </label>
                  <input
                    type="text"
                    value={maintenanceReason}
                    onChange={(e) => setMaintenanceReason(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold">Double-booking lock:</strong> This car will be blocked on the
                    calendar so nobody can book it while in repair.
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                This car will show as Ready so clients can book it again.
              </p>
            )}

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMaintenanceModalVehicle(null)}
                className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMaintenance}
                className="px-5 py-2 text-sm font-medium rounded-lg accent-bg hover:opacity-95"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Add New Car Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl kf-modal max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {tr('Add New Car')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {tr('Add car details & photos for your booking website')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  {tr('Car Model & Name')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Land Cruiser Prado TXL (2024)"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Number Plate')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="RAD 450 B"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className={`${inputCls} font-mono font-semibold`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Car Type')}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                    className={selectCls}
                  >
                    <option value="LandCruiser">LandCruiser (4x4)</option>
                    <option value="RAV4">RAV4 (AWD)</option>
                    <option value="Coaster">Coaster Bus (30-Seat)</option>
                    <option value="Safari Van">Safari Van</option>
                    <option value="Luxury Sedan">Luxury Sedan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Year')}</label>
                  <input
                    type="number"
                    min="2005"
                    max="2028"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Price per Day (RWF)')}
                  </label>
                  <input
                    type="number"
                    required
                    step="5000"
                    placeholder="180000"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Seats')}</label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={seating}
                    onChange={(e) => setSeating(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Distance Driven (km)')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Gearbox')}</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as 'Automatic' | 'Manual')}
                    className={selectCls}
                  >
                    <option value="Automatic">{tr('Automatic')}</option>
                    <option value="Manual">{tr('Manual')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Fuel')}</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as 'Diesel' | 'Petrol')}
                    className={selectCls}
                  >
                    <option value="Diesel">{tr('Diesel')}</option>
                    <option value="Petrol">{tr('Petrol')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{tr('Main Driver')}</label>
                  <select
                    value={assignedDriverId}
                    onChange={(e) => setAssignedDriverId(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{tr('Any Driver')}</option>
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Where Parked in Kigali')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Kigali Office - Remera"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Police Car Check End Date')}
                  </label>
                  <input
                    type="date"
                    value={controleTechniqueExpiry}
                    onChange={(e) => setControleTechniqueExpiry(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {tr('Insurance End Date')}
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  {tr('About This Car (Shown to Customers)')}
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  placeholder={tr('Tell customers about luggage room, comfort, AC, safari suitability, or airport pickup...')}
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {tr('Car Features (Tap to Select)')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VEHICLE_FEATURE_OPTIONS.map((feat) => {
                    const active = addFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => toggleAddFeature(feat)}
                        className={`px-3 py-2 rounded-lg border text-xs text-left flex items-center gap-2 transition-colors ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 shrink-0 ${active ? 'opacity-100' : 'opacity-25'}`} />
                        <span>{tr(feat)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <VehiclePhotoManager
                category={category}
                photos={addGalleryUrls}
                onChange={setAddGalleryUrls}
                accentColor={activeColor}
                companyId={companyId}
                useCloudStorage={!isDemoMode}
              />

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {tr('Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-medium accent-bg hover:opacity-95"
                >
                  {tr('Save Car')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
