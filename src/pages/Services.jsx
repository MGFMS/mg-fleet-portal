// Services Offered — catalog of services for the quotation line-item picker.
// Mirrors /_reference_dotnet/Views/Services/Index.cshtml structure.

import Icon from '../components/ui/Icon'
import PageHero, { HeroStat } from '../components/ui/PageHero'

const CATEGORIES = [
  {
    name: 'Preventive Maintenance',
    services: [
      { code: 'PM-001', name: 'Oil Change',              price: 1200 },
      { code: 'PM-002', name: 'PMS — 5,000 km',          price: 2500 },
      { code: 'PM-003', name: 'PMS — 10,000 km',         price: 4500 },
      { code: 'PM-004', name: 'Tire Rotation',           price: 400 },
    ],
  },
  {
    name: 'Under Chassis',
    services: [
      { code: 'UC-001', name: 'Brake Pad Replacement',    price: 1500 },
      { code: 'UC-002', name: 'Replace Engine Support',   price: 800 },
      { code: 'UC-003', name: 'Wheel Alignment',          price: 1200 },
    ],
  },
  {
    name: 'Engine',
    services: [
      { code: 'EN-001', name: 'Spark Plug Replacement',   price: 700 },
      { code: 'EN-002', name: 'Fuel Pump Inspection',     price: 500 },
      { code: 'EN-003', name: 'Timing Belt Replacement',  price: 6500 },
    ],
  },
  {
    name: 'Electrical',
    services: [
      { code: 'EL-001', name: 'Battery Test & Replace',   price: 500 },
      { code: 'EL-002', name: 'Alternator Repair',        price: 2200 },
    ],
  },
]

export default function Services() {
  const totalServices = CATEGORIES.reduce((n, c) => n + c.services.length, 0)

  return (
    <div className="pb-24">
      <PageHero
        eyebrow="CATALOG"
        title="Services Offered"
        subtitle={`${totalServices} service${totalServices === 1 ? '' : 's'} across ${CATEGORIES.length} categories`}
        right={<HeroStat value={totalServices} label="TOTAL" tone="solid" />}
      />

      <div className="px-3 sm:px-6 pt-4 space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.name} className="bg-white rounded-2xl border overflow-hidden">
            <div className="bg-gray-900 text-white px-4 py-2.5 text-sm font-bold flex items-center gap-2">
              <Icon name="tool" className="w-4 h-4" />
              {cat.name}
              <span className="ml-auto bg-white/10 rounded-full px-2 py-0.5 text-[10px]">{cat.services.length}</span>
            </div>

            {/* Mobile: list of service rows */}
            <div className="lg:hidden divide-y">
              {cat.services.map((s) => (
                <div key={s.code} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-gray-900 uppercase">{s.name}</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">{s.code}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-gray-900">₱{s.price.toLocaleString()}</div>
                    <button className="text-[11px] text-brand font-bold hover:underline mt-0.5">Edit</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Code</th>
                    <th className="px-4 py-2 text-left font-medium">Service</th>
                    <th className="px-4 py-2 text-right font-medium">Standard Price</th>
                    <th className="px-4 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cat.services.map((s) => (
                    <tr key={s.code} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">{s.code}</td>
                      <td className="px-4 py-2 uppercase">{s.name}</td>
                      <td className="px-4 py-2 text-right font-semibold">₱{s.price.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-xs">
                        <button className="text-brand hover:underline">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-20">
        <button className="bg-brand hover:bg-brand-dark text-white px-4 sm:px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
          <Icon name="plus" className="w-4 h-4" />
          Add Service
        </button>
      </div>
    </div>
  )
}
