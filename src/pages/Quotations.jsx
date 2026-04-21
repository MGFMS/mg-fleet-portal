// Service Quotations list — both staff and customer view. Customer view shows
// Approve/Reject for fleet_manager users with quotation_approver=true.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatMoney } from '../lib/dummyData'
import { watchReceipts, setReceiptStatus } from '../lib/serviceReceipts'
import StatusPill from '../components/ui/StatusPill'
import Icon from '../components/ui/Icon'
import { canApproveQuotations, isCustomer } from '../lib/roles'
import { profileCompany } from '../lib/vehicles'

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
    // quotations use kind='quotation' in the same collection as receipts. In
    // dummy fallback they come through as receipts; we re-prefix the code.
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

  return (
    <div className="p-6 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          {unbilledOnly ? 'Services for Quotation' : 'Service Quotations'}
        </h1>
        {source === 'dummy' && <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">Demo data</span>}
      </div>

      <div className="bg-white rounded-md border">
        <div className="flex items-center justify-between px-4 py-3 border-b gap-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="ALL">All statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DISAPPROVED">DISAPPROVED</option>
            <option value="PAID">PAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, plate, customer..." className="border rounded px-2 py-1 text-sm w-64" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
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

      {!customerView && (
        <div className="fixed bottom-6 right-6">
          <Link to="/quotations/create" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold text-sm flex items-center gap-1.5 shadow-lg">
            <Icon name="plus" className="w-4 h-4" />
            Create QUOTATION
          </Link>
        </div>
      )}
    </div>
  )
}
