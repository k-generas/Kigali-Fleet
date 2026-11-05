import { Booking, Driver, Vehicle, VehicleCategory } from '../types';

/**
 * Checks whether two inclusive date strings (YYYY-MM-DD) overlap
 */
export function datesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA <= endB && endA >= startB;
}

export interface CollisionResult {
  hasCollision: boolean;
  conflictingBooking?: Booking;
  conflictReason?: string;
}

/**
 * Checks if a vehicle has any conflicting bookings in the given date range.
 * Collision-Guarded Booking Architecture: Verifies physical inventory and avoids double bookings.
 */
export function checkBookingCollision(
  vehicleId: string,
  startDate: string,
  endDate: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): CollisionResult {
  if (!vehicleId || !startDate || !endDate) {
    return { hasCollision: false };
  }

  if (startDate > endDate) {
    return {
      hasCollision: true,
      conflictReason: 'Pickup date cannot be after return date.',
    };
  }

  const conflicting = existingBookings.find((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.vehicle_id !== vehicleId) return false;
    if (b.status === 'Cancelled' || b.status === 'Completed') return false;

    return datesOverlap(startDate, endDate, b.start_date, b.end_date);
  });

  if (conflicting) {
    return {
      hasCollision: true,
      conflictingBooking: conflicting,
      conflictReason: `Vehicle is already booked by ${conflicting.client_name} from ${conflicting.start_date} to ${conflicting.end_date}.`,
    };
  }

  return { hasCollision: false };
}

/**
 * Checks if a driver has any conflicting bookings in the given date range.
 * Driver Coordination: Prevents assigning the same driver to two simultaneous trips.
 */
export function checkDriverCollision(
  driverId: string,
  startDate: string,
  endDate: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): { hasCollision: boolean; conflictingBooking?: Booking; conflictReason?: string } {
  if (!driverId || !startDate || !endDate) {
    return { hasCollision: false };
  }

  const conflicting = existingBookings.find((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.driver_id !== driverId) return false;
    if (b.status === 'Cancelled' || b.status === 'Completed') return false;

    return datesOverlap(startDate, endDate, b.start_date, b.end_date);
  });

  if (conflicting) {
    return {
      hasCollision: true,
      conflictingBooking: conflicting,
      conflictReason: `Driver is already scheduled with ${conflicting.client_name} from ${conflicting.start_date} to ${conflicting.end_date}.`,
    };
  }

  return { hasCollision: false };
}

export interface CategoryAvailability {
  category: VehicleCategory;
  totalInFleet: number;
  availableCount: number;
  availableVehicles: Vehicle[];
  hasInventory: boolean;
  lowestDailyRateRwf: number;
}

/**
 * Queries physical inventory for a specific category across date range.
 * Returns only physical vehicles with zero collisions and not in maintenance.
 */
export function getAvailableVehiclesForClass(
  category: VehicleCategory,
  startDate: string,
  endDate: string,
  vehicles: Vehicle[],
  existingBookings: Booking[]
): Vehicle[] {
  return vehicles.filter((v) => {
    if (v.category !== category) return false;
    if (v.status === 'Maintenance') return false;

    // Check collision against all existing active bookings
    const collision = checkBookingCollision(v.id, startDate, endDate, existingBookings);
    return !collision.hasCollision;
  });
}

/**
 * Summarizes availability across all vehicle classes for a requested date range.
 * Powers the public booking wizard and provides instant alternative recommendations.
 */
export function getCategoryAvailabilitySummary(
  startDate: string,
  endDate: string,
  vehicles: Vehicle[],
  existingBookings: Booking[]
): CategoryAvailability[] {
  const categories: VehicleCategory[] = ['LandCruiser', 'RAV4', 'Coaster', 'Safari Van', 'Luxury Sedan'];

  return categories.map((cat) => {
    const matchingVehicles = vehicles.filter((v) => v.category === cat && v.status !== 'Maintenance');
    const available = getAvailableVehiclesForClass(cat, startDate, endDate, vehicles, existingBookings);
    const rates = matchingVehicles.map((v) => v.daily_rate_rwf);
    const lowestRate = rates.length > 0 ? Math.min(...rates) : 0;

    return {
      category: cat,
      totalInFleet: matchingVehicles.length,
      availableCount: available.length,
      availableVehicles: available,
      hasInventory: available.length > 0,
      lowestDailyRateRwf: lowestRate,
    };
  });
}

/**
 * Calculates number of rental days between two YYYY-MM-DD dates (inclusive)
 */
export function calculateDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate || startDate > endDate) return 1;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start and end day
  return Math.max(1, diffDays);
}

/**
 * Formats Rwandan Franc amounts consistently with commas
 */
export function formatRwf(amount: number): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' RWF';
}

/**
 * Generates automated SMS dispatch notification for drivers via Africa's Talking API
 * Supports both Kinyarwanda and English per SaaS proposal
 */
export function generateDriverSMS({
  driver,
  vehicle,
  booking,
  language = 'RW',
}: {
  driver: Driver;
  vehicle: Vehicle;
  booking: Booking;
  language?: 'RW' | 'EN';
}): {
  recipientPhone: string;
  senderId: string;
  messageText: string;
  ussdPrompt: string;
} {
  const isKinyarwanda = language === 'RW' || (driver.language === 'RW' && language !== 'EN');

  let messageText = '';
  let ussdPrompt = '';

  if (isKinyarwanda) {
    messageText = `[KIGALI-FLEET] Muraho ${driver.name}, mwahawe urugendo rushya!
Umukiriya: ${booking.client_name}
Imodoka: ${vehicle.model_name} (${vehicle.plate_number})
Aho kujya: ${booking.destination}
${booking.flight_number ? `Indege: ${booking.flight_number} (${booking.flight_status || 'On Time'})` : ''}
Amatariki: ${booking.start_date} kugeza ${booking.end_date}
Kanda *134# kwemeza ko mwakiriye uru rugendo.`;

    ussdPrompt = `Kanda *134*${booking.id.slice(-4)}# kwemeza urugendo.`;
  } else {
    messageText = `[KIGALI-FLEET] Hello ${driver.name}, you have a confirmed dispatch!
Client: ${booking.client_name}
Vehicle: ${vehicle.model_name} (${vehicle.plate_number})
Destination: ${booking.destination}
${booking.flight_number ? `Flight: ${booking.flight_number} (${booking.flight_status || 'On Time'})` : ''}
Dates: ${booking.start_date} to ${booking.end_date}
Dial *134# or reply 'CONFIRM ${booking.id.slice(-4)}' to acknowledge.`;

    ussdPrompt = `Dial *134*${booking.id.slice(-4)}# to confirm receipt.`;
  }

  return {
    recipientPhone: driver.phone,
    senderId: 'KIGALIFLEET',
    messageText,
    ussdPrompt,
  };
}

/**
 * Generates automated flight delay alert SMS to chauffeur via Africa's Talking
 */
export function generateFlightDelaySMS({
  driver,
  booking,
  delayMinutes,
  language = 'RW',
}: {
  driver: Driver;
  booking: Booking;
  delayMinutes: number;
  language?: 'RW' | 'EN';
}): {
  recipientPhone: string;
  senderId: string;
  messageText: string;
} {
  const isKinyarwanda = language === 'RW' || (driver.language === 'RW' && language !== 'EN');

  let messageText = '';
  if (isKinyarwanda) {
    messageText = `[KIGALI-FLEET] AMAKURU MASHYA Y'INDEGE:
Indege ${booking.flight_number} y'umukiriya ${booking.client_name} yakerereweho iminota ${delayMinutes}.
Igihe cyo kugera kuri KIA cyahinduwe. Mutegereze amakuru mashya kuri *134#. Ntimujye ku kibuga mbere y'igihe.`;
  } else {
    messageText = `[KIGALI-FLEET] FLIGHT DELAY UPDATE:
Flight ${booking.flight_number} for client ${booking.client_name} is delayed by ${delayMinutes} mins at Kigali International Airport.
Terminal arrival window adjusted. Dial *134# for updated ETA. Do not dispatch early to terminal.`;
  }

  return {
    recipientPhone: driver.phone,
    senderId: 'KIGALIFLEET',
    messageText,
  };
}

