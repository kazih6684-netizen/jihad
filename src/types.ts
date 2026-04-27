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
  createdAt: any;
  createdBy: string;
  order?: number;
}

export const STAFF_CATEGORIES: StaffCategory[] = [
  'Senior Team Leader',
  'Team Leader',
  'Counselor',
  'Senior Counselor',
  'Teacher',
  'Team Trainer'
];

export const PAYMENT_METHODS: PaymentMethod[] = ['bKash', 'Nagad', 'Rocket'];
