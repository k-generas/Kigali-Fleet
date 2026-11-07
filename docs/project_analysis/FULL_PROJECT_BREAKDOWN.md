# Kigali Fleet Management SaaS — Complete Product Breakdown (Unabridged Master Document)

This master document captures the complete architectural, product, role, and operational analysis for the Kigali Fleet platform.

---

# PART 1. Understanding the entire product

## 1. What exactly is Kigali Fleet?

Kigali Fleet is a Fleet Management and Dispatch SaaS.

Its customers are businesses that manage vehicles and transport services, including:

1. Private car rental companies.
2. Tour operators.
3. Airport transfer companies.
4. Corporate transport providers.

Imagine a company in Kigali with:
- 15 vehicles.
- 12 drivers.
- 3 booking coordinators.
- Customers arriving from different countries.
- Multiple bookings every day.

Without centralized software, the company might use Excel, notebooks, phone calls, and WhatsApp to manage everything.

Kigali Fleet is intended to centralize these operations.

### The complete business operation

1. **Customer**: Requests a vehicle or transport service
2. **Booking system**: Checks vehicle availability and records bookings
3. **Fleet and driver management**: Assigns an available vehicle and driver
4. **Dispatch and trip execution**: Driver receives instructions and completes the trip
5. **Financial records**: Business records payments and revenue

The important idea is that all these operations should share the same data.
For example, when a customer books a vehicle, the system should update its availability. When the manager assigns a driver, the driver should receive the correct itinerary.

---

# PART 2. All users and their roles

Before designing pages, we need to understand who uses the software.
There is a difference between a person who uses Kigali Fleet to operate a business and a person who uses it to book a vehicle.

## 2. User categories

### A. Internal users (Working for a transport company)

1. **Business Owner**: Highest company authority. Controls the company, finances, employees, fleet, and subscriptions.
2. **Administrator / Operations Manager**: Manages daily activities, bookings, vehicles, drivers, and staff permissions.
3. **Booking Agent / Dispatcher**: Handles customer requests, booking confirmations, vehicle allocation, and driver assignments.
4. **Driver**: Receives trips, checks schedules, confirms assignments, and updates trip status.

### B. External users (Interacting with a transport company)

5. **Customer / Tourist**: Browses available services, requests vehicles, makes bookings, and receives confirmations.
6. **Corporate Client**: Books transport for employees, business trips, conferences, and organizational activities.

## 3. Platform-level user

7. **Kigali Fleet Super Administrator**: Manages the entire SaaS platform across all tenant transport companies.
   - Register and manage transport companies.
   - Activate, suspend, or deactivate company accounts.
   - Monitor subscriptions and manage subscription plans.
   - Monitor platform-wide activity and handle support requests.
   - Manage system configuration.

**Multi-tenancy principle**:
- Kigali Fleet Super Admin manages 100 transport companies.
- Company A's Owner manages only Company A.
- Company A's Dispatcher manages bookings for Company A.
- Company A's Driver sees only their assigned trips.

---

# PART 3. Complete page-by-page breakdown

Two distinct applications sharing domain/routing:
1. **Public website**: Where visitors discover Kigali Fleet and register.
2. **Private application**: Where transport companies manage their operations.

## 4. Public website — before login

### Page 1: Homepage `/`
- Navigation: Logo, Features, Pricing, About, Login, Get Started
- Hero section: Main headline ("Manage Your Fleet. Control Your Bookings. Never Lose Track.")
- Product preview: Screenshots of dashboard and booking calendar
- Problem section: Double bookings, driver confusion, revenue leakage
- Solution section: Centralized fleet, booking, and dispatch management
- Features & How it works: Register, add fleet, receive bookings, dispatch drivers
- Pricing preview, Testimonials, FAQ, Footer

### Page 2: Features `/features`
1. Fleet management
2. Vehicle availability calendar
3. Online booking
4. Driver management
5. Dispatch management
6. SMS notifications
7. Booking collision prevention
8. Business reporting

### Page 3: Pricing `/pricing`
- **Starter**: 35,000 RWF/mo (5 cars)
- **Growth**: 75,000 RWF/mo (20 cars)
- **Enterprise**: 150,000 RWF/mo (Large fleet)

### Page 4: About `/about`
- Mission, problems addressed, target market in Rwanda/East Africa.

### Page 5: Contact `/contact`
- Contact form, telephone, business email, support tickets.

### Page 6: Registration `/register`
- Company name, business email, telephone, country, business type, password.

### Page 7: Login `/login`
- Email, password, remember me, forgot password redirect.

### Page 8: Forgot password `/forgot-password`
- Password recovery via verified email.

---

# PART 4. The internal application

## 5. Business Owner / Administrator dashboard `/dashboard`
- **Business statistics**: Total, available, rented, and maintenance vehicles; total and available drivers; active/pending bookings.
- **Financial overview**: Total booking value, payments received, outstanding payments, cancellations, revenue by period.
- **Booking calendar**: Day, week, month fleet scheduling grid.
- **Recent activities & Upcoming trips**: Live audit trail.
- **Alerts**: Maintenance due, unassigned bookings, unpaid bookings, schedule collisions, driver check-in status.

## 6. Fleet Management `/vehicles`
- List displaying: Name, plate number, category, year, status, daily rate (RWF), assigned driver, location.
- Actions: Add (`/vehicles/new`), Edit, View details (`/vehicles/:id`), Change status, Archive, Booking & Maintenance history.
- Statuses: Available, Reserved, Rented, In maintenance, Out of service.
- **Critical rule**: Vehicle under maintenance must never be offered for overlapping rental dates.

## 7. Driver Management `/drivers`
- List displaying: Full name, phone, email, license number, status, assigned car, current assignment.
- Actions: Add (`/drivers/new`), Details (`/drivers/:id`), Trip history, Performance.
- Statuses: Available, Assigned, On trip, Off duty, Unavailable.
- **Critical rule**: Same driver cannot receive overlapping assignments.

## 8. Booking Management `/bookings`
- List displaying: Booking ID, customer, vehicle, pickup, destination, dates, amount, status.
- Statuses: Pending, Confirmed, Assigned, In progress, Completed, Cancelled, Rejected.
- Actions: Create booking (`/bookings/new`), Details (`/bookings/:id`), Payments.
- **Collision Prevention**: Checks actual physical inventory for overlapping booking dates before confirming a vehicle. Rejects overlapping allocations and concurrent double-bookings.

## 9. Booking Calendar `/calendar`
- Visual timeline grid across daily, weekly, and monthly views by vehicle and by driver.

## 10. Dispatch Management `/dispatch`
- Board with: Unassigned bookings, assigned bookings, drivers available/on trips, pickups.
- Details: Reference, driver, car, pickup time/address, customer contact, instructions, status.
- Statuses: Waiting for assignment, Assigned, Driver notified, Driver acknowledged, En route, Arrived, Trip started, Trip completed.
- SMS-based dispatch via Africa's Talking with zero-data driver check-in.

## 11. Customers `/customers`
- List & Profile (`/customers/:id`): Name, phone, email, category (Individual, Tourist, Corporate, NGO, Travel agency), booking history, total value, balances.

## 12. Payments and Financial Management `/payments`
- Payment records: Reference, booking ID, customer, expected/paid amounts, method (Cash, MoMo, Bank, Card), date, status.
- Statuses: Unpaid, Partially paid, Paid, Refunded, Overdue.
- Reports: Daily/weekly/monthly revenue, payments by method, outstanding balances, revenue by car/customer.

## 13. Maintenance Management `/maintenance`
- Tracking servicing, oil changes, brake pads, costs, garage provider, next service threshold. Prevents renting cars under repair.

## 14. Reports and Analytics `/reports`
- Booking reports, revenue reports, fleet utilization rate, driver trip performance, cancellation rates, vehicle profitability.

## 15. Online Booking Storefront `/booking/:companySlug`
- Public booking link for each transport company: Company logo/profile, available vehicle classes, dates picker, real-time availability check, booking form, confirmation reference.

---

# PART 5. Pages according to each user's role

## 16. Driver Portal `/driver`
- Mobile-first web app / PWA:
  - `/driver/dashboard`: Today's assignments, next pickup.
  - `/driver/trips` & `/driver/trips/:id`: Itinerary, customer phone, notes.
  - Actions: Acknowledge assignment, check in, mark arrival, start trip, complete trip, report problem.
  - Zero-data SMS command hook fallback.

## 17. Booking Agent / Dispatcher Portal
- Focused operational dashboard: New requests, pending confirmations, unassigned trips, vehicle/driver availability, today's pickups. No access to subscription billing or company ownership settings.

## 18. Company Owner Portal
- Full company access: Dashboard, vehicles, drivers, bookings, calendar, dispatch, customers, payments, reports, maintenance, employee permissions, billing, and settings.

## 19. Super Admin Portal `/super-admin`
- Multi-tenant control center: Company registries, subscription statuses, plan limits, billing overviews, platform analytics, system configuration.

---

# PART 6. System services & security

## 20. Notifications `/notifications`
- In-app, SMS (Africa's Talking), and Email for booking confirmations, driver dispatches, pickup countdowns, maintenance alerts, payment confirmations.

## 21. Employee Management `/employees`
- Invite staff, assign roles (Owner, Manager, Dispatcher, Driver), manage permissions, deactivate accounts.

## 22. Company Settings `/settings`
- Business profile, booking rules, cancellation rules, currency, vehicle categories, SMS/email preferences, subscription management.

## 23. Authentication and Authorization
- Strict distinction between identity authentication and multi-tenant role authorization.

---

# PART 7. Roles & Permissions Matrix + Booking Lifecycle

### Permissions Matrix
| Feature | Super Admin | Owner | Manager | Dispatcher | Driver |
|---|---|---|---|---|---|
| Platform management | Full | None | None | None | None |
| Company settings | View only | Full | Limited | None | None |
| Vehicles | View only | Full | Full | View only | Assigned car |
| Drivers | View only | Full | Full | Limited | Self profile |
| Bookings | View only | Full | Full | Full | Assigned trip |
| Calendar | View only | Full | Full | Full | Personal |
| Dispatch | View only | Full | Full | Full | Own trips |
| Customers | View only | Full | Full | Limited | Assigned guest |
| Payments | Platform billing | Full | Limited | None | None |
| Reports | Platform-wide | Full | Limited | None | None |
| Employees | Platform users | Full | Limited | None | None |
| Subscriptions | Full | Own account | None | None | None |

### Complete Booking Lifecycle
1. Customer visits Storefront & selects dates/category.
2. Availability Engine checks physical inventory & prevents collisions.
3. Booking created with reference ID.
4. Agent/Manager confirms reservation & rate.
5. Dispatcher assigns available vehicle & driver.
6. Driver notified via SMS/interactive link.
7. Driver checks in & starts trip.
8. Trip completed & vehicle marked available.
9. Payments & financial balances recorded.
10. Owner reviews performance in analytics.

---

# PART 8. Complete Proposed Sitemap

1. **Public Website**: `/`, `/features`, `/pricing`, `/about`, `/contact`, `/register`, `/login`, `/forgot-password`
2. **Company Application**: `/dashboard`, `/vehicles`, `/vehicles/new`, `/vehicles/:id`, `/drivers`, `/drivers/new`, `/drivers/:id`, `/bookings`, `/bookings/new`, `/bookings/:id`, `/calendar`, `/dispatch`, `/customers`, `/customers/:id`, `/payments`, `/maintenance`, `/reports`, `/notifications`, `/employees`, `/settings`, `/subscription`
3. **Customer Application**: `/booking/:companySlug`, `/booking/:companySlug/vehicles`, `/booking/:companySlug/checkout`, `/booking/:companySlug/confirmation`
4. **Driver Application**: `/driver/dashboard`, `/driver/trips`, `/driver/trips/:id`, `/driver/schedule`, `/driver/notifications`, `/driver/profile`
5. **Platform Super Admin**: `/super-admin/dashboard`, `/super-admin/companies`, `/super-admin/subscriptions`, `/super-admin/plans`, `/super-admin/users`, `/super-admin/payments`, `/super-admin/support`, `/super-admin/analytics`, `/super-admin/settings`

---

# PART 9. Specification Decisions & Gaps To Address

1. **Authentication**: Self-serve registration vs invite flow for transport staff.
2. **Multi-tenancy**: Database row-level security (`company_id` isolation) vs separate schemas.
3. **Roles & Permissions**: Granular permission switches per employee.
4. **Payments**: MTN MoMo / Airtel Money USSD push integration, deposits, refund policies.
5. **Dynamic Pricing**: Weekend, seasonal safari peaks (June–September), and upcountry distance rates.
6. **Driver Shifts**: Time off, sickness, working hours limits.
7. **Maintenance Downtime**: Automatic reservation blocking during scheduled garage visits.
8. **Dispatch Failure Handling**: Driver rejection escalation rules and automatic re-dispatch.
9. **SMS Delivery Fallbacks**: WhatsApp Cloud API or IVR failover when SMS gateways delay.
10. **Tax & Invoicing**: Rwanda Revenue Authority (RRA) EBM v2 electronic receipts and TIN recording.
11. **Offline & Connectivity**: Offline caching for drivers operating in low-signal national parks (Akagera, Nyungwe).
12. **SaaS Billing**: Automated grace periods and subscription renewals in RWF.

---

# PART 10. MVP 14-Point Inspection Checklist

- [ ] 1. Public homepage (Navigation, hero, pricing, registration)
- [ ] 2. Authentication (Login, registration, password recovery)
- [ ] 3. Dashboard (Statistics, activities, alerts, overview)
- [ ] 4. Vehicles (Vehicle creation, editing, availability)
- [ ] 5. Drivers (Driver records, status, assignments)
- [ ] 6. Bookings (Creation, status transitions, collision prevention)
- [ ] 7. Calendar (Vehicle and driver scheduling grid)
- [ ] 8. Dispatch (Assignment, SMS notifications, trip coordination)
- [ ] 9. Customers (Customer records, profiles, balances)
- [ ] 10. Payments (Payment records, financial tracking, MoMo records)
- [ ] 11. Reports (Fleet utilization, revenue analytics)
- [ ] 12. Storefront (Public booking link per company)
- [ ] 13. Driver portal (Mobile-friendly driver trip view & check-in)
- [ ] 14. Super admin (Multi-tenant company & subscription management)
