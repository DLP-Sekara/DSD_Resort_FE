// 1. Dashboard Interfaces
export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  isRead: boolean;
}

export interface DashboardDetails {
  totalReservations: number;
  availableRooms: number;
  totalRevenue: number;
  recentActivity: any[];
}

// 2. Reservation Interfaces
export interface Reservation {
  additionalFoodCost: number;
  reservationDetails: any;
  planId: any;
  typeId: any;
  resId: any;
  roomId: any;
  id?: string;
  guestId?: string;
  guestName: string;
  roomNo?: string;
  roomType?: string;
  mealPlanId?: string;
  checkIn: string;
  checkOut: string;
  contactNo: string;
  email?: string;
  guestCount?: number;
  status:
    | 'PENDING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'CONFIRMED'
    | 'CHECKED_IN'
    | 'CHECKED_OUT';
  totalAmount: number;
  totalBill?: number;
}

export interface AvailabilityCheck {
  typeId?: string;
  checkIn: string;
  checkOut: string;
}

// 3. Room Interfaces
export interface Room {
  roomId?: string;
  roomNumber: string;
  typeId: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_ORDER' | 'CLEANING';
}

// 4. Meal & Food Interfaces
export interface MealPlan {
  planId?: string;
  name: string;
  planCode: string; // e.g., BB, HB, FB
  price: number;
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface FoodItem {
  itemId?: string;
  name: string;
  unitPrice: number;
  quantityOnHand: number;
}

// 5. Payment & Billing Interfaces
export interface Invoice {
  id?: string;
  invoiceNo: string;
  guestName: string;
  reservationId: string;
  totalAmount: number;
  billingDate: string;
  status: 'Paid' | 'Pending' | 'Partial';
}

export interface IncomeReport {
  date: string;
  totalIncome: number;
  reservationCount: number;
}

// 6. User & Session Interfaces
export interface UserAccount {
  guestId?: string;
  name: string;
  nic?: string;
  phone?: string;
}

export interface UserSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
}

// Shared Request Type
export interface ServiceRequestArgs {
  url: string;
  data?: any;
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
}
