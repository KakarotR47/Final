import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product, ProductCategory, ProductUnit } from '../../types';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  RefreshCw,
  TrendingUp,
  PackageCheck,
  X,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Lock,
} from 'lucide-react';

const CATEGORIES: ProductCategory[] = [
  'Court Items',
  'Office Paper',
  'Stationery',
];

const UNITS: ProductUnit[] = ['sheet', 'ream', 'pack', 'box', 'pcs', 'book', 'roll', 'set'];

export const InventoryManager: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    adjustStock,
    lowStockProducts,
    outOfStockProducts,
    totalAlertsCount,
    formatCurrency,
    isOwner,
    openProfileModal,
    openAddProductModal,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [alertFilter, setAlertFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'soldDesc' | 'marginDesc'>('stockAsc');

  const allCategories = useMemo(() => {
    const customCats = products
      .map((p) => p.category)
      .filter((c) => c && !CATEGORIES.includes(c));
    return Array.from(new Set([...CATEGORIES, ...customCats]));
  }, [products]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Court Items' as ProductCategory,
    unit: 'sheet' as ProductUnit,
    costPrice: '',
    sellingPrice: '',
    currentStock: '',
    minStockThreshold: '5',
    description: '',
  });

  // Form states for Quick Restock
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');
  const [restockNote, setRestockNote] = useState('Supplier shipment restock');

  // Form states for Adjust Stock
  const [adjustTargetStock, setAdjustTargetStock] = useState('');
  const [adjustType, setAdjustType] = useState<'damage_waste' | 'audit_adjustment'>('audit_adjustment');
  const [adjustReason, setAdjustReason] = useState('Physical inventory recount');

  // Aggregate Inventory Valuations
  const inventoryMetrics = useMemo(() => {
    let totalStockUnits = 0;
    let totalSoldUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;

    products.forEach((p) => {
      totalStockUnits += p.currentStock;
      totalSoldUnits += p.totalSold || 0;
      totalCostValuation += p.currentStock * p.costPrice;
      totalRetailValuation += p.currentStock * p.sellingPrice;
    });

    const potentialGrossMargin = totalRetailValuation - totalCostValuation;
    const marginPct = totalRetailValuation > 0 ? (potentialGrossMargin / totalRetailValuation) * 100 : 0;

    return {
      totalProducts: products.length,
      totalStockUnits,
      totalSoldUnits,
      totalCostValuation,
      totalRetailValuation,
      potentialGrossMargin,
      marginPct,
    };
  }, [products]);

  // Filtering and sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;

        // Alert filter
        if (alertFilter === 'low' && (p.currentStock > p.minStockThreshold || p.currentStock <= 0)) {
          return false;
        }
        if (alertFilter === 'out' && p.currentStock > 0) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.barcode.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stockAsc') return a.currentStock - b.currentStock;
        if (sortBy === 'stockDesc') return b.currentStock - a.currentStock;
        if (sortBy === 'soldDesc') return (b.totalSold || 0) - (a.totalSold || 0);
        if (sortBy === 'marginDesc') {
          const marginA = a.sellingPrice - a.costPrice;
          const marginB = b.sellingPrice - b.costPrice;
          return marginB - marginA;
        }
        return 0;
      });
  }, [products, selectedCategory, alertFilter, searchQuery, sortBy]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      barcode: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: 'Court Items',
      unit: 'sheet',
      costPrice: '',
      sellingPrice: '',
      currentStock: '10',
      minStockThreshold: '5',
      description: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      unit: p.unit,
      costPrice: p.costPrice.toString(),
      sellingPrice: p.sellingPrice.toString(),
      currentStock: p.currentStock.toString(),
      minStockThreshold: p.minStockThreshold.toString(),
      description: p.description || '',
    });
  };

  // Submit Add / Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(formData.costPrice) || 0;
    const sell = parseFloat(formData.sellingPrice) || 0;
    const stock = parseInt(formData.currentStock, 10) || 0;
    const threshold = parseInt(formData.minStockThreshold, 10) || 5;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim(),
        category: formData.category,
        unit: formData.unit,
        costPrice: cost,
        sellingPrice: sell,
        currentStock: stock,
        minStockThreshold: threshold,
        description: formData.description.trim(),
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim(),
        category: formData.category,
        unit: formData.unit,
        costPrice: cost,
        sellingPrice: sell,
        currentStock: stock,
        initialStock: stock,
        minStockThreshold: threshold,
        description: formData.description.trim(),
      });
      setIsAddModalOpen(false);
    }
  };

  // Submit Restock
  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingProduct) return;
    const qty = parseInt(restockQty, 10);
    if (!qty || qty <= 0) return;

    const newCost = restockCost ? parseFloat(restockCost) : undefined;
    restockProduct(restockingProduct.id, qty, newCost, restockNote);
    setRestockingProduct(null);
    setRestockQty('');
    setRestockCost('');
  };

  // Submit Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const target = parseInt(adjustTargetStock, 10);
    if (isNaN(target) || target < 0) return;

    adjustStock(adjustingProduct.id, target, adjustReason, adjustType);
    setAdjustingProduct(null);
    setAdjustTargetStock('');
  };

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-2xs">
          <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Stock Inventory Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Staff profiles cannot view inventory counts, stock valuation, or edit catalog items. Please enter the Owner password to unlock full access.
          </p>
        </div>
        <button
          onClick={() => openProfileModal('prof-owner')}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          Unlock with Owner PIN
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Valuation Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Inventory &amp; Stock Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time remaining stock, unit sales velocity, valuation, and reorder alerts
          </p>
        </div>

        <button
          onClick={() => openAddProductModal(selectedCategory !== 'All' ? selectedCategory : 'Stationery')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Stock Item</span>
        </button>
      </div>

      {/* High-level Stock Valuation Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Stock Remaining
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white">
              {inventoryMetrics.totalStockUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">units across {inventoryMetrics.totalProducts} items</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Units Sold To Date
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-emerald-600 dark:text-emerald-400">
              {inventoryMetrics.totalSoldUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">units cleared</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Inventory Cost Valuation
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white">
              {formatCurrency(inventoryMetrics.totalCostValuation)}
            </span>
            <span className="text-xs text-slate-500">capital invested</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Potential Retail Value
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white">
              {formatCurrency(inventoryMetrics.totalRetailValuation)}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              ({inventoryMetrics.marginPct.toFixed(1)}% margin)
            </span>
          </div>
        </div>
      </div>

      {/* Critical Inventory Alert Banner (if any) */}
      {totalAlertsCount > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Action Required: {totalAlertsCount} products need replenishment
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {outOfStockProducts.length} out of stock · {lowStockProducts.length} below safety reorder threshold
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAlertFilter(alertFilter === 'low' ? 'all' : 'low')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
            >
              {alertFilter === 'low' ? 'Show All Products' : 'Filter Low Stock Items'}
            </button>
          </div>
        </div>
      )}

      {/* Search, Filter & Segmented Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product title, SKU, or barcode..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Alert status filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start md:self-auto">
            <button
              onClick={() => setAlertFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                alertFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setAlertFilter('low')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                alertFilter === 'low'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Low Stock ({lowStockProducts.length})
            </button>
            <button
              onClick={() => setAlertFilter('out')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                alertFilter === 'out'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Out of Stock ({outOfStockProducts.length})
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="stockAsc">Stock: Low to High</option>
              <option value="stockDesc">Stock: High to Low</option>
              <option value="soldDesc">Most Units Sold</option>
              <option value="marginDesc">Highest Profit Margin</option>
              <option value="name">Product Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Category Horizontal Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* High Density Inventory Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-3">SKU &amp; Barcode</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Sell Price</th>
                <th className="py-3 px-3 text-right">Margin</th>
                <th className="py-3 px-3 text-center">Remaining Stock</th>
                <th className="py-3 px-3 text-right">Total Sold</th>
                <th className="py-3 px-3 text-right">Stock Valuation</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const isOut = p.currentStock <= 0;
                const isLow = !isOut && p.currentStock <= p.minStockThreshold;
                const unitProfit = p.sellingPrice - p.costPrice;
                const marginPercent = p.sellingPrice > 0 ? (unitProfit / p.sellingPrice) * 100 : 0;
                const stockValuation = p.currentStock * p.costPrice;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Item Details */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{p.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Unit: {p.unit}</span>
                      </div>
                    </td>

                    {/* SKU & Barcode */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div>{p.sku}</div>
                      <div className="text-[10px] text-slate-400">{p.barcode}</div>
                    </td>

                    {/* Cost Price */}
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                      {formatCurrency(p.costPrice)}
                    </td>

                    {/* Sell Price */}
                    <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(p.sellingPrice)}
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-3 text-right font-mono-numbers">
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{formatCurrency(unitProfit)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {marginPercent.toFixed(1)}%
                      </div>
                    </td>

                    {/* Remaining Stock with Alert Badging */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`font-mono-numbers font-bold text-sm ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {p.currentStock}
                        </span>
                        <span className="text-[11px] text-slate-400">/ min {p.minStockThreshold}</span>
                      </div>
                      {isOut && (
                        <div className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">
                          Out of stock
                        </div>
                      )}
                      {isLow && (
                        <div className="text-[10px] font-semibold text-amber-600">
                          Reorder alert
                        </div>
                      )}
                    </td>

                    {/* Total Sold */}
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-700 dark:text-slate-300 font-semibold">
                      {(p.totalSold || 0).toLocaleString()}
                    </td>

                    {/* Stock Valuation */}
                    <td className="py-3 px-3 text-right font-mono-numbers font-medium text-slate-900 dark:text-white">
                      {formatCurrency(stockValuation)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setRestockingProduct(p);
                            setRestockQty('10');
                            setRestockCost(p.costPrice.toString());
                          }}
                          title="Restock units from supplier"
                          className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Restock</span>
                        </button>

                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setAdjustTargetStock(p.currentStock.toString());
                          }}
                          title="Stock adjustment (damage / count audit)"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit product info & prices"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setProductToDelete(p)}
                          title="Delete product"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No inventory items match your filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Stock Item' : 'Add New Stock Item'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Whole Bean Coffee 500g"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e: any) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Barcode / EAN
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Cost Price (Purchase) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Selling Price (Retail) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Current Stock Remaining *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Low Stock Alert Threshold *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.minStockThreshold}
                    onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {restockingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Restock Inventory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {restockingProduct.name}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Currently in stock: <strong>{restockingProduct.currentStock} {restockingProduct.unit}</strong>
                </p>
              </div>
              <button
                onClick={() => setRestockingProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRestock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantity Received from Supplier *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-3 py-2 text-sm font-bold font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Cost Price per Unit (leave unchanged or update)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Restock Note / Supplier Reference
                </label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockingProduct(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Confirm Restock (+{restockQty || 0})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Stock Discrepancy Adjustment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {adjustingProduct.name}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Current system count: <strong>{adjustingProduct.currentStock}</strong>
                </p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Actual Physical Count On Hand *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustTargetStock}
                  onChange={(e) => setAdjustTargetStock(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e: any) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="audit_adjustment">Physical Audit / Reconcile</option>
                  <option value="damage_waste">Damaged Goods / Expired Waste</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason / Notes *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg shadow-xs"
                >
                  Apply Count Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* In-app Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Product</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{productToDelete.name}</strong> from your shop catalog?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
