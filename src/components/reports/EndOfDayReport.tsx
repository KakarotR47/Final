import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { getLocalDateStr } from '../../services/storage';
import {
  FileSpreadsheet,
  Printer,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Banknote,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  RefreshCw,
  Sliders,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';

export const EndOfDayReportView: React.FC = () => {
  const {
    generateEndOfDayReport,
    settings,
    updateSettings,
    formatCurrency,
    lowStockProducts,
    outOfStockProducts,
    isOwner,
    openProfileModal,
  } = useShop();

  const todayIso = getLocalDateStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [customFloatInput, setCustomFloatInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReportText, setAiReportText] = useState<string | null>(null);

  // Generate report for chosen date (must be called before any conditional return to satisfy Rules of Hooks)
  const report = useMemo(() => {
    return generateEndOfDayReport(selectedDate);
  }, [generateEndOfDayReport, selectedDate]);

  // If Staff profile is active, lock EOD financial report
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Daily Closing &amp; Financial Z-Reports Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            End-of-day register balancing, gross profit margins, and audit summaries are restricted to the Store Owner.
            Staff profiles can ring up sales and record daily shop expenses.
          </p>
        </div>
        <div>
          <button
            onClick={() => openProfileModal('prof-owner')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <KeyRound className="w-4 h-4" />
            <span>Unlock Owner Access with PIN</span>
          </button>
        </div>
      </div>
    );
  }

  const activeFloat = customFloatInput !== '' ? parseFloat(customFloatInput) || 0 : report.openingCashFloat;
  const expectedCash = activeFloat + report.cashSales - report.cashExpenses;

  const actualCashNumeric = actualCashInput !== '' ? parseFloat(actualCashInput) : null;
  const cashDiscrepancy = actualCashNumeric !== null ? actualCashNumeric - expectedCash : null;

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Generate or regenerate AI Store Manager Briefing
  const handleGenerateAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/analyze-eod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: {
            ...report,
            openingCashFloat: activeFloat,
            expectedCashInDrawer: expectedCash,
          },
          shopName: settings.shopName,
          currency: settings.currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI analysis');
      }

      const data = await response.json();
      setAiReportText(data.analysis);
    } catch (err) {
      console.error('Error fetching AI EOD briefing:', err);
      // Fallback message
      setAiReportText(
        `### Daily Financial Health & Margin Highlights\nToday, ${settings.shopName} recorded **${formatCurrency(
          report.netSales
        )}** in net revenue with a **${report.grossMarginPercent}%** gross profit margin. Operating expenses were **${formatCurrency(
          report.totalExpenses
        )}**, resulting in a net daily profit of **${formatCurrency(report.netDailyProfit)}**.\n\n### Sales & Product Velocity\nTotal volume was **${report.itemsSoldCount} items** across **${report.transactionCount} transactions**. Customer payment collection had **${formatCurrency(
          report.cashSales
        )}** in physical currency and **${formatCurrency(report.cardSales + report.mobileSales)}** in digital tenders.\n\n### Actionable Recommendations for Tomorrow\n- Reorder ${
          lowStockProducts.length
        } items that have fallen below safety inventory thresholds.\n- Balance cash register against expected float of ${formatCurrency(
          expectedCash
        )}.\n- Monitor top performers to prevent stockouts.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Date Selector (Hidden on Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            End-of-Day (EOD) Sales Analysis &amp; Closing Z-Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated closing register balancing, profit breakdown, and store audit report
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setAiReportText(null);
              }}
              className="text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Print Report Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print EOD Report</span>
          </button>
        </div>
      </div>

      {/* Main Report Container (Printable) */}
      <div className="printable-report bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-xs">
        {/* Report Header / Store Details */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
              Official Store Closing Statement
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {settings.shopName}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
              <div>{settings.address}</div>
              <div>
                Phone: {settings.phone}
                {settings.taxNumber ? ` · NTN / Reg: ${settings.taxNumber}` : ''}
              </div>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1 text-xs">
            <div className="font-bold text-slate-900 dark:text-white font-mono text-sm">
              Z-REPORT #{selectedDate.replace(/-/g, '')}-EOD
            </div>
            <div className="text-slate-500">
              Audit Date: <strong className="text-slate-900 dark:text-white">{selectedDate}</strong>
            </div>
            <div className="text-slate-400 text-[11px]">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </div>
            <div className="text-slate-400 text-[11px]">
              Cashier: {settings.cashierName}
            </div>
          </div>
        </div>

        {/* Section 1: Executive Financial Profit & Loss Statement */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>1. Daily Financial Statement (P&amp;L)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Sales Revenue Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-700">
                Revenue &amp; Deductions
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                <span>Gross Merchandise Sales</span>
                <span className="font-mono-numbers font-medium text-slate-900 dark:text-white">
                  {formatCurrency(report.grossSales)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400">
                <span>(-) Promotional Discounts Given</span>
                <span className="font-mono-numbers">
                  -{formatCurrency(report.discountsGiven)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400">
                <span>(-) Customer Refunds &amp; Returns</span>
                <span className="font-mono-numbers">
                  -{formatCurrency(report.refundsGiven)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm">
                <span>(=) Net Sales Revenue</span>
                <span className="font-mono-numbers text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(report.netSales)}
                </span>
              </div>
            </div>

            {/* Cost, Margin & Net Profit */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-700">
                Costs &amp; Operating Profit
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                <span>(-) Cost of Goods Sold (COGS)</span>
                <span className="font-mono-numbers font-medium text-slate-900 dark:text-white">
                  -{formatCurrency(report.totalCostOfGoods)}
                </span>
              </div>
              <div className="flex justify-between py-1 font-semibold text-slate-800 dark:text-slate-200">
                <span>(=) Gross Profit</span>
                <span className="font-mono-numbers">
                  {formatCurrency(report.grossProfit)} ({report.grossMarginPercent}%)
                </span>
              </div>
              <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400">
                <span>(-) Daily Shop Operating Expenses</span>
                <span className="font-mono-numbers">
                  -{formatCurrency(report.totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm">
                <span>(=) Net Daily Profit</span>
                <span className="font-mono-numbers text-emerald-600 dark:text-emerald-400 text-base">
                  {formatCurrency(report.netDailyProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Cash Drawer Balancing & Reconciliation */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>2. Cash Drawer Reconciliation (Till Audit)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="text-slate-500">Opening Cash Float</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder={report.openingCashFloat.toString()}
                  value={customFloatInput}
                  onChange={(e) => setCustomFloatInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-bold font-mono-numbers text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">Till float balance at morning opening</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="text-slate-500">System Calculated Expected Cash</div>
              <div className="text-xl font-bold font-mono-numbers text-slate-900 dark:text-white">
                {formatCurrency(expectedCash)}
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <div>Float ({formatCurrency(activeFloat)})</div>
                <div>+ Cash Sales ({formatCurrency(report.cashSales)})</div>
                <div>- Till Expenses ({formatCurrency(report.cashExpenses)})</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="text-slate-500 font-medium">Actual Physical Cash Counted</div>
              <input
                type="number"
                step="0.01"
                placeholder="Enter physical cash counted in till..."
                value={actualCashInput}
                onChange={(e) => setActualCashInput(e.target.value)}
                className="w-full px-2.5 py-1.5 font-bold font-mono-numbers text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />

              {actualCashNumeric !== null && (
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">Variance:</span>
                  <span
                    className={`font-mono-numbers font-bold ${
                      Math.abs(cashDiscrepancy || 0) < 0.05
                        ? 'text-emerald-600'
                        : (cashDiscrepancy || 0) > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {(cashDiscrepancy || 0) >= 0 ? '+' : ''}
                    {formatCurrency(cashDiscrepancy || 0)}
                    {Math.abs(cashDiscrepancy || 0) < 0.05
                      ? ' (Balanced)'
                      : (cashDiscrepancy || 0) > 0
                      ? ' (Over)'
                      : ' (Short)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Payment Method Breakdown & Velocity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              3. Payment Channel Breakdown
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2 px-2">Tender Method</th>
                  <th className="py-2 px-2 text-right">Amount Collected</th>
                  <th className="py-2 px-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">Physical Cash</td>
                  <td className="py-2 px-2 text-right font-mono-numbers font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(report.cashSales)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-slate-500">
                    {report.netSales > 0 ? ((report.cashSales / report.netSales) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">Credit / Debit Card</td>
                  <td className="py-2 px-2 text-right font-mono-numbers font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(report.cardSales)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-slate-500">
                    {report.netSales > 0 ? ((report.cardSales / report.netSales) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">Mobile Wallet / QR</td>
                  <td className="py-2 px-2 text-right font-mono-numbers font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(report.mobileSales)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-slate-500">
                    {report.netSales > 0 ? ((report.mobileSales / report.netSales) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              4. Store Velocity &amp; Inventory Alerts
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total Customer Transactions</span>
                <span className="font-mono-numbers font-bold text-slate-900 dark:text-white">
                  {report.transactionCount} orders
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total Units Sold</span>
                <span className="font-mono-numbers font-bold text-slate-900 dark:text-white">
                  {report.itemsSoldCount} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Average Transaction Value</span>
                <span className="font-mono-numbers font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(report.transactionCount > 0 ? report.netSales / report.transactionCount : 0)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-amber-700 dark:text-amber-300 font-semibold">
                  Items At / Below Reorder Threshold
                </span>
                <span className="font-mono-numbers font-bold text-amber-600">
                  {report.lowStockAlertCount} items
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Automated EOD Store Analysis & AI Briefing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>5. Automated End-of-Day Store Analysis &amp; Action Briefing</span>
            </h3>

            <button
              onClick={handleGenerateAiAnalysis}
              disabled={isAiLoading}
              className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span>{isAiLoading ? 'Analyzing Report...' : 'Refresh AI Analysis'}</span>
            </button>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
            {aiReportText ? (
              <div className="whitespace-pre-line space-y-2">
                {aiReportText}
              </div>
            ) : (
              <div className="space-y-3">
                <p>
                  <strong>Daily Performance Evaluation:</strong> Today, {settings.shopName} achieved{' '}
                  <span className="font-bold text-slate-900 dark:text-white font-mono-numbers">{formatCurrency(report.netSales)}</span>{' '}
                  in net sales across <span className="font-bold">{report.transactionCount} transactions</span>, maintaining a strong{' '}
                  <span className="font-bold text-emerald-600 font-mono-numbers">{report.grossMarginPercent}%</span> gross margin.
                  Operating expenses of <span className="font-mono-numbers">{formatCurrency(report.totalExpenses)}</span> yielded a net daily profit of{' '}
                  <span className="font-bold font-mono-numbers text-emerald-600">{formatCurrency(report.netDailyProfit)}</span>.
                </p>
                <p>
                  <strong>Stock Replenishment Directive:</strong> There are currently{' '}
                  <span className="font-bold text-amber-600">{report.lowStockAlertCount} products</span> approaching or at zero inventory.
                  Prioritize ordering top movers (such as {report.topSellingProducts[0]?.name || 'essential items'}) before tomorrow&apos;s morning shift.
                </p>
                <p>
                  <strong>Cash Till Closure:</strong> Reconcile drawer with the expected cash balance of{' '}
                  <span className="font-bold font-mono-numbers">{formatCurrency(expectedCash)}</span>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Closing Signature Area for Print */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div>
            <div className="border-b border-slate-300 dark:border-slate-700 pb-8 mb-1" />
            <div>Cashier / Shift Supervisor Signature</div>
          </div>
          <div>
            <div className="border-b border-slate-300 dark:border-slate-700 pb-8 mb-1" />
            <div>Store Owner / Manager Verification</div>
          </div>
        </div>
      </div>
    </div>
  );
};
