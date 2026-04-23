// Mobile-only bottom tab bar. mg-fms-style navigation that replaces the
// hamburger-drawer pattern on phones. Role-aware — customer vs internal
// users see different tabs. Hidden on md+ where the persistent sidebar
// takes over.
//
// Active state uses `text-brand` (red) so it reads immediately against the
// white surface. The "More" tab opens /more — a full-screen menu listing
// every section that didn't fit here, same role-aware filter.

import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isCustomer, canBookServices } from '../lib/roles'
import Icon from './ui/Icon'

function Tab({ to, icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ` +
        (isActive ? 'text-brand' : 'text-gray-500 hover:text-gray-800')
      }
    >
      <Icon name={icon} className="w-6 h-6" />
      <span className="text-[10px] font-semibold leading-tight">{label}</span>
    </NavLink>
  )
}

// Customer tabs — what a fleet client sees first when they open the app.
// Dashboard + My Fleet + Notifications cover the three things they actually
// use. Quotations is promoted because approvers come here daily. "+ Book a
// Service" stays off the tab bar — fleet_coordinator role can still reach
// it via More, and the MG Fleet workflow change moves most bookings to MG.
const CUSTOMER_TABS = (profile) => {
  const tabs = [
    { to: '/portal',               icon: 'home',     label: 'Dashboard', end: true },
    { to: '/portal/my-fleet',      icon: 'car',      label: 'My Fleet' },
    { to: '/portal/notifications', icon: 'bell',     label: 'Alerts' },
    { to: '/portal/quotations',    icon: 'doc',      label: 'Quotations' },
    { to: '/more',                 icon: 'grid',     label: 'More' },
  ]
  return tabs
}

// Staff tabs — My Garage is the daily driver. Bookings second. Receipts is
// promoted over Quotations because staff create receipts, clients approve
// quotations. Everything else goes to More.
const STAFF_TABS = () => ([
  { to: '/home',              icon: 'home',     label: 'Garage', end: true },
  { to: '/appointments',      icon: 'calendar', label: 'Bookings', end: true },
  { to: '/home/notifications',icon: 'bell',     label: 'Alerts' },
  { to: '/service-receipts',  icon: 'receipt',  label: 'Receipts', end: true },
  { to: '/more',              icon: 'grid',     label: 'More' },
])

export default function BottomNav() {
  const { profile } = useAuth()
  if (!profile) return null
  // Admins see the staff bar regardless — same escape hatch as Sidebar.
  const customerView = isCustomer(profile.role) && !profile.is_admin
  const tabs = customerView ? CUSTOMER_TABS(profile) : STAFF_TABS()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-stretch shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      aria-label="Primary navigation"
    >
      {tabs.map((t) => (
        <Tab key={t.to} {...t} />
      ))}
    </nav>
  )
}
