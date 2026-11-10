import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { ProductCategory, Product, PaymentMethod, CartItem } from '../../types';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  X,
  Printer,
  Sparkles,
  ShoppingBag,
  Hash,
} from 'lucide-react';

const CATEGORIES: Array<'All' | ProductCategory> = [
  'All',
  'Court Items',
  'Office Paper',
  'Stationery',
];

interface CartItemRowProps {
  item: CartItem;
  formatCurrency: (amount: number) => string;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  formatCurrency,
  onUpdateQuantity,
  onRemove,
}) => {
  const [typedQty, setTypedQty] = useState<string>(item.quantity.toString());
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Synchronize when quantity changes from outside (e.g. from + or -)
  useEffect(() => {
    if (!isEditing) {
      setTypedQty(item.quantity.toString());
    }
  }, [item.quantity, isEditing]);

  const maxStock = item.product.currentStock;

  // Real-time stock clamping while typing:
  // If user has 9 remaining and writes 10, it immediately auto-clamps to 9!
  // If user has 499 remaining and writes 500, it immediately auto-clamps to 499!
  const handleQuantityTyping = (valStr: string) => {
    if (valStr === '') {
      setTypedQty('');
      return;
    }
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed)) {
      if (parsed > maxStock) {
        // Auto come to max remaining stock
        setTypedQty(maxStock.toString());
        onUpdateQuantity(item.product.id, maxStock);
        return;
      }
      if (parsed > 0) {
        setTypedQty(parsed.toString());
        onUpdateQuantity(item.product.id, parsed);
        return;
      }
    }
    setTypedQty(valStr);
  };

  const commitQuantity = () => {
    setIsEditing(false);
    const parsed = parseInt(typedQty, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setTypedQty(item.quantity.toString());
      onUpdateQuantity(item.product.id, item.quantity);
    } else {
      const clamped = Math.min(maxStock, Math.max(1, parsed));
      onUpdateQuantity(item.product.id, clamped);
      setTypedQty(clamped.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const lineTotal = item.unitPrice * item.quantity;
  const isOverStock = item.quantity > item.product.currentStock;

  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {item.product.name}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-numbers mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{formatCurrency(item.unitPrice)} each</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              (Max stock: {maxStock})
            </span>
          </div>
        </div>

        {/* Total & Remove */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs font-bold text-slate-900 dark:text-white font-mono-numbers text-right">
            {formatCurrency(lineTotal)}
          </div>
          <button
            onClick={() => onRemove(item.product.id)}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors"
            title="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Manual Quantity Stepper + Direct Typing Input */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded"
              title="Decrease quantity by 1"
            >
              <Minus className="w-3 h-3" />
            </button>

            {/* Editable Quantity Input with Auto-clamp to max remaining stock */}
            <input
              type="number"
              min="1"
              max={maxStock}
              value={isEditing ? typedQty : item.quantity}
              onFocus={(e) => {
                setIsEditing(true);
                e.target.select();
              }}
              onChange={(e) => handleQuantityTyping(e.target.value)}
              onBlur={commitQuantity}
              onKeyDown={handleKeyDown}
              className="w-16 text-center text-xs font-extrabold font-mono text-slate-900 dark:text-white bg-slate-50/60 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded py-0.5"
              title={`Stock available: ${maxStock}. Typing more than ${maxStock} will auto-clamp.`}
            />

            <button
              type="button"
              onClick={() => {
                const target = Math.min(maxStock, item.quantity + 1);
                onUpdateQuantity(item.product.id, target);
              }}
              disabled={item.quantity >= maxStock}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded"
              title={item.quantity >= maxStock ? `Max available stock (${maxStock}) reached` : "Increase quantity by 1"}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">qty</span>
        </div>

        {/* Quick bulk presets with automatic max stock cap */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, Math.min(maxStock, item.quantity + 10))}
            className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[10px] font-mono font-semibold"
            title="Add up to 10 more (capped by stock)"
          >
            +10
          </button>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, Math.min(maxStock, item.quantity + 50))}
            className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[10px] font-mono font-semibold"
            title="Add up to 50 more (capped by stock)"
          >
            +50
          </button>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, Math.min(maxStock, 100))}
            className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded text-[10px] font-mono font-bold"
            title={`Set quantity to 100 or max stock (${maxStock})`}
          >
            =100
          </button>
        </div>
      </div>
    </div>
  );
};

interface PosRegisterProps {
  initialCategory?: 'All' | ProductCategory;
}

export const PosRegister: React.FC<PosRegisterProps> = ({ initialCategory = 'All' }) => {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartDiscountPercent,
    setCartDiscountPercent,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    heldOrders,
    holdCurrentOrder,
    recallOrder,
    deleteHeldOrder,
    checkoutSale,
    formatCurrency,
    settings,
    isOwner,
    openAddProductModal,
  } = useShop();

  // Dynamically include any custom categories created by owner
  const allCategoryTabs = useMemo(() => {
    const list: string[] = ['All', 'Court Items', 'Office Paper', 'Stationery'];
    products.forEach((p) => {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    });
    return list;
  }, [products]);


  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>(initialCategory);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTenderedStr, setAmountTenderedStr] = useState<string>('');
  const [showHeldOrdersDropdown, setShowHeldOrdersDropdown] = useState(false);
  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [saleNotes, setSaleNotes] = useState('');

  // Quick Custom Quantity Modal state
  const [quickQtyProduct, setQuickQtyProduct] = useState<Product | null>(null);
  const [customQtyInput, setCustomQtyInput] = useState<string>('100');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customQtyInputRef = useRef<HTMLInputElement>(null);

  // Auto focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // When custom quantity modal opens, select all text
  useEffect(() => {
    if (quickQtyProduct) {
      setTimeout(() => {
        customQtyInputRef.current?.focus();
        customQtyInputRef.current?.select();
      }, 50);
    }
  }, [quickQtyProduct]);

  // Filter products by category and query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      // Clean out multiplier prefixes like "100*paper" -> "paper"
      const cleanQ = q.replace(/^(\d+)\s*[*xX\s]\s*/, '').trim();

      const matchesSearch =
        product.name.toLowerCase().includes(cleanQ) ||
        product.sku.toLowerCase().includes(cleanQ) ||
        product.barcode.toLowerCase().includes(cleanQ) ||
        product.category.toLowerCase().includes(cleanQ);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle barcode / fast enter key in search input with quantity multiplier support!
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const raw = searchQuery.trim();
      if (!raw) return;

      let qty = 1;
      let cleanQuery = raw;

      // Check for patterns like "100*paper", "100x paper", "100 paper", "paper*100"
      const prefixMatch = raw.match(/^(\d+)\s*[*xX\s]\s*(.+)$/);
      const suffixMatch = raw.match(/^(.+?)\s*[*xX]\s*(\d+)$/);

      if (prefixMatch) {
        qty = parseInt(prefixMatch[1], 10) || 1;
        cleanQuery = prefixMatch[2].trim();
      } else if (suffixMatch) {
        qty = parseInt(suffixMatch[2], 10) || 1;
        cleanQuery = suffixMatch[1].trim();
      }

      // Look for exact barcode, SKU or title match
      const exactMatch = products.find(
        (p) =>
          p.barcode === cleanQuery ||
          p.sku.toLowerCase() === cleanQuery.toLowerCase() ||
          p.name.toLowerCase() === cleanQuery.toLowerCase()
      );

      if (exactMatch) {
        addToCart(exactMatch, qty);
        setSearchQuery('');
        return;
      }

      // If only 1 result is filtered, add it with parsed quantity
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0], qty);
        setSearchQuery('');
        return;
      }

      // Partial name match
      const nameMatches = products.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(cleanQuery.toLowerCase())
      );
      if (nameMatches.length === 1) {
        addToCart(nameMatches[0], qty);
        setSearchQuery('');
      }
    }
  };

  // Cart financial calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Number(((cartSubtotal * cartDiscountPercent) / 100).toFixed(2));
  }, [cartSubtotal, cartDiscountPercent]);

  const netAfterDiscount = cartSubtotal - discountAmount;
  const grandTotal = Number(netAfterDiscount.toFixed(2));

  // Cash suggestions tailored for PKR notes
  const cashSuggestions = useMemo(() => {
    if (grandTotal <= 0) return [];
    const suggestions: number[] = [grandTotal];
    const steps = [10, 50, 100, 500, 1000, 5000];
    for (const step of steps) {
      const ceil = Math.ceil(grandTotal / step) * step;
      if (ceil > grandTotal && !suggestions.includes(ceil)) {
        suggestions.push(ceil);
      }
      if (suggestions.length >= 4) break;
    }
    return suggestions.slice(0, 4);
  }, [grandTotal]);

  const tenderedNumeric = parseFloat(amountTenderedStr) || 0;
  const changeDue = Math.max(0, tenderedNumeric - grandTotal);
  const isCashSufficient = paymentMethod !== 'cash' || tenderedNumeric >= grandTotal;

  // Open checkout modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setAmountTenderedStr(grandTotal.toString());
    setPaymentMethod('cash');
    setIsCheckoutModalOpen(true);
  };

  // Execute sale
  const handleFinalizeSale = () => {
    if (!isCashSufficient) return;

    checkoutSale(paymentMethod, tenderedNumeric, saleNotes);
    setIsCheckoutModalOpen(false);
    setSaleNotes('');
    searchInputRef.current?.focus();
  };

  // Handle Quick Custom Qty Add with stock clamping
  const handleAddCustomQty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQtyProduct) return;
    const qty = parseInt(customQtyInput, 10);
    if (!qty || qty <= 0) return;

    const clamped = Math.min(quickQtyProduct.currentStock, qty);
    addToCart(quickQtyProduct, clamped);
    setQuickQtyProduct(null);
    setCustomQtyInput('100');
    searchInputRef.current?.focus();
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Top action row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Point of Sale Register
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Scan barcode or click items · Adjust quantity manually in cart or type e.g.{' '}
            <span className="font-mono font-semibold text-emerald-600">100*paper</span>
          </p>
        </div>

        {/* Held Orders quick access */}
        <div className="flex items-center gap-2">
          {heldOrders.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowHeldOrdersDropdown(!showHeldOrdersDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Held Carts ({heldOrders.length})</span>
              </button>

              {showHeldOrdersDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-2 z-50">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                    On-Hold Carts
                  </div>
                  {heldOrders.map((h) => (
                    <div
                      key={h.id}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {h.customerName || 'Customer Cart'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {h.items.reduce((s, i) => s + i.quantity, 0)} items · {formatCurrency(h.subtotal)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            recallOrder(h.id);
                            setShowHeldOrdersDropdown(false);
                          }}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] hover:bg-emerald-700 font-semibold"
                        >
                          Recall
                        </button>
                        <button
                          onClick={() => deleteHeldOrder(h.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Discard"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {cart.length > 0 && (
            <button
              onClick={holdCurrentOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Park cart for next customer"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Hold Cart</span>
            </button>
          )}

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Products on left (60%), Register Cart on right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Search, Category Tabs, Catalogue Grid */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search bar & barcode scanner prompt with multiplier help */}
          <div className="space-y-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search or scan barcode (e.g. type '100*paper' or 'paper' and Enter)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors text-slate-900 dark:text-white placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2 px-1">
              <span>💡 Tip: Write quantity directly in cart input, or type <strong className="font-mono text-emerald-600 dark:text-emerald-400">100*paper</strong> in search</span>
            </div>
          </div>

          {/* Category Filter Tabs & Owner Add Item Action */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
              {allCategoryTabs.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Owner Quick Add Item button directly in POS */}
            {isOwner && (
              <button
                type="button"
                onClick={() => openAddProductModal(selectedCategory !== 'All' ? selectedCategory : 'Stationery')}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs ml-auto"
                title="Owner: Add a new item to the shop catalog manually"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            )}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.currentStock <= 0;
              const isLowStock = !isOutOfStock && product.currentStock <= product.minStockThreshold;
              const inCartItem = cart.find((c) => c.product.id === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product, 1)}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all text-left select-none ${
                    isOutOfStock
                      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 cursor-pointer hover:border-slate-300'
                      : inCartItem
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 dark:border-emerald-500/40 cursor-pointer shadow-xs hover:border-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs cursor-pointer'
                  }`}
                >
                  {/* Top: Category & Stock Indicator */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {product.category}
                    </span>

                    {/* Stock status badge */}
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                        0 in stock
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                        {product.currentStock} left
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                        {product.currentStock} in stock
                      </span>
                    )}
                  </div>

                  {/* Middle: Product Name & SKU */}
                  <div className="mb-3">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {product.sku}
                    </p>
                  </div>

                  {/* Bottom: Price & Quick Action with +Qty manual button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono-numbers">
                      {formatCurrency(product.sellingPrice)}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Manual Custom Quantity button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickQtyProduct(product);
                          setCustomQtyInput('100');
                        }}
                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white rounded text-[10px] font-semibold font-mono text-slate-700 dark:text-slate-300 transition-colors"
                        title="Add custom quantity (e.g. 100)"
                      >
                        +Qty
                      </button>

                      {inCartItem ? (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-xs font-bold font-mono">
                          {inCartItem.quantity}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="p-1 rounded-md text-slate-600 dark:text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                          title="Add 1 to cart"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No products found matching &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try a different keyword or category, or add new stock in the Inventory tab.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Checkout Cart Terminal */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[calc(100vh-6rem)]">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Current Sale
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({cart.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
            </div>

            <button
              onClick={() => setShowCustomerFields(!showCustomerFields)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              {showCustomerFields ? 'Hide Customer' : '+ Add Customer'}
            </button>
          </div>

          {/* Optional Customer info input */}
          {showCustomerFields && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Phone # (for SMS receipt)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Cart is empty
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                  Click items from catalog or scan barcode to begin sale
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <CartItemRow
                  key={item.product.id}
                  item={item}
                  formatCurrency={formatCurrency}
                  onUpdateQuantity={updateCartQuantity}
                  onRemove={removeFromCart}
                />
              ))
            )}
          </div>

          {/* Cart Footer: Discount, Subtotal, Tax, Total, and Pay button */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 space-y-3">
            {/* Quick Discount Presets */}
            {cart.length > 0 && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400">Discount</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setCartDiscountPercent(pct)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                        cartDiscountPercent === pct
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subtotal, Tax breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono-numbers text-slate-900 dark:text-white">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount ({cartDiscountPercent}%)</span>
                  <span className="font-mono-numbers">-{formatCurrency(discountAmount)}</span>
                </div>
              )}


              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white">
                <span>Total Amount</span>
                <span className="text-xl font-mono-numbers text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Charge / Pay button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Charge {formatCurrency(grandTotal)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Custom Quantity Modal */}
      {quickQtyProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  <span>Set Quantity to Sell</span>
                </h3>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  {quickQtyProduct.name}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Unit Price: {formatCurrency(quickQtyProduct.sellingPrice)} · Stock: {quickQtyProduct.currentStock}
                </p>
              </div>
              <button
                onClick={() => setQuickQtyProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomQty} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Type Quantity Manually (e.g. 100):
                </label>
                <input
                  ref={customQtyInputRef}
                  type="number"
                  min="1"
                  max={quickQtyProduct.currentStock}
                  required
                  value={customQtyInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed) && parsed > quickQtyProduct.currentStock) {
                      setCustomQtyInput(quickQtyProduct.currentStock.toString());
                      return;
                    }
                    setCustomQtyInput(val);
                  }}
                  className="w-full px-4 py-2.5 text-2xl font-bold font-mono-numbers text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <div className="text-[11px] text-slate-400 mb-1.5 font-medium flex items-center justify-between">
                  <span>Quick Quantity Presets:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    (Max: {quickQtyProduct.currentStock})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[10, 25, 50, 100].map((preset) => {
                    const actualPreset = Math.min(quickQtyProduct.currentStock, preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomQtyInput(actualPreset.toString())}
                        className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors ${
                          customQtyInput === actualPreset.toString()
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {actualPreset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickQtyProduct(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Add {customQtyInput || 1} to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Payment &amp; Checkout
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total Payable: <strong className="text-emerald-600">{formatCurrency(grandTotal)}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Card / POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_qr')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMethod === 'mobile_qr'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>Mobile / QR</span>
                  </button>
                </div>
              </div>

              {/* Cash Tendered Input & Change Calculation */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Cash Tendered from Customer
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono-numbers">
                        Due: {formatCurrency(grandTotal)}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs select-none">
                        {settings.currency}
                      </span>
                      <input
                        type="number"
                        step="1"
                        value={amountTenderedStr}
                        onChange={(e) => setAmountTenderedStr(e.target.value)}
                        className="w-full pl-14 pr-4 py-2.5 text-lg font-bold font-mono-numbers bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Quick suggestion buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cashSuggestions.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountTenderedStr(amt.toString())}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-mono-numbers"
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Change Output */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Change to Return:
                    </span>
                    <span
                      className={`text-lg font-mono-numbers font-extrabold ${
                        changeDue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Card / QR Simulation Info */}
              {paymentMethod === 'card' && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>
                    Card Reader Connected. Please tap or insert customer card for {formatCurrency(grandTotal)}.
                  </span>
                </div>
              )}

              {paymentMethod === 'mobile_qr' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
                  <div className="w-24 h-24 mx-auto bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-slate-800 dark:text-slate-200" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Scan store QR code with customer payment app to pay <strong>{formatCurrency(grandTotal)}</strong>
                  </p>
                </div>
              )}

              {/* Optional note */}
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  Transaction Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bulk order, customer discount..."
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Back to Register
                </button>
                <button
                  type="button"
                  disabled={!isCashSufficient}
                  onClick={handleFinalizeSale}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Complete &amp; Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
