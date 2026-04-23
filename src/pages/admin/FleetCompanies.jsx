import { useEffect, useState } from 'react'
import {
  createFleetCompany,
  setFleetCompanyActive,
  updateFleetCompany,
  watchFleetCompanies,
} from '../../lib/fleetCompanies'
import { MGFMS_CLIENTS } from '../../lib/dummyData'

const EMPTY = { name: '', code: '', contactEmail: '', contactPhone: '', isActive: true }

export default function FleetCompanies() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // editingId: null = form closed, 'new' = adding, otherwise = editing that doc id.
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [seeding, setSeeding] = useState(false)

  const seedFromMgFms = async () => {
    setSeeding(true)
    setSaveError(null)
    try {
      const existingNames = new Set(rows.map((r) => (r.name || '').trim()))
      for (const c of MGFMS_CLIENTS) {
        if (existingNames.has(c.name)) continue
        await createFleetCompany({
          name: c.name,
          code: c.code,
          contactEmail: '',
          contactPhone: '',
          isActive: true,
        })
      }
    } catch (err) {
      setSaveError(err.message || String(err))
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    const unsub = watchFleetCompanies(
      (list) => {
        setRows(list)
        setLoading(false)
        setLoadError(null)
      },
      (err) => {
        setLoadError(err)
        setLoading(false)
      },
    )
    return unsub
  }, [])

  const openAdd = () => {
    setForm(EMPTY)
    setEditingId('new')
    setSaveError(null)
  }

  const openEdit = (row) => {
    setForm({
      name: row.name || '',
      code: row.code || '',
      contactEmail: row.contactEmail || '',
      contactPhone: row.contactPhone || '',
      isActive: row.isActive !== false,
    })
    setEditingId(row.id)
    setSaveError(null)
  }

  const closeForm = () => {
    setEditingId(null)
    setForm(EMPTY)
    setSaveError(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      if (editingId === 'new') {
        await createFleetCompany(form)
      } else {
        await updateFleetCompany(editingId, form)
      }
      closeForm()
    } catch (err) {
      setSaveError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (row) => {
    try {
      await setFleetCompanyActive(row.id, !row.isActive)
    } catch (err) {
      alert('Failed to update status: ' + (err.message || err))
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Fleet Companies</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage the companies whose fleets are serviced through the portal.
          </p>
        </div>
        {editingId === null && (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <button
              onClick={seedFromMgFms}
              disabled={seeding}
              title="Creates the 3 real fleet clients that mg-fms uses (Purefoods, National Museum, ChinaBank), so Fleet Manager users can be matched to their vehicles."
              className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium border border-gray-300"
            >
              {seeding ? 'Seeding…' : 'Seed from mg-fms'}
            </button>
            <button
              onClick={openAdd}
              className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Add Company
            </button>
          </div>
        )}
      </div>

      {editingId !== null && (
        <form onSubmit={submit} className="bg-white rounded-lg shadow-sm border p-5 mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            {editingId === 'new' ? 'Add new fleet company' : 'Edit fleet company'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company name *">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Purefoods Corporation"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </Field>
            <Field label="Company code *" hint="Short uppercase ID used internally.">
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. PUREFOODS"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono uppercase focus:border-brand focus:outline-none"
              />
            </Field>
            <Field label="Contact email">
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="contact@company.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </Field>
            <Field label="Contact phone">
              <input
                type="text"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="+63 ..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 mt-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>

          {saveError && (
            <div className="mt-3 text-sm text-red-600">Save failed: {saveError}</div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <EmptyRow>Loading…</EmptyRow>
            )}
            {!loading && loadError && (
              <EmptyRow className="text-red-500">
                Failed to load: {loadError.message || String(loadError)}
              </EmptyRow>
            )}
            {!loading && !loadError && rows.length === 0 && (
              <EmptyRow>
                No fleet companies yet. Click "+ Add Company" to create the first one.
              </EmptyRow>
            )}
            {rows.map((row) => (
              <tr key={row.id} className={row.isActive === false ? 'opacity-60' : ''}>
                <td className="px-4 py-3 text-gray-800 font-medium">{row.name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.code || '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  <div>{row.contactEmail || '—'}</div>
                  {row.contactPhone && (
                    <div className="text-xs text-gray-400">{row.contactPhone}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.isActive === false ? (
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
                      Inactive
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(row)}
                    className="text-brand hover:underline text-xs font-medium mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(row)}
                    className="text-gray-500 hover:text-gray-800 text-xs font-medium"
                  >
                    {row.isActive === false ? 'Reactivate' : 'Deactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
    </div>
  )
}

function EmptyRow({ children, className = 'text-gray-400' }) {
  return (
    <tr>
      <td colSpan={5} className={`px-4 py-8 text-center ${className}`}>
        {children}
      </td>
    </tr>
  )
}
