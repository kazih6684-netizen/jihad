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
  gender: 'boy' | 'girl' | 'bot';
  label: string;
}

export const AVATAR_ITEMS: AvatarItem[] = [
  // Boys
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4,c0aede,d1d4f9', gender: 'boy', label: 'Felix (Boy)' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&backgroundColor=b6e3f4,c0aede,d1d4f9', gender: 'boy', label: 'Oliver (Boy)' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=b6e3f4,c0aede,d1d4f9', gender: 'boy', label: 'Milo (Boy)' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=b6e3f4,c0aede,d1d4f9', gender: 'boy', label: 'Leo (Boy)' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden&backgroundColor=b6e3f4,c0aede,d1d4f9', gender: 'boy', label: 'Aiden (Boy)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=b6e3f4,d1d4f9', gender: 'boy', label: 'Jack (Boy)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=b6e3f4,d1d4f9', gender: 'boy', label: 'Sam (Boy)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas&backgroundColor=b6e3f4,d1d4f9', gender: 'boy', label: 'Lucas (Boy)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=b6e3f4,d1d4f9', gender: 'boy', label: 'Max (Boy)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan&backgroundColor=b6e3f4,d1d4f9', gender: 'boy', label: 'Ethan (Boy)' },
  { url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Alexander&backgroundColor=b6e3f4,c0aede', gender: 'boy', label: 'Alexander (Boy)' },
  { url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Jasper&backgroundColor=b6e3f4,c0aede', gender: 'boy', label: 'Jasper (Boy)' },
  { url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Noah&backgroundColor=b6e3f4,c0aede', gender: 'boy', label: 'Noah (Boy)' },
  { url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Liam&backgroundColor=b6e3f4,c0aede', gender: 'boy', label: 'Liam (Boy)' },
  { url: 'https://api.dicebear.com/7.x/micah/svg?seed=Caleb&backgroundColor=b6e3f4,c0aede', gender: 'boy', label: 'Caleb (Boy)' },
  { url: 'https://api.dicebear.com/7.x/micah/svg?seed=Daniel&backgroundColor=b6e3f4,c0aede', gender: 'boy', label: 'Daniel (Boy)' },

  // Girls
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffd5dc,ffdfbf,c0aede', gender: 'girl', label: 'Aneka (Girl)' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella&backgroundColor=ffd5dc,ffdfbf,c0aede', gender: 'girl', label: 'Bella (Girl)' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=ffd5dc,ffdfbf,c0aede', gender: 'girl', label: 'Zoe (Girl)' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia&backgroundColor=ffd5dc,ffdfbf,c0aede', gender: 'girl', label: 'Sophia (Girl)' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily&backgroundColor=ffd5dc,ffdfbf,c0aede', gender: 'girl', label: 'Lily (Girl)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Luna (Girl)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Emma (Girl)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Mia (Girl)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Chloe (Girl)' },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ruby&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Ruby (Girl)' },
  { url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Elena&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Elena (Girl)' },
  { url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Maya&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Maya (Girl)' },
  { url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Nora&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Nora (Girl)' },
  { url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Aria&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Aria (Girl)' },
  { url: 'https://api.dicebear.com/7.x/micah/svg?seed=Grace&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Grace (Girl)' },
  { url: 'https://api.dicebear.com/7.x/micah/svg?seed=Harper&backgroundColor=ffd5dc,ffdfbf', gender: 'girl', label: 'Harper (Girl)' },

  // Mascots & Robots
  { url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pixel&backgroundColor=b6e3f4', gender: 'bot', label: 'Pixel (Robot)' },
  { url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky&backgroundColor=ffd5dc', gender: 'bot', label: 'Sparky (Robot)' },
  { url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ziggy&backgroundColor=d1d4f9', gender: 'bot', label: 'Ziggy (Robot)' },
  { url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Turbo&backgroundColor=ffdfbf', gender: 'bot', label: 'Turbo (Robot)' }
];

export const AVATAR_PRESETS = AVATAR_ITEMS.map(item => item.url);


export const STAFF_CATEGORIES: StaffCategory[] = [
  'Senior Team Leader',
  'Team Leader',
  'Counselor',
  'Senior Counselor',
  'Teacher',
  'Team Trainer'
];

export const PAYMENT_METHODS: PaymentMethod[] = ['bKash', 'Nagad', 'Rocket', 'Upay'];

