// Reports landing page — placeholder with the report tiles from the legacy
// /_reference_dotnet/Views/Reports/Index.cshtml.

import Icon from '../components/ui/Icon'

const REPORTS = [
  { title: 'Service Revenue',         desc: 'Monthly revenue from completed services.', icon: 'doc' },
  { title: 'Mechanic Productivity',   desc: 'Hours logged and vehicles completed per mechanic.', icon: 'tool' },
  { title: 'Fleet PM Compliance',     desc: 'Percentage of fleet vehicles on-schedule for PM.', icon: 'check' },
  { title: 'Parts Consumption',       desc: 'Parts used, reserved, and missing across receipts.', icon: 'backlog' },
  { title: 'Booking Funnel',          desc: 'Bookings → arrivals → diagnoses → completions.', icon: 'calendar' },
  { title: 'Customer Retention',      desc: 'Repeat vs new customers per branch.', icon: 'user' },
]

export default function Reports() {
  return (
    <div className="p-6 pb-20">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map((r) => (
          <button key={r.title} className="bg-white rounded-md border p-5 text-left hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-brand mb-2">
              <Icon name={r.icon} className="w-5 h-5" />
              <span className="font-semibold">{r.title}</span>
            </div>
            <div className="text-sm text-gray-600">{r.desc}</div>
            <div className="mt-3 text-xs text-gray-400">Coming soon — tile will drill into the full report.</div>
          </button>
        ))}
      </div>
    </div>
  )
}
