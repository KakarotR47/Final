import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const {
    profiles,
    activeProfile,
    isProfileModalOpen,
    closeProfileModal,
    switchProfile,
    updateProfilePin,
    isOwner,
    targetProfileIdForModal,
  } = useShop();

  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    targetProfileIdForModal || activeProfile.id
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPin, setShowPin] = useState<boolean>(false);

  // Tab mode: 'switch' or 'change_pin'
  const [mode, setMode] = useState<'switch' | 'change_pin'>('switch');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [targetPinProfileId, setTargetPinProfileId] = useState<string>('prof-owner');

  useEffect(() => {
    if (isProfileModalOpen) {
      const nextTarget = targetProfileIdForModal || (activeProfile.role === 'owner' ? 'prof-staff' : 'prof-owner');
      setSelectedProfileId(nextTarget);
      setPinInput('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setMode('switch');
      setNewPin('');
      setConfirmNewPin('');
    }
  }, [isProfileModalOpen, targetProfileIdForModal, activeProfile.role, activeProfile.id]);

  if (!isProfileModalOpen) return null;

  const targetProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const handleSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // If switching to the exact same profile already active, just close
    if (selectedProfileId === activeProfile.id) {
      closeProfileModal();
      return;
    }

    const res = switchProfile(selectedProfileId, pinInput);
    if (!res.success) {
      setErrorMessage(res.message || 'Incorrect password / PIN');
    } else {
      setSuccessMessage(`Switched to ${targetProfile.name}`);
      setTimeout(() => {
        closeProfileModal();
      }, 500);
    }
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!/^\d{4}$/.test(newPin.trim())) {
      setErrorMessage('PIN must be exactly 4 numeric digits (0-9).');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMessage('New PIN and Confirm PIN do not match');
      return;
    }

    const res = updateProfilePin(targetPinProfileId, newPin.trim());
    if (res.success) {
      const targetP = profiles.find((p) => p.id === targetPinProfileId);
      setSuccessMessage(`Updated 4-digit PIN for ${targetP?.name || 'profile'}`);
      setNewPin('');
      setConfirmNewPin('');
      setTimeout(() => {
        setMode('switch');
        setSuccessMessage(null);
      }, 1500);
    } else {
      setErrorMessage(res.message || 'Failed to update PIN');
    }
  };

  const handleQuickKeypad = (digit: string) => {
    if (mode === 'switch') {
      if (pinInput.length < 4) {
        setPinInput((prev) => prev + digit);
        setErrorMessage(null);
      }
    } else {
      if (newPin.length < 4) {
        setNewPin((prev) => prev + digit);
        setErrorMessage(null);
      }
    }
  };

  const handleBackspace = () => {
    if (mode === 'switch') {
      setPinInput((prev) => prev.slice(0, -1));
    } else {
      setNewPin((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {mode === 'switch' ? 'Profile Access & Security' : 'Change Profile Password'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Current: <strong className="text-slate-700 dark:text-slate-200">{activeProfile.name}</strong> ({activeProfile.role === 'owner' ? 'Owner Full Access' : 'Staff Restricted'})
              </p>
            </div>
          </div>

          <button
            onClick={closeProfileModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'switch' ? (
          <div className="p-5 space-y-4">
            {/* Profile Selector Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Select Profile to Switch To:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {profiles.map((p) => {
                  const isSelected = selectedProfileId === p.id;
                  const isCurrent = activeProfile.id === p.id;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProfileId(p.id);
                        setPinInput('');
                        setErrorMessage(null);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                            p.role === 'owner'
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-blue-600 text-white shadow-2xs'
                          }`}
                        >
                          {p.role === 'owner' ? '👑' : '👤'}
                        </div>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.role === 'owner' ? 'Full administrative access' : 'Sales & Expenses only'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permission Summary Card for Selected Profile */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                {targetProfile.role === 'owner' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Owner Privileges (Unlocked):</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Staff Permissions (Restricted):</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {targetProfile.role === 'owner'
                  ? 'Can indent & adjust stock, edit prices/costs, add new items, view profit analytics, sales history, daily closing, and manage store settings.'
                  : 'Can ONLY record sales (POS register) and write expenses. Stock inventory, profit dashboard, and store settings are strictly hidden.'}
              </p>
            </div>

            {/* PIN Entry Form */}
            <form onSubmit={handleSwitch} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Enter Password / PIN for {targetProfile.name}:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPin ? 'Hide' : 'Show'}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    inputMode="numeric"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setErrorMessage(null);
                    }}
                    placeholder="Enter 4-digit PIN (e.g. 1234 or 0000)"
                    autoFocus
                    className="w-full text-center tracking-widest text-lg font-bold font-mono py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* On-screen Keypad for fast touch / counter use */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleQuickKeypad(digit)}
                    className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold text-base rounded-xl transition-colors active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPinInput('')}
                  className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickKeypad('0')}
                  className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold text-base rounded-xl transition-colors active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
                >
                  ⌫ Del
                </button>
              </div>

              {/* Strict PIN Security Tip */}
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>🔒 Only the exact 4-digit PIN saved for <strong>{targetProfile.name}</strong> is accepted.</span>
              </div>

              {/* Error & Success Messages */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Unlock &amp; Switch Profile</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Owner Option to Change PINs */}
            {isOwner && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('change_pin');
                    setTargetPinProfileId(selectedProfileId);
                    setNewPin('');
                    setConfirmNewPin('');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Change 4-Digit PIN for Profiles (Owner Setting)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Change PIN View (Owner Access) */
          <form onSubmit={handleUpdatePin} className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Select Profile to Set 4-Digit PIN For:
              </label>
              <select
                value={targetPinProfileId}
                onChange={(e) => setTargetPinProfileId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                New 4-Digit PIN *
              </label>
              <input
                type="password"
                required
                maxLength={4}
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="e.g. 5678"
                className="w-full text-center tracking-widest text-base font-bold font-mono py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Confirm New 4-Digit PIN *
              </label>
              <input
                type="password"
                required
                maxLength={4}
                inputMode="numeric"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Re-type 4-digit PIN"
                className="w-full text-center tracking-widest text-base font-bold font-mono py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMode('switch')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Back to Switcher
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Save New Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
