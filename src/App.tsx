import React, { useEffect, useState, useMemo } from 'react';
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
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  Search, 
  Plus, 
  LogOut, 
  LogIn, 
  Copy, 
  Check, 
  User as UserIcon, 
  Phone, 
  Trash2, 
  Edit3,
  X,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import { StaffMember, StaffCategory, PaymentMethod, STAFF_CATEGORIES, PAYMENT_METHODS } from './types';
import { cn } from './lib/utils';

// Consts - Initial admin email
const ADMIN_EMAILS = ['kazih6684@gmail.com'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(true);
  const [noticeContent, setNoticeContent] = useState('আপনাদের নাম্বার এবং মেথড ঠিক আছে কিনা সবাই চেক করে দেখে নেন, এই তথ্যের মোতাবেকি আপনাদের স্যালারি দেওয়া হবে। ভুল থাকলে দ্রুত এডমিনকে জানান।');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<StaffCategory>('Senior Team Leader');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('bKash');
  const [formNumber, setFormNumber] = useState('');
  const [formNotice, setFormNotice] = useState('');

  // Test connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u ? ADMIN_EMAILS.includes(u.email || '') : false);
    });
    return unsubscribe;
  }, []);

  // Real-time Staff Listener
  useEffect(() => {
    const q = query(collection(db, 'staff'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffMember[];
      setStaff(staffList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staff');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Notice Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'notice'), (snapshot) => {
      if (snapshot.exists()) {
        setNoticeContent(snapshot.data().content);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setFormName('');
    setFormCategory('Senior Team Leader');
    setFormMethod('bKash');
    setFormNumber('');
    setEditingStaff(null);
  };

  const handleEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setFormName(s.name);
    setFormCategory(s.category);
    setFormMethod(s.method);
    setFormNumber(s.number);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !user) return;

    const staffData = {
      name: formName,
      category: formCategory,
      method: formMethod,
      number: formNumber,
    };

    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'staff', editingStaff.id), {
          ...staffData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'staff'), {
          ...staffData,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          order: 0,
        });
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
        content: formNotice,
        updatedAt: serverTimestamp()
      });
      setIsNoticeModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/notice');
    }
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.number.includes(searchQuery);
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [staff, searchQuery, selectedCategory]);

  const groupedStaff = useMemo(() => {
    // Initial categories object with explicit typing
    const groups: Record<StaffCategory, StaffMember[]> = {
      'Senior Team Leader': [],
      'Team Leader': [],
      'Counselor': [],
      'Senior Counselor': [],
      'Teacher': [],
      'Team Trainer': [],
    };
    filteredStaff.forEach(s => {
      // Check if the category exists in the record key set
      if (groups[s.category]) {
        groups[s.category].push(s);
      }
    });
    return groups;
  }, [filteredStaff]);

  const methodStyles: Record<PaymentMethod, {
    card: string;
    avatar: string;
    badge: string;
    dot: string;
    button: string;
  }> = {
    bKash: {
      card: 'bg-pink-50/40 border-pink-100 hover:border-pink-200 hover:shadow-pink-100',
      avatar: 'bg-pink-100 text-pink-600 border-pink-100/50',
      badge: 'bg-pink-100 text-pink-600 border-pink-200',
      dot: 'bg-pink-500',
      button: 'hover:bg-pink-100/50'
    },
    Nagad: {
      card: 'bg-orange-50/40 border-orange-100 hover:border-orange-200 hover:shadow-orange-100',
      avatar: 'bg-orange-100 text-orange-600 border-orange-100/50',
      badge: 'bg-orange-100 text-orange-600 border-orange-200',
      dot: 'bg-orange-500',
      button: 'hover:bg-orange-100/50'
    },
    Rocket: {
      card: 'bg-indigo-50/40 border-indigo-100 hover:border-indigo-200 hover:shadow-indigo-100',
      avatar: 'bg-indigo-100 text-indigo-600 border-indigo-100/50',
      badge: 'bg-indigo-100 text-indigo-600 border-indigo-200',
      dot: 'bg-indigo-500',
      button: 'hover:bg-indigo-100/50'
    },
  };

  const categoryNumbers: Record<StaffCategory, string> = {
    'Senior Team Leader': '১',
    'Team Leader': '২',
    'Counselor': '৩',
    'Senior Counselor': '৪',
    'Teacher': '৫',
    'Team Trainer': '৬',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
              U
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight uppercase">Unity Earning</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">E-learning Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-md hover:bg-indigo-700 transition-colors"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Staff</span>
              </motion.button>
            )}
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-semibold">{user.displayName}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Admin Access</span>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold text-sm transition-colors"
              >
                <LogIn size={18} />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Search */}
      <section className="bg-white border-b border-slate-200 pb-8 pt-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black text-slate-900 mb-2 tracking-tight uppercase"
            >
              Unity Earning
            </motion.h2>
            <p className="text-slate-500 font-medium">E-learning Platform Directory</p>
          </div>

          {/* Salary Notice Banner */}
          <AnimatePresence>
            {showNotice && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="mb-8 bg-amber-50 border border-amber-200 p-5 rounded-3xl flex items-start gap-4 shadow-sm relative group"
              >
                <div className="bg-amber-100 p-2.5 rounded-2xl text-amber-600 shrink-0 shadow-inner">
                  <Info size={24} />
                </div>
                <div className="pr-8">
                  <p className="text-amber-900 font-black text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                    গুরুত্বপূর্ণ নির্দেশিকা
                    {isAdmin && (
                      <button 
                        onClick={() => { setFormNotice(noticeContent); setIsNoticeModalOpen(true); }}
                        className="p-1 hover:bg-amber-200 rounded-lg text-amber-600 transition-colors"
                        title="Edit Notice"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </p>
                  <p className="text-amber-800 text-[15px] leading-relaxed font-medium">
                    {noticeContent}
                  </p>
                </div>
                <button 
                  onClick={() => setShowNotice(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-amber-200/50 rounded-full text-amber-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="নাম বা নম্বর দিয়ে খুঁজুন..." 
                className="w-full bg-slate-100 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 focus:bg-white focus:border-indigo-500 transition-all text-lg font-medium outline-none shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar scroll-smooth -mx-4 px-4">
              <button 
                onClick={() => setSelectedCategory('All')}
                className={cn(
                  "px-6 py-3 rounded-2xl whitespace-nowrap text-[11px] font-black tracking-widest transition-all uppercase",
                  selectedCategory === 'All' 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 ring-2 ring-indigo-500/20" 
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                All STAFF
              </button>
              {STAFF_CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-3 rounded-2xl whitespace-nowrap text-[11px] font-black tracking-widest transition-all uppercase",
                    selectedCategory === cat 
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 ring-2 ring-indigo-500/20" 
                      : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Directory Content */}
      <main className="max-w-4xl mx-auto px-4 mt-12">
        {STAFF_CATEGORIES.map((category) => {
          const members = groupedStaff[category];
          if (members.length === 0) return null;

          return (
            <motion.div 
              key={category}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-14"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-200">
                  {categoryNumbers[category]}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{category}</h3>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Official Staff Category</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {members.map((s, index) => (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "group rounded-2xl p-3 sm:p-4 border transition-all flex items-center gap-3 sm:gap-4",
                        methodStyles[s.method].card
                      )}
                    >
                      {/* Avatar with Status Dot */}
                      <div className="relative shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shadow-inner transition-colors",
                          methodStyles[s.method].avatar
                        )}>
                          <UserIcon size={24} />
                        </div>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100/50",
                          methodStyles[s.method].dot
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center flex-wrap gap-2">
                            <h4 className="font-bold text-slate-800 text-[14px] sm:text-base tracking-tight leading-tight">
                              {s.name}
                            </h4>
                            <div className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase border leading-none transition-colors",
                              methodStyles[s.method].badge
                            )}>
                              {s.method}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <div className="bg-white/60 backdrop-blur-sm px-2 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-200/50 flex-1 min-w-0 shadow-sm">
                              <Phone size={10} className="text-slate-400 shrink-0" />
                              <span className="text-slate-700 font-bold text-[11px] sm:text-[13px] tracking-wider truncate">{s.number}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {isAdmin && (
                                <div className="flex items-center gap-1 border-r border-slate-200/50 pr-1 mr-1">
                                  <button
                                    onClick={() => handleEdit(s)}
                                    className={cn(
                                      "p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-all",
                                      methodStyles[s.method].button
                                    )}
                                    title="Edit"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(s)}
                                    className={cn(
                                      "p-2 text-slate-400 hover:text-red-500 rounded-lg transition-all",
                                      methodStyles[s.method].button
                                    )}
                                    title="Delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                              <button 
                                onClick={() => handleCopy(s.id, s.number)}
                                className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all uppercase border shadow-sm",
                                  copiedId === s.id 
                                    ? "bg-green-500 text-white border-green-500" 
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                )}
                              >
                                {copiedId === s.id ? <Check size={10} /> : <Copy size={10} />}
                                <span className={cn(copiedId === s.id && "hidden sm:inline")}>{copiedId === s.id ? "Done" : "Copy"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
              U
            </div>
          </div>
          <h3 className="font-extrabold text-xl mb-4 uppercase">Unity Earning</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
            Unity Earning E-learning Platform. একটি আধুনিক এবং গতিশীল ই-লার্নিং প্ল্যাটফর্ম যা আপনার ক্যারিয়ার গঠনে সহায়তা করে। আমাদের সাথে যুক্ত থাকুন।
          </p>
          <div className="flex justify-center gap-6 text-slate-400 mb-8">
            <div className="p-2 hover:text-indigo-600 cursor-pointer transition-colors"><Info size={20} /></div>
            <div className="p-2 hover:text-indigo-600 cursor-pointer transition-colors"><ShieldCheck size={20} /></div>
          </div>
          <p className="text-xs text-slate-400 font-medium">© 2026 Unity Earning. All rights reserved.</p>
        </div>
      </footer>

      {/* Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-wide">Enter official directory information</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    placeholder="e.g. সায়মা কায়সার"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                    <select 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as StaffCategory)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all font-medium"
                    >
                      {STAFF_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Method</label>
                    <select 
                      value={formMethod}
                      onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all font-medium"
                    >
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Number</label>
                  <input 
                    required 
                    type="text" 
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    placeholder="e.g. 01612465402"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {editingStaff ? <Edit3 size={20} /> : <Plus size={20} />}
                  {editingStaff ? 'Update Directory' : 'Add to Directory'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Are you sure?</h3>
              <p className="text-slate-500 text-sm mb-6">
                You are about to delete <span className="font-bold text-slate-800">{staffToDelete?.name}</span> from the directory. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notice Edit Modal */}
      <AnimatePresence>
        {isNoticeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNoticeModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Edit Global Notice</h3>
                <button onClick={() => setIsNoticeModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateNotice} className="space-y-4">
                <textarea 
                  required
                  value={formNotice}
                  onChange={(e) => setFormNotice(e.target.value)}
                  placeholder="Enter notice text..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 h-32 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium resize-none"
                />
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Update Notice
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
