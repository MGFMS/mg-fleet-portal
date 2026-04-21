// Vehicle service updates = the per-appointment timeline ("POST", "ARRIVED",
// "DIAGNOSED", etc.) seen in the VehicleServiceUpdate side panel.

import {
  addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { SERVICE_UPDATES as DUMMY } from './dummyData'
import { emitNotification, fetchContextDoc } from './notifications'

const COLLECTION = 'vehicleServiceUpdates'

export function watchUpdatesForPlate(plateNo, cb) {
  if (!db) { cb({ rows: DUMMY[plateNo] || [], source: 'dummy' }); return () => {} }
  const q = query(
    collection(db, COLLECTION),
    where('plateNo', '==', (plateNo || '').toUpperCase().replace(/\s+/g, '')),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      if (rows.length === 0) cb({ rows: DUMMY[plateNo] || [], source: 'dummy' })
      else cb({ rows, source: 'firestore' })
    },
    (err) => {
      console.warn('[serviceUpdates] listener error:', err)
      cb({ rows: DUMMY[plateNo] || [], source: 'error', error: err })
    },
  )
}

export async function postUpdate({ plateNo, appointmentId, tag, label }) {
  if (!db) throw new Error('Firestore not configured.')
  const uid = auth?.currentUser?.uid || null
  const plate = (plateNo || '').toUpperCase().replace(/\s+/g, '')
  const upTag = (tag || 'POST').toUpperCase()
  const ref = await addDoc(collection(db, COLLECTION), {
    plateNo: plate,
    appointmentId: appointmentId || null,
    tag: upTag,
    label: label || '',
    createdAt: serverTimestamp(),
    createdBy: uid,
  })
  // Look up the appointment so we know which branch + company to route this to.
  const appt = appointmentId ? await fetchContextDoc('appointments', appointmentId) : null
  emitNotification({
    kind: 'service',
    title: `${upTag} — ${plate}`,
    body: label || null,
    plateNo: plate,
    appointmentId: appointmentId || null,
    link: appointmentId ? `/appointments/${appointmentId}/update` : `/vehicles/${plate}`,
    branch: appt?.branch || null,
    company: appt?.company || null,
  })
  return ref.id
}
