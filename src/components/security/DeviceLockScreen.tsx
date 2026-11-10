import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { ShieldAlert, Monitor, KeyRound, Lock, CheckCircle2 } from 'lucide-react';

export const DeviceLockScreen: React.FC = () => {
  const {
    deviceSecurity,
    thisDeviceId,
    authorizeCurrentComputer,
    profiles,
  } = useShop();

  const [enteredPin, setEnteredPin] = useState('');
  const [computerNameInput, setComputerNameInput] = useState('Shop Counter PC (Counter 1)');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const ownerProfile = profiles.find((p) => p.role === 'owner') || profiles[0];

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!ownerProfile || enteredPin.trim() !== ownerProfile.pin.trim()) {
      setErrorMsg('Incorrect Owner PIN. Only the Store Owner can authorize this computer.');
      return;
    }

    setIsAuthorizing(true);
    setTimeout(() => {
      authorizeCurrentComputer(computerNameInput.trim() || 'Shop Counter Computer');
      setIsAuthorizing(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-center backdrop-blur-md">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold tracking-widest uppercase text-rose-400 bg-rose-950/60 border border-rose-800 px-2.5 py-0.5 rounded-full">
            Terminal Access Denied
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white pt-1">
            Shop Computer Only System
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            This POS register and inventory database is configured to run <strong className="text-white">only on your shop computer</strong>. External devices, mobile phones, and unauthorized browsers are blocked.
          </p>
        </div>

        {/* Device Information Card */}
        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 text-left space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span>Current Device ID:</span>
            </span>
            <span className="font-mono text-rose-400 font-bold">{thisDeviceId}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Authorized PC:</span>
            <span className="font-medium text-emerald-400">{deviceSecurity.authorizedDeviceName || 'Unassigned'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Data Storage:</span>
            <span className="text-slate-200">Local Hard Disk (Offline Mode)</span>
          </div>
        </div>

        {/* Owner Authorization Form */}
        <form onSubmit={handleAuthorize} className="space-y-3.5 pt-2 border-t border-slate-700/60 text-left">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Register This Computer as Shop Terminal:</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Computer Label:
            </label>
            <input
              type="text"
              value={computerNameInput}
              onChange={(e) => setComputerNameInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-medium"
              placeholder="e.g. Shop Counter PC (Counter 1)"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Store Owner Master PIN:
            </label>
            <input
              type="password"
              required
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="Enter Owner PIN (Default: 1234)"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold tracking-widest focus:outline-none focus:border-emerald-500 text-center"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium text-center">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isAuthorizing}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isAuthorizing ? 'Authorizing Computer...' : 'Authorize This Computer'}</span>
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center">
          SA Brothers Vendors · Court Stamp Vendors &amp; Legal Paper · Offline Terminal
        </p>
      </div>
    </div>
  );
};
