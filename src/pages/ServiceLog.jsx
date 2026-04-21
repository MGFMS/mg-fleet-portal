// Customer "Service Log" — shown in the Fleet Customer sidebar (see mockup).
// Timeline of all services performed for the customer's fleet.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SERVICE_HISTORY, formatDate } from '../lib/dummyData'
import { watchVehicles, profileCompany } from '../lib/vehicles'
import StatusPill from '../components/ui/StatusPill'

export default function ServiceLog() {
  const { profile } = useAuth()
  const company = (profileCompany(profile) || '').toString().toUpperCase()
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    const unsub = watchVehicles(company ? { company } : {}, ({ vehicles }) => setVehicles(vehicles))
    return unsub
  }, [company])

  const myPlates = useMemo(
    () => new Set(vehicles.map((v) => v.plateNo)),
    [vehicles],
  )
  const rows = useMemo(() => {
    const flat = []
    for (const bucket of SERVICE_HISTORY) {
      if (!myPlates.has(bucket.plateNo)) continue
      for (const r of bucket.rows) flat.push({ ...r, plateNo: bucket.plateNo })
    }
    return flat.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [myPlates])

  return (
    <div className="p-6 pb-20">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">
        Service Log{company ? ` - ${company}` : ''}
      </h1>

      <div className="bg-white rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Plate No</th>
                <th className="px-4 py-3 text-left font-medium">Performed By</th>
                <th className="px-4 py-3 text-left font-medium">Service</th>
                <th className="px-4 py-3 text-left font-medium">Details</th>
                <th className="px-4 py-3 text-right font-medium">Odometer</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No service log entries yet.</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link to={`/vehicles/${r.plateNo}`} className="text-brand font-semibold hover:underline">{r.plateNo}</Link>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs">{r.performedBy}</td>
                  <td className="px-4 py-2 text-xs uppercase">{r.service}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{r.details}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">{r.odometer?.toLocaleString() || '-'}</td>
                  <td className="px-4 py-2 text-right">{r.status ? <StatusPill status={r.status} size="sm" /> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
