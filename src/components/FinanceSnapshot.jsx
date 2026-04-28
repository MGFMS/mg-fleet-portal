// Internal finance snapshot — surfaces the money KPIs on the My Garage
// landing for finance / branch_manager / admin roles. Two ledgers,
// matching the 3-party flow:
//
//   - Receivables (MG Fleet → fleet client). What's owed by clients.
//   - Payables    (branch → MG Fleet). What MG Fleet owes branches.
//
// Per ledger we show count + total open + overdue carve-out. Quick
// links to the existing list pages and the Receivables Aging report.
//
// Visible only to roles that actually deal with money. Other roles
// (mechanic, dispatcher) don't need this on their landing.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../lib/dummyData'
import {
  CLIENT_INVOICE_STATUS, agingFor as agingClient, watchClientInvoices,
} from '../lib/clientInvoices'
import {
  BRANCH_INVOICE_STATUS, agingFor as agingBranch, watchBranchInvoices,
} from '../lib/branchInvoices'

export default function FinanceSnapshot({ profile }) {
  const role = String(profile?.role || '').toLowerCase()
  const eligible =
    profile?.is_admin ||
    role === 'finance' ||
    role === 'branch_manager' ||
    role === 'admin_supervisor'
  if (!eligible) return null

  const [clientInvoices, setClientInvoices] = useState([])
  const [branchInvoices, setBranchInvoices] = useState([])
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    // Admin / finance see all client invoices. Branch staff (branch
    // manager scoped to a branch) see all client invoices too — payment
    // collection is centralized at MG Fleet, but the branch needs
    // visibility on receivables tied to jobs they did.
    const u1 = watchClientInvoices({}, ({ rows }) => setClientInvoices(rows))
    // Branch invoices: branch staff see only their branch; admin/finance see all.
    const branch = (profile?.branch || '').toUpperCase()
    const opts = profile?.is_admin || role === 'finance' ? {} : (branch ? { branch } : {})
    const u2 = watchBranchInvoices(opts, ({ rows }) => setBranchInvoices(rows))
    return () => { u1?.(); u2?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.is_admin, profile?.branch, role])

  const recv = useMemo(() => sum(clientInvoices, CLIENT_INVOICE_STATUS.OPEN, agingClient, now), [clientInvoices, now])
  const pay  = useMemo(() => sum(branchInvoices, BRANCH_INVOICE_STATUS.OPEN, agingBranch, now), [branchInvoices, now])

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-gray-800">
          <span>💰</span>
          <h2>Finance</h2>
        </div>
        <Link to="/reports/receivables" className="text-xs text-brand font-bold hover:underline">
          Aging report →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <LedgerCard
          title="Client Receivables"
          subtitle="MG Fleet ← Clients"
          openCount={recv.openCount}
          openTotal={recv.openTotal}
          overdueCount={recv.overdueCount}
          overdueTotal={recv.overdueTotal}
          listHref="/client-invoices"
          tone="emerald"
        />
        <LedgerCard
          title="Branch Payables"
          subtitle="MG Fleet → Branches"
          openCount={pay.openCount}
          openTotal={pay.openTotal}
          overdueCount={pay.overdueCount}
          overdueTotal={pay.overdueTotal}
          listHref="/branch-invoices"
          tone="sky"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <Link to="/client-invoices" className="bg-white border rounded-full px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50">
          Client invoices ({clientInvoices.length})
        </Link>
        <Link to="/branch-invoices" className="bg-white border rounded-full px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50">
          Branch invoices ({branchInvoices.length})
        </Link>
        <Link to="/credit-notes" className="bg-white border rounded-full px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50">
          Credit notes
        </Link>
        <Link to="/reports/receivables" className="bg-white border rounded-full px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50">
          Aging
        </Link>
      </div>
    </section>
  )
}

function LedgerCard({ title, subtitle, openCount, openTotal, overdueCount, overdueTotal, listHref, tone }) {
  const palette = {
    emerald: { wrap: 'bg-emerald-50 border-emerald-200', accent: 'text-emerald-800' },
    sky:     { wrap: 'bg-sky-50 border-sky-200',         accent: 'text-sky-800' },
  }
  const v = palette[tone] || palette.emerald

  return (
    <Link
      to={listHref}
      className={`block rounded-2xl border-2 p-4 hover:shadow-md transition-shadow ${v.wrap}`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div>
          <div className={`font-black text-sm ${v.accent}`}>{title}</div>
          <div className="text-[10px] text-gray-600 uppercase tracking-wider">{subtitle}</div>
        </div>
        <div className="text-[10px] text-gray-500">{openCount} open</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Outstanding</div>
          <div className="text-lg font-black text-gray-900 leading-tight">{formatMoney(openTotal)}</div>
        </div>
        <div className={`rounded-xl px-3 py-2 ${overdueCount > 0 ? 'bg-red-100' : 'bg-white'}`}>
          <div className={`text-[9px] font-bold uppercase tracking-widest ${overdueCount > 0 ? 'text-red-700' : 'text-gray-500'}`}>
            Overdue
          </div>
          <div className={`text-lg font-black leading-tight ${overdueCount > 0 ? 'text-red-700' : 'text-gray-300'}`}>
            {overdueCount > 0 ? formatMoney(overdueTotal) : '—'}
          </div>
        </div>
      </div>
    </Link>
  )
}

function sum(invoices, openStatus, agingFn, now) {
  let openCount = 0
  let openTotal = 0
  let overdueCount = 0
  let overdueTotal = 0
  for (const inv of invoices) {
    if (inv.status !== openStatus) continue
    const bal = Number(inv.balanceDue ?? inv.total) || 0
    openCount++
    openTotal += bal
    if (agingFn(inv, now).daysPastDue > 0) {
      overdueCount++
      overdueTotal += bal
    }
  }
  return { openCount, openTotal, overdueCount, overdueTotal }
}
