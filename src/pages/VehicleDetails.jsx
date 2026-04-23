// Vehicle drill-down. Prefers real Firestore data via loadVehicleWithHistory,
// falls back to dummy for preview routes.

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isClientView } from '../lib/roles'
import { loadVehicleWithHistory } from '../lib/vehicles'
import { getActiveAppointmentsByPlate, APPT_STATUS } from '../lib/appointments'
import { formatDate } from '../lib/dummyData'
import VehicleImage from '../components/ui/VehicleImage'
import RoadworthyBadge from '../components/ui/RoadworthyBadge'
import StatusPill from '../components/ui/StatusPill'
import Icon from '../components/ui/Icon'
import PageHero from '../components/ui/PageHero'

// Matches mg-fms-app SC palette for overallStatus → label/color.
const STATUS_CFG = {
  active:      { label: 'Active',      badge: 'bg-green-100 text-green-700 border-green-200' },
  conditional: { label: 'Conditional', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  deferred:    { label: 'Deferred',    badge: 'bg-red-100 text-red-700 border-red-200' },
}
const statusCfg = (s) => STATUS_CFG[String(s || '').toLowerCase()] || { label: s || 'Unknown', badge: 'bg-gray-100 text-gray-600 border-gray-200' }

// Maps roadworthy bucket → PageHero tone so the banner color reflects status.
function roadworthyTone(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'active' || s === 'roadworthy' || s.includes('fit') && !s.includes('unfit') && !s.includes('limited')) return 'success'
  if (s === 'minor' || s.includes('minor') || s.includes('limited')) return 'warn'
  if (s === 'unfit' || s.includes('unfit') || s.includes('unroadworthy')) return 'danger'
  return 'dark'
}

export default function VehicleDetails() {
  const { plateNo } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const clientVisibleOnly = isClientView(profile)
  const isClient = clientVisibleOnly
  const [state, setState] = useState({ loading: true, vehicle: null, history: [], source: null })
  const [activeAppts, setActiveAppts] = useState([])

  useEffect(() => {
    let cancelled = false
    loadVehicleWithHistory(plateNo, { clientVisibleOnly }).then((res) => {
      if (!cancelled) setState({ loading: false, ...res })
    })
    if (!clientVisibleOnly) {
      getActiveAppointmentsByPlate(plateNo).then((rows) => {
        if (!cancelled) setActiveAppts(rows)
      })
    }
    return () => { cancelled = true }
  }, [plateNo, clientVisibleOnly])

  const currentAppt = activeAppts[0] || null

  const vehicle = state.vehicle
  const history = state.history || []

  if (state.loading) return <div className="p-4 sm:p-6 text-gray-500">Loading vehicle…</div>
  if (!vehicle) {
    return (
      <div className="pb-20">
        <PageHero
          eyebrow="VEHICLE"
          title={plateNo}
          subtitle="No assessment on record"
          tone="dark"
        />
        <div className="px-3 sm:px-6 pt-4 space-y-4">
          {currentAppt && !isClient && (
            <CurrentBookingCard appt={currentAppt} navigate={navigate} />
          )}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-2xl p-4">
            <div className="font-semibold mb-1">No assessment found for plate {plateNo}</div>
            <div className="text-xs">
              {currentAppt
                ? <>This vehicle has an active booking but hasn't been assessed yet. Use the <strong>Assess</strong> button above to start.</>
                : <>This plate doesn't match any assessment yet. Create a booking from <button onClick={() => navigate('/appointments')} className="underline font-semibold">Service Bookings</button>, then mark it arrived and click Assess.</>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  const cls = vehicle.classification || {}
  const subtitleParts = [
    vehicle.brandModel,
    vehicle.yearModel,
    vehicle.latestOdo ? `${vehicle.latestOdo.toLocaleString()} km` : null,
  ].filter(Boolean)

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={vehicle.company ? vehicle.company.toUpperCase() : 'VEHICLE'}
        title={vehicle.plateNo}
        subtitle={subtitleParts.join(' · ')}
        tone={roadworthyTone(vehicle.roadworthy)}
        right={<RoadworthyBadge status={vehicle.roadworthy} />}
      />

      {state.source === 'error' && (
        <div className="mx-3 sm:mx-6 mt-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          Read blocked by Firestore rules
        </div>
      )}

      <div className="px-3 sm:px-6 pt-4 space-y-4">
        {currentAppt && !isClient && (
          <CurrentBookingCard appt={currentAppt} navigate={navigate} />
        )}

        <Card title="Vehicle Information" icon={<Icon name="car" className="w-4 h-4" />}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-40 shrink-0 flex items-center justify-center bg-gray-50 rounded-xl h-32 sm:h-auto">
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

        <Card title="Next Service" icon={<Icon name="calendar" className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <InfoBlock label="Next service schedule" value={formatDate(vehicle.nextPms) || '—'} sub="Or on next km trigger" />
            <InfoBlock
              label="Booked schedule"
              value={formatDate(vehicle.bookedSchedule) === '-' ? 'No schedule set' : formatDate(vehicle.bookedSchedule)}
              sub={vehicle.bookedBranch || null}
            />
            <InfoBlock
              label="Latest assessment"
              value={(cls.overallStatus || vehicle.roadworthy || 'unknown').toString().toUpperCase()}
              sub={cls.failCriticalCount != null ? `${cls.failCriticalCount} critical · ${cls.monitorCount || 0} monitor` : null}
            />
            <InfoBlock label="Service center" value={vehicle.branch || 'Information not available'} />
          </div>
        </Card>

        <Card title={`Assessment History (${history.length})`} icon={<Icon name="doc" className="w-4 h-4" />}>
          {history.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
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
                    className={`w-full text-left rounded-xl p-3 border transition-all ${
                      clickable ? 'hover:shadow-sm cursor-pointer' : 'cursor-default opacity-70'
                    } ${a.isLatest ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <span className="font-black text-gray-900 text-sm font-mono truncate">{a.rwa || '—'}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {a.isLatest && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Latest</span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        {clickable && <span className="text-gray-400 text-sm">›</span>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 break-words">
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
    </div>
  )
}

// Compact card for an in-flight booking — rebuilt in brand red to match the
// rest of round 2. Action buttons stack on mobile so they're all tappable.
function CurrentBookingCard({ appt, navigate }) {
  const canAssess = appt.status === APPT_STATUS.ARRIVED || appt.status === APPT_STATUS.ONGOING
  const canRecordPms = [APPT_STATUS.ARRIVED, APPT_STATUS.ONGOING, APPT_STATUS.DIAGNOSED].includes(appt.status)
  return (
    <div className="bg-white border-2 border-brand/20 rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-brand text-white px-4 py-2.5 text-sm font-bold flex items-center gap-2">
        <Icon name="calendar" className="w-4 h-4" />
        Current Booking
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status={appt.status} size="sm" />
          <span className="text-sm text-gray-700">
            {formatDate(appt.scheduledAt)}{appt.scheduledTime ? ` · ${appt.scheduledTime}` : ''}
          </span>
          {appt.branch && <span className="text-gray-500 text-xs">· {appt.branch}</span>}
        </div>
        <div className="text-xs text-gray-500">
          {appt.customer || '—'}{appt.company ? ` · ${appt.company}` : ''}
          {appt.mechanic && appt.mechanic !== 'Not yet assigned' ? ` · ${appt.mechanic}` : ''}
        </div>
        {appt.note && <div className="text-xs text-gray-600 italic">"{appt.note}"</div>}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => navigate('/appointments')}
            className="col-span-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-semibold"
          >
            Open Booking
          </button>
          {canAssess && (
            <button
              onClick={() => navigate(`/appointments/${appt.id}/assess`)}
              className="text-xs bg-brand hover:bg-brand-dark text-white px-3 py-2.5 rounded-lg font-semibold"
            >
              Assess →
            </button>
          )}
          {canRecordPms && (
            <button
              onClick={() => navigate(`/appointments/${appt.id}/pms`)}
              className="text-xs bg-green-700 hover:bg-green-800 text-white px-3 py-2.5 rounded-lg font-semibold"
            >
              Record PMS →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider border-b flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
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

function InfoBlock({ label, value, sub }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}
