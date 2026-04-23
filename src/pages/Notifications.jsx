// Notifications list. Live Firestore feed scoped by the current user's
// audience (admin → all, staff → branch, fleet → company). Clicking a row
// marks it read + navigates to the linked appointment / quotation.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { watchNotifications, markRead, markAllRead } from '../lib/notifications'
import Icon from '../components/ui/Icon'

const ICONS = {
  booking:   { name: 'calendar', tone: 'bg-sky-100 text-sky-700' },
  quotation: { name: 'doc',      tone: 'bg-indigo-100 text-indigo-700' },
  approval:  { name: 'warn',     tone: 'bg-red-100 text-red-700' },
  service:   { name: 'check',    tone: 'bg-green-100 text-green-700' },
  status:    { name: 'tool',     tone: 'bg-amber-100 text-amber-700' },
}

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 172800) return 'yesterday'
  return d.toLocaleDateString()
}

export default function Notifications() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [source, setSource] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profile) return
    const unsub = watchNotifications(profile, ({ rows, source, error }) => {
      setRows(rows)
      setSource(source)
      setError(error)
    })
    return unsub
  }, [profile])

  const unread = rows.filter((n) => !n.read).length

  const open = async (n) => {
    if (!n.read) await markRead(n.id)
    if (n.link) navigate(n.link)
  }

  const markAll = async () => {
    const unreadIds = rows.filter((n) => !n.read).map((n) => n.id)
    await markAllRead(unreadIds)
  }

  return (
    <div className="p-4 sm:p-6 pb-20">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Notifications</h1>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button onClick={markAll} className="text-xs text-brand hover:underline">
              Mark all read
            </button>
          )}
          <span className="text-sm text-gray-500">{unread} unread</span>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded border border-amber-200 bg-amber-50 text-amber-700 px-3 py-2 text-xs">
          Read blocked — check Firestore rules for `notifications` collection.
        </div>
      )}

      <div className="bg-white rounded-md border divide-y">
        {source === 'loading' && (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">Loading…</div>
        )}
        {source !== 'loading' && rows.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">No notifications.</div>
        )}
        {rows.map((n) => {
          const ico = ICONS[n.kind] || ICONS.service
          return (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 ${n.read ? 'bg-white' : 'bg-sky-50/40'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ico.tone}`}>
                <Icon name={ico.name} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${n.read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                  {n.title}
                </div>
                {n.body && (
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</div>
                )}
                <div className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</div>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
