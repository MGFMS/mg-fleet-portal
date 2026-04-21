# FMS_PROJECT_STATE.md

Handoff snapshot generated 2026-04-20. Source of truth: git HEAD `ae4ab81` (branch `main`), `APP_VERSION = "1.5.1"` in `src/App.jsx:12`.

## 1. What the app does

Master Garage Fleet Management System (MG-FMS) is a React SPA used by mechanics across 5 branches (Cavite, QC, Pampanga, Davao, Palawan) to run vehicle inspections, classify units as active/conditional/deferred, and track preventive maintenance. Assessments and PMS records persist to Firestore with offline-first caching. Photo evidence is captured via camera, compressed client-side, and stored inline as base64 in Firestore documents.

## 2. Tech stack (exact versions from `package.json`)

Runtime / dependencies:
- `react` ^19.2.4
- `react-dom` ^19.2.4
- `firebase` ^12.11.0
- `recharts` ^3.8.1

Dev / build:
- `vite` ^8.0.1
- `@vitejs/plugin-react` ^6.0.1
- `tailwindcss` ^3.4.19
- `postcss` ^8.5.8
- `autoprefixer` ^10.4.27
- `eslint` ^9.39.4 (flat config)
- `@eslint/js` ^9.39.4
- `eslint-plugin-react-hooks` ^7.0.1
- `eslint-plugin-react-refresh` ^0.5.2
- `@types/react` ^19.2.14
- `@types/react-dom` ^19.2.3
- `firebase-admin` ^13.7.0 (dev-dep only; no admin scripts in repo)
- `globals` ^17.4.0

Scripts (`package.json:6-11`):
```
npm run dev       # vite dev server
npm run build     # vite build → dist/
npm run preview   # vite preview
npm run lint      # eslint .
```

No test runner. No TypeScript. No React Router.

## 3. Folder structure (top 2 levels)

```
mg-fms-app/
├── .claude/                — Claude Code local config (untracked; present in git status)
├── .firebase/              — Firebase CLI deploy cache (hosting.ZGlzdA.cache)
├── .git/                   — git metadata
├── dist/                   — Vite production output (checked-in build artifacts: assets/, index.html, icons.svg, favicon.svg)
├── docs/                   — Walkthrough docs (untracked: MG-FMS-App-Walkthrough.md + .html)
├── node_modules/           — installed deps
├── public/                 — static served-as-is (favicon.svg, icons.svg)
├── src/                    — all application code
│   ├── App.jsx             — monolith: 1120 lines, entire UI + business logic
│   ├── firebase.js         — 114 lines; Firestore/Auth init + CRUD helpers + snapshot listeners
│   ├── main.jsx            — 9-line entry point
│   ├── App.css             — 184 lines (legacy; actual styling is Tailwind inline)
│   ├── index.css           — Tailwind directives (206 lines; includes print styles)
│   └── assets/             — hero.png, react.svg, vite.svg
├── CLAUDE.md               — project instructions for Claude Code
├── MG-FMS-Flowchart.mermaid— architecture flowchart
├── README.md               — stock Vite template readme (not project-specific)
├── eslint.config.js        — flat config; `varsIgnorePattern: '^[A-Z_]'`
├── firebase.json           — Firebase Hosting + Firestore config pointers
├── firestore.indexes.json  — empty (no composite indexes defined)
├── firestore.rules         — 3-collection ruleset (assessments, pms_records, users)
├── index.html              — Vite HTML shell
├── package.json / package-lock.json
├── postcss.config.js / tailwind.config.js / vite.config.js
├── .firebaserc             — default project `mg-fms`
├── .gitattributes / .gitignore
```

## 4. Firebase setup

**Project ID:** `mg-fms` (`src/firebase.js:13`, `.firebaserc`).

**Collections (`firestore.rules`):**
- `assessments` — auto-generated doc IDs; body includes `id` (timestamp), `header.plate`, `rwaNumber`, inspection results, photos (base64), `fmsStatus`, `resolvedByRwa`, `resolvedAt`, `submittedAt`.
- `pms_records` — doc ID = plate number; contains service item records.
- `users` — doc ID = auth UID; fields include `role` (`technician` | `supervisor` | `fleet_manager`), `name`, `branch`, `email`.

**Auth:** Email/password only (`signInWithEmailAndPassword`, `src/firebase.js:112`). No OAuth, no anonymous, no SMS.

**Security rules (`firestore.rules`):**
- `assessments`, `pms_records`: read/write if `request.auth != null` (any authenticated user).
- `users/{uid}`: read if authenticated; write only if `request.auth.uid == uid` OR the writer's own user doc has `role == "fleet_manager"`.
- Default deny catch-all.

**Indexes:** none defined (`firestore.indexes.json` is empty arrays).

**Hosting (`firebase.json`):**
- `public`: `dist`
- SPA rewrite: all paths → `/index.html`
- Ignore: `firebase.json`, `**/.*`, `**/node_modules/**`

**Offline persistence:** `initializeFirestore` with `persistentLocalCache({ tabManager: persistentMultipleTabManager() })` (`src/firebase.js:21-23`) — cache survives refresh, multi-tab supported.

**Write sanitization:** every write passes through `sanitizeForFirestore()` (`src/firebase.js:27-35`) which recursively converts `undefined` → `null`.

**API key exposed in source:** `src/firebase.js:11` (`apiKey: "AIzaSyAybPnwAjnUiNurQ0v_MHpRDW-rnEsFKGU"`). This is normal for Firebase web SDK (keys are public identifiers; access is gated by security rules) — flagging because it can surprise reviewers.

## 5. Current known issues

**TODO / FIXME / HACK / XXX markers in `src/`:** none. `grep -rn "TODO\|FIXME\|HACK\|XXX" src/` returns zero hits.

**Issues inferred from recent "fix" commits** (latest → oldest):

- `ae4ab81` (v1.5.1, 2026-04-14) — `fix: resolve-banner on superseded RWAs, PMS Due filters stale codes, demo cleanup tool`
  - Resolve-banner previously showed on RWAs that had already been superseded.
  - PMS Due list previously surfaced stale inspection codes (filter added).
  - Demo cleanup tool added to wipe seeded demo data.
- `a9d8041` (v1.5.0, 2026-04-14) — `feat: unify quick fix under re-assessment, fix deferred persistence, photo picker, submit guard`
  - Deferred status previously failed to persist on resubmit; migration loop at `src/App.jsx:861` auto-patches old records that lacked `resolvedByRwa`/`resolvedAt`.
  - Quick-fix flow was a separate screen; now folded into re-assessment.
  - Photo picker + submit double-press guard added.
- `8ad2924` (v1.3.0, 2026-03-31) — `feat: PDF reports, quick fix, photo compression, analytics charts, bug fixes`
  - Photos exceeded Firestore's 1 MiB doc limit before compression + `trimPhotosToFit` (used at `src/App.jsx:899`).

**Silent-swallow `catch` blocks that can hide runtime errors:**
- `src/App.jsx:798-799` — reads of `fms:mechanic:v1` and `fms:vehicleRegistry:v1` swallow JSON parse errors with `catch(_){}`.
- `src/App.jsx:267, 288, 429, 435, 775-777, 834, 897, 901` — sessionStorage/localStorage reads/writes all swallow errors silently.
- `src/App.jsx:1062` — `saveUserProfile` failure during mechanic save is swallowed.
- `src/firebase.js` listeners (`onAssessmentsSnapshot`, `onPMSRecordsSnapshot`) log to `console.error` but surface to UI only via the optional `onErr` callback.

**Error-log pressure:** `fms:errors` in localStorage is capped at 100 entries (`src/App.jsx:19`). The `ErrorBoundary` class (`src/App.jsx:29-38`) is the only crash UI; it renders a copy-to-clipboard report and a reload button.

**Open issues file:** none exists in the repo. No `ISSUES.md`, no GitHub issues backlog was inspected.

## 6. Recent changes — last 10 commits

Only 6 commits exist on `main`:

```
ae4ab81  2026-04-14  fix: resolve-banner on superseded RWAs, PMS Due filters stale codes, demo cleanup tool v1.5.1
a9d8041  2026-04-14  feat: unify quick fix under re-assessment, fix deferred persistence, photo picker, submit guard v1.5.0
b959065  2026-04-07  feat: user management, labor types, auto-link inspections to PMS, photo trimming, pre-dispatch flow v1.4.0
8ad2924  2026-03-31  feat: PDF reports, quick fix, photo compression, analytics charts, bug fixes v1.3.0
305018d  2026-03-30  feat: add brake replacement PMS category v1.2.0
7e875d6  2026-03-28  Initial commit
```

**Uncommitted at snapshot time** (`git status`):
- `M .firebase/hosting.ZGlzdA.cache` — Firebase CLI cache churn; ignore.
- `M src/App.jsx` — unstaged work-in-progress. Not inspected in this handoff.
- `?? .claude/` — local Claude Code config.
- `?? docs/` — untracked walkthrough files (`MG-FMS-App-Walkthrough.md` / `.html`).

## 7. Half-finished or broken surfaces

- **`src/App.jsx` has uncommitted modifications** — an in-progress edit exists at HEAD; treat any analysis of "current" behavior as needing a re-read before action.
- **Monolith risk.** `src/App.jsx` = 1120 lines, dense single-line style; the main `App()` begins ~line 700 after ~700 lines of constants, catalogs, and sub-components. No module boundaries, no code splitting. Refactors have high blast radius.
- **No tests.** Zero coverage for the classification engine (`runEngine`), health score (`calcHealthScore`), PMS due calculations (`calcNextDue`, `pmsUrgency`), or action recommender (`getAction`). All business-critical.
- **Migration loop runs every login** (`src/App.jsx:861`) — backfills `resolvedByRwa`/`resolvedAt` on old deferred records. Intended as a one-time fix; still live. Should be idempotency-guarded or removed once fleet is migrated.
- **Stock Vite README.** `README.md` is the default `create-vite` template — no project documentation at repo root (real docs live in `CLAUDE.md` and `docs/MG-FMS-App-Walkthrough.md`, the latter untracked).
- **`dist/` is present and built** but `.gitignore` status for it was not verified here; if tracked, builds will churn the working tree.
- **Demo data embedded in source.** `DEMO_ASSESSMENTS` / `DEMO_PMS_RECORDS` ship inside `App.jsx` and seed initial state pre-Firestore load. v1.5.1 added a "demo cleanup tool" — implies prod users were seeing demo rows. Verify the tool is reachable only to `fleet_manager`.
- **Photo storage in Firestore.** Base64 inline in documents; `trimPhotosToFit` (`src/App.jsx:899`) and `compressImage` (max 800px, JPEG q=0.7) are the only guards against the 1 MiB doc cap. No migration path to Firebase Storage.
- **`firebase-admin` is a dev-dep but no admin scripts exist in the repo** — unused or scripts live outside the tree.
- **`App.css` (184 lines) contradicts the "all-Tailwind" convention in `CLAUDE.md`.** Either legacy dead weight or silently applied; audit before deleting.
- **No composite Firestore indexes** while client code calls `query(... where('header.plate', '==', plate))` (`src/firebase.js:74`). Single-field where on a nested path works without an index but watch for future listener queries that combine filters.
- **Firestore listeners load all docs client-side** (`onAssessmentsSnapshot` at `src/firebase.js:80-87`) and sort in JS. Scales poorly past a few thousand assessments.
