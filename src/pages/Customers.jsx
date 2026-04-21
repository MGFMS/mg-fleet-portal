// Customers list — staff view. No dedicated mockup provided, so this follows
// the general table pattern (see MG Operations - Service Receipts) and draws
// from the legacy /_reference_dotnet/Views/Customer/Index.cshtml structure.

import { useEffect, useMemo, useState } from 'react'
import { CUSTOMERS, FLEET_COMPANIES } from '../lib/dummyData'
import { watchVehicles } from '../lib/vehicles'
import Icon from '../components/ui/Icon'

export default function Customers() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('ALL')
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    const unsub = watchVehicles({}, ({ vehicles }) => setVehicles(vehicles))
    return unsub
  }, [])

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return CUSTOMERS.filter((c) => {
      if (type !== 'ALL' && c.type !== type.toLowerCase()) return false
      if (!term) return true
      return [c.name, c.phone, c.company].join(' ').toLowerCase().includes(term)
    }).map((c) => ({
      ...c,
      vehicleCount: vehicles.filter((v) => (v.assignedTo || '').toLowerCase() === c.name.toLowerCase()).length,
    }))
  }, [search, type, vehicles])

  return (
    <div className="p-6 pb-20">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Customers</h1>

      <div className="bg-white rounded-md border">
        <div className="flex items-center justify-between px-4 py-3 border-b gap-4">
          <div className="flex items-center gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="ALL">All customers</option>
              <option value="fleet">Fleet</option>
              <option value="walkin">Walk-in</option>
            </select>
            <span className="text-xs text-gray-500">{rows.length} records</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, company..."
              className="border rounded px-2 py-1 text-sm w-64"
            />
            <button className="bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1">
              <Icon name="plus" className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Mobile</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Fleet Company</th>
                <th className="px-4 py-3 text-center font-medium">Vehicles</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No customers match.</td></tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium uppercase">{c.name}</td>
                  <td className="px-4 py-2">{c.phone}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${c.type === 'fleet' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.type === 'fleet' ? 'Fleet' : 'Walk-in'}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">
                    {c.company || '—'}
                    {c.company && (
                      <span className="block text-[10px] text-gray-400">
                        {FLEET_COMPANIES.find((f) => f.code === c.company)?.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold">{c.vehicleCount}</td>
                  <td className="px-4 py-2 text-right">
                    <button className="text-brand hover:underline text-xs">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
