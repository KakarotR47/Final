import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product } from '../../types';
import {
  AlertTriangle,
  AlertCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  Layers,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

interface LowStockRestockWidgetProps {
  onNavigateToInventory: () => void;
}

export const LowStockRestockWidget: React.FC<LowStockRestockWidgetProps> = ({
  onNavigateToInventory,
}) => {
  const { products, restockProduct, formatCurrency } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [customQuantities, setCustomQuantities] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute all items below minimum threshold
  const belowThresholdProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStockThreshold);
  }, [products]);

  // Out of stock and low stock breakdowns
  const outOfStockItems = useMemo(() => {
    return belowThresholdProducts.filter((p) => p.currentStock <= 0);
  }, [belowThresholdProducts]);

  const lowStockItems = useMemo(() => {
    return belowThresholdProducts.filter((p) => p.currentStock > 0);
  }, [belowThresholdProducts]);

  // Aggregate metrics
  const totalDeficitUnits = useMemo(() => {
    return belowThresholdProducts.reduce((sum, p) => {
      const deficit = Math.max(0, p.minStockThreshold - p.currentStock);
      return sum + (deficit === 0 ? 1 : deficit); // At least 1 unit if equal to min
    }, 0);
  }, [belowThresholdProducts]);

  const totalDeficitCost = useMemo(() => {
    return belowThresholdProducts.reduce((sum, p) => {
      const deficit = Math.max(0, p.minStockThreshold - p.currentStock);
      const units = deficit === 0 ? 1 : deficit;
      return sum + units * p.costPrice;
    }, 0);
  }, [belowThresholdProducts]);

  // Filtered list based on search and active tab
  const filteredProducts = useMemo(() => {
    return belowThresholdProducts.filter((item) => {
      if (filterType === 'out_of_stock' && item.currentStock > 0) return false;
      if (filterType === 'low_stock' && item.currentStock <= 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        return matchName || matchSku || matchCat;
      }
      return true;
    }).sort((a, b) => {
      // Prioritize out of stock first, then largest deficit
      const defA = a.minStockThreshold - a.currentStock;
      const defB = b.minStockThreshold - b.currentStock;
      return defB - defA;
    });
  }, [belowThresholdProducts, filterType, searchQuery]);

  // Handle single product quick restock
  const handleQuickRestock = (product: Product, quantity: number, note?: string) => {
    if (quantity <= 0) return;
    restockProduct(product.id, quantity, undefined, note || 'Dashboard Quick Restock');
    showToast(`Added +${quantity} ${product.unit} to ${product.name}. Stock is now ${product.currentStock + quantity}.`);
  };

  // Handle custom quantity input restock
  const handleCustomRestock = (product: Product) => {
    const rawVal = customQuantities[product.id];
    const qty = parseInt(rawVal, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid positive number of units.');
      return;
    }
    handleQuickRestock(product, qty, 'Custom Dashboard Restock');
    setCustomQuantities((prev) => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
  };

  // Handle batch restock of all below-threshold items to their minimum threshold (+5 buffer)
  const handleBatchRestockAll = () => {
    let totalAdded = 0;
    belowThresholdProducts.forEach((p) => {
      const deficit = Math.max(0, p.minStockThreshold - p.currentStock);
      // Add deficit plus safety buffer of 5 units (or min 5)
      const qtyToAdd = deficit > 0 ? deficit + 5 : 5;
      restockProduct(p.id, qtyToAdd, undefined, 'Batch threshold auto-replenishment');
      totalAdded += qtyToAdd;
    });
    setShowBatchModal(false);
    showToast(`Batch restocked ${belowThresholdProducts.length} products with ${totalAdded} total units.`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-900/60 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-100 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Widget Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Stock Threshold Watchlist
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {belowThresholdProducts.length} Items Below Min
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live monitoring of inventory below safety threshold with 1-click replenishment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {belowThresholdProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBatchModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Restock all below threshold products in a single operation"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restock All Deficits</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateToInventory}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        {belowThresholdProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-amber-200/50 dark:border-amber-900/40 text-xs">
            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Out of Stock</span>
              <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono-numbers">
                {outOfStockItems.length} items
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Low Running Stock</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono-numbers">
                {lowStockItems.length} items
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Units Deficit</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono-numbers">
                -{totalDeficitUnits} units
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Est. Replenishment Cost</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono-numbers">
                {formatCurrency(totalDeficitCost)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      {belowThresholdProducts.length > 0 ? (
        <div className="p-3 sm:px-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Below Min ({belowThresholdProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('out_of_stock')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'out_of_stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Out of Stock ({outOfStockItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('low_stock')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'low_stock'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Low Stock ({lowStockItems.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product or SKU..."
              className="w-full pl-8.5 pr-3 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      ) : null}

      {/* Product List Content */}
      <div className="p-4 sm:p-5">
        {belowThresholdProducts.length === 0 ? (
          /* Healthy State: No products below threshold */
          <div className="py-8 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                All Inventory Adequately Stocked
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                All <strong>{products.length} catalog products</strong> currently meet or exceed their minimum inventory safety thresholds. No immediate replenishment is required.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToInventory}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <span>Manage Thresholds in Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Search yielded no matches */
          <div className="py-8 text-center text-slate-400 space-y-1">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              No below-threshold products matched "{searchQuery}"
            </p>
            <p className="text-[11px] text-slate-400">
              Try clearing your search query or switching filters.
            </p>
          </div>
        ) : (
          /* Below-threshold items cards list */
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const isOut = product.currentStock <= 0;
              const deficit = Math.max(0, product.minStockThreshold - product.currentStock);
              const fillDeficitQty = deficit > 0 ? deficit : 1;
              const stockPercent = product.minStockThreshold > 0
                ? Math.min(100, Math.max(0, (product.currentStock / product.minStockThreshold) * 100))
                : 0;

              return (
                <div
                  key={product.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isOut
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Product Info & Threshold Meter */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                            isOut
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : 'Low Stock'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {product.name}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                          {product.sku}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {product.category}
                        </span>
                      </div>

                      {/* Stock Level Progress Meter */}
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <span>Current:</span>
                            <strong
                              className={`font-mono text-xs ${
                                isOut
                                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                                  : 'text-amber-600 dark:text-amber-400 font-bold'
                              }`}
                            >
                              {product.currentStock} {product.unit}
                            </strong>
                            <span className="text-slate-400">/</span>
                            <span>Min Safety:</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-mono">
                              {product.minStockThreshold} {product.unit}
                            </strong>
                          </span>

                          <span
                            className={`font-semibold ${
                              isOut
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            Short by {fillDeficitQty} {product.unit}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${stockPercent}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOut
                                ? 'bg-rose-600'
                                : stockPercent < 40
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Unit Cost: {formatCurrency(product.costPrice)}</span>
                          <span>Selling: {formatCurrency(product.sellingPrice)}</span>
                          <span>Deficit Value: {formatCurrency(fillDeficitQty * product.costPrice)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Restock Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                      {/* One-Click Fill Deficit Button */}
                      <button
                        type="button"
                        onClick={() => handleQuickRestock(product, fillDeficitQty, 'Fill minimum threshold')}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                        title={`Restock ${fillDeficitQty} units to reach safe minimum`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Fill Min (+{fillDeficitQty})</span>
                      </button>

                      {/* Common Preset Buttons */}
                      <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs font-semibold shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(product, 10, '+10 quick replenish')}
                          className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                          title="Add 10 units"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(product, 25, '+25 quick replenish')}
                          className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer border-l border-slate-200 dark:border-slate-700"
                          title="Add 25 units"
                        >
                          +25
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(product, 50, '+50 quick replenish')}
                          className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer border-l border-slate-200 dark:border-slate-700"
                          title="Add 50 units"
                        >
                          +50
                        </button>
                      </div>

                      {/* Custom Input Restock */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={customQuantities[product.id] || ''}
                          onChange={(e) =>
                            setCustomQuantities((prev) => ({
                              ...prev,
                              [product.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCustomRestock(product);
                          }}
                          className="w-16 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleCustomRestock(product)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                          title="Add custom quantity"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Batch Restocking All Deficits */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Confirm Batch Replenishment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Restock all {belowThresholdProducts.length} below-threshold items up to safe buffer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p>
                This will replenish each item so that its stock exceeds the minimum threshold with an added 5-unit buffer.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between">
                  <span>Products to Restock:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{belowThresholdProducts.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Total Replenishment:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +{totalDeficitUnits + belowThresholdProducts.length * 5} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Approximate Capital Required:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalDeficitCost)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchRestockAll}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Confirm Restock All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
