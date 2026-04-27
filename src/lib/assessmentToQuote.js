// Smart quote prefill — given a completed assessment, suggest the line items
// for a quotation.
//
// Two strategies, picked based on what the assessment carries:
//   A. NEW (Round 18). The assessor declared `labors[]` at submit time
//      (e.g. "Preventive Maintenance Service", "Brake Service"). We emit
//      one Labor line per declared labor type, plus Parts lines for each
//      failed inspection item. This is what the user actually wants on
//      the quote — multiple PMS items collapse into a single PMS labor
//      line instead of one Labor row per item.
//   B. LEGACY fallback. If the assessment predates Round 18 and has no
//      `labors` field, fall back to per-item Labor lines (the original
//      Round 17 behavior). Keeps existing assessments working.
//
// Out of scope:
//   - Pricing. Until the Cavite catalog ingestion ships, unitCost is left
//     at 0 and the user fills it in. Round 13 deferred this.
//   - 'monitor' items. They're tracked, not repaired — the quote shouldn't
//     proactively bill for them.
//   - 'replaced' items. The replacement happened in the field; nothing to
//     bill on top.

import {
  ALL_ITEMS, CATEGORIES, ITEM_MAP, INSP_TO_PMS, LABOR_TYPE_MAP, PMS_MAP,
  getAction,
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

// Helper: normalize an assessment's labor source. Prefers `labors[]` from
// Round 18; falls back to `pmsData.laborTypes` (used by mg-fms QuickFix
// flow) so re-assessment quickfixes also benefit. Returns [] if neither
// source is present.
function normalizedLabors(assessment) {
  if (Array.isArray(assessment?.labors) && assessment.labors.length > 0) {
    return assessment.labors
  }
  const pmsLabors = assessment?.pmsData?.laborTypes
  if (Array.isArray(pmsLabors) && pmsLabors.length > 0) return pmsLabors
  return []
}

// Build the Parts lines from failed inspection items. Same logic both
// paths share — labor strategy diverges, parts don't.
function partsLinesFromItemResults(itemResults) {
  const findings = []
  for (const code of Object.keys(itemResults)) {
    const r = itemResults[code]
    const item = ITEM_MAP[code]
    if (!item || !r?.resultCode) continue
    if (r.resultCode !== 'fail_critical') continue
    const action = getAction(item, r.resultCode)
    if (action === 'NONE' || action === 'MONITOR_ONLY') continue
    findings.push({ item, result: r, action })
  }
  findings.sort((a, b) => {
    const ca = CATEGORY_INDEX[categoryOf(a.item.code)] ?? 999
    const cb = CATEGORY_INDEX[categoryOf(b.item.code)] ?? 999
    if (ca !== cb) return ca - cb
    return (a.item.label || '').localeCompare(b.item.label || '')
  })
  return findings.map(({ item }) => {
    const pmsCode = INSP_TO_PMS[item.code]
    const partsLabel = pmsCode && PMS_MAP[pmsCode]?.label
      ? PMS_MAP[pmsCode].label
      : item.label
    return {
      type: 'Parts/Materials',
      qty: 1,
      description: `Replace ${partsLabel}`,
      unitCost: 0,
    }
  })
}

// Given an assessment doc (from Firestore), return an array of suggested
// quotation rows in the shape ServiceReceiptCreate already expects:
//   { type: 'Labor' | 'Parts/Materials', qty, description, unitCost }
//
// Returns [] if the assessment is missing or has no actionable findings.
export function suggestQuoteItemsFromAssessment(assessment) {
  const itemResults = assessment?.itemResults || {}
  if (typeof itemResults !== 'object') return []

  const declaredLabors = normalizedLabors(assessment)
  const otherLabor = (assessment?.otherLabor || '').trim()

  // STRATEGY A — Round 18: assessor declared labor types. One Labor row
  // per declared labor (in catalog order). Parts come from failed items.
  if (declaredLabors.length > 0 || otherLabor) {
    const rows = []
    for (const lt of declaredLabors) {
      // LBR_OTHER is rendered using the free-text otherLabor field, not
      // the generic "Other" label, so the quote actually communicates
      // what the labor is.
      if (lt.code === 'LBR_OTHER') continue
      rows.push({
        type: 'Labor',
        qty: 1,
        description: lt.label || LABOR_TYPE_MAP[lt.code]?.label || lt.code,
        unitCost: 0,
      })
    }
    if (otherLabor) {
      rows.push({
        type: 'Labor',
        qty: 1,
        description: otherLabor,
        unitCost: 0,
      })
    }
    rows.push(...partsLinesFromItemResults(itemResults))
    return rows
  }

  // STRATEGY B — legacy fallback (Round 17 behavior): one Labor + one
  // Parts line per failed inspection item.
  const findings = []
  for (const code of Object.keys(itemResults)) {
    const r = itemResults[code]
    const item = ITEM_MAP[code]
    if (!item || !r?.resultCode) continue
    if (r.resultCode !== 'fail_critical') continue
    const action = getAction(item, r.resultCode)
    if (action === 'NONE' || action === 'MONITOR_ONLY') continue
    findings.push({ item, result: r, action })
  }

  findings.sort((a, b) => {
    const ca = CATEGORY_INDEX[categoryOf(a.item.code)] ?? 999
    const cb = CATEGORY_INDEX[categoryOf(b.item.code)] ?? 999
    if (ca !== cb) return ca - cb
    return (a.item.label || '').localeCompare(b.item.label || '')
  })

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

// Convenience wrapper: returns the counts the prefill banner shows, plus
// the source of the labor lines (declared by the assessor vs. derived
// from items) so the banner copy can be honest about it.
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
  const declaredLabors = normalizedLabors(assessment)
  const otherLabor = (assessment?.otherLabor || '').trim()
  const laborCount = declaredLabors.filter((l) => l.code !== 'LBR_OTHER').length + (otherLabor ? 1 : 0)
  const laborSource = laborCount > 0 ? 'declared' : 'derived'
  return {
    criticalCount,
    holdCount,
    laborCount,
    laborSource,
    rwa: assessment?.rwaNumber || null,
  }
}
