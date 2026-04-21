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
      <div className={`${t.card} rounded-md px-5 py-3 flex items-center justify-between`}>
        <span className="text-xs font-semibold tracking-wider">{label}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
    )
  }
  return (
    <div className={`${t.card} rounded-md px-5 py-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        {icon && <span className="opacity-80">{icon}</span>}
        <span className={`${small ? 'text-xs' : 'text-sm'} font-medium leading-tight`}>{label}</span>
      </div>
      <span className={`${t.value} ${small ? 'text-2xl' : 'text-3xl'} font-bold`}>{value}</span>
    </div>
  )
}
