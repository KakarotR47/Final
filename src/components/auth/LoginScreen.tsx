import React, { useState, useEffect, useCallback } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  MonitorDown,
  Lock,
  Delete,
} from 'lucide-react';
import saBrothersLogo from '../../assets/images/sa_brothers_logo.jpg';
import { downloadBinaryFile, DownloadProgress } from '../../services/fileDownloader';

export const LoginScreen: React.FC = () => {
  const { login, settings, profiles } = useShop();

  const [selectedRole, setSelectedRole] = useState<'owner' | 'staff'>('owner');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  const [downloadingTarget, setDownloadingTarget] = useState<'exe' | 'zip' | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const handleDownload = async (target: 'exe' | 'zip') => {
    if (downloadingTarget) return;
    setDownloadingTarget(target);
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
      setDownloadingTarget(null);
      setDownloadProgress(null);
    }
  };

  const ownerProfile = profiles.find((p) => p.role === 'owner');
  const staffProfile = profiles.find((p) => p.role === 'staff');

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSelectRole = (role: 'owner' | 'staff') => {
    setSelectedRole(role);
    setPin('');
    setErrorMessage(null);
  };

  const attemptLogin = useCallback(
    (pinToTry: string, roleToTry: 'owner' | 'staff') => {
      if (lockoutSeconds > 0) {
        setErrorMessage(`Security Lockout: Too many wrong PIN attempts. Wait ${lockoutSeconds}s.`);
        setPin('');
        return;
      }
      if (pinToTry.length !== 4) {
        setErrorMessage('Please enter your complete 4-digit PIN.');
        return;
      }
      const result = login(roleToTry, pinToTry);
      if (!result.success) {
        setPin('');
        setFailedAttempts((prev) => {
          const next = prev + 1;
          if (next >= 5) {
            setLockoutSeconds(15);
            setErrorMessage('Security Lockout: 5 wrong PIN attempts! Terminal locked for 15 seconds.');
            return 0;
          }
          setErrorMessage(
            `${result.message || 'Incorrect 4-digit PIN'} (${5 - next} attempt${5 - next === 1 ? '' : 's'} remaining)`
          );
          return next;
        });
      } else {
        setFailedAttempts(0);
      }
    },
    [login, lockoutSeconds]
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (lockoutSeconds > 0) return;
      setErrorMessage(null);
      setPin((prev) => {
        if (prev.length >= 4) return prev;
        const next = prev + digit;
        if (next.length === 4) {
          setTimeout(() => {
            attemptLogin(next, selectedRole);
          }, 120);
        }
        return next;
      });
    },
    [attemptLogin, selectedRole, lockoutSeconds]
  );

  const handleBackspace = useCallback(() => {
    setErrorMessage(null);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setErrorMessage(null);
    setPin('');
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    attemptLogin(pin, selectedRole);
  };

  // Global keyboard listener so user can type 4-digit PIN directly on keyboard/numpad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 4) {
          attemptLogin(pin, selectedRole);
        } else {
          setErrorMessage('Please enter all 4 digits of your PIN.');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitPress, handleBackspace, handleClear, attemptLogin, pin, selectedRole]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-6 relative overflow-hidden select-none">
      {/* Background subtle glow aesthetics */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 backdrop-blur-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Branding Header */}
        <div className="text-center space-y-2.5 mb-5">
          <div className="w-16 h-16 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-500 to-amber-200 shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src={saBrothersLogo}
              alt="SA Brothers Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <span>{settings.shopName || 'SA Brothers Vendors'}</span>
            </h1>
            <p className="text-xs text-amber-400 font-medium mt-0.5">
              {settings.tagline || 'Court Stamp Vendors, Legal Paper & Stationery'}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] font-semibold text-slate-300">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Security Login Panel · Enter 4-Digit PIN</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Owner or Staff Profile */}
        <div className="mb-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
            1. Select Account Profile
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Shop Owner Card */}
            <button
              type="button"
              onClick={() => handleSelectRole('owner')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                selectedRole === 'owner'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/25 shadow-lg shadow-amber-950/30'
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-sm font-bold shadow-xs">
                  👑
                </div>
                <ShieldCheck
                  className={`w-4 h-4 ${
                    selectedRole === 'owner' ? 'text-amber-400' : 'text-slate-600'
                  }`}
                />
              </div>
              <div className="text-xs font-bold text-white truncate">
                {ownerProfile?.name || 'Shop Owner'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Full Access, Stock &amp; Profit
              </div>
            </button>

            {/* Staff Cashier Card */}
            <button
              type="button"
              onClick={() => handleSelectRole('staff')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                selectedRole === 'staff'
                  ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/25 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  👤
                </div>
                <UserCheck
                  className={`w-4 h-4 ${
                    selectedRole === 'staff' ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                />
              </div>
              <div className="text-xs font-bold text-white truncate">
                {staffProfile?.name || 'Staff Cashier'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                POS Billing &amp; Expenses Only
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: 4-Digit PIN Display & Keypad */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  2. Enter 4-Digit {selectedRole === 'owner' ? 'Owner' : 'Staff'} PIN
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
              </button>
            </div>

            {/* 4-Digit Visual PIN Slots */}
            <div className="grid grid-cols-4 gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => {
                const digit = pin[idx] || '';
                const isFilled = digit !== '';
                const isActiveSlot = pin.length === idx;

                return (
                  <div
                    key={idx}
                    className={`h-13 rounded-2xl border-2 flex items-center justify-center font-mono text-xl font-black transition-all ${
                      isFilled
                        ? selectedRole === 'owner'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-inner'
                          : 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-inner'
                        : isActiveSlot
                        ? 'bg-slate-800/90 border-slate-500 text-slate-400 animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    {isFilled ? (showPin ? digit : '●') : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 0-9 Touch & Counter PIN Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigitPress(num)}
                className="py-3 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-lg rounded-xl border border-slate-700/70 transition-all cursor-pointer shadow-xs"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 bg-slate-800/60 hover:bg-slate-700/80 active:scale-95 text-amber-400 text-xs font-bold rounded-xl border border-slate-700/70 transition-all cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="py-3 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-lg rounded-xl border border-slate-700/70 transition-all cursor-pointer shadow-xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 bg-slate-800/60 hover:bg-slate-700/80 active:scale-95 text-slate-300 text-xs font-bold rounded-xl border border-slate-700/70 transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Backspace"
            >
              <Delete className="w-4 h-4" />
              <span>Del</span>
            </button>
          </div>

          {/* Strict 4-Digit PIN Security Notice */}
          <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>🔒 Strict Profile Security:</span>
            <span className="text-slate-300 font-medium">
              Only the saved {selectedRole === 'owner' ? 'Owner' : 'Staff'} 4-digit PIN unlocks
            </span>
          </div>

          {/* Unlock & Open Software Button */}
          <button
            type="submit"
            className={`w-full py-3 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedRole === 'owner'
                ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-900/30'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>
              Unlock as {selectedRole === 'owner' ? 'Shop Owner' : 'Staff Cashier'}
            </span>
          </button>
        </form>

        {/* Direct Windows .EXE & Package Download Links with In-App Streaming */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleDownload('exe')}
            disabled={downloadingTarget !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download standalone Windows 64-bit executable (SA_Brothers_POS.exe, 68 MB)"
          >
            <MonitorDown className={`w-3.5 h-3.5 ${downloadingTarget === 'exe' ? 'animate-bounce' : ''}`} />
            <span>
              {downloadingTarget === 'exe' && downloadProgress
                ? `Downloading .exe (${downloadProgress.percent}%)`
                : downloadingTarget === 'exe'
                ? 'Downloading (68 MB)...'
                : 'Download .exe (68 MB)'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleDownload('zip')}
            disabled={downloadingTarget !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700 text-indigo-300 hover:text-indigo-200 text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download full Windows package (.zip with 68MB exe, node runtime, launcher, backup tool and database)"
          >
            <MonitorDown className={`w-3.5 h-3.5 ${downloadingTarget === 'zip' ? 'animate-bounce' : ''}`} />
            <span>
              {downloadingTarget === 'zip' && downloadProgress
                ? `Downloading .zip (${downloadProgress.percent}%)`
                : downloadingTarget === 'zip'
                ? 'Downloading (56 MB)...'
                : 'Full Package .zip (56 MB)'}
            </span>
          </button>
        </div>
      </div>

      {/* Footer Offline Notice */}
      <div className="text-center text-[11px] text-slate-500 mt-4 space-y-0.5">
        <p>🔒 100% Offline Ready · Real-time Hard Drive &amp; Local Persistence</p>
      </div>
    </div>
  );
};
