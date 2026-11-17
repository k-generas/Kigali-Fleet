export type VehicleCategory = 'RAV4' | 'LandCruiser' | 'Coaster' | 'Safari Van' | 'Luxury Sedan';

export type VehicleStatus = 'Available' | 'Booked' | 'Maintenance';

export interface Vehicle {
  id: string;
  company_id?: string;
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
  gallery_urls?: string[]; // Additional / ordered car photos (max 6)
  description?: string; // Customer-facing description written by car owner
  features?: string[]; // Key highlights (4WD, AC, Wi-Fi, Pop-up Roof, etc.)
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
  company_id?: string;
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
  company_id?: string;
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
  company_id?: string;
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
  company_id?: string;
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
  source?: 'Storefront' | 'Phone Call' | 'WhatsApp' | 'Walk-in' | 'Corporate RFP';
  handover_pickup_id?: string;
  handover_return_id?: string;
  created_at: string;
}

export type InspectionType = 'pickup' | 'return';
export type VehicleCleanliness = 'Clean' | 'Moderate' | 'Dirty';

export interface VehicleHandoverInspection {
  id: string;
  company_id?: string;
  booking_id: string;
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_model: string;
  client_name: string;
  client_phone: string;
  inspection_type: InspectionType;
  odometer_km: number;
  fuel_level_eighths: number; // 1 to 8 (e.g., 8 = 100% full, 4 = 1/2)
  cleanliness: VehicleCleanliness;
  condition_checklist: {
    body_scratches_dents: boolean;
    windshield_windows: boolean;
    headlights_taillights: boolean;
    tires_wheels: boolean;
    spare_tire_jack: boolean;
    ac_climate_control: boolean;
    triangle_fire_extinguisher: boolean;
    interior_clean: boolean;
    documents_in_glovebox: boolean;
  };
  damage_notes?: string;
  inspector_name: string;
  client_signature_confirmed: boolean;
  additional_charges_rwf?: number;
  additional_charges_reason?: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'Fuel & Gas'
  | 'Routine Service'
  | 'Repairs & Parts'
  | 'Insurance (Yellow Card)'
  | 'Contrôle Technique Prep'
  | 'Driver Per-Diem'
  | 'Parking & Airport Fees'
  | 'Vehicle Wash & Detail'
  | 'Office & Admin'
  | 'Taxes & Licenses'
  | 'Other';

export type ExpenseStatus = 'Pending' | 'Approved' | 'Paid' | 'Rejected';

export interface ExpenseRecord {
  id: string;
  company_id?: string;
  title: string;
  category: ExpenseCategory;
  amount_rwf: number;
  date: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  booking_id?: string;
  supplier_name?: string;
  description?: string;
  status: ExpenseStatus;
  recorded_by: string;
  approved_by?: string;
  receipt_ref?: string;
  created_at: string;
}

export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type TaskStatus = 'Open' | 'In Progress' | 'Completed' | 'Cancelled';

export interface OperationalTask {
  id: string;
  company_id?: string;
  title: string;
  description?: string;
  assigned_to_name: string;
  assigned_to_role?: UserRole;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  related_vehicle_id?: string;
  related_booking_id?: string;
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
  company_id?: string;
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
  company_id?: string;
  timestamp: string;
  action: string;
  details: string;
  category: 'booking' | 'dispatch' | 'fleet' | 'driver' | 'handover' | 'expense';
}

export interface SubscriptionTier {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  target_fleet_size: string;
  max_vehicles: number;
  monthly_fee_rwf: number;
  features: string[];
}

export type UserRole =
  | 'owner'
  | 'manager'
  | 'dispatcher'
  | 'accountant'
  | 'fleet_manager'
  | 'mechanic'
  | 'driver'
  | 'receptionist'
  | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  company_id: string;
  avatar_url?: string;
  driver_id?: string;
  status?: 'Active' | 'Invited' | 'Deactivated' | 'Suspended';
  last_login?: string;
  sessions_revoked_at?: string;
  recovery_requested_at?: string;
  suspension_reason?: string;
  created_at?: string;
}

export interface CompanySettings {
  company_id?: string;
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

export type SupportTicketStatus =
  | 'New'
  | 'Open'
  | 'In Progress'
  | 'Waiting for User'
  | 'Escalated'
  | 'Resolved'
  | 'Closed';

export interface SupportInternalNote {
  id: string;
  author: string;
  note: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_ref: string;
  requester_type?: 'Company' | 'Storefront Customer';
  company_id?: string;
  company_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_ref?: string;
  issue_category: string;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  message: string;
  status: SupportTicketStatus;
  assigned_admin_email?: string;
  escalated?: boolean;
  created_at: string;
  updated_at?: string;
  response?: string;
  internal_notes?: SupportInternalNote[];
}

export type CompanyStatus =
  | 'Pending'
  | 'Pending Verification'
  | 'Trial'
  | 'Active'
  | 'Grace Period'
  | 'Suspended'
  | 'Restricted'
  | 'Inactive'
  | 'Closed';

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
  trial_ends_at?: string;
  vehicle_count?: number;
  branches_count?: number;
  monthly_fee_rwf?: number;
  owner_name?: string;
  assigned_support_admin?: string;
  last_activity?: string;
  suspension_reason?: string;
  created_at: string;
}

// ============================================================================
// Superadmin Control Center Types (Release 1 & Release 2)
// ============================================================================

export type SuperAdminSubRole =
  | 'platform_owner'
  | 'platform_admin'
  | 'finance_admin'
  | 'support_admin'
  | 'technical_admin'
  | 'security_admin';

export type AdminPermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'approve'
  | 'suspend'
  | 'delete'
  | 'export'
  | 'configure';

export type SuperAdminModuleId =
  | 'overview'
  | 'companies'
  | 'users'
  | 'subscriptions'
  | 'plans'
  | 'saas_payments'
  | 'revenue'
  | 'bookings'
  | 'fleet'
  | 'support'
  | 'notifications'
  | 'analytics'
  | 'integrations'
  | 'health'
  | 'security'
  | 'audit'
  | 'content'
  | 'settings'
  | 'admins';

export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  sub_role: SuperAdminSubRole;
  status: 'Active' | 'Suspended';
  permissions: Partial<Record<SuperAdminModuleId, AdminPermissionAction[]>>;
  last_login?: string;
  sessions_revoked_at?: string;
  created_at: string;
}

export interface PlatformPlan {
  id: string;
  tier_key: 'trial' | 'starter' | 'growth' | 'enterprise';
  name: string;
  target_fleet_size: string;
  monthly_fee_rwf: number;
  annual_fee_rwf: number;
  billing_period: 'Monthly' | 'Annual';
  trial_days: number;
  max_vehicles: number;
  max_employees: number;
  max_branches: number;
  max_monthly_bookings: number;
  is_public: boolean;
  is_active: boolean;
  features: string[];
  updated_at: string;
}

export type CompanySubscriptionStatus =
  | 'Trial'
  | 'Active'
  | 'Past Due'
  | 'Suspended'
  | 'Cancelled'
  | 'Expired';

export interface CompanySubscription {
  id: string;
  company_id: string;
  company_name: string;
  plan_id: string;
  plan_name: string;
  status: CompanySubscriptionStatus;
  start_date: string;
  renewal_date: string;
  trial_end_date?: string;
  monthly_fee_rwf: number;
  auto_renew: boolean;
  last_adjustment_reason?: string;
  updated_at: string;
}

export type SaasPaymentStatus =
  | 'Pending'
  | 'Successful'
  | 'Failed'
  | 'Cancelled'
  | 'Refunded'
  | 'Partially Refunded';

export interface SaasPaymentRecord {
  id: string;
  transaction_ref: string;
  provider_ref: string;
  company_id: string;
  company_name: string;
  subscription_id: string;
  plan_name: string;
  amount_rwf: number;
  refunded_amount_rwf?: number;
  currency: 'RWF' | 'USD';
  method: 'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Credit Card';
  provider: 'MTN Rwanda MoMo' | 'Airtel Money' | 'Bank of Kigali' | 'Flutterwave';
  status: SaasPaymentStatus;
  failure_reason?: string;
  reconciliation_notes?: string;
  reconciled_by?: string;
  refund_reason?: string;
  ebm_invoice_ref?: string;
  paid_at: string;
  created_at: string;
}

export interface PlatformAuditLog {
  id: string;
  actor_name: string;
  actor_email: string;
  actor_role: string;
  action: string;
  affected_entity_type:
    | 'Company'
    | 'User'
    | 'Subscription'
    | 'Plan'
    | 'SaasPayment'
    | 'Booking'
    | 'SupportTicket'
    | 'Notification'
    | 'Integration'
    | 'Security'
    | 'Content'
    | 'Settings'
    | 'PlatformAdmin';
  affected_entity_id: string;
  affected_entity_label: string;
  reason: string;
  before_value?: string;
  after_value?: string;
  correlation_id: string;
  timestamp: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: 'Email' | 'SMS' | 'WhatsApp' | 'In-App';
  event_trigger: string;
  subject?: string;
  body: string;
  variables: string[];
  is_active: boolean;
  updated_at: string;
}

export interface NotificationDeliveryLog {
  id: string;
  template_id: string;
  template_name: string;
  channel: 'Email' | 'SMS' | 'WhatsApp' | 'In-App';
  recipient: string;
  company_name?: string;
  provider: string;
  status: 'Queued' | 'Provider Accepted' | 'Delivered' | 'Failed';
  error_detail?: string;
  sent_at: string;
}

export interface PlatformIntegration {
  id: string;
  name: string;
  category: 'Payments' | 'Messaging' | 'Compliance' | 'Aviation' | 'Database';
  provider: string;
  status: 'Connected' | 'Degraded' | 'Disconnected';
  is_enabled: boolean;
  masked_key: string;
  endpoint_label: string;
  last_checked_at: string;
  latency_ms?: number;
  recent_errors: string[];
}

export interface BackgroundJob {
  id: string;
  name: string;
  schedule: string;
  last_run_at: string;
  next_run_at: string;
  status: 'Completed' | 'Running' | 'Failed' | 'Queued';
  records_processed: number;
  error_message?: string;
}

export interface SystemErrorLog {
  id: string;
  service: string;
  severity: 'Warning' | 'Error' | 'Critical';
  message: string;
  correlation_id: string;
  resolved: boolean;
  timestamp: string;
}

export interface SecurityIncident {
  id: string;
  title: string;
  category:
    | 'Failed Login Spike'
    | 'Permission Violation'
    | 'Suspicious Access'
    | 'Account Recovery'
    | 'Session Anomaly';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  target_email?: string;
  target_company?: string;
  source_ip?: string;
  details: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface PlatformContentItem {
  id: string;
  type:
    | 'Announcement'
    | 'Maintenance Banner'
    | 'FAQ'
    | 'Terms of Service'
    | 'Privacy Policy'
    | 'Subscription Policy';
  title: string;
  slug: string;
  body: string;
  version: string;
  status: 'Draft' | 'Published' | 'Scheduled' | 'Archived';
  effective_date: string;
  updated_by: string;
  updated_at: string;
}

export interface PlatformSettings {
  platform_name: string;
  support_email: string;
  support_phone: string;
  default_currency: 'RWF' | 'USD';
  timezone: string;
  require_company_approval: boolean;
  allow_public_self_registration: boolean;
  default_trial_days: number;
  grace_period_days: number;
  auto_suspend_after_grace_days: number;
  momo_merchant_code: string;
  rra_saas_tin: string;
  vat_rate_pct: number;
  maintenance_mode: boolean;
  maintenance_message: string;
  updated_at: string;
}

