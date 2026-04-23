// mg-fms-style red hero strip that sits right below the Topbar on customer
// pages. Gives the app an instantly recognizable brand moment and frees up
// the Topbar title row from having to carry context. Used on Portal,
// MyFleet, VehicleDetails, AssessmentView.
//
//   <PageHero
//     eyebrow="FLEET DASHBOARD"
//     title={company}
//     subtitle="42 vehicles · 3 due for PM"
//     right={<StatChip value={42} label="Total" />}
//   />

export default function PageHero({ eyebrow, title, subtitle, right, tone = 'brand' }) {
  const toneMap = {
    brand:   'bg-brand text-white',
    dark:    'bg-gray-900 text-white',
    success: 'bg-gradient-to-b from-green-700 to-green-600 text-white',
    warn:    'bg-gradient-to-b from-amber-600 to-amber-500 text-white',
    danger:  'bg-gradient-to-b from-red-800 to-red-700 text-white',
  }
  const bg = toneMap[tone] || toneMap.brand
  return (
    <div className={`${bg} px-4 pt-5 pb-6 md:rounded-none`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-bold tracking-widest text-white/60 mb-1">
              {eyebrow}
            </div>
          )}
          <div className="font-black text-xl sm:text-2xl leading-tight break-words">
            {title}
          </div>
          {subtitle && (
            <div className="text-white/80 text-xs sm:text-sm mt-1">
              {subtitle}
            </div>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  )
}

// Pill used in the hero's right slot. Large number + tiny caption, mg-fms vibe.
export function HeroStat({ value, label, tone = 'light' }) {
  const map = {
    light: 'bg-white/15 text-white',
    solid: 'bg-white text-brand',
  }
  return (
    <div className={`${map[tone]} rounded-xl px-3 py-2 text-center min-w-[64px]`}>
      <div className="text-2xl font-black leading-none">{value ?? '—'}</div>
      <div className="text-[9px] font-bold tracking-widest opacity-80 mt-1">{label}</div>
    </div>
  )
}
