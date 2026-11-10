import React, { useState, useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { PosRegister } from './components/pos/PosRegister';
import { InventoryManager } from './components/inventory/InventoryManager';
import { ShopDashboard } from './components/dashboard/ShopDashboard';
import { ExpenseLedger } from './components/expenses/ExpenseLedger';
import { EndOfDayReportView } from './components/reports/EndOfDayReport';
import { SalesHistory } from './components/history/SalesHistory';
import { StoreSettingsView } from './components/settings/StoreSettings';
import { ReceiptModal } from './components/receipts/ReceiptModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { AddProductModal } from './components/inventory/AddProductModal';
import { DeviceLockScreen } from './components/security/DeviceLockScreen';
import { LoginScreen } from './components/auth/LoginScreen';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('shopkeep_theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  const {
    currentReceipt,
    isReceiptModalOpen,
    closeReceiptModal,
    isAddProductModalOpen,
    closeAddProductModal,
    addProductInitialCategory,
    isOwner,
    isThisDeviceAuthorized,
    isLoggedIn,
  } = useShop();

  // Apply dark class to document root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('shopkeep_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('shopkeep_theme', 'light');
    }
  }, [isDarkMode]);

  // Isolate print target when receipt modal is active
  useEffect(() => {
    if (isReceiptModalOpen) {
      document.body.classList.add('has-receipt-modal-open');
    } else {
      document.body.classList.remove('has-receipt-modal-open');
    }
    return () => {
      document.body.classList.remove('has-receipt-modal-open');
    };
  }, [isReceiptModalOpen]);

  // If Staff profile is active and user is on an owner-only tab, safely redirect to POS
  useEffect(() => {
    if (!isOwner && (activeTab === 'inventory' || activeTab === 'dashboard' || activeTab === 'reports' || activeTab === 'settings')) {
      setActiveTab('pos');
    }
  }, [isOwner, activeTab]);

  // If user is not logged in, show username and password login screen on opening the app
  // (Always placed AFTER all hooks to adhere to React Hook Rules)
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors">
      {/* Left Side Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Workspace (Top Header + Content Viewport) */}
      <div className="main-workspace flex-1 flex flex-col min-w-0">
        <TopBar
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onNavigateToInventory={() => setActiveTab('inventory')}
        />

        <main className="flex-1 overflow-x-hidden">
          {activeTab === 'court_items' && <PosRegister initialCategory="Court Items" />}
          {activeTab === 'office_paper' && <PosRegister initialCategory="Office Paper" />}
          {activeTab === 'stationery' && <PosRegister initialCategory="Stationery" />}
          {activeTab === 'pos' && <PosRegister initialCategory="All" />}
          {activeTab === 'dashboard' && (
            <ShopDashboard
              onNavigateToPos={() => setActiveTab('pos')}
              onNavigateToInventory={() => setActiveTab('inventory')}
              onNavigateToExpenses={() => setActiveTab('expenses')}
              onNavigateToReports={() => setActiveTab('reports')}
            />
          )}
          {activeTab === 'inventory' && <InventoryManager />}
          {activeTab === 'sales' && <SalesHistory />}
          {activeTab === 'expenses' && <ExpenseLedger />}
          {activeTab === 'reports' && <EndOfDayReportView />}
          {activeTab === 'settings' && <StoreSettingsView />}
        </main>
      </div>

      {/* Thermal Receipt Modal (Accessible globally from any sale or history) */}
      <ReceiptModal
        transaction={currentReceipt}
        isOpen={isReceiptModalOpen}
        onClose={closeReceiptModal}
      />

      {/* Profile PIN Switcher & Auth Modal */}
      <ProfileModal />

      {/* Owner Manual Add Item Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={closeAddProductModal}
        initialCategory={addProductInitialCategory}
      />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
