# Kigali Fleet — 14-Point MVP Inspection Checklist

Use this checklist to track the audit and implementation progress across every area of the application:

| Area | Scope & Expectations | Status | Notes |
|---|---|---|---|
| **1. Public Homepage** | Navigation, hero, value prop, 3 connected platforms, live collision playground, pricing calculator (RWF), testimonials, FAQ | Implemented | `/` (or `?tab=landing`) |
| **2. Authentication & Roles** | Multi-tenant company onboarding, role switcher (Owner, Manager, Dispatcher, Driver, Superadmin), login & SMS recovery | Implemented | `/login`, `/register`, `tab=login` |
| **3. Dashboard** | Actionable alerts (missing chauffeur, flight delay, maintenance), financial ledger (RWF), driver mission view, live radar | Implemented | `/dashboard`, `tab=overview` |
| **4. Vehicles** | Physical inventory, category, maintenance status & collision locks, live RWF rate editor, Rwanda Contrôle Technique & Yellow Card tracking, vehicle lifecycle drawer, service log recorder | Implemented | `/vehicles`, `tab=vehicles` |
| **5. Drivers** | Driver profiles, Rwanda National ID, license tracking, collision-safe assignment, dedicated vehicle binding | Implemented | `/drivers`, `tab=drivers` |
| **6. Bookings** | Collision-guarded booking engine, real-time Firestore sync, RRA EBM tax invoice generation, MTN MoMo payment tracking, flight delay radar | Implemented | `/bookings`, `tab=bookings` |
| **7. Calendar** | Day/month visual fleet scheduling grid, MyFleetOS dark styling, month navigation, continuous booking bars, turnaround buffer alerts, vehicle utilization badges, Block Vehicle maintenance modal | Implemented | `/calendar`, `tab=calendar` |
| **8. Dispatch** | 5-stage Kanban board, Africa's Talking 2G SMS dispatch, zero-data *134# USSD terminal, KIA flight telemetry radar, official Rwanda Bon de Mission (Police clearance slip) | Implemented | `/dispatch`, `tab=dispatch` |
| **9. Customers** | Client CRM directory, Corporate & NGO profiles with RRA TIN, Net-30 credit terms, customer dossier modal, mission history, payment balance settlement | Implemented | `/customers`, `tab=customers` |
| **10. Payments** | Payment records ledger, MTN MoMo & Bank of Kigali collections, RRA EBM v2.0 tax receipts (18% VAT), USSD push simulation, CSV ledger export | Implemented | `/payments`, `tab=payments` |
| **11. Reports** | Fleet utilization rates, vehicle ROI & maintenance ledger, RevPAV, chauffeur mission scorecards, payment channel mix, booking conversion/cancellation funnel, CSV export | Implemented | `/reports`, `tab=reports` |
| **Maintenance & Workshop** | Garage work orders (CFAO, Kigali Toyota, Akagera Motors), repair tracking, parts replacement, vehicle grounding locks, Contrôle Technique safety compliance, service release modal | Implemented | `/maintenance`, `tab=maintenance` |
| **12. Storefront** | Dedicated public booking URL per company | In App | `/booking/:slug` |
| **13. Driver Portal** | Mobile web chauffeur terminal, 4-step mission check-in, 2G SMS command fallback (*134#) | Implemented | `/driver`, `tab=drivers` (Portal mode) |
| **Company Settings & Staff** | Business profile (RRA TIN, city), collision turnaround buffers, Africa's Talking SMS rules, staff invitations & role permissions | Implemented | `/settings`, `tab=settings` |
| **14. Super Admin** | Multi-tenant SaaS command center, tenant company directory, plan quota enforcement, platform MRR/ARR in RWF, tenant context switching, account suspension/activation controls | Implemented | `/super-admin`, `tab=super-admin` |
