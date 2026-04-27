// Shared line-item editor card. Used by:
//   - ServiceReceiptCreate (new quotation / receipt)
//   - ServiceReceiptDetails / EditableItems (edit a draft quotation)
//
// One look, one set of controls. The parent owns the items array;
// this component is purely presentational + emits onChange / onRemove
// per row.
//
// Optional props:
//   - showRevisionTag: boolean — render a "Rev N" badge next to the
//     index pill (useful in the edit flow to show which round each
//     existing item came from)

import { useState } from 'react'
import { PARTS_CATALOG } from '../lib/partsCatalog'
import { formatMoney } from '../lib/dummyData'
import Icon from './ui/Icon'

export default function LineItemCard({ index, row, onChange, onRemove, canRemove, showRevisionTag = false }) {
  const [showAuto, setShowAuto] = useState(false)
  const subTotal = (Number(row.qty) || 1) * (Number(row.unitCost) || 0)
  const filtered = row.description
    ? PARTS_CATALOG.filter((p) => p.name.toLowerCase().includes(row.description.toLowerCase())).slice(0, 6)
    : []
  const pick = (p) => { onChange({ description: p.name, unitCost: p.srp || p.unitCost }); setShowAuto(false) }

  const isLabor = row.type === 'Labor'
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${isLabor ? 'border-sky-200' : 'border-gray-200'}`}>
      <div className={`px-4 py-2 border-b flex items-center justify-between ${isLabor ? 'bg-sky-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isLabor ? 'bg-sky-600 text-white' : 'bg-gray-700 text-white'}`}>
            #{index + 1} · {isLabor ? 'Labor' : 'Parts'}
          </span>
          {showRevisionTag && row.revisionRound > 1 && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500 text-white">
              Rev {row.revisionRound}
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
          >
            <Icon name="warn" className="w-3.5 h-3.5" />
            Remove
          </button>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['Labor', 'Parts/Materials'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ type: t })}
                className={`text-sm font-bold py-2.5 rounded-xl border-2 transition-colors ${
                  row.type === t
                    ? (t === 'Labor' ? 'bg-sky-600 border-sky-600 text-white' : 'bg-gray-800 border-gray-800 text-white')
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Service / Parts / Materials
          </label>
          <input
            className="input"
            value={row.description}
            onChange={(e) => { onChange({ description: e.target.value }); setShowAuto(true) }}
            onFocus={() => setShowAuto(true)}
            onBlur={() => setTimeout(() => setShowAuto(false), 150)}
            placeholder="Search catalog or enter custom…"
          />
          {showAuto && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border rounded-xl shadow-xl text-xs max-h-64 overflow-y-auto">
              {filtered.map((p) => (
                <button type="button" key={p.code} onClick={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-sky-50 border-b last:border-b-0">
                  <div className="font-semibold text-gray-800">{p.name} <span className="font-mono text-gray-400">({p.code})</span></div>
                  {p.compat && <div className="text-[11px] text-gray-500">{p.compat}</div>}
                  <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-green-700">{formatMoney(p.srp || p.unitCost)}</span>
                    {p.supplier && <span>· {p.supplier}</span>}
                    {p.stock != null && <span>· stock {p.stock}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Qty</label>
            <div className="flex items-center bg-gray-50 border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => onChange({ qty: Math.max(1, (row.qty || 1) - 1) })}
                className="w-10 h-11 text-xl font-black text-gray-600 hover:bg-gray-100"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={row.qty}
                onChange={(e) => onChange({ qty: Math.max(1, Number(e.target.value) || 1) })}
                className="flex-1 bg-transparent text-center font-bold text-base focus:outline-none min-w-0"
              />
              <button
                type="button"
                onClick={() => onChange({ qty: (row.qty || 1) + 1 })}
                className="w-10 h-11 text-xl font-black text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Unit Cost</label>
            <input
              type="number"
              min="0"
              value={row.unitCost}
              onChange={(e) => onChange({ unitCost: Number(e.target.value) || 0 })}
              className="input text-right font-mono"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Sub Total</span>
          <span className="text-lg font-black text-gray-900">{formatMoney(subTotal)}</span>
        </div>
      </div>
    </div>
  )
}
