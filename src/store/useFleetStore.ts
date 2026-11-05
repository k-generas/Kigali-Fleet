import { useState, useEffect } from 'react';
import {
  Vehicle,
  Driver,
  Booking,
  ActivityLog,
  SubscriptionTier,
  BookingStatus,
  VehicleStatus,
  DriverStatus,
} from '../types';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_BOOKINGS,
  INITIAL_LOGS,
  SUBSCRIPTION_TIERS,
} from '../data/seedData';
import { checkBookingCollision, generateDriverSMS } from '../utils/collision';
import { getThemeById, applyThemeCssVariables } from '../theme';

const STORAGE_KEY_FLEET = 'kigalifleet_state_v1';

interface StoredState {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  logs: ActivityLog[];
  activeTierId: 'starter' | 'growth' | 'enterprise';
  theme: 'dark' | 'light';
  accentColorId: string;
}

function loadInitialState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FLEET);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.vehicles && parsed.drivers && parsed.bookings) {
        return {
          ...parsed,
          accentColorId: parsed.accentColorId || 'amber',
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse stored KigaliFleet state:', err);
  }
  return {
    vehicles: INITIAL_VEHICLES,
    drivers: INITIAL_DRIVERS,
    bookings: INITIAL_BOOKINGS,
    logs: INITIAL_LOGS,
    activeTierId: 'growth',
    theme: 'dark',
    accentColorId: 'amber',
  };
}

export function useFleetStore() {
  const [state, setState] = useState<StoredState>(() => loadInitialState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FLEET, JSON.stringify(state));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [state]);

  // Apply dark theme to html root and dynamic CSS custom properties for accent color
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const themeObj = getThemeById(state.accentColorId || 'amber');
    applyThemeCssVariables(themeObj);
  }, [state.theme, state.accentColorId]);

  const toggleTheme = () => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const setAccentColor = (themeId: string) => {
    setState((prev) => ({
      ...prev,
      accentColorId: themeId,
    }));
  };

  const addBooking = (
    newBooking: Omit<Booking, 'id' | 'created_at' | 'dispatch_status'>
  ): { success: boolean; error?: string; booking?: Booking } => {
    // 1. Collision Guard check
    const collision = checkBookingCollision(
      newBooking.vehicle_id,
      newBooking.start_date,
      newBooking.end_date,
      state.bookings
    );

    if (collision.hasCollision) {
      return {
        success: false,
        error: collision.conflictReason || 'Collision detected: Vehicle is already booked during these dates.',
      };
    }

    const createdBooking: Booking = {
      ...newBooking,
      id: `bk-${Date.now().toString().slice(-6)}`,
      dispatch_status: 'Not Sent',
      created_at: new Date().toISOString(),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Booking Created',
      details: `${createdBooking.client_name} reserved vehicle (${createdBooking.destination}) from ${createdBooking.start_date} to ${createdBooking.end_date}.`,
      category: 'booking',
    };

    setState((prev) => {
      // update vehicle status if starting today
      const today = new Date().toISOString().split('T')[0];
      const updatedVehicles = prev.vehicles.map((v) => {
        if (v.id === createdBooking.vehicle_id && createdBooking.start_date <= today && createdBooking.end_date >= today) {
          return { ...v, status: 'Booked' as VehicleStatus };
        }
        return v;
      });

      return {
        ...prev,
        bookings: [createdBooking, ...prev.bookings],
        vehicles: updatedVehicles,
        logs: [newLog, ...prev.logs].slice(0, 50),
      };
    });

    return { success: true, booking: createdBooking };
  };

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    setState((prev) => {
      const updatedBookings = prev.bookings.map((b) => (b.id === id ? { ...b, status } : b));
      return {
        ...prev,
        bookings: updatedBookings,
      };
    });
  };

  const dispatchDriverSMS = (bookingId: string, language: 'RW' | 'EN' = 'RW') => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return null;

    const driver = state.drivers.find((d) => d.id === booking.driver_id);
    const vehicle = state.vehicles.find((v) => v.id === booking.vehicle_id);

    if (!driver || !vehicle) return null;

    const smsData = generateDriverSMS({
      driver,
      vehicle,
      booking,
      language,
    });

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: `SMS Dispatched (${language === 'RW' ? 'Kinyarwanda' : 'English'})`,
      details: `Dispatched to ${driver.name} (${driver.phone}) for booking #${booking.id}.`,
      category: 'dispatch',
    };

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        b.id === bookingId ? { ...b, dispatch_status: 'Dispatched (SMS)' } : b
      ),
      logs: [newLog, ...prev.logs].slice(0, 50),
    }));

    return smsData;
  };

  const acknowledgeDriverCheckin = (
    bookingId: string,
    targetStage?: 'Acknowledged by Driver' | 'Driver at Terminal' | 'Client Onboard'
  ) => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const driver = state.drivers.find((d) => d.id === booking.driver_id);

    // Determine next check-in stage
    let nextStage = targetStage;
    if (!nextStage) {
      if (booking.dispatch_status === 'Not Sent' || booking.dispatch_status === 'Dispatched (SMS)') {
        nextStage = 'Acknowledged by Driver';
      } else if (booking.dispatch_status === 'Acknowledged by Driver') {
        nextStage = 'Driver at Terminal';
      } else {
        nextStage = 'Client Onboard';
      }
    }

    const actionDescription =
      nextStage === 'Acknowledged by Driver'
        ? 'USSD Itinerary Acknowledged (*134#)'
        : nextStage === 'Driver at Terminal'
        ? 'Chauffeur Arrived at KIA Terminal'
        : 'Passenger Picked Up & Onboard';

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: actionDescription,
      details: `${driver?.name || 'Chauffeur'} confirmed: "${actionDescription}" for Booking #${booking.id} (${booking.client_name}).`,
      category: 'driver',
    };

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              dispatch_status: nextStage!,
              status: nextStage === 'Client Onboard' ? 'In Progress' : b.status,
            }
          : b
      ),
      drivers: prev.drivers.map((d) =>
        d.id === booking.driver_id ? { ...d, status: 'On Trip' as DriverStatus } : d
      ),
      logs: [newLog, ...prev.logs].slice(0, 50),
    }));
  };

  const updateFlightStatus = (
    bookingId: string,
    flightStatus: 'On Time' | 'Delayed' | 'Landed' | 'Scheduled',
    delayMinutes: number = 45
  ) => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    const driver = booking ? state.drivers.find((d) => d.id === booking.driver_id) : null;

    let logMessage = `Flight for Booking #${bookingId} updated to ${flightStatus}.`;
    if (flightStatus === 'Delayed' && booking && driver) {
      logMessage = `FLIGHT DELAY DETECTED: ${booking.flight_number || 'Flight'} delayed by ${delayMinutes}m. Chauffeur ${driver.name} notified via Africa's Talking to adjust KIA pickup window.`;
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              flight_status: flightStatus,
              flight_delay_minutes: flightStatus === 'Delayed' ? delayMinutes : undefined,
            }
          : b
      ),
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: flightStatus === 'Delayed' ? 'Flight Delay Alert Dispatched' : 'Flight Status Updated',
          details: logMessage,
          category: 'booking',
        },
        ...prev.logs,
      ],
    }));
  };

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `veh-${Date.now().toString().slice(-5)}`,
    };

    setState((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle],
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'Vehicle Registered',
          details: `Registered ${newVehicle.model_name} (${newVehicle.plate_number}) at ${newVehicle.daily_rate_rwf.toLocaleString()} RWF/day.`,
          category: 'fleet',
        },
        ...prev.logs,
      ],
    }));
  };

  const updateVehicleRate = (id: string, newRateRwf: number) => {
    setState((prev) => {
      const target = prev.vehicles.find((v) => v.id === id);
      const oldRate = target?.daily_rate_rwf || 0;
      const updatedVehicles = prev.vehicles.map((v) =>
        v.id === id ? { ...v, daily_rate_rwf: Math.max(10000, newRateRwf) } : v
      );

      return {
        ...prev,
        vehicles: updatedVehicles,
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: 'Rate Adjusted',
            details: `Adjusted daily rate for ${target?.model_name || 'Vehicle'} from ${oldRate.toLocaleString()} RWF to ${newRateRwf.toLocaleString()} RWF.`,
            category: 'fleet',
          },
          ...prev.logs,
        ],
      };
    });
  };

  const toggleVehicleMaintenance = (id: string, notes?: string) => {
    setState((prev) => {
      const target = prev.vehicles.find((v) => v.id === id);
      const isCurrentlyMaintenance = target?.status === 'Maintenance';
      const newStatus: VehicleStatus = isCurrentlyMaintenance ? 'Available' : 'Maintenance';

      return {
        ...prev,
        vehicles: prev.vehicles.map((v) =>
          v.id === id ? { ...v, status: newStatus } : v
        ),
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: isCurrentlyMaintenance ? 'Vehicle Cleared from Service' : 'Vehicle Sent to Maintenance',
            details: `${target?.model_name} (${target?.plate_number}) ${isCurrentlyMaintenance ? 'cleared for customer rental' : `grounded for workshop service${notes ? ` (${notes})` : ''}`}.`,
            category: 'fleet',
          },
          ...prev.logs,
        ],
      };
    });
  };

  const assignDriverToBooking = (
    bookingId: string,
    driverId: string
  ): { success: boolean; error?: string } => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const driver = state.drivers.find((d) => d.id === driverId);
    if (!driver) return { success: false, error: 'Driver not found.' };

    // Check if driver has an existing overlapping trip
    const driverConflict = state.bookings.find(
      (b) =>
        b.id !== bookingId &&
        b.driver_id === driverId &&
        b.status !== 'Cancelled' &&
        b.status !== 'Completed' &&
        booking.start_date <= b.end_date &&
        booking.end_date >= b.start_date
    );

    if (driverConflict) {
      return {
        success: false,
        error: `Driver ${driver.name} is already booked on Booking #${driverConflict.id} (${driverConflict.client_name}) from ${driverConflict.start_date} to ${driverConflict.end_date}.`,
      };
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === bookingId ? { ...b, driver_id: driverId } : b)),
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'Driver Assigned',
          details: `Linked ${driver.name} to booking #${booking.id} (${booking.client_name}).`,
          category: 'driver',
        },
        ...prev.logs,
      ],
    }));

    return { success: true };
  };

  const updateVehicleStatus = (id: string, status: VehicleStatus) => {
    setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.id === id ? { ...v, status } : v)),
    }));
  };

  const addDriver = (driver: Omit<Driver, 'id' | 'trips_completed' | 'rating'>) => {
    const newDriver: Driver = {
      ...driver,
      id: `drv-${Date.now().toString().slice(-5)}`,
      trips_completed: 0,
      rating: 5.0,
    };

    setState((prev) => ({
      ...prev,
      drivers: [...prev.drivers, newDriver],
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'Driver Onboarded',
          details: `Onboarded ${newDriver.name} (${newDriver.language}).`,
          category: 'driver',
        },
        ...prev.logs,
      ],
    }));
  };

  const updateDriverStatus = (id: string, status: DriverStatus) => {
    setState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((d) => (d.id === id ? { ...d, status } : d)),
    }));
  };

  const setTier = (tierId: 'starter' | 'growth' | 'enterprise') => {
    setState((prev) => ({
      ...prev,
      activeTierId: tierId,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'Subscription Updated',
          details: `Agency subscription updated to ${tierId.toUpperCase()}.`,
          category: 'fleet',
        },
        ...prev.logs,
      ],
    }));
  };

  const resetToDefaults = () => {
    const defaultState: StoredState = {
      vehicles: INITIAL_VEHICLES,
      drivers: INITIAL_DRIVERS,
      bookings: INITIAL_BOOKINGS,
      logs: INITIAL_LOGS,
      activeTierId: 'growth',
      theme: state.theme,
      accentColorId: state.accentColorId || 'amber',
    };
    setState(defaultState);
    try {
      localStorage.setItem(STORAGE_KEY_FLEET, JSON.stringify(defaultState));
    } catch (e) {
      console.warn(e);
    }
  };

  const currentTheme = getThemeById(state.accentColorId || 'amber');

  return {
    state,
    vehicles: state.vehicles,
    drivers: state.drivers,
    bookings: state.bookings,
    logs: state.logs,
    activeTier: SUBSCRIPTION_TIERS.find((t) => t.id === state.activeTierId) || SUBSCRIPTION_TIERS[1],
    tiers: SUBSCRIPTION_TIERS,
    theme: state.theme,
    toggleTheme,
    accentColorId: state.accentColorId || 'amber',
    currentTheme,
    setAccentColor,
    addBooking,
    updateBookingStatus,
    dispatchDriverSMS,
    acknowledgeDriverCheckin,
    updateFlightStatus,
    addVehicle,
    updateVehicleStatus,
    updateVehicleRate,
    toggleVehicleMaintenance,
    addDriver,
    updateDriverStatus,
    assignDriverToBooking,
    setTier,
    resetToDefaults,
  };
}
