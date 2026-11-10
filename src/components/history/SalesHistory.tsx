import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { SaleTransaction } from '../../types';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  Calendar,
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertOctagon,
  X,
  Trash2,
  Clock,
  CheckSquare,
  Square,
  AlertTriangle,
  History,
  ShieldAlert,
} from 'lucide-react';

export const SalesHistory: React.FC = () => {
  const {
    transactions,
    refundSale,
    deleteTransaction,
    deleteMultipleTransactions,
    clearTransactionsOlderThanDays,
    clearAllTransactions,
    openReceiptModal,
    openProfileModal,
    formatCurrency,
    isOwner,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'refunded'>('all');
  const [txToRefund, setTxToRefund] = useState<SaleTransaction | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');

  // Delete & Clear older data states
  const [txToDelete, setTxToDelete] = useState<SaleTransaction | null>(null);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [showClearOptionsModal, setShowClearOptionsModal] = useState<boolean>(false);
  const [deleteConfirmationScope, setDeleteConfirmationScope] = useState<'selected' | 7 | 30 | 90 | 'all' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showToast = (text: string) => {
    setFeedbackMessage({ type: 'success', text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          tx.receiptNumber.toLowerCase().includes(q) ||
          (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
          tx.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  const summary = useMemo(() => {
    let totalSales = 0;
    let totalProfit = 0;
    let completedCount = 0;
    let refundedCount = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'completed') {
        totalSales += tx.grandTotal;
        totalProfit += tx.grossProfit;
        completedCount++;
      } else {
        refundedCount++;
      }
    });

    return { totalSales, totalProfit, completedCount, refundedCount };
  }, [transactions]);

  // Counts for older data options
  const olderThanCounts = useMemo(() => {
    const now = Date.now();
    const count7 = transactions.filter((t) => now - new Date(t.timestamp).getTime() > 7 * 24 * 60 * 60 * 1000).length;
    const count30 = transactions.filter((t) => now - new Date(t.timestamp).getTime() > 30 * 24 * 60 * 60 * 1000).length;
    const count90 = transactions.filter((t) => now - new Date(t.timestamp).getTime() > 90 * 24 * 60 * 60 * 1000).length;
    return { count7, count30, count90, total: transactions.length };
  }, [transactions]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedTxIds.size === filteredTransactions.length && filteredTransactions.length > 0) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const confirmRefund = () => {
    if (!txToRefund || !refundReason.trim()) return;
    refundSale(txToRefund.id, refundReason.trim());
    setTxToRefund(null);
    setRefundReason('');
    showToast(`Refund processed for receipt #${txToRefund.receiptNumber}`);
  };

  // Single transaction delete (Owner only)
  const confirmDeleteSingle = () => {
    if (!isOwner) {
      showToast('Permission denied: Only the store owner can delete past bills.');
      return;
    }
    if (!txToDelete) return;
    const rcpNum = txToDelete.receiptNumber;
    deleteTransaction(txToDelete.id);
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      next.delete(txToDelete.id);
      return next;
    });
    setTxToDelete(null);
    showToast(`Deleted receipt #${rcpNum} successfully`);
  };

  // Bulk / Clear older data execution (Owner only)
  const executeClearOption = (scope: 'selected' | 7 | 30 | 90 | 'all') => {
    if (!isOwner) {
      showToast('Permission denied: Only the store owner can clear past bills.');
      return;
    }
    if (scope === 'selected') {
      const ids = Array.from(selectedTxIds);
      if (ids.length === 0) return;
      const res = deleteMultipleTransactions(ids);
      setSelectedTxIds(new Set());
      showToast(`Deleted ${res.count} selected receipt(s)`);
    } else if (scope === 'all') {
      const res = clearAllTransactions();
      setSelectedTxIds(new Set());
      showToast(`Cleared all ${res.count} past receipts`);
    } else {
      const res = clearTransactionsOlderThanDays(scope);
      setSelectedTxIds(new Set());
      showToast(`Cleared ${res.count} receipt(s) older than ${scope} days`);
    }
    setDeleteConfirmationScope(null);
    setShowClearOptionsModal(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 shadow-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage.text}</span>
          </span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Past Bills &amp; Receipts Archive
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full register audit log, customer reprint archive, return processing, and data clearing
          </p>
        </div>

        {/* Clear Older Data / Delete Options Button - Owner Only */}
        <div className="flex items-center gap-2">
          {isOwner ? (
            <button
              type="button"
              onClick={() => setShowClearOptionsModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="Open options to clear older receipts or reset past bill history"
            >
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Clear Older Data</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openProfileModal('prof-owner')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              title="Only the store owner can delete past bills and receipts. Click to unlock with Owner PIN."
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Delete Locked (Owner Only)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Completed Sales
          </div>
          <div className="mt-1 text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white">
            {summary.completedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">transactions settled</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Revenue Settled
          </div>
          <div className="mt-1 text-2xl font-bold font-mono-numbers text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalSales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">gross payments collected</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Gross Profit Generated</span>
            {!isOwner && <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded">Owner Only</span>}
          </div>
          <div className="mt-1 text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white">
            {isOwner ? (
              formatCurrency(summary.totalProfit)
            ) : (
              <span className="text-slate-400 tracking-widest text-lg">••••••</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isOwner ? 'after merchandise costs' : 'Restricted to store owner'}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Refunds &amp; Returns
          </div>
          <div className="mt-1 text-2xl font-bold font-mono-numbers text-rose-600 dark:text-rose-400">
            {summary.refundedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">stock returned to shelves</div>
        </div>
      </div>

      {/* Multi-Select Floating Action Bar (Owner Only) */}
      {isOwner && selectedTxIds.size > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150 shadow-sm">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold">
            <CheckSquare className="w-4 h-4 text-rose-600" />
            <span>{selectedTxIds.size} bill(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTxIds(new Set())}
              className="px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={() => setDeleteConfirmationScope('selected')}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedTxIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt # (e.g. RCP-20261109-0001), item name, or customer..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Receipts
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('refunded')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'refunded'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Refunded
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                {isOwner && (
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={filteredTransactions.length > 0 && selectedTxIds.size === filteredTransactions.length}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                      title="Select / Deselect all bills"
                    />
                  </th>
                )}
                <th className="py-3 px-3">Receipt #</th>
                <th className="py-3 px-3">Date &amp; Time</th>
                <th className="py-3 px-3">Items Sold</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Sale Total</th>
                {isOwner && <th className="py-3 px-3 text-right">Gross Profit</th>}
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((tx) => {
                const totalUnits = tx.items.reduce((s, i) => s + i.quantity, 0);
                const isRefunded = tx.status === 'refunded';
                const isSelected = selectedTxIds.has(tx.id);

                return (
                  <tr
                    key={tx.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-rose-50/60 dark:bg-rose-950/20'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {isOwner && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(tx.id)}
                          className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                        />
                      </td>
                    )}

                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {tx.receiptNumber}
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      <div>{new Date(tx.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {tx.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {totalUnits} units total
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {tx.customerName ? (
                        <div>
                          <div className="font-medium">{tx.customerName}</div>
                          {tx.customerPhone && <div className="text-[10px] text-slate-400 font-mono">{tx.customerPhone}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Walk-in Customer</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 capitalize">
                        {tx.paymentMethod === 'cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                        {tx.paymentMethod === 'card' && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                        {tx.paymentMethod === 'mobile_qr' && <QrCode className="w-3.5 h-3.5 text-purple-600" />}
                        <span>{tx.paymentMethod.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(tx.grandTotal)}
                    </td>

                    {isOwner && (
                      <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-emerald-600 dark:text-emerald-400">
                        {isRefunded ? '—' : `+${formatCurrency(tx.grossProfit)}`}
                      </td>
                    )}

                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isRefunded
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                        >
                          {isRefunded ? <AlertOctagon className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span className="capitalize">{tx.status}</span>
                        </span>
                        {isRefunded && tx.refundReason && (
                          <span
                            className="text-[10px] text-rose-600 dark:text-rose-400 italic max-w-[140px] truncate"
                            title={`Reason: ${tx.refundReason}${tx.refundedBy ? ` (by ${tx.refundedBy})` : ''}`}
                          >
                            "{tx.refundReason}"
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openReceiptModal(tx)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Print / View Receipt"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>

                        {!isRefunded && (
                          <button
                            onClick={() => {
                              setTxToRefund(tx);
                              setRefundReason('');
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors cursor-pointer"
                            title="Process return / refund & restore stock to shelves"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Direct Delete Bill Button - Owner Only */}
                        {isOwner && (
                          <button
                            onClick={() => setTxToDelete(tx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            title={`Delete bill #${tx.receiptNumber} permanently (Owner only)`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No transactions match your search criteria
            </p>
          </div>
        )}
      </div>

      {/* Clear Older Data / Delete Options Modal - Owner Only */}
      {isOwner && showClearOptionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Delete Options &amp; Clear History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clean up older receipts to free up space or clear previous data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClearOptionsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Option: Selected Bills */}
              {selectedTxIds.size > 0 && (
                <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-rose-600" />
                      <span>Delete Selected Receipts ({selectedTxIds.size})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Permanently remove the {selectedTxIds.size} checked receipt(s) from past bills.
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmationScope('selected')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Delete Selected
                  </button>
                </div>
              )}

              {/* Option: Older than 7 days */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Clear Bills Older Than 7 Days</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Found <strong>{olderThanCounts.count7}</strong> receipt(s) issued more than 7 days ago.
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirmationScope(7)}
                  disabled={olderThanCounts.count7 === 0}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  Clear ({olderThanCounts.count7})
                </button>
              </div>

              {/* Option: Older than 30 days */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Clear Bills Older Than 30 Days</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Found <strong>{olderThanCounts.count30}</strong> receipt(s) issued more than 30 days ago.
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirmationScope(30)}
                  disabled={olderThanCounts.count30 === 0}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  Clear ({olderThanCounts.count30})
                </button>
              </div>

              {/* Option: Older than 90 days */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-blue-500" />
                    <span>Clear Bills Older Than 90 Days</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Found <strong>{olderThanCounts.count90}</strong> receipt(s) issued more than 90 days ago.
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirmationScope(90)}
                  disabled={olderThanCounts.count90 === 0}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  Clear ({olderThanCounts.count90})
                </button>
              </div>

              {/* Option: Clear All Receipts */}
              <div className="p-3 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Clear All Past Bills &amp; Receipts</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                    Total of <strong>{transactions.length}</strong> receipt(s) in sales history.
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirmationScope('all')}
                  disabled={transactions.length === 0}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearOptionsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Older / Multiple Bills - Owner Only */}
      {isOwner && deleteConfirmationScope !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm Permanent Deletion
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action permanently removes sales records from the database.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {deleteConfirmationScope === 'selected' && (
                <>Are you sure you want to delete the <strong>{selectedTxIds.size} selected receipt(s)</strong>?</>
              )}
              {deleteConfirmationScope === 'all' && (
                <>Are you sure you want to delete <strong>ALL {transactions.length} receipts</strong> from past history? This will completely reset the sales register log.</>
              )}
              {typeof deleteConfirmationScope === 'number' && (
                <>Are you sure you want to delete all receipts older than <strong>{deleteConfirmationScope} days</strong>?</>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmationScope(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeClearOption(deleteConfirmationScope)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Bill Delete Confirmation Modal - Owner Only */}
      {isOwner && txToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Delete Bill Receipt
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Receipt #{txToDelete.receiptNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTxToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700/60 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Date &amp; Time:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {new Date(txToDelete.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Customer:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {txToDelete.customerName || 'Walk-in Customer'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total Amount:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {formatCurrency(txToDelete.grandTotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Items:</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {txToDelete.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to permanently delete this receipt? It will be removed from your past sales record and local database file.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingle}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Refund Confirmation Modal (Mandatory Reason Required) */}
      {txToRefund && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Confirm Refund &amp; Return
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Receipt #{txToRefund.receiptNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTxToRefund(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700/60 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total Items Returning to Stock:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{txToRefund.items.reduce((s, i) => s + i.quantity, 0)} units
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Refund Amount Due to Customer:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {formatCurrency(txToRefund.grandTotal)}
                </span>
              </div>
            </div>

            {/* Mandatory Reason Input as requested by user */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Reason for Refund <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Required</span>
              </div>

              {/* Quick Preset Reason Tags */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Customer returned item',
                  'Wrong item selected',
                  'Damaged paper/stamp',
                  'Customer changed mind',
                  'Pricing error',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRefundReason(preset)}
                    className={`px-2 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer ${
                      refundReason === preset
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Write the reason to confirm refund (e.g., Unused stamp paper returned by client)..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                autoFocus
              />
              {!refundReason.trim() && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Please type or select a reason above to enable confirmation.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTxToRefund(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRefund}
                disabled={!refundReason.trim()}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                  !refundReason.trim()
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-70'
                    : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Refund</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
