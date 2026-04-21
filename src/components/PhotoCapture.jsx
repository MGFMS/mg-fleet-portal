// Reusable photo capture strip — camera + gallery buttons, base64 thumbnails,
// remove control. Used by the diagnostic form (on "replaced" items) and by the
// PMS form (on checked items). Always compresses on add, and reports the
// resulting KB size as an overlay on each thumbnail so the mechanic can see
// file weight before submit.
//
// Photos are stored as base64 data URLs inline in the parent doc. Upstream
// trimPhotosToFit / trimPmsRecord is responsible for dropping them if the
// final document exceeds Firestore's 900KB ceiling.

import { useRef, useState } from 'react'
import { b64size, compressImage } from '../lib/photos'

export default function PhotoCapture({ photos = [], onChange, max = 5, label = 'Photos' }) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = '' // reset so picking the same file twice still fires onChange
    if (!f) return
    setBusy(true); setErr(null)
    try {
      const compressed = await compressImage(f)
      onChange([...(photos || []), compressed])
    } catch (error) {
      console.error('[PhotoCapture] compress failed', error)
      setErr('Image failed to load. Try another file.')
    } finally {
      setBusy(false)
    }
  }

  const removeAt = (idx) => {
    const next = [...(photos || [])]
    next.splice(idx, 1)
    onChange(next)
  }

  const canAdd = (photos?.length || 0) < max

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-[10px] text-gray-400">{(photos?.length || 0)}/{max}</span>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className="flex flex-wrap gap-2">
        {(photos || []).map((src, i) => (
          <div key={i} className="relative w-16 h-16">
            <img src={src} alt={`Photo ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow"
              title="Remove photo"
            >
              ✕
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-center rounded-b-lg py-0.5 pointer-events-none" style={{ fontSize: '8px' }}>
              {b64size(src)} KB
            </div>
          </div>
        ))}
        {canAdd && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => cameraRef.current?.click()}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 flex flex-col items-center justify-center text-[10px] font-bold disabled:opacity-50"
            >
              <span className="text-lg leading-none">📷</span>
              <span>Camera</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => galleryRef.current?.click()}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 flex flex-col items-center justify-center text-[10px] font-bold disabled:opacity-50"
            >
              <span className="text-lg leading-none">🖼️</span>
              <span>Gallery</span>
            </button>
          </>
        )}
      </div>
      {err && <div className="text-[11px] text-red-700 mt-1">{err}</div>}
    </div>
  )
}
