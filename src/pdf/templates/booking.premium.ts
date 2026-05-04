import { BookingPDFData } from '../booking.template';

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

function lighten(hex: string, amount = 0.88): string {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const lr = Math.round(r + (255 - r) * amount);
    const lg = Math.round(g + (255 - g) * amount);
    const lb = Math.round(b + (255 - b) * amount);
    return `rgb(${lr},${lg},${lb})`;
  } catch { return '#F0F4F3'; }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildBookingPremiumHTML(data: BookingPDFData): string {
  const accent  = data.agency.primaryColor ?? '#1F4E4A';
  const soft    = lighten(accent, 0.90);
  const soft2   = lighten(accent, 0.95);

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

  const STATUS_CHIP: Record<string, { label: string; bg: string; color: string }> = {
    CONFIRMED:  { label: '✓ Confirmed',  bg: '#D1FAE5', color: '#065F46' },
    COMPLETED:  { label: '✓ Completed',  bg: '#D1FAE5', color: '#065F46' },
    INQUIRY:    { label: '◎ Inquiry',    bg: '#FEF3C7', color: '#92400E' },
    QUOTED:     { label: '◎ Quoted',     bg: '#DBEAFE', color: '#1E40AF' },
    CANCELLED:  { label: '✕ Cancelled',  bg: '#FEE2E2', color: '#991B1B' },
  };
  const chip = STATUS_CHIP[data.status] ?? { label: data.status, bg: '#F3F4F6', color: '#374151' };

  const hasPage2 = data.pkg.itinerary.length > 0 || data.pkg.inclusions.length > 0;

  const travelerCards = data.travelers.map((t, i) => {
    const initials = t.fullName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const idDoc = t.icNumber ?? t.passportNumber ?? null;
    const isChild = t.travelerType === 'CHILD';
    return `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 14px;border:1px solid #E5E7EB;border-radius:10px;background:#fff;">
      <div style="width:36px;height:36px;border-radius:50%;background:${isChild ? '#EDE9FE' : soft};color:${isChild ? '#6D28D9' : accent};
        display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">
        ${esc(initials)}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:600;color:#111;">${esc(t.fullName)}</div>
        <div style="font-size:10px;color:#6B7280;margin-top:2px;">
          ${isChild ? 'Child' : 'Adult'}
          ${idDoc ? ` &middot; ${esc(idDoc)}` : ''}
          ${t.roomType ? ` &middot; Room: ${esc(t.roomType)}` : ''}
          ${t.mahramRelation ? ` &middot; Mahram: ${esc(t.mahramRelation)}` : ''}
        </div>
      </div>
      <div style="font-size:11px;font-weight:600;color:${accent};">${fmtMYR(isChild ? data.pkg.childPrice : data.pkg.adultPrice)}</div>
    </div>`;
  }).join('');

  const payRows: string[] = [];
  if (adults.length > 0)
    payRows.push(`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F3F4F6;"><span style="color:#6B7280;">${adults.length} Adult${adults.length !== 1 ? 's' : ''} × ${fmtMYR(data.pkg.adultPrice)}</span><span>${fmtMYR(adultTotal)}</span></div>`);
  if (children.length > 0)
    payRows.push(`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F3F4F6;"><span style="color:#6B7280;">${children.length} Child${children.length !== 1 ? 'ren' : ''} × ${fmtMYR(data.pkg.childPrice)}</span><span>${fmtMYR(childTotal)}</span></div>`);
  payRows.push(`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:2px solid #111;font-weight:600;"><span>Subtotal</span><span>${fmtMYR(subtotal)}</span></div>`);
  if (data.pkg.isSSTApplicable && sstAmt > 0)
    payRows.push(`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F3F4F6;color:#D97706;"><span>SST (${data.pkg.sstRate}%)</span><span>+${fmtMYR(sstAmt)}</span></div>`);
  payRows.push(`<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:3px double #111;font-size:15px;font-weight:700;"><span>Total</span><span style="color:${accent};">${fmtMYR(total)}</span></div>`);
  verifiedPmts.forEach((p) => {
    payRows.push(`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F3F4F6;color:#059669;"><span>Paid &mdash; ${fmtDate(p.paymentDate)}&thinsp;(${humanizeMethod(p.paymentMethod)})</span><span>&minus;${fmtMYR(Number(p.amount))}</span></div>`);
  });

  const balanceBlock = balance <= 0
    ? `<div style="background:${accent};color:#fff;border-radius:10px;padding:14px 18px;margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.75;">Payment Status</div><div style="font-size:16px;font-weight:700;margin-top:2px;">Fully Paid ✓</div></div>
        <div style="font-size:22px;font-weight:800;">${fmtMYR(paidAmt)}</div>
      </div>`
    : `<div style="background:#111;color:#fff;border-radius:10px;padding:14px 18px;margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.6;">Balance Due</div><div style="font-size:13px;margin-top:2px;opacity:.85;">Please settle before departure</div></div>
        <div style="font-size:22px;font-weight:800;">${fmtMYR(balance)}</div>
      </div>`;

  // Page 2 itinerary
  const itineraryPage = hasPage2 ? `
  <div style="width:794px;min-height:1123px;background:#fff;margin:0 auto;padding:44px 52px 52px;box-shadow:0 1px 0 rgba(0,0,0,.04),0 20px 60px -15px rgba(0,0,0,.22);display:flex;flex-direction:column;">
    <!-- Page 2 header -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:2px solid ${accent};margin-bottom:28px;">
      <div style="font-size:11px;font-weight:600;color:#111;">${esc(data.pkg.name)} &middot; ${esc(data.customer.fullName)}</div>
      <div style="font-family:monospace;font-size:9px;color:#9CA3AF;letter-spacing:.12em;">${esc(data.bookingNumber)}</div>
    </div>

    <div style="font-size:36px;font-weight:800;letter-spacing:-.02em;color:#111;margin-bottom:6px;">Travel Itinerary</div>
    <div style="font-size:11px;color:#6B7280;margin-bottom:28px;">${esc(data.pkg.destination)} &middot; ${data.pkg.days}D / ${data.pkg.nights}N${data.departureDate ? ` &middot; Departs ${fmtDate(data.departureDate)}` : ''}</div>

    ${data.pkg.inclusions.length > 0 ? `
    <div style="background:${soft2};border:1px solid ${soft};border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${accent};margin-bottom:12px;">Package Inclusions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
        ${data.pkg.inclusions.map((inc) => `
        <div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid #E5E7EB;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:${accent};margin-bottom:3px;">${esc(inc.type)}</div>
          <div style="font-size:10.5px;color:#374151;">${esc(inc.value)}</div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    ${data.pkg.itinerary.length > 0 ? `
    <div style="display:flex;flex-direction:column;gap:0;">
      ${[...data.pkg.itinerary].sort((a, b) => a.dayNumber - b.dayNumber).map((day, idx) => `
      <div style="display:grid;grid-template-columns:72px 1fr;gap:20px;padding:18px 0;${idx < data.pkg.itinerary.length - 1 ? 'border-bottom:1px solid #F3F4F6;' : ''}">
        <div style="text-align:center;padding-top:4px;">
          <div style="width:42px;height:42px;border-radius:50%;background:${soft};color:${accent};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;margin:0 auto;">${day.dayNumber}</div>
          <div style="font-size:8.5px;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-top:5px;">Day ${day.dayNumber}</div>
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:6px;">${esc(day.title)}</div>
          <div style="font-size:11px;color:#4B5563;line-height:1.65;">${esc(day.description)}</div>
        </div>
      </div>`).join('')}
    </div>` : ''}

    <div style="flex:1 1 auto;"></div>
    <div style="margin-top:24px;padding:14px 18px;background:${soft2};border:1px dashed ${soft};border-radius:10px;font-size:9.5px;color:#4B5563;line-height:1.6;">
      <strong style="color:${accent};">Note:</strong> Itinerary is indicative and subject to operational changes without prior notice.
      ${data.specialRequests ? `Special requests on file: <em>${esc(data.specialRequests)}</em>.` : ''}
      Contact your travel agent for any queries before departure.
    </div>
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(data.bookingNumber)} &middot; ${esc(data.agency.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #E5E7EB; padding: 32px 16px 64px; -webkit-font-smoothing: antialiased; }
  .stack { display: flex; flex-direction: column; align-items: center; gap: 32px; }
  .page { width: 794px; min-height: 1123px; background: #fff; display: flex; flex-direction: column; box-shadow: 0 1px 0 rgba(0,0,0,.04), 0 20px 60px -15px rgba(0,0,0,.22); }
  .kv-block { display: grid; gap: 14px; }
  .kv-2 { grid-template-columns: 1fr 1fr; }
  .kv-3 { grid-template-columns: 1fr 1fr 1fr; }
  .kv-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .kl { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: #9CA3AF; margin-bottom: 3px; }
  .kv { font-size: 12px; font-weight: 500; color: #111; }
  .section { padding: 24px 44px; border-top: 1px solid #F3F4F6; }
  .sec-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #9CA3AF; margin-bottom: 14px; }
  .no-print { position: fixed; top: 16px; right: 16px; z-index: 999; }
  .print-btn { background: #111; color: #fff; border: none; padding: 10px 20px; cursor: pointer; font-size: 11px; letter-spacing: .05em; border-radius: 6px; font-family: inherit; }
  @page { size: A4 portrait; margin: 0; }
  @media print {
    body { padding: 0; background: white; }
    .stack { gap: 0; }
    .page { box-shadow: none; min-height: 297mm; width: 210mm; }
    .no-print { display: none !important; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
  }
</style>
</head>
<body>

<div class="no-print">
  <button class="print-btn" onclick="window.print()">&#8595; Save as PDF</button>
</div>

<div class="stack">
<div class="page">

  <!-- ── Branded Header ────────────────────────────────────────────────────── -->
  <div style="background:${accent};color:#fff;padding:32px 44px 28px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <!-- Logo + agency -->
      <div style="display:flex;align-items:center;gap:16px;">
        ${data.agency.logoUrl
          ? `<img src="${esc(data.agency.logoUrl)}" alt="" style="width:52px;height:52px;border-radius:10px;object-fit:contain;background:rgba(255,255,255,.15);padding:4px;" />`
          : `<div style="width:52px;height:52px;border-radius:10px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">${esc(data.agency.name.charAt(0).toUpperCase())}</div>`}
        <div>
          <div style="font-size:18px;font-weight:800;letter-spacing:-.01em;">${esc(data.agency.name)}</div>
          ${data.agency.tag ? `<div style="font-size:10px;opacity:.7;margin-top:3px;">${esc(data.agency.tag)}</div>` : ''}
          ${data.agency.motacLicenseNumber ? `<div style="font-size:9.5px;opacity:.65;margin-top:2px;">MOTAC: ${esc(data.agency.motacLicenseNumber)}</div>` : ''}
        </div>
      </div>
      <!-- Booking refs -->
      <div style="text-align:right;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-bottom:6px;">Booking Confirmation</div>
        <div style="font-size:20px;font-weight:800;letter-spacing:.01em;">${esc(data.bookingNumber)}</div>
        <div style="font-size:10px;opacity:.7;margin-top:4px;">Issued ${fmtDate(data.bookingDate)}</div>
        ${data.departureDate ? `<div style="font-size:10px;opacity:.7;">Departs ${fmtDate(data.departureDate)}</div>` : ''}
        <div style="margin-top:8px;display:inline-block;background:${chip.bg};color:${chip.color};font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;">${chip.label}</div>
      </div>
    </div>
  </div>

  <!-- ── Agency contact strip ────────────────────────────────────────────── -->
  ${(data.agency.phone || data.agency.email || data.agency.address) ? `
  <div style="background:${soft};padding:10px 44px;display:flex;gap:24px;font-size:10px;color:#4B5563;border-bottom:1px solid #E5E7EB;">
    ${data.agency.phone   ? `<span>📞 ${esc(data.agency.phone)}</span>` : ''}
    ${data.agency.email   ? `<span>✉️ ${esc(data.agency.email)}</span>` : ''}
    ${data.agency.address ? `<span>📍 ${esc(data.agency.address)}</span>` : ''}
  </div>` : ''}

  <!-- ── Customer ─────────────────────────────────────────────────────────── -->
  <div class="section">
    <div class="sec-label">Billed To</div>
    <div class="kv-block kv-3">
      <div><div class="kl">Full Name</div><div class="kv" style="font-size:14px;font-weight:700;">${esc(data.customer.fullName)}</div></div>
      <div><div class="kl">Phone</div><div class="kv">${esc(data.customer.phone)}</div></div>
      ${data.customer.email ? `<div><div class="kl">Email</div><div class="kv">${esc(data.customer.email)}</div></div>` : '<div></div>'}
      ${data.customer.icNumber ? `<div><div class="kl">IC Number</div><div class="kv" style="font-family:monospace;">${esc(data.customer.icNumber)}</div></div>` : ''}
      ${data.customer.passportNumber ? `<div><div class="kl">Passport</div><div class="kv" style="font-family:monospace;">${esc(data.customer.passportNumber)}</div></div>` : ''}
      ${data.customer.nationality ? `<div><div class="kl">Nationality</div><div class="kv">${esc(data.customer.nationality)}</div></div>` : ''}
    </div>
  </div>

  <!-- ── Package ──────────────────────────────────────────────────────────── -->
  <div class="section">
    <div class="sec-label">Package</div>
    <div style="background:${soft};border:1px solid ${soft};border-radius:12px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;border-left:4px solid ${accent};">
      <div>
        <div style="font-size:18px;font-weight:800;color:#111;letter-spacing:-.01em;">${esc(data.pkg.name)}</div>
        <div style="font-size:11px;color:#6B7280;margin-top:5px;">
          ${esc(data.pkg.type.replace(/_/g, ' '))} &nbsp;&middot;&nbsp; ${esc(data.pkg.destination)} &nbsp;&middot;&nbsp; ${data.pkg.days}D / ${data.pkg.nights}N
        </div>
      </div>
      <div style="text-align:right;">
        ${data.departureDate ? `
        <div class="kl">Departure Date</div>
        <div style="font-size:16px;font-weight:800;color:${accent};">${fmtDate(data.departureDate)}</div>` : ''}
        <div style="font-size:11px;color:#6B7280;margin-top:6px;">${adults.length} adult${adults.length !== 1 ? 's' : ''}${children.length > 0 ? `, ${children.length} child${children.length !== 1 ? 'ren' : ''}` : ''}</div>
      </div>
    </div>
  </div>

  <!-- ── Travelers ─────────────────────────────────────────────────────────── -->
  <div class="section">
    <div class="sec-label">Travelers &mdash; ${data.travelers.length} Pax</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${travelerCards || '<div style="font-size:11px;color:#9CA3AF;text-align:center;padding:16px;">No travelers added yet.</div>'}
    </div>
  </div>

  <!-- ── Payment ───────────────────────────────────────────────────────────── -->
  <div class="section">
    <div class="sec-label">Payment Summary</div>
    <div style="display:grid;grid-template-columns:1fr 300px;gap:32px;align-items:start;">
      <!-- Left: note + history -->
      <div>
        ${data.specialRequests ? `
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 14px;font-size:11px;color:#78350F;margin-bottom:14px;">
          <strong>Special Requests:</strong> ${esc(data.specialRequests)}
        </div>` : ''}
        ${data.payments.length > 0 ? `
        <div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:8px;">Payment History</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${data.payments.map((p) => `
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:${p.status === 'VERIFIED' ? '#F0FDF4' : '#F9FAFB'};border-radius:8px;border:1px solid ${p.status === 'VERIFIED' ? '#BBF7D0' : '#E5E7EB'};font-size:10.5px;">
              <div>
                <span style="font-weight:600;">${humanizeMethod(p.paymentMethod)}</span>
                <span style="color:#6B7280;margin-left:6px;">${fmtDate(p.paymentDate)}</span>
                ${p.referenceNumber ? `<span style="color:#9CA3AF;margin-left:6px;font-size:9.5px;">${esc(p.referenceNumber)}</span>` : ''}
              </div>
              <div style="font-weight:700;color:${p.status === 'VERIFIED' ? '#059669' : '#111'};">${fmtMYR(Number(p.amount))}</div>
            </div>`).join('')}
          </div>
        </div>` : '<div style="font-size:10px;color:#9CA3AF;">No payments recorded yet.</div>'}
      </div>
      <!-- Right: summary -->
      <div>
        <div style="font-size:11px;">${payRows.join('')}</div>
        ${balanceBlock}
      </div>
    </div>
  </div>

  <div style="flex:1 1 auto;"></div>

  <!-- ── Footer ────────────────────────────────────────────────────────────── -->
  <div style="padding:18px 44px;background:${soft};border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:flex-end;font-size:9px;color:#6B7280;">
    <div style="max-width:480px;line-height:1.6;">
      This booking confirmation is issued by <strong style="color:#111;">${esc(data.agency.name)}</strong>.
      Prices quoted in MYR${data.pkg.isSSTApplicable ? ', inclusive of SST' : ''}.
      Cancellation terms apply. Travel insurance recommended.
      Passports must be valid for 6+ months from the return date.
      ${data.agency.motacLicenseNumber ? `<br><span style="font-size:8.5px;">MOTAC License: ${esc(data.agency.motacLicenseNumber)}${data.agency.motacExpiryDate ? ` (Exp: ${fmtDate(data.agency.motacExpiryDate)})` : ''}</span>` : ''}
    </div>
    <div style="text-align:right;flex-shrink:0;margin-left:20px;">
      <div style="font-size:11px;font-weight:700;color:#111;">${esc(data.agency.name)}</div>
      <div style="font-family:monospace;font-size:9px;margin-top:2px;">${esc(data.bookingNumber)} &middot; ${fmtDate(new Date())}</div>
    </div>
  </div>

</div>

${itineraryPage}

</div>
</body>
</html>`;
}
