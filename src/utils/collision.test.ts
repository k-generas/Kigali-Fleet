import test from 'node:test';
import assert from 'node:assert/strict';
import {
  datesOverlap,
  checkBookingCollision,
  calculateDays,
  formatRwf,
  generateDriverSMS,
  generateFlightDelaySMS,
  checkDriverCollision,
  getAvailableVehiclesForClass,
  getCategoryAvailabilitySummary,
} from './collision';
import { Booking, Driver, Vehicle } from '../types';

const mockBookings: Booking[] = [
  {
    id: 'b-101',
    client_name: 'Dr. Sarah Jenkins (UNHCR)',
    client_email: 'sarah.j@unhcr.org',
    client_phone: '+250 788 123 456',
    vehicle_id: 'veh-landcruiser-01',
    driver_id: 'drv-jean-paul',
    start_date: '2026-11-05',
    end_date: '2026-11-08',
    total_rwf: 720000,
    flight_number: 'WB 402',
    destination: 'Musanze (Volcanoes NP)',
    status: 'Confirmed',
    dispatch_status: 'Dispatched (SMS)',
    payment_status: 'Deposit Paid (MoMo)',
    payment_method: 'MTN Mobile Money',
    created_at: '2026-11-01T08:00:00Z',
  },
];

const mockVehicle: Vehicle = {
  id: 'veh-landcruiser-01',
  category: 'LandCruiser',
  model_name: 'Toyota Land Cruiser Prado TXL',
  plate_number: 'RAD 450 B',
  daily_rate_rwf: 180000,
  status: 'Booked',
  transmission: 'Automatic',
  fuel_type: 'Diesel',
  seating_capacity: 7,
  current_odometer_km: 64200,
  location: 'Kigali HQ - Remera',
};

const mockDriver: Driver = {
  id: 'drv-jean-paul',
  name: 'Jean-Paul Mugisha',
  phone: '+250 788 555 123',
  language: 'EN/RW',
  status: 'Available',
  license_number: 'DL-RWA-9921',
  trips_completed: 142,
  rating: 4.95,
  notes: 'Airport VIP & Volcanoes trails expert',
};

test('datesOverlap detects overlapping intervals correctly', () => {
  assert.equal(datesOverlap('2026-11-05', '2026-11-08', '2026-11-07', '2026-11-10'), true);
  assert.equal(datesOverlap('2026-11-05', '2026-11-08', '2026-11-01', '2026-11-04'), false);
  assert.equal(datesOverlap('2026-11-05', '2026-11-08', '2026-11-08', '2026-11-12'), true); // inclusive boundary
});

test('checkBookingCollision prevents double-booking the same Land Cruiser', () => {
  // Overlapping booking
  const collision = checkBookingCollision(
    'veh-landcruiser-01',
    '2026-11-07',
    '2026-11-10',
    mockBookings
  );
  assert.equal(collision.hasCollision, true);
  assert.match(collision.conflictReason || '', /already booked by Dr. Sarah Jenkins/);

  // Non-overlapping dates
  const noCollision = checkBookingCollision(
    'veh-landcruiser-01',
    '2026-11-10',
    '2026-11-14',
    mockBookings
  );
  assert.equal(noCollision.hasCollision, false);

  // Different vehicle ID with same dates
  const differentVeh = checkBookingCollision(
    'veh-rav4-02',
    '2026-11-05',
    '2026-11-08',
    mockBookings
  );
  assert.equal(differentVeh.hasCollision, false);
});

test('calculateDays computes inclusive rental duration', () => {
  assert.equal(calculateDays('2026-11-01', '2026-11-01'), 1);
  assert.equal(calculateDays('2026-11-01', '2026-11-04'), 4);
});

test('formatRwf formats Rwandan Franc currency with commas', () => {
  assert.equal(formatRwf(180000), '180,000 RWF');
  assert.equal(formatRwf(35000), '35,000 RWF');
});

test('generateDriverSMS creates localized Africa\'s Talking dispatch text', () => {
  const rwSMS = generateDriverSMS({
    driver: mockDriver,
    vehicle: mockVehicle,
    booking: mockBookings[0],
    language: 'RW',
  });
  assert.match(rwSMS.messageText, /Muraho Jean-Paul/);
  assert.match(rwSMS.messageText, /RAD 450 B/);
  assert.match(rwSMS.messageText, /Musanze/);
  assert.match(rwSMS.messageText, /\*134#/);

  const enSMS = generateDriverSMS({
    driver: mockDriver,
    vehicle: mockVehicle,
    booking: mockBookings[0],
    language: 'EN',
  });
  assert.match(enSMS.messageText, /Hello Jean-Paul/);
  assert.match(enSMS.messageText, /confirmed dispatch/);
  assert.match(enSMS.messageText, /RAD 450 B/);
});

test('checkDriverCollision prevents double-booking a chauffeur for overlapping trips', () => {
  const collision = checkDriverCollision(
    'drv-jean-paul',
    '2026-11-06',
    '2026-11-09',
    mockBookings
  );
  // drv-jean-paul is assigned to mockBookings[0] (2026-11-05 to 2026-11-08)
  assert.equal(collision.hasCollision, true);
  assert.match(collision.conflictReason || '', /already scheduled with Dr. Sarah Jenkins/);

  // Different driver or non-overlapping dates
  const freeDriver = checkDriverCollision(
    'drv-claudine',
    '2026-11-06',
    '2026-11-09',
    mockBookings
  );
  assert.equal(freeDriver.hasCollision, false);
});

test('getAvailableVehiclesForClass and getCategoryAvailabilitySummary filter colliding cars', () => {
  const testVehicles: Vehicle[] = [
    mockVehicle, // LandCruiser 'veh-landcruiser-01' booked 2026-11-05 to 2026-11-08 in mockBookings
    {
      id: 'veh-landcruiser-02',
      category: 'LandCruiser',
      model_name: 'Toyota Land Cruiser V8 VIP',
      plate_number: 'RAE 109 M',
      daily_rate_rwf: 220000,
      status: 'Available',
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      seating_capacity: 7,
      current_odometer_km: 41200,
      location: 'Kigali Marriott Hub',
    },
    {
      id: 'veh-rav4-01',
      category: 'RAV4',
      model_name: 'Toyota RAV4 AWD',
      plate_number: 'RAC 812 K',
      daily_rate_rwf: 65000,
      status: 'Available',
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      seating_capacity: 5,
      current_odometer_km: 52180,
      location: 'Kigali Airport Station',
    },
  ];

  // Request dates: 2026-11-06 to 2026-11-07 (overlaps with mockVehicle)
  const availableLC = getAvailableVehiclesForClass(
    'LandCruiser',
    '2026-11-06',
    '2026-11-07',
    testVehicles,
    mockBookings
  );

  // veh-landcruiser-01 should be filtered out, leaving only veh-landcruiser-02
  assert.equal(availableLC.length, 1);
  assert.equal(availableLC[0].id, 'veh-landcruiser-02');

  const summary = getCategoryAvailabilitySummary(
    '2026-11-06',
    '2026-11-07',
    testVehicles,
    mockBookings
  );
  const lcSummary = summary.find((s) => s.category === 'LandCruiser');
  assert.equal(lcSummary?.totalInFleet, 2);
  assert.equal(lcSummary?.availableCount, 1);
  assert.equal(lcSummary?.hasInventory, true);
});

test('generateFlightDelaySMS creates delay notification in Kinyarwanda and English', () => {
  const rwDelay = generateFlightDelaySMS({
    driver: mockDriver,
    booking: mockBookings[0],
    delayMinutes: 45,
    language: 'RW',
  });
  assert.match(rwDelay.messageText, /AMAKURU MASHYA Y'INDEGE/);
  assert.match(rwDelay.messageText, /yakerereweho iminota 45/);
  assert.match(rwDelay.messageText, /WB 402/);

  const enDelay = generateFlightDelaySMS({
    driver: mockDriver,
    booking: mockBookings[0],
    delayMinutes: 30,
    language: 'EN',
  });
  assert.match(enDelay.messageText, /FLIGHT DELAY UPDATE/);
  assert.match(enDelay.messageText, /delayed by 30 mins/);
  assert.match(enDelay.messageText, /Kigali International Airport/);
});



