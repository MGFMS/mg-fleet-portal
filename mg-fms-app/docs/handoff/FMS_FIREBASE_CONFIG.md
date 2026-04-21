# FMS_FIREBASE_CONFIG.md

Firebase configuration reference for MG-FMS at git HEAD `ae4ab81`. No secrets, API keys, or private values included — only file structure, rule logic, variable names, and deployment commands.

## 1. `firebase.json` — explained

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

**Hosting block:**
- `public: "dist"` — Firebase Hosting serves the Vite production build output directory. `npm run build` must run before `firebase deploy`.
- `ignore` — excludes `firebase.json` itself, any dotfiles (`**/.*`), and `node_modules/` from upload. There is no separate `.firebaseignore` file; this list is the deploy filter.
- `rewrites` — single catch-all that sends every path to `/index.html`. This is the SPA fallback: deep links like `/history` or `/vehicle/UFF%204915` reach the React app instead of 404ing. Note the app does not actually use routes (all navigation is state-driven via the `screen` variable), so this rewrite is defensive only.
- No `headers`, no `redirects`, no `cleanUrls`, no `trailingSlash`, no `site` override — the default site for project `mg-fms` is used.

**Firestore block:**
- `rules: "firestore.rules"` — security rules source file (see §2).
- `indexes: "firestore.indexes.json"` — composite-index config. Current file is `{"indexes":[],"fieldOverrides":[]}` (empty; no composite indexes defined).

**Not configured:** Functions, Storage, Realtime Database, App Hosting, Emulator Suite, Remote Config, Extensions, Data Connect. No `functions`, `storage`, or `emulators` blocks exist.

## 2. `firestore.rules` — plain English

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /assessments/{docId} {
      allow read, write: if request.auth != null;
    }

    match /pms_records/{docId} {
      allow read, write: if request.auth != null;
    }

    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        request.auth.uid == uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "fleet_manager"
      );
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Rule-by-rule:

| Path | Who can read | Who can write | Plain English |
|---|---|---|---|
| `assessments/{docId}` | any signed-in user | any signed-in user | Any authenticated user — technician, supervisor, or fleet manager — can read and write every inspection document. Branch scoping is enforced only in the UI (`src/App.jsx:913`); a technician with SDK access can still read any branch's data. |
| `pms_records/{docId}` | any signed-in user | any signed-in user | Same posture as `assessments`. Plate-keyed service records are fully shared across branches. |
| `users/{uid}` | any signed-in user | `request.auth.uid == uid` OR the caller's own `users/{auth.uid}` doc has `role == "fleet_manager"` | Anyone signed in can read the whole user directory (names, emails, roles, branches). Writes are restricted: a user can edit their own profile (name, branch), and fleet managers can edit anyone's profile including role. The `get(...).data.role` lookup is a cross-doc read inside rules — it counts against the "up to 10 document accesses" rule budget. |
| `/{document=**}` (catch-all) | nobody | nobody | Any collection or document not explicitly matched above is denied. Default-deny posture. |

**Security gaps worth noting** (not a recommendation, just disclosure):
- Unauthenticated reads are blocked everywhere (auth-gated), but within the authenticated set there is no role-based read restriction on `assessments` or `pms_records`.
- No field-level validation. A technician could write arbitrary shapes into any `assessments` doc, including overwriting `classification` or `supervisorCleared`.
- No rate limiting, no size caps; the 1 MiB per-document Firestore ceiling is the only hard limit (relevant because photos are stored as base64 inline; `trimPhotosToFit` at `src/App.jsx:202` is the client-side guard).

## 3. Environment variables

**No `.env`, `.env.local`, `.env.production`, or any variant file exists in the repo root or in `src/`.**

**No `import.meta.env.*` or `process.env.*` references in `src/`** (confirmed via grep for `import.meta.env|process.env|VITE_` across `src/`).

The Firebase web client config — `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` — is hardcoded in `src/firebase.js:10-17`. This is conventional for Firebase web: the `apiKey` is a public identifier, not a secret, and access is governed by `firestore.rules`.

**Variable names that would be used if env-based config were added** (none of these exist today):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

`.gitignore` covers `*.local` (line 13) which would catch `.env.local` if it were introduced, but `.env` itself is not explicitly ignored — worth adding if env-based config is adopted.

## 4. Deployment

**Project target:** `mg-fms` (set in `.firebaserc`):

```json
{
  "projects": {
    "default": "mg-fms"
  }
}
```

**Default hosting URLs** (Firebase provisions both automatically for any Hosting-enabled project):
- `https://mg-fms.web.app`
- `https://mg-fms.firebaseapp.com`

No custom domain, no hosting `site` override in `firebase.json`, no deploy targets aliasing.

**Build + deploy commands** (run from repo root):

```bash
# Full deploy (hosting + firestore rules + indexes)
npm run build
firebase deploy

# Scoped deploys
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only firestore          # rules + indexes together
```

**CLI authentication** (one-time per machine):

```bash
firebase login
firebase use mg-fms     # explicit project selection, optional since .firebaserc sets default
```

**Deploy cache:** `.firebase/hosting.ZGlzdA.cache` is regenerated on each hosting deploy (tracked in git — intentionally or not). `ZGlzdA` is base64 for `dist`.

**Pre-deploy checklist the repo does not enforce:**
- `npm run build` must succeed and populate `dist/`.
- No `predeploy` hook is declared in `firebase.json`, so `firebase deploy` will happily upload a stale `dist/` if the build step is skipped.

## 5. Firebase Functions

**None.** No `functions/` directory, no `functions` block in `firebase.json`, no `firebase-functions` dependency in `package.json`.

The `firebase-admin` package **is** listed as a `devDependency` in `package.json:27` (version `^13.7.0`), but no admin scripts exist anywhere in the tree. It is effectively an unused dependency — possibly left over from exploration or used out-of-band by an operator.

All backend logic is therefore executed client-side: classification engine (`runEngine`, `src/App.jsx:191`), health score, PMS due calculations, auto-link inspection→PMS, one-time deferred-RWA migration (`src/App.jsx:850`), and user-profile bootstrap on first login (`src/App.jsx:822-828`). There are no server triggers, scheduled jobs, or callable endpoints.
