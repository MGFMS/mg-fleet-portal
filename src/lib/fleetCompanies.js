import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { auth, db } from './firebase'

const COLLECTION = 'fleetCompanies'

// Live subscription to the list, ordered by name. Returns unsubscribe.
export function watchFleetCompanies(onNext, onError) {
  if (!db) {
    onNext([])
    return () => {}
  }
  const q = query(collection(db, COLLECTION), orderBy('name'))
  return onSnapshot(
    q,
    (snap) => onNext(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error('[fleetCompanies] subscription failed:', err)
      if (onError) onError(err)
    },
  )
}

const VALID_PAYMENT_TERMS = ['CASH', 'NET_30', 'NET_60', 'NET_90']

function normalizeWritable(data) {
  const terms = String(data.paymentTerms || 'NET_30').toUpperCase()
  const payload = {
    name: (data.name || '').trim(),
    code: (data.code || '').trim().toUpperCase(),
    contactEmail: (data.contactEmail || '').trim(),
    contactPhone: (data.contactPhone || '').trim(),
    paymentTerms: VALID_PAYMENT_TERMS.includes(terms) ? terms : 'NET_30',
    isActive: data.isActive !== false,
  }
  if (!payload.name) throw new Error('Company name is required.')
  if (!payload.code) throw new Error('Company code is required.')
  return payload
}

export async function createFleetCompany(data) {
  if (!db) throw new Error('Firestore is not configured.')
  const uid = auth?.currentUser?.uid || null
  const ref = await addDoc(collection(db, COLLECTION), {
    ...normalizeWritable(data),
    createdAt: serverTimestamp(),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
  return ref.id
}

export async function updateFleetCompany(id, data) {
  if (!db) throw new Error('Firestore is not configured.')
  const uid = auth?.currentUser?.uid || null
  await updateDoc(doc(db, COLLECTION, id), {
    ...normalizeWritable(data),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
}

export async function setFleetCompanyActive(id, isActive) {
  if (!db) throw new Error('Firestore is not configured.')
  const uid = auth?.currentUser?.uid || null
  await updateDoc(doc(db, COLLECTION, id), {
    isActive: Boolean(isActive),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
}
