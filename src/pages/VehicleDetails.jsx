// Vehicle drill-down. Prefers real Firestore data via loadVehicleWithHistory,
// falls back to dummy for preview routes.

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadVehicleWithHistory } from '../lib/vehicles'
import { formatDate } from '../lib/dummyData'
import VehicleImage from '../components/ui/VehicleImage'
import RoadworthyBadge from '../components/ui/RoadworthyBadge'
import Icon from '../components/ui/Icon'

// Matches mg-fms-app SC palette (App.jsx:~108) for overallStatus → label/color.
const STATUS_CFG = {
  active:      { label: 'Active',      badge: 'bg-green-100 text-green-700 border-green-200' },
  conditional: { label: 'Conditional', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  deferred:    { label: 'Deferred',    badge: 'bg-red-100 text-red-700 border-red-200' },
}
const statusCfg = (s) => STATUS_CFG[String(s || '').toLowerCase()] || { label: s || 'Unknown', badge: 'bg-gray-100 text-gray-600 border-gray-200' }

export default function VehicleDetails() {
  const { plateNo } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, vehicle: null, history: [], source: null })

  useEffect(() => {
    let cancelled = false
    loadVehicleWithHistory(plateNo).then((res) => {
      if (!cancelled) setState({ loading: false, ...res })
    })
    return () => { cancelled = true }
  }, [plateNo])

  const vehicle = state.vehicle
  const history = state.history || []

  if (state.loading) return <div className="p-6 text-gray-500">Loading vehicle…</div>
  if (!vehicle) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button onClick={() => navigate(-1)} className="hover:underline">← Back</button>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md p-4">
          <div className="font-semibold mb-1">No assessment found for plate {plateNo}</div>
          <div className="text-xs">
            This vehicle hasn't been assessed in the MG-FMS app yet, or the plate number doesn't match any record.
            Open MG-FMS and run an assessment for this plate — it will appear here on the next sync.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 pb-16 space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate(-1)} className="hover:underline">← Back</button>
        {state.source === 'error' && <span className="ml-auto text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5">Read blocked</span>}
      </div>

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{vehicle.plateNo}</h1>
        <RoadworthyBadge status={vehicle.roadworthy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Vehicle Information" icon={<Icon name="car" className="w-4 h-4" />}>
          <div className="flex gap-4">
            <div className="w-40 shrink-0 flex items-center justify-center bg-gray-50 rounded">
              <VehicleImage model={vehicle.model} className="max-h-32 object-contain" />
            </div>
            <div className="flex-1 text-sm">
              <InfoRow label="Brand/Model" value={vehicle.brandModel || '—'} />
              <InfoRow label="Year Model" value={vehicle.yearModel || '—'} />
              <InfoRow label="Color" value={vehicle.color || '—'} />
              <InfoRow label="Transmission" value={vehicle.transmission || '—'} />
              <InfoRow label="Engine No" value={vehicle.engineNo || '—'} />
              <InfoRow label="Latest Odometer" value={vehicle.latestOdo?.toLocaleString() || '—'} />
              <div className="border-t my-2" />
              <InfoRow label="Assigned To" value={vehicle.assignedTo || '—'} uppercase />
              <InfoRow label="Company" value={vehicle.company || '—'} />
              <InfoRow label="Branch" value={vehicle.branch || '—'} />
            </div>
          </div>
        </Card>

        <Card title="Next Service and Provider's Recommendation" icon={<Icon name="calendar" className="w-4 h-4" />} accent="bg-cyan-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">Next Service Schedule:</div>
              <div className="text-gray-900">{formatDate(vehicle.nextPms)} or 0 kms</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Booked Schedule:</div>
              <div className="text-gray-900">{formatDate(vehicle.bookedSchedule) === '-' ? 'No schedule set' : formatDate(vehicle.bookedSchedule)}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500 mb-1">Latest Assessment:</div>
              <div className="text-gray-900 text-xs">
                Overall: <strong className="uppercase">{vehicle.classification?.overallStatus || vehicle.roadworthy || 'unknown'}</strong>
                {vehicle.classification?.failCriticalCount != null && (
                  <> · Critical: {vehicle.classification.failCriticalCount} · Monitor: {vehicle.classification.monitorCount}</>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Service Center:</div>
              <div className="text-gray-900">{vehicle.branch || 'Information not available'}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title={`Assessment History (${history.length})`}
        icon={<Icon name="doc" className="w-4 h-4" />}
      >
        {history.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            No assessments on record for this plate.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((a) => {
              const cfg = statusCfg(a.overallStatus)
              const key = a.rwa || a.date
              const clickable = Boolean(a.rwa)
              return (
                <button
                  key={key}
                  onClick={() => clickable && navigate(`/assessments/${encodeURIComponent(a.rwa)}`)}
                  disabled={!clickable}
                  className={`w-full text-left rounded-md p-3 border transition-all ${
                    clickable ? 'hover:shadow-sm cursor-pointer' : 'cursor-default'
                  } ${a.isLatest ? 'border-red-200 bg-red-50 hover:bg-red-100/60' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">{a.rwa || '—'}</span>
                    <div className="flex items-center gap-1.5">
                      {a.isLatest && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Latest</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      {clickable && <span className="text-gray-400 text-xs">→</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(a.date)} · {a.type} · {a.technician}
                    {a.odometer ? ` · ${a.odometer.toLocaleString()} km` : ''}
                    {a.branch ? ` · ${a.branch}` : ''}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px]">
                    {a.failCriticalCount > 0 && (
                      <span className="text-red-600 font-semibold">🚨 {a.failCriticalCount} critical</span>
                    )}
                    {a.monitorCount > 0 && (
                      <span className="text-amber-600 font-semibold">⚠️ {a.monitorCount} monitor</span>
                    )}
                    {!a.dispatchAllowed ? (
                      <span className="text-red-600 font-semibold">⛔ Hold</span>
                    ) : (
                      <span className="text-green-700 font-semibold">✓ Cleared</span>
                    )}
                    {a.supervisorCleared && (
                      <span className="text-blue-600 font-semibold">👤 Supervisor Cleared</span>
                    )}
                    {a.hasPms && (
                      <span className="text-green-700 font-semibold">🔧 PMS</span>
                    )}
                    {a.resolvedByRwa && (
                      <span className="text-gray-500">resolved by {a.resolvedByRwa}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function Card({ title, icon, accent = 'bg-gray-800', children }) {
  return (
    <div className="bg-white rounded-md shadow-sm border overflow-hidden">
      <div className={`${accent} text-white px-4 py-2 text-sm font-semibold flex items-center gap-2`}>
        {icon}
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, uppercase, mono, strong }) {
  return (
    <div className="flex justify-between gap-2 py-1">
      <span className="text-xs text-gray-500 shrink-0">{label}:</span>
      <span className={`${uppercase ? 'uppercase ' : ''}${mono ? 'font-mono text-xs ' : ''}${strong ? 'font-bold text-green-700 ' : ''}text-gray-900 text-right`}>
        {value}
      </span>
    </div>
  )
}

