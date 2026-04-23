// Customers list — staff view. No dedicated mockup provided, so this follows
// the general table pattern (see MG Operations - Service Receipts) and draws
// from the legacy /_reference_dotnet/Views/Customer/Index.cshtml structure.

import { useEffect, useMemo, useState } from 'react'
import { CUSTOMERS, FLEET_COMPANIES } from '../lib/dummyData'
import { watchVehicles } from '../lib/vehicles'
import Icon from '../components/ui/Icon'
import PageHero, { HeroStat } from '../components/ui/PageHero'

const TYPE_TABS = [
  { key: 'ALL',    label: 'All' },
  { key: 'fleet',  label: 'Fleet' },
  { key: 'walkin', label: 'Walk-in' },
]

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

  const counts = useMemo(() => ({
    ALL:    CUSTOMERS.length,
    fleet:  CUSTOMERS.filter((c) => c.type === 'fleet').length,
    walkin: CUSTOMERS.filter((c) => c.type === 'walkin').length,
  }), [])

  return (
    <div className="pb-24">
      <PageHero
        eyebrow="CUSTOMERS"
        title={`${CUSTOMERS.length} customer${CUSTOMERS.length === 1 ? '' : 's'}`}
        subtitle={`${counts.fleet} fleet · ${counts.walkin} walk-in`}
        right={<HeroStat value={CUSTOMERS.length} label="TOTAL" tone="solid" />}
      />

      <div className="px-3 sm:px-6 pt-4 space-y-4">
        {/* Type tabs */}
        <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
          {TYPE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`shrink-0 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
                type === t.key ? 'bg-brand text-white' : 'bg-white border text-gray-700'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${type === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, company…"
            className="input pl-9"
          />
        </div>

        {/* Mobile: card list */}
        <div className="lg:hidden space-y-2">
          {rows.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-gray-400 text-sm">No customers match.</div>
          )}
          {rows.map((c) => <CustomerCard key={c.id} c={c} />)}
        </div>

        {/* Desktop: table */}
        <div className="hidden lg:block bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm whitespace-nowrap">
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

      {/* Floating add button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-20">
        <button className="bg-brand hover:bg-brand-dark text-white px-4 sm:px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
          <Icon name="plus" className="w-4 h-4" />
          Add Customer
        </button>
      </div>
    </div>
  )
}

function CustomerCard({ c }) {
  const isFleet = c.type === 'fleet'
  const company = isFleet ? FLEET_COMPANIES.find((f) => f.code === c.company) : null
  return (
    <div className="bg-white rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-black shrink-0 ${isFleet ? 'bg-sky-600' : 'bg-gray-700'}`}>
          {(c.name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-bold text-sm text-gray-900 uppercase truncate">{c.name}</div>
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {c.vehicleCount} veh
            </span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">{c.phone || '—'}</div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isFleet ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {isFleet ? 'Fleet' : 'Walk-in'}
            </span>
            {company && (
              <span className="text-[10px] font-mono text-gray-600 bg-gray-50 border px-2 py-0.5 rounded-full truncate">
                {company.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
