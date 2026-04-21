// Sample vehicle set used when the real Firestore query returns nothing.
// Counts are tuned to the screenshot: 71 active / 18 minor / 11 unfit,
// 3 due-this-month, 3 scheduled, 20 overdue of a 100-vehicle fleet.

const MODELS = [
  ['Toyota', 'Altis'],
  ['Toyota', 'Innova'],
  ['Toyota', 'Vios'],
  ['Toyota', 'Hilux'],
  ['Toyota', 'Fortuner'],
]

const DRIVERS = [
  'MATEO GUZMAN', 'SOPHIA SANTOS', 'ISABELLA CRUZ', 'HARPER DELA CRUZ',
  'EVELYN MENDOZA', 'ABIGAIL TORRES', 'ELLA BAUTISTA', 'HENRY DOMINGUEZ',
  'EZRA RIVERA', 'LUKE DELA CRUZ', 'LUNA CRUZ', 'DYLAN SANTOS',
  'NAOMI BAUTISTA', 'ZOE DELGADO', 'AMELIA CASTILLO', 'AIDEN REYES',
  'ZARA MORALES', 'NOAH GARCIA', 'MIA FLORES', 'LEO ALVAREZ',
  'IVY GONZALES', 'FINN RAMIREZ', 'NORA DIAZ', 'OLIVER MENDEZ',
  'RUBY VILLANUEVA', 'SAM AQUINO', 'TESS DELGADO', 'URIAH SORIANO',
  'VIOLET REYES', 'WYATT PINEDA',
]

const COLORS = ['Black', 'White', 'Silver', 'Red', 'Blue', 'Grey', 'Maroon']
const TRANSMISSIONS = ['Automatic', 'Manual']

const ROADWORTHY = {
  active: { id: 1, label: 'Active / Roadworthy' },
  minor: { id: 2, label: 'Minor Repairs Needed' },
  unfit: { id: 4, label: 'Unfit for Use' },
}

// Deterministic pseudo-random so the sample is stable between renders.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomPlate(rand) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const L = () => letters[Math.floor(rand() * letters.length)]
  const N = () => Math.floor(rand() * 10)
  return `${L()}${L()}${L()}${N()}${N()}${N()}${N()}`
}

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function toISO(d) {
  return d.toISOString()
}

export function sampleVehicles(company = 'PUREFOODS') {
  const rand = mulberry32(0xC0FFEE)
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const rows = []

  const buckets = [
    ...Array(71).fill('active'),
    ...Array(18).fill('minor'),
    ...Array(11).fill('unfit'),
  ]

  // Decide distribution of "next PMS" dates so stats match the screenshot.
  // 20 overdue, 3 due this month, rest scattered in future months.
  const pmsPlan = [
    ...Array(20).fill('overdue'),
    ...Array(3).fill('thisMonth'),
    ...Array(77).fill('future'),
  ]
  // shuffle both arrays deterministically
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
  shuffle(buckets)
  shuffle(pmsPlan)

  // 3 vehicles get a booked schedule next week.
  const bookedIdx = new Set()
  while (bookedIdx.size < 3) bookedIdx.add(Math.floor(rand() * 100))

  for (let i = 0; i < 100; i++) {
    const [brand, model] = MODELS[Math.floor(rand() * MODELS.length)]
    const driver = DRIVERS[i % DRIVERS.length]
    const plate = randomPlate(rand)
    const bucket = buckets[i]
    const pms = pmsPlan[i]

    let nextPms
    if (pms === 'overdue') {
      const daysBack = Math.floor(rand() * 180) + 10
      nextPms = toISO(new Date(now.getTime() - daysBack * 86400000))
    } else if (pms === 'thisMonth') {
      const day = Math.floor(rand() * 20) + 5
      nextPms = toISO(new Date(thisYear, thisMonth, day))
    } else {
      const monthsAhead = Math.floor(rand() * 10) + 1
      nextPms = toISO(addMonths(now, monthsAhead))
    }

    const recentService =
      rand() < 0.6
        ? toISO(new Date(now.getTime() - (Math.floor(rand() * 180) + 10) * 86400000))
        : null

    const bookedSchedule = bookedIdx.has(i)
      ? toISO(new Date(now.getTime() + (Math.floor(rand() * 14) + 1) * 86400000))
      : null

    rows.push({
      id: `sample-${i}`,
      plateNo: plate,
      brand,
      model,
      brandModel: `${brand} - ${model}`,
      yearModel: String(2000 + Math.floor(rand() * 25)),
      color: COLORS[Math.floor(rand() * COLORS.length)],
      transmission: TRANSMISSIONS[Math.floor(rand() * TRANSMISSIONS.length)],
      engineNo: `ENG${Math.floor(rand() * 9000000 + 1000000)}`,
      assignedTo: driver,
      company,
      companyId: null,
      branch: 'MGCAVITE',
      isFleet: true,
      latestOdo: Math.floor(rand() * 150000) + 10000,
      recentService,
      nextPms,
      nextPmsOdo: null,
      bookedSchedule,
      bookedBranch: bookedSchedule ? 'MGCAVITE' : null,
      roadworthyStatus: ROADWORTHY[bucket].id,
      _isSample: true,
      _raw: { bucket, pms },
    })
  }

  return rows
}
