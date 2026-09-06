export type KDSOrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
export type KDSPriority = 'NORMAL' | 'URGENT' | 'VIP';

export interface KDSOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  notes?: string;
  station?: string;
  category?: string;
  unitPrice?: number;
  isKitchenPrepared?: boolean;
}

export interface KDSOrderTicket {
  id: string;
  orderNumber: string;
  orderSource: 'WALK_IN' | 'TABLE_DINE_IN' | 'ROOM_SERVICE' | 'POOL_BAR';
  tableOrRoom?: string;
  guestName?: string;
  guestPhone?: string;
  serverName?: string;
  serverRole?: string;
  totalAmount?: number;
  totalPax?: number;
  createdAt: string; // ISO string
  startedCookingAt?: string;
  readyAt?: string;
  status: KDSOrderStatus;
  priority: KDSPriority;
  specialInstructions?: string;
  items: KDSOrderItem[];
}

export interface BulkMealRequirement {
  id: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'HI_TEA' | 'BANQUET';
  title: string;
  scheduledTime: string; // e.g. "07:00 AM - 10:30 AM"
  totalPortions: number;
  confirmedGuestsCount: number;
  inHouseRoomsCount: number;
  status: 'PENDING_PREP' | 'IN_PREPARATION' | 'READY_TO_BUFFET' | 'COMPLETED';
  dishItems: {
    itemId: string;
    name: string;
    portionCount: number;
    bomTemplateId?: string;
    category?: string;
  }[];
}

export interface BOMMaterialRequirement {
  materialId: string;
  materialName: string;
  category: string;
  unitOfMeasure: string;
  qtyPerPerson: number;
  totalRequiredQty: number;
  quantityOnHand: number;
  isShortage: boolean;
  shortageQty: number;
}

export interface BOMCalculationDetail {
  foodItemId: string;
  foodItemName: string;
  portions: number;
  materials: BOMMaterialRequirement[];
  totalRawMaterialsCount: number;
  shortageMaterialsCount: number;
}

export interface ProductionLogEntry {
  id: string;
  batchCode: string;
  date: string;
  time: string;
  itemId: string;
  itemName: string;
  portionsCooked: number;
  loggedByChef: string;
  status: 'STOCK_DEDUCTED' | 'PENDING_SYNC' | 'CANCELLED';
  deductedMaterials: {
    materialId: string;
    materialName: string;
    deductedQty: number;
    unitOfMeasure: string;
  }[];
}

export interface AIPredictedItem {
  itemId: string;
  itemName: string;
  category: string;
  predictedPortions: number;
  trendPercentage: number; // e.g. +24% or -8%
  confidenceScore: number; // e.g. 94%
  peakServingTime: string;
  recommendedPrepWindow: string;
  prepPriority: 'HIGH' | 'MEDIUM' | 'LOW';
  weatherFactor: string;
}

export interface AIDemandForecastData {
  forecastDate: string; // e.g. "Tomorrow, August 27"
  predictedGuestCount: number;
  occupancyRate: number; // e.g. 88%
  occupancyTrend: number; // e.g. +14%
  weatherSummary: {
    temperature: number; // e.g. 31
    condition: 'SUNNY' | 'HOT_HUMID' | 'RAIN' | 'TROPICAL_BREEZE';
    description: string;
    impactNote: string;
  };
  rushHours: {
    timeSlot: string;
    mealSession: string;
    expectedLoad: 'NORMAL' | 'HEAVY' | 'EXTREME_PEAK';
    staffRecommendation: string;
  }[];
  modelInfo: {
    version: string;
    accuracyScore: number;
    lastUpdated: string;
  };
  predictedItems: AIPredictedItem[];
}
