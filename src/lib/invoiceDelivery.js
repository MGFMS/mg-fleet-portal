// Invoice delivery — email + PDF generation.
//
// Round 27 (current): scaffolding only. The buttons exist on the
// invoice detail pages but the underlying transport isn't wired.
//
// Plan for next session:
//   - PDF generation client-side via the existing PrintInvoice
//     component + html2pdf or @react-pdf/renderer. Browser print
//     already produces a usable PDF via "Save as PDF" — a one-click
//     "Download PDF" should automate that.
//   - Email delivery via either:
//     (a) Firebase Functions + a transactional email provider
//         (Postmark / SendGrid / Resend). Recommended — keeps
//         credentials server-side.
//     (b) The "Trigger Email" Firestore extension by Firebase, which
//         watches a `mail` collection and sends. Easiest to set up;
//         you write a doc with { to, message: { subject, html } }
//         and the extension delivers. No custom backend.
//
// For PDF: the print stylesheet already exists in PrintInvoice.jsx.
// We can either send the rendered HTML to a server-side PDF render,
// or use a client-side library like html2pdf to produce the file
// without leaving the browser.
//
// Invitations welcome — let the user pick the provider before wiring.

export const DELIVERY_STATUS = Object.freeze({
  NOT_READY: 'NOT_READY',
})

// Email the client invoice as PDF. Currently a stub — surfaces a
// "coming next session" message in the UI. Returns a promise so the
// call site can await it cleanly when the real transport lands.
export async function emailInvoiceToClient(/* invoice, { recipientEmail, subject, message, byProfile } */) {
  return {
    status: DELIVERY_STATUS.NOT_READY,
    message: 'Email delivery is not wired yet. Use the browser Print → Save as PDF for now, then attach to your own email.',
  }
}

// One-click PDF download. Currently triggers the browser print
// dialog — the user picks "Save as PDF" from the destination
// dropdown, which produces a file using the existing PrintInvoice
// stylesheet. A future round will swap to a real PDF library so
// the user gets a file directly instead of a print dialog.
export async function downloadInvoicePdf(/* invoice */) {
  if (typeof window !== 'undefined') {
    window.print()
  }
  return {
    status: DELIVERY_STATUS.NOT_READY,
    message: 'Browser print dialog opened. Pick "Save as PDF" as the destination. One-click PDF lands next session.',
  }
}
