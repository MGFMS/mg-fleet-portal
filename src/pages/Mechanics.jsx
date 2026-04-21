// Staff Mechanics directory. Different from "My Mechanics" — this is all
// mechanics across all branches, used for roster management.

import { useMemo, useState } from 'react'
import { APPOINTMENTS, MECHANICS } from '../lib/dummyData'
import Icon from '../components/ui/Icon'

export default function Mechanics() {
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return MECHANICS.map((m) => ({
      ...m,
      assignedCount: APPOINTMENTS.filter((a) => a.mechanic === m.name).length,
    })).filter((m) => !term || m.name.toLowerCase().includes(term))
  }, [search])

  return (
    <div className="p-6 pb-20">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Mechanics</h1>

      <div className="bg-white rounded-md border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm text-gray-500">{rows.length} mechanics</span>
          <div className="flex items-center gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name..." className="border rounded px-2 py-1 text-sm w-48" />
            <button className="bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1">
              <Icon name="plus" className="w-4 h-4" />
              Add Mechanic
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-center font-medium">Currently Assigned</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                        {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {m.assignedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {m.assignedCount} vehicle{m.assignedCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-xs">
                    <button className="text-brand hover:underline mr-3">View</button>
                    <button className="text-gray-500 hover:text-gray-800">Edit</button>
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
