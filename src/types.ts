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
  year?: number;
  assigned_driver_id?: string;
  assigned_driver_name?: string;
  insurance_expiry?: string; // Yellow Card Rwanda expiry (YYYY-MM-DD)
  controle_technique_expiry?: string; // RNP Contrôle Technique (YYYY-MM-DD)
  last_service_date?: string;
  last_service_notes?: string;
  next_service_km?: number;
}

export type MaintenanceStatus = 'In Garage' | 'Scheduled' | 'Completed' | 'Awaiting Parts';

export type ServiceType =
  | 'Oil & Filter Change'
  | 'Brake System & Pads'
  | 'Tire Replacement (4x4)'
  | 'Safari Suspension Overhaul'
  | 'Contrôle Technique Prep'
  | 'Transmission & Gearbox'
  | 'AC & Electrical System'
  | 'General Inspection';

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_model: string;
  service_type: ServiceType;
  garage_name: string;
  garage_phone?: string;
  garage_location: string;
  description: string;
  start_date: string;
  expected_completion_date: string;
  actual_completion_date?: string;
  odometer_at_service_km: number;
  next_service_due_km: number;
  cost_rwf: number;
  status: MaintenanceStatus;
  invoice_ref?: string;
  technician_name?: string;
  parts_replaced?: string[];
  created_at: string;
}

export type DriverLanguage = 'EN' | 'RW' | 'FR' | 'EN/RW';

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'On Leave' | 'Rest Day';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  national_id?: string; // Rwanda National ID (Indangamuntu 16-digit)
  license_expiry?: string;
  experience_years?: number;
  emergency_phone?: string;
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

export type PaymentMethod =
  | 'MTN Mobile Money'
  | 'Airtel Money'
  | 'Bank Transfer'
  | 'Credit Card'
  | 'Cash on Delivery';

export type PaymentRecordStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue' | 'Refunded';

export interface PaymentRecord {
  id: string;
  booking_id: string;
  customer_name: string;
  customer_phone?: string;
  organization?: string;
  amount_rwf: number;
  expected_amount_rwf: number;
  payment_method: PaymentMethod;
  momo_tx_id?: string;
  ebm_receipt_number?: string;
  date: string;
  status: PaymentRecordStatus;
  notes?: string;
  created_at: string;
}

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

export type CustomerCategory =
  | 'Individual'
  | 'Tourist / Expat'
  | 'Corporate'
  | 'NGO / Diplomatic'
  | 'Travel Agency';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: CustomerCategory;
  organization?: string;
  tin_number?: string;
  address?: string;
  credit_terms?: 'Immediate MoMo' | 'Net-15' | 'Net-30' | 'Pre-paid 50%';
  discount_rate_pct?: number;
  total_spent_rwf: number;
  total_bookings_count: number;
  outstanding_balance_rwf: number;
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

export type UserRole = 'owner' | 'manager' | 'dispatcher' | 'driver' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  company_id: string;
  avatar_url?: string;
  driver_id?: string;
  status?: 'Active' | 'Invited' | 'Deactivated';
  created_at?: string;
}

export interface CompanySettings {
  turnaround_buffer_hours: number;
  maintenance_auto_lock: boolean;
  controle_technique_alert_days: number;
  max_driver_hours_per_day: number;
  sms_sender_id: string;
  sms_default_language: 'EN/RW' | 'EN' | 'RW' | 'FR';
  auto_flight_delay_alerts: boolean;
  customer_booking_sms: boolean;
  cancellation_refund_policy: 'Full Refund 24h' | '50% Retained' | 'Non-refundable within 48h';
  storefront_tagline?: string;
  storefront_instant_booking?: boolean;
  storefront_deposit_percent?: number;
  storefront_whatsapp?: string;
  storefront_published_vehicles?: string[];
}

export interface SupportTicket {
  id: string;
  ticket_ref: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_ref?: string;
  issue_category: string;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  created_at: string;
  response?: string;
}

export type CompanyStatus = 'Active' | 'Grace Period' | 'Suspended' | 'Pending Verification';

export interface Company {
  id: string;
  name: string;
  slug: string;
  business_type: 'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport';
  tin_number: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  currency: string;
  tier_id: 'starter' | 'growth' | 'enterprise';
  status?: CompanyStatus;
  renewal_date?: string;
  vehicle_count?: number;
  monthly_fee_rwf?: number;
  owner_name?: string;
  created_at: string;
}
