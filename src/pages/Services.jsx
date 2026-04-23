// Services Offered — catalog of services for the quotation line-item picker.
// Mirrors /_reference_dotnet/Views/Services/Index.cshtml structure.

import Icon from '../components/ui/Icon'

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
  return (
    <div className="p-4 sm:p-6 pb-20">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Services Offered</h1>
        <button className="bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 shrink-0">
          <Icon name="plus" className="w-4 h-4" />
          <span className="hidden sm:inline">Add Service</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.name} className="bg-white rounded-md border overflow-hidden">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
              <Icon name="tool" className="w-4 h-4" />
              {cat.name}
            </div>
            <div className="overflow-x-auto">
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
    </div>
  )
}
