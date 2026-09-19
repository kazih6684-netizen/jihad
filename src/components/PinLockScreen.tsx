import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Delete, Check, ShieldCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface PinLockScreenProps {
  correctPin: string;
  onSuccess: () => void;
  onAdminLoginClick?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  correctPin,
  onSuccess,
  onAdminLoginClick
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate PIN
  const handleVerify = (pinToTest: string) => {
    if (pinToTest.length !== 4) {
      setError('অনুগ্রহ করে ৪ ডিজিটের পিন দিন');
      return;
    }

    if (pinToTest === correctPin) {
      setIsSuccess(true);
      setError(null);
      setTimeout(() => {
        onSuccess();
      }, 400);
    } else {
      setIsShaking(true);
      setError('ভুল পিন! সঠিক ৪ ডিজিটের পিন দিন');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 650);
    }
  };

  // Keypad click handler
  const handleDigitPress = (digit: string) => {
    if (isSuccess) return;
    setError(null);
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      // If reached 4 digits, auto verify
      if (newPin.length === 4) {
        setTimeout(() => handleVerify(newPin), 150);
      }
    }
  };

  const handleDelete = () => {
    if (isSuccess) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleDone = () => {
    if (isSuccess) return;
    handleVerify(pin);
  };

  // Keyboard listener for physical keyboard users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleDone();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, correctPin, isSuccess]);

  return (
    <div className="min-h-screen w-full neu-base flex flex-col items-center justify-center p-4 text-slate-800 font-sans select-none relative overflow-hidden">
      
      {/* Background Soft Glow Accents for Neumorphic Depth */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[340px] sm:max-w-[360px] neu-flat rounded-3xl p-6 sm:p-7 flex flex-col items-center relative border border-white/60"
      >
        
        {/* Neumorphic Brand Header & Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3.5">
            <div className="w-16 h-16 rounded-2xl neu-flat flex items-center justify-center text-indigo-600 border border-white/80">
              <div className="w-11 h-11 rounded-xl neu-inset flex items-center justify-center">
                <Lock size={22} className={isSuccess ? 'text-emerald-600 scale-110' : 'text-indigo-600'} />
              </div>
            </div>
            {/* Ambient online dot */}
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#ebf0f7]"></span>
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
            <span>UNITY EARNING</span>
          </h1>
          <div className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100/70 border border-indigo-200/60 text-indigo-800 text-[11px] font-bold">
            <Sparkles size={11} className="text-indigo-600" />
            <span>Payment Portal • {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            অফিশিয়াল স্টাফ পেমেন্ট ও মেথড ডিরেক্টরি
          </p>
        </div>

        {/* PIN Display Indicators (Neumorphic Inset Wells) */}
        <div className="w-full flex flex-col items-center mb-6">
          <motion.div
            animate={isShaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-3.5 py-2"
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className="w-11 h-12 rounded-2xl neu-inset flex items-center justify-center border border-white/70 relative"
                >
                  <AnimatePresence>
                    {isFilled && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        className={isSuccess ? 'w-4 h-4 rounded-full bg-emerald-500 shadow-sm' : 'w-4 h-4 rounded-full bg-indigo-600 shadow-sm shadow-indigo-300'}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>

          {/* Feedback Message */}
          <div className="h-5 mt-1 text-center">
            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-bold text-red-500 flex items-center justify-center gap-1"
              >
                <AlertCircle size={12} />
                <span>{error}</span>
              </motion.p>
            ) : (
              <p className="text-[11px] font-semibold text-slate-500">
                প্রবেশ করতে ৪ ডিজিটের পিন দিন
              </p>
            )}
          </div>
        </div>

        {/* Calculator-style Keypad (Neumorphic Buttons) */}
        <div className="w-full grid grid-cols-3 gap-3 sm:gap-3.5">
          {/* Row 1: 1, 2, 3 */}
          {['1', '2', '3'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-13 rounded-2xl neu-btn font-extrabold text-lg text-slate-700 flex items-center justify-center active:scale-95"
            >
              {digit}
            </button>
          ))}

          {/* Row 2: 4, 5, 6 */}
          {['4', '5', '6'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-13 rounded-2xl neu-btn font-extrabold text-lg text-slate-700 flex items-center justify-center active:scale-95"
            >
              {digit}
            </button>
          ))}

          {/* Row 3: 7, 8, 9 */}
          {['7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-13 rounded-2xl neu-btn font-extrabold text-lg text-slate-700 flex items-center justify-center active:scale-95"
            >
              {digit}
            </button>
          ))}

          {/* Row 4: ⌫ (Cross/Backspace), 0, Done */}
          <button
            type="button"
            onClick={handleDelete}
            title="মুছে ফেলুন"
            className="h-13 rounded-2xl neu-btn-danger font-bold text-sm flex flex-col items-center justify-center active:scale-95 gap-0.5"
          >
            <Delete size={18} strokeWidth={2.4} />
            <span className="text-[9px] font-black uppercase">Cross</span>
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-13 rounded-2xl neu-btn font-extrabold text-lg text-slate-700 flex items-center justify-center active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDone}
            title="কনফার্ম করুন"
            className="h-13 rounded-2xl neu-btn-action font-bold text-sm flex flex-col items-center justify-center active:scale-95 gap-0.5"
          >
            <Check size={18} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-wider">Done</span>
          </button>
        </div>

        {/* Bottom Helper & Admin Access */}
        <div className="w-full mt-6 pt-4 border-t border-slate-300/60 flex flex-col items-center gap-2">
          {onAdminLoginClick && (
            <button
              type="button"
              onClick={onAdminLoginClick}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/60"
            >
              <KeyRound size={13} className="text-indigo-600" />
              <span>এডমিন প্যানেলে লগইন</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>অফিশিয়াল নিরাপদ সিস্টেম • Unity Earning Platform</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
