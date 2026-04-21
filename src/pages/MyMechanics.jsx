// My Mechanics (Mechanic Assignment) — matches
// "MG Operations - Mechanic Assignment" mockup. Lists mechanics with their
// currently-assigned vehicles; shows an "Assign Now" button for idle mechanics.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { APPOINTMENTS, MECHANICS, formatDateTime } from '../lib/dummyData'
import { watchVehicles } from '../lib/vehicles'
import StatCard from '../components/ui/StatCard'
import StatusPill from '../components/ui/StatusPill'
import Icon from '../components/ui/Icon'

export default function MyMechanics() {
  const [vehicles, setVehicles] = useState([])
  useEffect(() => {
    const unsub = watchVehicles({}, ({ vehicles }) => setVehicles(vehicles))
    return unsub
  }, [])

  // Group appointments by mechanic.
  const groups = useMemo(() => {
    const m = {}
    for (const mech of MECHANICS) m[mech.name] = []
    for (const a of APPOINTMENTS) {
      if (a.mechanic && a.mechanic !== 'Not yet assigned') {
        if (!m[a.mechanic]) m[a.mechanic] = []
        const v = vehicles.find((x) => x.plateNo === a.plateNo)
        m[a.mechanic].push({ ...a, brandModel: v?.brandModel || '' })
      }
    }
    return m
  }, [vehicles])

  const mechsWith = Object.entries(groups).filter(([_, list]) => list.length > 0)
  const mechsWithout = Object.entries(groups).filter(([_, list]) => list.length === 0)

  const today = new Date()

  return (
    <div className="p-6 pb-20">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">My Mechanics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <StatCard label="Mechanics w/ Assigned Vehicle"  value={mechsWith.length}    tone="dark" icon={<Icon name="user" className="w-5 h-5" />} />
        <StatCard label="Mechanics w/o Assigned Vehicle" value={mechsWithout.length} tone="yellow" icon={<Icon name="user" className="w-5 h-5" />} />
      </div>

      <div className="bg-white rounded-md border overflow-hidden">
        <div className="px-4 py-2 border-b text-sm font-semibold text-gray-700 flex items-center justify-between">
          <span>
            {today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}
          </span>
          <div className="flex items-center gap-1">
            <button className="text-gray-500 hover:text-gray-800 p-1"><Icon name="print" className="w-4 h-4" /></button>
            <button className="text-gray-500 hover:text-gray-800 p-1"><Icon name="calendar" className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Plate No</th>
                <th className="px-4 py-2 text-left font-medium">Brand/Model</th>
                <th className="px-4 py-2 text-left font-medium">Customer</th>
                <th className="px-4 py-2 text-left font-medium">Person In Charge</th>
                <th className="px-4 py-2 text-left font-medium">Date/Time Arrived</th>
                <th className="px-4 py-2 text-right font-medium">Service Status</th>
              </tr>
            </thead>
            <tbody>
              {mechsWith.map(([name, list]) => (
                <MechanicBlock key={name} name={name} list={list} />
              ))}
              {mechsWithout.map(([name]) => (
                <MechanicIdle key={name} name={name} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MechanicBlock({ name, list }) {
  return (
    <>
      <tr className="bg-yellow-50 border-y">
        <td colSpan={7} className="px-4 py-2 font-semibold text-gray-800">
          {name} ({list.length})
        </td>
      </tr>
      {list.map((a) => (
        <tr key={a.id} className="hover:bg-gray-50">
          <td className="px-4 py-2">
            <span className="inline-flex items-center gap-1 text-xs text-gray-600">
              <Icon name="scheduled" className="w-4 h-4 text-sky-600" />
              SCHEDULED
            </span>
          </td>
          <td className="px-4 py-2">
            <Link to={`/vehicles/${a.plateNo}`} className="text-brand font-semibold hover:underline">{a.plateNo}</Link>
          </td>
          <td className="px-4 py-2">{a.brandModel}</td>
          <td className="px-4 py-2 uppercase">{a.customer}</td>
          <td className="px-4 py-2">{name}</td>
          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
            {a.arrivedAt ? formatDateTime(a.arrivedAt) : '-'}
          </td>
          <td className="px-4 py-2 text-right"><StatusPill status={a.status} size="sm" /></td>
        </tr>
      ))}
    </>
  )
}

function MechanicIdle({ name }) {
  return (
    <>
      <tr className="bg-yellow-50 border-y">
        <td colSpan={7} className="px-4 py-2 font-semibold text-gray-800">
          {name} (0)
        </td>
      </tr>
      <tr>
        <td colSpan={7} className="px-4 py-2 text-sm text-gray-500">
          No assigned vehicle.{' '}
          <button className="ml-3 bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-1 rounded">
            Assign Now
          </button>
        </td>
      </tr>
    </>
  )
}
