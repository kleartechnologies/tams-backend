// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgencyInfo {
  name: string;
  tag?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  registrationNo?: string;
  primaryColor?: string;
  logoUrl?: string | null;
  motacLicenseNumber?: string | null;
  motacExpiryDate?: string | Date | null;
}

export interface InclusionItem { type: string; value: string }
export interface ItineraryDay   { dayNumber: number; title: string; description: string }

export interface TravelerRow {
  fullName: string;
  travelerType: string;          // 'ADULT' | 'CHILD'
  icNumber?: string | null;
  passportNumber?: string | null;
  roomType?: string | null;
  seatNumber?: string | null;
  notes?: string | null;
  mahramRelation?: string | null;
}

export interface PaymentRow {
  amount: number;
  paymentType: string;
  paymentMethod: string;
  status: string;                // 'PENDING' | 'VERIFIED' | 'FAILED'
  paymentDate: Date | string;
  referenceNumber?: string | null;
}

export interface BookingPDFData {
  agency: AgencyInfo;
  bookingNumber: string;
  bookingDate: Date | string;
  status: string;
  departureDate?: Date | string | null;
  specialRequests?: string | null;
  preparedBy?: string;
  customer: {
    fullName: string;
    phone: string;
    email?: string | null;
    icNumber?: string | null;
    passportNumber?: string | null;
    nationality?: string;
  };
  pkg: {
    name: string;
    type: string;
    destination: string;
    days: number;
    nights: number;
    adultPrice: number;
    childPrice: number;
    isSSTApplicable: boolean;
    sstRate: number;
    inclusions: InclusionItem[];
    itinerary: ItineraryDay[];
  };
  travelers: TravelerRow[];
  payments: PaymentRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMYR(n: number): string {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n);
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtShort(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-MY', { day: '2-digit', month: 'short' });
}

function dayWord(n: number): string {
  const w = ['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen',
    'Nineteen','Twenty'];
  return w[n - 1] ?? String(n);
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

function statusLabel(s: string): string {
  switch (s) {
    case 'CONFIRMED':  return '&#10003; Confirmed';
    case 'INQUIRY':    return '&#9702; Inquiry';
    case 'QUOTED':     return '&#9702; Quoted';
    case 'CANCELLED':  return '&#10005; Cancelled';
    case 'COMPLETED':  return '&#10003; Completed';
    default:           return esc(s);
  }
}

function statusColor(s: string, accent: string): string {
  switch (s) {
    case 'CONFIRMED':
    case 'COMPLETED': return accent;
    case 'INQUIRY':
    case 'QUOTED':    return '#9A6B00';
    case 'CANCELLED': return '#8A2B1F';
    default:          return '#6B6B66';
  }
}

function accentSoft(hex: string): string {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},0.07)`;
  } catch { return '#EEF2F1'; }
}

function padIdx(n: number): string { return String(n).padStart(2, '0'); }

// ── CSS ───────────────────────────────────────────────────────────────────────

function getCSS(accent: string): string {
  return `
  :root{
    --paper:#FAFAF7;--ink:#111111;--ink-2:#2B2B2B;--muted:#6B6B66;
    --rule:#1F1F1F;--hair:#E4E2DA;
    --accent:${accent};--accent-soft:${accentSoft(accent)};--danger:#8A2B1F;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:#EAE8DF;}
  body{font-family:'Inter',system-ui,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;
    font-feature-settings:"ss01","cv11";padding:40px 20px 80px;}
  .stack{display:flex;flex-direction:column;align-items:center;gap:28px;}
  .page{width:794px;min-height:1123px;background:var(--paper);color:var(--ink);position:relative;
    box-shadow:0 1px 0 rgba(0,0,0,.04),0 30px 80px -20px rgba(0,0,0,.25),0 8px 20px -10px rgba(0,0,0,.15);
    padding:56px 64px 72px;overflow:hidden;display:flex;flex-direction:column;}
  .page>.spacer{flex:1 1 auto;}
  .page::before,.page::after{content:"";position:absolute;width:10px;height:10px;border:1px solid var(--hair);}
  .page::before{top:18px;left:18px;border-right:none;border-bottom:none;}
  .page::after{bottom:18px;right:18px;border-left:none;border-top:none;}
  .eyebrow{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:.18em;
    text-transform:uppercase;color:var(--muted);font-weight:500;}
  .h-serif{font-family:'Instrument Serif',serif;font-weight:400;letter-spacing:-.01em;line-height:.95;}
  .mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;}
  .num{font-variant-numeric:tabular-nums;}
  .masthead{display:flex;justify-content:space-between;align-items:flex-start;
    padding-bottom:20px;border-bottom:1px solid var(--rule);}
  .brand{display:flex;align-items:center;gap:14px;}
  .logo{width:44px;height:44px;border:1.5px solid var(--ink);border-radius:50%;
    display:flex;align-items:center;justify-content:center;position:relative;background:var(--paper);}
  .logo::before{content:"";position:absolute;inset:6px;border:1px solid var(--ink);border-radius:50%;
    border-top-color:transparent;border-right-color:transparent;transform:rotate(-35deg);}
  .logo span{font-family:'Instrument Serif',serif;font-size:22px;line-height:1;position:relative;z-index:1;}
  .logo-img{width:52px;height:52px;border-radius:8px;overflow:hidden;border:1px solid var(--hair);
    flex-shrink:0;background:var(--paper);padding:4px;display:flex;align-items:center;justify-content:center;}
  .logo-img img{width:100%;height:100%;object-fit:contain;display:block;}
  .brand-word{font-family:'Instrument Serif',serif;font-size:22px;letter-spacing:.01em;line-height:1;}
  .brand-word small{display:block;font-family:'JetBrains Mono',monospace;font-size:8.5px;
    letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin-top:6px;font-weight:500;}
  .agency-meta{text-align:right;font-size:10.5px;line-height:1.55;color:var(--ink-2);}
  .agency-meta .name{font-weight:600;font-size:11.5px;color:var(--ink);letter-spacing:.01em;margin-bottom:4px;}
  .agency-meta .row{display:flex;gap:8px;justify-content:flex-end;}
  .agency-meta .label{color:var(--muted);width:48px;text-align:left;}
  .doctitle{display:grid;grid-template-columns:1fr auto;align-items:end;gap:28px;padding:40px 0 28px;}
  .doctitle h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:68px;line-height:.92;
    letter-spacing:-.02em;margin:0;}
  .doctitle h1 em{font-style:italic;color:var(--accent);}
  .doctitle .refs{display:grid;grid-template-columns:auto auto;gap:4px 18px;font-size:10.5px;align-items:baseline;}
  .doctitle .refs .k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.18em;
    text-transform:uppercase;color:var(--muted);}
  .doctitle .refs .v{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;
    color:var(--ink);text-align:right;}
  section{padding:22px 0;border-top:1px solid var(--hair);}
  section:first-of-type{border-top:none;}
  .sec-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;}
  .sec-head h2{font-size:11px;letter-spacing:.2em;text-transform:uppercase;font-weight:600;
    margin:0;color:var(--ink);}
  .sec-head .index{font-family:'JetBrains Mono',monospace;font-size:9.5px;
    color:var(--muted);letter-spacing:.14em;}
  .kv{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 28px;}
  .kv.two{grid-template-columns:repeat(2,1fr);}
  .kv.four{grid-template-columns:repeat(4,1fr);}
  .kv .field .k{font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.2em;
    text-transform:uppercase;color:var(--muted);margin-bottom:6px;font-weight:500;}
  .kv .field .v{font-size:13px;font-weight:500;color:var(--ink);line-height:1.35;letter-spacing:-.005em;}
  .kv .field .v.lg{font-size:15px;}
  .kv .field .sub{font-size:10.5px;color:var(--muted);margin-top:2px;}
  .package{background:var(--accent-soft);border:1px solid #D6DDDB;padding:18px 22px;
    display:grid;grid-template-columns:1fr auto;gap:12px 24px;align-items:center;position:relative;}
  .package::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent);}
  .package .pkg-name{font-family:'Instrument Serif',serif;font-size:24px;line-height:1.05;letter-spacing:-.01em;}
  .package .pkg-sub{font-size:10.5px;color:var(--muted);margin-top:4px;letter-spacing:.02em;}
  .package .pills{display:flex;gap:10px;}
  .pill{border:1px solid #C5CECB;background:var(--paper);padding:6px 10px;
    font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.04em;color:var(--ink);
    display:flex;flex-direction:column;gap:2px;min-width:72px;text-align:center;}
  .pill .pill-k{font-size:7.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);}
  table{width:100%;border-collapse:collapse;font-size:11.5px;}
  thead th{text-align:left;font-family:'JetBrains Mono',monospace;font-size:8.5px;
    letter-spacing:.2em;text-transform:uppercase;color:var(--muted);font-weight:500;
    padding:0 0 10px;border-bottom:1px solid var(--rule);}
  thead th.num{text-align:right;}
  tbody td{padding:11px 0;border-bottom:1px solid var(--hair);vertical-align:top;}
  tbody td.num{text-align:right;font-variant-numeric:tabular-nums;}
  tbody tr:last-child td{border-bottom:1px solid var(--rule);}
  td .idx{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--muted);
    width:22px;display:inline-block;}
  td .name{font-weight:500;}
  td .meta{font-size:10px;color:var(--muted);margin-top:2px;}
  .type-tag{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
    text-transform:uppercase;border:1px solid var(--hair);padding:2px 7px;
    color:var(--ink-2);background:var(--paper);}
  .type-tag.child{color:var(--accent);border-color:#C5CECB;}
  .pay-wrap{display:grid;grid-template-columns:1fr 300px;gap:40px;align-items:start;}
  .pay-left{font-size:10.5px;color:var(--muted);line-height:1.55;}
  .pay-left .notice{border:1px solid var(--hair);padding:14px 16px;background:#fff;}
  .pay-left .notice h4{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
    margin:0 0 6px;color:var(--ink);font-weight:600;}
  .pay-left .methods{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
  .method{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
    text-transform:uppercase;border:1px solid var(--hair);padding:5px 9px;color:var(--ink-2);}
  .pay-table{font-size:12px;}
  .pay-row{display:grid;grid-template-columns:1fr auto;padding:8px 0;
    border-bottom:1px solid var(--hair);align-items:baseline;}
  .pay-row .desc{color:var(--ink-2);}
  .pay-row .desc small{color:var(--muted);margin-left:6px;font-size:10px;}
  .pay-row .val{font-variant-numeric:tabular-nums;font-weight:500;}
  .pay-row.sub{border-bottom:1px solid var(--rule);}
  .pay-row.sub .desc{font-weight:500;}
  .pay-row.total{padding:16px 0 14px;border-bottom:3px double var(--rule);border-top:none;}
  .pay-row.total .desc{font-family:'Instrument Serif',serif;font-size:18px;letter-spacing:-.01em;}
  .pay-row.total .val{font-family:'Instrument Serif',serif;font-size:22px;
    letter-spacing:-.01em;color:var(--ink);}
  .pay-row.paid .val{color:var(--accent);}
  .pay-row.balance{background:#111;color:#fff;padding:14px;margin-top:10px;border:none;}
  .pay-row.balance .desc{color:#fff;font-size:11px;letter-spacing:.16em;
    text-transform:uppercase;font-weight:500;}
  .pay-row.balance .val{color:#fff;font-size:18px;font-weight:600;}
  .pay-row.fullpaid{background:${accent};color:#fff;padding:14px;margin-top:10px;border:none;}
  .pay-row.fullpaid .desc{color:#fff;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:500;}
  .pay-row.fullpaid .val{color:#fff;font-size:18px;font-weight:600;}
  .page-footer{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;
    gap:30px;padding-top:18px;margin-bottom:20px;border-top:1px solid var(--hair);}
  .terms{font-size:8.5px;line-height:1.55;color:var(--muted);max-width:440px;}
  .terms strong{color:var(--ink-2);font-weight:600;letter-spacing:.04em;}
  .thanks{text-align:right;font-family:'Instrument Serif',serif;font-style:italic;
    font-size:16px;color:var(--ink);line-height:1.2;}
  .thanks small{display:block;font-family:'JetBrains Mono',monospace;font-style:normal;
    font-size:8.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-top:6px;}
  .page-num{position:absolute;bottom:20px;right:64px;font-family:'JetBrains Mono',monospace;
    font-size:8.5px;letter-spacing:.2em;color:var(--muted);}
  .page-label{position:absolute;top:28px;right:-8px;transform:rotate(90deg);
    transform-origin:right top;font-family:'JetBrains Mono',monospace;font-size:8px;
    letter-spacing:.3em;color:var(--muted);text-transform:uppercase;}
  .running-head{display:flex;justify-content:space-between;align-items:center;
    padding-bottom:12px;border-bottom:1px solid var(--hair);font-size:10px;}
  .running-head .left{display:flex;gap:18px;align-items:center;color:var(--muted);}
  .running-head .left b{color:var(--ink);font-weight:600;}
  .running-head .right{font-family:'JetBrains Mono',monospace;font-size:9px;
    letter-spacing:.18em;text-transform:uppercase;color:var(--muted);}
  .iti-title{display:grid;grid-template-columns:1fr auto;align-items:end;
    padding:30px 0 26px;border-bottom:1px solid var(--rule);}
  .iti-title h1{font-family:'Instrument Serif',serif;font-size:56px;line-height:.95;
    letter-spacing:-.02em;margin:0;font-weight:400;}
  .iti-title h1 em{font-style:italic;color:var(--accent);}
  .iti-title .overview{text-align:right;font-size:10.5px;color:var(--muted);line-height:1.6;}
  .iti-title .overview b{color:var(--ink);font-weight:600;}
  .days{padding-top:22px;display:flex;flex-direction:column;gap:22px;}
  .day{display:grid;grid-template-columns:86px 1fr;gap:28px;align-items:start;
    padding-bottom:22px;border-bottom:1px solid var(--hair);}
  .day:last-child{border-bottom:none;}
  .day-tag{position:relative;padding-top:6px;}
  .day-tag .num{font-family:'Instrument Serif',serif;font-size:46px;line-height:.9;
    color:var(--ink);display:block;}
  .day-tag .num em{font-style:italic;color:var(--accent);}
  .day-tag .lbl{font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.22em;
    text-transform:uppercase;color:var(--muted);margin-top:6px;display:block;}
  .day-body h3{font-family:'Instrument Serif',serif;font-size:22px;line-height:1.1;
    letter-spacing:-.01em;font-weight:400;margin:0 0 8px;}
  .day-body p{font-size:11.5px;color:var(--ink-2);line-height:1.65;margin:0;}
  .inclusions{margin-top:6px;padding:14px 16px;background:#fff;border:1px solid var(--hair);
    display:grid;grid-template-columns:repeat(3,1fr);gap:12px 18px;}
  .inclusions h4{grid-column:1/-1;margin:0 0 4px;font-size:9.5px;letter-spacing:.2em;
    text-transform:uppercase;color:var(--muted);font-weight:500;}
  .inc-item{font-size:10.5px;line-height:1.4;}
  .inc-item b{display:block;font-weight:600;color:var(--ink);}
  .inc-item span{color:var(--muted);font-size:10px;}
  .iti-footer-note{margin-top:20px;padding:14px 16px;border:1px dashed #C5CECB;
    background:var(--accent-soft);font-size:10px;line-height:1.55;color:var(--ink-2);
    display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;}
  .iti-footer-note .badge{font-family:'JetBrains Mono',monospace;font-size:8.5px;
    letter-spacing:.2em;text-transform:uppercase;background:var(--ink);color:#fff;
    padding:4px 8px;align-self:start;}
  .no-print{position:fixed;top:20px;right:20px;z-index:999;}
  .print-btn{background:var(--ink);color:#fff;border:none;padding:10px 20px;cursor:pointer;
    font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;
    text-transform:uppercase;}
  .print-btn:hover{background:var(--accent);}
  @page{size:A4 portrait;margin:0;}
  @media print{
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
    html,body{margin:0;padding:0;background:white;}
    .stack{gap:0;}
    .no-print{display:none!important;}
    .page{box-shadow:none;page-break-after:always;min-height:297mm;width:210mm;
      padding:45px 55px;}
    .page:last-child{page-break-after:auto;}
    .page::before,.page::after{display:none;}
  }`;
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

import { buildBookingClassicHTML }  from './templates/booking.classic';
import { buildBookingPremiumHTML }  from './templates/booking.premium';

export function buildBookingHTML(data: BookingPDFData, template = 'modern'): string {
  switch (template) {
    case 'classic': return buildBookingClassicHTML(data);
    case 'premium': return buildBookingPremiumHTML(data);
    default:        return buildModernBookingHTML(data);
  }
}

// ── Modern template (default) ─────────────────────────────────────────────────

function buildModernBookingHTML(data: BookingPDFData): string {
  const accent = data.agency.primaryColor ?? '#1F4E4A';

  // ── Calculations ─────────────────────────────────────────────────────────────
  const adults   = data.travelers.filter((t) => t.travelerType === 'ADULT');
  const children = data.travelers.filter((t) => t.travelerType === 'CHILD');
  const adultTotal  = adults.length * data.pkg.adultPrice;
  const childTotal  = children.length * data.pkg.childPrice;
  const subtotal    = adultTotal + childTotal;
  const sstAmt      = data.pkg.isSSTApplicable
    ? Math.round(subtotal * data.pkg.sstRate) / 100
    : 0;
  const total       = subtotal + sstAmt;
  const verifiedPmts = data.payments.filter((p) => p.status === 'VERIFIED');
  const paidAmt     = verifiedPmts.reduce((s, p) => s + Number(p.amount), 0);
  const balance     = Math.max(0, total - paidAmt);

  const methods = [...new Set(data.payments.map((p) => humanizeMethod(p.paymentMethod)))];
  const hasPage2 = data.pkg.itinerary.length > 0 || data.pkg.inclusions.length > 0;
  const totalPages  = hasPage2 ? 2 : 1;
  const firstName   = data.customer.fullName.split(/\s+/)[0];

  // ── Rows: traveler table ───────────────────────────────────────────────────
  const travelerRows = data.travelers.map((t, i) => {
    const idDoc = t.icNumber ?? t.passportNumber ?? '—';
    const roomInfo = [t.roomType, t.seatNumber].filter(Boolean).join(' · ') || '—';
    const metaParts = [t.notes, t.mahramRelation ? `Mahram: ${t.mahramRelation}` : null]
      .filter(Boolean).join(' · ');
    return `
      <tr>
        <td>
          <span class="idx">${padIdx(i + 1)}</span>
          <span class="name">${esc(t.fullName)}</span>
          ${metaParts ? `<div class="meta">${esc(metaParts)}</div>` : ''}
        </td>
        <td><span class="type-tag${t.travelerType === 'CHILD' ? ' child' : ''}">${t.travelerType === 'CHILD' ? 'Child' : 'Adult'}</span></td>
        <td class="mono">${esc(idDoc)}</td>
        <td class="num">${esc(roomInfo)}</td>
      </tr>`;
  }).join('');

  // ── Rows: payment breakdown ────────────────────────────────────────────────
  const paymentLines: string[] = [];

  if (adults.length > 0) {
    paymentLines.push(`
      <div class="pay-row">
        <span class="desc">Adults <small>${adults.length} &times; ${fmtMYR(data.pkg.adultPrice)}</small></span>
        <span class="val">${fmtMYR(adultTotal)}</span>
      </div>`);
  }
  if (children.length > 0) {
    paymentLines.push(`
      <div class="pay-row">
        <span class="desc">Children <small>${children.length} &times; ${fmtMYR(data.pkg.childPrice)}</small></span>
        <span class="val">${fmtMYR(childTotal)}</span>
      </div>`);
  }
  paymentLines.push(`
      <div class="pay-row sub">
        <span class="desc">Subtotal</span>
        <span class="val">${fmtMYR(subtotal)}</span>
      </div>`);
  if (data.pkg.isSSTApplicable && sstAmt > 0) {
    paymentLines.push(`
      <div class="pay-row">
        <span class="desc">SST <small>${data.pkg.sstRate}%</small></span>
        <span class="val">${fmtMYR(sstAmt)}</span>
      </div>`);
  }
  paymentLines.push(`
      <div class="pay-row total">
        <span class="desc">Total</span>
        <span class="val">${fmtMYR(total)}</span>
      </div>`);

  // Verified payments
  verifiedPmts.forEach((p) => {
    paymentLines.push(`
      <div class="pay-row paid">
        <span class="desc">Paid <small>${fmtDate(p.paymentDate)} &middot; ${esc(humanizeMethod(p.paymentMethod))}${p.referenceNumber ? ` &middot; ${esc(p.referenceNumber)}` : ''}</small></span>
        <span class="val">&minus; ${fmtMYR(Number(p.amount))}</span>
      </div>`);
  });

  // Balance
  if (balance <= 0) {
    paymentLines.push(`
      <div class="pay-row fullpaid">
        <span class="desc">Payment Status</span>
        <span class="val">Fully Paid</span>
      </div>`);
  } else {
    paymentLines.push(`
      <div class="pay-row balance">
        <span class="desc">Balance Due</span>
        <span class="val">${fmtMYR(balance)}</span>
      </div>`);
  }

  // ── Inclusions for page 2 ─────────────────────────────────────────────────
  const inclusionItems = data.pkg.inclusions
    .map((inc) => `
      <div class="inc-item">
        <b>${esc(inc.type)}</b>
        <span>${esc(inc.value)}</span>
      </div>`)
    .join('');

  // ── Itinerary days ────────────────────────────────────────────────────────
  const dayBlocks = [...data.pkg.itinerary]
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((day) => {
      const numStr = padIdx(day.dayNumber);
      // Animate the last digit in italic accent
      const numDisplay = numStr.length === 2
        ? `${numStr[0]}<em>${numStr[1]}</em>`
        : `<em>${numStr}</em>`;
      return `
      <div class="day">
        <div class="day-tag">
          <span class="num">${numDisplay}</span>
          <span class="lbl">Day ${dayWord(day.dayNumber)}</span>
        </div>
        <div class="day-body">
          <h3>${esc(day.title)}</h3>
          <p>${esc(day.description)}</p>
        </div>
      </div>`;
    }).join('');

  // ── Page 2 (itinerary) ────────────────────────────────────────────────────
  const page2 = hasPage2 ? `
  <article class="page" data-page="02">
    <div class="running-head">
      <div class="left">
        <b>${esc(data.pkg.name)}</b>
        <span>&middot;</span>
        <span>${esc(data.customer.fullName)}</span>
        <span>&middot;</span>
        <span>${esc(data.bookingNumber)}</span>
      </div>
      <div class="right">${data.pkg.days} Days &middot; ${data.pkg.nights} Nights</div>
    </div>

    <div class="iti-title">
      <h1>Travel<br><em>Itinerary</em></h1>
      <div class="overview">
        ${data.departureDate ? `<b>${fmtDate(data.departureDate)}</b>` : '<b>Date TBC</b>'}<br>
        ${esc(data.pkg.destination)}<br>
        ${esc(data.pkg.type.replace(/_/g, ' '))} &middot; ${data.pkg.days}D / ${data.pkg.nights}N
      </div>
    </div>

    ${data.pkg.itinerary.length > 0 ? `<div class="days">${dayBlocks}</div>` : ''}

    ${data.pkg.inclusions.length > 0 ? `
    <div class="inclusions" style="margin-top:24px;">
      <h4>Included in this package</h4>
      ${inclusionItems}
    </div>` : ''}

    <div class="iti-footer-note" style="margin-top:24px;">
      <span class="badge">Note</span>
      <div>
        Itinerary is indicative and subject to operational changes.
        ${data.specialRequests ? `<b>Special requests:</b> ${esc(data.specialRequests)}` : ''}
        ${data.preparedBy ? `Prepared by <b>${esc(data.preparedBy)}</b>.` : ''}
        Contact your agent for any queries before departure.
      </div>
    </div>

    <div class="page-num">PAGE 02 / ${String(totalPages).padStart(2, '0')}</div>
    <div class="page-label">Itinerary &middot; ${esc(data.bookingNumber)}</div>
  </article>` : '';

  // ── Full HTML ─────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(data.bookingNumber)} &middot; ${esc(data.agency.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${getCSS(accent)}</style>
</head>
<body>

<div class="no-print">
  <button class="print-btn" onclick="window.print()">&#8595; Save as PDF</button>
</div>

<div class="stack">

  <!-- ===== PAGE 1: BOOKING CONFIRMATION ===== -->
  <article class="page" data-page="01">

    <!-- Masthead -->
    <header class="masthead">
      <div class="brand">
        ${data.agency.logoUrl
          ? `<div class="logo-img"><img src="${esc(data.agency.logoUrl)}" alt="${esc(data.agency.name)} logo" /></div>`
          : `<div class="logo"><span>${esc(data.agency.name.charAt(0).toUpperCase())}</span></div>`}
        <div class="brand-word">
          ${esc(data.agency.name)}
          ${data.agency.tag ? `<small>${esc(data.agency.tag)}</small>` : ''}
        </div>
      </div>
      <div class="agency-meta">
        ${data.agency.registrationNo ? `<div class="name">${esc(data.agency.name)} (${esc(data.agency.registrationNo)})</div>` : `<div class="name">${esc(data.agency.name)}</div>`}
        ${data.agency.phone ? `<div class="row"><span class="label">Tel</span><span>${esc(data.agency.phone)}</span></div>` : ''}
        ${data.agency.email ? `<div class="row"><span class="label">Email</span><span>${esc(data.agency.email)}</span></div>` : ''}
        ${data.agency.address ? `<div class="row"><span class="label">Office</span><span>${esc(data.agency.address)}</span></div>` : ''}
        ${data.agency.city ? `<div class="row"><span class="label"></span><span>${esc(data.agency.city)}</span></div>` : ''}
      </div>
    </header>

    <!-- Document title -->
    <div class="doctitle">
      <h1>Booking<br><em>Confirmation</em></h1>
      <div class="refs">
        <div class="k">Booking No.</div>
        <div class="v">${esc(data.bookingNumber)}</div>
        <div class="k">Booking Date</div>
        <div class="v">${fmtDate(data.bookingDate)}</div>
        ${data.departureDate ? `<div class="k">Departure</div><div class="v">${fmtDate(data.departureDate)}</div>` : ''}
        <div class="k">Status</div>
        <div class="v" style="color:${statusColor(data.status, accent)};">${statusLabel(data.status)}</div>
      </div>
    </div>

    <!-- 01: Customer -->
    <section>
      <div class="sec-head">
        <h2>Billed To</h2>
        <span class="index">01 / 04</span>
      </div>
      <div class="kv">
        <div class="field">
          <div class="k">Full Name</div>
          <div class="v lg">${esc(data.customer.fullName)}</div>
        </div>
        <div class="field">
          <div class="k">Phone</div>
          <div class="v">${esc(data.customer.phone)}</div>
        </div>
        ${data.customer.email ? `
        <div class="field">
          <div class="k">Email</div>
          <div class="v">${esc(data.customer.email)}</div>
        </div>` : '<div class="field"></div>'}
        ${data.customer.icNumber ? `
        <div class="field">
          <div class="k">IC Number</div>
          <div class="v mono">${esc(data.customer.icNumber)}</div>
        </div>` : ''}
        ${data.customer.passportNumber ? `
        <div class="field">
          <div class="k">Passport</div>
          <div class="v mono">${esc(data.customer.passportNumber)}</div>
        </div>` : ''}
        ${data.customer.nationality ? `
        <div class="field">
          <div class="k">Nationality</div>
          <div class="v">${esc(data.customer.nationality)}</div>
        </div>` : ''}
      </div>
    </section>

    <!-- 02: Package -->
    <section>
      <div class="sec-head">
        <h2>Package Details</h2>
        <span class="index">02 / 04</span>
      </div>
      <div class="package">
        <div>
          <div class="pkg-name">${esc(data.pkg.name)}</div>
          <div class="pkg-sub">${esc(data.pkg.type.replace(/_/g, ' '))} &middot; ${esc(data.pkg.destination)}</div>
        </div>
        <div class="pills">
          <div class="pill">
            <span class="pill-k">Duration</span>
            <span>${data.pkg.days}D / ${data.pkg.nights}N</span>
          </div>
          ${data.departureDate ? `
          <div class="pill">
            <span class="pill-k">Departs</span>
            <span>${fmtShort(data.departureDate)}</span>
          </div>` : ''}
        </div>
      </div>
    </section>

    <!-- 03: Travelers -->
    <section>
      <div class="sec-head">
        <h2>Travellers</h2>
        <span class="index">03 / 04</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:44%">Name</th>
            <th style="width:14%">Type</th>
            <th style="width:24%">IC / Passport</th>
            <th style="width:18%" class="num">Room / Seat</th>
          </tr>
        </thead>
        <tbody>
          ${travelerRows || '<tr><td colspan="4" style="color:var(--muted);padding:16px 0;">No travelers added yet.</td></tr>'}
        </tbody>
      </table>
    </section>

    <!-- 04: Payment -->
    <section>
      <div class="sec-head">
        <h2>Payment Summary</h2>
        <span class="index">04 / 04</span>
      </div>
      <div class="pay-wrap">
        <div class="pay-left">
          <div class="notice">
            <h4>Booking Note</h4>
            ${data.specialRequests
              ? `Special requests: <b style="color:var(--ink);">${esc(data.specialRequests)}</b><br>`
              : 'No special requests noted.'}
            ${balance > 0
              ? `Outstanding balance of <b style="color:var(--ink);">${fmtMYR(balance)}</b> to be settled before departure.`
              : 'Payment has been received in full. Thank you.'}
            ${data.preparedBy
              ? `<br><br>Prepared by: <b style="color:var(--ink);">${esc(data.preparedBy)}</b>`
              : ''}
          </div>
          ${methods.length > 0 ? `
          <div class="methods">
            ${methods.map((m) => `<span class="method">${esc(m)}</span>`).join('')}
          </div>` : ''}
        </div>
        <div class="pay-table">
          ${paymentLines.join('')}
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="page-footer">
      <div class="terms">
        <strong>TERMS &amp; CONDITIONS &mdash;</strong>
        This booking confirmation is issued by ${esc(data.agency.name)}.
        Prices are quoted in Malaysian Ringgit (MYR)${data.pkg.isSSTApplicable ? ' and are inclusive of SST' : ''}.
        Cancellation terms apply as per the booking agreement.
        Travel insurance is strongly recommended.
        Passports must be valid for at least 6 months from the date of return.
      </div>
      <div class="thanks">
        Terima kasih, ${esc(firstName)}.
        <small>&mdash; ${esc(data.agency.name)}</small>
        ${data.agency.motacLicenseNumber ? `<small style="display:block;margin-top:3px;font-size:9px;opacity:.7;">MOTAC Lic: ${esc(data.agency.motacLicenseNumber)}</small>` : ''}
      </div>
    </footer>

    <div class="page-num">PAGE 01 / ${String(totalPages).padStart(2, '0')}</div>
    <div class="page-label">Booking &middot; ${esc(data.bookingNumber)}</div>
  </article>

  <!-- ===== PAGE 2: ITINERARY ===== -->
  ${page2}

</div>
</body>
</html>`;
}
