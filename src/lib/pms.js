// PMS records = the shared "service performed per PMS item" collection that
// mg-fms writes to. Doc ID is the plate number (with spaces preserved, per
// mg-fms convention). Each doc is an object keyed by PMS code, e.g.:
//
//   pms_records/"UFF 4915" {
//     PMS_OIL:         { lastDate, lastOdo, nextOdo, nextDate, performedBy,
//                        rwaNumber, brand, qty, photos, branch? },
//     PMS_OIL_FILTER:  { ... },
//     ...
//   }
//
// Ports (from mg-fms-app/src/App.jsx + mg-fms-app/src/firebase.js):
//   - calcNextDue   (App.jsx:100)      — next-odo + next-date arithmetic
//   - buildUpdates  (App.jsx:305)      — shape of the per-item update
//   - savePMSRecord (firebase.js:66)   — setDoc(..., { merge: true })
//
// Fixed on port (not in mg-fms):
//   - Canonical plate resolution. mg-fms stores plate "UFF 4915" (with space);
//     portal-created appointments store "UFF4915" (no space). If we naively
//     use plateNo, we create a parallel doc and the two apps disagree. On
//     load we look up the first assessment whose header.plate normalizes to
//     the input and use its raw plate as the doc ID. Falls back to the input
//     when no match is found.

import {
  collection, doc, getDoc, getDocs, query, setDoc, where,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { sanitizeForFirestore } from './assessments'

export function normalizePlate(plate) {
  return String(plate || '').replace(/\s+/g, '').toUpperCase()
}

// next-due arithmetic, port of mg-fms calcNextDue.
// - `lastOdo` is coerced via parseInt so string odometer inputs work.
// - `monthInterval` advances the month on the Date object; Date normalizes
//   overflow (e.g. "January 31" + 1 month → "March 3" or similar). mg-fms
//   accepts that behavior; we do the same.
export function calcNextDue(lastOdo, lastDate, kmInterval, monthInterval) {
  const nextOdo = kmInterval ? parseInt(lastOdo, 10) + kmInterval : null
  let nextDate = null
  if (monthInterval && lastDate) {
    const base = new Date(lastDate)
    if (!isNaN(base)) {
      base.setMonth(base.getMonth() + monthInterval)
      nextDate = base.toISOString().slice(0, 10)
    }
  }
  return { nextOdo, nextDate }
}

// Find the raw plate string mg-fms uses for a given input plate (possibly
// with or without spaces). Returns the canonical string or the input stripped
// of whitespace if no match.
export async function resolveCanonicalPlate(inputPlate) {
  const stripped = normalizePlate(inputPlate)
  if (!db || !stripped) return stripped
  // Fast path: exact match (covers portal-created plates + anything without spaces).
  try {
    const exact = await getDocs(query(
      collection(db, 'assessments'),
      where('header.plate', '==', stripped),
    ))
    if (!exact.empty) return exact.docs[0].data()?.header?.plate || stripped
  } catch (err) {
    console.warn('[pms] resolveCanonicalPlate exact query failed:', err)
  }
  // Slow path: scan assessments and compare normalized. Bounded by the size
  // of the assessments collection, so still acceptable for ~hundreds of docs.
  try {
    const all = await getDocs(collection(db, 'assessments'))
    for (const d of all.docs) {
      const raw = d.data()?.header?.plate
      if (raw && normalizePlate(raw) === stripped) return raw
    }
  } catch (err) {
    console.warn('[pms] resolveCanonicalPlate scan failed:', err)
  }
  return stripped
}

// Load the pms_records doc for a given plate. The plate must be canonical
// (use resolveCanonicalPlate first if coming from an unnormalized source).
// Returns the raw doc (keyed by PMS code) or an empty object.
export async function loadPmsRecord(canonicalPlate) {
  if (!db || !canonicalPlate) return {}
  const snap = await getDoc(doc(db, 'pms_records', canonicalPlate))
  return snap.exists() ? snap.data() : {}
}

// Build the per-item update map from the form state — this is the heart of
// the PMS record, shape-identical to mg-fms buildUpdates so mg-fms can read
// the docs we write.
//
//   items:    PMS_ITEMS catalog entries
//   checked:  { [code]: boolean }
//   details:  { [code]: { brand?, qty?, photos? } }
//   ctx:      { date, odometer, performedBy, rwaNumber, branch }
export function buildPmsUpdates({ items, checked, details, ctx }) {
  const updates = {}
  for (const item of items) {
    if (!checked[item.code]) continue
    const d = details[item.code] || {}
    const { nextOdo, nextDate } = calcNextDue(
      ctx.odometer, ctx.date, item.kmInterval, item.monthInterval,
    )
    updates[item.code] = {
      lastDate: ctx.date,
      lastOdo: Number.isFinite(parseInt(ctx.odometer, 10)) ? parseInt(ctx.odometer, 10) : null,
      nextOdo,
      nextDate,
      performedBy: ctx.performedBy || null,
      rwaNumber: ctx.rwaNumber || null,
      brand: d.brand || null,
      qty: d.qty || 1,
      photos: d.photos || [],
      branch: ctx.branch || null,
    }
  }
  return updates
}

// Write an updates map to pms_records/{canonicalPlate}. Uses setDoc merge so
// only touched PMS codes are overwritten — existing codes for other services
// are preserved.
export async function savePmsRecord(canonicalPlate, updates) {
  if (!db) throw new Error('Firestore not configured.')
  if (!canonicalPlate) throw new Error('Plate is required.')
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No PMS items selected.')
  }
  await setDoc(
    doc(db, 'pms_records', canonicalPlate),
    sanitizeForFirestore(updates),
    { merge: true },
  )
  return { plate: canonicalPlate, count: Object.keys(updates).length, by: auth?.currentUser?.uid || null }
}
