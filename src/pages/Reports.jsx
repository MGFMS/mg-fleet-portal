// Reports landing page — placeholder with the report tiles from the legacy
// /_reference_dotnet/Views/Reports/Index.cshtml.

import Icon from '../components/ui/Icon'
import PageHero, { HeroStat } from '../components/ui/PageHero'

const REPORTS = [
  { title: 'Service Revenue',         desc: 'Monthly revenue from completed services.', icon: 'doc' },
  { title: 'Mechanic Productivity',   desc: 'Hours logged and vehicles completed per mechanic.', icon: 'tool' },
  { title: 'Fleet PM Compliance',     desc: 'Percentage of fleet vehicles on-schedule for PM.', icon: 'check' },
  { title: 'Parts Consumption',       desc: 'Parts used, reserved, and missing across receipts.', icon: 'backlog' },
  { title: 'Booking Funnel',          desc: 'Bookings → arrivals → assessments → completions.', icon: 'calendar' },
  { title: 'Customer Retention',      desc: 'Repeat vs new customers per branch.', icon: 'user' },
]

export default function Reports() {
  return (
    <div className="pb-24">
      <PageHero
        eyebrow="REPORTS"
        title="Business Intelligence"
        subtitle={`${REPORTS.length} reports available`}
        right={<HeroStat value={REPORTS.length} label="REPORTS" tone="solid" />}
      />

      <div className="px-3 sm:px-6 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORTS.map((r) => (
            <button key={r.title} className="bg-white rounded-2xl border p-5 text-left hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-3">
                <Icon name={r.icon} className="w-5 h-5" />
              </div>
              <div className="font-bold text-gray-900">{r.title}</div>
              <div className="text-sm text-gray-600 mt-1">{r.desc}</div>
              <div className="mt-3 text-xs text-gray-400">Coming soon — tile will drill into the full report.</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
