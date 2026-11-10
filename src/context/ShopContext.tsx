import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  Product,
  SaleTransaction,
  Expense,
  StockMovement,
  ShopSettings,
  CartItem,
  PaymentMethod,
  HeldOrder,
  EndOfDayReport,
  SaleItem,
  UserProfile,
  DeviceSecurityConfig,
} from '../types';
import {
  storageService,
  DEFAULT_SETTINGS,
  DEFAULT_PROFILES,
  DEFAULT_DEVICE_SECURITY,
  getLocalDateStr,
  isSameDayAsDateStr,
} from '../services/storage';

interface ShopContextType {
  products: Product[];
  transactions: SaleTransaction[];
  expenses: Expense[];
  movements: StockMovement[];
  settings: ShopSettings;
  heldOrders: HeldOrder[];
  cart: CartItem[];
  cartDiscountPercent: number;
  customerName: string;
  customerPhone: string;
  currentReceipt: SaleTransaction | null;
  isReceiptModalOpen: boolean;

  // Authentication & Login Gate (Username & Password/PIN)
  isLoggedIn: boolean;
  login: (username: string, passwordPin: string) => { success: boolean; message?: string };
  logout: () => void;

  // Profile & Access Control (Owner vs Staff)
  profiles: UserProfile[];
  activeProfile: UserProfile;
  isOwner: boolean;
  isProfileModalOpen: boolean;
  targetProfileIdForModal: string | null;
  openProfileModal: (targetProfileId?: string) => void;
  closeProfileModal: () => void;
  switchProfile: (profileId: string, pin: string) => { success: boolean; message?: string };
  quickSwitchToStaff: () => void;
  updateProfilePin: (profileId: string, newPin: string) => { success: boolean; message?: string };
  updateProfileName: (profileId: string, newName: string) => void;

  // Manual Item Addition (Owner Catalog Feature)
  isAddProductModalOpen: boolean;
  addProductInitialCategory: string;
  openAddProductModal: (initialCategory?: string) => void;
  closeAddProductModal: () => void;

  // Shop Computer Only & Hard Drive Persistence
  deviceSecurity: DeviceSecurityConfig;
  isThisDeviceAuthorized: boolean;
  thisDeviceId: string;
  authorizeCurrentComputer: (name?: string) => void;
  unauthorizeComputer: () => void;
  saveDatabaseToHardDriveNow: () => Promise<boolean>;
  hardDriveLastSaved: string | null;
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  setCartDiscountPercent: (percent: number) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  clearCart: () => void;
  holdCurrentOrder: () => void;
  recallOrder: (heldId: string) => void;
  deleteHeldOrder: (heldId: string) => void;
  
  // Checkout & Receipts
  checkoutSale: (paymentMethod: PaymentMethod, amountTendered: number, notes?: string) => SaleTransaction | null;
  refundSale: (transactionId: string, reason?: string) => void;
  deleteTransaction: (transactionId: string) => void;
  deleteMultipleTransactions: (transactionIds: string[]) => { success: boolean; count: number };
  clearTransactionsOlderThanDays: (days: number) => { success: boolean; count: number };
  clearAllTransactions: () => { success: boolean; count: number };
  clearProfitAndSalesData: (scope: 'today' | 'all') => { success: boolean; count: number };
  openReceiptModal: (transaction: SaleTransaction) => void;
  closeReceiptModal: () => void;
  
  // Product & Inventory Actions
  addProduct: (product: Omit<Product, 'id' | 'updatedAt' | 'totalSold'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, quantityToAdd: number, costPrice?: number, note?: string) => void;
  adjustStock: (id: string, newStock: number, reason: string, type: 'damage_waste' | 'audit_adjustment') => void;
  
  // Expenses Actions
  addExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => Expense;
  deleteExpense: (id: string) => void;
  
  // Settings & Management
  updateSettings: (updates: Partial<ShopSettings>) => void;
  resetDemoData: () => void;
  exportDatabaseBackup: () => string;
  importDatabaseBackup: (jsonStr: string) => boolean;
  
  // Computed Alerts & Metrics
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  totalAlertsCount: number;
  todayStats: {
    date: string;
    grossSales: number;
    discounts: number;
    netSales: number;
    costOfGoods: number;
    grossProfit: number;
    expenses: number;
    cashExpenses: number;
    netProfit: number;
    marginPercent: number;
    transactionCount: number;
    itemsSold: number;
    cashSales: number;
    cardSales: number;
    mobileSales: number;
    expectedCashInDrawer: number;
  };
  generateEndOfDayReport: (targetDate?: string) => EndOfDayReport;
  formatCurrency: (amount: number) => string;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => storageService.getTransactions());
  const [expenses, setExpenses] = useState<Expense[]>(() => storageService.getExpenses());
  const [movements, setMovements] = useState<StockMovement[]>(() => storageService.getMovements());
  const [settings, setSettings] = useState<ShopSettings>(() => storageService.getSettings());
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => storageService.getHeldOrders());

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscountPercent, setCartDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [currentReceipt, setCurrentReceipt] = useState<SaleTransaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Authentication & Login Gate (Always opens 4-digit PIN Login Panel on app launch)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Profile & Access Control State
  const [profiles, setProfiles] = useState<UserProfile[]>(() => storageService.getProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string>(() => storageService.getActiveProfileId());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [targetProfileIdForModal, setTargetProfileIdForModal] = useState<string | null>(null);

  // Manual Add Product Modal State (For Owner adding items anywhere)
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [addProductInitialCategory, setAddProductInitialCategory] = useState<string>('Stationery');

  // Shop Computer Only & Hard Drive Persistence State
  const [deviceSecurity, setDeviceSecurity] = useState<DeviceSecurityConfig>(() => storageService.getDeviceSecurityConfig());
  const [thisDeviceId] = useState<string>(() => storageService.getThisDeviceId());
  const [isThisDeviceAuthorized, setIsThisDeviceAuthorized] = useState<boolean>(() => storageService.isDeviceAuthorized());
  const [hardDriveLastSaved, setHardDriveLastSaved] = useState<string | null>(() => new Date().toLocaleTimeString());
  const hasHydratedFromDisk = useRef<boolean>(false);

  // Check and sync from local hard disk on app boot to guarantee progress restoration after PC reboot
  useEffect(() => {
    fetch('/api/local-db/load')
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.success && resData?.data) {
          const d = resData.data;
          const diskInitialized =
            (Array.isArray(d.products) && d.products.length > 0) ||
            (d.settings && typeof d.settings === 'object' && Object.keys(d.settings).length > 0);

          if (diskInitialized) {
            if (Array.isArray(d.products) && d.products.length > 0) {
              storageService.saveProducts(d.products);
              setProducts(d.products);
            }
            if (Array.isArray(d.transactions)) {
              storageService.saveTransactions(d.transactions);
              setTransactions(d.transactions);
            }
            if (Array.isArray(d.expenses)) {
              storageService.saveExpenses(d.expenses);
              setExpenses(d.expenses);
            }
            if (Array.isArray(d.movements)) {
              storageService.saveMovements(d.movements);
              setMovements(d.movements);
            }
            if (d.settings && typeof d.settings === 'object' && Object.keys(d.settings).length > 0) {
              const mergedSettings = { ...DEFAULT_SETTINGS, ...d.settings };
              storageService.saveSettings(mergedSettings);
              setSettings(mergedSettings);
            }
            if (Array.isArray(d.profiles) && d.profiles.length > 0) {
              const userSavedInBrowser = localStorage.getItem('shopkeep_profiles_user_saved_v9') === 'true';
              if (userSavedInBrowser) {
                const currentLocalProfiles = storageService.getProfiles();
                setProfiles(currentLocalProfiles);
                storageService.saveToHardDrive({ profiles: currentLocalProfiles });
              } else {
                storageService.saveProfiles(d.profiles);
                setProfiles(d.profiles);
              }
            }
          } else {
            // First boot: seed local_database on disk with initial state
            storageService.saveToHardDrive({ products, transactions, expenses, movements, settings, profiles });
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        hasHydratedFromDisk.current = true;
      });
  }, []);

  // Flush state immediately on page unload or visibility change to survive sudden PC power cuts
  useEffect(() => {
    const handleFlush = () => {
      if (!hasHydratedFromDisk.current) return;
      storageService.saveToHardDrive({ products, transactions, expenses, movements, settings, profiles });
    };
    window.addEventListener('beforeunload', handleFlush);
    window.addEventListener('visibilitychange', handleFlush);
    return () => {
      window.removeEventListener('beforeunload', handleFlush);
      window.removeEventListener('visibilitychange', handleFlush);
    };
  }, [products, transactions, expenses, movements, settings, profiles]);

  // Auto-save everything to computer hard drive (/local_database/) whenever state changes after hydration
  useEffect(() => {
    if (!hasHydratedFromDisk.current) return;
    storageService.saveToHardDrive({ products, transactions, expenses, movements, settings, profiles });
    setHardDriveLastSaved(new Date().toLocaleTimeString());
  }, [products, transactions, expenses, movements, settings, profiles]);

  const authorizeCurrentComputer = (customName?: string) => {
    const updated = storageService.authorizeThisDevice(customName);
    setDeviceSecurity(updated);
    setIsThisDeviceAuthorized(true);
  };

  const unauthorizeComputer = () => {
    const updated = storageService.unauthorizeDevice();
    setDeviceSecurity(updated);
    setIsThisDeviceAuthorized(true);
  };

  const saveDatabaseToHardDriveNow = async (): Promise<boolean> => {
    try {
      const payload = {
        products,
        transactions,
        expenses,
        movements,
        settings,
        profiles,
        deviceLock: deviceSecurity,
      };
      const res = await fetch('/api/local-db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setHardDriveLastSaved(new Date().toLocaleTimeString());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Sync to local storage on change
  useEffect(() => {
    storageService.saveProducts(products);
  }, [products]);

  useEffect(() => {
    storageService.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storageService.saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    storageService.saveMovements(movements);
  }, [movements]);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    storageService.saveHeldOrders(heldOrders);
  }, [heldOrders]);

  useEffect(() => {
    storageService.saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    storageService.saveActiveProfileId(activeProfileId);
  }, [activeProfileId]);

  // Compute active profile and role
  const activeProfile = useMemo(() => {
    const found = profiles.find((p) => p.id === activeProfileId);
    return found || profiles[0] || DEFAULT_PROFILES[0];
  }, [profiles, activeProfileId]);

  const isOwner = activeProfile.role === 'owner';

  const openProfileModal = (targetProfileId?: string) => {
    setTargetProfileIdForModal(targetProfileId || null);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setTargetProfileIdForModal(null);
  };

  const switchProfile = (profileId: string, pin: string): { success: boolean; message?: string } => {
    const latestProfiles = storageService.getProfiles();
    const target = latestProfiles.find((p) => p.id === profileId) || profiles.find((p) => p.id === profileId);
    if (!target) return { success: false, message: 'Profile not found' };

    const pinClean = pin.trim();
    const targetPinClean = target.pin.trim();

    if (pinClean !== targetPinClean) {
      return {
        success: false,
        message: `Incorrect 4-digit PIN. Only the exact PIN saved for ${target.name} is accepted.`,
      };
    }

    setActiveProfileId(profileId);
    closeProfileModal();
    return { success: true };
  };

  const login = (roleOrUserInput: string, pinInput: string): { success: boolean; message?: string } => {
    const u = roleOrUserInput.trim().toLowerCase();
    const p = pinInput.trim();

    if (!p || p.length < 4) {
      return { success: false, message: 'Please enter your 4-digit PIN.' };
    }

    const latestProfiles = storageService.getProfiles();
    const staffProfile =
      latestProfiles.find((prof) => prof.role === 'staff') ||
      profiles.find((prof) => prof.role === 'staff') ||
      DEFAULT_PROFILES[1];
    const ownerProfile =
      latestProfiles.find((prof) => prof.role === 'owner') ||
      profiles.find((prof) => prof.role === 'owner') ||
      DEFAULT_PROFILES[0];

    const staffPin = (staffProfile.pin || '').trim();
    const ownerPin = (ownerProfile.pin || '').trim();

    const isOwnerRole = u === 'owner' || u === 'prof-owner' || u === 'admin' || u === 'shop owner';
    const isStaffRole = u === 'staff' || u === 'prof-staff' || u === 'cashier' || u === 'staff cashier';

    // 1. Strict Owner login: ONLY the exact saved Owner PIN can open Owner profile
    if (isOwnerRole) {
      if (p === ownerPin) {
        setActiveProfileId(ownerProfile.id);
        setIsLoggedIn(true);
        setIsThisDeviceAuthorized(true);
        return { success: true };
      }
      if (p === staffPin) {
        return {
          success: false,
          message: 'Access Denied: That is the Staff PIN. Enter the Owner 4-digit PIN to open Shop Owner.',
        };
      }
      return {
        success: false,
        message: 'Access Denied: Incorrect Owner 4-digit PIN. Only the Owner PIN saved in Settings can unlock this profile.',
      };
    }

    // 2. Strict Staff login: ONLY the exact saved Staff PIN can open Staff profile
    if (isStaffRole) {
      if (p === staffPin) {
        setActiveProfileId(staffProfile.id);
        setIsLoggedIn(true);
        setIsThisDeviceAuthorized(true);
        return { success: true };
      }
      if (p === ownerPin) {
        return {
          success: false,
          message: 'Access Denied: That is the Owner PIN. Select Shop Owner or enter the Staff 4-digit PIN.',
        };
      }
      return {
        success: false,
        message: 'Access Denied: Incorrect Staff 4-digit PIN. Only the Staff PIN saved by Owner can unlock this profile.',
      };
    }

    return {
      success: false,
      message: 'Please select Shop Owner or Staff Cashier and enter the exact saved 4-digit PIN.',
    };
  };

  const logout = () => {
    setIsLoggedIn(false);
    storageService.setIsLoggedIn(false);
  };

  const quickSwitchToStaff = () => {
    const staff = profiles.find((p) => p.role === 'staff');
    if (staff) {
      setActiveProfileId(staff.id);
    }
  };

  const updateProfilePin = (profileId: string, newPin: string): { success: boolean; message?: string } => {
    const cleaned = (newPin || '').trim();
    if (!/^\d{4}$/.test(cleaned)) {
      return { success: false, message: 'PIN must be exactly 4 digits (0-9)' };
    }
    const currentStored = storageService.getProfiles();
    const updatedStored = currentStored.map((p) => (p.id === profileId ? { ...p, pin: cleaned } : p));
    localStorage.setItem('shopkeep_profiles_user_saved_v9', 'true');
    storageService.saveProfiles(updatedStored);

    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === profileId ? { ...p, pin: cleaned } : p));
      storageService.saveProfiles(next);
      return next;
    });
    return { success: true, message: '4-digit PIN updated successfully' };
  };

  const updateProfileName = (profileId: string, newName: string) => {
    const cleanedName = (newName || '').trim();
    if (!cleanedName) return;
    const currentStored = storageService.getProfiles();
    const updatedStored = currentStored.map((p) => (p.id === profileId ? { ...p, name: cleanedName } : p));
    localStorage.setItem('shopkeep_profiles_user_saved_v9', 'true');
    storageService.saveProfiles(updatedStored);

    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === profileId ? { ...p, name: cleanedName } : p));
      storageService.saveProfiles(next);
      return next;
    });
  };

  const openAddProductModal = (initialCategory?: string) => {
    if (!isOwner) return;
    setAddProductInitialCategory(initialCategory || 'Stationery');
    setIsAddProductModalOpen(true);
  };

  const closeAddProductModal = () => {
    setIsAddProductModalOpen(false);
  };

  // Inventory Alerts computation
  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.minStockThreshold
    );
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= 0);
  }, [products]);

  const totalAlertsCount = lowStockProducts.length + outOfStockProducts.length;

  const formatCurrency = (amount: number): string => {
    const sym = settings.currency || 'PKR';
    const num = Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return sym.length > 1 ? `${sym} ${num}` : `${sym}${num}`;
  };

  // Cart operations with strict stock limit enforcement:
  // If stock is 9 remaining and user writes 10, it strictly auto-clamps to 9!
  // If stock is 499 and user writes 500, it strictly auto-clamps to 499!
  const addToCart = (product: Product, quantity = 1) => {
    const fresh = products.find((p) => p.id === product.id) || product;
    const maxStock = fresh.currentStock;

    if (maxStock <= 0) {
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === fresh.id);
      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        // Strictly clamp total cart quantity to max available stock
        const newQty = Math.min(maxStock, currentQty + Math.max(1, quantity));
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          product: fresh,
        };
        return updated;
      } else {
        const initialQty = Math.min(maxStock, Math.max(1, quantity));
        return [
          ...prevCart,
          {
            product: fresh,
            quantity: initialQty,
            unitPrice: fresh.sellingPrice,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    const maxStock = prod ? prod.currentStock : 999999;

    if (maxStock <= 0) {
      removeFromCart(productId);
      return;
    }

    // Auto-cap quantity strictly to maxStock: if 499 in stock and user writes 500, clamps to 499.
    // If 9 remaining and user writes 10, clamps to 9.
    const clamped = Math.min(maxStock, Math.max(1, Math.floor(quantity)));

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: clamped, product: prod || item.product }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscountPercent(0);
    setCustomerName('');
    setCustomerPhone('');
  };

  const holdCurrentOrder = () => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const newHold: HeldOrder = {
      id: `hold-${Date.now()}`,
      timestamp: new Date().toISOString(),
      customerName: customerName || undefined,
      items: [...cart],
      subtotal,
    };
    setHeldOrders((prev) => [newHold, ...prev]);
    clearCart();
  };

  const recallOrder = (heldId: string) => {
    const target = heldOrders.find((h) => h.id === heldId);
    if (!target) return;
    setCart(target.items);
    setCustomerName(target.customerName || '');
    setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
  };

  const deleteHeldOrder = (heldId: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
  };

  // Checkout process with strict stock limit validation & instant hard disk persistence
  const checkoutSale = (
    paymentMethod: PaymentMethod,
    amountTendered: number,
    notes?: string
  ): SaleTransaction | null => {
    if (cart.length === 0) return null;

    const now = new Date();
    const dateStr = getLocalDateStr(now);
    const dateFormatted = dateStr.replace(/-/g, '');
    const receiptPrefix = `RCP-${dateFormatted}-`;
    const maxSeq = transactions.reduce((max, t) => {
      if (t.receiptNumber.startsWith(receiptPrefix)) {
        const seq = parseInt(t.receiptNumber.slice(receiptPrefix.length), 10);
        if (!isNaN(seq) && seq > max) return seq;
      }
      return max;
    }, 0);
    const receiptNumber = `${receiptPrefix}${String(maxSeq + 1).padStart(4, '0')}`;
    const txId = `tx-${Date.now()}`;

    // Calculate line items and costs with strict stock validation
    const saleItems: SaleItem[] = cart.map((item) => {
      const prodInCatalog = products.find((p) => p.id === item.product.id) || item.product;
      // Guarantee sold quantity never exceeds available stock
      const clampedQty = Math.min(prodInCatalog.currentStock, item.quantity);
      const lineTotal = item.unitPrice * clampedQty;
      const lineCost = prodInCatalog.costPrice * clampedQty;

      return {
        productId: prodInCatalog.id,
        name: prodInCatalog.name,
        sku: prodInCatalog.sku,
        quantity: clampedQty,
        unitPrice: item.unitPrice,
        costPrice: prodInCatalog.costPrice,
        total: lineTotal,
        profit: lineTotal - lineCost,
      };
    }).filter((item) => item.quantity > 0);

    if (saleItems.length === 0) {
      return null;
    }

    const subtotal = saleItems.reduce((acc, item) => acc + item.total, 0);
    const discountAmount = Number(((subtotal * cartDiscountPercent) / 100).toFixed(2));
    const netAfterDiscount = subtotal - discountAmount;
    const taxRate = 0; // Tax removed from sales
    const taxAmount = 0;
    const grandTotal = Number(netAfterDiscount.toFixed(2));
    const totalCost = saleItems.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);
    const grossProfit = Number((netAfterDiscount - totalCost).toFixed(2));

    const finalTendered = paymentMethod === 'cash' ? Math.max(amountTendered, grandTotal) : grandTotal;
    const changeDue = Number(Math.max(0, finalTendered - grandTotal).toFixed(2));

    const newTransaction: SaleTransaction = {
      id: txId,
      receiptNumber,
      timestamp: now.toISOString(),
      items: saleItems,
      subtotal,
      discountAmount,
      discountPercent: cartDiscountPercent,
      taxRate,
      taxAmount,
      grandTotal,
      totalCost,
      grossProfit,
      paymentMethod,
      amountTendered: finalTendered,
      changeDue,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      cashierName: activeProfile?.name || settings.cashierName || 'Cashier',
      notes,
      status: 'completed',
    };

    // 1. Decrement stock & record movements
    const newMovements: StockMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const boughtItem = saleItems.find((c) => c.productId === prod.id);
      if (!boughtItem) return prod;

      const newStock = Math.max(0, prod.currentStock - boughtItem.quantity);
      newMovements.push({
        id: `mov-${Date.now()}-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        type: 'sale',
        quantityDelta: -boughtItem.quantity,
        previousStock: prod.currentStock,
        newStock,
        reason: `Sale ${receiptNumber}`,
        timestamp: now.toISOString(),
      });

      return {
        ...prod,
        currentStock: newStock,
        totalSold: (prod.totalSold || 0) + boughtItem.quantity,
        updatedAt: now.toISOString(),
      };
    });

    const updatedMovements = [...newMovements, ...movements];
    const updatedTransactions = [newTransaction, ...transactions];

    // Synchronous immediate persistence to local storage and computer disk
    storageService.saveProducts(updatedProducts);
    storageService.saveMovements(updatedMovements);
    storageService.saveTransactions(updatedTransactions);
    storageService.saveToHardDrive({
      products: updatedProducts,
      movements: updatedMovements,
      transactions: updatedTransactions,
    });

    setProducts(updatedProducts);
    setMovements(updatedMovements);
    setTransactions(updatedTransactions);

    // Reset cart and open receipt
    clearCart();
    setCurrentReceipt(newTransaction);
    setIsReceiptModalOpen(true);

    return newTransaction;
  };

  // Refund Sale with mandatory or custom reason
  const refundSale = (transactionId: string, reason?: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.status === 'refunded') return;

    const now = new Date();
    const refundReasonStr = reason?.trim() || 'Customer return';

    // Restore stock
    const refundMovements: StockMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const item = tx.items.find((i) => i.productId === prod.id);
      if (!item) return prod;

      const newStock = prod.currentStock + item.quantity;
      refundMovements.push({
        id: `mov-${Date.now()}-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        type: 'refund',
        quantityDelta: item.quantity,
        previousStock: prod.currentStock,
        newStock,
        reason: `Refund: ${refundReasonStr} (Receipt ${tx.receiptNumber})`,
        timestamp: now.toISOString(),
      });

      return {
        ...prod,
        currentStock: newStock,
        totalSold: Math.max(0, (prod.totalSold || 0) - item.quantity),
        updatedAt: now.toISOString(),
      };
    });

    const updatedMovements = [...refundMovements, ...movements];
    const updatedTransactions: SaleTransaction[] = transactions.map((t) =>
      t.id === transactionId
        ? {
            ...t,
            status: 'refunded',
            refundReason: refundReasonStr,
            refundedAt: now.toISOString(),
            refundedBy: activeProfile.name,
          }
        : t
    );

    // Synchronous immediate write to storage & hard drive
    storageService.saveProducts(updatedProducts);
    storageService.saveMovements(updatedMovements);
    storageService.saveTransactions(updatedTransactions);
    storageService.saveToHardDrive({
      products: updatedProducts,
      movements: updatedMovements,
      transactions: updatedTransactions,
    });

    setProducts(updatedProducts);
    setMovements(updatedMovements);
    setTransactions(updatedTransactions);
  };

  // Clear profit & sales history from Dashboard (Owner action)
  const clearProfitAndSalesData = (scope: 'today' | 'all'): { success: boolean; count: number } => {
    const todayStr = getLocalDateStr();
    let updatedTx: SaleTransaction[] = [];
    let updatedExp: Expense[] = [];
    let count = 0;

    if (scope === 'today') {
      const todayCount =
        transactions.filter((t) => isSameDayAsDateStr(t.timestamp, todayStr)).length +
        expenses.filter((e) => e.date === todayStr).length;
      updatedTx = transactions.filter((t) => !isSameDayAsDateStr(t.timestamp, todayStr));
      updatedExp = expenses.filter((e) => e.date !== todayStr);
      count = todayCount;
    } else {
      count = transactions.length + expenses.length;
      updatedTx = [];
      updatedExp = [];
    }

    // Synchronously commit to local storage and hard disk
    storageService.saveTransactions(updatedTx);
    storageService.saveExpenses(updatedExp);
    storageService.saveToHardDrive({
      transactions: updatedTx,
      expenses: updatedExp,
    });

    setTransactions(updatedTx);
    setExpenses(updatedExp);

    return { success: true, count };
  };

  // Delete single transaction from past bills & receipts (Owner only)
  const deleteTransaction = (transactionId: string) => {
    if (!isOwner) return;
    const updated = transactions.filter((t) => t.id !== transactionId);
    storageService.saveTransactions(updated);
    storageService.saveToHardDrive({ transactions: updated });
    setTransactions(updated);
  };

  // Delete multiple selected transactions (Owner only)
  const deleteMultipleTransactions = (transactionIds: string[]): { success: boolean; count: number } => {
    if (!isOwner) return { success: false, count: 0 };
    const idsSet = new Set(transactionIds);
    const updated = transactions.filter((t) => !idsSet.has(t.id));
    const count = transactions.length - updated.length;
    storageService.saveTransactions(updated);
    storageService.saveToHardDrive({ transactions: updated });
    setTransactions(updated);
    return { success: true, count };
  };

  // Clear transactions older than X days (Owner only)
  const clearTransactionsOlderThanDays = (days: number): { success: boolean; count: number } => {
    if (!isOwner) return { success: false, count: 0 };
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const updated = transactions.filter((t) => new Date(t.timestamp).getTime() >= cutoffTime);
    const count = transactions.length - updated.length;
    storageService.saveTransactions(updated);
    storageService.saveToHardDrive({ transactions: updated });
    setTransactions(updated);
    return { success: true, count };
  };

  // Clear all transactions from past bills & receipts (Owner only)
  const clearAllTransactions = (): { success: boolean; count: number } => {
    if (!isOwner) return { success: false, count: 0 };
    const count = transactions.length;
    storageService.saveTransactions([]);
    storageService.saveToHardDrive({ transactions: [] });
    setTransactions([]);
    return { success: true, count };
  };

  const openReceiptModal = (tx: SaleTransaction) => {
    setCurrentReceipt(tx);
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
  };

  // Product CRUD with instant, crash-proof durability
  const addProduct = (prodData: Omit<Product, 'id' | 'updatedAt' | 'totalSold'>): Product => {
    const now = new Date().toISOString();
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      totalSold: 0,
      updatedAt: now,
    };

    const updatedProducts = [newProd, ...products];
    let updatedMovements = movements;

    // Record initial stock movement
    if (newProd.currentStock > 0) {
      const initialMov: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: newProd.id,
        productName: newProd.name,
        type: 'restock',
        quantityDelta: newProd.currentStock,
        previousStock: 0,
        newStock: newProd.currentStock,
        reason: 'Initial stock intake',
        timestamp: now,
      };
      updatedMovements = [initialMov, ...movements];
    }

    // CRITICAL: Synchronous save immediately so progress is never lost even if the PC turns off!
    storageService.saveProducts(updatedProducts);
    storageService.saveMovements(updatedMovements);
    storageService.saveToHardDrive({
      products: updatedProducts,
      movements: updatedMovements,
    });

    setProducts(updatedProducts);
    setMovements(updatedMovements);

    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    const updatedProducts = products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: now } : p
    );

    storageService.saveProducts(updatedProducts);
    storageService.saveToHardDrive({ products: updatedProducts });
    setProducts(updatedProducts);
  };

  const deleteProduct = (id: string) => {
    const updatedProducts = products.filter((p) => p.id !== id);
    storageService.saveProducts(updatedProducts);
    storageService.saveToHardDrive({ products: updatedProducts });
    setProducts(updatedProducts);
  };

  const restockProduct = (
    id: string,
    quantityToAdd: number,
    newCostPrice?: number,
    note?: string
  ) => {
    if (quantityToAdd <= 0) return;
    const now = new Date().toISOString();
    let newMovementsList = movements;

    const updatedProducts = products.map((p) => {
      if (p.id !== id) return p;
      const newStock = p.currentStock + quantityToAdd;
      const updatedCost = newCostPrice !== undefined && newCostPrice > 0 ? newCostPrice : p.costPrice;

      const newMov: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: p.id,
        productName: p.name,
        type: 'restock',
        quantityDelta: quantityToAdd,
        previousStock: p.currentStock,
        newStock,
        reason: note || 'Supplier replenishment',
        timestamp: now,
      };
      newMovementsList = [newMov, ...movements];

      return {
        ...p,
        currentStock: newStock,
        costPrice: updatedCost,
        updatedAt: now,
      };
    });

    storageService.saveProducts(updatedProducts);
    storageService.saveMovements(newMovementsList);
    storageService.saveToHardDrive({
      products: updatedProducts,
      movements: newMovementsList,
    });

    setProducts(updatedProducts);
    setMovements(newMovementsList);
  };

  const adjustStock = (
    id: string,
    newStock: number,
    reason: string,
    type: 'damage_waste' | 'audit_adjustment'
  ) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;

    const delta = newStock - target.currentStock;
    const now = new Date().toISOString();

    const updatedProducts = products.map((p) =>
      p.id === id ? { ...p, currentStock: newStock, updatedAt: now } : p
    );

    const newMov: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: target.id,
      productName: target.name,
      type,
      quantityDelta: delta,
      previousStock: target.currentStock,
      newStock,
      reason,
      timestamp: now,
    };
    const updatedMovements = [newMov, ...movements];

    storageService.saveProducts(updatedProducts);
    storageService.saveMovements(updatedMovements);
    storageService.saveToHardDrive({
      products: updatedProducts,
      movements: updatedMovements,
    });

    setProducts(updatedProducts);
    setMovements(updatedMovements);
  };

  // Expenses CRUD with instant durability
  const addExpense = (expenseData: Omit<Expense, 'id' | 'timestamp'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const updatedExpenses = [newExpense, ...expenses];

    storageService.saveExpenses(updatedExpenses);
    storageService.saveToHardDrive({ expenses: updatedExpenses });
    setExpenses(updatedExpenses);

    return newExpense;
  };

  const deleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== id);
    storageService.saveExpenses(updatedExpenses);
    storageService.saveToHardDrive({ expenses: updatedExpenses });
    setExpenses(updatedExpenses);
  };

  // Settings
  const updateSettings = (updates: Partial<ShopSettings>) => {
    const updated = { ...settings, ...updates };
    storageService.saveSettings(updated);
    storageService.saveToHardDrive({ settings: updated });
    setSettings(updated);
  };

  const resetDemoData = () => {
    storageService.resetToDemo();
    const freshProducts = storageService.getProducts();
    const freshTransactions = storageService.getTransactions();
    const freshExpenses = storageService.getExpenses();
    const freshSettings = storageService.getSettings();
    const freshProfiles = storageService.getProfiles();
    const freshMovements = storageService.getMovements();

    storageService.saveToHardDrive({
      products: freshProducts,
      transactions: freshTransactions,
      expenses: freshExpenses,
      settings: freshSettings,
      profiles: freshProfiles,
      movements: freshMovements,
    });

    setProducts(freshProducts);
    setTransactions(freshTransactions);
    setExpenses(freshExpenses);
    setSettings(freshSettings);
    setProfiles(freshProfiles);
    setActiveProfileId('prof-owner');
    setMovements(freshMovements);
    setHeldOrders([]);
    clearCart();
  };

  const exportDatabaseBackup = () => {
    return storageService.exportBackup();
  };

  const importDatabaseBackup = (jsonStr: string) => {
    const success = storageService.importBackup(jsonStr);
    if (success) {
      const freshProducts = storageService.getProducts();
      const freshTransactions = storageService.getTransactions();
      const freshExpenses = storageService.getExpenses();
      const freshSettings = storageService.getSettings();
      const freshProfiles = storageService.getProfiles();
      const freshMovements = storageService.getMovements();

      storageService.saveToHardDrive({
        products: freshProducts,
        transactions: freshTransactions,
        expenses: freshExpenses,
        settings: freshSettings,
        profiles: freshProfiles,
        movements: freshMovements,
      });

      setProducts(freshProducts);
      setTransactions(freshTransactions);
      setExpenses(freshExpenses);
      setSettings(freshSettings);
      setProfiles(freshProfiles);
      setActiveProfileId(storageService.getActiveProfileId());
      setMovements(freshMovements);
      return true;
    }
    return false;
  };


  // Compute Today's Financial & Sales KPIs
  const todayStats = useMemo(() => {
    const todayStr = getLocalDateStr();
    const todayTransactions = transactions.filter(
      (t) => isSameDayAsDateStr(t.timestamp, todayStr) && t.status === 'completed'
    );
    const todayExpensesList = expenses.filter((e) => e.date === todayStr);

    let grossSales = 0;
    let discounts = 0;
    let netSales = 0;
    let costOfGoods = 0;
    let itemsSold = 0;
    let cashSales = 0;
    let cardSales = 0;
    let mobileSales = 0;

    todayTransactions.forEach((tx) => {
      grossSales += tx.subtotal;
      discounts += tx.discountAmount;
      netSales += (tx.subtotal - tx.discountAmount);
      costOfGoods += tx.totalCost;
      itemsSold += tx.items.reduce((sum, item) => sum + item.quantity, 0);

      if (tx.paymentMethod === 'cash') cashSales += tx.grandTotal;
      else if (tx.paymentMethod === 'card') cardSales += tx.grandTotal;
      else if (tx.paymentMethod === 'mobile_qr') mobileSales += tx.grandTotal;
    });

    const totalExpenses = todayExpensesList.reduce((sum, exp) => sum + exp.amount, 0);
    const cashExpenses = todayExpensesList
      .filter((e) => e.paymentMethod === 'cash')
      .reduce((sum, exp) => sum + exp.amount, 0);

    const grossProfit = netSales - costOfGoods;
    const netProfit = grossProfit - totalExpenses;
    const marginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const openingFloat = settings.defaultCashFloat || 150;
    const expectedCashInDrawer = openingFloat + cashSales - cashExpenses;

    return {
      date: todayStr,
      grossSales: Number(grossSales.toFixed(2)),
      discounts: Number(discounts.toFixed(2)),
      netSales: Number(netSales.toFixed(2)),
      costOfGoods: Number(costOfGoods.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      expenses: Number(totalExpenses.toFixed(2)),
      cashExpenses: Number(cashExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      marginPercent: Number(marginPercent.toFixed(1)),
      transactionCount: todayTransactions.length,
      itemsSold,
      cashSales: Number(cashSales.toFixed(2)),
      cardSales: Number(cardSales.toFixed(2)),
      mobileSales: Number(mobileSales.toFixed(2)),
      expectedCashInDrawer: Number(expectedCashInDrawer.toFixed(2)),
    };
  }, [transactions, expenses, settings.defaultCashFloat]);

  // Generate End-of-Day Report for any selected date
  const generateEndOfDayReport = (targetDate?: string): EndOfDayReport => {
    const reportDate = targetDate || getLocalDateStr();
    const dateTransactions = transactions.filter(
      (t) => isSameDayAsDateStr(t.timestamp, reportDate)
    );
    const completedTx = dateTransactions.filter((t) => t.status === 'completed');
    const refundedTx = dateTransactions.filter((t) => t.status === 'refunded');
    const dateExpenses = expenses.filter((e) => e.date === reportDate);

    let grossSales = 0;
    let discountsGiven = 0;
    let refundsGiven = 0;
    let netSales = 0;
    let totalCostOfGoods = 0;
    let itemsSoldCount = 0;
    let cashSales = 0;
    let cardSales = 0;
    let mobileSales = 0;

    const productVelocityMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};

    completedTx.forEach((tx) => {
      grossSales += tx.subtotal;
      discountsGiven += tx.discountAmount;
      netSales += (tx.subtotal - tx.discountAmount);
      totalCostOfGoods += tx.totalCost;

      if (tx.paymentMethod === 'cash') cashSales += tx.grandTotal;
      else if (tx.paymentMethod === 'card') cardSales += tx.grandTotal;
      else if (tx.paymentMethod === 'mobile_qr') mobileSales += tx.grandTotal;

      tx.items.forEach((item) => {
        itemsSoldCount += item.quantity;
        if (!productVelocityMap[item.productId]) {
          productVelocityMap[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productVelocityMap[item.productId].quantity += item.quantity;
        productVelocityMap[item.productId].revenue += item.total;
        productVelocityMap[item.productId].profit += item.profit;
      });
    });

    refundedTx.forEach((tx) => {
      refundsGiven += tx.grandTotal;
    });

    const totalExpenses = dateExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const cashExpenses = dateExpenses
      .filter((e) => e.paymentMethod === 'cash')
      .reduce((sum, exp) => sum + exp.amount, 0);

    const grossProfit = netSales - totalCostOfGoods;
    const netDailyProfit = grossProfit - totalExpenses;
    const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const openingCashFloat = settings.defaultCashFloat || 150;
    const expectedCashInDrawer = openingCashFloat + cashSales - cashExpenses;

    const topSellingProducts = Object.values(productVelocityMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      date: reportDate,
      generatedAt: new Date().toISOString(),
      openingCashFloat,
      cashSales: Number(cashSales.toFixed(2)),
      cardSales: Number(cardSales.toFixed(2)),
      mobileSales: Number(mobileSales.toFixed(2)),
      grossSales: Number(grossSales.toFixed(2)),
      discountsGiven: Number(discountsGiven.toFixed(2)),
      refundsGiven: Number(refundsGiven.toFixed(2)),
      netSales: Number(netSales.toFixed(2)),
      totalCostOfGoods: Number(totalCostOfGoods.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      cashExpenses: Number(cashExpenses.toFixed(2)),
      netDailyProfit: Number(netDailyProfit.toFixed(2)),
      expectedCashInDrawer: Number(expectedCashInDrawer.toFixed(2)),
      transactionCount: completedTx.length,
      itemsSoldCount,
      topSellingProducts,
      lowStockAlertCount: lowStockProducts.length + outOfStockProducts.length,
    };
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        transactions,
        expenses,
        movements,
        settings,
        heldOrders,
        cart,
        cartDiscountPercent,
        customerName,
        customerPhone,
        currentReceipt,
        isReceiptModalOpen,
        isLoggedIn,
        login,
        logout,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        setCartDiscountPercent,
        setCustomerName,
        setCustomerPhone,
        clearCart,
        holdCurrentOrder,
        recallOrder,
        deleteHeldOrder,
        checkoutSale,
        refundSale,
        deleteTransaction,
        deleteMultipleTransactions,
        clearTransactionsOlderThanDays,
        clearAllTransactions,
        clearProfitAndSalesData,
        openReceiptModal,
        closeReceiptModal,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        adjustStock,
        addExpense,
        deleteExpense,
        updateSettings,
        resetDemoData,
        exportDatabaseBackup,
        importDatabaseBackup,
        lowStockProducts,
        outOfStockProducts,
        totalAlertsCount,
        todayStats,
        generateEndOfDayReport,
        formatCurrency,

        // Profile & Access Control
        profiles,
        activeProfile,
        isOwner,
        isProfileModalOpen,
        targetProfileIdForModal,
        openProfileModal,
        closeProfileModal,
        switchProfile,
        quickSwitchToStaff,
        updateProfilePin,
        updateProfileName,

        // Manual Product Catalog addition (Owner)
        isAddProductModalOpen,
        addProductInitialCategory,
        openAddProductModal,
        closeAddProductModal,

        // Shop Computer Only & Hard Drive Persistence
        deviceSecurity,
        isThisDeviceAuthorized,
        thisDeviceId,
        authorizeCurrentComputer,
        unauthorizeComputer,
        saveDatabaseToHardDriveNow,
        hardDriveLastSaved,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
