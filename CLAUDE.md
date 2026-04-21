# MG Fleet Portal — CLAUDE.md

React + Firebase rebuild of the ASP.NET MVC **Garage Connect V2** fleet portal.
Reads/writes the **same Firestore database** as the MG FMS mobile app
(`mg-fms.web.app`). The legacy .NET source lives in `/_reference_dotnet/`
and the SQL schemas in `/_reference_sql_schema/` — **reference only, never modify**.

---

## Tech stack

- React 18 + Vite
- Tailwind CSS
- Firebase (Auth + Firestore + Storage)
- React Router v6

Environment variables live in `.env.local` (see `.env.example`). All names are
prefixed `VITE_FIREBASE_*`.

---

## Project structure

```
src/
  lib/
    firebase.js       Firebase init (auth, db, storage)
    roles.js          Role constants + helpers
  context/
    AuthContext.jsx   Firebase auth + user profile loader
  components/
    Sidebar.jsx       Role-aware left nav
    Topbar.jsx        Plate search + user menu
    ProtectedRoute.jsx
  layouts/
    PortalLayout.jsx  Sidebar + Topbar shell
  pages/
    Login.jsx         Email/password sign-in
    Home.jsx          Staff dashboard
    Portal.jsx        Fleet customer dashboard
    Placeholder.jsx   Stub for routes not yet built
  App.jsx             Route definitions
  main.jsx            Entrypoint
```

---

## The 14 sections of the app

Matches the legacy sidebar (`Views/Shared/_Layout.cshtml`):

### Staff view (roles 1–7)

**Quick Links**
1. Notifications
2. My Garage (dashboard)
3. My Mechanics
4. + Booking (new appointment)
5. + Service Quotation
6. + Service Receipt

**Core Operations**

7. Service Bookings (appointment list)
8. Services for Quotation (unbilled)
9. Service Quotations
10. Service Receipts
11. Reports

**Data Management**

12. Customers
13. Fleet (vehicles)
14. Mechanics
   (+ Services Offered — a reference/catalog section)

### Fleet customer view (roles 8–9)

- Notifications
- Fleet Dashboard
- My Fleet
- Service Quotations
- + Book a Service (role 9 only)

---

## The 25 Firestore collections (replacing SQL tables)

Document IDs are the Firestore auto IDs; the legacy numeric `Id` is stored as
a `legacyId` field on each document to preserve back-references during data
migration. Field names mirror the SQL columns (`snake_case`) so the mobile app
keeps working. Timestamps become Firestore `Timestamp` values.

### Reference / lookup (small, static)

| # | Collection | Replaces SQL | Notes |
|---|---|---|---|
| 1 | `branches` | `ref_branches` | `branch_code`, `is_fleet`, `booking_count_max` |
| 2 | `refUserRoles` | `ref_user_roles` | Role 1–9 names |
| 3 | `refVehicleBrands` | `ref_vehicle_brands` | e.g. Toyota, Ford |
| 4 | `refVehicleModels` | `ref_vehicle_models` | `brand_id` link |
| 5 | `refServicesOffered` | `ref_services_offered` | Hierarchical (`service_parent`) |
| 6 | `refConcernTypes` | `ref_concern_types` | |
| 7 | `refProblemOccurTypes` | `ref_problem_occur_types` | |
| 8 | `refRoadWorthyStatus` | `ref_road_worthy_status` | Fit / Limited / Unfit + color |
| 9 | `refSuppliers` | `inv_supplier` | |
| 10 | `fleetAccounts` | `FleetAccounts` | Fleet companies |

### Transactional

| # | Collection | Replaces SQL |
|---|---|---|
| 11 | `users` | `Users` — **doc id = Firebase Auth UID** |
| 12 | `fleetUsers` | `FleetUsers` — maps users to fleet accounts, incl. `quotation_approver` flag |
| 13 | `mechanics` | `Mechanics` |
| 14 | `customers` | `Customers` |
| 15 | `vehicles` | `Vehicles` — `is_fleet`, `company_id` (→ fleetAccounts) |
| 16 | `appointments` | `Appointments` |
| 17 | `diagnostics` | `DigitalDiagnostics` |
| 18 | `vehicleRoadworthiness` | `VehicleRoadworthiness` — scored on diagnosis |
| 19 | `vehicleServiceUpdates` | `VehicleServiceUpdates` — event log |
| 20 | `serviceHistory` | `ServiceHistory` |
| 21 | `quotations` | `ServiceQoutationsHeader` (+ details as subcollection) |
| 22 | `serviceReceipts` | `ServiceReceiptHeader` (+ details as subcollection) |
| 23 | `parts` | `inv_parts` |
| 24 | `inventoryCounts` | `inv_parts_count` |
| 25 | `notifications` | (used by controller, no SQL file) |

**Subcollections (inside their parent doc):**
- `quotations/{id}/details` — line items (Labor / Parts), replaces `ServiceQoutationsDetails`
- `serviceReceipts/{id}/details` — replaces service-receipt details
- `inventoryMissingParts` — top-level; replaces `inv_parts_missing`

Minor top-level collection needed by inventory workflow:
- `partsInventory` — transactional inventory moves (replaces `inv_parts_inventory`)

---

## User roles

Stored as `role` (number) on each `users` doc. Confirmed from
`_reference_sql_schema/ref_user_roles.sql`:

| ID | Role name | Category | Default route |
|----|---|---|---|
| 1 | Branch Manager | Internal | `/home` |
| 2 | Admin Supervisor | Internal | `/home` |
| 3 | Call Center | Internal | `/home` |
| 4 | Service Advisor | Internal | `/home` |
| 5 | Floor Supervisor | Internal | `/home` |
| 6 | Parts Man | Internal | `/home` |
| 7 | Finance | Internal | `/home` |
| 8 | Customer | Fleet customer | `/portal` |
| 9 | Fleet Coordinator | Fleet customer (can book) | `/appointments` |

Role gating lives in `src/lib/roles.js` (`INTERNAL_ROLES`, `CUSTOMER_ROLES`,
`defaultRouteForRole`) and is enforced at the route level by `ProtectedRoute`.

### User doc shape (mirrors `Users.sql`)

```
users/{authUid} {
  legacyId: number,
  user_fullname: string,
  user_name: string,
  role: number,         // 1–9
  branch_id: number,    // → branches
  branch_code: string,  // denormalized for quick display
  is_active: 0 | 1,
  is_password_changed: 0 | 1,
  date_added, date_updated: Timestamp,
  added_by, updated_by: string,

  // for fleet customers only (role 8 / 9)
  company_id: number,         // → fleetAccounts
  fleet_company_name: string, // denormalized
  quotation_approver: 0 | 1,  // from FleetUsers
}
```

---

## Key business rules

### 1. Fleet vs non-fleet

- `vehicles.is_fleet === 1` ⇒ the vehicle belongs to a fleet company; its
  `company_id` points at `fleetAccounts/{id}`.
- `branches.is_fleet === 1` ⇒ the branch is a fleet-only branch
  (e.g. `MGFLEET-PF` in the legacy data).
- Fleet customer users (role 8/9) only see vehicles where
  `is_fleet === 1 AND company_id === profile.company_id`.
- Fleet appointments default to status `TENTATIVE` (await fleet confirmation);
  non-fleet appointments default to `CONFIRMED`
  (`AppointmentController.cs` line ~351).

### 2. Appointment → Diagnostic → Quotation → Service Receipt

Pipeline an appointment goes through (`service_status`):
`BOOKED → ARRIVED → DIAGNOSED → ONGOING → COMPLETED` (plus `PENDING`, `NO SHOW`).

`appointment_status` is separate (`CONFIRMED`, `TENTATIVE`, `CANCELLED`).

### 3. Quotation workflow

- Code format: `SQ-{branch_code}-{legacyId}` (legacy used `Q-MGB-1`; we
  preserve whatever the mobile app writes).
- Statuses: `OPEN → APPROVED | DISAPPROVED → PAID | CANCELLED`.
- Only fleet users with `quotation_approver === 1` can approve/disapprove.
  Non-approver fleet users can view but not transition.
- Creating a quotation: reserves parts in `inventoryCounts.reserved_count`;
  any missing parts create `inventoryMissingParts` rows; fleet cases emit a
  `notifications` entry targeting the fleet account.
- Cancelling reverses reservations and marks related missing-parts rows
  `CANCELLED`.

### 4. Diagnostic workflow

- Mechanic creates a `diagnostics` doc tied to an `appointment_id` and
  `vehicle_id`.
- Upon creation, a `vehicleRoadworthiness` doc is computed across 10 criteria
  (engine, brakes, tires, electrical, cooling, fluids, body, docs, OBD, mileage).
  Weighted score → status:
  - `score ≤ 60` → **Unfit**
  - `60 < score ≤ 80` → **Limited Fitness**
  - `score > 80` → **Fit**
- Side effects: `appointments.service_status` → `DIAGNOSED`, `vehicles.road_worthy_status_id`
  updated, `serviceHistory` + `vehicleServiceUpdates` rows appended.

### 5. Auto-generated codes

- Quotation: `SQ-{branch_code}-{id}`
- Service receipt: `SR-{branch_code}-{id}`

### 6. Role-based routing

See `src/lib/roles.js`. `defaultRouteForRole(role)` decides where users land
after login. `ProtectedRoute allowedRoles={[...]}` guards each route.

---

## Build plan (Week 1 done)

- [x] Vite + React + Tailwind + Firebase scaffolding
- [x] Auth context + role-based route guard
- [x] Login page
- [x] Sidebar + Topbar portal shell
- [x] Stub routes for all 14 sections (staff + fleet customer)
- [ ] **Week 2+**: implement feature pages in this order — Appointments,
      Diagnostics, Quotations, Service Receipts, Vehicles, Customers,
      Inventory, Reports.

---

## Running locally

```
npm install
cp .env.example .env.local   # fill in Firebase web-app keys from the mg-fms project
npm run dev
```

To log in, the user's Firebase Auth account must have a matching
`users/{authUid}` Firestore doc with a numeric `role` field. Without that doc,
login succeeds but the sidebar will render as "no role" and most routes will
redirect away.

---

## Companion app: MG-FMS (being merged in)

The **MG FMS** React SPA (`mg-fms.web.app`, git HEAD `ae4ab81`, `APP_VERSION "1.5.1"`) is the mobile/tablet app mechanics use in the field across 5 branches. It shares this portal's Firestore database and is being **folded into this repo over time** — this is an active code-merge project. Stack: React 19, Vite 8, Tailwind 3, Firebase 12, Recharts 3. Single-file monolith (`src/App.jsx`, ~1120 lines). Writes 3 collections — `assessments`, `pms_records`, `users`. Email/password auth only. Offline-first via `persistentLocalCache` + multi-tab manager. No tests, no router.

Architecture, Firestore schema, auth flow, known issues, and deploy config for MG-FMS live in four reference docs:
- `docs/handoff/FMS_PROJECT_STATE.md`
- `docs/handoff/FMS_ARCHITECTURE.md`
- `docs/handoff/FMS_KNOWN_ISSUES.md`
- `docs/handoff/FMS_FIREBASE_CONFIG.md`

**Future Claude Code sessions: read all four when touching architecture, Firebase, auth, Firestore schema, or any merge task.** The portal has no `firebase.json` yet; any Hosting / rules config referenced in the handoff belongs to the `mg-fms` project.

### Active problems being tracked

1. **Firestore `undefined` fields.** `sanitizeForFirestore()` (mg-fms `src/firebase.js:27-35`) converts `undefined → null` on every write, but **`NaN` bypasses it** (e.g. `pms_records.<code>.lastOdo` when odometer is empty — see `FMS_KNOWN_ISSUES.md §1`). Any write helper we port into the portal must either route through the same sanitizer *or* not emit `undefined` / `NaN` at the boundary.
2. **Auth race conditions.** In mg-fms `src/App.jsx:832/838`, both Firestore listeners attach *after* multiple `await`s without re-checking the `cancelled` flag — listeners leak if the user signs out mid-bootstrap. Similar pattern in `saveMech` (captured `user.uid` can go stale after logout). Re-check `cancelled` immediately before each `onSnapshot` attach, and guard user-scoped async calls with `if (user && userProfile)`. Full scan in `FMS_KNOWN_ISSUES.md §2`.

### Working style

- **Direct and actionable.** No preamble, no hedging, no trailing summaries.
- **Correct me when I'm wrong.** If I misread code or state a wrong fact, push back with the evidence.
- **Diagnose root cause before fixing.** Understand *why* the bug exists; don't paper over the symptom.
- **Flag trade-offs.** When two approaches differ, surface the trade-off instead of silently choosing.
