// Right-side slide-over panel used for "Service Booking", "Vehicle Service
// Update", and similar inline forms. Dismisses on backdrop click or Esc.

import { useEffect } from 'react'

export default function SlidePanel({ open, onClose, title, width = 'w-[420px]', children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className={`${width} max-w-full bg-white h-full flex flex-col shadow-xl`}>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="font-semibold text-gray-800">{title}</div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </aside>
    </div>
  )
}
