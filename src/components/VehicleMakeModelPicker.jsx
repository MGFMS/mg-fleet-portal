// Cascading make + model picker. Backed by refVehicleBrands and
// refVehicleModels (the Cavite ingest from Round 20). Replaces the
// free-text inputs that previously allowed typos and made the
// catalog autocomplete unreliable.
//
// Usage:
//   <VehicleMakeModelPicker
//     value={{ makeName, makeId, modelName, modelId }}
//     onChange={(v) => ...}
//   />
//
// Both fields are persisted to the parent — name (display) AND
// caviteId (foreign key for catalog joins). When the user types into
// the search box, suggestions filter live; on pick, all four values
// are sent up in one onChange call.
//
// Falls back gracefully when refVehicleBrands/Models are empty
// (admin hasn't ingested yet) — fields render as plain free-text
// with a hint to ingest the catalog first.

import { useEffect, useMemo, useState } from 'react'
import { getAllBrands, getAllModels } from '../lib/refVehicles'

export default function VehicleMakeModelPicker({ value, onChange, makeLabel = 'Make', modelLabel = 'Model', required = false }) {
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([getAllBrands(), getAllModels()]).then(([b, m]) => {
      if (cancelled) return
      setBrands(b); setModels(m); setLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  // Models are filtered to whichever make is selected so the model
  // dropdown stays scannable (350 → ~10-30 entries per make).
  const modelsForMake = useMemo(() => {
    if (!value?.makeId) return []
    return models.filter((m) => Number(m.caviteMakeId) === Number(value.makeId))
  }, [models, value?.makeId])

  const onMakeChange = (makeId) => {
    const found = brands.find((b) => Number(b.caviteId) === Number(makeId))
    if (!found) {
      onChange?.({ makeName: '', makeId: null, modelName: '', modelId: null })
      return
    }
    onChange?.({
      makeName: found.name,
      makeId: Number(found.caviteId),
      // Reset model when make changes — old model probably doesn't belong.
      modelName: '',
      modelId: null,
    })
  }

  const onModelChange = (modelId) => {
    const found = modelsForMake.find((m) => Number(m.caviteId) === Number(modelId))
    if (!found) {
      onChange?.({ ...value, modelName: '', modelId: null })
      return
    }
    onChange?.({
      ...value,
      modelName: found.name,
      modelId: Number(found.caviteId),
    })
  }

  // Empty catalog → fall back to free-text so the form isn't blocked.
  const emptyCatalog = loaded && brands.length === 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{makeLabel}</label>
        {emptyCatalog ? (
          <input
            value={value?.makeName || ''}
            onChange={(e) => onChange?.({ ...value, makeName: e.target.value, makeId: null })}
            placeholder="Catalog empty — type the make"
            className="input w-full uppercase"
            required={required}
          />
        ) : (
          <select
            value={value?.makeId ?? ''}
            onChange={(e) => onMakeChange(e.target.value)}
            className="input w-full"
            required={required}
            disabled={!loaded}
          >
            <option value="">{loaded ? '— pick a make —' : 'Loading…'}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.caviteId}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{modelLabel}</label>
        {emptyCatalog ? (
          <input
            value={value?.modelName || ''}
            onChange={(e) => onChange?.({ ...value, modelName: e.target.value, modelId: null })}
            placeholder="Catalog empty — type the model"
            className="input w-full uppercase"
            required={required}
          />
        ) : (
          <select
            value={value?.modelId ?? ''}
            onChange={(e) => onModelChange(e.target.value)}
            className="input w-full"
            required={required}
            disabled={!loaded || !value?.makeId}
          >
            <option value="">
              {!value?.makeId ? '— pick a make first —' : (modelsForMake.length === 0 ? 'No models for this make' : '— pick a model —')}
            </option>
            {modelsForMake.map((m) => (
              <option key={m.id} value={m.caviteId}>{m.name}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
