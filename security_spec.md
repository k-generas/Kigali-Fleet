# KigaliFleet Security Specification & Adversarial Test Plan

## 1. Core Data & Row-Level Security Invariants
1. **Default Deny Catch-All**: Every path not explicitly matched under `/databases/{database}/documents` is rejected (`allow read, write: if false;`).
2. **Email Verification Enforcement for Superadmin & Privileged Writes**: `isSuperAdmin()` requires `request.auth != null && request.auth.token.email_verified == true` AND either one of the two designated platform owner emails (`generaskagiraneza@gmail.com`, `generaskagiraneza9@gmail.com`) or an active document in `/platform_admins/{request.auth.uid}`. Custom claims (`request.auth.token.role`) are never trusted.
3. **Anti-Privilege-Escalation on `/users`**: Authenticated users creating or updating their own user record cannot set or escalate `role` to `'superadmin'` or modify protected admin status fields unless they pass `isSuperAdmin()`.
4. **Immutable Audit Trail**: `/platform_audit_logs/{logId}` is strictly append-only (`allow update, delete: if false;` even for superadmins).
5. **Strict Path & Schema Validation**: Every document ID on single-document operations passes `isValidId(id)` (`size() > 0 && size() <= 128 && matches('^[a-zA-Z0-9_\\-]+$')`). Every create/update begins with `isValid[Entity](incoming())` enforcing types, enum membership, positive monetary boundaries, and string `.size()` bounds matching `firebase-blueprint.json`.
6. **PII Protection**: `/users`, `/customers`, `/payments`, `/platform_admins`, `/saas_payments`, `/company_subscriptions`, and `/platform_audit_logs` forbid unauthenticated reads and enforce strict ownership or staff/superadmin bounds.
7. **Single-Key / Action-Scoped Updates**: Client updates on operational entities must pass `incoming().diff(existing()).affectedKeys().hasOnly([...])` for the allowed action or `isSuperAdmin()`.

---

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Email Spoof Attack (Unverified Superadmin Claim)**:
   - Auth: `{ uid: "spoof-1", token: { email: "generaskagiraneza@gmail.com", email_verified: false } }`
   - Action: `update /platform_settings/global { maintenance_mode: true }`
   - Expected: `PERMISSION_DENIED` (blocked because `email_verified != true`).
2. **Self-Role Escalation via User Creation**:
   - Auth: `{ uid: "u-attacker", token: { email: "attacker@example.com", email_verified: true } }`
   - Action: `create /users/u-attacker { id: "u-attacker", name: "Attacker", email: "attacker@example.com", role: "superadmin", company_id: "platform-root" }`
   - Expected: `PERMISSION_DENIED` (`role == 'superadmin'` rejected for non-superadmin).
3. **Self-Role Escalation via User Profile Update**:
   - Auth: `{ uid: "u-staff", token: { email: "staff@company.rw", email_verified: true } }`
   - Action: `update /users/u-staff { role: "superadmin" }`
   - Expected: `PERMISSION_DENIED` (`role` cannot be escalated to `'superadmin'` and non-admins only modify profile fields).
4. **Audit Log Tampering / Deletion**:
   - Auth: `{ uid: "owner-1", token: { email: "generaskagiraneza@gmail.com", email_verified: true } }`
   - Action: `delete /platform_audit_logs/paud-001` or `update /platform_audit_logs/paud-001 { action: "Erased" }`
   - Expected: `PERMISSION_DENIED` (`allow update, delete: if false`).
5. **Document ID Poisoning (1.5KB Junk ID / Path Characters)**:
   - Auth: Verified staff user
   - Action: `create /vehicles/${"x".repeat(200)} { ...validVehicle }`
   - Expected: `PERMISSION_DENIED` (`isValidId` rejects ID > 128 chars or invalid chars).
6. **Shadow / Ghost Field Injection on Create**:
   - Auth: Guest or staff
   - Action: `create /bookings/bk-evil { client_name: "Test", vehicle_id: "v1", driver_id: "d1", start_date: "2026-11-20", end_date: "2026-11-21", total_rwf: 50000, status: "Confirmed", isAdminBypass: true }`
   - Expected: `PERMISSION_DENIED` (`hasOnly` rejects undeclared `isAdminBypass` ghost field).
7. **Unauthenticated Read of `/users` PII**:
   - Auth: `null`
   - Action: `get /users/usr-1` or `list /users`
   - Expected: `PERMISSION_DENIED`.
8. **Unauthenticated Write to `/platform_plans`**:
   - Auth: Verified regular tenant user (not superadmin)
   - Action: `set /platform_plans/plan-starter { monthly_fee_rwf: 0 }`
   - Expected: `PERMISSION_DENIED` (only `isSuperAdmin()` may write `platform_plans`).
9. **Unauthorized SaaS Payment Reconciliation by Regular Tenant**:
   - Auth: Verified tenant user
   - Action: `update /saas_payments/pay-1 { status: "Successful" }`
   - Expected: `PERMISSION_DENIED` (only `isSuperAdmin()` may modify `saas_payments`).
10. **Denial-of-Wallet Oversized String Payload**:
    - Auth: Verified user
    - Action: `create /support_tickets/tck-big { ...valid, message: "A".repeat(5000) }`
    - Expected: `PERMISSION_DENIED` (`message.size() <= 2000` enforced in `isValidSupportTicket`).
11. **Direct Manipulation of `/platform_admins` by Non-Owner**:
    - Auth: Verified regular user
    - Action: `create /platform_admins/u-attacker { name: "Evil", email: "evil@test.com", sub_role: "platform_owner", status: "Active" }`
    - Expected: `PERMISSION_DENIED` (`isSuperAdmin()` required).
12. **Negative Monetary Value Injection on Payment/Booking**:
    - Auth: Guest or verified user
    - Action: `create /bookings/bk-neg { client_name: "X", vehicle_id: "v1", driver_id: "d1", start_date: "2026-11-20", end_date: "2026-11-21", total_rwf: -999999, status: "Confirmed" }`
    - Expected: `PERMISSION_DENIED` (`total_rwf >= 0` enforced in `isValidBooking`).
