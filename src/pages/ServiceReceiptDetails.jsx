// Service Receipt detail — loads from Firestore (falls back to dummy).

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatMoney } from '../lib/dummyData'
import { getReceipt, setReceiptStatus } from '../lib/serviceReceipts'
import Icon from '../components/ui/Icon'

export default function ServiceReceiptDetails() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getReceipt(code)
      .then((r) => { if (!cancelled) { setReceipt(r); setLoading(false) } })
      .catch((err) => { if (!cancelled) { setError(err); setLoading(false) } })
    return () => { cancelled = true }
  }, [code])

  if (loading) return <div className="p-4 sm:p-6 text-gray-500">Loading…</div>
  if (!receipt) return <div className="p-4 sm:p-6 text-gray-500">Receipt {code} not found.</div>

  const doCancel = async () => {
    if (!receipt.id) return
    if (!confirm('Cancel this service receipt?')) return
    setCancelling(true)
    try {
      await setReceiptStatus(receipt.id, 'CANCELLED')
      setReceipt({ ...receipt, status: 'CANCELLED' })
    } catch (err) {
      alert('Failed: ' + (err.message || err))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 pb-20 space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate(-1)} className="hover:underline">← Back</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <Info label="Plate No.">
          <span className="bg-brand text-white font-mono font-bold tracking-wide px-3 py-1 rounded inline-block">{receipt.plateNo}</span>
        </Info>
        <Info label="Schedule Type"><span className="font-semibold">{receipt.scheduleType}</span></Info>
        <Info label="Assigned Mechanic">{receipt.mechanic}</Info>
        <Info label="Brand/Model">{receipt.brandModel}</Info>
        <Info label="Customer Name">{receipt.customer}</Info>
        <Info label="Person In-Charge">{receipt.personInCharge}</Info>
        <Info label="Latest Odo">{receipt.latestOdo?.toLocaleString() || '-'}</Info>
        <Info label="Mobile Number">{receipt.mobile}</Info>
        <Info label="Notes">{receipt.notes || '—'}</Info>
      </div>

      <div className="bg-white rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Qty</th>
                <th className="px-4 py-3 text-left font-medium">Services / Parts / Materials</th>
                <th className="px-4 py-3 text-right font-medium">Unit Cost</th>
                <th className="px-4 py-3 text-right font-medium">Sub Total</th>
              </tr>
            </thead>
            <tbody>
              {(receipt.items || []).map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-amber-50' : 'bg-white'}>
                  <td className="px-4 py-2">{item.type}</td>
                  <td className="px-4 py-2">{item.qty}</td>
                  <td className="px-4 py-2 uppercase">{item.description}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(item.unitCost)}</td>
                  <td className="px-4 py-2 text-right font-semibold">{formatMoney(item.subTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-start sm:justify-end">
        <div className="w-full sm:w-auto text-sm text-right space-y-1">
          <div>Labor:     <span className="inline-block w-28 text-right font-semibold">{formatMoney(receipt.laborTotal)}</span></div>
          <div>Materials: <span className="inline-block w-28 text-right font-semibold">{formatMoney(receipt.materialsTotal)}</span></div>
          <div className="text-base mt-2 flex flex-col sm:block items-end">
            <span className="text-xs sm:text-base text-gray-600">Estimated Total (Labor + Materials/Parts):</span>{' '}
            <span className="text-2xl font-bold text-green-700">{formatMoney(receipt.estimatedTotal)}</span>
          </div>
          <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2">
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm flex items-center justify-center gap-1">
              <Icon name="print" className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={doCancel}
              disabled={cancelling || receipt.status === 'CANCELLED'}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white px-4 py-2 rounded text-sm"
            >
              {receipt.status === 'CANCELLED' ? 'Cancelled' : (cancelling ? 'Cancelling…' : 'Cancel Receipt')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, children }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}:</div>
      <div className="text-gray-900">{children}</div>
    </div>
  )
}
