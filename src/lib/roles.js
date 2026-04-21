// Roles are stored as lowercase string enums on the users doc
// (e.g. "fleet_manager"). This registry is the single source of truth for
// how the portal treats each role.
//
// category:
//   'internal' — garage staff (sidebar: Quick Links / Core Ops / Data Mgmt)
//   'customer' — fleet customer (sidebar: Fleet / My Fleet / Quotations)
//
// defaultRoute — where to land after login.
// canBookServices — whether "+ Book a Service" appears (customer view only).

export const ROLE_REGISTRY = {
  // --- fleet customer side ---
  fleet_manager: {
    label: 'Fleet Manager',
    category: 'customer',
    defaultRoute: '/portal',
    canBookServices: true,
    canApproveQuotations: true,
  },
  fleet_user: {
    label: 'Fleet User',
    category: 'customer',
    defaultRoute: '/portal',
    canBookServices: false,
    canApproveQuotations: false,
  },
  customer: {
    label: 'Customer',
    category: 'customer',
    defaultRoute: '/portal',
    canBookServices: false,
    canApproveQuotations: false,
  },

  // --- garage staff side (guesses — confirm actual strings in Firestore) ---
  admin: { label: 'Admin', category: 'internal', defaultRoute: '/home' },
  branch_manager: { label: 'Branch Manager', category: 'internal', defaultRoute: '/home' },
  admin_supervisor: { label: 'Admin Supervisor', category: 'internal', defaultRoute: '/home' },
  call_center: { label: 'Call Center', category: 'internal', defaultRoute: '/home' },
  service_advisor: { label: 'Service Advisor', category: 'internal', defaultRoute: '/home' },
  floor_supervisor: { label: 'Floor Supervisor', category: 'internal', defaultRoute: '/home' },
  parts_man: { label: 'Parts Man', category: 'internal', defaultRoute: '/home' },
  finance: { label: 'Finance', category: 'internal', defaultRoute: '/home' },
  mechanic: { label: 'Mechanic', category: 'internal', defaultRoute: '/home' },
}

const normalize = (role) => String(role || '').toLowerCase().trim()

export const getRoleInfo = (role) => ROLE_REGISTRY[normalize(role)] || null

export const roleLabel = (role) => getRoleInfo(role)?.label || role || '—'

export const isInternal = (role) => getRoleInfo(role)?.category === 'internal'
export const isCustomer = (role) => getRoleInfo(role)?.category === 'customer'

export const canBookServices = (role) => Boolean(getRoleInfo(role)?.canBookServices)
export const canApproveQuotations = (role) =>
  Boolean(getRoleInfo(role)?.canApproveQuotations)

export const defaultRouteForRole = (role) => getRoleInfo(role)?.defaultRoute || '/login'

// For ProtectedRoute: pass a category instead of listing every role string.
export const INTERNAL_CATEGORY = 'internal'
export const CUSTOMER_CATEGORY = 'customer'
