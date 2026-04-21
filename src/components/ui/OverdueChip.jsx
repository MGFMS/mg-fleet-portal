// Small red rounded chip showing overdue days (e.g. "66d", "120d").
// Seen on the Fleet Customer Dashboard's overdue PM cards.
export default function OverdueChip({ days }) {
  if (days == null) return null
  return (
    <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
      {days}d
    </span>
  )
}
