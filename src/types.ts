export type VehicleCategory = 'RAV4' | 'LandCruiser' | 'Coaster' | 'Safari Van' | 'Luxury Sedan';

export type VehicleStatus = 'Available' | 'Booked' | 'Maintenance';

export interface Vehicle {
  id: string;
  category: VehicleCategory;
  model_name: string;
  plate_number: string;
  daily_rate_rwf: number;
  status: VehicleStatus;
  transmission: 'Automatic' | 'Manual';
  fuel_type: 'Diesel' | 'Petrol';
  seating_capacity: number;
  current_odometer_km: number;
  location: string;
  image_url?: string;
}

export type DriverLanguage = 'EN' | 'RW' | 'FR' | 'EN/RW';

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  language: DriverLanguage;
  status: DriverStatus;
  license_number: string;
  trips_completed: number;
  rating: number;
  assigned_vehicle_id?: string;
  notes: string;
}

export type BookingStatus = 'Confirmed' | 'Pending Dispatch' | 'In Progress' | 'Completed' | 'Cancelled';

export type DispatchStatus =
  | 'Not Sent'
  | 'Dispatched (SMS)'
  | 'Acknowledged by Driver'
  | 'Driver at Terminal'
  | 'Client Onboard';

export type PaymentStatus = 'Deposit Paid (MoMo)' | 'Fully Paid' | 'Pending Payment';

export interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  vehicle_id: string;
  driver_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  total_rwf: number;
  flight_number?: string;
  flight_status?: 'On Time' | 'Delayed' | 'Landed' | 'Scheduled';
  flight_delay_minutes?: number;
  flight_origin?: string;
  destination: string;
  status: BookingStatus;
  dispatch_status: DispatchStatus;
  payment_status: PaymentStatus;
  payment_method: 'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Credit Card';
  notes?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  category: 'booking' | 'dispatch' | 'fleet' | 'driver';
}

export interface SubscriptionTier {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  target_fleet_size: string;
  max_vehicles: number;
  monthly_fee_rwf: number;
  features: string[];
}
