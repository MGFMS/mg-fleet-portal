// Service Booking page. Reads live `appointments` + writes new bookings via
// createAppointment.

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BRANCHES, FLEET_COMPANIES } from '../lib/dummyData'
import { watchVehicles } from '../lib/vehicles'
import { watchAppointments, createAppointment } from '../lib/appointments'
import StatCard from '../components/ui/StatCard'
import SlidePanel from '../components/ui/SlidePanel'
import Icon from '../components/ui/Icon'

const TIME_SLOTS = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM',
]

export default function ServiceBooking() {
  const { profile } = useAuth()
  const branch = (profile?.branch || 'MGCAVITE').toUpperCase()
  const [showPanel, setShowPanel] = useState(false)
  const [editId, setEditId] = useState(null)
  const today = new Date()

  const [appointments, setAppointments] = useState([])
  const [source, setSource] = useState('loading')
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    const u1 = watchAppointments({ dummyFallback: true }, ({ rows, source }) => {
      setAppointments(rows); setSource(source)
    })
    const u2 = watchVehicles({ dummyFallback: true }, ({ vehicles }) => setVehicles(vehicles))
    return () => { u1?.(); u2?.() }
  }, [])

  const stats = useMemo(() => {
    const backlogs = appointments.filter((a) => ['ARRIVED', 'ONGOING', 'PENDING'].includes(a.status)).length
    const confirmed = appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').length
    const tentative = appointments.filter((a) => a.status === 'TENTATIVE').length
    return { backlogs, confirmed, tentative }
  }, [appointments])

  // Group today's bookings by scheduled time slot for the day view.
  const slotMap = useMemo(() => {
    const map = {}
    for (const a of appointments) {
      if (!['BOOKED', 'ARRIVED', 'ONGOING', 'CONFIRMED', 'TENTATIVE'].includes(a.status)) continue
      const slot = a.scheduledTime || '8:00 AM'
      if (!map[slot]) map[slot] = []
      const v = vehicles.find((x) => x.plateNo === a.plateNo)
      map[slot].push({ ...a, model: v?.model, yearModel: v?.yearModel })
    }
    return map
  }, [appointments, vehicles])

  return (
    <div className="p-6 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Service Booking - {branch}</h1>
        {source === 'dummy' && <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">Demo data</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <StatCard label="Backlogs"          value={stats.backlogs}  tone="blue"  icon={<Icon name="backlog" className="w-5 h-5" />} />
        <StatCard label="Confirmed Bookings" value={stats.confirmed} tone="green" icon={<Icon name="check" className="w-5 h-5" />} />
        <StatCard label="Tentative Bookings" value={stats.tentative} tone="amber" icon={<Icon name="clock" className="w-5 h-5" />} />
      </div>

      <div className="bg-gray-900 text-white rounded-md px-4 py-2 mb-2 flex items-center justify-between text-sm font-semibold">
        <span>SERVICE CENTER BOOKINGS</span>
        <span className="bg-white/10 rounded px-2 py-0.5 text-xs">{stats.confirmed}</span>
      </div>

      <div className="bg-white rounded-md border overflow-hidden">
        <div className="px-4 py-2 border-b text-sm font-semibold text-gray-700">
          {today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}
        </div>
        <div className="overflow-x-auto">
          <div className="flex">
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="border-r last:border-r-0 w-36 flex-shrink-0">
                <div className="text-xs font-semibold text-gray-500 text-center py-2 border-b bg-gray-50">{slot}</div>
                <div className="p-2 space-y-2 min-h-[220px]">
                  {(slotMap[slot] || []).map((a) => (
                    <BookingCard key={a.id} appt={a} onClick={() => { setEditId(a.id); setShowPanel(true) }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-white rounded-md px-4 py-2 mt-4 flex items-center justify-between text-sm font-semibold">
        <span>FLEET BOOKINGS</span>
        <span className="bg-white/10 rounded px-2 py-0.5 text-xs">{stats.tentative}</span>
      </div>
      <div className="bg-white rounded-md border mt-2 p-6 text-center text-gray-400 text-sm">
        {stats.tentative === 0 ? 'No fleet bookings for today.' : `${stats.tentative} tentative fleet bookings awaiting confirmation.`}
      </div>

      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => { setEditId(null); setShowPanel(true) }}
          className="bg-brand hover:bg-brand-dark text-white rounded-full px-5 py-3 shadow-lg font-semibold text-sm flex items-center gap-1.5"
        >
          <Icon name="plus" className="w-4 h-4" />
          New Booking
        </button>
      </div>

      <SlidePanel open={showPanel} onClose={() => setShowPanel(false)} title="Service Booking">
        <BookingForm
          editId={editId}
          branch={branch}
          appointments={appointments}
          onClose={() => setShowPanel(false)}
        />
      </SlidePanel>
    </div>
  )
}

function BookingCard({ appt, onClick }) {
  return (
    <button
      onClick={onClick}
      className="block w-full bg-blue-600 text-white rounded-md p-2 text-left shadow-sm hover:bg-blue-700"
    >
      <div className="font-bold text-xs tracking-wide">{appt.plateNo}</div>
      <div className="uppercase text-[10px] opacity-90 truncate">{appt.customer}</div>
      <div className="text-[10px] opacity-80">{(appt.model || '').toString()} ({appt.yearModel || ''})</div>
      <div className="flex items-center gap-1 mt-1 text-[10px] opacity-80">
        <Icon name="user" className="w-3 h-3" />
        {appt.mechanic === 'Not yet assigned' ? 'Unassigned' : appt.mechanic}
      </div>
    </button>
  )
}

function BookingForm({ editId, branch, appointments, onClose }) {
  const existing = editId ? appointments.find((a) => a.id === editId) : null
  const [walkin, setWalkin] = useState(false)
  const [tentative, setTentative] = useState(false)
  const [custType, setCustType] = useState(existing ? 'old' : 'new')
  const [plate, setPlate] = useState(existing?.plateNo || '')
  const [customer, setCustomer] = useState(existing?.customer || '')
  const [mobile, setMobile] = useState(existing?.mobile || '')
  const [company, setCompany] = useState(existing?.company || '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('8:00 AM')
  const [services, setServices] = useState([])
  const [issues, setIssues] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await createAppointment({
        plateNo: plate,
        customer,
        customerType: custType,
        mobile,
        company: custType === 'fleet' ? company : null,
        branch,
        scheduledAt: new Date(`${date}T08:00:00`).toISOString(),
        scheduledTime: time,
        servicesInterested: services,
        customerIssues: issues,
        tentative,
        walkin,
        status: tentative ? 'TENTATIVE' : (custType === 'fleet' ? 'TENTATIVE' : 'BOOKED'),
        note: 'SERVICE BOOKED',
      })
      onClose()
    } catch (err) {
      console.error('[booking] createAppointment failed', err)
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-sm">
      {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2 text-xs">Save failed: {error}</div>}

      <Row label="Service Center">
        <select value={branch} disabled className="input">
          {BRANCHES.map((b) => <option key={b}>{b}</option>)}
        </select>
        <label className="flex items-center gap-1.5 mt-2 text-xs">
          <input type="checkbox" checked={walkin} onChange={(e) => setWalkin(e.target.checked)} />
          Walk-in
        </label>
      </Row>

      <Row label="Preferred Schedule*">
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input flex-1" required />
          <select value={time} onChange={(e) => setTime(e.target.value)} className="input w-32">
            {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1.5 mt-2 text-xs">
          <input type="checkbox" checked={tentative} onChange={(e) => setTentative(e.target.checked)} />
          Tentative
        </label>
      </Row>

      <div className="flex items-center gap-4 text-xs">
        {['new', 'old', 'fleet'].map((t) => (
          <label key={t} className="flex items-center gap-1">
            <input type="radio" name="custType" value={t} checked={custType === t} onChange={(e) => setCustType(e.target.value)} />
            <span className="uppercase">{t === 'old' ? 'Old Customer' : t === 'new' ? 'New Customer' : 'FLEET'}</span>
          </label>
        ))}
      </div>

      <Row label="Plate No.*">
        <div className="flex gap-1">
          <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="SEARCH VEHICLE..." className="input flex-1 uppercase" required />
          <button type="button" className="bg-gray-800 text-white px-2 rounded">+</button>
        </div>
      </Row>

      <Row label="Customer*">
        <div className="flex gap-1">
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="SEARCH CUSTOMER..." className="input flex-1" required />
          <button type="button" className="bg-gray-800 text-white px-2 rounded">+</button>
        </div>
        <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="MOBILE NUMBER" className="input w-full mt-2" />
        <div className="mt-2 bg-sky-50 border border-sky-200 text-sky-900 text-xs rounded px-2 py-1.5">
          <Icon name="phone" className="w-3 h-3 inline mr-1" />
          Ensure to input the updated mobile number.
        </div>
      </Row>

      {custType === 'fleet' && (
        <Row label="Fleet Company">
          <select value={company} onChange={(e) => setCompany(e.target.value)} className="input w-full" required>
            <option value="">— select —</option>
            {FLEET_COMPANIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </Row>
      )}

      <Row label="Services Interested*">
        <MultiSelect
          placeholder="SELECT ALL THAT APPLIES"
          options={['Preventive Maintenance', 'Oil Change', 'Tire Rotation', 'Brake Service', 'Transmission Service', 'AC Repair', 'Diagnostic Check']}
          value={services}
          onChange={setServices}
        />
      </Row>

      <Row label="Customer Issues">
        <MultiSelect
          placeholder="SELECT ALL THAT APPLIES"
          options={['Engine Noise', 'Brake Issues', 'Overheating', 'AC Not Working', 'Transmission Slipping', 'Electrical Problems']}
          value={issues}
          onChange={setIssues}
        />
      </Row>

      <div className="pt-2 flex justify-end">
        <button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded font-semibold text-sm">
          {saving ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </form>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function MultiSelect({ placeholder, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const toggle = (opt) => {
    onChange(value.includes(opt) ? value.filter((o) => o !== opt) : [...value, opt])
  }
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="input w-full text-left flex items-center justify-between text-xs">
        <span className={value.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
          {value.length === 0 ? placeholder : value.join(', ')}
        </span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-auto">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-xs cursor-pointer">
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
