// Branch Invoices — bills raised by a branch against MG Fleet once a fleet
// job has cleared the reassessment gate. Staff-only view (internal); fleet
// clients see the MG-Fleet-to-client side when Round 13 ships.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatMoney, formatDate } from '../lib/dummyData'
import { watchBranchInvoices, BRANCH_INVOICE_STATUS } from '../lib/branchInvoices'
import StatusPill from '../components/ui/StatusPill'
import Icon from '../components/ui/Icon'
import PageHero, { HeroStat } from '../components/ui/PageHero'

const STATUS_TABS = [
  { key: BRANCH_INVOICE_STATUS.OPEN, label: 'Open' },
  { key: BRANCH_INVOICE_STATUS.PAID, label: 'Paid' },
  { key: BRANCH_INVOICE_STATUS.VOID, label: 'Void' },
  { key: 'ALL',                       label: 'All' },
]

export default function BranchInvoices() {
  const { profile } = useAuth()
  const branch = (profile?.branch || '').toUpperCase()
  const [rows, setRows] = useState([])
  const [source, setSource] = useState('loading')
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState(BRANCH_INVOICE_STATUS.OPEN)

  useEffect(() => {
    // Admin sees every branch; branch staff see only their own by default.
    const opts = profile?.is_admin ? {} : (branch ? { branch } : {})
    const unsub = watchBranchInvoices(opts, ({ rows, source }) => {
      setRows(rows); setSource(source)
    })
    return unsub
  }, [branch, profile?.is_admin])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusTab !== 'ALL' && r.status !== statusTab) return false
      if (!term) return true
      return [r.code, r.plateNo, r.customer, r.company, r.quotationCode, r.reassessmentRwa]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [rows, search, statusTab])

  const counts = useMemo(() => {
    const c = { [BRANCH_INVOICE_STATUS.OPEN]: 0, [BRANCH_INVOICE_STATUS.PAID]: 0, [BRANCH_INVOICE_STATUS.VOID]: 0, ALL: rows.length }
    for (const r of rows) if (c[r.status] != null) c[r.status]++
    return c
  }, [rows])

  const openTotal = useMemo(() =>
    rows.filter((r) => r.status === BRANCH_INVOICE_STATUS.OPEN).reduce((s, r) => s + (r.total || 0), 0),
  [rows])

  return (
    <div className="pb-24">
      <PageHero
        eyebrow="BRANCH INVOICES"
        title={profile?.is_admin ? 'All branches' : (branch || 'Branch')}
        subtitle={`${rows.length} total · ${formatMoney(openTotal)} open receivable`}
        right={<HeroStat value={counts[BRANCH_INVOICE_STATUS.OPEN] || 0} label="OPEN" tone="solid" />}
      />

      {source === 'error' && (
        <div className="mx-3 sm:mx-6 mt-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          Read blocked by Firestore rules.
        </div>
      )}

      <div className="px-3 sm:px-6 pt-4 space-y-4">
        <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusTab(t.key)}
              className={`shrink-0 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
                statusTab === t.key ? 'bg-brand text-white' : 'bg-white border text-gray-700'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${statusTab === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, plate, company, RWA…"
            className="input pl-9"
          />
        </div>

        <div className="lg:hidden space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-gray-400 text-sm">
              No branch invoices match.
            </div>
          )}
          {filtered.map((r) => <InvoiceCard key={r.id || r.code} r={r} />)}
        </div>

        <div className="hidden lg:block bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Issued</th>
                  <th className="px-4 py-3 text-left font-medium">Plate</th>
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Branch</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No branch invoices.</td></tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id || r.code} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link to={`/branch-invoices/${r.code}`} className="text-brand font-mono font-semibold hover:underline">
                        {r.code}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">{formatDate(r.issuedAtIso)}</td>
                    <td className="px-4 py-2">
                      <Link to={`/vehicles/${r.plateNo}`} className="font-semibold text-gray-800 hover:text-brand">{r.plateNo}</Link>
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-gray-600 truncate max-w-[200px]">{r.company || 'WALK-IN'}</td>
                    <td className="px-4 py-2 text-xs font-mono text-gray-600">{r.branch || '—'}</td>
                    <td className="px-4 py-2 text-xs">
                      {r.quotationCode && (
                        <Link to={`/service-receipts/${r.quotationCode}`} className="text-brand hover:underline font-mono">
                          {r.quotationCode}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">{formatMoney(r.total)}</td>
                    <td className="px-4 py-2 text-right"><StatusPill status={r.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function InvoiceCard({ r }) {
  return (
    <Link
      to={`/branch-invoices/${r.code}`}
      className="block bg-white rounded-2xl border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-mono font-black text-brand text-sm">{r.code}</div>
        <StatusPill status={r.status} size="sm" />
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-black text-gray-900 tracking-wide">{r.plateNo}</div>
        <div className="text-xl font-black text-gray-900">{formatMoney(r.total)}</div>
      </div>
      <div className="text-xs text-gray-500 uppercase truncate mt-0.5">{r.company || 'WALK-IN'}</div>
      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-gray-400">
        <span>{formatDate(r.issuedAtIso)} · {r.branch}</span>
        {r.quotationCode && <span className="font-mono">{r.quotationCode}</span>}
      </div>
    </Link>
  )
}
