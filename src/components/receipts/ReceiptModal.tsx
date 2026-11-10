import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { SaleTransaction } from '../../types';
import {
  Printer,
  Download,
  X,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Receipt,
  ExternalLink,
} from 'lucide-react';
import { SA_BROTHERS_LOGO_DATA_URL } from '../../assets/images/logoDataUrl';
import { renderReceiptSlipHtml } from '../../services/receiptHtmlGenerator';

interface ReceiptModalProps {
  transaction: SaleTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { settings, formatCurrency } = useShop();
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullScreenPrint, setIsFullScreenPrint] = useState<boolean>(false);
  const [printStatusMessage, setPrintStatusMessage] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Pre-register receipt in backend for clean print URLs
  useEffect(() => {
    if (isOpen && transaction) {
      fetch('/api/prepare-print-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction, settings }),
      }).catch(() => {});
    }
  }, [isOpen, transaction, settings]);

  if (!isOpen || !transaction) return null;

  const formattedDateTime = new Date(transaction.timestamp).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const printWindowUrl = transaction
    ? `/print-slip?receipt=${encodeURIComponent(JSON.stringify(transaction))}`
    : '#';

  // Primary Print Function: Dedicated Isolated 80mm Iframe Print
  const handlePrint = () => {
    setPrintStatusMessage('Opening 80mm Print Dialog...');

    try {
      const html = renderReceiptSlipHtml(transaction, settings);

      let iframe = document.getElementById('receipt-80mm-print-frame') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'receipt-80mm-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setPrintStatusMessage('Print job sent at 80mm size!');
          }
        }, 200);
      }
    } catch (err: any) {
      console.warn('Iframe print error, falling back to window.print:', err);
      window.focus();
      window.print();
    }
  };

  // Download self-contained 80mm HTML slip
  const handleDownloadHtmlSlip = () => {
    const html = renderReceiptSlipHtml(transaction, settings);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `80mm-Receipt-${transaction.receiptNumber}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setPrintStatusMessage('Downloaded 80mm HTML receipt.');
  };

  const handleCopyWhatsApp = async () => {
    const helpline = settings.helpline || '+923401645979 +923002634491';
    const licNum = settings.licenseNumber || 'Gos-KHI 18';

    const textLines = [
      `🏛️ *${settings.shopName.toUpperCase()}*`,
      `📜 _Court Stamp Vendors & Legal Paper Specialists_`,
      `📍 ${settings.address}`,
      `📞 Helpline: ${helpline}`,
      `⚖️ Lic : ${licNum} (District & Sessions Courts)`,
      `----------------------------------------`,
      `🧾 *RECEIPT NO:* ${transaction.receiptNumber}`,
      `📅 *DATE:* ${formattedDateTime}`,
      `👤 *CASHIER:* ${transaction.cashierName}`,
      transaction.customerName ? `🧑‍💼 *CLIENT:* ${transaction.customerName}` : null,
      `----------------------------------------`,
      `*ITEMS PURCHASED:*`,
      ...transaction.items.map(
        (i, idx) =>
          `${idx + 1}. *${i.name}*\n   ${i.quantity} × ${formatCurrency(i.unitPrice)} = *${formatCurrency(i.total)}*`
      ),
      `----------------------------------------`,
      `*SUBTOTAL:* ${formatCurrency(transaction.subtotal)}`,
      transaction.discountAmount > 0
        ? `*DISCOUNT (${transaction.discountPercent}%):* -${formatCurrency(transaction.discountAmount)}`
        : null,
      `*GOVT TAX:* 0% (Stamp Duty Exempt)`,
      `*NET TOTAL DUE:* *${formatCurrency(transaction.grandTotal)}*`,
      `*PAID VIA:* ${transaction.paymentMethod.toUpperCase()} (${formatCurrency(transaction.amountTendered)})`,
      transaction.changeDue > 0 ? `*CHANGE RETURNED:* ${formatCurrency(transaction.changeDue)}` : null,
      `----------------------------------------`,
      `✅ *VERIFIED AUTHENTIC LEGAL STAMPS*`,
      `_District & Sessions Courts · Valid Under Stamp Act 1899_`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(textLines);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadText = () => {
    const helpline = settings.helpline || '+923401645979 +923002634491';
    const licNum = settings.licenseNumber || 'Gos-KHI 18';

    const textLines = [
      '==================================================',
      `             ${settings.shopName.toUpperCase()}`,
      '        COURT STAMP VENDORS & LEGAL PAPER',
      `       Shop #14, District Court Complex`,
      `             Helpline: ${helpline}`,
      `             Lic : ${licNum}`,
      '==================================================',
      `RECEIPT NUMBER:   ${transaction.receiptNumber}`,
      `DATE & TIME:      ${formattedDateTime}`,
      `CASHIER:          ${transaction.cashierName}`,
      transaction.customerName ? `CLIENT:           ${transaction.customerName}` : '',
      transaction.customerPhone ? `CONTACT:          ${transaction.customerPhone}` : '',
      '--------------------------------------------------',
      '#  ITEM DESCRIPTION             QTY    PRICE      TOTAL',
      '--------------------------------------------------',
      ...transaction.items.map((i, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const name = i.name.slice(0, 22).padEnd(23, ' ');
        const qty = String(i.quantity).padStart(3, ' ');
        const price = formatCurrency(i.unitPrice).padStart(8, ' ');
        const total = formatCurrency(i.total).padStart(10, ' ');
        return `${num} ${name} ${qty} ${price} ${total}`;
      }),
      '--------------------------------------------------',
      `SUBTOTAL:                             ${formatCurrency(transaction.subtotal).padStart(12)}`,
      transaction.discountAmount > 0
        ? `DISCOUNT (${transaction.discountPercent}%):                      -${formatCurrency(transaction.discountAmount).padStart(11)}`
        : '',
      `GOVT TAX (0% TAX-FREE STAMPS):                      Rs. 0.00`,
      '==================================================',
      `TOTAL PAYABLE:                        ${formatCurrency(transaction.grandTotal).padStart(12)}`,
      '==================================================',
      `TENDERED (${transaction.paymentMethod.toUpperCase()}):                      ${formatCurrency(transaction.amountTendered).padStart(12)}`,
      `CHANGE RETURNED:                      ${formatCurrency(transaction.changeDue).padStart(12)}`,
      '--------------------------------------------------',
      '            *** VERIFIED AUTHENTIC ***            ',
      '     All Legal Stamps Valid Under Stamp Act 1899  ',
      `       ${settings.receiptHeader}`,
      `       ${settings.receiptFooter}`,
      '==================================================',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([textLines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${transaction.receiptNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalItemsCount = transaction.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div
      className={`receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto transition-all ${
        isFullScreenPrint
          ? 'bg-white p-0'
          : 'bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4'
      }`}
    >
      {/* Modal Container */}
      <div
        className={`receipt-modal-card bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-all ${
          isFullScreenPrint
            ? 'max-w-md h-screen rounded-none border-none bg-white dark:bg-white'
            : 'max-w-md max-h-[96vh]'
        }`}
      >
        
        {/* Top Control Header Bar (Hidden on print) */}
        <div className="no-print p-3 sm:px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>80mm POS Receipt</span>
                {transaction.status === 'refunded' ? (
                  <span className="text-[9px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 rounded border border-rose-200 dark:border-rose-800">
                    REFUNDED
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1 rounded border border-emerald-200 dark:border-emerald-800">
                    PAID
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {transaction.receiptNumber} · 80mm Roll
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Fullscreen toggle for direct Ctrl+P */}
            <button
              onClick={() => setIsFullScreenPrint(!isFullScreenPrint)}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title={isFullScreenPrint ? 'Exit Full Screen' : 'Full Screen View'}
            >
              {isFullScreenPrint ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleCopyWhatsApp}
              className={`p-1.5 px-2 rounded-lg border transition-all text-xs flex items-center gap-1 cursor-pointer ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="Copy formatted summary to paste in WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="hidden sm:inline font-medium text-[11px]">
                {copied ? 'Copied!' : 'WhatsApp'}
              </span>
            </button>

            {/* Download Text */}
            <button
              onClick={handleDownloadText}
              className="p-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Download text file (.txt)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informative Helper Notification Banner if user interacts */}
        {printStatusMessage && (
          <div className="no-print bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800/60 px-4 py-2 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
            <span>{printStatusMessage}</span>
            <button
              onClick={() => setPrintStatusMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 text-[10px] font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 80mm Slip Body */}
        <div
          className={`receipt-canvas-body p-3 sm:p-4 overflow-y-auto flex-1 flex justify-center ${
            isFullScreenPrint
              ? 'bg-white p-4'
              : 'bg-slate-200/80 dark:bg-slate-950/80'
          }`}
        >
          {/* Physical 80mm Thermal Slip Paper Container */}
          <div className="printable-area w-full max-w-[310px] transition-all duration-200 bg-white text-slate-900 shadow-xl border border-slate-200 rounded-sm relative font-sans">
            
            {/* Top Sawtooth Tear Edge */}
            <div className="no-print w-full overflow-hidden leading-none select-none h-1.5 bg-slate-100/60">
              <svg viewBox="0 0 310 6" className="w-full h-1.5 text-slate-300 dark:text-slate-600 fill-current" preserveAspectRatio="none">
                <path d="M0,6 L5,0 L10,6 L15,0 L20,6 L25,0 L30,6 L35,0 L40,6 L45,0 L50,6 L55,0 L60,6 L65,0 L70,6 L75,0 L80,6 L85,0 L90,6 L95,0 L100,6 L105,0 L110,6 L115,0 L120,6 L125,0 L130,6 L135,0 L140,6 L145,0 L150,6 L155,0 L160,6 L165,0 L170,6 L175,0 L180,6 L185,0 L190,6 L195,0 L200,6 L205,0 L210,6 L215,0 L220,6 L225,0 L230,6 L235,0 L240,6 L245,0 L250,6 L255,0 L260,6 L265,0 L270,6 L275,0 L280,6 L285,0 L290,6 L295,0 L300,6 L305,0 L310,6 Z" />
              </svg>
            </div>

            {/* Inner printable slip content targeted by receiptRef */}
            <div ref={receiptRef} className="px-3.5 py-3 sm:px-4 sm:py-3.5 space-y-2">
              
              {/* BRANDING HEADER WITH OFFICIAL SA BROTHERS LOGO */}
              <div className="text-center pb-2 border-b-2 border-slate-900 space-y-1">
                <div className="flex justify-center items-center pt-1 pb-0.5">
                  <div className="receipt-logo-wrapper w-16 h-16 rounded-full p-1 border-2 border-slate-900 bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={SA_BROTHERS_LOGO_DATA_URL}
                      alt="SA Brothers Vendors Logo"
                      className="receipt-logo-img w-full h-full object-contain rounded-full"
                      width="58"
                      height="58"
                    />
                  </div>
                </div>

                <div className="pt-0.5">
                  <h1 className="text-sm font-black tracking-tight text-slate-950 font-serif leading-tight uppercase">
                    {settings.shopName || 'S.A. BROTHERS VENDORS'}
                  </h1>
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-amber-800">
                    {settings.tagline || 'Court Stamp Vendors & Legal Paper'}
                  </p>
                  <p className="text-[8.5px] text-slate-600 leading-snug">
                    {settings.address || 'Shop #14, District Court Complex, Main Law Bazaar'}
                  </p>
                  <p className="text-[8.5px] text-slate-900 font-mono font-bold mt-0.5">
                    Helpline: {settings.helpline || '+923401645979 +923002634491'}
                  </p>
                </div>

                <div className="pt-0.5">
                  <div className="bg-slate-100 border border-slate-300 rounded py-0.5 px-1.5 text-[8.5px] font-mono text-slate-700 flex justify-between items-center">
                    <span className="font-bold text-slate-900">Lic : {settings.licenseNumber || 'Gos-KHI 18'}</span>
                    <span>DISTRICT &amp; SESSIONS COURTS</span>
                  </div>
                </div>

                {transaction.status === 'refunded' && (
                  <div className="mt-1 bg-rose-100 border border-rose-400 rounded py-1 px-2 text-[9px] font-mono font-bold text-rose-900">
                    STATUS: REFUNDED {transaction.refundReason ? `(${transaction.refundReason})` : ''}
                  </div>
                )}
              </div>

              {/* RECEIPT METADATA BLOCK */}
              <div className="py-1.5 border-b border-dashed border-slate-300 font-mono text-[9.5px] text-slate-700 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">RECEIPT NO:</span>
                  <span className="font-bold text-slate-950">{transaction.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DATE &amp; TIME:</span>
                  <span className="text-slate-900 font-medium">{formattedDateTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CASHIER:</span>
                  <span className="text-slate-900 font-medium">{transaction.cashierName}</span>
                </div>
                {transaction.customerName && (
                  <div className="flex justify-between pt-0.5 border-t border-slate-200">
                    <span className="text-slate-500">CLIENT:</span>
                    <span className="text-slate-950 font-bold">{transaction.customerName}</span>
                  </div>
                )}
                {transaction.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">CONTACT:</span>
                    <span className="text-slate-900">{transaction.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* ITEMIZED PRODUCTS TABLE */}
              <div className="py-1 border-b border-dashed border-slate-300">
                <div className="grid grid-cols-12 text-[8.5px] font-black uppercase text-slate-900 pb-1 border-b border-slate-900 tracking-wider">
                  <span className="col-span-1">#</span>
                  <span className="col-span-6">ITEM</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-3 text-right">TOTAL</span>
                </div>

                <div className="divide-y divide-slate-100 py-0.5 space-y-1">
                  {transaction.items.map((item, index) => (
                    <div key={index} className="pt-1 text-[9.5px] grid grid-cols-12 items-baseline">
                      <span className="col-span-1 font-mono text-[8.5px] text-slate-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="col-span-6 pr-1">
                        <div className="font-bold text-slate-950 leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[8px] font-mono text-slate-500">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <span className="col-span-2 text-center font-mono font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <span className="col-span-3 text-right font-mono font-bold text-slate-950">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOTALS SECTION */}
              <div className="py-1 space-y-0.5 font-mono text-[9.5px]">
                <div className="flex justify-between text-slate-600">
                  <span>Total Items:</span>
                  <span>{totalItemsCount} units</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(transaction.subtotal)}</span>
                </div>

                {transaction.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({transaction.discountPercent}%):</span>
                    <span>-{formatCurrency(transaction.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 text-[8.5px]">
                  <span>Govt Tax (Stamp Duty Exempt):</span>
                  <span>0.00 (0%)</span>
                </div>

                {/* Prominent Net Total */}
                <div className="mt-1 pt-1 border-t-2 border-b-2 border-slate-950 px-1 py-1 flex justify-between items-baseline">
                  <div>
                    <div className="text-[9.5px] font-black uppercase tracking-wider text-slate-900">
                      NET TOTAL DUE:
                    </div>
                    <div className="text-[7px] text-slate-500">Pakistani Rupees</div>
                  </div>
                  <div className="text-sm font-black text-slate-950 font-mono tracking-tight">
                    {formatCurrency(transaction.grandTotal)}
                  </div>
                </div>

                <div className="flex justify-between text-slate-700 pt-0.5">
                  <span className="uppercase">Paid via {transaction.paymentMethod}:</span>
                  <span className="font-bold text-slate-950">{formatCurrency(transaction.amountTendered)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-950 font-bold bg-amber-50 p-1 rounded border border-amber-200">
                  <span>CHANGE RETURNED:</span>
                  <span className="text-[10px] font-black text-amber-900">{formatCurrency(transaction.changeDue)}</span>
                </div>
              </div>

              {/* BARCODE */}
              <div className="pt-1 text-center">
                <div className="inline-block bg-black text-white px-3 py-1 font-mono text-[9px] tracking-[0.2em] font-black rounded-xs select-none">
                  |||| || ||||| ||| || |||||| | ||||
                </div>
                <div className="font-mono text-[7.5px] text-slate-500 tracking-wider mt-0.5">
                  *{transaction.receiptNumber}*
                </div>
              </div>

              {/* FOOTER NOTICE */}
              <div className="pt-1 text-center text-[8px] text-slate-600 space-y-0.5 border-t border-slate-200">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[8.5px]">
                  {settings.receiptHeader}
                </div>
                <p className="leading-tight text-slate-500">
                  {settings.receiptFooter}
                </p>
                <p className="text-[7px] text-slate-400 font-mono">
                  Legal stamp papers once issued cannot be refunded as per District Treasury Rules &amp; The Stamp Act 1899.
                </p>
              </div>

            </div>

            {/* Bottom Sawtooth Tear Edge */}
            <div className="no-print w-full overflow-hidden leading-none select-none h-1.5 bg-slate-100/60 rotate-180">
              <svg viewBox="0 0 310 6" className="w-full h-1.5 text-slate-300 dark:text-slate-600 fill-current" preserveAspectRatio="none">
                <path d="M0,6 L5,0 L10,6 L15,0 L20,6 L25,0 L30,6 L35,0 L40,6 L45,0 L50,6 L55,0 L60,6 L65,0 L70,6 L75,0 L80,6 L85,0 L90,6 L95,0 L100,6 L105,0 L110,6 L115,0 L120,6 L125,0 L130,6 L135,0 L140,6 L145,0 L150,6 L155,0 L160,6 L165,0 L170,6 L175,0 L180,6 L185,0 L190,6 L195,0 L200,6 L205,0 L210,6 L215,0 L220,6 L225,0 L230,6 L235,0 L240,6 L245,0 L250,6 L255,0 L260,6 L265,0 L270,6 L275,0 L280,6 L285,0 L290,6 L295,0 L300,6 L305,0 L310,6 Z" />
              </svg>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="no-print p-3 sm:px-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadHtmlSlip}
              className="px-2.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Download 80mm HTML slip"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <a
              href={printWindowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-decoration-none"
              title="Open 80mm receipt in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>New Tab</span>
            </a>

            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Print 80mm receipt directly"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print 80mm Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
