// Pill badge for a vehicle's roadworthy status.
// Accepts our canonical bucket strings: 'active' | 'minor' | 'unfit' | 'unknown'
// or legacy status labels that we bucket best-effort.

function bucket(status) {
  const s = String(status || '').toLowerCase().trim()
  if (s === 'active' || s === 'roadworthy' || s === '1') return 'active'
  if (s === 'minor' || s.includes('minor') || s.includes('limited') || s === '2' || s === '3') return 'minor'
  if (s === 'unfit' || s.includes('unfit') || s.includes('unroadworthy') || s === '4') return 'unfit'
  if (s.includes('fit') && !s.includes('unfit') && !s.includes('limited')) return 'active'
  return 'unknown'
}

const LABEL = {
  active: 'Active / Roadworthy',
  minor: 'Minor Repairs Needed',
  unfit: 'Unfit for Use',
  unknown: 'Unknown',
}

const STYLES = {
  active: 'bg-green-600 text-white',
  minor: 'bg-amber-500 text-white',
  unfit: 'bg-red-600 text-white',
  unknown: 'bg-gray-400 text-white',
}

export default function RoadworthyBadge({ status, size = 'md' }) {
  const b = bucket(status)
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
  return (
    <span className={`${STYLES[b]} ${padding} font-semibold rounded-full whitespace-nowrap inline-block`}>
      {LABEL[b]}
    </span>
  )
}
