// Dual-mode header. On mobile (< md) it's the mg-fms red bar with a page
// title + back chevron + notification bell — the hamburger is gone because
// the BottomNav replaces it. On md+ it's the original dark-gray header with
// plate search + user menu + notification dropdown for desktop ergonomics.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

// Routes that act as "tab roots" — the BottomNav tabs. On these, mobile
// shows the logo mark instead of a back chevron. Kept in sync with
// BottomNav's tab list.
const TAB_ROOTS = new Set([
  '/home',
  '/portal',
  '/appointments',
  '/home/notifications',
  '/portal/notifications',
  '/notifications',
  '/service-receipts',
  '/portal/quotations',
  '/more',
  '/portal/my-fleet',
])

// Derive a human-readable page title from the current path. Kept as a simple
// prefix match so we don't need to enumerate every dynamic segment. Returning
// null falls back to the generic brand title.
function deriveTitle(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/'
  // Exact matches first
  const exact = {
    '/home': 'My Garage',
    '/home/my-mechanics': 'My Mechanics',
    '/home/notifications': 'Notifications',
    '/appointments': 'Service Bookings',
    '/customers': 'Customers',
    '/mechanics': 'Mechanics',
    '/vehicles': 'Fleet',
    '/services': 'Services Offered',
    '/service-receipts': 'Service Receipts',
    '/service-receipts/create': 'New Service Receipt',
    '/quotations': 'Service Quotations',
    '/quotations/unbilled': 'For Quotation',
    '/quotations/create': 'New Quotation',
    '/reports': 'Reports',
    '/notifications': 'Notifications',
    '/portal': 'Fleet Dashboard',
    '/portal/my-fleet': 'My Fleet',
    '/portal/service-log': 'Service Log',
    '/portal/notifications': 'Notifications',
    '/portal/quotations': 'Service Quotations',
    '/admin/fleet-companies': 'Fleet Companies',
    '/admin/users': 'Users',
    '/more': 'More',
  }
  if (exact[p]) return exact[p]
  // Dynamic-segment prefixes
  if (p.startsWith('/vehicles/')) return 'Vehicle Details'
  if (p.startsWith('/assessments/')) return 'Assessment'
  if (p.startsWith('/appointments/') && p.endsWith('/assess')) return 'Assessment'
  if (p.startsWith('/appointments/') && p.endsWith('/diagnose')) return 'Assessment'
  if (p.startsWith('/appointments/') && p.endsWith('/pms')) return 'PMS Record'
  if (p.startsWith('/appointments/') && p.endsWith('/assign')) return 'Assign Mechanic'
  if (p.startsWith('/appointments/') && p.endsWith('/update')) return 'Post Update'
  if (p.startsWith('/service-receipts/')) return 'Service Receipt'
  if (p.startsWith('/quotations/')) return 'Quotation'
  return null
}

export default function Topbar() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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

  const isTabRoot = useMemo(() => TAB_ROOTS.has(location.pathname.replace(/\/+$/, '') || '/'), [location.pathname])
  const pageTitle = useMemo(() => deriveTitle(location.pathname) || 'MG FLEET PORTAL', [location.pathname])

  return (
    <>
      {/* ── Mobile header ─────────────────────────────────────────── */}
      <header
        className="md:hidden bg-brand text-white sticky top-0 z-20"
        style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
      >
        <div className="h-14 flex items-center px-3 gap-2">
          {isTabRoot ? (
            <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
              <img
                src="/assets/mg-logo.jpg"
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center"
              aria-label="Back"
            >
              <span className="text-2xl leading-none">←</span>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-black text-base leading-tight truncate">{pageTitle}</div>
            {isTabRoot && profile?.branch && (
              <div className="text-[10px] text-white/60 truncate">{profile.branch}</div>
            )}
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center shrink-0"
            aria-label="Notifications"
          >
            <Icon name="bell" className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-white text-brand text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Desktop header (md+) — unchanged behavior ─────────────── */}
      <header className="hidden md:flex bg-sidebar text-white h-14 items-center px-4 gap-3 justify-between border-b border-gray-800 sticky top-0 z-20">
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

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen((v) => !v)}
              className="relative w-9 h-9 rounded-md hover:bg-sidebar-hover flex items-center justify-center"
              aria-label="Notifications"
            >
              <Icon name="bell" className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand text-[10px] font-semibold text-white flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-md shadow-lg z-50 overflow-hidden">
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
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${n.read ? '' : 'bg-red-50/50'}`}
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
              <span className="text-left">
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
    </>
  )
}
