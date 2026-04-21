// Service Receipts + Quotations. Portal-owned collection; not shared with
// mg-fms. Quotations use the same collection with a different `kind` field and
// status flow — a receipt ("kind: receipt") is the final billing doc; a
// quotation ("kind: quotation") is the pre-billing estimate.

import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc, where,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { SERVICE_RECEIPTS as DUMMY } from './dummyData'
import { emitNotification, fetchContextDoc } from './notifications'

const COLLECTION = 'serviceReceipts'

export function watchReceipts(options, cb) {
  if (!db) { cb({ rows: DUMMY, source: 'dummy', loading: false, error: null }); return () => {} }
  const filters = []
  if (options?.kind) filters.push(where('kind', '==', options.kind))
  if (options?.branch) filters.push(where('branch', '==', options.branch))
  if (options?.company) filters.push(where('company', '==', options.company))
  const q = filters.length > 0
    ? query(collection(db, COLLECTION), ...filters, orderBy('createdAt', 'desc'))
    : query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
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
      console.warn('[serviceReceipts] listener error:', err)
      cb({ rows: DUMMY, source: 'error', loading: false, error: err })
    },
  )
}

export async function getReceipt(codeOrId) {
  if (!db) return DUMMY.find((r) => r.code === codeOrId) || null
  // First try as a direct doc id
  try {
    const direct = await getDoc(doc(db, COLLECTION, codeOrId))
    if (direct.exists()) return { id: direct.id, ...direct.data() }
  } catch {}
  // Fall back to finding by `code`
  const snap = await new Promise((resolve, reject) => {
    const unsub = onSnapshot(
      query(collection(db, COLLECTION), where('code', '==', codeOrId)),
      (s) => { unsub(); resolve(s) },
      reject,
    )
  })
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() }
  return DUMMY.find((r) => r.code === codeOrId) || null
}

export async function createReceipt(kind, data) {
  if (!db) throw new Error('Firestore not configured.')
  const uid = auth?.currentUser?.uid || null
  const prefix = kind === 'quotation' ? 'SQ' : 'Q'
  const branch = (data.branch || 'MGCAVITE').toUpperCase()
  const legacyId = Date.now().toString(36).toUpperCase()
  const code = data.code || `${prefix}-${branch}-${legacyId}`

  const items = (data.items || []).map((i) => ({
    type: i.type || 'Parts/Materials',
    qty: Number(i.qty) || 1,
    description: String(i.description || '').toUpperCase(),
    unitCost: Number(i.unitCost) || 0,
    subTotal: (Number(i.qty) || 1) * (Number(i.unitCost) || 0),
  }))

  const laborTotal = items.filter((i) => i.type === 'Labor').reduce((s, i) => s + i.subTotal, 0)
  const materialsTotal = items.filter((i) => i.type !== 'Labor').reduce((s, i) => s + i.subTotal, 0)

  const ref = await addDoc(collection(db, COLLECTION), {
    kind,
    code,
    plateNo: (data.plateNo || '').toUpperCase().replace(/\s+/g, ''),
    brandModel: data.brandModel || '',
    latestOdo: Number(data.latestOdo) || 0,
    customer: data.customer || '',
    mobile: data.mobile || '',
    company: data.company || null,
    branch,
    mechanic: data.mechanic || '',
    personInCharge: data.personInCharge || '',
    scheduleType: data.scheduleType || 'SCHEDULED',
    items,
    laborTotal,
    materialsTotal,
    estimatedTotal: laborTotal + materialsTotal,
    missingParts: Number(data.missingParts) || 0,
    notes: data.notes || '',
    status: kind === 'quotation' ? 'OPEN' : 'OPEN',
    createdAt: serverTimestamp(),
    dateCreated: new Date().toISOString().slice(0, 10),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
  const fleet = Boolean(data.company)
  const plate = (data.plateNo || '').toUpperCase().replace(/\s+/g, '')
  emitNotification({
    kind: kind === 'quotation' ? 'quotation' : 'service',
    title: kind === 'quotation'
      ? `Quotation ${code} created for ${plate}`
      : `Receipt ${code} issued for ${plate}`,
    body: kind === 'quotation' && fleet ? 'Awaiting client approval' : null,
    plateNo: plate,
    receiptId: ref.id,
    link: kind === 'quotation' ? '/quotations' : `/service-receipts/${code}`,
    branch,
    company: fleet ? data.company : null,
  })
  return { id: ref.id, code }
}

export async function setReceiptStatus(id, nextStatus) {
  if (!db) throw new Error('Firestore not configured.')
  const uid = auth?.currentUser?.uid || null
  await updateDoc(doc(db, COLLECTION, id), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  })
  const rec = await fetchContextDoc(COLLECTION, id)
  if (!rec) return
  const isQuote = rec.kind === 'quotation'
  const code = rec.code || id
  const plate = rec.plateNo || ''
  let title = null
  let notifyCompany = rec.company || null
  if (nextStatus === 'APPROVED' || nextStatus === 'DISAPPROVED' || nextStatus === 'REJECTED') {
    title = `Quotation ${code} ${nextStatus.toLowerCase()} by ${rec.company || 'client'}`
    // Client just clicked the button — don't notify them of their own action.
    notifyCompany = null
  } else if (nextStatus === 'PAID') {
    title = `Receipt ${code} paid — ${plate}`
  } else if (nextStatus === 'CANCELLED') {
    title = `${isQuote ? 'Quotation' : 'Receipt'} ${code} cancelled`
    notifyCompany = null
  }
  if (!title) return
  emitNotification({
    kind: isQuote ? 'approval' : 'service',
    title,
    plateNo: plate,
    receiptId: id,
    link: isQuote ? '/quotations' : `/service-receipts/${code}`,
    branch: rec.branch || null,
    company: notifyCompany,
  })
}
