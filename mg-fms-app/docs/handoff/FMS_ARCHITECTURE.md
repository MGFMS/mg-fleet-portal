# FMS_ARCHITECTURE.md

Architecture reference for MG-FMS at git HEAD `ae4ab81`, `APP_VERSION = "1.5.1"`. All line numbers point into `src/App.jsx` unless another file is named. Uncommitted working-tree edits to `src/App.jsx` are not reflected here.

## 1. Data flow — app open → assessment saved

### Bootstrap (every mount)

1. `src/main.jsx` mounts `<AppWithErrorBoundary/>` (`src/App.jsx:772`), which wraps the real `App()` (`src/App.jsx:779`) inside the `ErrorBoundary` class (`src/App.jsx:29`).
2. `App()` restores in-progress state from `sessionStorage["fms:session:v1"]` via `loadSession()` (`src/App.jsx:775`) into initial `useState` values — `screen`, `header`, `itemResults`, `expandedCat`, `currentA`, `vehiclePlate`, `reAssessFrom`, `reassessMode`, filter selections.
3. A `useEffect` subscribes to Firebase auth: `onAuth(u => setUser(u); setAuthLoad(false))` (`src/App.jsx:793`), which wraps `onAuthStateChanged(auth, cb)` in `src/firebase.js:115`.
4. While `authLoad` is true → splash screen (`src/App.jsx:920`). When auth resolves with no `user` → login form (`src/App.jsx:921`).

### Post-login data load

A second `useEffect` (`src/App.jsx:794-846`) runs when `(authLoad, user, retryKey)` change. If `user` is set:

1. `setLoadError(null); setLoading(true); setConnStatus("connected")`.
2. Pull cached technician profile from `localStorage["fms:mechanic:v1"]` and vehicle cache from `localStorage["fms:vehicleRegistry:v1"]` (`src/App.jsx:798-799`).
3. `waitForAuthToken(user)` (`src/firebase.js:38`) forces ID-token refresh so Firestore listeners don't race auth.
4. `getUserProfile(user.uid)` (`src/firebase.js:98`). Three branches:
   - **Profile exists** → set `userRole`, `userProfile`; also auto-promote `edejercito@gmail.com` to `fleet_manager` if still `technician` (`src/App.jsx:815-819`).
   - **No profile + no users exist yet** → first-user gets `fleet_manager`; subsequent users get `technician`. Profile is written via `saveUserProfile(user.uid, {...})` (`src/App.jsx:822-828`).
   - **`getUserProfile` throws** → fallback to local-only `technician` profile, logged via `logError("getUserProfile", e)` (`src/App.jsx:830`).
5. Attach realtime listeners:
   - `onAssessmentsSnapshot(cb, handleListenerError)` (`src/firebase.js:80`) — streams all `assessments/*`, sorts by `submittedAt` desc client-side, emits `{...data, id, _docId}`. Handler calls `setAssessments(data)` and recomputes `vehicleRegistry` via `buildVehicleRegistry(data, savedLocalReg)` (`src/App.jsx:104`, `:832-837`).
   - `onPMSRecordsSnapshot(cb, handleListenerError)` (`src/firebase.js:89`) — streams all `pms_records/*` keyed by plate. Handler calls `setPmsRecords(data)` (`src/App.jsx:838-841`).
6. `checkReady()` clears the loading splash only after both snapshots have fired and the profile is resolved.
7. On unmount or cancel, both `unsub*` functions are invoked (`src/App.jsx:845`).

A separate one-time migration `useEffect` (`src/App.jsx:850-864`, guarded by `migratedRef`) walks the assessment list, groups by plate, and for each plate with a newer non-deferred assessment, backfills `resolvedByRwa`/`resolvedAt` onto stale deferred docs via `updateAssessment(_docId, ...)`.

### Dashboard → New assessment

1. User taps "Start New Assessment" → `startNew()` (`src/App.jsx:879`): seeds `header` with `mechanic.name`/`mechanic.branch`, resets `itemResults`, sets `screen="new"`.
2. **`screen==="new"`** (`src/App.jsx:955`): header form. `useEffect` at `src/App.jsx:865` watches `header.plate` and auto-fills make/model/yearModel/client from `vehicleRegistry` when the plate is known.
3. Validation: `headerOk = header.plate && header.make && header.model && ... && odoValid` (`src/App.jsx:911`). `odoValid` enforces monotonic odometer against `vehicleRegistry[plate].lastOdo` (`src/App.jsx:910`).
4. Continue → if `reassessMode==="quickfix"` → `screen="quickfix"`; else `screen="inspect"` (`src/App.jsx:966`).

### Inspect screen

1. **`screen==="inspect"`** (`src/App.jsx:971`) renders `<CatCard/>` (`src/App.jsx:250`) per category in `activeCats` (filtered by `getActiveItems(header.type, reAssessFrom)` at `src/App.jsx:180`). For `Pre-Dispatch` only `PRE_DISPATCH_ITEMS` (`src/App.jsx:179`) are shown; for `Re-Assessment` only items flagged `fail_critical`/`monitor` in the previous assessment.
2. Each `<InspItem/>` (`src/App.jsx:208`) lifts result changes into `itemResults` via `onChange(code, val)` → `setItemResults(prev => ({...prev, [code]: val}))` (`src/App.jsx:980`).
3. For `measurable` items, entering a `measuredValue` auto-sets `resultCode` to `pass` or `fail_critical` based on `item.threshold` (`src/App.jsx:216`).
4. Photos captured via `<PhotoCapture/>` (`src/App.jsx:206`) — camera or gallery input → `compressImage(file, 600, 0.5)` (`src/App.jsx:199`) → base64 data URL appended to `value.photos`.
5. A live preview of the engine result is computed on every change: `liveEng = runEngine(itemResults)` (`src/App.jsx:874`, engine at `:191`). It is used only for UI badges (blockers / critical counts), not persisted.
6. Continue enabled when `answered === total` → `goToPMS()` → `screen="pms"`.

### PMS screen + submit

1. **`screen==="pms"`** renders `<PMSScreen/>` (`src/App.jsx:264`).
2. PMSScreen auto-checks and prefills service items when the inspection marked the corresponding item `replaced` — mapped via `INSP_TO_PMS` (`src/App.jsx:98`, effect at `:291`).
3. Local state (`checkedItems`, `serviceDetails`, `ecuData`, `laborTypes`, `otherLabor`, `otherNote`, `pmsNotes`) is auto-persisted to `sessionStorage["fms:draft:pms:v1"]` on every change (`src/App.jsx:288`).
4. Submit button (`src/App.jsx:417`) invokes `onSubmit(payload)` where `payload = {items, serviceDetails, ecuData, laborTypes, otherLabor, otherNote, notes, updates}`. `updates` is computed by `buildUpdates()` (`src/App.jsx:305`) using `calcNextDue(odometer, date, kmInterval, monthInterval)`.
5. `onSubmit` === `submitWithPMS(pmsData, itemResultsOverride?)` (`src/App.jsx:883`):
   - Guard via `submittingRef` to prevent double-submit.
   - Compute final classification: `cls = runEngine(effectiveResults)` (`src/App.jsx:888`).
   - Generate `rwaNumber = "RWA-" + year + "-" + last6(Date.now())` (`src/App.jsx:889`). **AMBIGUOUS:** two assessments submitted within the same millisecond in the same year would collide; there is no uniqueness check.
   - If `header.type === "Re-Assessment"` and `cls.overallStatus !== "deferred"`, collect all prior `deferred` assessments for the plate not already resolved → stamp this new RWA as the resolver (`src/App.jsx:891-893`).
   - Build document `a = {id: Date.now(), rwaNumber, header, itemResults, classification: cls, pmsData, fmsStatus: "pending_sync", submittedAt, resolvesRwa, resolvesRwaList}` (`src/App.jsx:894`).
   - **Optimistic local update first**: `setAssessments([a, ...assessments].map(markResolved))` (`src/App.jsx:895-896`). This paints the result screen immediately; the snapshot listener will later merge the canonical version.
   - Update `vehicleRegistry[plate]` in state and in `localStorage["fms:vehicleRegistry:v1"]` (`src/App.jsx:897`).
   - Update resolved deferred docs in Firestore via `updateAssessment(d._docId, {resolvedByRwa, resolvedAt})` (`src/App.jsx:898`).
   - Persist the new assessment: `trimPhotosToFit({...a, fmsStatus:"synced"}, 900000)` (`src/App.jsx:202`) strips photos in a priority order (ECU → PMS service → PMS updates → ECU codes → item results) until the serialized doc is under 900 KB, then `saveAssessment(toSave)` (`src/firebase.js:50`) → `addDoc(collection(db,'assessments'), sanitizeForFirestore(...))`.
   - Persist PMS updates: merge `pmsData.updates` into `pmsRecords[plate]`, then `persistPMS(records)` calls `savePMSRecord(plate, data)` (`src/firebase.js:65`) per plate with `{merge:true}`.
   - Clear session drafts; set `currentA = a`; `setScreen("result")` (`src/App.jsx:901-902`).
6. Any thrown error inside `submitWithPMS` is caught and `logError("submitWithPMS", e, {plate, branch, type})` writes to `localStorage["fms:errors"]` (`src/App.jsx:14`); no user-visible error dialog is shown, though the inner `saveAssessment` catch swallows sync failures silently (`src/App.jsx:899`).

### Session persistence

A `useEffect` (`src/App.jsx:791`) writes the active flow state to `sessionStorage["fms:session:v1"]` whenever any tracked field changes, **unless** `screen` is one of `dashboard|history|analytics|settings|users` — those reset the session via `clearSession()` (`src/App.jsx:777`). Result: accidental refresh mid-flow restores; switching back to a main tab discards restore state.

## 2. Firestore schema (observed from code that writes these collections)

Types are JS types, inferred from the producers. `null` means explicitly written (`sanitizeForFirestore` converts `undefined → null`, `src/firebase.js:27`).

### `assessments/{auto_doc_id}`

Written by `saveAssessment` (`src/firebase.js:50`) and `updateAssessment` (`src/firebase.js:54`). Shape built at `src/App.jsx:894`, mutated downstream.

```
{
  id:                 number           // timestamp from Date.now()
  rwaNumber:          string           // "RWA-YYYY-NNNNNN"
  submittedAt:        string           // ISO 8601
  fmsStatus:          "pending_sync" | "synced"
  header: {
    plate:            string           // uppercased, e.g. "UFF 4915"
    make:             string
    model:            string
    yearModel:        string           // stored as string despite type="number" input
    client:           string           // one of CLIENTS (src/App.jsx:10)
    branch:           string           // one of BRANCHES (src/App.jsx:9)
    technician:       string
    type:             "Initial" | "Periodic" | "Re-Assessment" | "Pre-Dispatch"
    odometer:         string           // numeric string
    date:             string           // YYYY-MM-DD
  }
  itemResults: {
    [itemCode]: {
      resultCode:     "pass" | "monitor" | "fail_critical" | "replaced" | "na" | null
      defectCode?:    string | null    // one of DEFECT_CODES keys (src/App.jsx:110)
      measuredValue?: string           // numeric string, measurable items only
      afterMeasure?:  string           // numeric string, set on "replaced"
      partReplaced?:  string | null    // free text
      partQty?:       number           // 1..n
      note?:          string
      photos?:        string[]         // base64 data URLs ("data:image/jpeg;base64,...")
    }
  }
  classification: {                    // output of runEngine (src/App.jsx:191)
    overallStatus:          "active" | "conditional" | "deferred"
    technicalStatus:        same values
    complianceStatus:       "compliant" | "non_compliant"
    dispatchAllowed:        boolean
    dispatchBlockers:       string[]   // item codes
    failCriticalCount:      number
    monitorCount:           number
    replacedCount:          number
    reassessmentRequired:   boolean
    reassessmentDue:        string | null   // YYYY-MM-DD; +3d deferred, +30d conditional
    totalBlockerCount:      number
  }
  pmsData: {                           // null when no PMS/ECU/labor recorded
    items:          { [pmsCode]: boolean }
    serviceDetails: { [pmsCode]: { qty: number, photos: string[], brand: string } }
    ecuData: {
      performed:  boolean
      codes:      [{ code: string, description: string, photo: string | null }]
      scanNotes:  string
      photos:     string[]
    } | null                            // null in QuickFix path
    laborTypes:  [{ code: string, label: string }]
    otherLabor:  string | null
    otherNote:   string | null
    notes:       string
    updates: {
      [pmsCode]: {
        lastDate:    string   // YYYY-MM-DD
        lastOdo:     number
        nextOdo:     number | null
        nextDate:    string | null
        performedBy: string
        rwaNumber:   string   // "PENDING" in QuickFix; overwritten after submit
        brand:       string | null
        qty:         number
        photos:      string[]
      }
    }
  } | null

  // Re-Assessment / resolution metadata
  resolvesRwa:       string | null            // RWA this submission resolves
  resolvesRwaList:   string[] | null          // when >1 deferred resolved at once
  resolvedByRwa:     string                   // stamped on older deferred doc when a newer submit clears it
  resolvedAt:        string                   // ISO 8601, set with resolvedByRwa

  // Supervisor override (written by handleSupervisorSave, src/App.jsx:907 — AMBIGUOUS: only in local state, no Firestore write in that handler)
  supervisorCleared?:  boolean
  supervisorName?:     string
  supervisorRemarks?:  string
  supervisorTs?:       string                 // ISO 8601

  // Client-only ephemera on the snapshot-returned record
  _docId:            string                   // Firestore doc ID (added by listener, NOT written)
  adjustedResults?:  object                   // AMBIGUOUS: referenced in Report UI (src/App.jsx:1043) but never written by submitWithPMS or QuickFixScreen
  quickFixes?:       object                   // AMBIGUOUS: same — referenced at src/App.jsx:1043 but no producer found in this file
}
```

> **AMBIGUOUS (assessments):**
> - `supervisorCleared`/`supervisorName`/`supervisorRemarks`/`supervisorTs` are applied by `handleSupervisorSave` (`src/App.jsx:907`) to local state only — there's no `updateAssessment` call in that function. Either overrides are lost on refresh, or the write is elsewhere (not found in this file).
> - `adjustedResults` and `quickFixes` are read by the Report renderer (`src/App.jsx:1043`) but I cannot find where they're written. Possibly legacy fields or set by an external tool. Worth clarifying.

### `pms_records/{plate}` — doc ID = plate string (e.g. `"UFF 4915"`)

Written by `savePMSRecord(plate, data)` with `{merge:true}` (`src/firebase.js:65`). Body is a flat map of PMS codes to per-service records; shape from `buildUpdates` (`src/App.jsx:305`) with the submit-time rewrite at `src/App.jsx:900`.

```
{
  [pmsCode: "PMS_OIL" | "PMS_BRAKE_PAD_F" | ... (30+ codes, src/App.jsx:41)]: {
    lastDate:    string   // YYYY-MM-DD
    lastOdo:     number
    nextOdo:     number | null   // null for "on-demand" items (kmInterval === null)
    nextDate:    string | null
    performedBy: string          // technician name
    rwaNumber:   string          // linked RWA
    branch:      string          // stamped at submit time (src/App.jsx:900)
    brand:       string | null
    qty:         number
    photos:      string[]        // base64 data URLs
  }
}
```

> **AMBIGUOUS (pms_records):** `DEMO_PMS_RECORDS` (`src/App.jsx:106`) also stores legacy flat records without `brand`/`qty`/`photos` (e.g. `PMS_BRAKE` — note: this code is not in the current `PMS_ITEMS` catalog). `PMS_CODES` filter at `src/App.jsx:943` drops stale codes from the dashboard. Database may contain records with codes that no longer exist in the client.

### `users/{uid}` — doc ID = Firebase Auth UID

Written by `saveUserProfile(uid, data)` with `{merge:true}` (`src/firebase.js:103`). Shape from first-login bootstrap (`src/App.jsx:826`) and later mutations (`src/App.jsx:1062`, `:1092`, `:1093`, `:817`).

```
{
  role:       "technician" | "supervisor" | "fleet_manager"
  name:       string
  branch:     string          // one of BRANCHES, or "" for all branches
  email:      string          // from firebase auth user.email
  createdAt:  string          // ISO 8601, set only on first-login bootstrap
}
```

> **AMBIGUOUS (users):** `uid` appears on the object returned by `getUserProfile` but is added by the helper itself (`src/firebase.js:100`) — it's the doc ID, not a stored field.

## 3. Auth flow

### Sign-in

1. Unauthenticated state shows the login form (`src/App.jsx:921`). The form submits via `handleLogin()` (`src/App.jsx:878`):
   ```
   await login(email, pass)
   ```
   where `login = (email, pass) => signInWithEmailAndPassword(auth, email, pass)` (`src/firebase.js:112`). Any rejection → `setLoginErr('Invalid email or password. Please try again.')`.
2. There is no sign-up UI. New users are **provisioned outside the app** (Firebase console or out-of-band script) and their `users/{uid}` profile is auto-created on first successful sign-in (`src/App.jsx:822-828`).

### Auth state

- Single source of truth: the `auth` object from `getAuth(app)` (`src/firebase.js:24`).
- `App` subscribes once with `onAuth(cb)` which wraps `onAuthStateChanged` (`src/App.jsx:793`, `src/firebase.js:115`). That callback sets `user` and `authLoad`.
- Persistence: default Firebase web SDK behavior (IndexedDB) — the session outlives refreshes without any custom persistence code.
- ID-token freshness is forced before Firestore listeners attach via `waitForAuthToken(user) → user.getIdToken(true)` (`src/firebase.js:38`).
- Sign-out: `logout()` (`src/firebase.js:114`) calls `signOut(auth)`. Invoked from Settings (`src/App.jsx:1069`) and from the load-error screen (`src/App.jsx:923`).

### "Protected routes"

There is **no router**. Access control is three layers:

1. **Top-level gate** (`src/App.jsx:920-923`): `authLoad` → splash; `!user` → login form; `loading` → splash; `loadError` → error screen. Nothing below the login branch ever renders for an unauthenticated user.
2. **Role gates via `canAccess(role, feature)`** (`src/App.jsx:8`):
   - `fleet_manager` → everything.
   - `supervisor` → everything except `user_management`.
   - `technician` → excluded from `analytics`, `supervisor_override`, `user_management`, `export`.
   Applied in: `navTabs` (`src/App.jsx:930`) hides buttons; `screen==="analytics"` redirects unprivileged users (`src/App.jsx:1058-1059`); `screen==="users"` only renders when allowed (`src/App.jsx:1082`); Settings hides Data Management and the supervisor override button (`src/App.jsx:1050`, `:1074`).
3. **Branch scoping in state** (`src/App.jsx:913`): `branchFiltered = userRole==="technician" && userProfile?.branch ? assessments.filter(a => a.header.branch === userProfile.branch) : assessments`. Technicians only see their branch's assessments even though `firestore.rules` allows any authenticated read.

> **AMBIGUOUS (security):** `firestore.rules` permits any authenticated user to read all `assessments` and `pms_records`. The technician branch filter at `src/App.jsx:913` is **UI-only** — a technician can still read every branch's data via the Firebase SDK directly. If branch-scoping is a security requirement, rules need to be tightened.

## 4. Top 10 components (by importance)

All paths `src/App.jsx` unless noted.

| # | Component | File:Line | One-line |
|---|---|---|---|
| 1 | `App` | `src/App.jsx:779` | Root stateful shell — owns auth, Firestore listeners, screen routing, assessment submit pipeline, and all top-level state. |
| 2 | `AppWithErrorBoundary` / `ErrorBoundary` | `src/App.jsx:772` / `:29` | Default export wrapper + class boundary that catches render crashes, logs them, and shows a copy-to-clipboard recovery UI. |
| 3 | `PMSScreen` | `src/App.jsx:264` | Step-3 service/PMS capture: ECU DTCs, labor types, scheduled items with brand/qty/photos; auto-links replaced inspection items; calls `submitWithPMS`. |
| 4 | `InspItem` | `src/App.jsx:208` | The atomic inspection-item row — 5-way result picker, measurable threshold gate, defect chips, replacement details, photo capture. |
| 5 | `QuickFixScreen` | `src/App.jsx:425` | Alternate Re-Assessment path that skips inspection and lets mechanic document replacements for previously-flagged items plus labor; shares `submitWithPMS`. |
| 6 | `CatCard` | `src/App.jsx:250` | Collapsible category wrapper that renders `<InspItem/>`s, tracks progress per category, and exposes "mark all remaining as Pass". |
| 7 | `VehicleProfile` | `src/App.jsx:501` | Per-plate dashboard: health score, repeat-defects detector, measurable trend mini-charts, full assessment history, and PMS schedule. |
| 8 | `Analytics` | `src/App.jsx:691` | Recharts-driven dashboard: fleet health donut, monthly stacked bars, top defects, branch/client splits, reassessment queue. |
| 9 | `PrintableReport` / `Report` | `src/App.jsx:526` / `:662` | Hidden DOM portal rendered for `window.print()` → full PDF-style assessment report with all findings, photos, and PMS service log. |
| 10 | `UserManagement` | `src/App.jsx:1089` | Fleet-manager-only screen: lists `users/*`, inline-edits role and branch via `saveUserProfile`. |

Supporting (below the top 10 but widely used): `ACard` (`:256`), `PhotoCapture` (`:206`), `PhotoLightbox` (`:204`), `TopBar` (`:197`), `SupervisorPanel` (`:499`), `Badge` (`:196`), `ChartCard` (`:688`).

## 5. External dependencies — what's load-bearing

Runtime deps (`package.json`):

- **`firebase` ^12.11.0** — absolutely load-bearing. The only backend. Provides `initializeApp`, `getAuth` (email/password auth), `initializeFirestore` (+ `persistentLocalCache` + `persistentMultipleTabManager` for offline), and the Firestore CRUD/listener API. Replacing it requires rewriting `src/firebase.js` plus the auth and Firestore listener wiring in `App()`. Used in `src/firebase.js:1-8` and imported throughout `src/App.jsx:3`.
- **`react` ^19.2.4 + `react-dom` ^19.2.4** — UI framework. One class component (`ErrorBoundary`), everything else is hooks. `react-dom`'s `createPortal` (`src/App.jsx:2`) is used specifically to render `PrintableReport` into an offscreen portal for `window.print()` (`src/App.jsx:681`).
- **`recharts` ^3.8.1** — charting. Only used inside `Analytics` (`src/App.jsx:691`) and implicitly `VehicleProfile` trend bars (though those use hand-rolled divs, not Recharts — AMBIGUOUS: VehicleProfile does not actually import Recharts components). Components used: `PieChart`, `Pie`, `Cell`, `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer` (imported at `src/App.jsx:5`). Removing Recharts would gut the Analytics screen only.

Dev/build deps — load-bearing for build pipeline only:

- **`vite` ^8.0.1 + `@vitejs/plugin-react` ^6.0.1** — dev server, HMR, production bundler. Entry point is `index.html` → `src/main.jsx`.
- **`tailwindcss` ^3.4.19 + `postcss` ^8.5.8 + `autoprefixer` ^10.4.27** — styling. All component styles are Tailwind utility classes inline. `src/index.css` is Tailwind directives + print styles. Removing Tailwind breaks every screen visually.
- **`eslint` ^9.39.4 + `@eslint/js` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` + `globals`** — lint only; not a runtime concern.
- **`@types/react` + `@types/react-dom`** — type declarations. AMBIGUOUS: no `tsconfig.json` and no `.ts`/`.tsx` files in `src/`; types are unused unless an editor consumes them.
- **`firebase-admin` ^13.7.0** — AMBIGUOUS: listed as a dev-dep but there are no admin scripts in the repo tree. Dead dep unless scripts live outside `src/`.
