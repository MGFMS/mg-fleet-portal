// Smart quote prefill — given a completed assessment, suggest the line items
// for a quotation. Walks the assessment's itemResults, finds anything that
// failed (resultCode === 'fail_critical'), and emits a Labor + Parts pair
// per finding. Uses the inspection-item severity flags to vary the labor
// copy (URGENT / Critical / Service) and the PMS link to give the parts
// line a cleaner sellable name when one exists.
//
// Out of scope here:
//   - Pricing. Until the Cavite catalog ingestion ships, unitCost is left
//     at 0 and the user fills it in. Round 13 deferred this.
//   - 'monitor' items. They're tracked, not repaired — the quote shouldn't
//     proactively bill for them. The user can manually add a row if they
//     want to upsell.
//   - 'replaced' items. The replacement happened in the field; nothing to
//     bill on top.

import {
  ALL_ITEMS, CATEGORIES, ITEM_MAP, INSP_TO_PMS, PMS_MAP, getAction,
} from './mgfms-catalog'

// Stable category order so the generated quote reads like a service order
// (Engine → Brakes → Suspension → Electrical → Tires → Body → ...).
const CATEGORY_ORDER = CATEGORIES.map((c) => c.code)
const CATEGORY_INDEX = Object.fromEntries(CATEGORY_ORDER.map((code, i) => [code, i]))

// Find the parent category for an item code (item codes are prefixed with
// their category code, e.g. ENG_OIL → ENG, BRK_PAD_F → BRK).
function categoryOf(itemCode) {
  const prefix = itemCode.split('_')[0]
  return CATEGORY_INDEX[prefix] != null ? prefix : 'ZZZ'
}

function laborPrefix(action) {
  if (action === 'HOLD_UNIT') return 'URGENT —'
  if (action === 'REPAIR_IMMEDIATE') return 'Critical:'
  return 'Service:' // REPAIR_REQUIRED and any other not-skipped action
}

// Given an assessment doc (from Firestore), return an array of suggested
// quotation rows in the shape ServiceReceiptCreate already expects:
//   { type: 'Labor' | 'Parts/Materials', qty, description, unitCost }
//
// Returns [] if the assessment is missing or has no actionable findings.
export function suggestQuoteItemsFromAssessment(assessment) {
  const itemResults = assessment?.itemResults || {}
  if (!itemResults || typeof itemResults !== 'object') return []

  // Collect actionable findings.
  const findings = []
  for (const code of Object.keys(itemResults)) {
    const r = itemResults[code]
    const item = ITEM_MAP[code]
    if (!item || !r?.resultCode) continue
    if (r.resultCode !== 'fail_critical') continue // skip pass / na / monitor / replaced
    const action = getAction(item, r.resultCode)
    if (action === 'NONE' || action === 'MONITOR_ONLY') continue
    findings.push({ item, result: r, action })
  }

  // Sort by category order, then by item label inside the category.
  findings.sort((a, b) => {
    const ca = CATEGORY_INDEX[categoryOf(a.item.code)] ?? 999
    const cb = CATEGORY_INDEX[categoryOf(b.item.code)] ?? 999
    if (ca !== cb) return ca - cb
    return (a.item.label || '').localeCompare(b.item.label || '')
  })

  // Emit Labor + Parts lines per finding. Parts label uses the PMS link
  // when one exists ("Brake Pads Front" reads better on a customer-facing
  // quote than "Brake pad thickness — front"), otherwise falls back to
  // the inspection item's label.
  const rows = []
  for (const { item, action } of findings) {
    const prefix = laborPrefix(action)
    rows.push({
      type: 'Labor',
      qty: 1,
      description: `${prefix} ${item.label}`.trim(),
      unitCost: 0,
    })

    const pmsCode = INSP_TO_PMS[item.code]
    const partsLabel = pmsCode && PMS_MAP[pmsCode]?.label
      ? PMS_MAP[pmsCode].label
      : item.label
    rows.push({
      type: 'Parts/Materials',
      qty: 1,
      description: `Replace ${partsLabel}`,
      unitCost: 0,
    })
  }

  return rows
}

// Convenience wrapper: also returns a small summary so the UI can show
// "X items prefilled from RWA-12345 (Y critical, Z hold)".
export function summarizeAssessmentForQuote(assessment) {
  const items = ALL_ITEMS
  const itemResults = assessment?.itemResults || {}
  let criticalCount = 0
  let holdCount = 0
  for (const item of items) {
    const r = itemResults[item.code]
    if (r?.resultCode === 'fail_critical') {
      criticalCount++
      if (item.holdUnit) holdCount++
    }
  }
  return { criticalCount, holdCount, rwa: assessment?.rwaNumber || null }
}
