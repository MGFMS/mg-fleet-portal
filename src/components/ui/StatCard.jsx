// Dark stat tile used across the top of dashboard / my-fleet pages.
// `tone` controls the accent color for the value.

const TONES = {
  dark: { card: 'bg-gray-900 text-white',    value: 'text-white' },
  green:{ card: 'bg-green-600 text-white',   value: 'text-white' },
  amber:{ card: 'bg-amber-500 text-white',   value: 'text-white' },
  red:  { card: 'bg-red-600 text-white',     value: 'text-white' },
  gray: { card: 'bg-gray-400 text-white',    value: 'text-white' },
  blue: { card: 'bg-brand text-white',       value: 'text-white' },
  yellow:{ card: 'bg-yellow-500 text-white', value: 'text-white' },
}

export default function StatCard({ label, value, tone = 'dark', icon, small = false, compact = false }) {
  const t = TONES[tone] || TONES.dark
  if (compact) {
    // one-line dense variant used in the PM row
    return (
      <div className={`${t.card} rounded-md px-3 sm:px-5 py-3 flex items-center justify-between gap-2`}>
        <span className="text-[11px] sm:text-xs font-semibold tracking-wider leading-tight">{label}</span>
        <span className="text-xl sm:text-2xl font-bold shrink-0">{value}</span>
      </div>
    )
  }
  return (
    <div className={`${t.card} rounded-md px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2`}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {icon && <span className="opacity-80 shrink-0">{icon}</span>}
        <span className={`${small ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} font-medium leading-tight`}>{label}</span>
      </div>
      <span className={`${t.value} ${small ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-bold shrink-0`}>{value}</span>
    </div>
  )
}
