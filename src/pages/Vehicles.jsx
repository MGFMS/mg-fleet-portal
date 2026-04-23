// Staff "Fleet" / all-vehicles list. Reads live from Firestore via watchVehicles
// with no company filter — staff see everything.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { watchVehicles, formatDate } from '../lib/vehicles'
import RoadworthyBadge from '../components/ui/RoadworthyBadge'
import VehicleImage from '../components/ui/VehicleImage'
import Icon from '../components/ui/Icon'
import PageHero, { HeroStat } from '../components/ui/PageHero'

const ROADWORTHY_TABS = [
  { key: 'ALL',    label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'minor',  label: 'Minor' },
  { key: 'unfit',  label: 'Unfit' },
]

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

  const counts = useMemo(() => {
    const c = { ALL: vehicles.length, active: 0, minor: 0, unfit: 0 }
    for (const v of vehicles) if (c[v.roadworthy] != null) c[v.roadworthy]++
    return c
  }, [vehicles])

  return (
    <div className="pb-24">
      <PageHero
        eyebrow="FLEET"
        title="All Vehicles"
        subtitle={`${vehicles.length} total · ${counts.active} active · ${counts.unfit} unfit`}
        right={<HeroStat value={vehicles.length} label="TOTAL" tone="solid" />}
      />

      {source === 'error' && (
        <div className="mx-3 sm:mx-6 mt-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          Read blocked by Firestore rules.
        </div>
      )}

      <div className="px-3 sm:px-6 pt-4 space-y-4">
        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
          {ROADWORTHY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRoadworthy(t.key)}
              className={`shrink-0 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
                roadworthy === t.key ? 'bg-brand text-white' : 'bg-white border text-gray-700'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${roadworthy === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search + company filter */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plate, model, driver…"
              className="input pl-9"
            />
          </div>
          <select value={company} onChange={(e) => setCompany(e.target.value)} className="input">
            <option value="ALL">All companies</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Mobile: card list */}
        <div className="lg:hidden space-y-2">
          {rows.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-gray-400 text-sm">No vehicles match.</div>
          )}
          {rows.map((v, i) => <VehicleRowCard key={v.plateNo + i} v={v} />)}
        </div>

        {/* Desktop: table */}
        <div className="hidden lg:block bg-white rounded-2xl border overflow-hidden">
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

      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-20">
        <button className="bg-brand hover:bg-brand-dark text-white px-4 sm:px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
          <Icon name="plus" className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>
    </div>
  )
}

function VehicleRowCard({ v }) {
  return (
    <Link
      to={`/vehicles/${v.plateNo}`}
      className="flex items-center gap-3 bg-white rounded-2xl border p-3 hover:shadow-md transition-shadow"
    >
      <div className="w-20 h-16 shrink-0 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
        <VehicleImage model={v.model} className="max-h-14 max-w-[4.5rem] object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-black text-base text-gray-900 tracking-wide">{v.plateNo}</div>
            <div className="text-xs text-gray-500 truncate">{v.brandModel || '—'} {v.yearModel || ''}</div>
          </div>
          <RoadworthyBadge status={v.roadworthy} size="sm" />
        </div>
        <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-gray-600">
          <span className="font-mono text-gray-500 truncate">{v.company || 'WALK-IN'}</span>
          <span className="flex items-center gap-1 shrink-0">
            <Icon name="calendar" className="w-3 h-3 text-gray-400" />
            {formatDate(v.nextPms) || '-'}
          </span>
        </div>
      </div>
    </Link>
  )
}
