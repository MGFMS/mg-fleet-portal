// Notifications list. Live Firestore feed scoped by the current user's
// audience (admin → all, staff → branch, fleet → company). Clicking a row
// marks it read + navigates to the linked appointment / quotation.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { watchNotifications, markRead, markAllRead } from '../lib/notifications'
import Icon from '../components/ui/Icon'
import PageHero from '../components/ui/PageHero'

const ICONS = {
  booking:   { name: 'calendar', tone: 'bg-sky-100 text-sky-700' },
  quotation: { name: 'doc',      tone: 'bg-indigo-100 text-indigo-700' },
  approval:  { name: 'warn',     tone: 'bg-red-100 text-red-700' },
  service:   { name: 'check',    tone: 'bg-green-100 text-green-700' },
  status:    { name: 'tool',     tone: 'bg-amber-100 text-amber-700' },
  arrival:   { name: 'car',      tone: 'bg-sky-100 text-sky-700' },
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
  const [tab, setTab] = useState('all')

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
  const visible = useMemo(() => tab === 'unread' ? rows.filter((n) => !n.read) : rows, [rows, tab])

  const open = async (n) => {
    if (!n.read) await markRead(n.id)
    if (n.link) navigate(n.link)
  }

  const markAll = async () => {
    const unreadIds = rows.filter((n) => !n.read).map((n) => n.id)
    await markAllRead(unreadIds)
  }

  return (
    <div className="pb-20">
      <PageHero
        eyebrow="ALERTS"
        title="Notifications"
        subtitle={unread === 0 ? "You're all caught up." : `${unread} unread`}
        right={unread > 0 && (
          <button
            onClick={markAll}
            className="text-[11px] bg-white/20 hover:bg-white/30 text-white font-bold uppercase tracking-wider px-3 py-2 rounded-full"
          >
            Mark all read
          </button>
        )}
      />

      {error && (
        <div className="mx-3 sm:mx-6 mt-3 rounded border border-amber-200 bg-amber-50 text-amber-700 px-3 py-2 text-xs">
          Read blocked — check Firestore rules for the `notifications` collection.
        </div>
      )}

      {/* Tab chips — All / Unread */}
      <div className="px-3 sm:px-6 pt-4 flex gap-2">
        {[
          ['all',    `All · ${rows.length}`],
          ['unread', `Unread · ${unread}`],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors ${
              tab === key ? 'bg-brand text-white' : 'bg-white border text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-3 sm:px-6 pt-3">
        <div className="bg-white rounded-2xl border divide-y overflow-hidden">
          {source === 'loading' && (
            <div className="px-4 py-10 text-center text-gray-400 text-sm">Loading…</div>
          )}
          {source !== 'loading' && visible.length === 0 && (
            <div className="px-4 py-12 text-center text-sm">
              <div className="text-4xl mb-2">🎉</div>
              <div className="font-bold text-gray-700 mb-0.5">
                {tab === 'unread' ? "You're all caught up" : 'No notifications yet'}
              </div>
              <div className="text-xs text-gray-400">
                {tab === 'unread' ? 'Every message here has been read.' : 'Updates about your fleet will show up here.'}
              </div>
            </div>
          )}
          {visible.map((n) => {
            const ico = ICONS[n.kind] || ICONS.service
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`w-full text-left flex items-start gap-3 px-3 sm:px-4 py-3 hover:bg-gray-50 ${n.read ? 'bg-white' : 'bg-red-50/40'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ico.tone}`}>
                  <Icon name={ico.name} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm leading-snug break-words ${n.read ? 'text-gray-700' : 'font-bold text-gray-900'}`}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div className="text-xs text-gray-500 mt-0.5 break-words line-clamp-2">{n.body}</div>
                  )}
                  <div className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
