import { SaleTransaction, ShopSettings } from '../types';
import { SA_BROTHERS_LOGO_DATA_URL } from '../assets/images/logoDataUrl';

export function renderReceiptSlipHtml(
  transaction: SaleTransaction,
  customSettings?: Partial<ShopSettings>
): string {
  const shopName = customSettings?.shopName || 'S.A. BROTHERS VENDORS';
  const tagline = customSettings?.tagline || 'Court Stamp Vendors & Legal Paper';
  const address = customSettings?.address || 'Shop #14, District Court Complex, Main Law Bazaar';
  const helpline = customSettings?.helpline || '+923401645979 +923002634491';
  const licenseNumber = customSettings?.licenseNumber || 'Gos-KHI 18';
  const currency = customSettings?.currency || 'PKR';
  const headerNote = customSettings?.receiptHeader || 'Thank you for choosing SA Brothers Vendors!';
  const footerNote = customSettings?.receiptFooter || 'Court stamp papers & legal forms verified authentic. Shukriya!';

  const formattedDateTime = new Date(transaction.timestamp).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formatPkr = (amt: number) => {
    const num = Number(amt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency.length > 1 ? `${currency} ${num}` : `${currency}${num}`;
  };

  const totalItemsCount = transaction.items.reduce((acc, i) => acc + i.quantity, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${transaction.receiptNumber} - ${shopName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    /* 80mm POS Thermal Receipt Size */
    @page {
      size: 80mm auto;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #000000;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* Top Action Bar (Hidden during physical print) */
    .top-action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .top-action-bar .brand-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 12.5px;
    }
    .top-action-bar .brand-badge .pill-80mm {
      background: #d97706;
      color: #ffffff;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .top-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      cursor: pointer;
      border: none;
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 11.5px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .btn-print {
      background: #d97706;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #b45309;
    }
    .btn-close {
      background: #334155;
      color: #f8fafc;
    }
    .btn-close:hover {
      background: #475569;
    }

    /* 80mm Slip Container */
    .slip-80mm {
      width: 78mm;
      max-width: 80mm;
      margin: 16px auto;
      background: #ffffff;
      color: #000000;
      padding: 5mm 3.5mm;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: "Courier New", Courier, monospace; }
    .uppercase { text-transform: uppercase; }

    .logo-wrapper {
      width: 62px;
      height: 62px;
      margin: 4px auto 4px auto;
      border-radius: 50%;
      border: 2px solid #000000;
      background: #ffffff;
      padding: 1.5px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .logo-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
      object-fit: contain;
    }

    .shop-title {
      font-size: 15px;
      font-weight: 900;
      margin: 0;
      color: #000000;
      font-family: Georgia, serif;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }
    .shop-sub {
      font-size: 9.5px;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin: 2px 0;
    }
    .shop-address {
      font-size: 8.5px;
      color: #333333;
      margin: 1px 0;
    }

    .reg-badge {
      border: 1px solid #000000;
      padding: 2.5px 5px;
      font-size: 8px;
      font-family: monospace;
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-weight: bold;
    }

    .divider-dash {
      border-bottom: 1px dashed #000000;
      margin: 6px 0;
    }
    .divider-solid {
      border-bottom: 1.5px solid #000000;
      margin: 6px 0;
    }
    .divider-double {
      border-top: 1.5px solid #000000;
      border-bottom: 1.5px solid #000000;
      padding: 4px 0;
      margin: 6px 0;
    }

    /* Meta rows */
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      margin: 2px 0;
      font-family: monospace;
    }
    .meta-row .val {
      font-weight: bold;
      color: #000000;
    }

    /* Items Table */
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
    }
    table.items-table th {
      font-size: 8.5px;
      font-weight: 900;
      text-transform: uppercase;
      border-bottom: 1.5px solid #000000;
      padding: 3px 1px;
      color: #000000;
    }
    table.items-table td {
      font-size: 9.5px;
      padding: 4px 1px;
      vertical-align: top;
      border-bottom: 1px dotted #e2e8f0;
    }
    .item-desc {
      font-weight: bold;
      color: #000000;
      line-height: 1.2;
    }
    .item-rate {
      font-size: 8px;
      color: #555555;
      font-family: monospace;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      font-family: monospace;
      margin: 2px 0;
    }

    .barcode-box {
      margin: 8px 0 4px 0;
      text-align: center;
    }
    .barcode-visual {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      padding: 3px 12px;
      font-family: monospace;
      font-size: 9.5px;
      font-weight: 900;
      letter-spacing: 3px;
      border-radius: 2px;
    }

    .footer-note {
      text-align: center;
      font-size: 8px;
      color: #444444;
      margin-top: 6px;
      line-height: 1.3;
    }

    /* Physical 80mm Print Rules */
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print,
      .top-action-bar {
        display: none !important;
      }
      .slip-80mm {
        width: 100% !important;
        max-width: 80mm !important;
        margin: 0 auto !important;
        padding: 8mm 2mm 4mm 2mm !important; /* Generous top breathing margin so thermal paper tear/cut never touches logo */
        border: none !important;
        box-shadow: none !important;
      }
      .logo-wrapper {
        margin: 2px auto 4px auto !important;
        padding: 1.5px !important;
      }
      .logo-img {
        object-fit: contain !important;
        display: block !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top Action Toolbar (Hidden on physical print) -->
  <div class="top-action-bar no-print">
    <div class="brand-badge">
      <span class="pill-80mm">80MM ROLL</span>
      <div>${shopName} · #${transaction.receiptNumber}</div>
    </div>
    
    <div class="top-buttons">
      <button onclick="triggerPrintDialog()" class="btn btn-print">
        🖨️ Print 80mm Receipt (Ctrl+P)
      </button>
      <button onclick="window.close()" class="btn btn-close">
        ✕ Close
      </button>
    </div>
  </div>

  <!-- 80mm Thermal Receipt Canvas -->
  <div class="slip-80mm">
    
    <!-- BRANDING HEADER WITH SA BROTHERS EMBLEM -->
    <div class="text-center">
      <div class="logo-wrapper">
        <img src="${SA_BROTHERS_LOGO_DATA_URL}" alt="Logo" class="logo-img" width="58" height="58" />
      </div>
      <h1 class="shop-title">${shopName.toUpperCase()}</h1>
      <p class="shop-sub">${tagline}</p>
      <p class="shop-address">${address}</p>
      <p class="shop-address font-mono" style="font-weight: bold; font-size: 8.5px; color: #111; margin: 2px 0;">Helpline: ${helpline}</p>
      
      <div class="reg-badge">
        <span>Lic : ${licenseNumber}</span>
        <span>DISTRICT &amp; SESSIONS COURTS</span>
      </div>
      ${
        transaction.status === 'refunded'
          ? `<div style="border: 1.5px solid #dc2626; background: #fef2f2; color: #991b1b; padding: 3px 6px; font-size: 8.5px; font-family: monospace; font-weight: bold; margin: 4px 0;">STATUS: REFUNDED ${
              transaction.refundReason ? `(${transaction.refundReason})` : ''
            }</div>`
          : ''
      }
    </div>

    <div class="divider-solid"></div>

    <!-- METADATA -->
    <div>
      <div class="meta-row">
        <span>RECEIPT NO:</span>
        <span class="val font-mono">${transaction.receiptNumber}</span>
      </div>
      <div class="meta-row">
        <span>DATE &amp; TIME:</span>
        <span class="val">${formattedDateTime}</span>
      </div>
      <div class="meta-row">
        <span>CASHIER:</span>
        <span class="val">${transaction.cashierName}</span>
      </div>
      ${
        transaction.customerName
          ? `
      <div class="meta-row" style="border-top: 1px dotted #ccc; padding-top: 2px;">
        <span>CLIENT:</span>
        <span class="val">${transaction.customerName}</span>
      </div>`
          : ''
      }
      ${
        transaction.customerPhone
          ? `
      <div class="meta-row">
        <span>CONTACT:</span>
        <span class="val">${transaction.customerPhone}</span>
      </div>`
          : ''
      }
    </div>

    <div class="divider-dash"></div>

    <!-- ITEMS TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 8%; text-align: left;">#</th>
          <th style="width: 56%; text-align: left;">ITEM</th>
          <th style="width: 14%; text-align: center;">QTY</th>
          <th style="width: 22%; text-align: right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${transaction.items
          .map(
            (item, idx) => `
        <tr>
          <td style="color: #666; font-family: monospace;">${String(idx + 1).padStart(2, '0')}</td>
          <td>
            <div class="item-desc">${item.name}</div>
            <div class="item-rate">${item.quantity} × ${formatPkr(item.unitPrice)}</div>
          </td>
          <td style="text-align: center; font-family: monospace; font-weight: bold;">${item.quantity}</td>
          <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatPkr(item.total)}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="divider-dash"></div>

    <!-- TOTALS -->
    <div>
      <div class="totals-row">
        <span>Total Items:</span>
        <span class="font-bold">${totalItemsCount} units</span>
      </div>
      <div class="totals-row">
        <span>Subtotal:</span>
        <span class="font-bold">${formatPkr(transaction.subtotal)}</span>
      </div>
      ${
        transaction.discountAmount > 0
          ? `
      <div class="totals-row" style="color: #059669;">
        <span>Discount (${transaction.discountPercent}%):</span>
        <span class="font-bold">-${formatPkr(transaction.discountAmount)}</span>
      </div>`
          : ''
      }
      <div class="totals-row" style="font-size: 8px; color: #555;">
        <span>Govt Tax (Stamp Duty Exempt):</span>
        <span>0.00 (0%)</span>
      </div>

      <!-- Prominent Net Total -->
      <div class="divider-double" style="display: flex; justify-content: space-between; align-items: baseline;">
        <div>
          <div style="font-size: 9.5px; font-weight: 900; letter-spacing: 0.5px;">NET TOTAL DUE:</div>
          <div style="font-size: 7.5px; color: #555;">Pakistani Rupees</div>
        </div>
        <div style="font-size: 14px; font-weight: 900; font-family: monospace;">
          ${formatPkr(transaction.grandTotal)}
        </div>
      </div>

      <div class="totals-row">
        <span class="uppercase">PAID VIA ${transaction.paymentMethod}:</span>
        <span class="font-bold">${formatPkr(transaction.amountTendered)}</span>
      </div>
      <div class="totals-row" style="background: #f8fafc; padding: 2px 4px; border: 1px solid #e2e8f0; border-radius: 2px;">
        <span style="font-weight: 800;">CHANGE RETURNED:</span>
        <span style="font-weight: 900; font-family: monospace;">${formatPkr(transaction.changeDue)}</span>
      </div>
    </div>

    <!-- BARCODE & VERIFICATION -->
    <div class="barcode-box">
      <div class="barcode-visual">|||| || ||||| ||| || |||||| | ||||</div>
      <div style="font-size: 8px; font-family: monospace; color: #666; margin-top: 2px;">*${transaction.receiptNumber}*</div>
    </div>

    <!-- FOOTER LEGAL NOTICE -->
    <div class="footer-note">
      <div style="font-weight: bold; text-transform: uppercase; font-size: 8.5px;">${headerNote}</div>
      <div>${footerNote}</div>
      <div style="font-size: 7px; color: #888; margin-top: 3px;">
        Legal stamp papers once issued cannot be refunded as per District Treasury Rules &amp; The Stamp Act 1899.
      </div>
    </div>

  </div>

  <script>
    function triggerPrintDialog() {
      window.focus();
      window.print();
    }
    window.onload = function() {
      setTimeout(function() {
        triggerPrintDialog();
      }, 350);
    };
  </script>
</body>
</html>`;
}
