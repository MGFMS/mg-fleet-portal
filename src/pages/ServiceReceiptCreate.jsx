// Create Service Receipt — writes to Firestore via createReceipt.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MECHANICS, formatMoney } from '../lib/dummyData'
import { watchVehicles } from '../lib/vehicles'
import { createReceipt } from '../lib/serviceReceipts'
import Icon from '../components/ui/Icon'

const PARTS_CATALOG = [
  { code: 'P001', name: 'ENGINE FILTER',        compat: 'Toyota Vios, Honda City',   supplier: 'AutoPlus',         unitCost: 500,  srp: 700,  stock: 15, reserved: 2 },
  { code: 'P002', name: 'OIL FILTER',           compat: 'Toyota Innova, Honda Civic',supplier: 'Autoplus Trading', unitCost: 200,  srp: 400,  stock: 20, reserved: 3 },
  { code: 'P003', name: 'US LUBE GASOLINE',     compat: 'All',                        supplier: 'US Lube Inc.',     unitCost: 250,  srp: 350,  stock: 40, reserved: 0 },
  { code: 'P004', name: 'CABIN FILTER',         compat: 'Toyota Vios, Innova',        supplier: 'Autoplus Trading', unitCost: 350,  srp: 550,  stock: 8,  reserved: 1 },
  { code: 'P005', name: 'ENGINE SUPPORT FOR VIOS', compat: 'Toyota Vios 2003',       supplier: 'Autoplus Trading', unitCost: 1200, srp: 1800, stock: 2,  reserved: 0 },
  { code: 'P006', name: 'DRY RAG',              compat: 'All',                        supplier: 'General Supply',   unitCost: 10,   srp: 15,   stock: 500, reserved: 0 },
  { code: 'L001', name: 'PREVENTIVE MAINTENANCE SERVICE', compat: '', supplier: '', unitCost: 2500, srp: 2500, stock: null, reserved: null },
  { code: 'L002', name: 'REPLACE ENGINE SUPPORT',         compat: '', supplier: '', unitCost: 800,  srp: 800,  stock: null, reserved: null },
]

export default function ServiceReceiptCreate() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const initialPlate = (search.get('plate') || '').toUpperCase()

  const [vehicles, setVehicles] = useState([])
  useEffect(() => {
    const unsub = watchVehicles({ dummyFallback: true }, ({ vehicles }) => setVehicles(vehicles))
    return unsub
  }, [])

  const [plate, setPlate] = useState(initialPlate)
  const vehicle = useMemo(
    () => vehicles.find((v) => v.plateNo === plate) || vehicles[0] || {},
    [plate, vehicles],
  )

  const [odo, setOdo] = useState(vehicle.latestOdo || 0)
  const [customerName, setCustomerName] = useState(vehicle.assignedTo || 'CUSTOMER 100')
  const [mobile, setMobile] = useState('')
  const [notes, setNotes] = useState('')
  const [mechanic, setMechanic] = useState('Amelia Castillo')
  const [items, setItems] = useState([
    { type: 'Labor', qty: 1, description: 'PREVENTIVE MAINTENANCE SERVICE', unitCost: 2500 },
    { type: 'Parts', qty: 1, description: '', unitCost: 0 },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Sync to selected vehicle when list arrives / plate changes
  useEffect(() => {
    if (!vehicle) return
    setOdo(vehicle.latestOdo || 0)
    setCustomerName(vehicle.assignedTo || customerName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.plateNo])

  const laborTotal = items.filter((i) => i.type === 'Labor').reduce((s, i) => s + i.qty * i.unitCost, 0)
  const matTotal   = items.filter((i) => i.type !== 'Labor').reduce((s, i) => s + i.qty * i.unitCost, 0)
  const grandTotal = laborTotal + matTotal

  const addRow = () => setItems([...items, { type: 'Parts', qty: 1, description: '', unitCost: 0 }])
  const removeRow = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateRow = (i, patch) => setItems(items.map((row, idx) => idx === i ? { ...row, ...patch } : row))

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true); setError(null)
    try {
      const { code } = await createReceipt('receipt', {
        plateNo: plate,
        brandModel: vehicle.brandModel || '',
        latestOdo: odo,
        customer: customerName,
        mobile,
        company: vehicle.company || null,
        branch: (profile?.branch || 'MGCAVITE').toUpperCase(),
        mechanic,
        personInCharge: profile?.name || 'Admin',
        scheduleType: 'SCHEDULED',
        items,
        notes,
      })
      navigate(`/service-receipts/${code}`)
    } catch (err) {
      console.error('[receipt] create failed', err)
      setError(err.message || String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="p-4 sm:p-6 pb-32 space-y-4">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Create Service Receipt</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2 text-sm">Save failed: {error}</div>}

      <Section title="Customer and Vehicle Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Plate No. *">
            <input className="input uppercase font-mono" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} required />
          </Field>
          <Field label="Name *">
            <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value.toUpperCase())} required />
          </Field>
          <Field label="Brand/Model">
            <div className="py-2 text-gray-800">{vehicle.brandModel || '—'}</div>
          </Field>
          <Field label="Mobile No">
            <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </Field>
          <Field label="Latest Odometer *">
            <input type="number" className="input" value={odo} onChange={(e) => setOdo(Number(e.target.value))} required />
          </Field>
          <Field label="Schedule Type">
            <div className="py-2 text-gray-800">SCHEDULED</div>
          </Field>
        </div>
      </Section>

      <Section title="Labor / Parts / Materials">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Qty</th>
                <th className="px-3 py-2 text-left font-medium">Serve / Parts / Materials</th>
                <th className="px-3 py-2 text-right font-medium">Unit Cost</th>
                <th className="px-3 py-2 text-right font-medium">Sub Total</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((row, i) => (
                <LineRow
                  key={i}
                  row={row}
                  onChange={(patch) => updateRow(i, patch)}
                  onAdd={addRow}
                  onRemove={() => removeRow(i)}
                  isLast={i === items.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Estimated Total and Other Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Field label="Assigned Mechanic">
            <select className="input" value={mechanic} onChange={(e) => setMechanic(e.target.value)}>
              {MECHANICS.map((m) => <option key={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Total Labor">
            <div className="text-right py-2 font-semibold">{formatMoney(laborTotal)}</div>
          </Field>
          <Field label="Total Materials">
            <div className="text-right py-2 font-semibold">{formatMoney(matTotal)}</div>
          </Field>
          <Field label="Notes" className="md:col-span-3">
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 text-left sm:text-right">
          <div className="inline-flex flex-col sm:flex-row items-start sm:items-baseline gap-1 sm:gap-3 text-sm">
            <span className="text-gray-500">Estimated Total (Labor + Parts):</span>
            <span className="text-2xl font-bold text-green-700">{formatMoney(grandTotal)}</span>
          </div>
        </div>
      </Section>

      {/* Sticky bottom submit on mobile; floating bottom-right on sm+ */}
      <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-auto sm:right-6 bg-white sm:bg-transparent border-t sm:border-0 px-4 py-3 sm:p-0 flex justify-end">
        <button type="submit" disabled={submitting} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded font-semibold text-sm shadow-lg">
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-md border overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gray-700">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function LineRow({ row, onChange, onAdd, onRemove, isLast }) {
  const subTotal = row.qty * row.unitCost
  const [showAuto, setShowAuto] = useState(false)
  const filtered = row.description
    ? PARTS_CATALOG.filter((p) => p.name.toLowerCase().includes(row.description.toLowerCase())).slice(0, 6)
    : []
  const pick = (p) => { onChange({ description: p.name, unitCost: p.srp || p.unitCost }); setShowAuto(false) }

  return (
    <tr>
      <td className="px-3 py-2">
        <select value={row.type} onChange={(e) => onChange({ type: e.target.value })} className="input py-1 text-sm sm:text-xs min-w-[110px]">
          <option>Labor</option>
          <option>Parts/Materials</option>
        </select>
      </td>
      <td className="px-3 py-2 w-20">
        <input type="number" min="1" className="input py-1 text-xs text-right" value={row.qty} onChange={(e) => onChange({ qty: Number(e.target.value) })} />
      </td>
      <td className="px-3 py-2 relative">
        <input
          className="input py-1 text-sm sm:text-xs"
          value={row.description}
          onChange={(e) => { onChange({ description: e.target.value }); setShowAuto(true) }}
          onFocus={() => setShowAuto(true)}
          placeholder="Search parts / service..."
        />
        {showAuto && filtered.length > 0 && (
          <div className="absolute top-full left-0 z-20 mt-1 w-[90vw] max-w-sm sm:w-80 bg-white border rounded-md shadow-xl text-xs">
            {filtered.map((p) => (
              <button type="button" key={p.code} onClick={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-sky-50 border-b last:border-b-0">
                <div className="font-semibold text-gray-800">{p.name} ({p.code})</div>
                {p.compat && <div className="text-[11px] text-gray-500">Compatible to: {p.compat}</div>}
                {p.supplier && (
                  <div className="text-[11px] text-gray-500">
                    Supplier: {p.supplier} | Stock: {p.stock} | Reserved: {p.reserved} | SRP: {formatMoney(p.srp)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </td>
      <td className="px-3 py-2 w-32">
        <input type="number" className="input py-1 text-xs text-right" value={row.unitCost} onChange={(e) => onChange({ unitCost: Number(e.target.value) })} />
      </td>
      <td className="px-3 py-2 w-28 text-right font-semibold">{formatMoney(subTotal)}</td>
      <td className="px-3 py-2 w-20 text-center">
        {isLast ? (
          <button type="button" onClick={onAdd} className="bg-green-600 hover:bg-green-700 text-white rounded w-7 h-7 inline-flex items-center justify-center"><Icon name="plus" className="w-4 h-4" /></button>
        ) : (
          <button type="button" onClick={onRemove} className="bg-red-500 hover:bg-red-600 text-white rounded w-7 h-7 inline-flex items-center justify-center">−</button>
        )}
      </td>
    </tr>
  )
}
