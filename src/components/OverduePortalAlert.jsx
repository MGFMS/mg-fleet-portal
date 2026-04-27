// Top-of-portal overdue banner. Renders only when the fleet client has
// at least one OPEN invoice past its due date. Hard to miss, links to
// the filtered invoice list. Becomes invisible (returns null) once
// everything's current — no nag when there's nothing to nag about.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../lib/dummyData'
import {
  CLIENT_INVOICE_STATUS, agingFor, watchClientInvoices,
} from '../lib/clientInvoices'

export default function OverduePortalAlert({ company }) {
  const [invoices, setInvoices] = useState([])
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!company) return () => {}
    const unsub = watchClientInvoices({ company }, ({ rows }) => setInvoices(rows))
    return unsub
  }, [company])

  const overdue = useMemo(() => {
    const list = []
    for (const inv of invoices) {
      if (inv.status !== CLIENT_INVOICE_STATUS.OPEN) continue
      const a = agingFor(inv, now)
      if (a.daysPastDue > 0) list.push({ inv, days: a.daysPastDue })
    }
    return list.sort((a, b) => b.days - a.days)
  }, [invoices, now])

  if (overdue.length === 0) return null

  const total = overdue.reduce((s, { inv }) => s + (Number(inv.balanceDue ?? inv.total) || 0), 0)
  const oldest = overdue[0]

  return (
    <div className="mx-3 sm:mx-6 mt-3 bg-red-600 text-white rounded-2xl p-4 shadow-md">
      <div className="flex items-start gap-3">
        <div className="text-2xl leading-none">⏰</div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-base">
            {overdue.length} invoice{overdue.length === 1 ? '' : 's'} past due — {formatMoney(total)} outstanding
          </div>
          <div className="text-xs mt-1 text-white/85">
            Oldest: <span className="font-mono font-bold">{oldest.inv.code}</span> · {oldest.days} day{oldest.days === 1 ? '' : 's'} overdue.
            Settle these to keep your fleet account in good standing.
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to="/portal/invoices"
              className="bg-white text-red-700 hover:bg-red-50 font-bold text-xs px-3 py-1.5 rounded-full"
            >
              View all overdue →
            </Link>
            <Link
              to={`/client-invoices/${oldest.inv.code}`}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-3 py-1.5 rounded-full border border-red-400"
            >
              Pay {oldest.inv.code} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
