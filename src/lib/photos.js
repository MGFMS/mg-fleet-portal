// Photo pipeline — ported from mg-fms-app/src/App.jsx lines 199–202.
// Photos are stored as base64 JPEG data-URLs inline in Firestore docs (mg-fms
// convention). Defaults kept verbatim from mg-fms source (NOT what its
// CLAUDE.md claims — mg-fms's CLAUDE.md says 800/0.7 but the code is 600/0.5;
// we follow the code).

// Compress a File / Blob → base64 data URL.
//   maxDim  — bounding box for the longer side (px). Aspect ratio preserved.
//   quality — JPEG quality 0..1.
export function compressImage(file, maxDim = 600, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim }
        else        { w = Math.round(w * (maxDim / h)); h = maxDim }
      }
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Approximate KB size of a base64 data URL (len * 3/4, minus the prefix).
export function b64size(b64) {
  const len = b64.length - (b64.indexOf(',') + 1)
  return Math.round(len * 3 / 4 / 1024)
}

// Approximate byte size of any JSON-serializable value.
export function docByteSize(obj) {
  try { return new Blob([JSON.stringify(obj)]).size }
  catch { return JSON.stringify(obj).length }
}

// Trim photos from an assessment doc until it fits under maxBytes. Destructive;
// returns a deep clone with strips applied. Port of mg-fms trimPhotosToFit
// (App.jsx:202). Firestore doc ceiling is 1MiB so we target 900KB headroom.
//
// Strip order (least → most destructive, matching mg-fms):
//   1. pmsData.ecuData.photos
//   2. pmsData.serviceDetails.*.photos
//   3. pmsData.updates.*.photos
//   4. pmsData.ecuData.codes.*.photo
//   5. itemResults.*.photos + adjustedResults.*.photos
export function trimPhotosToFit(doc, maxBytes = 900000) {
  let d = JSON.parse(JSON.stringify(doc))
  if (docByteSize(d) <= maxBytes) return d
  const strips = [
    (x) => { if (x.pmsData?.ecuData?.photos) x.pmsData.ecuData.photos = [] },
    (x) => { if (x.pmsData?.serviceDetails) Object.values(x.pmsData.serviceDetails).forEach((s) => { if (s.photos) s.photos = [] }) },
    (x) => { if (x.pmsData?.updates) Object.values(x.pmsData.updates).forEach((u) => { if (u.photos) u.photos = [] }) },
    (x) => { if (x.pmsData?.ecuData?.codes) x.pmsData.ecuData.codes.forEach((c) => { c.photo = null }) },
    (x) => {
      Object.values(x.itemResults || {}).forEach((r) => { if (r.photos) r.photos = [] })
      if (x.adjustedResults) Object.values(x.adjustedResults).forEach((r) => { if (r.photos) r.photos = [] })
    },
  ]
  for (const strip of strips) {
    strip(d)
    if (docByteSize(d) <= maxBytes) return d
  }
  return d
}

// PMS-records variant — the doc shape is `{ [pmsCode]: { photos, ... } }`.
// Drops photos across all codes if the merged doc would exceed maxBytes.
export function trimPmsRecord(updates, maxBytes = 900000) {
  let d = JSON.parse(JSON.stringify(updates))
  if (docByteSize(d) <= maxBytes) return d
  for (const code of Object.keys(d)) {
    if (d[code]?.photos) d[code].photos = []
    if (docByteSize(d) <= maxBytes) return d
  }
  return d
}
