import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache,
         persistentMultipleTabManager,
         collection, doc, getDoc,
         getDocs, setDoc, addDoc, deleteDoc,
         onSnapshot, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword,
         signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyAybPnwAjnUiNurQ0v_MHpRDW-rnEsFKGU",
  authDomain:        "mg-fms.firebaseapp.com",
  projectId:         "mg-fms",
  storageBucket:     "mg-fms.firebasestorage.app",
  messagingSenderId: "925519572545",
  appId:             "1:925519572545:web:ca482b6c31772a2895e0c0",
};

const app = initializeApp(firebaseConfig);
// Offline persistence — cached data survives refresh before network responds
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const auth = getAuth(app);

// Deep sanitize — removes all undefined values before writing to Firestore
function sanitizeForFirestore(obj) {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, sanitizeForFirestore(v)])
  );
}

// Ensure auth token is ready for Firestore before starting listeners
export const waitForAuthToken = async (user) => {
  if (!user) return;
  await user.getIdToken(true);
};

export const getAssessments = async () => {
  const snap = await getDocs(collection(db,'assessments'));
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  docs.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  return docs;
};

export const saveAssessment = async (assessment) => {
  await addDoc(collection(db, 'assessments'), sanitizeForFirestore(assessment));
};

export const updateAssessment = async (id, data) => {
  await setDoc(doc(db,'assessments', String(id)), sanitizeForFirestore(data), { merge: true });
};

export const getPMSRecords = async () => {
  const snap = await getDocs(collection(db,'pms_records'));
  const result = {};
  snap.docs.forEach(d => { result[d.id] = d.data(); });
  return result;
};

export const savePMSRecord = async (plate, data) => {
  await setDoc(doc(db,'pms_records', plate), sanitizeForFirestore(data), { merge: true });
};

export const deletePMSRecord = async (plate) => {
  await deleteDoc(doc(db, 'pms_records', plate));
};

export const deleteAssessmentsByPlate = async (plate) => {
  const q = query(collection(db, 'assessments'), where('header.plate', '==', plate));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'assessments', d.id))));
  return snap.size;
};

export const onAssessmentsSnapshot = (cb, onErr) => {
  // Listen to ALL documents — sort client-side so records without submittedAt aren't silently dropped
  return onSnapshot(collection(db,'assessments'), snap => {
    const docs = snap.docs.map(d => ({ ...d.data(), id: d.data().id, _docId: d.id }));
    docs.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    cb(docs);
  }, err => { console.error('assessments listener error:', err); if(onErr) onErr(err); });
};

export const onPMSRecordsSnapshot = (cb, onErr) => {
  return onSnapshot(collection(db,'pms_records'), snap => {
    const result = {};
    snap.docs.forEach(d => { result[d.id] = d.data(); });
    cb(result);
  }, err => { console.error('pms_records listener error:', err); if(onErr) onErr(err); });
};

// User profiles & roles
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
};

export const saveUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), sanitizeForFirestore(data), { merge: true });
};

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
};

export const login  = (email, pass) =>
  signInWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
export const onAuth = (cb) => onAuthStateChanged(auth, cb);