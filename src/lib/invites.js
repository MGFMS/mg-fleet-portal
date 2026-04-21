// Email-link invite helpers. Flow:
//   1. Admin clicks "Invite User" in /admin/users → we write pendingInvites/{email}
//      with { name, role, company, is_admin, invited_by, invited_at }.
//   2. We call sendSignInLinkToEmail so Firebase emails the invitee a one-time link.
//   3. When the invitee clicks the link they land on /auth/complete. That page:
//      a) finishes the email-link sign-in;
//      b) reads pendingInvites/{email};
//      c) creates users/{uid} from the invite payload + Firebase Auth uid;
//      d) prompts them to set a password (updatePassword) so they can log in normally;
//      e) deletes pendingInvites/{email}.
//
// If the admin prefers a temp password instead (e.g. email-link isn't yet enabled
// in the Firebase console), see createUserWithTempPassword below. That path uses
// a *secondary* Firebase app instance so it doesn't clobber the admin's own session.

import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  updatePassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  deleteDoc, doc, getDoc, serverTimestamp, setDoc,
} from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { auth, db } from './firebase'

const PENDING = 'pendingInvites'
const LOCAL_KEY = 'mgfp:emailForSignIn'

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase()
}

// -- pendingInvites CRUD -----------------------------------------------------

export async function createPendingInvite(email, payload) {
  if (!db) throw new Error('Firestore not configured.')
  const e = normalizeEmail(email)
  if (!e) throw new Error('Email is required.')
  const uid = auth?.currentUser?.uid || null
  await setDoc(doc(db, PENDING, e), {
    email: e,
    name: (payload.name || '').trim(),
    role: (payload.role || 'customer').trim(),
    company: (payload.company || '').trim() || null,
    branch: (payload.branch || '').trim() || null,
    is_admin: Boolean(payload.is_admin),
    quotation_approver: Boolean(payload.quotation_approver),
    invited_by: uid,
    invited_at: serverTimestamp(),
    status: 'pending',
  })
}

export async function getPendingInvite(email) {
  if (!db) return null
  const snap = await getDoc(doc(db, PENDING, normalizeEmail(email)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function clearPendingInvite(email) {
  if (!db) return
  await deleteDoc(doc(db, PENDING, normalizeEmail(email)))
}

// -- email-link sign-in primary path ----------------------------------------

export async function sendInviteEmail(email) {
  if (!auth) throw new Error('Firebase Auth not configured.')
  const e = normalizeEmail(email)
  const url = `${window.location.origin}/auth/complete`
  await sendSignInLinkToEmail(auth, e, { url, handleCodeInApp: true })
  try { window.localStorage.setItem(LOCAL_KEY, e) } catch {}
}

export function isInviteLink(href = window.location.href) {
  if (!auth) return false
  return isSignInWithEmailLink(auth, href)
}

export function rememberedInviteEmail() {
  try { return window.localStorage.getItem(LOCAL_KEY) || '' } catch { return '' }
}

export async function completeInviteLink(email, href = window.location.href) {
  if (!auth) throw new Error('Firebase Auth not configured.')
  const result = await signInWithEmailLink(auth, normalizeEmail(email), href)
  try { window.localStorage.removeItem(LOCAL_KEY) } catch {}
  return result
}

// -- fallback: admin creates the account with a temp password ---------------
// Uses a secondary Firebase app so the admin's current session isn't logged out.

export async function createUserWithTempPassword(firebaseConfig, email, tempPassword) {
  if (!firebaseConfig) throw new Error('Missing Firebase config.')
  const name = `secondary-${Date.now()}`
  const secondary = initializeApp(firebaseConfig, name)
  const secondaryAuth = getAuth(secondary)
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, normalizeEmail(email), tempPassword)
    const uid = cred.user.uid
    await signOut(secondaryAuth)
    return uid
  } finally {
    try { await deleteApp(secondary) } catch {}
  }
}

// -- caller-friendly: also set a password once signed in via email link ----

export async function setPasswordOnCurrentUser(newPassword) {
  const u = auth?.currentUser
  if (!u) throw new Error('Not signed in.')
  await updatePassword(u, newPassword)
}
