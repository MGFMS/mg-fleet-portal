import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleLabel } from '../lib/roles'
import { watchNotifications, markRead } from '../lib/notifications'
import Icon from './ui/Icon'

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function Topbar({ onMenuClick }) {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [plate, setPlate] = useState('')
  const [notifs, setNotifs] = useState([])
  const bellRef = useRef(null)

  useEffect(() => {
    if (!profile) return
    return watchNotifications(profile, ({ rows }) => setNotifs(rows))
  }, [profile])

  // Close bell dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [bellOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    const p = plate.trim().toUpperCase().replace(/\s+/g, '')
    if (p) navigate(`/vehicles/${encodeURIComponent(p)}`)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const openNotif = async (n) => {
    setBellOpen(false)
    if (!n.read) markRead(n.id)
    if (n.link) navigate(n.link)
    else navigate('/notifications')
  }

  const displayName = profile?.name || user?.email || 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const unread = notifs.filter((n) => !n.read).length
  const recent = notifs.slice(0, 5)

  return (
    <header className="bg-sidebar text-white h-14 flex items-center px-2 sm:px-4 gap-2 sm:gap-3 justify-between border-b border-gray-800 sticky top-0 z-20">
      {/* Hamburger — mobile only; md+ shows the persistent sidebar instead */}
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden w-9 h-9 shrink-0 rounded-md hover:bg-sidebar-hover flex items-center justify-center"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-md">
        <div className="relative">
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Search plate…"
            className="w-full bg-sidebar-hover text-white placeholder-gray-500 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative w-9 h-9 rounded-md hover:bg-sidebar-hover flex items-center justify-center"
            aria-label="Notifications"
          >
            <Icon name="bell" className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-[10px] font-semibold text-white flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-[90vw] max-w-sm bg-white text-gray-800 rounded-md shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-semibold">Notifications</span>
                <button
                  onClick={() => { setBellOpen(false); navigate('/notifications') }}
                  className="text-xs text-brand hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y">
                {recent.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">No notifications.</div>
                )}
                {recent.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openNotif(n)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${n.read ? '' : 'bg-sky-50/50'}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs truncate ${n.read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                          {n.title}
                        </div>
                        {n.body && <div className="text-[11px] text-gray-500 truncate">{n.body}</div>}
                        <div className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</div>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1 shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-sidebar-hover text-sm"
          >
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-semibold">
              {initial}
            </div>
            <span className="hidden sm:block text-left">
              <div className="text-sm">{displayName}</div>
              <div className="text-[10px] text-gray-400">{roleLabel(profile?.role)}</div>
            </span>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b text-xs text-gray-500">
                {profile?.branch || 'No branch'}
              </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
