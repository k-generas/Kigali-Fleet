import React, { useState } from 'react';
import { Vehicle, VehicleCategory, VehicleStatus, Booking } from '../types';
import { formatRwf, datesOverlap } from '../utils/collision';
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
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  bookings: Booking[];
  currentTheme?: ColorTheme;
  onAddVehicle: (v: Omit<Vehicle, 'id'>) => void;
  onUpdateStatus: (id: string, status: VehicleStatus) => void;
  onUpdateRate: (id: string, newRateRwf: number) => void;
  onToggleMaintenance: (id: string, notes?: string) => void;
  onOpenBookingForVehicle: (vehicleId: string) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  bookings,
  currentTheme,
  onAddVehicle,
  onUpdateStatus,
  onUpdateRate,
  onToggleMaintenance,
  onOpenBookingForVehicle,
}) => {
  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRateVehicleId, setEditingRateVehicleId] = useState<string | null>(null);
  const [newRateInput, setNewRateInput] = useState<string>('');

  // Maintenance prompt state
  const [maintenanceModalVehicle, setMaintenanceModalVehicle] = useState<Vehicle | null>(null);
  const [maintenanceReason, setMaintenanceReason] = useState<string>('Routine 50,000 km oil & brake service');

  // Add vehicle form state
  const [modelName, setModelName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('LandCruiser');
  const [dailyRate, setDailyRate] = useState('180000');
  const [seating, setSeating] = useState('7');
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>('Automatic');
  const [fuelType, setFuelType] = useState<'Diesel' | 'Petrol'>('Diesel');
  const [location, setLocation] = useState('Kigali HQ - Remera');

  const filteredVehicles = vehicles.filter((v) => {
    if (selectedCategory !== 'All' && v.category !== selectedCategory) return false;
    return true;
  });

  const categories = ['All', 'LandCruiser', 'RAV4', 'Coaster', 'Safari Van', 'Luxury Sedan'];

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
    }
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName || !plateNumber) return;

    onAddVehicle({
      model_name: modelName,
      plate_number: plateNumber.toUpperCase(),
      category,
      daily_rate_rwf: Number(dailyRate) || 100000,
      status: 'Available',
      seating_capacity: Number(seating) || 5,
      transmission,
      fuel_type: fuelType,
      current_odometer_km: 35000,
      location,
    });

    setModelName('');
    setPlateNumber('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Fleet Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="w-5 h-5" style={{ color: activeThemeColor }} />
              <span>Kigali Fleet Management & Rates Control</span>
            </h2>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
              style={{
                backgroundColor: `${activeThemeColor}20`,
                color: activeThemeColor,
              }}
            >
              {vehicles.length} VEHICLES
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Register cars, update daily rates in RWF, and manage maintenance status.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shadow-sm self-start sm:self-auto active:scale-95 ${activeBtnText}`}
          style={{ backgroundColor: activeThemeColor }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Register New Vehicle</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? `${activeBtnText} shadow-sm font-bold`
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              style={isSelected ? { backgroundColor: activeThemeColor } : undefined}
            >
              {cat} {cat === 'All' ? `(${vehicles.length})` : ''}
            </button>
          );
        })}
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => {
          const badge = getCategoryBadge(vehicle.category);
          const IconComp = badge.icon;
          const isMaintenance = vehicle.status === 'Maintenance';
          const isBooked = vehicle.status === 'Booked';

          // Check if vehicle has active bookings
          const vehicleBookings = bookings.filter(
            (b) => b.vehicle_id === vehicle.id && b.status !== 'Cancelled'
          );

          return (
            <div
              key={vehicle.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 space-y-4 transition-all relative ${
                isMaintenance
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Category and Status Header */}
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${badge.badgeClass}`}>
                  <IconComp className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>

                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                      vehicle.status === 'Available'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                        : vehicle.status === 'Booked'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60'
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </div>
              </div>

              {/* Title & Plate */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {vehicle.model_name}
                </h3>
                <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5 tracking-wide">
                  {vehicle.plate_number}
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

              {/* Vehicle Specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
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
                  <span className="font-mono">{vehicle.current_odometer_km.toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{vehicle.location}</span>
                </div>
              </div>

              {/* Operator Action Bar: Maintenance Toggle & Quick Schedule */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setMaintenanceModalVehicle(vehicle)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                    isMaintenance
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                  }`}
                  title={isMaintenance ? 'Clear vehicle back to Available status' : 'Ground car for maintenance'}
                >
                  <Wrench className="w-3 h-3" />
                  <span>{isMaintenance ? 'Clear Service' : 'Set Maintenance'}</span>
                </button>

                <button
                  onClick={() => onOpenBookingForVehicle(vehicle.id)}
                  disabled={isMaintenance}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    isMaintenance
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  + Book
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Maintenance Confirmation Modal */}
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
              <span className="font-mono text-amber-500">{maintenanceModalVehicle.plate_number}</span>)
            </p>

            {maintenanceModalVehicle.status !== 'Maintenance' ? (
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

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Register New Fleet Vehicle</h3>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Rwanda Plate Number
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
                <div>
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
