// Service Receipt detail — loads from Firestore (falls back to dummy).

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatMoney } from '../lib/dummyData'
import { getReceipt, setReceiptStatus } from '../lib/serviceReceipts'
import Icon from '../components/ui/Icon'
import PageHero from '../components/ui/PageHero'
import StatusPill from '../components/ui/StatusPill'

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
  if (!receipt) return (
    <div className="p-4 sm:p-6 space-y-3">
      <div className="text-gray-500">Receipt {code} not found.</div>
      {error && <div className="text-xs text-red-600">{error.message || String(error)}</div>}
    </div>
  )

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

  const isCancelled = receipt.status === 'CANCELLED'

  return (
    <div className="pb-32">
      <PageHero
        eyebrow="SERVICE RECEIPT"
        title={receipt.code}
        subtitle={`${receipt.plateNo} · ${receipt.brandModel || 'Vehicle'}`}
        right={<TotalChip value={receipt.estimatedTotal} />}
      />

      <div className="px-3 sm:px-6 pt-4 space-y-4">
        <div className="flex items-center gap-2">
          <StatusPill status={receipt.status} />
          {receipt.scheduleType && (
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
              {receipt.scheduleType}
            </span>
          )}
        </div>

        {/* Customer + Vehicle info */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-gray-500">
            Customer & Vehicle
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <Info label="Plate No.">
              <span className="bg-brand text-white font-mono font-bold tracking-wide px-3 py-1 rounded-lg inline-block">{receipt.plateNo}</span>
            </Info>
            <Info label="Brand / Model">{receipt.brandModel || '—'}</Info>
            <Info label="Latest Odo">{receipt.latestOdo?.toLocaleString() || '—'}</Info>
            <Info label="Customer">{receipt.customer}</Info>
            <Info label="Mobile">{receipt.mobile || '—'}</Info>
            <Info label="Person In-Charge">{receipt.personInCharge || '—'}</Info>
            <Info label="Assigned Mechanic">{receipt.mechanic || '—'}</Info>
            <Info label="Notes" className="sm:col-span-2">{receipt.notes || '—'}</Info>
          </div>
        </div>

        {/* Line items — mobile cards, desktop table */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Items</div>
            <span className="text-xs text-gray-400">{(receipt.items || []).length}</span>
          </div>
          <div className="lg:hidden space-y-2">
            {(receipt.items || []).length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed p-5 text-center text-gray-400 text-sm">No line items.</div>
            )}
            {(receipt.items || []).map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${item.type === 'Labor' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-white'}`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-gray-500 font-bold">× {item.qty}</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 uppercase break-words">
                  {item.description || '—'}
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[11px] text-gray-500">
                    {formatMoney(item.unitCost)} × {item.qty}
                  </span>
                  <span className="text-base font-black text-gray-900">{formatMoney(item.subTotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block bg-white rounded-2xl border overflow-hidden">
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
        </section>

        {/* Totals card */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-gray-500">
            Totals
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Labor</span>
              <span className="font-bold text-gray-900">{formatMoney(receipt.laborTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Materials</span>
              <span className="font-bold text-gray-900">{formatMoney(receipt.materialsTotal)}</span>
            </div>
            <div className="border-t pt-3 mt-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Estimated Total</span>
              <span className="text-2xl font-black text-green-700">{formatMoney(receipt.estimatedTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        <div className="px-3 sm:px-6 py-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Icon name="print" className="w-4 h-4" />
            Print
          </button>
          <button
            type="button"
            onClick={doCancel}
            disabled={cancelling || isCancelled}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm px-4 py-3 rounded-xl active:scale-95 transition-transform"
          >
            {isCancelled ? 'Cancelled' : cancelling ? 'Cancelling…' : 'Cancel Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TotalChip({ value }) {
  return (
    <div className="bg-white/15 rounded-xl px-3 py-2 text-right min-w-[110px]">
      <div className="text-[9px] font-bold tracking-widest text-white/60">TOTAL</div>
      <div className="text-xl font-black text-white leading-none mt-0.5">{formatMoney(value)}</div>
    </div>
  )
}

function Info({ label, children, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
      <div className="text-gray-900 text-sm break-words">{children}</div>
    </div>
  )
}
