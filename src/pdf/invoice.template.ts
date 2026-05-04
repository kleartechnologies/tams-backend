// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceAgencyInfo {
  name: string;
  tag?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  primaryColor?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  bankNotes?: string | null;
  termsAndConditions?: string | null;
  refundPolicy?: string | null;
  motacLicenseNumber?: string | null;
  motacExpiryDate?: string | Date | null;
  sstEnabled?: boolean;
  defaultSstRate?: number;
}

export interface InvoiceTraveler {
  fullName: string;
  travelerType: string; // 'ADULT' | 'CHILD'
}

export interface InvoicePayment {
  amount: number;
  paymentType: string;
  paymentMethod: string;
  status: string;
  paymentDate: Date | string;
  referenceNumber?: string | null;
}

export interface InvoiceData {
  agency: InvoiceAgencyInfo;
  invoiceNumber: string;
  invoiceDate: Date | string;
  bookingNumber: string;
  bookingDate: Date | string;
  status: string;
  departureDate?: Date | string | null;
  specialRequests?: string | null;
  customer: {
    fullName: string;
    phone: string;
    email?: string | null;
    icNumber?: string | null;
    passportNumber?: string | null;
    nationality?: string | null;
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
  };
  travelers: InvoiceTraveler[];
  payments: InvoicePayment[];
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

function humanizeMethod(m: string): string {
  const map: Record<string, string> = {
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank Transfer',
    ONLINE_BANKING: 'Online Banking',
    CREDIT_CARD: 'Credit / Debit Card',
    CHEQUE: 'Cheque',
  };
  return map[m] ?? m.replace(/_/g, ' ');
}

function humanizeType(t: string): string {
  return t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function pkgTypeLabel(t: string): string {
  const map: Record<string, string> = {
    GROUP_TOUR: 'Group Tour',
    PRIVATE_TOUR: 'Private Tour',
    UMRAH: 'Umrah',
    HAJJ: 'Hajj',
  };
  return map[t] ?? t;
}

function accentSoft(hex: string): string {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},0.06)`;
  } catch {
    return '#EEF2F1';
  }
}

function paymentStatusInfo(totalAmount: number, paidAmount: number): { label: string; color: string; bg: string } {
  if (paidAmount >= totalAmount && totalAmount > 0) {
    return { label: 'FULLY PAID', color: '#065F46', bg: '#D1FAE5' };
  }
  if (paidAmount > 0) {
    return { label: 'PARTIALLY PAID', color: '#92400E', bg: '#FEF3C7' };
  }
  return { label: 'UNPAID', color: '#991B1B', bg: '#FEE2E2' };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

import { buildInvoiceClassicHTML }  from './templates/invoice.classic';
import { buildInvoicePremiumHTML }  from './templates/invoice.premium';

export function buildInvoiceHTML(data: InvoiceData, template = 'modern'): string {
  switch (template) {
    case 'classic': return buildInvoiceClassicHTML(data);
    case 'premium': return buildInvoicePremiumHTML(data);
    default:        return buildModernInvoiceHTML(data);
  }
}

// ── Modern template (default) ─────────────────────────────────────────────────

function buildModernInvoiceHTML(data: InvoiceData): string {
  const accent     = data.agency.primaryColor ?? '#1F4E4A';
  const accentFg   = '#ffffff';
  const soft       = accentSoft(accent);

  // ── Calculations ────────────────────────────────────────────────────────────
  const adults        = data.travelers.filter((t) => t.travelerType === 'ADULT');
  const children      = data.travelers.filter((t) => t.travelerType === 'CHILD');
  const adultTotal    = adults.length   * data.pkg.adultPrice;
  const childTotal    = children.length * data.pkg.childPrice;
  const subtotal      = adultTotal + childTotal;

  // SST: apply if package is SST-applicable AND agency has SST enabled globally
  const applySst   = data.pkg.isSSTApplicable && (data.agency.sstEnabled ?? false);
  const sstRate    = applySst ? (data.agency.defaultSstRate ?? data.pkg.sstRate) : 0;
  const sstAmt     = applySst ? Math.round(subtotal * sstRate) / 100 : 0;
  const total      = subtotal + sstAmt;

  const verifiedPmts = data.payments.filter((p) => p.status === 'VERIFIED');
  const paidAmt      = verifiedPmts.reduce((s, p) => s + Number(p.amount), 0);
  const balance      = Math.max(0, total - paidAmt);

  const payStatus   = paymentStatusInfo(total, paidAmt);
  const logoInitial = (data.agency.name ?? 'T').charAt(0).toUpperCase();
  const hasPaymentInstructions = !!(
    data.agency.bankName ||
    data.agency.bankAccountNumber ||
    data.agency.bankAccountHolder
  );

  // ── Traveler rows ────────────────────────────────────────────────────────────
  const travelerRows = data.travelers.map((t, i) => `
    <tr>
      <td class="idx-cell">${i + 1}</td>
      <td class="name-cell">${esc(t.fullName)}</td>
      <td><span class="type-pill ${t.travelerType === 'CHILD' ? 'child' : 'adult'}">${t.travelerType === 'CHILD' ? 'Child' : 'Adult'}</span></td>
    </tr>`).join('');

  // ── Payment history rows ──────────────────────────────────────────────────────
  const paymentRows = data.payments.map((p) => `
    <tr>
      <td>${esc(fmtDate(p.paymentDate))}</td>
      <td>${esc(humanizeType(p.paymentType))}</td>
      <td>${esc(humanizeMethod(p.paymentMethod))}</td>
      <td class="num-cell">${esc(fmtMYR(Number(p.amount)))}</td>
      <td><span class="pstatus ${p.status.toLowerCase()}">${p.status}</span></td>
      <td class="ref-cell">${esc(p.referenceNumber ?? '—')}</td>
    </tr>`).join('');

  // ── Terms / refund ────────────────────────────────────────────────────────────
  const termsText   = data.agency.termsAndConditions ??
    'Payment is non-refundable unless otherwise stated. Package rates are subject to change without prior notice. Travel insurance is strongly recommended.';
  const refundText  = data.agency.refundPolicy ??
    'Cancellations made 30+ days before departure: 90% refund. 15–29 days: 50% refund. Less than 14 days: no refund.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invoice ${esc(data.invoiceNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root {
    --accent: ${accent};
    --accent-soft: ${soft};
    --accent-fg: ${accentFg};
    --ink: #111111;
    --ink-2: #374151;
    --muted: #6B7280;
    --hair: #E5E7EB;
    --rule: #D1D5DB;
    --paper: #FFFFFF;
    --bg: #F3F4F6;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: var(--bg);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }
  body { padding: 40px 20px 80px; }

  /* ── Page wrapper ──────────────────────────────────────────────── */
  .invoice-page {
    width: 794px;
    min-height: 1123px;
    background: var(--paper);
    margin: 0 auto;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,.07), 0 20px 60px -10px rgba(0,0,0,.18);
    display: flex;
    flex-direction: column;
  }

  /* ── Header bar ────────────────────────────────────────────────── */
  .inv-header {
    background: var(--accent);
    color: var(--accent-fg);
    padding: 28px 40px 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .inv-header .brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .inv-header .logo-wrap {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    background: rgba(255,255,255,0.15);
    border: 1.5px solid rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    padding: 6px;
  }
  .inv-header .logo-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .inv-header .logo-initial {
    font-size: 22px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
  }
  .inv-header .brand-text .name {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.15;
  }
  .inv-header .brand-text .tag {
    font-size: 11px;
    opacity: 0.75;
    margin-top: 2px;
    font-weight: 400;
  }
  .inv-header .doc-info {
    text-align: right;
  }
  .inv-header .doc-info .doc-label {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.06em;
    line-height: 1;
    opacity: 0.95;
  }
  .inv-header .doc-info .inv-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    margin-top: 6px;
    opacity: 0.85;
  }
  .inv-header .doc-info .inv-date {
    font-size: 11px;
    opacity: 0.65;
    margin-top: 3px;
  }

  /* ── Body ──────────────────────────────────────────────────────── */
  .inv-body { padding: 32px 40px; flex: 1; display: flex; flex-direction: column; gap: 0; }

  /* ── Bill-to + booking details row ─────────────────────────────── */
  .info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--hair);
  }
  .info-block .block-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 8px;
  }
  .info-block .customer-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 6px;
  }
  .info-block .info-line {
    font-size: 12px;
    color: var(--ink-2);
    line-height: 1.6;
  }
  .info-block .info-line .lbl {
    color: var(--muted);
    font-size: 11px;
    display: inline-block;
    width: 90px;
  }

  /* ── Status pill ─────────────────────────────────────────────────── */
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 99px;
    border: 1px solid currentColor;
  }
  .status-pill::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  /* ── Package strip ───────────────────────────────────────────────── */
  .pkg-strip {
    margin: 22px 0 0;
    background: var(--accent-soft);
    border: 1px solid var(--hair);
    border-left: 3px solid var(--accent);
    padding: 14px 18px;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 16px;
  }
  .pkg-strip .pkg-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.2;
  }
  .pkg-strip .pkg-meta {
    font-size: 11px;
    color: var(--muted);
    margin-top: 4px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .pkg-strip .pkg-meta span::before {
    content: "·";
    margin-right: 12px;
    color: var(--rule);
  }
  .pkg-strip .pkg-meta span:first-child::before { content: ""; margin: 0; }
  .pkg-type-badge {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 6px;
    background: var(--accent);
    color: var(--accent-fg);
    white-space: nowrap;
  }

  /* ── Two-column content area ─────────────────────────────────────── */
  .content-grid {
    margin-top: 22px;
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 28px;
    align-items: start;
  }

  /* ── Section heading ─────────────────────────────────────────────── */
  .sec-head {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }

  /* ── Travelers table ─────────────────────────────────────────────── */
  .tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .tbl thead th {
    text-align: left;
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    padding: 0 8px 8px 0;
    border-bottom: 1px solid var(--rule);
  }
  .tbl tbody td {
    padding: 9px 8px 9px 0;
    border-bottom: 1px solid var(--hair);
    color: var(--ink-2);
    vertical-align: middle;
  }
  .tbl tbody tr:last-child td { border-bottom: none; }
  .tbl .idx-cell { color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 10px; width: 24px; }
  .tbl .name-cell { font-weight: 500; color: var(--ink); }
  .tbl .num-cell { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
  .tbl .ref-cell { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); }
  .type-pill {
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 4px;
  }
  .type-pill.adult { background: #DBEAFE; color: #1E40AF; }
  .type-pill.child { background: #EDE9FE; color: #5B21B6; }
  .pstatus {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 7px;
    border-radius: 4px;
  }
  .pstatus.verified { background: #D1FAE5; color: #065F46; }
  .pstatus.pending  { background: #FEF3C7; color: #92400E; }
  .pstatus.failed   { background: #FEE2E2; color: #991B1B; }

  /* ── Pricing panel ───────────────────────────────────────────────── */
  .price-panel {
    background: var(--bg);
    border: 1px solid var(--hair);
    border-radius: 8px;
    overflow: hidden;
  }
  .price-panel .panel-head {
    background: var(--accent);
    color: var(--accent-fg);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 8px 14px;
  }
  .price-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 9px 14px;
    border-bottom: 1px solid var(--hair);
    font-size: 12px;
  }
  .price-row:last-child { border-bottom: none; }
  .price-row .desc { color: var(--ink-2); }
  .price-row .desc small { font-size: 10px; color: var(--muted); display: block; }
  .price-row .val { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--ink); }
  .price-row.subtotal { border-top: 1px solid var(--rule); }
  .price-row.total-row {
    background: var(--accent);
    padding: 12px 14px;
    border-bottom: none;
  }
  .price-row.total-row .desc { color: rgba(255,255,255,0.85); font-weight: 600; font-size: 13px; }
  .price-row.total-row .val  { color: #ffffff; font-weight: 700; font-size: 16px; }

  /* ── Payment summary ─────────────────────────────────────────────── */
  .pay-summary {
    margin-top: 22px;
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 28px;
    align-items: start;
  }
  .pay-summary-panel {
    background: var(--bg);
    border: 1px solid var(--hair);
    border-radius: 8px;
    overflow: hidden;
  }
  .pay-summary-panel .panel-head {
    background: var(--accent);
    color: var(--accent-fg);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 8px 14px;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--hair);
    font-size: 12px;
  }
  .summary-row:last-child { border-bottom: none; }
  .summary-row .lbl { color: var(--muted); font-size: 11px; }
  .summary-row .val { font-weight: 600; font-variant-numeric: tabular-nums; }
  .summary-row.balance-row .lbl { color: var(--ink); font-weight: 600; font-size: 12px; }
  .summary-row.balance-row .val { color: #B91C1C; font-size: 14px; }
  .pay-status-badge {
    margin: 12px 14px 14px;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
    background: ${payStatus.bg};
    color: ${payStatus.color};
  }

  /* ── Payment instructions ────────────────────────────────────────── */
  .pay-instructions {
    background: var(--bg);
    border: 1px solid var(--hair);
    border-radius: 8px;
    padding: 16px 18px;
  }
  .pay-instructions .pi-head {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
  }
  .pi-row {
    display: flex;
    gap: 8px;
    margin-bottom: 7px;
    font-size: 12px;
  }
  .pi-row .pi-lbl {
    color: var(--muted);
    font-size: 11px;
    min-width: 110px;
    flex-shrink: 0;
  }
  .pi-row .pi-val { color: var(--ink-2); font-weight: 500; }
  .pi-notes {
    margin-top: 10px;
    padding: 8px 12px;
    background: var(--accent-soft);
    border-left: 2px solid var(--accent);
    font-size: 11px;
    color: var(--ink-2);
    line-height: 1.5;
  }

  /* ── Payments history ────────────────────────────────────────────── */
  .pay-history { margin-top: 22px; }

  /* ── Footer ──────────────────────────────────────────────────────── */
  .inv-footer {
    margin-top: auto;
    padding-top: 22px;
    border-top: 1px solid var(--hair);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }
  .footer-block .fb-head {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .footer-block p {
    font-size: 10px;
    color: var(--muted);
    line-height: 1.6;
  }
  .inv-footer-bar {
    margin-top: 20px;
    padding: 10px 40px;
    background: var(--accent);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    color: rgba(255,255,255,0.7);
  }
  .inv-footer-bar .gen-by { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em; }
  .inv-footer-bar .inv-ref { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em; font-weight: 500; color: rgba(255,255,255,0.9); }

  /* ── Print / PDF ─────────────────────────────────────────────────── */
  .no-print { position: fixed; top: 20px; right: 20px; z-index: 999; }
  .print-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .print-btn:hover { opacity: 0.9; }

  @page { size: A4 portrait; margin: 0; }
  @media print {
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { background: white; padding: 0; }
    .invoice-page { box-shadow: none; min-height: 297mm; width: 210mm; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<!-- floating print button -->
<div class="no-print">
  <button class="print-btn" onclick="window.print()">Save as PDF</button>
</div>

<div class="invoice-page">

  <!-- ═══ HEADER ════════════════════════════════════════════════════════════ -->
  <div class="inv-header">
    <div class="brand">
      <div class="logo-wrap">
        ${data.agency.logoUrl
          ? `<img src="${esc(data.agency.logoUrl)}" alt="${esc(data.agency.name)} logo" style="width:100%;height:100%;object-fit:contain;display:block;" />`
          : `<span class="logo-initial">${esc(logoInitial)}</span>`}
      </div>
      <div class="brand-text">
        <div class="name">${esc(data.agency.name)}</div>
        ${data.agency.tag ? `<div class="tag">${esc(data.agency.tag)}</div>` : ''}
        ${data.agency.address ? `<div class="tag" style="margin-top:6px;opacity:0.6;font-size:10px;">${esc(data.agency.address)}</div>` : ''}
        <div class="tag" style="margin-top:4px;opacity:0.65;font-size:10px;">
          ${[data.agency.phone, data.agency.email].filter(Boolean).join('  ·  ')}
        </div>
        ${data.agency.motacLicenseNumber ? `<div class="tag" style="margin-top:4px;font-size:9.5px;font-weight:600;opacity:0.75;letter-spacing:0.03em;">MOTAC Lic: ${esc(data.agency.motacLicenseNumber)}${data.agency.motacExpiryDate ? ` &nbsp;(exp. ${esc(fmtDate(data.agency.motacExpiryDate))})` : ''}</div>` : ''}
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-label">INVOICE</div>
      <div class="inv-num">${esc(data.invoiceNumber)}</div>
      <div class="inv-date">Date: ${esc(fmtDate(data.invoiceDate))}</div>
    </div>
  </div>

  <!-- ═══ BODY ══════════════════════════════════════════════════════════════ -->
  <div class="inv-body">

    <!-- Bill-to + Booking reference -->
    <div class="info-row">
      <div class="info-block">
        <div class="block-label">Bill To</div>
        <div class="customer-name">${esc(data.customer.fullName)}</div>
        <div class="info-line"><span class="lbl">Phone</span>${esc(data.customer.phone)}</div>
        ${data.customer.email  ? `<div class="info-line"><span class="lbl">Email</span>${esc(data.customer.email)}</div>` : ''}
        ${data.customer.icNumber ? `<div class="info-line"><span class="lbl">IC No.</span>${esc(data.customer.icNumber)}</div>` : ''}
        ${data.customer.passportNumber ? `<div class="info-line"><span class="lbl">Passport</span>${esc(data.customer.passportNumber)}</div>` : ''}
        ${data.customer.nationality ? `<div class="info-line"><span class="lbl">Nationality</span>${esc(data.customer.nationality)}</div>` : ''}
      </div>
      <div class="info-block">
        <div class="block-label">Invoice Details</div>
        <div class="info-line"><span class="lbl">Invoice No.</span><strong>${esc(data.invoiceNumber)}</strong></div>
        <div class="info-line"><span class="lbl">Booking No.</span>${esc(data.bookingNumber)}</div>
        <div class="info-line"><span class="lbl">Booking Date</span>${esc(fmtDate(data.bookingDate))}</div>
        ${data.departureDate ? `<div class="info-line"><span class="lbl">Departure</span>${esc(fmtDate(data.departureDate))}</div>` : ''}
        <div class="info-line" style="margin-top:10px;">
          <span class="status-pill" style="color:${payStatus.color};background:${payStatus.bg};border-color:${payStatus.color}20;">
            ${esc(payStatus.label)}
          </span>
        </div>
      </div>
    </div>

    <!-- Package strip -->
    <div class="pkg-strip">
      <div>
        <div class="pkg-name">${esc(data.pkg.name)}</div>
        <div class="pkg-meta">
          <span>${esc(data.pkg.destination)}</span>
          <span>${esc(data.pkg.days)} Days / ${esc(data.pkg.nights)} Nights</span>
          ${data.departureDate ? `<span>Departs ${esc(fmtDate(data.departureDate))}</span>` : ''}
        </div>
      </div>
      <span class="pkg-type-badge">${esc(pkgTypeLabel(data.pkg.type))}</span>
    </div>

    <!-- Travelers + Pricing -->
    <div class="content-grid">
      <!-- Left: travelers -->
      <div>
        <div class="sec-head">Travelers (${data.travelers.length} pax)</div>
        <table class="tbl">
          <thead>
            <tr>
              <th style="width:24px;">#</th>
              <th>Name</th>
              <th style="width:60px;">Type</th>
            </tr>
          </thead>
          <tbody>${travelerRows}</tbody>
        </table>
        ${data.specialRequests ? `
        <div style="margin-top:12px;padding:10px 12px;background:var(--bg);border:1px solid var(--hair);border-radius:6px;font-size:11px;color:var(--ink-2);">
          <span style="font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:4px;">Special Requests</span>
          ${esc(data.specialRequests)}
        </div>` : ''}
      </div>

      <!-- Right: pricing panel -->
      <div>
        <div class="sec-head">Pricing</div>
        <div class="price-panel">
          <div class="panel-head">Breakdown</div>
          ${adults.length > 0 ? `
          <div class="price-row">
            <span class="desc">Adult <small>${adults.length} pax × ${esc(fmtMYR(data.pkg.adultPrice))}</small></span>
            <span class="val">${esc(fmtMYR(adultTotal))}</span>
          </div>` : ''}
          ${children.length > 0 ? `
          <div class="price-row">
            <span class="desc">Child <small>${children.length} pax × ${esc(fmtMYR(data.pkg.childPrice))}</small></span>
            <span class="val">${esc(fmtMYR(childTotal))}</span>
          </div>` : ''}
          <div class="price-row subtotal">
            <span class="desc">Subtotal</span>
            <span class="val">${esc(fmtMYR(subtotal))}</span>
          </div>
          ${applySst ? `
          <div class="price-row">
            <span class="desc">SST (${sstRate}%)</span>
            <span class="val">${esc(fmtMYR(sstAmt))}</span>
          </div>` : ''}
          <div class="price-row total-row">
            <span class="desc">Total</span>
            <span class="val">${esc(fmtMYR(total))}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment summary + Payment instructions -->
    <div class="pay-summary">
      <!-- Left: instructions -->
      <div>
        ${hasPaymentInstructions ? `
        <div class="sec-head">Payment Instructions</div>
        <div class="pay-instructions">
          <div class="pi-head">How to Pay</div>
          ${data.agency.bankName ? `
          <div class="pi-row"><span class="pi-lbl">Bank</span><span class="pi-val">${esc(data.agency.bankName)}</span></div>` : ''}
          ${data.agency.bankAccountNumber ? `
          <div class="pi-row"><span class="pi-lbl">Account Number</span><span class="pi-val">${esc(data.agency.bankAccountNumber)}</span></div>` : ''}
          ${data.agency.bankAccountHolder ? `
          <div class="pi-row"><span class="pi-lbl">Account Holder</span><span class="pi-val">${esc(data.agency.bankAccountHolder)}</span></div>` : ''}
          ${data.agency.bankNotes ? `<div class="pi-notes">${esc(data.agency.bankNotes)}</div>` : ''}
        </div>` : `
        <div class="sec-head">Payment Instructions</div>
        <div style="font-size:11px;color:var(--muted);font-style:italic;">
          No payment instructions configured. Add them in Settings → Invoice Settings.
        </div>`}
      </div>

      <!-- Right: payment summary panel -->
      <div>
        <div class="sec-head">Payment Summary</div>
        <div class="pay-summary-panel">
          <div class="panel-head">Account Summary</div>
          <div class="summary-row">
            <span class="lbl">Invoice Total</span>
            <span class="val">${esc(fmtMYR(total))}</span>
          </div>
          <div class="summary-row">
            <span class="lbl">Paid (Verified)</span>
            <span class="val" style="color:#065F46;">${esc(fmtMYR(paidAmt))}</span>
          </div>
          ${balance > 0 ? `
          <div class="summary-row balance-row">
            <span class="lbl">Balance Due</span>
            <span class="val">${esc(fmtMYR(balance))}</span>
          </div>` : ''}
          <div class="pay-status-badge">${esc(payStatus.label)}</div>
        </div>
      </div>
    </div>

    <!-- Payment history -->
    ${data.payments.length > 0 ? `
    <div class="pay-history">
      <div class="sec-head" style="margin-bottom:10px;">Payment History</div>
      <table class="tbl">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Method</th>
            <th class="num-cell">Amount</th>
            <th>Status</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>${paymentRows}</tbody>
      </table>
    </div>` : ''}

    <!-- Footer: T&C + Refund -->
    <div class="inv-footer" style="margin-top:28px;">
      <div class="footer-block">
        <div class="fb-head">Terms &amp; Conditions</div>
        <p>${esc(termsText)}</p>
      </div>
      <div class="footer-block">
        <div class="fb-head">Refund Policy</div>
        <p>${esc(refundText)}</p>
      </div>
    </div>

  </div><!-- /inv-body -->

  <!-- ═══ FOOTER BAR ════════════════════════════════════════════════════════ -->
  <div class="inv-footer-bar">
    <span class="gen-by">Generated by TAMS &middot; ${esc(fmtDate(new Date()))}${data.agency.motacLicenseNumber ? ` &middot; MOTAC: ${esc(data.agency.motacLicenseNumber)}` : ''}</span>
    <span class="inv-ref">${esc(data.invoiceNumber)} &middot; ${esc(data.bookingNumber)}</span>
  </div>

</div><!-- /invoice-page -->

</body>
</html>`;
}
