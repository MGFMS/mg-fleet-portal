// Compact desktop-table line-item editor. Used inside a <table><tbody>
// on the quote/receipt create page AND on the quote edit / revision
// flows so all three surfaces share one look on wide screens.
//
// Props:
//   row, onChange, onRemove   — same shape as LineItemCard
//   canRemove                 — show the remove button (default true)
//   showAddInRowAction        — when true, replaces the "−" button with a
//                               "+" button; the parent passes onAdd in
//                               that case. Used by the create page where
//                               the last row's button adds a new line.
//   onAdd                     — handler for the "+" mode

import { useState } from 'react'
import { PARTS_CATALOG } from '../lib/partsCatalog'
import { formatMoney } from '../lib/dummyData'
import Icon from './ui/Icon'

export default function LineItemRow({
  row, onChange, onRemove, canRemove = true,
  showAddInRowAction = false, onAdd,
}) {
  const [showAuto, setShowAuto] = useState(false)
  const subTotal = (Number(row.qty) || 1) * (Number(row.unitCost) || 0)
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
        <input
          type="number" min="1"
          className="input py-1 text-sm sm:text-xs text-right"
          value={row.qty}
          onChange={(e) => onChange({ qty: Math.max(1, Number(e.target.value) || 1) })}
        />
      </td>
      <td className="px-3 py-2 relative">
        <input
          className="input py-1 text-sm sm:text-xs"
          value={row.description}
          onChange={(e) => { onChange({ description: e.target.value }); setShowAuto(true) }}
          onFocus={() => setShowAuto(true)}
          onBlur={() => setTimeout(() => setShowAuto(false), 150)}
          placeholder="Search parts / service…"
        />
        {showAuto && filtered.length > 0 && (
          <div className="absolute top-full left-0 z-20 mt-1 w-[90vw] max-w-sm sm:w-80 bg-white border rounded-md shadow-xl text-xs">
            {filtered.map((p) => (
              <button type="button" key={p.code} onClick={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-sky-50 border-b last:border-b-0">
                <div className="font-semibold text-gray-800">{p.name} ({p.code})</div>
                {p.compat && <div className="text-[11px] text-gray-500">Compatible to: {p.compat}</div>}
                {p.supplier && (
                  <div className="text-[11px] text-gray-500">
                    Supplier: {p.supplier} · Stock: {p.stock} · Reserved: {p.reserved} · SRP: {formatMoney(p.srp)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </td>
      <td className="px-3 py-2 w-32">
        <input
          type="number"
          className="input py-1 text-sm sm:text-xs text-right"
          value={row.unitCost}
          onChange={(e) => onChange({ unitCost: Number(e.target.value) || 0 })}
        />
      </td>
      <td className="px-3 py-2 w-28 text-right font-semibold">{formatMoney(subTotal)}</td>
      <td className="px-3 py-2 w-20 text-center">
        {showAddInRowAction ? (
          <button type="button" onClick={onAdd} className="bg-green-600 hover:bg-green-700 text-white rounded w-7 h-7 inline-flex items-center justify-center">
            <Icon name="plus" className="w-4 h-4" />
          </button>
        ) : canRemove ? (
          <button type="button" onClick={onRemove} className="bg-red-500 hover:bg-red-600 text-white rounded w-7 h-7 inline-flex items-center justify-center" title="Remove">
            −
          </button>
        ) : null}
      </td>
    </tr>
  )
}

// Convenience: the table header that pairs with LineItemRow. Drop in once
// inside a <table>; let the body render the rows.
export function LineItemHeader() {
  return (
    <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
      <tr>
        <th className="px-3 py-2 text-left font-medium">Type</th>
        <th className="px-3 py-2 text-left font-medium">Qty</th>
        <th className="px-3 py-2 text-left font-medium">Service / Parts / Materials</th>
        <th className="px-3 py-2 text-right font-medium">Unit Cost</th>
        <th className="px-3 py-2 text-right font-medium">Sub Total</th>
        <th className="px-3 py-2"></th>
      </tr>
    </thead>
  )
}
