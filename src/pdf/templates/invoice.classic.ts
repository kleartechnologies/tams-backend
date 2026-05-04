import { InvoiceData } from '../invoice.template';

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtMYR(n: number): string {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n);
}

function humanizeMethod(m: string): string {
  const map: Record<string, string> = {
    CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer',
    ONLINE_BANKING: 'Online Banking', CREDIT_CARD: 'Credit / Debit Card', CHEQUE: 'Cheque',
  };
  return map[m] ?? m.replace(/_/g, ' ');
}

function humanizeType(t: string): string {
  return t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: #ddd; padding: 24px; }
  .page { width: 794px; min-height: 1123px; background: #fff; margin: 0 auto; padding: 44px 52px 52px; display: flex; flex-direction: column; border: 1px solid #aaa; }
  .hdr { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #000; margin-bottom: 20px; }
  .hdr-l .a-name  { font-size: 16px; font-weight: bold; }
  .hdr-l .a-sub   { font-size: 9.5px; color: #555; margin-top: 3px; }
  .hdr-l .a-row   { font-size: 10px; color: #333; margin-top: 3px; }
  .hdr-r          { text-align: right; }
  .hdr-r .d-title { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; }
  .hdr-r .inv-num { font-size: 18px; font-weight: bold; margin-top: 4px; }
  .hdr-r .d-row   { font-size: 10px; margin-top: 4px; }
  .hdr-r .d-lbl   { color: #666; }
  .sec { margin-bottom: 18px; }
  .sec-head { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: .12em; background: #111; color: #fff; padding: 5px 10px; margin-bottom: 10px; }
  .grid { display: grid; gap: 10px 24px; }
  .g2 { grid-template-columns: 1fr 1fr; }
  .g3 { grid-template-columns: 1fr 1fr 1fr; }
  .fl { font-size: 8.5px; text-transform: uppercase; font-weight: bold; color: #666; margin-bottom: 2px; }
  .fv { font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th { background: #222; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; font-weight: bold; text-align: left; padding: 6px 8px; }
  th.r { text-align: right; }
  td { border: 1px solid #ccc; padding: 7px 8px; vertical-align: top; }
  td.r { text-align: right; font-variant-numeric: tabular-nums; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .pay-grid { display: grid; grid-template-columns: 1fr 260px; gap: 24px; align-items: start; }
  .ps-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e0e0e0; }
  .ps-row.strong { font-weight: bold; border-bottom: 2px solid #000; }
  .ps-row.total  { font-size: 13px; font-weight: bold; border-bottom: 3px double #000; padding: 8px 0; }
  .ps-row.paid   { color: #0a5c1e; }
  .ps-bal  { background: #000; color: #fff; padding: 9px 12px; margin-top: 8px; display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; }
  .ps-full { background: #0a5c1e; color: #fff; padding: 9px 12px; margin-top: 8px; display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; }
  .bank-box { border: 1px solid #ccc; padding: 10px 12px; font-size: 10px; line-height: 1.6; background: #fafafa; }
  .tc-box { font-size: 9px; line-height: 1.6; color: #444; }
  .spacer { flex: 1 1 auto; }
  .footer { border-top: 1.5px solid #000; padding-top: 10px; margin-top: 18px; display: flex; justify-content: space-between; font-size: 9px; color: #555; }
  .no-print { position: fixed; top: 16px; right: 16px; z-index: 999; }
  .print-btn { background: #000; color: #fff; border: none; padding: 9px 20px; cursor: pointer; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
  @page { size: A4 portrait; margin: 0; }
  @media print {
    body { padding: 0; background: white; }
    .page { border: none; min-height: 297mm; width: 210mm; }
    .no-print { display: none !important; }
  }
`;

// ── Main export ───────────────────────────────────────────────────────────────

export function buildInvoiceClassicHTML(data: InvoiceData): string {
  const adults   = data.travelers.filter((t) => t.travelerType === 'ADULT');
  const children = data.travelers.filter((t) => t.travelerType === 'CHILD');
  const adultTotal  = adults.length * data.pkg.adultPrice;
  const childTotal  = children.length * data.pkg.childPrice;
  const subtotal    = adultTotal + childTotal;
  const sstAmt      = data.pkg.isSSTApplicable ? Math.round(subtotal * data.pkg.sstRate) / 100 : 0;
  const total       = subtotal + sstAmt;
  const verifiedPmts = data.payments.filter((p) => p.status === 'VERIFIED');
  const paidAmt     = verifiedPmts.reduce((s, p) => s + Number(p.amount), 0);
  const balance     = Math.max(0, total - paidAmt);

  const STATUS_LABELS: Record<string, string> = {
    CONFIRMED: 'Confirmed', INQUIRY: 'Inquiry', QUOTED: 'Quoted', CANCELLED: 'Cancelled', COMPLETED: 'Completed',
  };

  const paymentHistory = data.payments.map((p) => `
    <tr>
      <td>${fmtDate(p.paymentDate)}</td>
      <td>${humanizeType(p.paymentType)}</td>
      <td>${humanizeMethod(p.paymentMethod)}</td>
      <td class="r">${fmtMYR(Number(p.amount))}</td>
      <td>${p.status}</td>
      <td>${esc(p.referenceNumber ?? '—')}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(data.invoiceNumber)} &middot; ${esc(data.agency.name)}</title>
<style>${CSS}</style>
</head>
<body>

<div class="no-print">
  <button class="print-btn" onclick="window.print()">Save as PDF</button>
</div>

<div class="page">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-l">
      ${data.agency.logoUrl
        ? `<img src="${esc(data.agency.logoUrl)}" alt="${esc(data.agency.name)} logo" style="width:52px;height:52px;object-fit:contain;display:block;margin-bottom:8px;" />`
        : ''}
      <div class="a-name">${esc(data.agency.name)}</div>
      ${data.agency.tag     ? `<div class="a-sub">${esc(data.agency.tag)}</div>` : ''}
      ${data.agency.phone   ? `<div class="a-row">Tel: ${esc(data.agency.phone)}</div>` : ''}
      ${data.agency.email   ? `<div class="a-row">${esc(data.agency.email)}</div>` : ''}
      ${data.agency.address ? `<div class="a-row">${esc(data.agency.address)}</div>` : ''}
      ${data.agency.motacLicenseNumber ? `<div class="a-row" style="margin-top:6px;font-size:9px;color:#666;">MOTAC License: ${esc(data.agency.motacLicenseNumber)}</div>` : ''}
    </div>
    <div class="hdr-r">
      <div class="d-title">Tax Invoice</div>
      <div class="inv-num">${esc(data.invoiceNumber)}</div>
      <div class="d-row"><span class="d-lbl">Invoice Date: </span>${fmtDate(data.invoiceDate)}</div>
      <div class="d-row"><span class="d-lbl">Booking No.: </span>${esc(data.bookingNumber)}</div>
      ${data.departureDate ? `<div class="d-row"><span class="d-lbl">Departure: </span>${fmtDate(data.departureDate)}</div>` : ''}
      <div class="d-row"><span class="d-lbl">Status: </span><strong>${STATUS_LABELS[data.status] ?? data.status}</strong></div>
    </div>
  </div>

  <!-- Bill To -->
  <div class="sec">
    <div class="sec-head">Bill To</div>
    <div class="grid g3">
      <div><div class="fl">Name</div><div class="fv">${esc(data.customer.fullName)}</div></div>
      <div><div class="fl">Phone</div><div class="fv">${esc(data.customer.phone)}</div></div>
      ${data.customer.email ? `<div><div class="fl">Email</div><div class="fv">${esc(data.customer.email)}</div></div>` : '<div></div>'}
      ${data.customer.icNumber ? `<div><div class="fl">IC Number</div><div class="fv">${esc(data.customer.icNumber)}</div></div>` : ''}
      ${data.customer.passportNumber ? `<div><div class="fl">Passport</div><div class="fv">${esc(data.customer.passportNumber)}</div></div>` : ''}
      ${data.customer.nationality ? `<div><div class="fl">Nationality</div><div class="fv">${esc(data.customer.nationality)}</div></div>` : ''}
    </div>
  </div>

  <!-- Items -->
  <div class="sec">
    <div class="sec-head">Invoice Items</div>
    <table>
      <thead>
        <tr>
          <th style="width:50%">Description</th>
          <th>Type</th>
          <th class="r">Unit Price</th>
          <th class="r">Qty</th>
          <th class="r">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${adults.length > 0 ? `
        <tr>
          <td>${esc(data.pkg.name)} &mdash; ${esc(data.pkg.destination)}</td>
          <td>Adult Pax</td>
          <td class="r">${fmtMYR(data.pkg.adultPrice)}</td>
          <td class="r">${adults.length}</td>
          <td class="r">${fmtMYR(adultTotal)}</td>
        </tr>` : ''}
        ${children.length > 0 ? `
        <tr>
          <td>${esc(data.pkg.name)} &mdash; ${esc(data.pkg.destination)}</td>
          <td>Child Pax</td>
          <td class="r">${fmtMYR(data.pkg.childPrice)}</td>
          <td class="r">${children.length}</td>
          <td class="r">${fmtMYR(childTotal)}</td>
        </tr>` : ''}
        ${data.pkg.isSSTApplicable && sstAmt > 0 ? `
        <tr>
          <td>Service Tax</td>
          <td>${data.pkg.sstRate}%</td>
          <td class="r"></td>
          <td class="r"></td>
          <td class="r">${fmtMYR(sstAmt)}</td>
        </tr>` : ''}
      </tbody>
    </table>
  </div>

  <!-- Travelers -->
  <div class="sec">
    <div class="sec-head">Traveler List (${data.travelers.length} Pax)</div>
    <table>
      <thead><tr><th>#</th><th>Full Name</th><th>Type</th><th>IC / Passport</th></tr></thead>
      <tbody>
        ${data.travelers.map((t, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(t.fullName)}</td>
          <td>${t.travelerType === 'CHILD' ? 'Child' : 'Adult'}</td>
          <td>${esc((t as any).icNumber ?? (t as any).passportNumber ?? '—')}</td>
        </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#888;padding:12px;">No travelers recorded.</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- Payment -->
  <div class="sec">
    <div class="sec-head">Payment Summary</div>
    <div class="pay-grid">
      <div>
        ${data.agency.bankName ? `
        <div class="bank-box">
          <strong>Payment Instructions</strong><br>
          ${data.agency.bankName ? `Bank: ${esc(data.agency.bankName)}<br>` : ''}
          ${data.agency.bankAccountNumber ? `Account: ${esc(data.agency.bankAccountNumber)}<br>` : ''}
          ${data.agency.bankAccountHolder ? `Holder: ${esc(data.agency.bankAccountHolder)}<br>` : ''}
          ${data.agency.bankNotes ? `<br>${esc(data.agency.bankNotes)}` : ''}
        </div>` : ''}
        ${data.payments.length > 0 ? `
        <div style="margin-top:12px;">
          <div style="font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;color:#444;">Payment History</div>
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Method</th><th class="r">Amount</th><th>Status</th><th>Ref</th></tr></thead>
            <tbody>${paymentHistory}</tbody>
          </table>
        </div>` : ''}
      </div>
      <div>
        ${adults.length > 0 ? `<div class="ps-row"><span>${adults.length} Adult${adults.length !== 1 ? 's' : ''} × ${fmtMYR(data.pkg.adultPrice)}</span><span>${fmtMYR(adultTotal)}</span></div>` : ''}
        ${children.length > 0 ? `<div class="ps-row"><span>${children.length} Child${children.length !== 1 ? 'ren' : ''} × ${fmtMYR(data.pkg.childPrice)}</span><span>${fmtMYR(childTotal)}</span></div>` : ''}
        <div class="ps-row strong"><span>Subtotal</span><span>${fmtMYR(subtotal)}</span></div>
        ${data.pkg.isSSTApplicable && sstAmt > 0 ? `<div class="ps-row"><span>SST (${data.pkg.sstRate}%)</span><span>${fmtMYR(sstAmt)}</span></div>` : ''}
        <div class="ps-row total"><span>TOTAL</span><span>${fmtMYR(total)}</span></div>
        ${verifiedPmts.map((p) => `<div class="ps-row paid"><span>Paid &mdash; ${fmtDate(p.paymentDate)}</span><span>&minus;${fmtMYR(Number(p.amount))}</span></div>`).join('')}
        ${balance <= 0
          ? `<div class="ps-full"><span>PAYMENT STATUS</span><span>FULLY PAID ✓</span></div>`
          : `<div class="ps-bal"><span>BALANCE DUE</span><span>${fmtMYR(balance)}</span></div>`}
      </div>
    </div>
  </div>

  <div class="spacer"></div>

  <!-- T&C -->
  ${(data.agency.termsAndConditions || data.agency.refundPolicy) ? `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px;">
    ${data.agency.termsAndConditions ? `<div class="tc-box"><strong style="font-size:9px;text-transform:uppercase;letter-spacing:.08em;">Terms &amp; Conditions</strong><br>${esc(data.agency.termsAndConditions)}</div>` : '<div></div>'}
    ${data.agency.refundPolicy ? `<div class="tc-box"><strong style="font-size:9px;text-transform:uppercase;letter-spacing:.08em;">Refund Policy</strong><br>${esc(data.agency.refundPolicy)}</div>` : ''}
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div>
      This is a computer-generated invoice issued by <strong>${esc(data.agency.name)}</strong>.
      ${data.agency.motacLicenseNumber ? `MOTAC License: ${esc(data.agency.motacLicenseNumber)}${data.agency.motacExpiryDate ? ` (Exp: ${fmtDate(data.agency.motacExpiryDate)})` : ''}.` : ''}
    </div>
    <div style="text-align:right;flex-shrink:0;margin-left:24px;">
      ${esc(data.invoiceNumber)} &middot; ${fmtDate(new Date())}
    </div>
  </div>

</div>
</body>
</html>`;
}
