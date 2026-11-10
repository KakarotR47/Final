export type ProductCategory =
  | 'Court Items'
  | 'Office Paper'
  | 'Stationery'
  | (string & {});

export type ProductUnit = 'pcs' | 'ream' | 'pack' | 'box' | 'sheet' | 'book' | 'roll' | 'set';

export type UserRole = 'owner' | 'staff';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // Password / PIN code
  title?: string;
  avatarColor?: string;
}


export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: ProductCategory;
  unit: ProductUnit;
  costPrice: number;     // Purchase / supplier price
  sellingPrice: number;  // Retail customer price
  currentStock: number;  // Units remaining in shop
  initialStock: number;
  minStockThreshold: number; // Low stock alert threshold
  totalSold: number;     // Total units sold historically
  description?: string;
  imageUrl?: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_qr' | 'credit';

export interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
  profit: number;
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string;
  timestamp: string; // ISO date string
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeDue: number;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  notes?: string;
  status: 'completed' | 'refunded';
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Utilities'
  | 'Staff Wages'
  | 'Inventory Freight'
  | 'Packaging & Supplies'
  | 'Repairs & Maintenance'
  | 'Marketing'
  | 'Miscellaneous';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  receiptRef?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'damage_waste' | 'audit_adjustment' | 'refund';
  quantityDelta: number; // + or -
  previousStock: number;
  newStock: number;
  reason?: string;
  timestamp: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  phone: string;
  helpline?: string;
  licenseNumber?: string;
  email: string;
  taxNumber: string;
  currency: string; // e.g. '$', '€', '£', '₹', 'Rs'
  taxRatePercent: number; // e.g. 5% or 0%
  receiptHeader: string;
  receiptFooter: string;
  defaultCashFloat: number;
  cashierName: string;
}

export interface EndOfDayReport {
  date: string;
  generatedAt: string;
  openingCashFloat: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  grossSales: number;
  discountsGiven: number;
  refundsGiven: number;
  netSales: number;
  totalCostOfGoods: number;
  grossProfit: number;
  grossMarginPercent: number;
  totalExpenses: number;
  cashExpenses: number;
  netDailyProfit: number;
  expectedCashInDrawer: number;
  actualCountedCash?: number;
  cashDiscrepancy?: number;
  transactionCount: number;
  itemsSoldCount: number;
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }>;
  lowStockAlertCount: number;
  aiSummary?: string;
}

export interface HeldOrder {
  id: string;
  timestamp: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
}

export interface DeviceSecurityConfig {
  isDeviceLockEnabled: boolean;
  authorizedDeviceId: string;
  authorizedDeviceName: string;
  authorizedAt?: string;
  isLocalOnlyMode?: boolean;
}
