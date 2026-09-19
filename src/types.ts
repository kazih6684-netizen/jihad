export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Upay';

export type StaffCategory = 
  | 'Senior Team Leader' 
  | 'Team Leader' 
  | 'Counselor' 
  | 'Senior Counselor' 
  | 'Teacher' 
  | 'Team Trainer';

export interface StaffMember {
  id: string;
  name: string;
  category: StaffCategory;
  method: PaymentMethod;
  number: string;
  photoUrl?: string;
  createdAt: any;
  createdBy: string;
  order?: number;
}

export interface AvatarItem {
  url: string;
  gender: 'boy' | 'girl';
  label: string;
}

export const BOY_AVATARS: AvatarItem[] = [
  { url: '/avatars/boy_1.jpg', gender: 'boy', label: 'ছেলে কার্টুন ১ (ব্লু হুডি)' },
  { url: '/avatars/boy_2.jpg', gender: 'boy', label: 'ছেলে কার্টুন ২ (স্মার্ট চশমা)' },
  { url: '/avatars/boy_3.jpg', gender: 'boy', label: 'ছেলে কার্টুন ৩ (স্পোর্টি জ্যাকেট)' },
  { url: '/avatars/boy_4.jpg', gender: 'boy', label: 'ছেলে কার্টুন ৪ (ফরমাল শার্ট)' },
  { url: '/avatars/boy_5.jpg', gender: 'boy', label: 'ছেলে কার্টুন ৫ (স্টাইলিশ জ্যাকেট)' },
  { url: '/avatars/boy_6.jpg', gender: 'boy', label: 'ছেলে কার্টুন ৬ (মেরুন হুডি)' },
  { url: '/avatars/boy_7.jpg', gender: 'boy', label: 'ছেলে কার্টুন ৭ (ব্লেজার ও চশমা)' },
  { url: '/avatars/boy_8.jpg', gender: 'boy', label: 'ছেলে কার্টুন ৮ (অ্যাথলেটিক লুক)' },
  { url: '/avatars/boy_9.jpg', gender: 'boy', label: 'ছেলে কার্টুন ৯ (টার্টলনেক সোয়েটার)' },
  { url: '/avatars/boy_10.jpg', gender: 'boy', label: 'ছেলে কার্টুন ১০ (অলিভ জ্যাকেট)' },
];

export const GIRL_AVATARS: AvatarItem[] = [
  { url: '/avatars/girl_1.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ১ (গোলাপি সোয়েটার)' },
  { url: '/avatars/girl_2.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ২ (হলুদ হুডি ও পনিটেল)' },
  { url: '/avatars/girl_3.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ৩ (স্মার্ট চশমা ও সোয়েটার)' },
  { url: '/avatars/girl_4.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ৪ (সবুজ কুর্তি ও বিনুনি)' },
  { url: '/avatars/girl_5.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ৫ (ডেনিম ভেস্ট ও বব কাট)' },
  { url: '/avatars/girl_6.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ৬ (গোলাপি হিজাব পরিহিতা)' },
  { url: '/avatars/girl_7.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ৭ (মিন্ট গ্রিন শার্ট)' },
  { url: '/avatars/girl_8.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ৮ (কমলা ব্লেজার)' },
  { url: '/avatars/girl_9.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ৯ (নীল জ্যাকেট ও খোঁপায় চুল)' },
  { url: '/avatars/girl_10.jpg', gender: 'girl', label: 'মেয়ে কার্টুন ১০ (মার্জিত ভায়োলেট শার্ট)' },
];

export const AVATAR_ITEMS: AvatarItem[] = [
  ...BOY_AVATARS,
  ...GIRL_AVATARS,
];

export const AVATAR_PRESETS = AVATAR_ITEMS.map(item => item.url);

// Female name indicators in Bengali & English
const FEMALE_KEYWORDS = [
  'আক্তার', 'খাতুন', 'বেগম', 'সুলতানা', 'জাহান', 'ফারহানা', 'সাদিয়া', 'নুসরাত', 
  'মারিয়া', 'ফাতেমা', 'আয়েশা', 'জান্নাত', 'মিম', 'নাজমা', 'রোকসানা', 'শারমিন', 
  'তানজিলা', 'রুবিনা', 'লাবণী', 'সুমাইয়া', 'তাসনিম', 'সোনিয়া', 'শায়লা', 'জেরিন', 
  'সুমি', 'নিপা', 'আফসানা', 'লুবনা', 'তন্বী', 'তৃষা', 'মৌ', 'প্রিয়া', 'রিতা', 
  'পূজা', 'দীপা', 'বৃষ্টি', 'নদী', 'মেহজাবিন', 'নুহা', 'রোদেলা', 'মিতু', 'ঋতু',
  'akter', 'khatun', 'begum', 'sultana', 'jahan', 'farhana', 'sadia', 'nusrat',
  'maria', 'fatema', 'ayesha', 'jannat', 'mim', 'nazma', 'sharmin', 'sumaiya',
  'tasnim', 'sonia', 'zerin', 'sumi', 'nipa', 'mitu', 'ritu', 'priya', 'pooja'
];

export function isLikelyFemale(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return FEMALE_KEYWORDS.some(k => lower.includes(k));
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getStaffCartoonAvatar(member: { id?: string; name: string; photoUrl?: string }): string {
  if (member.photoUrl && !member.photoUrl.includes('dicebear.com')) {
    return member.photoUrl;
  }

  const isFemale = isLikelyFemale(member.name);
  const pool = isFemale ? GIRL_AVATARS : BOY_AVATARS;
  const key = (member.id || '') + (member.name || 'user');
  const index = simpleHash(key) % pool.length;
  return pool[index].url;
}


export const STAFF_CATEGORIES: StaffCategory[] = [
  'Senior Team Leader',
  'Team Leader',
  'Senior Counselor',
  'Counselor',
  'Teacher',
  'Team Trainer'
];

export const CATEGORY_HIERARCHY_ORDER: Record<StaffCategory, number> = {
  'Senior Team Leader': 1,
  'Team Leader': 2,
  'Senior Counselor': 3,
  'Counselor': 4,
  'Teacher': 5,
  'Team Trainer': 6,
};

export const CATEGORY_TITLE_BN: Record<StaffCategory, { bn: string; short: string; symbol: string }> = {
  'Senior Team Leader': { bn: 'সিনিয়র টিম লিডার (এসটিএল / STL)', short: 'STL', symbol: '👑' },
  'Team Leader': { bn: 'টিম লিডার (টিএল / TL)', short: 'TL', symbol: '👔' },
  'Senior Counselor': { bn: 'সিনিয়র কাউন্সেলর (Senior Counselor)', short: 'SC', symbol: '🎖️' },
  'Counselor': { bn: 'কাউন্সেলর (Counselor)', short: 'CO', symbol: '📋' },
  'Teacher': { bn: 'শিক্ষক (Teacher)', short: 'TR', symbol: '🎓' },
  'Team Trainer': { bn: 'টিম ট্রেইনার (Team Trainer)', short: 'TT', symbol: '🚀' },
};

export const PAYMENT_METHODS: PaymentMethod[] = ['bKash', 'Nagad', 'Rocket', 'Upay'];

