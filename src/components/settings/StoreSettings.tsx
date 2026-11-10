import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  Settings,
  Store,
  DollarSign,
  Receipt,
  Download,
  Upload,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  Database,
  Server,
  FileCode2,
  ExternalLink,
  HardDrive,
  Monitor,
  PlayCircle,
  FolderCheck,
} from 'lucide-react';
import { downloadBinaryFile, DownloadProgress } from '../../services/fileDownloader';

const CURRENCIES = [
  { symbol: 'PKR', label: 'PKR - Pakistani Rupee (PKR)' },
  { symbol: '₨', label: '₨ - Rupee Symbol (Rs / ₨)' },
  { symbol: '$', label: '$ - US Dollar / CAD / AUD' },
  { symbol: '€', label: '€ - Euro' },
  { symbol: '£', label: '£ - British Pound' },
  { symbol: 'AED', label: 'AED - UAE Dirham' },
  { symbol: 'SAR', label: 'SAR - Saudi Riyal' },
  { symbol: '₹', label: '₹ - Indian Rupee' },
  { symbol: '¥', label: '¥ - Japanese Yen / Chinese Yuan' },
  { symbol: '₱', label: '₱ - Philippine Peso' },
  { symbol: 'R$', label: 'R$ - Brazilian Real' },
  { symbol: 'KSh', label: 'KSh - Kenyan Shilling' },
  { symbol: '₦', label: '₦ - Nigerian Naira' },
];

export const StoreSettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetDemoData,
    exportDatabaseBackup,
    importDatabaseBackup,
    profiles,
    updateProfilePin,
    updateProfileName,
    isOwner,
    openProfileModal,
    deviceSecurity,
    thisDeviceId,
    authorizeCurrentComputer,
    unauthorizeComputer,
    saveDatabaseToHardDriveNow,
    hardDriveLastSaved,
  } = useShop();

  const [form, setForm] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Hard Drive Saving State
  const [syncingHardDrive, setSyncingHardDrive] = useState(false);
  const [hardDriveSuccess, setHardDriveSuccess] = useState<string | null>(null);

  // Package download state
  const [downloadingPkg, setDownloadingPkg] = useState<'exe' | 'zip' | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const handleDownloadPackage = async (target: 'exe' | 'zip') => {
    if (downloadingPkg) return;
    setDownloadingPkg(target);
    setDownloadProgress(null);
    try {
      if (target === 'exe') {
        await downloadBinaryFile('/api/download-exe', 'SA_Brothers_POS.exe', (p) => setDownloadProgress(p));
      } else {
        await downloadBinaryFile('/api/download-windows-package', 'SA_Brothers_POS_Windows_Package.zip', (p) => setDownloadProgress(p));
      }
    } catch (err: any) {
      console.error(err);
      window.open(target === 'exe' ? '/api/download-exe' : '/api/download-windows-package', '_blank');
    } finally {
      setDownloadingPkg(null);
      setDownloadProgress(null);
    }
  };

  const handleManualSaveHardDrive = async () => {
    setSyncingHardDrive(true);
    const ok = await saveDatabaseToHardDriveNow();
    setSyncingHardDrive(false);
    if (ok) {
      setHardDriveSuccess('All store data successfully written to this computer hard drive (./local_database/)');
      setTimeout(() => setHardDriveSuccess(null), 3500);
    }
  };

  // Profile PIN edit states
  const [ownerPinEdit, setOwnerPinEdit] = useState('');
  const [staffPinEdit, setStaffPinEdit] = useState('');
  const [ownerNameEdit, setOwnerNameEdit] = useState('');
  const [staffNameEdit, setStaffNameEdit] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPinsInSettings, setShowPinsInSettings] = useState(false);

  useEffect(() => {
    const owner = profiles.find((p) => p.role === 'owner');
    const staff = profiles.find((p) => p.role === 'staff');
    if (owner) {
      setOwnerPinEdit(owner.pin);
      setOwnerNameEdit(owner.name);
    }
    if (staff) {
      setStaffPinEdit(staff.pin);
      setStaffNameEdit(staff.name);
    }
  }, [profiles]);


  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const applyProfileUpdates = (): boolean => {
    setProfileMsg(null);
    const owner = profiles.find((p) => p.role === 'owner');
    const staff = profiles.find((p) => p.role === 'staff');

    if (!/^\d{4}$/.test(ownerPinEdit.trim()) || !/^\d{4}$/.test(staffPinEdit.trim())) {
      setProfileMsg({
        type: 'error',
        text: 'Both Owner and Staff PINs must be exactly 4 numeric digits (e.g. 1080, 1234).',
      });
      return false;
    }

    if (ownerPinEdit.trim() === staffPinEdit.trim()) {
      setProfileMsg({
        type: 'error',
        text: 'Owner PIN and Staff PIN must be different 4-digit codes for strict security.',
      });
      return false;
    }

    if (owner) {
      updateProfilePin(owner.id, ownerPinEdit.trim());
      updateProfileName(owner.id, ownerNameEdit.trim());
    }
    if (staff) {
      updateProfilePin(staff.id, staffPinEdit.trim());
      updateProfileName(staff.id, staffNameEdit.trim());
    }

    setProfileMsg({
      type: 'success',
      text: `Saved! Owner PIN (${ownerPinEdit.trim()}) & Staff PIN (${staffPinEdit.trim()}) are now strictly enforced.`,
    });
    setTimeout(() => setProfileMsg(null), 4000);
    return true;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyProfileUpdates()) return;
    updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExport = () => {
    const jsonStr = exportDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopkeep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importDatabaseBackup(content);
      if (ok) {
        setImportStatus('Backup restored successfully!');
      } else {
        setImportStatus('Failed to import backup file. Check file JSON format.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleSaveProfiles = (e: React.FormEvent) => {
    e.preventDefault();
    applyProfileUpdates();
  };

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-2xs">
          <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Store Settings Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Staff profiles cannot access store configuration, password controls, or database backups. Please enter the Owner password to unlock.
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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Store Profile &amp; Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure shop name, receipt print details, profile passwords, tax rate, currency, and data backups
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Business Identity &amp; Contact
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Shop / Business Name *
              </label>
              <input
                type="text"
                required
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Store Physical Address (Printed on Receipts) *
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Receipt Helpline Numbers *
              </label>
              <input
                type="text"
                required
                value={form.helpline || form.phone}
                onChange={(e) => setForm({ ...form, helpline: e.target.value, phone: e.target.value })}
                placeholder="+923401645979 +923002634491"
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Court Vendor License # (Printed on Receipts) *
              </label>
              <input
                type="text"
                required
                value={form.licenseNumber || 'Gos-KHI 18'}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                placeholder="Gos-KHI 18"
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tax / NTN Registration #
              </label>
              <input
                type="text"
                value={form.taxNumber}
                onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financial Configuration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Currency &amp; Register Defaults
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Store Currency Symbol *
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Sales Tax (GST / VAT)
              </label>
              <div className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>0% (Tax Removed)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Tax-Free Sales</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Morning Opening Float ({form.currency || 'PKR'})
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={form.defaultCashFloat}
                onChange={(e) => setForm({ ...form, defaultCashFloat: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Active Cashier Name / Station Identifier
              </label>
              <input
                type="text"
                value={form.cashierName}
                onChange={(e) => setForm({ ...form, cashierName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Receipt Slip Customization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Thermal Receipt Messages
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Receipt Greeting Message (Printed below total)
              </label>
              <input
                type="text"
                value={form.receiptHeader}
                onChange={(e) => setForm({ ...form, receiptHeader: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Receipt Return Policy / Footer
              </label>
              <input
                type="text"
                value={form.receiptFooter}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Profile Passwords & Staff Permissions Card (Owner Controls) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Profile Passwords &amp; Staff Access Permissions
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowPinsInSettings(!showPinsInSettings)}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
            >
              {showPinsInSettings ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPinsInSettings ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set and manage passwords for each profile. Staff members have limited permissions (cannot view stock inventory, profit dashboard, or store settings).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Owner Profile Setting */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">👑</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Owner Profile</div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Full Administrative Access</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                  Owner
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Owner Profile Name
                </label>
                <input
                  type="text"
                  value={ownerNameEdit}
                  onChange={(e) => setOwnerNameEdit(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Owner 4-Digit PIN *
                </label>
                <input
                  type={showPinsInSettings ? 'text' : 'password'}
                  required
                  maxLength={4}
                  inputMode="numeric"
                  value={ownerPinEdit}
                  onChange={(e) => setOwnerPinEdit(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="e.g. 1234"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                ✓ Full access to Stock Inventory, Indenting, Prices/Costs, Profits, EOD, and Settings.
              </div>
            </div>

            {/* Staff Profile Setting */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Staff Profile</div>
                    <div className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">Limited Access Mode</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
                  Staff
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Staff Profile Name
                </label>
                <input
                  type="text"
                  value={staffNameEdit}
                  onChange={(e) => setStaffNameEdit(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Staff 4-Digit PIN (Set by Owner) *
                </label>
                <input
                  type={showPinsInSettings ? 'text' : 'password'}
                  required
                  maxLength={4}
                  inputMode="numeric"
                  value={staffPinEdit}
                  onChange={(e) => setStaffPinEdit(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="e.g. 0000"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-blue-200/60 dark:border-blue-900/40">
                ✓ Can sell at POS &amp; write shop expenses. ✗ Stock Inventory, Profit Dashboard &amp; Settings are strictly hidden.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {profileMsg && (
                <span
                  className={`text-xs font-semibold flex items-center gap-1.5 animate-in fade-in ${
                    profileMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{profileMsg.text}</span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSaveProfiles}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
            >
              Update Profile Passwords
            </button>
          </div>
        </div>

        {/* Save Settings Bar */}
        <div className="flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Store configuration saved successfully!</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>

      {/* SHOP COMPUTER ONLY & LOCAL HARD DRIVE STORAGE */}
      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Shop Computer Terminal &amp; Local Hard Drive Storage
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  100% Offline PC Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configured to run strictly on your shop computer. All sales, expenses, and inventory are saved permanently to this PC hard disk in <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[11px] text-slate-800 dark:text-slate-200">./local_database/</code>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadPackage('exe')}
              disabled={downloadingPkg !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Download standalone Windows 64-bit executable (SA_Brothers_POS.exe, 68 MB) - runs with zero dependencies!"
            >
              <Download className={`w-3.5 h-3.5 ${downloadingPkg === 'exe' ? 'animate-bounce' : ''}`} />
              <span>
                {downloadingPkg === 'exe' && downloadProgress
                  ? `Downloading .exe (${downloadProgress.percent}%) ${downloadProgress.loadedMB}/${downloadProgress.totalMB} MB`
                  : downloadingPkg === 'exe'
                  ? 'Downloading 68 MB...'
                  : 'Download PC App (.exe, 68 MB)'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPackage('zip')}
              disabled={downloadingPkg !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Download full Windows package (56 MB zip) including 68MB .exe, node runtime, launcher, and local database folder"
            >
              <Download className={`w-3.5 h-3.5 ${downloadingPkg === 'zip' ? 'animate-bounce' : ''}`} />
              <span>
                {downloadingPkg === 'zip' && downloadProgress
                  ? `Downloading .zip (${downloadProgress.percent}%) ${downloadProgress.loadedMB}/${downloadProgress.totalMB} MB`
                  : downloadingPkg === 'zip'
                  ? 'Downloading 56 MB...'
                  : 'Download Full Package (.zip, 56 MB)'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleManualSaveHardDrive}
              disabled={syncingHardDrive}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{syncingHardDrive ? 'Saving to Hard Drive...' : 'Save Database to PC Now'}</span>
            </button>
            <a
              href="/api/download-launcher"
              download="START_SHOP_POS.bat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold shadow-sm transition-colors"
              title="Double-click this file on Windows Desktop to launch POS software"
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Download Launcher (.bat)</span>
            </a>
          </div>
        </div>

        {hardDriveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{hardDriveSuccess}</span>
          </div>
        )}

        {/* 3 Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                <span>Shop Terminal Binding</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                deviceSecurity.isDeviceLockEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}>
                {deviceSecurity.isDeviceLockEnabled ? 'Locked to This PC' : 'All Devices Allowed'}
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 pt-1">
              <div>This PC ID: <strong className="text-slate-900 dark:text-white font-bold">{thisDeviceId}</strong></div>
              <div>Bound PC: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{deviceSecurity.authorizedDeviceName || 'Unassigned'}</span></div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                <span>Local Hard Disk Location</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                JSON DB
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 pt-1">
              <div>Path: <code className="font-mono text-slate-900 dark:text-white text-[10px]">./local_database/</code></div>
              <div>Auto-Sync: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active on every sale/edit</span></div>
              <div>Last Written: <span className="text-slate-800 dark:text-slate-200 font-mono">{hardDriveLastSaved || 'Just now'}</span></div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FolderCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Windows Desktop App (.exe)</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                EXE Ready
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 pt-1">
              <div>Executable: <a href="/api/download-exe" download="SA_Brothers_POS.exe" className="font-mono text-indigo-600 dark:text-indigo-400 underline font-bold text-[10px]">SA_Brothers_POS.exe</a></div>
              <div>Full Package: <a href="/api/download-windows-package" download="SA_Brothers_POS_Windows_Package.zip" className="font-mono text-purple-600 dark:text-purple-400 underline font-bold text-[10px]">SA_Brothers_POS_Windows_Package.zip</a></div>
              <div>App Mode: <span className="text-slate-800 dark:text-slate-200">Native Windows 64-bit App</span></div>
              <div>Backup Tool: <a href="/api/download-backup-bat" download="BACKUP_LOCAL_DATABASE.bat" className="text-emerald-600 dark:text-emerald-400 underline font-medium">Download Backup .bat</a></div>
            </div>
          </div>
        </div>

        {/* Lock / Unlock Toggle Bar for Store Owner */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {deviceSecurity.isDeviceLockEnabled ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                ✓ <strong>Enforced:</strong> Only this computer can open and operate the POS register. All other devices will see a locked screen.
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                ⚠️ <strong>Open:</strong> Lock is currently disabled. Click below to lock this system exclusively to this shop computer.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {deviceSecurity.isDeviceLockEnabled ? (
              <button
                type="button"
                onClick={unauthorizeComputer}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Disable Device Lock (Allow Any PC)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => authorizeCurrentComputer('SA Brothers Counter PC')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                Lock POS to This Computer Only
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Hosting & Domain Database Deployment (SQL & PHP) */}
      <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Deploy Database to Hosting &amp; Domain (MySQL &amp; PHP)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  cPanel / Apache Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ready-to-import MySQL database schema, 35 pre-seeded products, user profiles, and PHP REST API for your live domain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/download-sql"
              download="sa_brothers_pos.sql"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download MySQL (.sql)</span>
            </a>
          </div>
        </div>

        {/* Quick Hosting Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span>Database Specs</span>
            </div>
            <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              <div>DB: <strong className="text-slate-900 dark:text-white">sa_brothers_pos</strong></div>
              <div>Host: <strong className="text-slate-900 dark:text-white">localhost</strong> (Port 3306)</div>
              <div>Charset: <strong className="text-slate-900 dark:text-white">utf8mb4</strong></div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>PHP API Endpoints</span>
            </div>
            <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              <div>• /backend_php/products.php</div>
              <div>• /backend_php/transactions.php</div>
              <div>• /backend_php/expenses.php</div>
              <div>• /backend_php/profiles.php</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Pre-Seeded Access</span>
            </div>
            <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              <div>👑 Owner PIN: <strong className="text-amber-600">{showPinsInSettings ? ownerPinEdit : '••••'}</strong></div>
              <div>👤 Staff PIN: <strong className="text-blue-600">{showPinsInSettings ? staffPinEdit : '••••'}</strong></div>
              <div>💵 Default Float: <strong className="text-emerald-600">PKR 10,000</strong></div>
            </div>
          </div>
        </div>

        {/* 3 Step Deployment Instructions Banner */}
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
          <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <span>How to setup on your domain &amp; web hosting (3 Simple Steps):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
            <li><strong>Step 1:</strong> Log into your hosting control panel (cPanel, Hostinger, Namecheap, etc.) and open <strong>phpMyAdmin</strong>.</li>
            <li><strong>Step 2:</strong> Click <strong>Import</strong> and select the downloaded <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold">sa_brothers_pos.sql</code> file, then click <strong>Go</strong>.</li>
            <li><strong>Step 3:</strong> Upload the project files to your <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded font-mono">public_html</code> directory and update database password in <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded font-mono">backend_php/config.php</code>.</li>
          </ol>
        </div>
      </div>

      {/* Database Backup & Maintenance Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Data Backup &amp; Storage Maintenance</span>
        </h2>

        {importStatus && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Download Project Code Archive */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              Download Project Code
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Download full source code archive (.tar.gz) to move this app to your other Gemini Pro account.
            </p>
            <a
              href="/api/download-project"
              download="sa-brothers-vendors-project.tar.gz"
              className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project (.tar.gz)</span>
            </a>
          </div>

          {/* Download JSON Backup */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Download JSON Backup
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Save all inventory, transactions, and expenses to a local JSON file.
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="mt-2 w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Store JSON</span>
            </button>
          </div>

          {/* Restore JSON Backup */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Restore from Backup
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Upload a previously exported backup file to restore database state.
            </p>
            <label className="mt-2 w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Backup File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Reset Demo Store
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Reload default SA Brothers catalog (Court items &amp; Office papers), sample transactions, and expenses.
            </p>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="mt-2 w-full py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Store Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* In-app Store Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Reset Store Data?
                  </h3>
                  <span className="text-[11px] text-rose-600 font-medium">This action cannot be undone</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will reload the initial SA Brothers catalog (Court items, Stamp papers, and Office papers) with sample transactions and clear custom unsaved additions.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setShowResetModal(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
