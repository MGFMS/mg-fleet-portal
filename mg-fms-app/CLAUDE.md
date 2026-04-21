# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Master Garage Fleet Management System (MG-FMS) — a React SPA for vehicle fleet inspection, assessment tracking, and preventive maintenance scheduling. Used by mechanics in the field across multiple branches (Cavite, QC, Pampanga, Davao, Palawan).

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build locally
- `npm run lint` — ESLint (flat config, ESLint 9.x)
- `firebase deploy` — deploy to Firebase Hosting (project: `mg-fms`)
- `firebase deploy --only firestore:rules` — deploy Firestore security rules only
- `firebase deploy --only firestore:indexes` — deploy Firestore index config only

No test runner is configured. There are no unit or integration tests.

## Architecture

**Single-file monolithic React app.** Almost all UI and logic lives in `src/App.jsx` (~1000 lines of dense, minified-style code). There is no React Router — screen navigation uses a `screen` state variable with these values: `dashboard`, `new`, `inspect`, `pms`, `result`, `history`, `analytics`, `settings`, `users`, plus a `vehiclePlate` state for `vehicle-profile`.

### Key Files

- `src/App.jsx` — everything: components, business logic, inspection item catalog, PMS items, classification engine, health score, analytics charts, user management. Lines 1–697 are constants, helpers, PMS_ITEMS, ITEMS catalog, and sub-components. The main `App()` function starts at line 700, wrapped by `AppWithErrorBoundary` at line 698.
- `src/firebase.js` — Firebase config (project: `mg-fms`), Firestore CRUD helpers (`saveAssessment`, `updateAssessment`, `savePMSRecord`), auth functions (`login`, `logout`, `onAuth`), real-time snapshot listeners (`onAssessmentsSnapshot`, `onPMSRecordsSnapshot`), user profile functions (`getUserProfile`, `saveUserProfile`, `getAllUsers`), offline persistence setup. ~100 lines.
- `src/index.css` — Tailwind directives only (all styling is via Tailwind utility classes inline)
- `firestore.rules` — Firestore security rules. Three collections: `assessments` (any auth), `pms_records` (any auth), `users` (self-write or fleet_manager).

### Backend

Firebase only (no custom server). Firestore collections:
- `assessments` — vehicle inspection records (doc ID = auto-generated, `id` field = timestamp)
- `pms_records` — keyed by plate number, each doc contains service item records
- `users` — user profiles with roles

Auth via email/password. Offline-first with `persistentLocalCache` and multi-tab support.

### State Management

React `useState` hooks only — no Redux, Zustand, or Context API. Local storage keys:
- `fms:mechanic:v1` — technician profile (name, branch)
- `fms:vehicleRegistry:v1` — vehicle cache built from assessment history
- `fms:errors` — client-side error log (max 100 entries)

### Role-Based Access

Three roles: `technician`, `supervisor`, `fleet_manager`. Access controlled by `canAccess(role, feature)` function. Fleet managers have full access; technicians cannot access analytics, supervisor_override, user_management, or export.

## Key Business Logic

- **Classification engine (`runEngine`):** Evaluates inspection results → determines overall status (`active`/`conditional`/`deferred`), dispatch eligibility, reassessment deadlines (3 days for deferred, 30 days for conditional)
- **Health score (`calcHealthScore`):** 100-point system with weighted deductions per item type (`holdUnit`: -20, `isCritical`: -15, `isCompliance`: -10, other: -8 for fail_critical; `isCritical`: -5, other: -3 for monitor)
- **7 inspection categories** (ENG, BRK, SUS, ELC, TIR, BOD, LTO) with 35+ items. Result codes: `pass`, `monitor`, `fail_critical`, `replaced`, `na`
- **Action recommendation (`getAction`):** Maps result codes to actions: NONE, MONITOR_ONLY, REPAIR_REQUIRED, REPAIR_IMMEDIATE, HOLD_UNIT — based on item criticality flags (`holdUnit`, `isCritical`, `isCompliance`)
- **PMS tracking:** 31 service items across categories (scheduled, brake, major, troubleshooting) with km/month intervals, next-due calculations (`calcNextDue`), urgency levels (`pmsUrgency`)
- **Vehicle registry (`buildVehicleRegistry`):** Auto-builds vehicle info cache from assessment history
- **Photo handling:** Camera capture with client-side compression (`compressImage`: max 800px, JPEG quality 0.7), stored as base64 in Firestore documents. `b64size()` shows KB overlay.

## Conventions

- React 19 with functional components and hooks (one class component: `ErrorBoundary`)
- Tailwind CSS 3.x exclusively for styling — no CSS modules, no styled-components
- Brand color: `red-700`. Status colors: green (active/pass), amber (conditional/monitor), red (deferred/critical)
- Code is written in a dense, compact style — most functions are single-line. Maintain this style when editing.
- Assessment IDs are timestamps; RWA numbers follow format `RWA-YYYY-XXXXXX`
- Photos stored as base64 inline in Firestore documents
- App version tracked in `APP_VERSION` constant near top of App.jsx
- All Firestore writes go through `sanitizeForFirestore()` which strips `undefined` values
- Demo data (`DEMO_ASSESSMENTS`, `DEMO_PMS_RECORDS`) is embedded in App.jsx for initial state before Firestore loads
- Recharts library used for analytics charts (PieChart, BarChart)
- ESLint flat config (`eslint.config.js`): `no-unused-vars` ignores vars starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`)
- `src/main.jsx` is the entry point; `src/App.css` exists but styling is all Tailwind inline
