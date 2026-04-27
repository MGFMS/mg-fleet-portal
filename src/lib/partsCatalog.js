// Parts / labor catalog used by the line-item autocomplete on quote +
// receipt creation and edit. Hand-curated seed list for now — gets
// replaced by the Cavite catalog once the parts ingest ships
// (see reference_cavite_catalog.md memory).
//
// Each entry:
//   code        — opaque SKU (P### for parts, L### for labor)
//   name        — display name
//   compat      — vehicle compatibility hint (free-text)
//   supplier    — supplier name
//   unitCost    — what we pay
//   srp         — what we charge (used as default unit cost in quote)
//   stock       — inventory count (null for labor)
//   reserved    — reserved count (null for labor)

export const PARTS_CATALOG = [
  { code: 'P001', name: 'ENGINE FILTER',                    compat: 'Toyota Vios, Honda City',    supplier: 'AutoPlus',         unitCost: 500,  srp: 700,  stock: 15,  reserved: 2 },
  { code: 'P002', name: 'OIL FILTER',                       compat: 'Toyota Innova, Honda Civic', supplier: 'Autoplus Trading', unitCost: 200,  srp: 400,  stock: 20,  reserved: 3 },
  { code: 'P003', name: 'US LUBE GASOLINE',                 compat: 'All',                         supplier: 'US Lube Inc.',     unitCost: 250,  srp: 350,  stock: 40,  reserved: 0 },
  { code: 'P004', name: 'CABIN FILTER',                     compat: 'Toyota Vios, Innova',         supplier: 'Autoplus Trading', unitCost: 350,  srp: 550,  stock: 8,   reserved: 1 },
  { code: 'P005', name: 'ENGINE SUPPORT FOR VIOS',          compat: 'Toyota Vios 2003',            supplier: 'Autoplus Trading', unitCost: 1200, srp: 1800, stock: 2,   reserved: 0 },
  { code: 'P006', name: 'DRY RAG',                          compat: 'All',                         supplier: 'General Supply',   unitCost: 10,   srp: 15,   stock: 500, reserved: 0 },
  { code: 'L001', name: 'PREVENTIVE MAINTENANCE SERVICE',   compat: '',                            supplier: '',                 unitCost: 2500, srp: 2500, stock: null, reserved: null },
  { code: 'L002', name: 'REPLACE ENGINE SUPPORT',           compat: '',                            supplier: '',                 unitCost: 800,  srp: 800,  stock: null, reserved: null },
]
