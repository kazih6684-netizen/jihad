export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket';

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

export const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Alexander',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Elena',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Maya',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Pixel',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky',
  'https://api.dicebear.com/7.x/micah/svg?seed=Leo',
  'https://api.dicebear.com/7.x/micah/svg?seed=Chloe',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Ryan',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Emma'
];

export const STAFF_CATEGORIES: StaffCategory[] = [
  'Senior Team Leader',
  'Team Leader',
  'Counselor',
  'Senior Counselor',
  'Teacher',
  'Team Trainer'
];

export const PAYMENT_METHODS: PaymentMethod[] = ['bKash', 'Nagad', 'Rocket'];
