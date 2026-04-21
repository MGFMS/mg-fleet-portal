// Appointments = the "Service Bookings" queue. New portal collection; not
// shared with mg-fms.

import {
  addDoc, collection, doc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc, where,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { APPOINTMENTS as DUMMY } from './dummyData'
import { emitNotification, fetchContextDoc } from './notifications'

const COLLECTION = 'appointments'

export function watchAppointments(options, cb) {
  if (!db) { cb({ rows: DUMMY, source: 'dummy', loading: false, error: null }); return () => {} }
  let q = query(collection(db, COLLECTION), orderBy('scheduledAt', 'desc'))
  if (options?.branch) q = query(collection(db, COLLECTION), where('branch', '==', options.branch), orderBy('scheduledAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      if (rows.length === 0 && options?.dummyFallback !== false) {
        cb({ rows: DUMMY, source: 'dummy', loading: false, error: null })
      } else {
        cb({ rows, source: 'firestore', loading: false, error: null })
      }
    },
    (err) => {
      console.warn('[appointments] listener error:', err)
      cb({ rows: DUMMY, source: 'error', loading: false, error: err })
    },
  )
}

export async function createAppointment(payload) {
  if (!db) throw new Error('Firestore not configured.')
  const uid = auth?.currentUser?.uid || null
  const now = new Date()
  const ref = await addDoc(collection(db, COLLECTION), {
    plateNo: (payload.plateNo || '').toUpperCase().replace(/\s+/g, ''),
    customer: payload.customer || '',
    customerType: payload.customerType || 'new',
    mobile: payload.mobile || '',
    company: payload.company || null,
    branch: payload.branch || 'MGCAVITE',
    mechanic: payload.mechanic || 'Not yet assigned',
    scheduledAt: payload.scheduledAt || now.toISOString(),
    scheduledTime: payload.scheduledTime || '8:00 AM',
    servicesInterested: payload.servicesInterested || [],
    customerIssues: payload.customerIssues || [],
    status: payload.status || (payload.company ? 'TENTATIVE' : 'BOOKED'),
    note: payload.note || 'SERVICE BOOKED',
    walkin: Boolean(payload.walkin),
    tentative: Boolean(payload.tentative),
    createdAt: serverTimestamp(),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
  const plate = (payload.plateNo || '').toUpperCase().replace(/\s+/g, '')
  const fleet = Boolean(payload.company)
  emitNotification({
    kind: 'booking',
    title: fleet ? `New booking — ${plate}` : `Walk-in booking — ${plate}`,
    body: fleet
      ? `${payload.company} · ${payload.branch || 'MGCAVITE'} · ${payload.scheduledTime || ''}`.trim()
      : `${payload.customer || 'Walk-in'} · ${payload.branch || 'MGCAVITE'}`,
    plateNo: plate,
    appointmentId: ref.id,
    link: `/vehicles/${plate}`,
    branch: payload.branch || 'MGCAVITE',
    company: fleet ? payload.company : null,
  })
  return ref.id
}

export async function updateAppointmentStatus(id, nextStatus, note) {
  if (!db) throw new Error('Firestore not configured.')
  const uid = auth?.currentUser?.uid || null
  await updateDoc(doc(db, COLLECTION, id), {
    status: nextStatus,
    ...(note ? { note } : {}),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
  // Only emit on milestone transitions so the feed doesn't flood.
  if (nextStatus === 'DIAGNOSED' || nextStatus === 'COMPLETED') {
    const appt = await fetchContextDoc(COLLECTION, id)
    if (appt) {
      const verb = nextStatus === 'DIAGNOSED' ? 'diagnosed' : 'service completed'
      emitNotification({
        kind: nextStatus === 'COMPLETED' ? 'service' : 'status',
        title: `${appt.plateNo} — ${verb}`,
        body: note || null,
        plateNo: appt.plateNo,
        appointmentId: id,
        link: `/vehicles/${appt.plateNo}`,
        branch: appt.branch || null,
        company: appt.company || null,
      })
    }
  }
}

export async function assignMechanic(id, mechanicName) {
  if (!db) throw new Error('Firestore not configured.')
  const uid = auth?.currentUser?.uid || null
  await updateDoc(doc(db, COLLECTION, id), {
    mechanic: mechanicName || 'Not yet assigned',
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
  const appt = await fetchContextDoc(COLLECTION, id)
  if (appt) {
    emitNotification({
      kind: 'status',
      title: `${mechanicName || 'Mechanic'} assigned to ${appt.plateNo}`,
      plateNo: appt.plateNo,
      appointmentId: id,
      link: `/appointments/${id}/update`,
      branch: appt.branch || null,
      // Internal-only: do NOT notify fleet client on mechanic assignment
      company: null,
    })
  }
}
