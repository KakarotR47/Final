import { Product, SaleTransaction, Expense, StockMovement, ShopSettings, HeldOrder, UserProfile, DeviceSecurityConfig } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'shopkeep_products_v7',
  TRANSACTIONS: 'shopkeep_transactions_v6',
  EXPENSES: 'shopkeep_expenses_v6',
  MOVEMENTS: 'shopkeep_movements_v6',
  SETTINGS: 'shopkeep_settings_v6',
  HELD_ORDERS: 'shopkeep_held_orders_v6',
  PROFILES: 'shopkeep_profiles_v9',
  ACTIVE_PROFILE: 'shopkeep_active_profile_v7',
  DEVICE_LOCK: 'shopkeep_device_lock_v2',
  THIS_DEVICE_ID: 'shopkeep_machine_id_v2',
  IS_LOGGED_IN: 'shopkeep_auth_session_v1',
};

export const DEFAULT_DEVICE_SECURITY: DeviceSecurityConfig = {
  isDeviceLockEnabled: false,
  authorizedDeviceId: '',
  authorizedDeviceName: 'Shop Counter Computer (Primary)',
  authorizedAt: undefined,
  isLocalOnlyMode: true,
};

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'prof-owner',
    name: 'Shop Owner (Admin)',
    role: 'owner',
    pin: '1080',
    title: 'Owner - Full Administrative Access',
    avatarColor: 'from-amber-500 to-amber-700',
  },
  {
    id: 'prof-staff',
    name: 'Staff Cashier',
    role: 'staff',
    pin: '1234',
    title: 'Staff - Sales & Expenses',
    avatarColor: 'from-blue-500 to-indigo-600',
  },
];


export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'SA Brothers Vendors',
  tagline: 'Court Stamp Vendors & Legal Paper',
  address: 'Shop #14, District Court Complex, Main Law Bazaar',
  phone: '+923401645979, +923002634491',
  helpline: '+923401645979, +923002634491',
  licenseNumber: 'Gos-KHI 18',
  email: 'contact@sabrothersvendors.com',
  taxNumber: 'PK-NTN-8924018',
  currency: 'PKR',
  taxRatePercent: 0,
  receiptHeader: 'Thank you for choosing SA Brothers Vendors!',
  receiptFooter: 'Court stamp papers & legal forms verified authentic. Shukriya!',
  defaultCashFloat: 10000.0,
  cashierName: 'Muhammad Ali (Counter 1)',
};

export const INITIAL_PRODUCTS: Product[] = [
  // COURT ITEMS (Exact 10 vendor court items requested)
  {
    id: 'court-v5-001',
    name: 'Rs50 Stamp',
    sku: 'CRT-STP-50',
    barcode: '8901001001',
    category: 'Court Items',
    unit: 'sheet',
    costPrice: 48,
    sellingPrice: 50,
    currentStock: 400,
    initialStock: 500,
    minStockThreshold: 50,
    totalSold: 100,
    description: 'Rs. 50 Judicial Stamp Paper Sheet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-v5-002',
    name: 'Rs100 Stamp',
    sku: 'CRT-STP-100',
    barcode: '8901001002',
    category: 'Court Items',
    unit: 'sheet',
    costPrice: 96,
    sellingPrice: 100,
    currentStock: 350,
    initialStock: 500,
    minStockThreshold: 50,
    totalSold: 150,
    description: 'Rs. 100 Judicial Stamp Paper Sheet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-v5-003',
    name: 'Rs200 Stamp',
    sku: 'CRT-STP-200',
    barcode: '8901001003',
    category: 'Court Items',
    unit: 'sheet',
    costPrice: 190,
    sellingPrice: 200,
    currentStock: 250,
    initialStock: 300,
    minStockThreshold: 30,
    totalSold: 50,
    description: 'Rs. 200 Judicial Stamp Paper Sheet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-v5-004',
    name: 'Rs500 Stamp',
    sku: 'CRT-STP-500',
    barcode: '8901001004',
    category: 'Court Items',
    unit: 'sheet',
    costPrice: 480,
    sellingPrice: 500,
    currentStock: 120,
    initialStock: 150,
    minStockThreshold: 20,
    totalSold: 30,
    description: 'Rs. 500 Legal Deed & Stamp Paper Sheet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-v5-005',
    name: 'Rs1000 Stamp',
    sku: 'CRT-STP-1000',
    barcode: '8901001005',
    category: 'Court Items',
    unit: 'sheet',
    costPrice: 960,
    sellingPrice: 1000,
    currentStock: 65,
    initialStock: 80,
    minStockThreshold: 10,
    totalSold: 15,
    description: 'Rs. 1000 High-Denomination Stamp Paper Sheet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-v5-006',
    name: 'Backdate Stamp',
    sku: 'CRT-STP-BKD',
    barcode: '8901001006',
    category: 'Court Items',
    unit: 'sheet',
    costPrice: 800,
    sellingPrice: 1200,
    currentStock: 35,
    initialStock: 40,
    minStockThreshold: 5,
    totalSold: 5,
    description: 'Backdated verification & issued legal stamp paper',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-v5-007',
    name: 'Rs50-Agreements',
    sku: 'CRT-AGR-50',
    barcode: '8901001007',
    category: 'Court Items',
    unit: 'sheet',
    costPrice: 45,
    sellingPrice: 70,
    currentStock: 280,
    initialStock: 350,
    minStockThreshold: 35,
    totalSold: 70,
    description: 'Rs. 50 Legal Agreement & Contract Paper Form',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-v5-008',
    name: 'Rs100-Agreements',
    sku: 'CRT-AGR-100',
    barcode: '8901001008',
    category: 'Court Items',
    unit: 'sheet',
    costPrice: 90,
    sellingPrice: 130,
    currentStock: 220,
    initialStock: 300,
    minStockThreshold: 30,
    totalSold: 80,
    description: 'Rs. 100 Legal Agreement & Tenancy Deed Form',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-v5-009',
    name: 'Rs200-Agreements',
    sku: 'CRT-AGR-200',
    barcode: '8901001009',
    category: 'Court Items',
    unit: 'sheet',
    costPrice: 180,
    sellingPrice: 250,
    currentStock: 180,
    initialStock: 220,
    minStockThreshold: 20,
    totalSold: 40,
    description: 'Rs. 200 Legal Agreement & Commercial Contract Form',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-v5-010',
    name: 'Notry/Auth Stamp',
    sku: 'CRT-NTR-AUTH',
    barcode: '8901001010',
    category: 'Court Items',
    unit: 'pcs',
    costPrice: 150,
    sellingPrice: 300,
    currentStock: 90,
    initialStock: 100,
    minStockThreshold: 15,
    totalSold: 10,
    description: 'Notary Public & Official Attestation Legal Seal Stamp',
    updatedAt: new Date().toISOString(),
  },

  // OFFICE PAPER (Exact 13 requested paper & legal forms)
  {
    id: 'paper-v6-001',
    name: 'A4 Rim',
    sku: 'PPR-A4-RIM',
    barcode: '8902001001',
    category: 'Office Paper',
    unit: 'ream',
    costPrice: 950,
    sellingPrice: 1250,
    currentStock: 45,
    initialStock: 60,
    minStockThreshold: 10,
    totalSold: 35,
    description: 'A4 Size Paper Ream (500 Sheets)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-002',
    name: 'Legal Rim',
    sku: 'PPR-LGL-RIM',
    barcode: '8902001002',
    category: 'Office Paper',
    unit: 'ream',
    costPrice: 1200,
    sellingPrice: 1550,
    currentStock: 30,
    initialStock: 45,
    minStockThreshold: 8,
    totalSold: 25,
    description: 'Legal Size Paper Ream (500 Sheets)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-003',
    name: 'A4-100p',
    sku: 'PPR-A4-100P',
    barcode: '8902001003',
    category: 'Office Paper',
    unit: 'pack',
    costPrice: 200,
    sellingPrice: 300,
    currentStock: 60,
    initialStock: 80,
    minStockThreshold: 15,
    totalSold: 40,
    description: 'A4 Paper Pack of 100 Pages / Loose Sheets',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-004',
    name: 'Legal-100p',
    sku: 'PPR-LGL-100P',
    barcode: '8902001004',
    category: 'Office Paper',
    unit: 'pack',
    costPrice: 250,
    sellingPrice: 380,
    currentStock: 40,
    initialStock: 60,
    minStockThreshold: 10,
    totalSold: 28,
    description: 'Legal Size Paper Pack of 100 Pages / Loose Sheets',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-005',
    name: 'Ledger-70g',
    sku: 'PPR-LDG-70G',
    barcode: '8902001005',
    category: 'Office Paper',
    unit: 'sheet',
    costPrice: 6,
    sellingPrice: 12,
    currentStock: 400,
    initialStock: 500,
    minStockThreshold: 50,
    totalSold: 120,
    description: 'Green Ledger Paper 70 GSM Legal Sheet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-006',
    name: 'Ledger-80g',
    sku: 'PPR-LDG-80G',
    barcode: '8902001006',
    category: 'Office Paper',
    unit: 'sheet',
    costPrice: 8,
    sellingPrice: 15,
    currentStock: 350,
    initialStock: 450,
    minStockThreshold: 40,
    totalSold: 110,
    description: 'Green Ledger Paper 80 GSM Legal Sheet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-007',
    name: 'Ledger-90g',
    sku: 'PPR-LDG-90G',
    barcode: '8902001007',
    category: 'Office Paper',
    unit: 'sheet',
    costPrice: 10,
    sellingPrice: 20,
    currentStock: 300,
    initialStock: 400,
    minStockThreshold: 30,
    totalSold: 90,
    description: 'Heavy Green Ledger Paper 90 GSM Legal Sheet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-008',
    name: 'Domicile-PRC',
    sku: 'PPR-DOM-PRC',
    barcode: '8902001008',
    category: 'Office Paper',
    unit: 'pcs',
    costPrice: 20,
    sellingPrice: 50,
    currentStock: 150,
    initialStock: 200,
    minStockThreshold: 25,
    totalSold: 65,
    description: 'Domicile & PRC Legal Verification Form',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-009',
    name: 'Nikah-Form',
    sku: 'PPR-NKH-FRM',
    barcode: '8902001009',
    category: 'Office Paper',
    unit: 'set',
    costPrice: 80,
    sellingPrice: 150,
    currentStock: 80,
    initialStock: 100,
    minStockThreshold: 15,
    totalSold: 30,
    description: 'Government Official Nikahnama Form Set',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-010',
    name: 'KMC-Form',
    sku: 'PPR-KMC-FRM',
    barcode: '8902001010',
    category: 'Office Paper',
    unit: 'pcs',
    costPrice: 15,
    sellingPrice: 40,
    currentStock: 120,
    initialStock: 150,
    minStockThreshold: 20,
    totalSold: 45,
    description: 'Karachi Metropolitan Corporation Official Form',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-011',
    name: 'Sale/transfer/Delievry recpit',
    sku: 'PPR-SL-RCP',
    barcode: '8902001011',
    category: 'Office Paper',
    unit: 'pcs',
    costPrice: 15,
    sellingPrice: 35,
    currentStock: 200,
    initialStock: 250,
    minStockThreshold: 30,
    totalSold: 75,
    description: 'Vehicle & Property Sale Transfer Delivery Receipt Slip',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-012',
    name: 'Sale/Transfer Delievery Book',
    sku: 'PPR-SL-BK',
    barcode: '8902001012',
    category: 'Office Paper',
    unit: 'book',
    costPrice: 180,
    sellingPrice: 320,
    currentStock: 45,
    initialStock: 60,
    minStockThreshold: 10,
    totalSold: 20,
    description: 'Sale / Transfer Delivery Receipt Book (Carbon Copies)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paper-v6-013',
    name: 'Arm-Licence',
    sku: 'PPR-ARM-LIC',
    barcode: '8902001013',
    category: 'Office Paper',
    unit: 'pcs',
    costPrice: 25,
    sellingPrice: 60,
    currentStock: 100,
    initialStock: 120,
    minStockThreshold: 20,
    totalSold: 35,
    description: 'Arms License Application & Verification Form',
    updatedAt: new Date().toISOString(),
  },

  // STATIONERY ITEMS (Popular legal vendor & court stationary items)
  {
    id: 'stat-v7-001',
    name: 'Ballpoint Pen Box (Piano 10pcs)',
    sku: 'STN-PEN-BX',
    barcode: '8903001001',
    category: 'Stationery',
    unit: 'box',
    costPrice: 200,
    sellingPrice: 280,
    currentStock: 40,
    initialStock: 50,
    minStockThreshold: 8,
    totalSold: 18,
    description: 'Blue/Black Smooth Ballpoint Pens (Box of 10)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-002',
    name: 'Legal File Cover (Hardboard / Tag File)',
    sku: 'STN-FL-CVR',
    barcode: '8903001002',
    category: 'Stationery',
    unit: 'pcs',
    costPrice: 25,
    sellingPrice: 50,
    currentStock: 150,
    initialStock: 200,
    minStockThreshold: 25,
    totalSold: 60,
    description: 'Standard Green Legal Case File Cover with Tag Lace',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-003',
    name: 'Stamp Pad (Shiny / Blue Ink)',
    sku: 'STN-STP-PAD',
    barcode: '8903001003',
    category: 'Stationery',
    unit: 'pcs',
    costPrice: 120,
    sellingPrice: 200,
    currentStock: 50,
    initialStock: 65,
    minStockThreshold: 10,
    totalSold: 22,
    description: 'Self-Inking Felt Stamp Pad for Official Seal Attestation',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-004',
    name: 'Stamp Pad Ink Refill (Blue 30ml)',
    sku: 'STN-INK-RFL',
    barcode: '8903001004',
    category: 'Stationery',
    unit: 'pcs',
    costPrice: 70,
    sellingPrice: 120,
    currentStock: 60,
    initialStock: 75,
    minStockThreshold: 12,
    totalSold: 25,
    description: 'Quick-Drying Attestation Stamp Pad Ink Bottle',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-005',
    name: 'Correction Pen / Fluid (Whitener)',
    sku: 'STN-COR-PEN',
    barcode: '8903001005',
    category: 'Stationery',
    unit: 'pcs',
    costPrice: 60,
    sellingPrice: 100,
    currentStock: 45,
    initialStock: 60,
    minStockThreshold: 10,
    totalSold: 30,
    description: 'Fine Metal Tip Whitener Correction Pen for Legal Drafting',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-006',
    name: 'Stapler Machine No. 10 (Deli/Kangaro)',
    sku: 'STN-STP-MCH',
    barcode: '8903001006',
    category: 'Stationery',
    unit: 'pcs',
    costPrice: 220,
    sellingPrice: 350,
    currentStock: 30,
    initialStock: 40,
    minStockThreshold: 5,
    totalSold: 14,
    description: 'Durable Metal Desktop Stapler for Legal Case Filings',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-007',
    name: 'Stapler Pins Pack No. 10 (1000s)',
    sku: 'STN-STP-PNS',
    barcode: '8903001007',
    category: 'Stationery',
    unit: 'pack',
    costPrice: 40,
    sellingPrice: 70,
    currentStock: 80,
    initialStock: 100,
    minStockThreshold: 15,
    totalSold: 42,
    description: 'Standard No. 10 Chisel Point Staple Wire Pins',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-008',
    name: 'Heavy Duty 2-Hole Paper Punch',
    sku: 'STN-PPR-PNCH',
    barcode: '8903001008',
    category: 'Stationery',
    unit: 'pcs',
    costPrice: 380,
    sellingPrice: 550,
    currentStock: 20,
    initialStock: 25,
    minStockThreshold: 5,
    totalSold: 8,
    description: 'Two-Hole Punch Machine for Court Filing Folders',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-009',
    name: 'Paper Clips Box (Gem Clips 100s)',
    sku: 'STN-GEM-CLP',
    barcode: '8903001009',
    category: 'Stationery',
    unit: 'box',
    costPrice: 50,
    sellingPrice: 90,
    currentStock: 70,
    initialStock: 85,
    minStockThreshold: 15,
    totalSold: 35,
    description: 'Rust-Resistant Steel Paper Clips (Box of 100)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-010',
    name: 'Highlighter Marker (Yellow/Green)',
    sku: 'STN-HGH-LGT',
    barcode: '8903001010',
    category: 'Stationery',
    unit: 'pcs',
    costPrice: 45,
    sellingPrice: 80,
    currentStock: 50,
    initialStock: 65,
    minStockThreshold: 10,
    totalSold: 28,
    description: 'Fluorescent Document Chisel Tip Highlighter',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-011',
    name: 'Brown Envelopes (Legal Size / Pack 25)',
    sku: 'STN-ENV-LGL',
    barcode: '8903001011',
    category: 'Stationery',
    unit: 'pack',
    costPrice: 180,
    sellingPrice: 280,
    currentStock: 35,
    initialStock: 50,
    minStockThreshold: 8,
    totalSold: 20,
    description: 'Heavy Duty Kraft Brown Legal Document Mailing Envelopes',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stat-v7-012',
    name: 'Register Binding Tape (Green 2-inch)',
    sku: 'STN-REG-TPE',
    barcode: '8903001012',
    category: 'Stationery',
    unit: 'roll',
    costPrice: 90,
    sellingPrice: 150,
    currentStock: 40,
    initialStock: 55,
    minStockThreshold: 10,
    totalSold: 18,
    description: 'Cloth Spine Binding Tape for Legal Records & Ledgers',
    updatedAt: new Date().toISOString(),
  }
];


// Local timezone YYYY-MM-DD date helper (prevents UTC midnight date drift)
export function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDayAsDateStr(isoTimestamp: string, targetDateStr: string): boolean {
  if (!isoTimestamp) return false;
  if (isoTimestamp.startsWith(targetDateStr)) return true;
  const parsed = new Date(isoTimestamp);
  if (isNaN(parsed.getTime())) return false;
  return getLocalDateStr(parsed) === targetDateStr;
}

// Helper to generate realistic timestamps for today and yesterday in PKR
function createInitialTransactions(): SaleTransaction[] {
  const now = new Date();
  const todayStr = getLocalDateStr(now);
  
  const t1 = new Date(now);
  t1.setHours(9, 14, 0, 0);
  const t2 = new Date(now);
  t2.setHours(11, 30, 0, 0);
  const t3 = new Date(now);
  t3.setHours(13, 45, 0, 0);
  const t4 = new Date(now);
  t4.setHours(15, 20, 0, 0);
  const t5 = new Date(now);
  t5.setHours(16, 50, 0, 0);

  return [
    {
      id: 'tx-1001',
      receiptNumber: `RCP-${todayStr.replace(/-/g, '')}-0001`,
      timestamp: t1.toISOString(),
      items: [
        { productId: 'court-v5-002', name: 'Rs100 Stamp', sku: 'CRT-STP-100', quantity: 2, unitPrice: 100, costPrice: 96, total: 200, profit: 8 },
        { productId: 'court-v5-008', name: 'Rs100-Agreements', sku: 'CRT-AGR-100', quantity: 1, unitPrice: 130, costPrice: 90, total: 130, profit: 40 }
      ],
      subtotal: 330,
      discountAmount: 0,
      discountPercent: 0,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 330,
      totalCost: 282,
      grossProfit: 48,
      paymentMethod: 'cash',
      amountTendered: 500,
      changeDue: 170,
      customerName: 'Advocate Tariq Mehmood',
      customerPhone: '0300-5551234',
      cashierName: 'Muhammad Ali (Counter 1)',
      status: 'completed'
    },
    {
      id: 'tx-1002',
      receiptNumber: `RCP-${todayStr.replace(/-/g, '')}-0002`,
      timestamp: t2.toISOString(),
      items: [
        { productId: 'paper-v6-001', name: 'A4 Rim', sku: 'PPR-A4-RIM', quantity: 3, unitPrice: 1250, costPrice: 950, total: 3750, profit: 900 },
        { productId: 'paper-v6-002', name: 'Legal Rim', sku: 'PPR-LGL-RIM', quantity: 1, unitPrice: 1550, costPrice: 1200, total: 1550, profit: 350 },
        { productId: 'paper-v6-004', name: 'Legal-100p', sku: 'PPR-LGL-100P', quantity: 2, unitPrice: 380, costPrice: 250, total: 760, profit: 260 }
      ],
      subtotal: 6060,
      discountAmount: 200,
      discountPercent: 3.3,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 5860,
      totalCost: 4550,
      grossProfit: 1310,
      paymentMethod: 'cash',
      amountTendered: 6000,
      changeDue: 140,
      customerName: 'Legal Chamber of Kamran Shah',
      cashierName: 'Muhammad Ali (Counter 1)',
      status: 'completed'
    },
    {
      id: 'tx-1003',
      receiptNumber: `RCP-${todayStr.replace(/-/g, '')}-0003`,
      timestamp: t3.toISOString(),
      items: [
        { productId: 'court-v5-004', name: 'Rs500 Stamp', sku: 'CRT-STP-500', quantity: 2, unitPrice: 500, costPrice: 480, total: 1000, profit: 40 },
        { productId: 'court-v5-010', name: 'Notry/Auth Stamp', sku: 'CRT-NTR-AUTH', quantity: 1, unitPrice: 300, costPrice: 150, total: 300, profit: 150 }
      ],
      subtotal: 1300,
      discountAmount: 0,
      discountPercent: 0,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 1300,
      totalCost: 1110,
      grossProfit: 190,
      paymentMethod: 'mobile_qr',
      amountTendered: 1300,
      changeDue: 0,
      customerName: 'Malik Zafar',
      cashierName: 'Muhammad Ali (Counter 1)',
      status: 'completed'
    },
    {
      id: 'tx-1004',
      receiptNumber: `RCP-${todayStr.replace(/-/g, '')}-0004`,
      timestamp: t4.toISOString(),
      items: [
        { productId: 'paper-v6-003', name: 'A4-100p', sku: 'PPR-A4-100P', quantity: 2, unitPrice: 300, costPrice: 200, total: 600, profit: 200 },
        { productId: 'court-v5-001', name: 'Rs50 Stamp', sku: 'CRT-STP-50', quantity: 4, unitPrice: 50, costPrice: 48, total: 200, profit: 8 },
        { productId: 'paper-v6-005', name: 'Ledger-70g', sku: 'PPR-LDG-70G', quantity: 10, unitPrice: 12, costPrice: 6, total: 120, profit: 60 }
      ],
      subtotal: 920,
      discountAmount: 0,
      discountPercent: 0,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 920,
      totalCost: 652,
      grossProfit: 268,
      paymentMethod: 'card',
      amountTendered: 920,
      changeDue: 0,
      customerName: 'Zubair Ahmed',
      cashierName: 'Muhammad Ali (Counter 1)',
      status: 'completed'
    },
    {
      id: 'tx-1005',
      receiptNumber: `RCP-${todayStr.replace(/-/g, '')}-0005`,
      timestamp: t5.toISOString(),
      items: [
        { productId: 'court-v5-006', name: 'Backdate Stamp', sku: 'CRT-STP-BKD', quantity: 1, unitPrice: 1200, costPrice: 800, total: 1200, profit: 400 },
        { productId: 'paper-v6-012', name: 'Sale/Transfer Delievery Book', sku: 'PPR-SL-BK', quantity: 2, unitPrice: 320, costPrice: 180, total: 640, profit: 280 }
      ],
      subtotal: 1840,
      discountAmount: 40,
      discountPercent: 2.2,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 1800,
      totalCost: 1160,
      grossProfit: 640,
      paymentMethod: 'cash',
      amountTendered: 2000,
      changeDue: 200,
      cashierName: 'Muhammad Ali (Counter 1)',
      status: 'completed'
    }
  ];
}

function createInitialExpenses(): Expense[] {
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  return [
    {
      id: 'exp-01',
      date: todayStr,
      timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30).toISOString(),
      category: 'Packaging & Supplies',
      description: 'Thermal receipt paper rolls & packing envelopes',
      amount: 1200,
      paymentMethod: 'cash',
      receiptRef: 'SUPP-8812'
    },
    {
      id: 'exp-02',
      date: todayStr,
      timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 15).toISOString(),
      category: 'Staff Wages',
      description: 'Daily assistant cashier & clerk allowance',
      amount: 2500,
      paymentMethod: 'cash',
      receiptRef: 'PAY-1102'
    },
    {
      id: 'exp-03',
      date: todayStr,
      timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString(),
      category: 'Inventory Freight',
      description: 'Paper mill wholesale reams delivery transport fare',
      amount: 1500,
      paymentMethod: 'bank_transfer',
      receiptRef: 'LOG-772'
    }
  ];
}

// Storage Accessors
export const storageService = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        // Check if v6 had products
        const oldData = localStorage.getItem('shopkeep_products_v6');
        let initialList = INITIAL_PRODUCTS;
        if (oldData) {
          try {
            const parsedOld: Product[] = JSON.parse(oldData);
            const stationeryInit = INITIAL_PRODUCTS.filter((p) => p.category === 'Stationery');
            const nonStationery = parsedOld.filter(
              (p) => !stationeryInit.some((s) => s.id === p.id)
            );
            initialList = [...nonStationery, ...stationeryInit];
          } catch {}
        }
        localStorage.setItem('shopkeep_stationery_seeded_v7', 'true');
        this.saveProducts(initialList);
        return initialList;
      }
      const existing: Product[] = JSON.parse(data);

      // One-time migration for v7 stationery items so user-deleted items are never re-added
      const alreadySeeded = localStorage.getItem('shopkeep_stationery_seeded_v7') === 'true';
      if (!alreadySeeded) {
        localStorage.setItem('shopkeep_stationery_seeded_v7', 'true');
        const missingStationery = INITIAL_PRODUCTS.filter(
          (initP) => initP.category === 'Stationery' && !existing.some((p) => p.id === initP.id || p.sku === initP.sku)
        );
        if (missingStationery.length > 0) {
          const merged = [...existing, ...missingStationery];
          this.saveProducts(merged);
          return merged;
        }
      }

      return existing;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },


  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getTransactions(): SaleTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        const initial = createInitialTransactions();
        this.saveTransactions(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveTransactions(transactions: SaleTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getExpenses(): Expense[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (!data) {
        const initial = createInitialExpenses();
        this.saveExpenses(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveExpenses(expenses: Expense[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  getMovements(): StockMovement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMovements(movements: StockMovement[]): void {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  },

  getSettings(): ShopSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem('shopkeep_settings_v2');
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      const parsed = JSON.parse(data);
      if (parsed.shopName === 'Metro Corner Mart' || !parsed.shopName) {
        parsed.shopName = 'SA Brothers Vendors';
      }
      if (parsed.currency === '$' || !parsed.currency) {
        parsed.currency = 'PKR';
      }
      parsed.taxRatePercent = 0; // Tax removed from sales
      const merged = { ...DEFAULT_SETTINGS, ...parsed, taxRatePercent: 0 };
      this.saveSettings(merged);
      return merged;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: ShopSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getHeldOrders(): HeldOrder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HELD_ORDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveHeldOrders(orders: HeldOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.HELD_ORDERS, JSON.stringify(orders));
  },

  // Profiles and Permissions
  getProfiles(): UserProfile[] {
    try {
      localStorage.removeItem('shopkeep_profiles_v6');
      localStorage.removeItem('shopkeep_profiles_v7');
      localStorage.removeItem('shopkeep_profiles_v8');
      const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (!data) {
        this.saveProfiles(DEFAULT_PROFILES);
        return DEFAULT_PROFILES;
      }
      const parsed: UserProfile[] = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveProfiles(DEFAULT_PROFILES);
        return DEFAULT_PROFILES;
      }
      const hasOwner = parsed.some((p) => p.role === 'owner');
      const hasStaff = parsed.some((p) => p.role === 'staff');
      if (!hasOwner || !hasStaff) {
        const merged = [...parsed];
        if (!hasOwner) merged.unshift(DEFAULT_PROFILES[0]);
        if (!hasStaff) merged.push(DEFAULT_PROFILES[1]);
        this.saveProfiles(merged);
        return merged;
      }
      return parsed;
    } catch {
      return DEFAULT_PROFILES;
    }
  },

  saveProfiles(profiles: UserProfile[]): void {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    try {
      fetch('/api/local-db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles }),
      }).catch(() => {});
    } catch {}
  },

  getActiveProfileId(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
      if (stored) return stored;
      return 'prof-owner';
    } catch {
      return 'prof-owner';
    }
  },

  saveActiveProfileId(profileId: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, profileId);
  },

  // Export full shop database as JSON string
  exportBackup(): string {
    const backup = {
      exportDate: new Date().toISOString(),
      products: this.getProducts(),
      transactions: this.getTransactions(),
      expenses: this.getExpenses(),
      movements: this.getMovements(),
      settings: this.getSettings(),
      profiles: this.getProfiles(),
    };
    return JSON.stringify(backup, null, 2);
  },

  // Import shop database
  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products) this.saveProducts(parsed.products);
      if (parsed.transactions) this.saveTransactions(parsed.transactions);
      if (parsed.expenses) this.saveExpenses(parsed.expenses);
      if (parsed.movements) this.saveMovements(parsed.movements);
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.profiles) this.saveProfiles(parsed.profiles);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  },

  // Reset to original demo shop state
  resetToDemo(): void {
    localStorage.setItem('shopkeep_stationery_seeded_v7', 'true');
    this.saveProducts(INITIAL_PRODUCTS);
    this.saveTransactions(createInitialTransactions());
    this.saveExpenses(createInitialExpenses());
    this.saveSettings(DEFAULT_SETTINGS);
    this.saveProfiles(DEFAULT_PROFILES);
    this.saveActiveProfileId('prof-owner');
    this.saveMovements([]);
    this.saveHeldOrders([]);
  },

  // Machine Fingerprint & Device Authorization for Shop PC Only
  getThisDeviceId(): string {
    try {
      let id = localStorage.getItem(STORAGE_KEYS.THIS_DEVICE_ID);
      if (!id) {
        id = 'PC-SA-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
        localStorage.setItem(STORAGE_KEYS.THIS_DEVICE_ID, id);
      }
      return id;
    } catch {
      return 'PC-SA-DEFAULT';
    }
  },

  getDeviceSecurityConfig(): DeviceSecurityConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEVICE_LOCK);
      if (!data) return DEFAULT_DEVICE_SECURITY;
      return JSON.parse(data);
    } catch {
      return DEFAULT_DEVICE_SECURITY;
    }
  },

  saveDeviceSecurityConfig(config: DeviceSecurityConfig): void {
    localStorage.setItem(STORAGE_KEYS.DEVICE_LOCK, JSON.stringify(config));
    try {
      fetch('/api/device-lock/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).catch(() => {});
    } catch {}
  },

  isDeviceAuthorized(): boolean {
    return true;
  },

  authorizeThisDevice(customName?: string): DeviceSecurityConfig {
    const currentId = this.getThisDeviceId();
    const updated: DeviceSecurityConfig = {
      isDeviceLockEnabled: true,
      authorizedDeviceId: currentId,
      authorizedDeviceName: customName || 'SA Brothers Counter PC (Authorized)',
      authorizedAt: new Date().toISOString(),
      isLocalOnlyMode: true,
    };
    this.saveDeviceSecurityConfig(updated);
    return updated;
  },

  unauthorizeDevice(): DeviceSecurityConfig {
    const updated: DeviceSecurityConfig = {
      isDeviceLockEnabled: false,
      authorizedDeviceId: '',
      authorizedDeviceName: 'Unassigned',
      authorizedAt: undefined,
      isLocalOnlyMode: true,
    };
    this.saveDeviceSecurityConfig(updated);
    return updated;
  },

  // Authentication session helpers: always require 4-digit PIN login when opening the software
  getIsLoggedIn(): boolean {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
      localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    } catch {}
    return false;
  },

  setIsLoggedIn(_loggedIn: boolean): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
      localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    } catch {}
  },

  // Save everything to computer hard drive (/local_database/) with instant durability
  saveToHardDrive(allData?: {
    products?: Product[];
    transactions?: SaleTransaction[];
    expenses?: Expense[];
    movements?: StockMovement[];
    settings?: ShopSettings;
    profiles?: UserProfile[];
  }): void {
    try {
      const payload = {
        products: allData?.products ?? this.getProducts(),
        transactions: allData?.transactions ?? this.getTransactions(),
        expenses: allData?.expenses ?? this.getExpenses(),
        movements: allData?.movements ?? this.getMovements(),
        settings: allData?.settings ?? this.getSettings(),
        profiles: allData?.profiles ?? this.getProfiles(),
        deviceLock: this.getDeviceSecurityConfig(),
      };

      const jsonStr = JSON.stringify(payload);

      fetch('/api/local-db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
      }).catch(() => {});
    } catch {}
  }
};
