// Staff Mechanics directory. Different from "My Mechanics" — this is all
// mechanics across all branches, used for roster management.

import { useMemo, useState } from 'react'
import { APPOINTMENTS, MECHANICS } from '../lib/dummyData'
import Icon from '../components/ui/Icon'
import PageHero, { HeroStat } from '../components/ui/PageHero'

export default function Mechanics() {
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return MECHANICS.map((m) => ({
      ...m,
      assignedCount: APPOINTMENTS.filter((a) => a.mechanic === m.name).length,
    })).filter((m) => !term || m.name.toLowerCase().includes(term))
  }, [search])

  const busyCount = rows.filter((m) => m.assignedCount > 0).length

  return (
    <div className="pb-24">
      <PageHero
        eyebrow="DIRECTORY"
        title="Mechanics"
        subtitle={`${MECHANICS.length} total · ${busyCount} currently assigned`}
        right={<HeroStat value={MECHANICS.length} label="TOTAL" tone="solid" />}
      />

      <div className="px-3 sm:px-6 pt-4 space-y-4">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name…"
            className="input pl-9"
          />
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-2">
          {rows.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-gray-400 text-sm">No mechanics match.</div>
          )}
          {rows.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center text-sm font-black shrink-0">
                {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-900 truncate">{m.name}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {m.assignedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      {m.assignedCount} vehicle{m.assignedCount === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="italic text-gray-400">Idle — no assignments</span>
                  )}
                </div>
              </div>
              <button className="text-xs text-brand font-bold hover:underline shrink-0">View</button>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm whitespace-nowrap">
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

      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-20">
        <button className="bg-brand hover:bg-brand-dark text-white px-4 sm:px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
          <Icon name="plus" className="w-4 h-4" />
          Add Mechanic
        </button>
      </div>
    </div>
  )
}
