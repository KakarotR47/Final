import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { ProductCategory, ProductUnit } from '../../types';
import {
  PackagePlus,
  X,
  Sparkles,
  Barcode,
  Layers,
  Coins,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

const STANDARD_CATEGORIES: string[] = [
  'Court Items',
  'Office Paper',
  'Stationery',
];

const STANDARD_UNITS: Array<{ id: ProductUnit; label: string }> = [
  { id: 'sheet', label: 'sheet (ورق)' },
  { id: 'pcs', label: 'pcs (عدد / دانہ)' },
  { id: 'ream', label: 'ream (رم / 500 Sheets)' },
  { id: 'pack', label: 'pack (پیکٹ)' },
  { id: 'box', label: 'box (ڈبہ)' },
  { id: 'book', label: 'book (بک / کاپی)' },
  { id: 'roll', label: 'roll (رول / ٹیپ)' },
  { id: 'set', label: 'set (سیٹ)' },
];

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Stationery',
}) => {
  const { addProduct, formatCurrency, isOwner } = useShop();

  const [name, setName] = useState('');
  const [categoryChoice, setCategoryChoice] = useState<string>(initialCategory || 'Stationery');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);
  const [unit, setUnit] = useState<ProductUnit>('pcs');
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('20');
  const [minThreshold, setMinThreshold] = useState<string>('5');
  const [sku, setSku] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Initialize or reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      const defaultCat = initialCategory && STANDARD_CATEGORIES.includes(initialCategory)
        ? initialCategory
        : 'Stationery';
      setCategoryChoice(defaultCat);
      setIsCustomCategoryMode(!STANDARD_CATEGORIES.includes(initialCategory) && Boolean(initialCategory && initialCategory !== 'All'));
      setCustomCategory(!STANDARD_CATEGORIES.includes(initialCategory) ? initialCategory || '' : '');
      setUnit(defaultCat === 'Court Items' ? 'sheet' : defaultCat === 'Office Paper' ? 'ream' : 'pcs');
      setCostPrice('');
      setSellingPrice('');
      setStock('20');
      setMinThreshold('5');
      setSku(`SKU-${Date.now().toString().slice(-5)}`);
      setBarcode(`${Math.floor(8900000000 + Math.random() * 99999999)}`);
      setDescription('');
      setSuccessToast(null);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen || !isOwner) return null;

  // Margin Preview
  const costNum = parseFloat(costPrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const unitProfit = sellNum - costNum;
  const marginPct = sellNum > 0 ? (unitProfit / sellNum) * 100 : 0;

  const handleGenerateSku = () => {
    const prefix = categoryChoice.substring(0, 3).toUpperCase();
    setSku(`${prefix}-${Date.now().toString().slice(-4)}`);
  };

  const handleGenerateBarcode = () => {
    setBarcode(`${Math.floor(8903000000 + Math.random() * 999999)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = isCustomCategoryMode
      ? (customCategory.trim() || 'General Items')
      : categoryChoice;

    const newProd = addProduct({
      name: name.trim(),
      category: finalCategory as ProductCategory,
      unit,
      costPrice: costNum,
      sellingPrice: sellNum,
      currentStock: parseInt(stock, 10) || 0,
      initialStock: parseInt(stock, 10) || 0,
      minStockThreshold: parseInt(minThreshold, 10) || 5,
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: barcode.trim() || `${Math.floor(8900000000 + Math.random() * 99999999)}`,
      description: description.trim(),
    });

    setSuccessToast(`"${newProd.name}" added successfully to catalog!`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-2xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                <span>Add New Item to Catalog</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Owner Exclusive
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manually register new stamp, legal paper, stationery, or custom shop goods
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[calc(85vh-5rem)] overflow-y-auto">
          {/* Success Banner */}
          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successToast}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Product Title / Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rs. 2000 Judicial Stamp, or Dux Pencil Box"
              autoFocus
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category *
              </label>
              {!isCustomCategoryMode ? (
                <div className="space-y-1">
                  <select
                    value={categoryChoice}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategoryMode(true);
                      } else {
                        setCategoryChoice(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {STANDARD_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom__">+ Add Custom Category...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category name"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCategoryMode(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-2"
                  >
                    Preset
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Unit of Measure *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing: Cost vs Sell Price + Margin Calculator */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pricing &amp; Profit Margin</span>
              </span>
              {sellNum > 0 && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Profit: +{formatCurrency(unitProfit)} ({marginPct.toFixed(1)}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Cost Price (Purchase/Wholesale) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    PKR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-11 pr-3 py-2 text-xs font-bold font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Selling Price (Retail to Customer) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    PKR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-11 pr-3 py-2 text-xs font-bold font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stock Quantity & Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Stock On Hand (Remaining) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono-numbers font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Low Stock Alert Limit *
              </label>
              <input
                type="number"
                min="1"
                required
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono-numbers font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* SKU & Barcode Codes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  SKU Identifier
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Barcode / EAN
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Description / Supplier Specs (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Brand, color, or supplier packaging details"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Save &amp; Add to Catalog</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
