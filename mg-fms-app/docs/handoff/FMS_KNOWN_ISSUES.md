# FMS_KNOWN_ISSUES.md

Targeted scan for two issue classes at git HEAD `ae4ab81`. All line numbers correspond to the files on disk at scan time.

## TL;DR

- **Firestore undefined:** the `sanitizeForFirestore()` helper at `src/firebase.js:27-35` is a blanket net that recursively replaces any `undefined` with `null` before every write. Every write helper routes through it. Raw `undefined` therefore does **not** reach Firestore in any code path found. What *does* happen: upstream code emits `undefined` liberally and relies on this net, and one failure mode (`NaN`) bypasses the net entirely.
- **Auth races:** the main load effect is well-guarded, but there is one real listener-leak race in the load effect's async body, one unguarded `await` chain in `UserManagement`, and the `saveMech` + `handleCopyShare` paths touch `user.uid` / `user.email` without re-checking `user` is non-null.

---

## 1. Firestore `undefined` field scan

### 1.1 Every Firestore write site (all routed through `sanitizeForFirestore`)

```
src/firebase.js:51   saveAssessment         → addDoc  ('assessments')      — body sanitized
src/firebase.js:55   updateAssessment       → setDoc  ('assessments', id)  — body sanitized, merge:true
src/firebase.js:66   savePMSRecord          → setDoc  ('pms_records', plate) — body sanitized, merge:true
src/firebase.js:70   deletePMSRecord        → deleteDoc — no body
src/firebase.js:76   deleteAssessmentsByPlate → deleteDoc — no body
src/firebase.js:104  saveUserProfile        → setDoc  ('users', uid)       — body sanitized, merge:true
```

The sanitizer:

```js
// src/firebase.js:27-35
function sanitizeForFirestore(obj) {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, sanitizeForFirestore(v)])
  );
}
```

**Limitation:** only converts `undefined` → `null`. It does **not** convert `NaN` or `Infinity`, and it silently rewrites semantics (a field the caller meant to omit becomes a field explicitly set to `null`, which `{merge:true}` will clobber over any prior value).

### 1.2 Call sites that emit `undefined` (relying on the sanitizer)

#### A. `QuickFixScreen.handleSubmit` — two explicit `undefined` assignments

```js
// src/App.jsx:450
newItemResults[i.code]={
  resultCode:"replaced",
  defectCode:prev.defectCode||null,
  measuredValue:prev.measuredValue,                // ← undefined if prev doc never measured
  partReplaced:r.partReplaced.trim(),
  partQty:r.qty||1,
  afterMeasure:r.afterMeasure||undefined,          // ← EXPLICIT undefined
  note:r.note.trim()||undefined,                   // ← EXPLICIT undefined
  photos:r.photos||[]
};
```

Fields that can leave this call site as `undefined`:

| Field | Why |
|---|---|
| `itemResults[code].measuredValue` | `prev.measuredValue` is undefined for items that were never a `measurable` type, and for `monitor`/`fail_critical` items without a reading. |
| `itemResults[code].afterMeasure` | Literal `r.afterMeasure||undefined`. `canSubmit` (App.jsx:442) only enforces `afterMeasure` for `measurable` items; for `condition`-typed items it stays empty string → `||undefined` → `undefined`. |
| `itemResults[code].note` | Literal `r.note.trim()||undefined`. Empty note is always the default. |

All three are converted to `null` by the sanitizer before the write inside `submitWithPMS → saveAssessment` (`src/App.jsx:899`). No Firestore error today, but with `{merge:true}` semantics this can overwrite a prior non-null field.

#### B. `InspItem.setResult` — partial `undefined` on fresh items

```js
// src/App.jsx:215
const setResult=(code)=>{
  const same=code===v.resultCode;
  const clear=same||code==="pass"||code==="na";
  onChange({
    ...v,
    resultCode:same?null:code,
    defectCode:clear?null:v.defectCode,      // v.defectCode === undefined on first touch
    partReplaced:clear?null:v.partReplaced,  // v.partReplaced === undefined on first touch
    partQty:clear?null:v.partQty,            // v.partQty === undefined on first touch
    afterMeasure:clear?null:v.afterMeasure   // v.afterMeasure === undefined on first touch
  });
};
```

When the user taps `monitor`, `fail_critical`, or `replaced` on an item whose `v` is the default empty object (`value||{}` at App.jsx:209), `v.defectCode|partReplaced|partQty|afterMeasure` are all `undefined`. The spread preserves the key (ES2015: spreading `{}` doesn't create the key, but the explicit `defectCode:undefined` branch does). Sanitizer catches them. Same `null`-over-merge concern as above.

Fields: `itemResults[code].defectCode`, `.partReplaced`, `.partQty`, `.afterMeasure`.

#### C. Assessment doc build — `id` / `_docId` never undefined, but spread fields vulnerable

```js
// src/App.jsx:894
const a={
  id:Date.now(),
  rwaNumber:rwa,
  header:{...header},                                  // (1)
  itemResults:{...effectiveResults},                   // (2)
  classification:cls,                                  // (3)
  pmsData:pmsData||null,
  fmsStatus:"pending_sync",
  submittedAt:resolvedAt,
  resolvesRwa:primaryResolved,
  resolvesRwaList:resolvedRwaNumbers.length>1?resolvedRwaNumbers:null
};
```

- **(1) `header`:** initialized at App.jsx:784 with string defaults for every field (`""`), so no undefined. `headerOk` at App.jsx:911 additionally blocks submit until every required field is non-empty. Clean.
- **(2) `itemResults`:** inherits the undefineds from B and the Quick-Fix path from A. Per-item fields `defectCode`, `partReplaced`, `partQty`, `afterMeasure`, `measuredValue`, `note`, `photos` may each be undefined per-code.
- **(3) `classification`:** `runEngine()` at App.jsx:191 returns a fully-specified object with explicit values on every key (`reassessmentDue` is `null` when not set). Clean.

#### D. `buildUpdates` / PMS record — `NaN` risk (sanitizer does NOT handle)

```js
// src/App.jsx:305 (PMSScreen.buildUpdates)
updates[item.code]={
  lastDate:date,
  lastOdo:parseInt(odometer),                          // ← NaN if odometer is "" or non-numeric
  nextOdo,                                             // ← NaN if lastOdo is NaN (see calcNextDue)
  nextDate,
  performedBy:techName,
  rwaNumber,
  brand:detail.brand||null,
  qty:detail.qty||1,
  photos:detail.photos||[]
};
```

```js
// src/App.jsx:100
function calcNextDue(lastOdo,lastDate,kmInterval,monthInterval){
  const nextOdo=kmInterval?parseInt(lastOdo)+kmInterval:null;  // NaN + number = NaN
  ...
}
```

Same pattern repeats in `QuickFixScreen.handleSubmit`:

```js
// src/App.jsx:452
updates[pmsCode]={
  lastDate:date,
  lastOdo:parseInt(odometer),                          // ← same NaN risk
  nextOdo,                                             // ← same NaN risk
  ...
};
```

**Current protection:** `headerOk` at App.jsx:911 gates the path from `screen="new"` → `screen="inspect"` → `screen="pms"` on `header.odometer` being truthy, so `parseInt("")` is unreachable on the happy path. The latent failure mode is any future code path that reaches PMS with an empty odometer — `sanitizeForFirestore` would write the `NaN`/`NaN` unchanged. Flagging as defensive: these two sites should use `parseInt(odometer)||null`.

Fields at risk: `pms_records/{plate}.{pmsCode}.lastOdo`, `.nextOdo`.

#### E. `saveUserProfile` bootstrap — `user.email` could theoretically be undefined

```js
// src/App.jsx:826
const defaultProfile={
  role:defaultRole,
  name:"",
  branch:"",
  email:user.email,                                    // ← undefined for non-password providers
  createdAt:new Date().toISOString()
};
await saveUserProfile(user.uid,defaultProfile);
```

With email/password auth (the only method wired in `login()` at `src/firebase.js:112`), `user.email` is guaranteed set. If OAuth or anonymous is ever added, `user.email` can be `null`/`undefined`. Sanitizer would write `null`. Field: `users/{uid}.email`.

Same field appears in the in-memory fallback at `src/App.jsx:830` (`setUserProfile({...email:user.email})`), but that branch does not write to Firestore.

### 1.3 Summary table (fields that CAN be undefined at the write boundary)

| Collection | Field path | Source | File:Line |
|---|---|---|---|
| `assessments` | `itemResults.<code>.defectCode` | `InspItem.setResult` initial state | `src/App.jsx:215` |
| `assessments` | `itemResults.<code>.partReplaced` | `InspItem.setResult` initial state | `src/App.jsx:215` |
| `assessments` | `itemResults.<code>.partQty` | `InspItem.setResult` initial state | `src/App.jsx:215` |
| `assessments` | `itemResults.<code>.afterMeasure` | `InspItem.setResult` + QuickFix literal | `src/App.jsx:215`, `:450` |
| `assessments` | `itemResults.<code>.measuredValue` | QuickFix inherits undefined from prev | `src/App.jsx:450` |
| `assessments` | `itemResults.<code>.note` | QuickFix literal `||undefined` | `src/App.jsx:450` |
| `pms_records` | `<pmsCode>.lastOdo` | **NaN** if odometer empty (sanitizer does NOT catch) | `src/App.jsx:305`, `:452` |
| `pms_records` | `<pmsCode>.nextOdo` | **NaN** propagates from `calcNextDue` | `src/App.jsx:100`, `:305`, `:452` |
| `users` | `email` | `user.email` on non-password providers only | `src/App.jsx:826` |

---

## 2. Auth race-condition scan

### 2.1 Auth state subscribers

```js
// src/App.jsx:793
useEffect(()=>{return onAuth(u=>{setUser(u);setAuthLoad(false);});},[]);
```

Single subscription, empty deps, returns the unsubscribe fn from `onAuthStateChanged` (`src/firebase.js:115`). **Correct.**

### 2.2 Main load effect (data + role + listeners)

```js
// src/App.jsx:794-846
useEffect(()=>{
  if(authLoad||!user){setLoading(false);setUserRole(null);setUserProfile(null);return;}
  setLoadError(null);setLoading(true);setConnStatus("connected");
  ...
  let unsubAssess=null,unsubPMS=null,cancelled=false;
  ...
  waitForAuthToken(user).then(async()=>{
    if(cancelled)return;
    try{
      const profile=await getUserProfile(user.uid);
      ...
      if(user.email==="edejercito@gmail.com"&&(!profile.role||profile.role==="technician")){
        await saveUserProfile(user.uid,{role:"fleet_manager"});
        ...
      }
      ...
    }catch(e){...}
    gotProfile=true;checkReady();
    unsubAssess=onAssessmentsSnapshot(data=>{...},handleListenerError);   // ← line 832
    unsubPMS  =onPMSRecordsSnapshot (data=>{...},handleListenerError);   // ← line 838
  }).catch(e=>{...});
  return()=>{cancelled=true;if(unsubAssess)unsubAssess();if(unsubPMS)unsubPMS();};
},[authLoad,user,retryKey]);
```

**Good:** top-level `if(authLoad||!user)return`, `waitForAuthToken` before any Firestore call, `cancelled` flag checked once at the top of the `.then`.

**Real race (listener leak):** between the `if(cancelled)return` check at App.jsx:810 and the listener attach at App.jsx:832/838, the effect `await`s `getUserProfile`, possibly `saveUserProfile`, possibly `getAllUsers`. If the user logs out (or the effect re-runs for any reason) during these `await`s, the cleanup fn at App.jsx:845 fires with `unsubAssess===null` and `unsubPMS===null`, and then the `.then` body proceeds to attach both listeners. The cleanup never runs again. Both listeners leak until the next mount. Fix: re-check `cancelled` immediately before each `onAssessmentsSnapshot`/`onPMSRecordsSnapshot` call.

Offending lines:

```js
// src/App.jsx:832 (inside the .then, after multiple awaits, no cancelled check)
unsubAssess=onAssessmentsSnapshot(data=>{ ... },handleListenerError);
// src/App.jsx:838
unsubPMS=onPMSRecordsSnapshot(data=>{ ... },handleListenerError);
```

### 2.3 Migration effect

```js
// src/App.jsx:850-864
useEffect(()=>{
  if(migratedRef.current||assessments.length===0)return;
  migratedRef.current=true;
  ...
  staleDeferred.forEach(async(old)=>{
    if(!old._docId)return;
    try{await updateAssessment(old._docId,{resolvedByRwa:latestNonDeferred.rwaNumber,resolvedAt:new Date().toISOString()});}
    catch(e){logError("migrationFix",e,{plate:old.header.plate,rwa:old.rwaNumber});}
  });
},[assessments]);
```

No explicit auth guard, but indirectly gated: `assessments` is populated only by the snapshot listener attached after `waitForAuthToken` in §2.2. If auth is revoked between population and the forEach's awaited `updateAssessment`, the write will reject — but it's wrapped in `try/catch` and logged. **Acceptable.** No fix needed.

### 2.4 `UserManagement` load effect

```js
// src/App.jsx:1091
useEffect(()=>{
  (async()=>{
    try{const u=await getAllUsers();setUsers(u);}
    catch(e){logError("loadUsers",e);}
    setLoading(false);
  })();
},[]);
```

Parent only mounts this component when `screen==="users" && canAccess(userRole,"user_management")` (App.jsx:1082), so `user` is guaranteed non-null and the profile has been resolved before mount. **Auth itself is safe.**

**Minor issue:** no unmount guard — `setUsers(u)` / `setLoading(false)` will run on unmounted component if the user navigates away during the await. React will warn (dev) but it's not a functional bug. Not an auth race; flagging for completeness.

### 2.5 Settings `saveMech` — stale `user` closure

```js
// src/App.jsx:1062
const saveMech=async(m)=>{
  setMechanic(m);
  await persistMechanic(m);
  if(userProfile){
    const updated={...userProfile,name:m.name,branch:m.branch};
    setUserProfile(updated);
    try{await saveUserProfile(user.uid,{name:m.name,branch:m.branch});}   // ← user.uid
    catch(_){}
  }
};
```

`user` is captured from render scope. If the user hits Logout (App.jsx:1069) and the prior `saveMech` is still awaiting `persistMechanic` (localStorage — fast, but possible), `user` can become `null` before the inner write fires. `user.uid` would throw. **Guard missing:** should be `if(user && userProfile)`. Low probability, but the `catch(_)` swallows the TypeError silently.

### 2.6 `handleCopyShare` / other user-scoped calls

```js
// src/App.jsx:908
const handleCopyShare=async(a)=>{
  const txt=buildShareText(a);
  try{await navigator.clipboard.writeText(txt);setCopied(true);setTimeout(()=>setCopied(false),2500);}
  catch(e){alert(txt);}
};
```

No auth dependency. Clean.

### 2.7 `waitForAuthToken` itself

```js
// src/firebase.js:38-41
export const waitForAuthToken = async (user) => {
  if (!user) return;
  await user.getIdToken(true);
};
```

Null-guards on `user`. `getIdToken(true)` forces refresh even if still valid — adds latency on every mount of the load effect. **Correct, but possibly wasteful.** Not a bug.

### 2.8 Demo-cleanup call chain (Settings, fleet_manager only)

```js
// src/App.jsx:1074
onClick={async()=>{
  const demoPlates=["UFF 4915","SPK 5872","ZOQ 3492"];
  if(!window.confirm(...))return;
  try{
    let totalAssessments=0;
    for(const plate of demoPlates){
      const n=await deleteAssessmentsByPlate(plate);
      totalAssessments+=n;
      await deletePMSRecord(plate).catch(()=>{});
    }
    ...
  }catch(e){logError("cleanDemoData",e);alert("Error: "+e.message);}
}}
```

Only reachable when `userRole==="fleet_manager"` (App.jsx:1074 guard). No auth race, but note: `deleteAssessmentsByPlate` at `src/firebase.js:73-78` issues `N+1` deletes (one query + one delete per doc) without an auth guard of its own — relies entirely on the caller being authed. If auth expires mid-loop, the remaining deletes reject and the loop exits via `catch`. **Acceptable given the `fleet_manager` gate**, but worth a note: partial deletion can leave orphaned data.

### 2.9 Summary — auth race severity ranking

| # | Location | Severity | Problem |
|---|---|---|---|
| 1 | `src/App.jsx:832, :838` | **Real leak** | Listeners attach after multiple `await`s without re-checking `cancelled` flag. Logout during await leaks both listeners. |
| 2 | `src/App.jsx:1062` (saveMech) | Low | `user.uid` can throw if user logs out mid-call; caught silently. |
| 3 | `src/App.jsx:1091` (UserManagement load) | Low | No unmount guard; React dev warning only. |
| 4 | `src/App.jsx:850` (migration) | None | Implicitly gated by `assessments.length`; errors caught. |
| 5 | `src/App.jsx:793` (onAuth subscribe) | None | Correct subscribe/unsubscribe pattern. |
| 6 | `src/App.jsx:794` (main load) | None | Top-level `if(authLoad||!user)` + `waitForAuthToken` + `cancelled` flag. |
