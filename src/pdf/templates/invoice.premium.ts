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

function lighten(hex: string, amount = 0.90): string {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
  } catch { return '#F0F4F3'; }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildInvoicePremiumHTML(data: InvoiceData): string {
  const accent = data.agency.primaryColor ?? '#1F4E4A';
  const soft   = lighten(accent, 0.90);
  const soft2  = lighten(accent, 0.95);

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

  const payStatus = balance <= 0
    ? { label: 'FULLY PAID', bg: '#D1FAE5', color: '#065F46' }
    : paidAmt > 0
      ? { label: 'PARTIALLY PAID', bg: '#FEF3C7', color: '#92400E' }
      : { label: 'UNPAID', bg: '#FEE2E2', color: '#991B1B' };

  const STATUS_CHIP: Record<string, { label: string; bg: string; color: string }> = {
    CONFIRMED: { label: '✓ Confirmed', bg: '#D1FAE5', color: '#065F46' },
    COMPLETED: { label: '✓ Completed', bg: '#D1FAE5', color: '#065F46' },
    INQUIRY:   { label: '◎ Inquiry',   bg: '#FEF3C7', color: '#92400E' },
    QUOTED:    { label: '◎ Quoted',    bg: '#DBEAFE', color: '#1E40AF' },
    CANCELLED: { label: '✕ Cancelled', bg: '#FEE2E2', color: '#991B1B' },
  };
  const statusChip = STATUS_CHIP[data.status] ?? { label: data.status, bg: '#F3F4F6', color: '#374151' };

  const travelerRows = data.travelers.map((t, i) => `
    <tr style="border-bottom:1px solid #F3F4F6;">
      <td style="padding:8px 12px;font-size:10px;color:#6B7280;">${i + 1}</td>
      <td style="padding:8px 12px;font-size:11px;font-weight:500;">${esc(t.fullName)}</td>
      <td style="padding:8px 12px;">
        <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px;background:${t.travelerType === 'CHILD' ? '#EDE9FE' : soft};color:${t.travelerType === 'CHILD' ? '#6D28D9' : accent};">
          ${t.travelerType === 'CHILD' ? 'Child' : 'Adult'}
        </span>
      </td>
      <td style="padding:8px 12px;font-size:10.5px;color:#374151;font-family:monospace;">${esc((t as any).icNumber ?? (t as any).passportNumber ?? '—')}</td>
      <td style="padding:8px 12px;font-size:11px;font-weight:600;text-align:right;color:${accent};">${fmtMYR(t.travelerType === 'CHILD' ? data.pkg.childPrice : data.pkg.adultPrice)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(data.invoiceNumber)} &middot; ${esc(data.agency.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #E5E7EB; padding: 32px 16px 64px; -webkit-font-smoothing: antialiased; }
  .page { width: 794px; min-height: 1123px; background: #fff; margin: 0 auto; display: flex; flex-direction: column; box-shadow: 0 1px 0 rgba(0,0,0,.04), 0 20px 60px -15px rgba(0,0,0,.22); }
  .kl { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: #9CA3AF; margin-bottom: 3px; }
  .kv { font-size: 12px; font-weight: 500; color: #111; }
  .section { padding: 22px 44px; border-top: 1px solid #F3F4F6; }
  .sec-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #9CA3AF; margin-bottom: 14px; }
  .no-print { position: fixed; top: 16px; right: 16px; z-index: 999; }
  .print-btn { background: #111; color: #fff; border: none; padding: 10px 20px; cursor: pointer; font-size: 11px; border-radius: 6px; font-family: inherit; }
  @page { size: A4 portrait; margin: 0; }
  @media print {
    body { padding: 0; background: white; }
    .page { box-shadow: none; min-height: 297mm; width: 210mm; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<div class="no-print">
  <button class="print-btn" onclick="window.print()">&#8595; Save as PDF</button>
</div>

<div class="page">

  <!-- ── Branded Header ────────────────────────────────────────────────────── -->
  <div style="background:${accent};color:#fff;padding:32px 44px 28px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div style="display:flex;align-items:center;gap:16px;">
        ${data.agency.logoUrl
          ? `<img src="${esc(data.agency.logoUrl)}" alt="" style="width:52px;height:52px;border-radius:10px;object-fit:contain;background:rgba(255,255,255,.15);padding:4px;" />`
          : `<div style="width:52px;height:52px;border-radius:10px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">${esc(data.agency.name.charAt(0).toUpperCase())}</div>`}
        <div>
          <div style="font-size:18px;font-weight:800;">${esc(data.agency.name)}</div>
          ${data.agency.tag ? `<div style="font-size:10px;opacity:.7;margin-top:3px;">${esc(data.agency.tag)}</div>` : ''}
          ${data.agency.motacLicenseNumber ? `<div style="font-size:9.5px;opacity:.65;margin-top:2px;">MOTAC: ${esc(data.agency.motacLicenseNumber)}</div>` : ''}
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-bottom:6px;">Tax Invoice</div>
        <div style="font-size:22px;font-weight:800;">${esc(data.invoiceNumber)}</div>
        <div style="font-size:10px;opacity:.7;margin-top:4px;">${fmtDate(data.invoiceDate)}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-wrap:wrap;">
          <span style="background:${statusChip.bg};color:${statusChip.color};font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;">${statusChip.label}</span>
          <span style="background:${payStatus.bg};color:${payStatus.color};font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;">${payStatus.label}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Agency contact strip -->
  ${(data.agency.phone || data.agency.email || data.agency.address) ? `
  <div style="background:${soft};padding:10px 44px;display:flex;gap:24px;font-size:10px;color:#4B5563;border-bottom:1px solid #E5E7EB;">
    ${data.agency.phone   ? `<span>📞 ${esc(data.agency.phone)}</span>` : ''}
    ${data.agency.email   ? `<span>✉️ ${esc(data.agency.email)}</span>` : ''}
    ${data.agency.address ? `<span>📍 ${esc(data.agency.address)}</span>` : ''}
  </div>` : ''}

  <!-- Bill To + Invoice Meta -->
  <div class="section">
    <div style="display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start;">
      <div>
        <div class="sec-label">Bill To</div>
        <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:6px;">${esc(data.customer.fullName)}</div>
        <div style="font-size:11px;color:#6B7280;line-height:1.7;">
          ${data.customer.phone ? `${esc(data.customer.phone)}<br>` : ''}
          ${data.customer.email ? `${esc(data.customer.email)}<br>` : ''}
          ${data.customer.icNumber ? `IC: ${esc(data.customer.icNumber)}<br>` : ''}
          ${data.customer.passportNumber ? `Passport: ${esc(data.customer.passportNumber)}<br>` : ''}
          ${data.customer.nationality ? esc(data.customer.nationality) : ''}
        </div>
      </div>
      <div style="text-align:right;min-width:180px;">
        <div class="kl" style="margin-bottom:8px;">Invoice Details</div>
        <div style="font-size:10.5px;color:#374151;line-height:1.8;">
          <div><span style="color:#9CA3AF;">Booking No.: </span>${esc(data.bookingNumber)}</div>
          <div><span style="color:#9CA3AF;">Invoice Date: </span>${fmtDate(data.invoiceDate)}</div>
          ${data.departureDate ? `<div><span style="color:#9CA3AF;">Departure: </span>${fmtDate(data.departureDate)}</div>` : ''}
          <div><span style="color:#9CA3AF;">Package: </span>${esc(data.pkg.name)}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Line Items -->
  <div class="section">
    <div class="sec-label">Items</div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:${soft};border-radius:8px;">
          <th style="padding:10px 14px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};border-radius:8px 0 0 8px;">Description</th>
          <th style="padding:10px 14px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};">Qty</th>
          <th style="padding:10px 14px;text-align:right;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};">Unit Price</th>
          <th style="padding:10px 14px;text-align:right;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};border-radius:0 8px 8px 0;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${adults.length > 0 ? `
        <tr style="border-bottom:1px solid #F3F4F6;">
          <td style="padding:12px 14px;"><span style="font-weight:600;">${esc(data.pkg.name)}</span><br><span style="font-size:10px;color:#6B7280;">${esc(data.pkg.destination)} &middot; Adult Package</span></td>
          <td style="padding:12px 14px;text-align:center;color:#374151;">${adults.length}</td>
          <td style="padding:12px 14px;text-align:right;color:#374151;">${fmtMYR(data.pkg.adultPrice)}</td>
          <td style="padding:12px 14px;text-align:right;font-weight:700;">${fmtMYR(adultTotal)}</td>
        </tr>` : ''}
        ${children.length > 0 ? `
        <tr style="border-bottom:1px solid #F3F4F6;">
          <td style="padding:12px 14px;"><span style="font-weight:600;">${esc(data.pkg.name)}</span><br><span style="font-size:10px;color:#6B7280;">${esc(data.pkg.destination)} &middot; Child Package</span></td>
          <td style="padding:12px 14px;text-align:center;color:#374151;">${children.length}</td>
          <td style="padding:12px 14px;text-align:right;color:#374151;">${fmtMYR(data.pkg.childPrice)}</td>
          <td style="padding:12px 14px;text-align:right;font-weight:700;">${fmtMYR(childTotal)}</td>
        </tr>` : ''}
        ${data.pkg.isSSTApplicable && sstAmt > 0 ? `
        <tr style="border-bottom:1px solid #F3F4F6;">
          <td style="padding:12px 14px;color:#D97706;">Service Tax (SST ${data.pkg.sstRate}%)</td>
          <td></td><td></td>
          <td style="padding:12px 14px;text-align:right;font-weight:700;color:#D97706;">${fmtMYR(sstAmt)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display:flex;justify-content:flex-end;margin-top:16px;">
      <div style="width:280px;font-size:11px;">
        ${adults.length > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F3F4F6;"><span style="color:#6B7280;">${adults.length} × Adult</span><span>${fmtMYR(adultTotal)}</span></div>` : ''}
        ${children.length > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F3F4F6;"><span style="color:#6B7280;">${children.length} × Child</span><span>${fmtMYR(childTotal)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:2px solid #111;font-weight:600;"><span>Subtotal</span><span>${fmtMYR(subtotal)}</span></div>
        ${data.pkg.isSSTApplicable && sstAmt > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F3F4F6;color:#D97706;"><span>SST (${data.pkg.sstRate}%)</span><span>${fmtMYR(sstAmt)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:3px double #111;font-size:15px;font-weight:800;"><span>Total</span><span style="color:${accent};">${fmtMYR(total)}</span></div>
        ${verifiedPmts.map((p) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F3F4F6;color:#059669;"><span>Paid &mdash; ${fmtDate(p.paymentDate)}</span><span>&minus;${fmtMYR(Number(p.amount))}</span></div>`).join('')}
        ${balance <= 0
          ? `<div style="background:${accent};color:#fff;border-radius:10px;padding:12px 16px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Fully Paid ✓</span><span style="font-size:16px;font-weight:800;">${fmtMYR(paidAmt)}</span></div>`
          : `<div style="background:#111;color:#fff;border-radius:10px;padding:12px 16px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Balance Due</span><span style="font-size:16px;font-weight:800;">${fmtMYR(balance)}</span></div>`}
      </div>
    </div>
  </div>

  <!-- Travelers -->
  <div class="section">
    <div class="sec-label">Traveler List &mdash; ${data.travelers.length} Pax</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:${soft};">
          <th style="padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};">#</th>
          <th style="padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};">Name</th>
          <th style="padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};">Type</th>
          <th style="padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};">IC / Passport</th>
          <th style="padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${travelerRows}</tbody>
    </table>
  </div>

  <!-- Payment History -->
  ${data.payments.length > 0 ? `
  <div class="section">
    <div class="sec-label">Payment History</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${data.payments.map((p) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:${p.status === 'VERIFIED' ? '#F0FDF4' : '#F9FAFB'};border-radius:10px;border:1px solid ${p.status === 'VERIFIED' ? '#BBF7D0' : '#E5E7EB'};font-size:10.5px;">
        <div>
          <span style="font-weight:600;">${humanizeType(p.paymentType)}</span>
          <span style="color:#6B7280;margin:0 6px;">&middot;</span>
          <span>${humanizeMethod(p.paymentMethod)}</span>
          <span style="color:#9CA3AF;margin-left:6px;">${fmtDate(p.paymentDate)}</span>
          ${p.referenceNumber ? `<span style="color:#9CA3AF;margin-left:6px;font-size:9.5px;">Ref: ${esc(p.referenceNumber)}</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px;background:${p.status === 'VERIFIED' ? '#D1FAE5' : p.status === 'FAILED' ? '#FEE2E2' : '#FEF3C7'};color:${p.status === 'VERIFIED' ? '#065F46' : p.status === 'FAILED' ? '#991B1B' : '#92400E'};">${p.status}</span>
          <span style="font-weight:700;color:${p.status === 'VERIFIED' ? '#059669' : '#111'};">${fmtMYR(Number(p.amount))}</span>
        </div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  <!-- Payment Instructions -->
  ${data.agency.bankName ? `
  <div class="section">
    <div class="sec-label">Payment Instructions</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div style="background:${soft2};border:1px solid ${soft};border-radius:10px;padding:16px 18px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};margin-bottom:10px;">Bank Transfer Details</div>
        <div style="font-size:11px;color:#374151;line-height:1.8;">
          ${data.agency.bankName ? `<div><span style="color:#9CA3AF;">Bank: </span><strong>${esc(data.agency.bankName)}</strong></div>` : ''}
          ${data.agency.bankAccountNumber ? `<div><span style="color:#9CA3AF;">Account: </span><strong style="font-family:monospace;">${esc(data.agency.bankAccountNumber)}</strong></div>` : ''}
          ${data.agency.bankAccountHolder ? `<div><span style="color:#9CA3AF;">Holder: </span>${esc(data.agency.bankAccountHolder)}</div>` : ''}
        </div>
      </div>
      ${data.agency.bankNotes ? `
      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:16px 18px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#B45309;margin-bottom:8px;">Important Notes</div>
        <div style="font-size:10.5px;color:#78350F;line-height:1.6;">${esc(data.agency.bankNotes)}</div>
      </div>` : '<div></div>'}
    </div>
  </div>` : ''}

  <!-- T&C -->
  ${(data.agency.termsAndConditions || data.agency.refundPolicy) ? `
  <div class="section">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      ${data.agency.termsAndConditions ? `
      <div>
        <div class="sec-label">Terms &amp; Conditions</div>
        <div style="font-size:9px;color:#6B7280;line-height:1.7;">${esc(data.agency.termsAndConditions)}</div>
      </div>` : '<div></div>'}
      ${data.agency.refundPolicy ? `
      <div>
        <div class="sec-label">Refund Policy</div>
        <div style="font-size:9px;color:#6B7280;line-height:1.7;">${esc(data.agency.refundPolicy)}</div>
      </div>` : ''}
    </div>
  </div>` : ''}

  <div style="flex:1 1 auto;"></div>

  <!-- Footer bar -->
  <div style="padding:16px 44px;background:${accent};color:rgba(255,255,255,.8);display:flex;justify-content:space-between;align-items:center;font-size:9px;">
    <span>Generated by ${esc(data.agency.name)} &middot; ${fmtDate(new Date())}${data.agency.motacLicenseNumber ? ` &middot; MOTAC: ${esc(data.agency.motacLicenseNumber)}` : ''}</span>
    <span style="font-family:monospace;letter-spacing:.1em;color:#fff;font-weight:600;">${esc(data.invoiceNumber)} &middot; ${esc(data.bookingNumber)}</span>
  </div>

</div>
</body>
</html>`;
}
