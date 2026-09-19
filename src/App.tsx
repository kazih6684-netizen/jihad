import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocFromServer,
  setDoc
} from 'firebase/firestore';
import { 
  Search, 
  Plus, 
  LogOut, 
  Copy, 
  Check, 
  User as UserIcon, 
  Phone, 
  Trash2, 
  Edit3,
  X,
  ShieldCheck,
  Info,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Users,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Sparkles,
  Image as ImageIcon,
  FileDown,
  Smartphone,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  StaffMember, 
  StaffCategory, 
  PaymentMethod, 
  STAFF_CATEGORIES, 
  PAYMENT_METHODS, 
  AVATAR_PRESETS,
  AVATAR_ITEMS,
  BOY_AVATARS,
  GIRL_AVATARS,
  AvatarItem,
  getStaffCartoonAvatar,
  isLikelyFemale,
  CATEGORY_TITLE_BN
} from './types';
import { cn } from './lib/utils';
import { PinLockScreen } from './components/PinLockScreen';
import { PortalPinModal } from './components/PortalPinModal';
import { exportStaffDirectoryPdf, exportStaffDirectoryImage } from './utils/pdfExport';

// Hardcoded Master Admin PIN as requested
const ADMIN_PIN = '212650';
const ADMIN_STORAGE_KEY = 'unity_admin_pin_session';
const PORTAL_STORAGE_KEY = 'unity_portal_session_unlocked';

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === 'authenticated';
  });
  const [portalUnlocked, setPortalUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(PORTAL_STORAGE_KEY) === 'unlocked' || localStorage.getItem(ADMIN_STORAGE_KEY) === 'authenticated';
  });
  const [portalPin, setPortalPin] = useState<string>('1234');
  const [isPortalPinModalOpen, setIsPortalPinModalOpen] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(true);
  const [noticeContent, setNoticeContent] = useState(
    'আপনাদের নাম্বার এবং মেথড ঠিক আছে কিনা সবাই চেক করে দেখে নেন, এই তথ্যের মোতাবেকি আপনাদের স্যালারি দেওয়া হবে। ভুল থাকলে দ্রুত এডমিনকে জানান।'
  );
  
  // Modals
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  
  // Selection states
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PIN Input State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinText, setShowPinText] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<StaffCategory>('Senior Team Leader');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('bKash');
  const [formNumber, setFormNumber] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [showPhotoPresets, setShowPhotoPresets] = useState(false);
  const [avatarGenderFilter, setAvatarGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [formNotice, setFormNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Handle Image Upload & Compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('ছবির সাইজ ৫MB এর কম হতে হবে');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormPhotoUrl(dataUrl);
          showToast('ছবি যুক্ত করা হয়েছে');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Test connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch {
        // quiet fallback
      }
    };
    testConnection();
  }, []);

  // Real-time Staff Listener
  useEffect(() => {
    const q = query(collection(db, 'staff'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as StaffMember[];
      setStaff(staffList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staff');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Real-time Notice Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'notice'), (snapshot) => {
      if (snapshot.exists()) {
        setNoticeContent(snapshot.data().content);
      }
    });
    return unsubscribe;
  }, []);

  // Real-time Portal PIN Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'portal_pin'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.pin) {
          setPortalPin(String(data.pin));
        }
      }
    });
    return unsubscribe;
  }, []);

  // Handle Master Admin PIN Login
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setIsAdmin(true);
      setPortalUnlocked(true);
      localStorage.setItem(ADMIN_STORAGE_KEY, 'authenticated');
      sessionStorage.setItem(PORTAL_STORAGE_KEY, 'unlocked');
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(false);
      showToast('স্বাগতম! এডমিন মোড সক্রিয় হয়েছে');
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 1500);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    showToast('এডমিন মোড থেকে লগআউট করা হয়েছে');
  };

  const handlePortalUnlockSuccess = () => {
    setPortalUnlocked(true);
    sessionStorage.setItem(PORTAL_STORAGE_KEY, 'unlocked');
    showToast('স্বাগতম! পেমেন্ট পোর্টালে সফলভাবে প্রবেশ করেছেন');
  };

  const handlePortalLock = () => {
    setPortalUnlocked(false);
    sessionStorage.removeItem(PORTAL_STORAGE_KEY);
    showToast('পেমেন্ট পোর্টাল লক করা হয়েছে');
  };

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportPdf = async () => {
    if (staff.length === 0) {
      showToast('ডাউনলোড করার মতো কোনো স্টাফ তথ্য নেই');
      return;
    }
    try {
      setIsExporting(true);
      showToast('বাংলা নাম সহ মোবাইল ফ্রেমের PDF তৈরি হচ্ছে...');
      await exportStaffDirectoryPdf(staff);
      showToast('বাংলা নাম সহ মোবাইল ফ্রেম সাইজ PDF ডাউনলোড সম্পন্ন!');
    } catch (err) {
      console.error('PDF error', err);
      showToast('PDF ডাউনলোডে সমস্যা হয়েছে');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (staff.length === 0) {
      showToast('ডাউনলোড করার মতো কোনো স্টাফ তথ্য নেই');
      return;
    }
    try {
      setIsExporting(true);
      showToast('বাংলা নাম সহ মোবাইল ফ্রেমের HD ছবি তৈরি হচ্ছে...');
      await exportStaffDirectoryImage(staff);
      showToast('বাংলা নাম সহ অফিশিয়াল ছবি (HD Image) ডাউনলোড সম্পন্ন!');
    } catch (err) {
      console.error('Image export error', err);
      showToast('ছবি ডাউনলোডে সমস্যা হয়েছে');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`নম্বর কপি করা হয়েছে: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setFormName('');
    setFormCategory('Senior Team Leader');
    setFormMethod('bKash');
    setFormNumber('');
    setFormPhotoUrl('');
    setShowPhotoPresets(false);
    setShowUrlInput(false);
    setEditingStaff(null);
  };

  const handleEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setFormName(s.name);
    setFormCategory(s.category);
    setFormMethod(s.method);
    setFormNumber(s.number);
    setFormPhotoUrl(s.photoUrl || '');
    setShowPhotoPresets(false);
    setShowUrlInput(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const staffData: Record<string, any> = {
      name: formName.trim(),
      category: formCategory,
      method: formMethod,
      number: formNumber.trim(),
    };

    if (formPhotoUrl.trim()) {
      staffData.photoUrl = formPhotoUrl.trim();
    } else {
      staffData.photoUrl = getStaffCartoonAvatar({ name: formName.trim() });
    }

    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'staff', editingStaff.id), {
          ...staffData,
          updatedAt: serverTimestamp(),
        });
        showToast('স্টাফ তথ্য সফলভাবে আপডেট করা হয়েছে');
      } else {
        await addDoc(collection(db, 'staff'), {
          ...staffData,
          createdAt: serverTimestamp(),
          createdBy: 'admin_pin',
          order: 0,
        });
        showToast('নতুন স্টাফ যুক্ত করা হয়েছে');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingStaff ? OperationType.UPDATE : OperationType.CREATE, 'staff');
    }
  };

  const handleDeleteClick = (s: StaffMember) => {
    setStaffToDelete(s);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!isAdmin || !staffToDelete) return;
    try {
      await deleteDoc(doc(db, 'staff', staffToDelete.id));
      setIsDeleteModalOpen(false);
      showToast(`${staffToDelete.name} মুছে ফেলা হয়েছে`);
      setStaffToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `staff/${staffToDelete.id}`);
    }
  };

  const handleUpdateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'notice'), {
        content: formNotice.trim(),
        updatedAt: serverTimestamp()
      });
      setIsNoticeModalOpen(false);
      showToast('নোটিশ আপডেট সম্পন্ন হয়েছে');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/notice');
    }
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.number.includes(q);
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [staff, searchQuery, selectedCategory]);

  const groupedStaff = useMemo(() => {
    const groups: Record<StaffCategory, StaffMember[]> = {
      'Senior Team Leader': [],
      'Team Leader': [],
      'Senior Counselor': [],
      'Counselor': [],
      'Teacher': [],
      'Team Trainer': [],
    };
    filteredStaff.forEach(s => {
      if (groups[s.category]) {
        groups[s.category].push(s);
      }
    });
    return groups;
  }, [filteredStaff]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: staff.length };
    STAFF_CATEGORIES.forEach(cat => {
      counts[cat] = staff.filter(s => s.category === cat).length;
    });
    return counts;
  }, [staff]);

  const methodThemes: Record<PaymentMethod, {
    cardBg: string;
    cardBorder: string;
    cardHoverBorder: string;
    avatarBg: string;
    badgeBg: string;
    badgeBorder: string;
    dotColor: string;
    numberBox: string;
    numberIcon: string;
    copyBtn: string;
  }> = {
    bKash: {
      cardBg: 'bg-white hover:bg-pink-50/30',
      cardBorder: 'border-pink-200/80',
      cardHoverBorder: 'hover:border-pink-400',
      avatarBg: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-200',
      badgeBg: 'bg-pink-50 text-pink-700',
      badgeBorder: 'border-pink-200',
      dotColor: 'bg-pink-500',
      numberBox: 'bg-pink-50/80 hover:bg-pink-100/90 border-pink-200/90 text-pink-900',
      numberIcon: 'text-pink-600',
      copyBtn: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200',
    },
    Nagad: {
      cardBg: 'bg-white hover:bg-orange-50/30',
      cardBorder: 'border-orange-200/80',
      cardHoverBorder: 'hover:border-orange-400',
      avatarBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-200',
      badgeBg: 'bg-orange-50 text-orange-700',
      badgeBorder: 'border-orange-200',
      dotColor: 'bg-orange-500',
      numberBox: 'bg-orange-50/80 hover:bg-orange-100/90 border-orange-200/90 text-orange-900',
      numberIcon: 'text-orange-600',
      copyBtn: 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200',
    },
    Rocket: {
      cardBg: 'bg-white hover:bg-purple-50/30',
      cardBorder: 'border-purple-200/80',
      cardHoverBorder: 'hover:border-purple-400',
      avatarBg: 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-purple-200',
      badgeBg: 'bg-purple-50 text-purple-700',
      badgeBorder: 'border-purple-200',
      dotColor: 'bg-purple-600',
      numberBox: 'bg-purple-50/80 hover:bg-purple-100/90 border-purple-200/90 text-purple-900',
      numberIcon: 'text-purple-600',
      copyBtn: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200',
    },
    Upay: {
      cardBg: 'bg-white hover:bg-amber-50/30',
      cardBorder: 'border-amber-200/80',
      cardHoverBorder: 'hover:border-amber-400',
      avatarBg: 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-amber-200',
      badgeBg: 'bg-amber-50 text-amber-800',
      badgeBorder: 'border-amber-200',
      dotColor: 'bg-amber-500',
      numberBox: 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-200/90 text-amber-900',
      numberIcon: 'text-amber-600',
      copyBtn: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200',
    },
  };

  const categoryBanglaNum: Record<StaffCategory, string> = {
    'Senior Team Leader': '০১',
    'Team Leader': '০২',
    'Senior Counselor': '০৩',
    'Counselor': '০৪',
    'Teacher': '০৫',
    'Team Trainer': '০৬',
  };

  if (loading) {
    return (
      <div className="min-h-screen neu-base flex flex-col items-center justify-center gap-3">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-slate-300 border-t-indigo-600 rounded-full"
        />
        <p className="text-xs font-semibold text-slate-500 tracking-wider">লোড হচ্ছে...</p>
      </div>
    );
  }

  // 1. PIN Lock Screen Gate (Required before entering directory)
  if (!portalUnlocked && !isAdmin) {
    return (
      <>
        <PinLockScreen
          correctPin={portalPin}
          onSuccess={handlePortalUnlockSuccess}
          onAdminLoginClick={() => {
            setPinInput('');
            setPinError(false);
            setIsPinModalOpen(true);
            setTimeout(() => pinInputRef.current?.focus(), 150);
          }}
        />

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-slate-700 backdrop-blur-md"
            >
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Login Modal (Directly accessible from PIN screen) */}
        <AnimatePresence>
          {isPinModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPinModalOpen(false)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={cn(
                  "relative bg-white w-full max-w-xs rounded-3xl shadow-2xl p-5 border border-slate-200 transition-all",
                  pinError && "animate-shake border-red-400 ring-2 ring-red-100"
                )}
              >
                <div className="text-center space-y-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center mx-auto text-indigo-600">
                    <Lock size={20} />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">মাস্টার এডমিন লগইন</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    এডমিন প্যানেলে প্রবেশের জন্য নির্ধারিত ৬ সংখ্যার পিন কোড দিন
                  </p>
                </div>

                <form onSubmit={handlePinSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      ref={pinInputRef}
                      id="admin-pin-field"
                      type={showPinText ? 'text' : 'password'}
                      maxLength={10}
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        if (pinError) setPinError(false);
                      }}
                      placeholder="Admin PIN"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl px-3 py-2.5 text-center text-lg tracking-widest font-mono font-bold outline-none transition-all"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinText(!showPinText)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPinText ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {pinError && (
                    <div className="flex items-center justify-center gap-1 text-red-600 text-[11px] font-bold">
                      <AlertCircle size={13} />
                      <span>ভুল পিন কোড! সঠিক পিন দিন।</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsPinModalOpen(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      id="submit-pin-btn"
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      লগইন
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen neu-base text-slate-900 selection:bg-indigo-100 font-sans pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-slate-700 backdrop-blur-md"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top App Bar with Neumorphic Touch */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-15 flex items-center justify-between gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl neu-flat flex items-center justify-center text-indigo-600 font-black text-sm border border-white/80 shrink-0">
              U
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-base leading-none text-slate-900 tracking-tight">UNITY EARNING</h1>
                <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-indigo-200">
                  Payment Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">অফিশিয়াল স্টাফ ও পেমেন্ট রেকর্ড</p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Phone-Frame Official Image & PDF Download Buttons */}
            <button
              id="download-image-header-btn"
              onClick={handleExportImage}
              disabled={isExporting}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="বাংলা নাম সহ ফোন ফ্রেমের HD ছবি ডাউনলোড করুন"
            >
              {isExporting ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
              <span className="hidden sm:inline">ছবি</span>
              <span className="sm:hidden text-[11px]">ছবি</span>
            </button>

            <button
              id="download-pdf-header-btn"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="বাংলা নাম সহ ফোন ফ্রেম সাইজের অফিশিয়াল PDF ডাউনলোড করুন"
            >
              {isExporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
              <span className="hidden sm:inline">PDF</span>
              <span className="sm:hidden text-[11px]">PDF</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                {/* Admin Portal PIN Change Button */}
                <button
                  id="portal-pin-settings-btn"
                  onClick={() => setIsPortalPinModalOpen(true)}
                  className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 sm:px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  title="৪ ডিজিটের পোর্টাল এক্সেস পিন পরিবর্তন করুন"
                >
                  <KeyRound size={13} className="text-indigo-600" />
                  <span className="hidden md:inline">পোর্টাল পিন:</span>
                  <span className="font-mono bg-white px-1.5 py-0.2 rounded-md text-[11px] font-black border border-indigo-200 text-indigo-900">
                    {portalPin}
                  </span>
                </button>

                <button
                  id="add-staff-btn"
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                  title="নতুন স্টাফ যুক্ত করুন"
                >
                  <Plus size={14} />
                  <span className="text-xs">যুক্ত করুন</span>
                </button>

                <button 
                  id="logout-btn"
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="এডমিন লগআউট"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                id="admin-login-btn"
                onClick={() => {
                  setPinInput('');
                  setPinError(false);
                  setIsPinModalOpen(true);
                  setTimeout(() => pinInputRef.current?.focus(), 150);
                }}
                className="flex items-center gap-1 bg-slate-900 hover:bg-indigo-600 active:scale-95 text-white px-2.5 sm:px-3 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer"
              >
                <KeyRound size={13} />
                <span>এডমিন</span>
              </button>
            )}

            {/* Lock Portal Button */}
            <button
              id="lock-portal-header-btn"
              onClick={handlePortalLock}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="পোর্টাল লক করুন (PIN স্ক্রিনে ফিরুন)"
            >
              <Lock size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 space-y-4">
        
        {/* Notice Banner */}
        <AnimatePresence>
          {showNotice && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 sm:p-3.5 shadow-xs relative overflow-hidden"
            >
              <div className="flex items-start gap-2.5">
                <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg shrink-0 mt-0.5">
                  <Info size={16} />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-amber-900 font-bold text-xs uppercase tracking-wide">
                      জরুরি নোটিশ
                    </span>
                    {isAdmin && (
                      <button 
                        id="edit-notice-btn"
                        onClick={() => { setFormNotice(noticeContent); setIsNoticeModalOpen(true); }}
                        className="text-amber-700 hover:text-amber-900 bg-amber-200/60 hover:bg-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                        title="নোটিশ এডিট করুন"
                      >
                        <Edit3 size={11} />
                        <span>এডিট</span>
                      </button>
                    )}
                  </div>
                  <p className="text-amber-900/90 text-xs sm:text-[13px] leading-relaxed font-medium">
                    {noticeContent}
                  </p>
                </div>
                <button 
                  onClick={() => setShowNotice(false)}
                  className="absolute top-2.5 right-2.5 text-amber-500 hover:text-amber-800 p-1 rounded-md transition-colors cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X size={15} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Category Filter Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              id="staff-search-input"
              type="text" 
              placeholder="স্টাফের নাম বা নম্বর দিয়ে সহজে খুঁজুন..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg py-2 pl-9 pr-8 text-xs sm:text-sm font-medium outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button 
              onClick={() => setSelectedCategory('All')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer",
                selectedCategory === 'All' 
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs" 
                  : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
              )}
            >
              <Users size={12} />
              <span>সকল পদবী</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                selectedCategory === 'All' ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600"
              )}>
                {categoryCounts['All'] || 0}
              </span>
            </button>

            {STAFF_CATEGORIES.map(cat => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer",
                    isSelected 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" 
                      : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
                  )}
                >
                  <span>{cat}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                    isSelected ? "bg-indigo-700 text-white" : "bg-slate-200 text-slate-600"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Neumorphic Official Phone Frame Image & PDF Export Banner */}
        <div className="neu-flat rounded-2xl p-3.5 sm:p-4 border border-white/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-11 h-11 rounded-2xl neu-inset flex items-center justify-center text-indigo-600 shrink-0">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">অফিশিয়াল ফোন ফ্রেম ডিরেক্টরি</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-emerald-200">
                  বাংলা নাম সমর্থিত
                </span>
                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-indigo-200">
                  HD 1080p
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                সব এমপ্লয়িদের বাংলা নাম, পদবী, মেথড ও নাম্বার সহ মোবাইল সাইজ ছবি ও PDF ডাউনলোড করুন
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              id="download-phone-frame-image-btn"
              onClick={handleExportImage}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="বাংলা নাম স্পষ্ট সহ মোবাইল ফ্রেমের HD ছবি (PNG) ডাউনলোড করুন"
            >
              {isExporting ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
              <span>ছবি ডাউনলোড</span>
            </button>

            <button
              id="download-phone-frame-pdf-btn"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl neu-btn-action font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="বাংলা নাম স্পষ্ট সহ মোবাইল ফ্রেমের PDF ডাউনলোড করুন"
            >
              {isExporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
              <span>PDF ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Directory Listings */}
        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Search size={22} />
            </div>
            <h3 className="font-bold text-sm text-slate-800">কোনো তথ্য পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              "{searchQuery}" এর সাথে মিলে এমন কোনো নাম বা নম্বর খুঁজে পাওয়া যায়নি।
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              ফিল্টার রিসেট করুন
            </button>
          </div>
        ) : (
          STAFF_CATEGORIES.map((category) => {
            const members = groupedStaff[category];
            if (members.length === 0) return null;

            return (
              <section key={category} className="space-y-2.5">
                
                {/* Category Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-md flex items-center justify-center shadow-xs">
                      {categoryBanglaNum[category]}
                    </span>
                    <h2 className="font-bold text-sm text-slate-800 tracking-tight">
                      {CATEGORY_TITLE_BN[category]?.symbol} {CATEGORY_TITLE_BN[category]?.bn || category}
                    </h2>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                      {members.length} জন
                    </span>
                  </div>
                </div>

                {/* Staff Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {members.map((s, index) => {
                      const theme = methodThemes[s.method] || methodThemes.bKash;
                      const isCopied = copiedId === s.id;

                      return (
                        <motion.div
                          key={s.id}
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.03, duration: 0.15 }}
                          className={cn(
                            "group rounded-xl p-2.5 sm:p-3 border shadow-2xs transition-all duration-150 relative flex items-center gap-2.5",
                            theme.cardBg,
                            theme.cardBorder,
                            theme.cardHoverBorder
                          )}
                        >
                          {/* Distinct 3D Cartoon Avatar (Bust Shot: Chest to Head) */}
                          <div className="relative shrink-0">
                            <img
                              src={getStaffCartoonAvatar(s)}
                              alt={s.name}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shadow-2xs border border-slate-200/90 bg-slate-100 group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.currentTarget.src = isLikelyFemale(s.name) ? '/avatars/girl_1.jpg' : '/avatars/boy_1.jpg';
                              }}
                            />
                            {/* Status Indicator Dot */}
                            <span 
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs",
                                theme.dotColor
                              )} 
                              title={`Payment: ${s.method}`}
                            />
                          </div>

                          {/* Member Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 truncate leading-snug">
                                {s.name}
                              </h3>
                              
                              {/* Payment Method Badge */}
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border leading-none shrink-0",
                                theme.badgeBg,
                                theme.badgeBorder
                              )}>
                                {s.method}
                              </span>
                            </div>

                            {/* Phone & Actions Row */}
                            <div className="flex items-center justify-between gap-1.5">
                              
                              {/* Phone Number Display with Payment Method matching colors */}
                              <div className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] sm:text-xs font-mono font-bold tracking-tight min-w-0 transition-colors shadow-2xs",
                                theme.numberBox
                              )}>
                                <Phone size={10} className={cn("shrink-0", theme.numberIcon)} />
                                <span className="truncate">{s.number}</span>
                              </div>

                              {/* Copy & Admin Controls */}
                              <div className="flex items-center gap-1 shrink-0">
                                
                                {isAdmin && (
                                  <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1 mr-0.5">
                                    <button
                                      onClick={() => handleEdit(s)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                      title="তথ্য সংশোধন"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(s)}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                      title="মুছে ফেলুন"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}

                                <button
                                  onClick={() => handleCopy(s.id, s.number)}
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all border active:scale-95 cursor-pointer shadow-2xs",
                                    isCopied
                                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                      : cn("hover:shadow-xs", theme.copyBtn)
                                  )}
                                  title="নম্বর কপি করুন"
                                >
                                  {isCopied ? <Check size={11} className="stroke-[3]" /> : <Copy size={11} />}
                                  <span>{isCopied ? 'কপি হয়েছে' : 'কপি'}</span>
                                </button>
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            );
          })
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-1.5">
          <p className="text-xs font-bold text-slate-800">UNITY EARNING DIRECTORY</p>
          <p className="text-[11px] text-slate-400">
            নিরাপদ ও নির্ভরযোগ্য ই-লার্নিং স্টাফ ম্যানেজমেন্ট সিস্টেম
          </p>
          <p className="text-[10px] text-slate-400 pt-1">
            © {new Date().getFullYear()} Unity Earning. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Admin PIN Login Modal */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPinModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={cn(
                "relative bg-white w-full max-w-xs rounded-2xl shadow-2xl p-5 border border-slate-200 transition-all",
                pinError && "animate-shake border-red-400 ring-2 ring-red-100"
              )}
            >
              <div className="text-center space-y-2 mb-4">
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto border border-indigo-100 shadow-xs">
                  <Lock size={20} />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">এডমিন পিন প্রবেশ করান</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  পরিচালনা প্যানেলে প্রবেশের জন্য নির্ধারিত ৬ সংখ্যার পিন কোড দিন
                </p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    ref={pinInputRef}
                    id="admin-pin-field"
                    type={showPinText ? 'text' : 'password'}
                    maxLength={10}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError(false);
                    }}
                    placeholder="PIN Code"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl px-3 py-2.5 text-center text-lg tracking-widest font-mono font-bold outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPinText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {pinError && (
                  <div className="flex items-center justify-center gap-1 text-red-600 text-[11px] font-bold">
                    <AlertCircle size={13} />
                    <span>ভুল পিন কোড! সঠিক পিন দিন।</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    id="submit-pin-btn"
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold py-2 rounded-lg shadow-xs transition-all cursor-pointer"
                  >
                    লগইন করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Add / Edit Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                    {editingStaff ? <Edit3 size={14} /> : <Plus size={14} />}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {editingStaff ? 'স্টাফ তথ্য পরিবর্তন' : 'নতুন স্টাফ যুক্তকরণ'}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
                
                {/* Profile Picture Selector Section */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700">
                      প্রোফাইল ছবি / অবতার (Profile Picture)
                    </label>
                    {formPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormPhotoUrl('')}
                        className="text-[10px] text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer"
                      >
                        ছবি রিমুভ
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Picture Preview */}
                    <div className="relative shrink-0">
                      {formPhotoUrl ? (
                        <div className="relative">
                          <img
                            src={formPhotoUrl}
                            alt="Preview"
                            className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-600 shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormPhotoUrl('')}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow-xs hover:bg-red-700 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : formName.trim() ? (
                        <div className="relative">
                          <img
                            src={getStaffCartoonAvatar({ name: formName.trim() })}
                            alt="Auto Assigned"
                            className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500 shadow-sm"
                          />
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-emerald-600 text-[9px] text-white px-1 py-0.5 rounded font-bold whitespace-nowrap shadow-xs">
                            অটো অবতার
                          </span>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                          <UserIcon size={22} />
                          <span className="text-[9px] font-bold text-slate-500">ছবি নেই</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1.5 rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Upload size={12} className="text-indigo-600" />
                        <span>আপলোড</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoPresets(!showPhotoPresets);
                          setShowUrlInput(false);
                        }}
                        className={cn(
                          "flex items-center gap-1 border px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer",
                          showPhotoPresets
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        <Sparkles size={12} className={showPhotoPresets ? "text-white" : "text-amber-500"} />
                        <span>কার্টুন অবতার ({AVATAR_ITEMS.length}টি)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoPresets(true);
                          setAvatarGenderFilter('boy');
                          setShowUrlInput(false);
                        }}
                        className={cn(
                          "flex items-center gap-1 border px-2 py-1.5 rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer",
                          showPhotoPresets && avatarGenderFilter === 'boy'
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-blue-50/70 hover:bg-blue-100 text-blue-700 border-blue-200"
                        )}
                      >
                        <span>👦 ছেলে</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoPresets(true);
                          setAvatarGenderFilter('girl');
                          setShowUrlInput(false);
                        }}
                        className={cn(
                          "flex items-center gap-1 border px-2 py-1.5 rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer",
                          showPhotoPresets && avatarGenderFilter === 'girl'
                            ? "bg-pink-600 text-white border-pink-600"
                            : "bg-pink-50/70 hover:bg-pink-100 text-pink-700 border-pink-200"
                        )}
                      >
                        <span>👧 মেয়ে</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUrlInput(!showUrlInput);
                          setShowPhotoPresets(false);
                        }}
                        className={cn(
                          "flex items-center gap-1 border px-2 py-1.5 rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer",
                          showUrlInput
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        <ImageIcon size={12} className={showUrlInput ? "text-white" : "text-slate-500"} />
                        <span>লিংক</span>
                      </button>
                    </div>
                  </div>

                  {/* Preset Avatars Gallery */}
                  {showPhotoPresets && (
                    <div className="pt-2 border-t border-slate-200/70 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                          <Sparkles size={12} className="text-amber-500" />
                          কার্টুন প্রোফাইল ছবি পছন্দ করুন (পেট থেকে মাথা পর্যন্ত ৩ডি ছবি):
                        </p>
                      </div>

                      {/* Gender / Category Filter Tabs */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {[
                          { id: 'all', label: `সবগুলো (${AVATAR_ITEMS.length}টি)` },
                          { id: 'boy', label: `👦 ছেলে কার্টুন (${BOY_AVATARS.length}টি)` },
                          { id: 'girl', label: `👧 মেয়ে কার্টুন (${GIRL_AVATARS.length}টি)` },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setAvatarGenderFilter(tab.id as any)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all border cursor-pointer",
                              avatarGenderFilter === tab.id
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                        {AVATAR_ITEMS
                          .filter(item => avatarGenderFilter === 'all' || item.gender === avatarGenderFilter)
                          .map((item, idx) => {
                            const isSelected = formPhotoUrl === item.url;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setFormPhotoUrl(item.url);
                                }}
                                className={cn(
                                  "group relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer flex items-center justify-center bg-white shadow-2xs",
                                  isSelected 
                                    ? "border-indigo-600 ring-2 ring-indigo-300 shadow-md" 
                                    : "border-slate-200 hover:border-indigo-400"
                                )}
                                title={item.label}
                              >
                                <img
                                  src={item.url}
                                  alt={item.label}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                {isSelected ? (
                                  <div className="absolute inset-0 bg-indigo-600/35 rounded-lg flex items-center justify-center text-white backdrop-blur-[0.5px]">
                                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                                      <Check size={12} className="stroke-[3] text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Custom URL Input */}
                  {showUrlInput && (
                    <div className="pt-2 border-t border-slate-200/70 space-y-1 animate-fadeIn">
                      <p className="text-[10px] text-slate-500 font-bold">অনলাইন ছবির URL দিন:</p>
                      <input
                        type="url"
                        value={formPhotoUrl}
                        onChange={(e) => setFormPhotoUrl(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    পুরো নাম (Full Name)
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg px-3 py-2 text-xs font-medium outline-none transition-all"
                    placeholder="যেমন: সায়মা কায়সার"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    পদবী (Category)
                  </label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as StaffCategory)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg px-3 py-2 text-xs font-medium outline-none transition-all"
                  >
                    {STAFF_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    পেমেন্ট মেথড (Payment Method)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PAYMENT_METHODS.map(m => {
                      const isSelected = formMethod === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFormMethod(m)}
                          className={cn(
                            "py-1.5 px-1 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer",
                            isSelected
                              ? m === 'bKash' 
                                ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                : m === 'Nagad'
                                ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                : m === 'Rocket'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    মোবাইল নম্বর (Phone Number)
                  </label>
                  <input 
                    required 
                    type="tel" 
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg px-3 py-2 text-xs font-mono font-medium outline-none transition-all"
                    placeholder="যেমন: 01612465402"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>{editingStaff ? 'আপডেট করুন' : 'সেভ করুন'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-xs rounded-2xl shadow-2xl p-4 text-center border border-slate-200"
            >
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-2.5">
                <Trash2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">মুছে ফেলতে চান?</h3>
              <p className="text-slate-500 text-xs mb-4">
                আপনি কি নিশ্চিত যে <span className="font-bold text-slate-800">{staffToDelete?.name}</span> কে তালিকা থেকে ডিলিট করবেন?
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  না
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700 shadow-xs transition-colors cursor-pointer"
                >
                  হ্যাঁ, মুছুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Edit Notice Modal */}
      <AnimatePresence>
        {isNoticeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNoticeModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-4 border border-slate-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">জরুরি নোটিশ আপডেট</h3>
                <button onClick={() => setIsNoticeModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleUpdateNotice} className="space-y-3">
                <textarea 
                  required
                  value={formNotice}
                  onChange={(e) => setFormNotice(e.target.value)}
                  placeholder="নোটিশের বক্তব্য লিখুন..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNoticeModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>আপডেট নোটিশ</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Portal PIN Configuration Modal (Admin Only) */}
      <PortalPinModal
        isOpen={isPortalPinModalOpen}
        onClose={() => setIsPortalPinModalOpen(false)}
        currentPin={portalPin}
        onSuccess={(newPin) => {
          setPortalPin(newPin);
          showToast(`নতুন ৪ ডিজিটের পোর্টাল পিন সেট হয়েছে: ${newPin}`);
        }}
      />

    </div>
  );
}
