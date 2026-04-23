// Staff "Fleet" / all-vehicles list. Reads live from Firestore via watchVehicles
// with no company filter — staff see everything.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { watchVehicles, formatDate } from '../lib/vehicles'
import RoadworthyBadge from '../components/ui/RoadworthyBadge'
import Icon from '../components/ui/Icon'

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [source, setSource] = useState('loading')
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState('ALL')
  const [roadworthy, setRoadworthy] = useState('ALL')

  useEffect(() => {
    const unsub = watchVehicles({}, ({ vehicles, source }) => {
      setVehicles(vehicles); setSource(source)
    })
    return unsub
  }, [])

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return vehicles.filter((v) => {
      if (company !== 'ALL' && (v.company || 'WALK-IN') !== company) return false
      if (roadworthy !== 'ALL' && v.roadworthy !== roadworthy) return false
      if (!term) return true
      return [v.plateNo, v.brandModel, v.yearModel, v.assignedTo].join(' ').toLowerCase().includes(term)
    })
  }, [vehicles, search, company, roadworthy])

  const companies = useMemo(() => {
    const s = new Set()
    for (const v of vehicles) s.add(v.company || 'WALK-IN')
    return Array.from(s).sort()
  }, [vehicles])

  return (
    <div className="p-4 sm:p-6 pb-20">
      <div className="flex items-start justify-between mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 truncate">Fleet (All Vehicles)</h1>
        {source === 'error' && <span className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5 shrink-0">Read blocked</span>}
      </div>

      <div className="bg-white rounded-md border">
        <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-3 border-b gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={company} onChange={(e) => setCompany(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="ALL">All companies</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={roadworthy} onChange={(e) => setRoadworthy(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="ALL">All statuses</option>
              <option value="active">Active / Roadworthy</option>
              <option value="minor">Minor Repairs Needed</option>
              <option value="unfit">Unfit for Use</option>
            </select>
            <span className="text-xs text-gray-500">{rows.length} vehicles</span>
          </div>
          <div className="flex items-center gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plate, model, driver..." className="border rounded px-2 py-1 text-sm w-full sm:w-64" />
            <button className="bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1">
              <Icon name="plus" className="w-4 h-4" />
              Add Vehicle
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Plate No</th>
                <th className="px-4 py-3 text-left font-medium">Brand/Model</th>
                <th className="px-4 py-3 text-left font-medium">Year</th>
                <th className="px-4 py-3 text-left font-medium">Technician</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Branch</th>
                <th className="px-4 py-3 text-right font-medium">Odo</th>
                <th className="px-4 py-3 text-left font-medium">Next PMS</th>
                <th className="px-4 py-3 text-left font-medium">Roadworthy</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No vehicles match.</td></tr>
              )}
              {rows.map((v, i) => (
                <tr key={v.plateNo + i} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link to={`/vehicles/${v.plateNo}`} className="text-brand font-semibold hover:underline">{v.plateNo}</Link>
                  </td>
                  <td className="px-4 py-2">{v.brandModel}</td>
                  <td className="px-4 py-2">{v.yearModel}</td>
                  <td className="px-4 py-2 uppercase">{v.assignedTo || '—'}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{v.company || 'WALK-IN'}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{v.branch || '—'}</td>
                  <td className="px-4 py-2 text-right">{v.latestOdo?.toLocaleString() || '-'}</td>
                  <td className="px-4 py-2">{formatDate(v.nextPms)}</td>
                  <td className="px-4 py-2"><RoadworthyBadge status={v.roadworthy} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
