import type { FoodItem } from './services.interfaces';

export interface CreateOrderDetailDTO {
  itemId: string;
  orderedQty: number;
}

export interface CreateRestaurantOrderDTO {
  guestId?: string;
  handledBy: string;
  status: string;
  orderDetails: CreateOrderDetailDTO[];
}

export interface RestaurantOrderDetail {
  id?: string;
  orderId?: string;
  itemId: string;
  orderedQty: number;
  unitPrice?: number;
  subtotal?: number;
  itemName?: string;
  foodItem?: FoodItem;
}

export interface RestaurantOrder {
  orderId: string;
  guestId?: string;
  handledBy: string;
  orderTime: string;
  totalAmount: number;
  status: 'PENDING' | 'PREPARING' | 'SERVED' | 'COMPLETED' | 'CANCELLED' | string;
  orderDetails?: RestaurantOrderDetail[];
  restaurantOrderDetails?: RestaurantOrderDetail[];
  guest?: {
    guestId?: string;
    name?: string;
    nic?: string;
    phone?: string;
  };
  handledByUser?: {
    adminId?: string;
    name?: string;
    role?: string;
    email?: string;
  };
  guestName?: string;
  handledByName?: string;
}
