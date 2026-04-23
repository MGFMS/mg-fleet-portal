// Service Receipts list — live Firestore backed.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatMoney } from '../lib/dummyData'
import { watchReceipts } from '../lib/serviceReceipts'
import StatusPill from '../components/ui/StatusPill'
import Icon from '../components/ui/Icon'

const PAGE_SIZES = [10, 25, 50, 100]

export default function ServiceReceipts() {
  const { profile } = useAuth()
  const branch = (profile?.branch || 'MGCAVITE').toUpperCase()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('OPEN')
  const [pageSize, setPageSize] = useState(10)
  const [rows, setRows] = useState([])
  const [source, setSource] = useState('loading')

  useEffect(() => {
    const unsub = watchReceipts({ kind: 'receipt', dummyFallback: true }, ({ rows, source }) => {
      setRows(rows); setSource(source)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (status !== 'ALL' && r.status !== status) return false
      if (!term) return true
      return [r.code, r.plateNo, r.customer, r.mechanic].join(' ').toLowerCase().includes(term)
    })
  }, [rows, search, status])

  return (
    <div className="p-4 sm:p-6 pb-20">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 truncate">Service Receipts {branch}</h1>
        {source === 'dummy' && <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 shrink-0">Demo data</span>}
      </div>

      <div className="bg-white rounded-md border">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b gap-2 flex-wrap">
          <div className="text-sm text-gray-600">
            Show{' '}
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1 mx-1 text-sm">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            entries
          </div>
          <div className="text-sm text-gray-600">
            Search:{' '}
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-2 py-1 text-sm ml-1" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Date Created</th>
                <th className="px-4 py-3 text-left font-medium">Plate No</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Mechanic</th>
                <th className="px-4 py-3 text-left font-medium">Person In Charge</th>
                <th className="px-4 py-3 text-center font-medium">Missing Parts</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No service receipts.</td></tr>
              )}
              {filtered.slice(0, pageSize).map((r) => (
                <tr key={r.id || r.code} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link to={`/service-receipts/${r.code}`} className="text-brand font-mono font-semibold hover:underline">{r.code}</Link>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(r.dateCreated)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link to={`/vehicles/${r.plateNo}`} className="font-semibold text-gray-800 hover:text-brand">{r.plateNo}</Link>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap uppercase">{r.customer}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{r.mechanic}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{r.personInCharge}</td>
                  <td className="px-4 py-2 text-center">
                    {r.missingParts > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-red-500 text-white text-xs font-bold">{r.missingParts}</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap font-semibold">{formatMoney(r.estimatedTotal)}</td>
                  <td className="px-4 py-2 text-right"><StatusPill status={r.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
          <div>Showing 1 to {Math.min(filtered.length, pageSize)} of {filtered.length} entries</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border rounded">Previous</button>
            <span className="px-2 py-1 bg-brand text-white rounded">1</span>
            <button className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex items-center gap-3">
        <div className="bg-gray-900 text-white px-3 py-2 rounded text-xs flex items-center gap-2">
          <span className="text-gray-400">Filter Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent text-white text-xs">
            <option value="ALL">ALL</option>
            <option value="OPEN">OPEN</option>
            <option value="PAID">PAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <Link to="/service-receipts/create" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold text-sm flex items-center gap-1.5">
          <Icon name="plus" className="w-4 h-4" />
          Create SERVICE RECEIPT
        </Link>
      </div>
    </div>
  )
}
