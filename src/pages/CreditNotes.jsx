// Credit Notes — list view, internal staff only. Lets finance scan all CNs
// across both ledgers (BRANCH and CLIENT) for reconciling against monthly
// statements. The detail / void / issue flows live on the source invoice
// page; this is a read-only registry.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney, formatDate } from '../lib/dummyData'
import {
  CREDIT_NOTE_KIND, CREDIT_NOTE_STATUS, watchCreditNotes,
} from '../lib/creditNotes'
import Icon from '../components/ui/Icon'
import PageHero, { HeroStat } from '../components/ui/PageHero'

const KIND_TABS = [
  { key: 'ALL',                       label: 'All' },
  { key: CREDIT_NOTE_KIND.BRANCH,     label: 'Branch (MG Fleet ↓)' },
  { key: CREDIT_NOTE_KIND.CLIENT,     label: 'Client (MG Fleet ↑)' },
]

export default function CreditNotes() {
  const [rows, setRows] = useState([])
  const [source, setSource] = useState('loading')
  const [kindTab, setKindTab] = useState('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const unsub = watchCreditNotes({}, ({ rows, source }) => {
      setRows(rows); setSource(source)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (kindTab !== 'ALL' && r.kind !== kindTab) return false
      if (!term) return true
      return [r.code, r.sourceInvoiceCode, r.plateNo, r.company, r.branch, r.reason]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [rows, search, kindTab])

  const issuedTotal = useMemo(() =>
    rows
      .filter((r) => r.status === CREDIT_NOTE_STATUS.ISSUED)
      .reduce((s, r) => s + (Number(r.amount) || 0), 0),
  [rows])

  return (
    <div className="pb-24">
      <PageHero
        eyebrow="CREDIT NOTES"
        title="MG Fleet credit ledger"
        subtitle={`${rows.length} total · ${formatMoney(issuedTotal)} issued`}
        right={<HeroStat value={rows.length} label="TOTAL" tone="solid" />}
      />

      {source === 'error' && (
        <div className="mx-3 sm:mx-6 mt-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          Read blocked by Firestore rules.
        </div>
      )}

      <div className="px-3 sm:px-6 pt-4 space-y-4">
        <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
          {KIND_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setKindTab(t.key)}
              className={`shrink-0 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
                kindTab === t.key ? 'bg-brand text-white' : 'bg-white border text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, source, plate, reason…"
            className="input pl-9"
          />
        </div>

        <div className="lg:hidden space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-gray-400 text-sm">
              No credit notes match.
            </div>
          )}
          {filtered.map((r) => <CreditNoteCard key={r.id || r.code} cn={r} />)}
        </div>

        <div className="hidden lg:block bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Issued</th>
                  <th className="px-4 py-3 text-left font-medium">Kind</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-left font-medium">Plate / Company</th>
                  <th className="px-4 py-3 text-left font-medium">Reason</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No credit notes.</td></tr>
                )}
                {filtered.map((r) => {
                  const sourceUrl = r.kind === CREDIT_NOTE_KIND.BRANCH
                    ? `/branch-invoices/${r.sourceInvoiceCode}`
                    : `/client-invoices/${r.sourceInvoiceCode}`
                  return (
                    <tr key={r.id || r.code} className={`hover:bg-gray-50 ${r.status === CREDIT_NOTE_STATUS.VOID ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-2">
                        <Link to={`/credit-notes/${r.code}`} className="text-brand font-mono font-semibold hover:underline">
                          {r.code}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">{formatDate(r.issuedAtIso)}</td>
                      <td className="px-4 py-2 text-xs">
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${r.kind === CREDIT_NOTE_KIND.BRANCH ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'}`}>
                          {r.kind}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {r.sourceInvoiceCode && (
                          <Link to={sourceUrl} className="text-brand font-mono hover:underline">
                            {r.sourceInvoiceCode}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        <div className="font-bold">{r.plateNo || '—'}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[180px]">{r.company || r.branch || '—'}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 italic truncate max-w-[260px]">"{r.reason}"</td>
                      <td className={`px-4 py-2 text-right font-bold ${r.status === CREDIT_NOTE_STATUS.VOID ? 'text-gray-400 line-through' : 'text-amber-700'}`}>
                        −{formatMoney(r.amount)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${r.status === CREDIT_NOTE_STATUS.VOID ? 'bg-slate-500 text-white' : 'bg-amber-600 text-white'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreditNoteCard({ cn }) {
  const sourceUrl = cn.kind === CREDIT_NOTE_KIND.BRANCH
    ? `/branch-invoices/${cn.sourceInvoiceCode}`
    : `/client-invoices/${cn.sourceInvoiceCode}`
  const isVoid = cn.status === CREDIT_NOTE_STATUS.VOID
  return (
    <Link
      to={`/credit-notes/${cn.code}`}
      className={`block bg-white rounded-2xl border p-4 hover:shadow-md transition-shadow ${isVoid ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-mono font-black text-brand text-sm">{cn.code}</div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isVoid ? 'bg-slate-500 text-white' : 'bg-amber-600 text-white'}`}>
          {cn.status}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-black text-gray-900 tracking-wide">{cn.plateNo || '—'}</div>
        <div className={`text-xl font-black ${isVoid ? 'text-gray-400 line-through' : 'text-amber-700'}`}>
          −{formatMoney(cn.amount)}
        </div>
      </div>
      <div className="text-xs text-gray-500 uppercase truncate mt-0.5">{cn.company || cn.branch || '—'}</div>
      <div className="text-[11px] text-gray-600 italic mt-2 line-clamp-2">"{cn.reason}"</div>
      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-gray-400">
        <span>{formatDate(cn.issuedAtIso)} · {cn.kind}</span>
        <span className="font-mono text-brand">{cn.sourceInvoiceCode}</span>
      </div>
    </Link>
  )
}
