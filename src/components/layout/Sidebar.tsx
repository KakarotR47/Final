import React from 'react';
import { useShop } from '../../context/ShopContext';
import {
  Scale,
  FileStack,
  ShoppingCart,
  LayoutDashboard,
  Boxes,
  Receipt,
  Wallet,
  FileSpreadsheet,
  Settings,
  AlertTriangle,
  Sun,
  Moon,
  Plus,
  Store,
  ChevronRight,
  X,
  PenTool,
  Lock,
  ShieldCheck,
  UserCheck,
  LogOut,
} from 'lucide-react';
import saBrothersLogo from '../../assets/images/sa_brothers_logo.jpg';

export type ActiveTab =
  | 'court_items'
  | 'office_paper'
  | 'stationery'
  | 'pos'
  | 'dashboard'
  | 'inventory'
  | 'sales'
  | 'expenses'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  isMobileOpen,
  setIsMobileOpen,
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

  const productNavItems: Array<{
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }> = [
    {
      id: 'court_items',
      label: 'Court Items',
      description: 'Stamps (Rs 50–1000), Agreements & Notary',
      icon: Scale,
      accentColor: 'text-amber-500',
    },
    {
      id: 'office_paper',
      label: 'Office Paper',
      description: 'A4/Legal Rims, Ledger & Legal Forms',
      icon: FileStack,
      accentColor: 'text-blue-500',
    },
    {
      id: 'stationery',
      label: 'Stationery',
      description: 'File covers, stamp pads, pens & supplies',
      icon: PenTool,
      accentColor: 'text-purple-500',
    },
    {
      id: 'pos',
      label: 'All Items (POS)',
      description: 'Full catalog & barcode scanner',
      icon: ShoppingCart,
      accentColor: 'text-emerald-500',
    },
  ];

  const allManagementNavItems: Array<{
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'inventory',
      label: 'Stock / Inventory',
      description: 'Remaining stock, sold & restock',
      icon: Boxes,
      badgeCount: totalAlertsCount > 0 ? totalAlertsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'dashboard',
      label: 'Profit & Dashboard',
      description: 'Daily revenue, net profit & alerts',
      icon: LayoutDashboard,
    },
    {
      id: 'sales',
      label: 'Past Bills & Receipts',
      description: 'Sales history, reprint & returns',
      icon: Receipt,
    },
    {
      id: 'expenses',
      label: 'Shop Expenses',
      description: 'Daily wages, bills & shop supplies',
      icon: Wallet,
    },
    {
      id: 'reports',
      label: 'Daily Closing (EOD)',
      description: 'End-of-day cash drawer & audit',
      icon: FileSpreadsheet,
    },
    {
      id: 'settings',
      label: 'Store Settings',
      description: 'Shop info, currency & profiles',
      icon: Settings,
    },
  ];

  // Staff cannot see Stock Inventory, Profit Dashboard, or Store Settings
  const visibleManagementItems = allManagementNavItems.filter((item) => {
    if (isOwner) return true;
    return item.id === 'sales' || item.id === 'expenses';
  });


  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Left Sidebar */}
      <aside
        className={`no-print fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Shop Branding & Close button on Mobile */}
        <div>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-amber-500/40 p-0.5 bg-gradient-to-tr from-amber-500/20 to-amber-200/40 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={saBrothersLogo}
                  alt="SA Brothers"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {settings.shopName || 'SA Brothers Vendors'}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Point of Sale &amp; Inventory
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action CTAs */}
          <div className="p-3 space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('pos');
                setIsMobileOpen(false);
              }}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Sale</span>
            </button>

            {/* Owner Add Item Button */}
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  openAddProductModal();
                  setIsMobileOpen(false);
                }}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-2"
                title="Manually add new item to shop catalog"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>+ Add Item to Catalog</span>
              </button>
            )}
          </div>

          {/* Left Vertical Navigation List */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-16rem)] scrollbar-thin">
            {/* Category / Selling Tabs */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Product Categories</span>
                <span className="text-[9px] lowercase font-normal text-emerald-600 dark:text-emerald-400 font-mono">click to sell</span>
              </div>
              <div className="space-y-1">
                {productNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isActive
                              ? 'bg-slate-800 dark:bg-slate-100 text-emerald-400 dark:text-emerald-600'
                              : `bg-slate-100 dark:bg-slate-800 ${item.accentColor}`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {item.label}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isActive
                                ? 'text-slate-300 dark:text-slate-600'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 opacity-40 ${isActive ? 'text-white dark:text-slate-900' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Management & Reports Tabs */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Shop Management</span>
                {!isOwner && (
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono">staff limited</span>
                )}
              </div>
              <div className="space-y-1">
                {visibleManagementItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isActive
                              ? 'bg-slate-800 dark:bg-slate-100 text-emerald-400 dark:text-emerald-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {item.label}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isActive
                                ? 'text-slate-300 dark:text-slate-600'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {item.description}
                          </div>
                        </div>
                      </div>

                      {/* Badge */}
                      {item.badgeCount !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-1.5 ${
                            item.badgeColor || 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Staff Info Note if not owner */}
                {!isOwner && (
                  <div className="p-2.5 mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Stock &amp; Profit Protected</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Inventory levels, daily profit, and settings are hidden in staff profile.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom Section: Cashier Status & Theme Toggle */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Active Cashier Status & Dark Mode */}
          <div className="flex items-center justify-between text-xs px-1 pt-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {settings.cashierName || 'Counter 1'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle theme"
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Logout button */}
              <button
                onClick={logout}
                aria-label="Lock and Logout"
                className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Lock & Exit to Login Screen"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
