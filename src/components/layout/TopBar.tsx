import React from 'react';
import { useShop } from '../../context/ShopContext';
import { ActiveTab } from './Sidebar';
import { Menu, AlertTriangle, Coins, Lock, Plus, LogOut } from 'lucide-react';

interface TopBarProps {
  activeTab: ActiveTab;
  onOpenMobileSidebar: () => void;
  onNavigateToInventory: () => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  court_items: {
    title: 'Court Items & Stamps',
    subtitle: 'Rs50 to Rs1000 Stamps, Backdate Stamps, Rs50/100/200 Agreements & Notary Stamps',
  },
  office_paper: {
    title: 'Office Paper & Legal Forms',
    subtitle: 'A4/Legal Rims, 100p Packs, Ledger (70/80/90g), Domicile, Nikah, KMC, Sale/Delivery Books & Arm License',
  },
  stationery: {
    title: 'Stationery & Office Supplies',
    subtitle: 'Legal file covers, stamp pads, stamp ink, whitener pens, staplers, punches & paper clips',
  },
  pos: {
    title: 'Point of Sale (All Items)',
    subtitle: 'Scan barcodes or search all items to create customer bills and print receipts',
  },
  dashboard: {
    title: 'Daily Profit & Business Overview',
    subtitle: 'Today’s sales revenue, profit margin, operating expenses and stock alerts',
  },
  inventory: {
    title: 'Stock & Inventory Management',
    subtitle: 'Check remaining units, total sold, restock deliveries, and reorder alerts',
  },
  sales: {
    title: 'Past Bills & Receipts Archive',
    subtitle: 'Search previous orders, reprint receipts, and process customer returns',
  },
  expenses: {
    title: 'Shop Operating Expenses',
    subtitle: 'Track daily wages, shop bills, freight, and packaging costs',
  },
  reports: {
    title: 'Daily Closing & End-of-Day (EOD) Report',
    subtitle: 'Reconcile drawer cash, verify totals, and print official Z-reports',
  },
  settings: {
    title: 'Store Settings & Backup',
    subtitle: 'Manage shop details, currency symbol, cashier till, and database backups',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onNavigateToInventory,
}) => {
  const {
    settings,
    totalAlertsCount,
    activeProfile,
    isOwner,
    openProfileModal,
    openAddProductModal,
    logout,
  } = useShop();
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.pos;

  return (
    <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Active Section Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
              {currentTabInfo.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Status Indicators & Profile Control */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Owner Quick Add Item button */}
          {isOwner && (
            <button
              onClick={() => openAddProductModal()}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Add a new product to catalogue"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          )}

          {/* Shop PC Offline / Hard Drive Storage Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300" title="All data saves to this computer hard drive (100% offline ready)">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Shop PC (Hard Disk Saved)</span>
          </div>

          {/* Currency Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            <span>Currency: {settings.currency}</span>
          </div>

          {/* Low Stock Alert Badge (Owner only: staff cannot see stock inventory) */}
          {isOwner && totalAlertsCount > 0 && (
            <button
              onClick={onNavigateToInventory}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shadow-2xs"
              title="Click to view items needing reorder"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>{totalAlertsCount} Low Stock</span>
            </button>
          )}

          {/* Top Profile Switcher Button */}
          <button
            onClick={() => openProfileModal()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
              isOwner
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 hover:bg-blue-100'
            }`}
            title="Click to switch profile PIN"
          >
            <span>{isOwner ? '👑' : '👤'}</span>
            <span className="hidden sm:inline">{activeProfile.name}</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              {isOwner ? 'Owner' : 'Staff'}
            </span>
            <Lock className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* Logout / Lock back to Login Screen */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shadow-2xs"
            title="Exit session & lock register to Login Screen"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden md:inline">Lock / Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
