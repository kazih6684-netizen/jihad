import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, X, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PortalPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPin: string;
  onSuccess: (newPin: string) => void;
}

export const PortalPinModal: React.FC<PortalPinModalProps> = ({
  isOpen,
  onClose,
  currentPin,
  onSuccess
}) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNewPin = newPin.trim();
    const cleanConfirmPin = confirmPin.trim();

    if (!/^\d{4}$/.test(cleanNewPin)) {
      setError('পিন অবশ্যই ঠিক ৪টি সংখ্যা (Digits) হতে হবে (যেমন: 1234)');
      return;
    }

    if (cleanNewPin !== cleanConfirmPin) {
      setError('দুইবারের পিন মিলছে না! আবার চেক করুন');
      return;
    }

    try {
      setSaving(true);
      await setDoc(doc(db, 'settings', 'portal_pin'), {
        pin: cleanNewPin,
        updatedAt: serverTimestamp()
      });

      onSuccess(cleanNewPin);
      onClose();
    } catch (err: any) {
      console.error('Failed to update portal pin', err);
      setError('পিন সেভ করতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-sm neu-flat rounded-3xl p-6 border border-white/80 relative text-slate-800"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full neu-btn text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-indigo-600">
            <KeyRound size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
              পোর্টাল এক্সেস পিন
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              ভিজিটরদের ঢোকার ৪ ডিজিটের পিন পরিবর্তন
            </p>
          </div>
        </div>

        {/* Current PIN Card */}
        <div className="mb-4 p-3 rounded-2xl neu-inset flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">বর্তমান সক্রিয় পিন:</span>
          <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-xl bg-indigo-600 text-white shadow-xs tracking-widest">
            {currentPin}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* New PIN Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              নতুন ৪ ডিজিট পিন:
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setNewPin(val);
                setError(null);
              }}
              placeholder="যেমন: 5678"
              className="w-full h-11 px-3 text-center tracking-widest font-mono text-base font-bold rounded-xl neu-inset border border-white/80 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              autoFocus
            />
          </div>

          {/* Confirm New PIN Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              নতুন পিনটি পুনরায় লিখুন:
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setConfirmPin(val);
                setError(null);
              }}
              placeholder="৪ ডিজিট পুনরায় লিখুন"
              className="w-full h-11 px-3 text-center tracking-widest font-mono text-base font-bold rounded-xl neu-inset border border-white/80 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick preset 4-digit helpers */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-slate-600 font-semibold">সাজেস্ট:</span>
            {['1234', '2026', '9900', '7788'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setNewPin(preset);
                  setConfirmPin(preset);
                }}
                className="px-2 py-0.5 rounded-lg neu-btn text-[10px] font-mono font-bold text-indigo-700"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full h-11 rounded-xl neu-btn-action font-bold text-xs flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  <span>পিন পরিবর্তন ও সেভ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
