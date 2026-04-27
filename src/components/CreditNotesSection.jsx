// Shared credit-notes block used by both BranchInvoiceDetails and
// ClientInvoiceDetails. Lists issued/voided credit notes against this
// invoice, and exposes the "Issue Credit Note" CTA when applicable.
//
// "Applicable" means: source invoice is not VOID AND has either payments
// already recorded OR has been marked PAID by accumulated credits. A fresh
// OPEN invoice with no payments should be voided directly, not credited.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney, formatDate } from '../lib/dummyData'
import {
  CREDIT_NOTE_KIND, CREDIT_NOTE_STATUS,
  issueCreditNote, voidCreditNote, watchCreditNotesForInvoice,
} from '../lib/creditNotes'

export default function CreditNotesSection({
  invoice,
  kind,                 // CREDIT_NOTE_KIND.BRANCH | CLIENT
  profile,
  customerView = false, // hide actions when true
}) {
  const [creditNotes, setCreditNotes] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState(null)

  useEffect(() => {
    if (!invoice?.id) return
    const unsub = watchCreditNotesForInvoice(invoice.id, ({ rows }) => {
      setCreditNotes(rows); setLoaded(true)
    })
    return unsub
  }, [invoice?.id])

  // Hide entirely if there are no CNs and the invoice isn't a candidate to
  // get one (fresh OPEN with zero payments → just void it).
  const hasPayments = (Number(invoice?.paymentsTotal) || 0) > 0
  const isPaid = invoice?.status === 'PAID'
  const isVoid = invoice?.status === 'VOID'
  const canIssue = !isVoid && (hasPayments || isPaid)
  const canAct = !customerView && (profile?.is_admin || profile?.role === 'finance')

  if (loaded && creditNotes.length === 0 && !canIssue) return null

  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest font-bold text-gray-500">
          Credit Notes
        </span>
        {canIssue && canAct && creditNotes.length > 0 && (
          <button
            type="button"
            onClick={() => setIssueOpen(true)}
            className="text-[11px] font-bold text-brand hover:text-brand-dark"
          >
            + Issue another
          </button>
        )}
      </div>

      {!loaded ? (
        <div className="p-4 text-sm text-gray-400">Loading…</div>
      ) : creditNotes.length === 0 ? (
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-500">
            No credit notes against this invoice yet. Use one to refund or
            reduce the receivable on an invoice that already has payments.
          </p>
          {canIssue && canAct && (
            <button
              type="button"
              onClick={() => setIssueOpen(true)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-4 py-3 rounded-xl active:scale-95 transition-transform"
            >
              Issue Credit Note
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y">
          {creditNotes.map((cn) => (
            <li key={cn.id} className={`p-4 flex items-start justify-between gap-3 ${cn.status === CREDIT_NOTE_STATUS.VOID ? 'opacity-60' : ''}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/credit-notes/${cn.code}`} className="text-brand font-mono font-black text-sm hover:underline">
                    {cn.code}
                  </Link>
                  {cn.status === CREDIT_NOTE_STATUS.VOID && (
                    <span className="text-[9px] uppercase tracking-widest bg-slate-500 text-white font-bold px-1.5 py-0.5 rounded">
                      Voided
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-700 mt-0.5 italic">"{cn.reason}"</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {cn.issuedAtIso ? formatDate(cn.issuedAtIso) : '—'}
                  {cn.issuedByName && ` · ${cn.issuedByName}`}
                </div>
                {cn.status === CREDIT_NOTE_STATUS.VOID && cn.voidReason && (
                  <div className="text-[10px] text-red-700 mt-1 italic">Voided: "{cn.voidReason}"</div>
                )}
              </div>
              <div className="flex items-end flex-col gap-1.5">
                <div className={`text-base font-black ${cn.status === CREDIT_NOTE_STATUS.VOID ? 'text-gray-400 line-through' : 'text-amber-700'}`}>
                  −{formatMoney(cn.amount)}
                </div>
                {canAct && cn.status === CREDIT_NOTE_STATUS.ISSUED && (
                  <button
                    type="button"
                    onClick={() => setVoidTarget(cn)}
                    className="text-[11px] text-red-600 hover:text-red-800 font-bold"
                  >
                    Void
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {issueOpen && (
        <IssueModal
          invoice={invoice}
          kind={kind}
          profile={profile}
          existingCNs={creditNotes}
          onClose={() => setIssueOpen(false)}
          onIssued={() => setIssueOpen(false)}
        />
      )}
      {voidTarget && (
        <VoidModal
          creditNote={voidTarget}
          profile={profile}
          onClose={() => setVoidTarget(null)}
          onVoided={() => setVoidTarget(null)}
        />
      )}
    </div>
  )
}

function IssueModal({ invoice, kind, profile, existingCNs, onClose, onIssued }) {
  const total = Number(invoice?.total) || 0
  const paymentsT = Number(invoice?.paymentsTotal) || 0
  const prevCNTotal = existingCNs
    .filter((c) => c.status === CREDIT_NOTE_STATUS.ISSUED)
    .reduce((s, c) => s + (Number(c.amount) || 0), 0)
  const remaining = Math.max(0, total - paymentsT - prevCNTotal)

  const [amount, setAmount] = useState(String(remaining.toFixed(2)))
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (saving) return
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a positive amount.'); return }
    if (amt > remaining + 0.01) { setError(`Exceeds remaining balance (${formatMoney(remaining)}).`); return }
    if (!reason.trim()) { setError('A reason is required.'); return }
    setSaving(true); setError(null)
    try {
      await issueCreditNote({
        kind,
        sourceInvoiceId: invoice.id,
        amount: amt,
        reason,
        note,
        byProfile: profile,
      })
      onIssued?.()
    } catch (err) {
      console.error('[creditNote] issue failed:', err)
      setError(err.message || String(err))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:w-[520px] sm:max-w-full rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-bold text-gray-900">Issue credit note</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none w-8 h-8 flex items-center justify-center" aria-label="Close">×</button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg px-3 py-2">
            Crediting <span className="font-mono font-bold">{invoice.code}</span>.
            Remaining capacity: <strong>{formatMoney(remaining)}</strong>
            {paymentsT > 0 && ` · ${formatMoney(paymentsT)} already paid`}
            {prevCNTotal > 0 && ` · ${formatMoney(prevCNTotal)} previously credited`}.
            Reduces what the {kind === CREDIT_NOTE_KIND.BRANCH ? 'branch is owed' : 'client owes'} on this invoice.
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              disabled={saving}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Reason *</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input"
              placeholder="e.g. Customer goodwill — repeat warranty claim, billing error correction, return of defective parts"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Note</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input"
              placeholder="Optional internal note"
              disabled={saving}
            />
          </div>

          {error && <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">Failed: {error}</div>}
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 px-3 py-2">Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !amount || !reason.trim()}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-full shadow"
          >
            {saving ? 'Issuing…' : 'Issue credit note'}
          </button>
        </div>
      </div>
    </div>
  )
}

function VoidModal({ creditNote, profile, onClose, onVoided }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (saving) return
    if (!reason.trim()) { setError('A reason is required.'); return }
    setSaving(true); setError(null)
    try {
      await voidCreditNote(creditNote.id, { reason, byProfile: profile })
      onVoided?.()
    } catch (err) {
      console.error('[creditNote] void failed:', err)
      setError(err.message || String(err))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:w-[480px] sm:max-w-full rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-bold text-gray-900">Void credit note</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none w-8 h-8 flex items-center justify-center" aria-label="Close">×</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg px-3 py-2">
            Voiding <span className="font-mono font-bold">{creditNote.code}</span> ({formatMoney(creditNote.amount)}) —
            this restores the receivable on the source invoice. If the source had been marked PAID purely due to this
            CN, it'll revert to OPEN.
          </div>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for voiding (required)."
            className="input"
            autoFocus
            disabled={saving}
          />
          {error && <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">Failed: {error}</div>}
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 px-3 py-2">Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !reason.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-full shadow"
          >
            {saving ? 'Voiding…' : 'Confirm void'}
          </button>
        </div>
      </div>
    </div>
  )
}
