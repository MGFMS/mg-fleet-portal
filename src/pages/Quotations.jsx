// Service Quotations list — both staff and customer view. Customer view shows
// Approve/Reject for fleet_manager users with quotation_approver=true.
//
// Mobile: card-per-quotation layout with one-tap Approve/Reject buttons
// (the daily customer action — biggest reason this page exists).
// Desktop: keeps the paginated table.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatMoney } from '../lib/dummyData'
import { watchReceipts, setReceiptStatus } from '../lib/serviceReceipts'
import StatusPill from '../components/ui/StatusPill'
import Icon from '../components/ui/Icon'
import { canApproveQuotations, isCustomer } from '../lib/roles'
import { profileCompany } from '../lib/vehicles'
import PageHero, { HeroStat } from '../components/ui/PageHero'

const STATUS_TABS = [
  { key: 'OPEN',        label: 'Open' },
  { key: 'APPROVED',    label: 'Approved' },
  { key: 'DISAPPROVED', label: 'Rejected' },
  { key: 'PAID',        label: 'Paid' },
  { key: 'ALL',         label: 'All' },
]

export default function Quotations({ unbilledOnly = false, customerView: customerViewProp }) {
  const { profile } = useAuth()
  const customerView = customerViewProp ?? isCustomer(profile?.role)
  const canApprove = canApproveQuotations(profile?.role) || profile?.quotation_approver === true
  const companyFilter = customerView ? (profileCompany(profile) || 'PUREFOODS').toUpperCase() : null

  const [rows, setRows] = useState([])
  const [source, setSource] = useState('loading')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('OPEN')
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    const unsub = watchReceipts(
      companyFilter
        ? { kind: 'quotation', company: companyFilter, dummyFallback: true }
        : { kind: 'quotation', dummyFallback: true },
      ({ rows, source }) => {
        const shaped = rows.map((r) => ({ ...r, code: r.code.startsWith('Q-') ? r.code.replace('Q-', 'SQ-') : r.code, kind: 'quotation' }))
        setRows(shaped); setSource(source)
      },
    )
    return unsub
  }, [companyFilter])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((q) => {
      if (status !== 'ALL' && q.status !== status) return false
      if (unbilledOnly && q.status === 'PAID') return false
      if (!term) return true
      return [q.code, q.plateNo, q.customer].join(' ').toLowerCase().includes(term)
    })
  }, [rows, search, status, unbilledOnly])

  // Count per status for the tab badges.
  const counts = useMemo(() => {
    const c = { OPEN: 0, APPROVED: 0, DISAPPROVED: 0, PAID: 0, ALL: 0 }
    for (const q of rows) {
      if (unbilledOnly && q.status === 'PAID') continue
      c.ALL++
      if (c[q.status] != null) c[q.status]++
    }
    return c
  }, [rows, unbilledOnly])

  const doStatus = async (q, nextStatus) => {
    if (!q.id) return
    setBusy(q.id)
    try {
      await setReceiptStatus(q.id, nextStatus)
    } catch (err) {
      alert('Failed: ' + (err.message || err))
    } finally {
      setBusy(null)
    }
  }

  const title = unbilledOnly ? 'Services for Quotation' : 'Service Quotations'
  const needsAction = customerView && canApprove ? rows.filter((q) => q.status === 'OPEN').length : 0

  return (
    <div className="pb-24">
      <PageHero
        eyebrow={unbilledOnly ? 'SERVICES FOR QUOTATION' : 'QUOTATIONS'}
        title={title}
        subtitle={customerView
          ? (needsAction > 0 ? `${needsAction} awaiting your approval` : 'All caught up')
          : `${rows.length} total`}
        right={<HeroStat value={customerView ? needsAction : rows.length} label={customerView ? 'TO REVIEW' : 'TOTAL'} tone="solid" />}
      />

      {source === 'dummy' && (
        <div className="mx-3 sm:mx-6 mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Showing demo data.
        </div>
      )}

      <div className="px-3 sm:px-6 pt-4 space-y-4">
        {/* Status tabs — horizontal scroll chips */}
        <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`shrink-0 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
                status === t.key ? 'bg-brand text-white' : 'bg-white border text-gray-700'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${status === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, plate, customer…"
            className="input pl-9"
          />
        </div>

        {/* Mobile: card list */}
        <div className="lg:hidden space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-gray-400 text-sm">
              No quotations match.
            </div>
          )}
          {filtered.map((q) => (
            <QuotationCard
              key={q.id || q.code}
              q={q}
              canApprove={customerView && canApprove}
              busy={busy === q.id}
              onApprove={() => doStatus(q, 'APPROVED')}
              onReject={() => doStatus(q, 'DISAPPROVED')}
            />
          ))}
        </div>

        {/* Desktop: table */}
        <div className="hidden lg:block bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Plate No</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No quotations.</td></tr>
                )}
                {filtered.map((q) => (
                  <tr key={q.id || q.code} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono font-semibold text-brand">{q.code}</td>
                    <td className="px-4 py-2">{formatDate(q.dateCreated)}</td>
                    <td className="px-4 py-2">
                      <Link to={`/vehicles/${q.plateNo}`} className="font-semibold hover:underline">{q.plateNo}</Link>
                    </td>
                    <td className="px-4 py-2 uppercase">{q.customer}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatMoney(q.estimatedTotal)}</td>
                    <td className="px-4 py-2 text-right"><StatusPill status={q.status} size="sm" /></td>
                    <td className="px-4 py-2 text-right text-xs whitespace-nowrap">
                      <Link to={`/service-receipts/${q.code.replace('SQ-', 'Q-')}`} className="text-brand hover:underline">View</Link>
                      {customerView && canApprove && q.status === 'OPEN' && (
                        <>
                          <button disabled={busy === q.id} onClick={() => doStatus(q, 'APPROVED')} className="ml-3 text-green-600 hover:underline disabled:opacity-40">Approve</button>
                          <button disabled={busy === q.id} onClick={() => doStatus(q, 'DISAPPROVED')} className="ml-3 text-red-500 hover:underline disabled:opacity-40">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!customerView && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-20">
          <Link to="/quotations/create" className="bg-brand hover:bg-brand-dark text-white px-4 sm:px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
            <Icon name="plus" className="w-4 h-4" />
            New Quotation
          </Link>
        </div>
      )}
    </div>
  )
}

// Mobile quotation card — the money line is prominent, approve/reject are
// oversized tap targets (customer-facing daily action).
function QuotationCard({ q, canApprove, busy, onApprove, onReject }) {
  const isOpen = q.status === 'OPEN'
  const showActions = canApprove && isOpen
  const code = q.code
  const viewPath = `/service-receipts/${code.replace('SQ-', 'Q-')}`
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${isOpen && canApprove ? 'border-amber-200' : ''}`}>
      <Link to={viewPath} className="block p-4 hover:bg-gray-50">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-mono font-black text-brand text-sm">{code}</div>
          <StatusPill status={q.status} size="sm" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-black text-gray-900 tracking-wide">{q.plateNo}</div>
          <div className="text-xl font-black text-gray-900">{formatMoney(q.estimatedTotal)}</div>
        </div>
        <div className="text-xs text-gray-500 uppercase mt-0.5 truncate">{q.customer}</div>
        <div className="text-[11px] text-gray-400 mt-1">{formatDate(q.dateCreated)}</div>
      </Link>
      {showActions && (
        <div className="grid grid-cols-2 gap-2 p-3 border-t bg-amber-50/50">
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="text-sm font-bold bg-white border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40 px-3 py-3 rounded-xl active:scale-95 transition-transform"
          >
            ✕ Reject
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="text-sm font-bold bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 px-3 py-3 rounded-xl active:scale-95 transition-transform shadow"
          >
            ✓ Approve
          </button>
        </div>
      )}
    </div>
  )
}
