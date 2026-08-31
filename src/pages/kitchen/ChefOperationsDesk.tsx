import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Tag,
  Button,
  Input,
  Select,
  Card,
  Tooltip,
  Spin,
  DatePicker,
  Drawer,
  InputNumber,
  Switch,
} from 'antd';
import {
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Sparkles,
  Utensils,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  Check,
  Calendar,
  Layers,
  ShieldCheck,
  Boxes,
  Send,
  Timer,
  Eye,
  Printer,
  Download,
  Sun,
  CloudRain,
  Cloud,
  Thermometer,
  CalendarDays,
  BookmarkPlus,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import kitchenMutation from '../../mutations/kitchen.mutation';
import mealMutation from '../../mutations/meal.mutation';
import bomMutation from '../../mutations/bom.mutation';
import bomUsageLogMutation from '../../mutations/bomUsageLog.mutation';
import restaurantOrderMutation from '../../mutations/restaurantOrder.mutation';
import { useAuth } from '../../hooks/useAuth';
import { successToast, errorToast } from '../../components/common/Alert';
import type {
  RawMaterial,
  BOMTemplate,
  CalculatedOrderBOMFoodItem,
  CalculateOrderBOMDTO,
  BatchBOMUsageLogRequestDTO,
  UsedBOMItemDTO,
} from '../../types/kitchen.interfaces';
import type { FoodItem } from '../../types/services.interfaces';
import type {
  KDSOrderTicket,
  KDSOrderStatus,
  BulkMealRequirement,
  BOMCalculationDetail,
  ProductionLogEntry,
  AIPredictedItem,
} from '../../types/chefPortal.interfaces';

dayjs.extend(relativeTime);

const { Option } = Select;

// =========================================================================
// INITIAL SEED DATA FOR BULK REQUIREMENTS, LOGS, & AI FORECAST
// =========================================================================

const INITIAL_BULK_REQUIREMENTS: BulkMealRequirement[] = [
  {
    id: 'BULK-001',
    mealType: 'BREAKFAST',
    title: 'Sunrise International Buffet',
    scheduledTime: '07:00 AM - 10:30 AM',
    totalPortions: 55,
    confirmedGuestsCount: 52,
    inHouseRoomsCount: 28,
    status: 'IN_PREPARATION',
    dishItems: [
      {
        itemId: 'F-001',
        name: 'Sri Lankan String Hoppers with Kiri Hodi',
        portionCount: 55,
        category: 'Traditional',
      },
      {
        itemId: 'F-002',
        name: 'Scrambled Farm Eggs & Sausages',
        portionCount: 50,
        category: 'Continental',
      },
      {
        itemId: 'F-003',
        name: 'Tropical Fresh Fruit Platter',
        portionCount: 55,
        category: 'Fruits',
      },
      {
        itemId: 'F-004',
        name: 'Freshly Brewed Ceylon Milk Tea',
        portionCount: 60,
        category: 'Beverages',
      },
    ],
  },
  {
    id: 'BULK-002',
    mealType: 'LUNCH',
    title: 'Lagoon Seafood & Rice Feast',
    scheduledTime: '12:30 PM - 03:00 PM',
    totalPortions: 80,
    confirmedGuestsCount: 78,
    inHouseRoomsCount: 36,
    status: 'PENDING_PREP',
    dishItems: [
      {
        itemId: 'F-005',
        name: 'Devilled Lagoon Prawns with Fried Rice',
        portionCount: 80,
        category: 'Seafood',
      },
      {
        itemId: 'F-006',
        name: 'Spicy Chicken Curry with Basmati',
        portionCount: 75,
        category: 'Main Dish',
      },
      {
        itemId: 'F-007',
        name: 'Dhal Curry in Coconut Milk',
        portionCount: 80,
        category: 'Curry',
      },
    ],
  },
  {
    id: 'BULK-003',
    mealType: 'DINNER',
    title: 'Executive Grand BBQ & Buffet',
    scheduledTime: '07:30 PM - 10:30 PM',
    totalPortions: 120,
    confirmedGuestsCount: 115,
    inHouseRoomsCount: 48,
    status: 'PENDING_PREP',
    dishItems: [
      {
        itemId: 'F-008',
        name: 'Grilled Herb Butter Reef Fish',
        portionCount: 90,
        category: 'Grill',
      },
      {
        itemId: 'F-009',
        name: 'Barbecue Spiced Pork Ribs & Chicken',
        portionCount: 110,
        category: 'Grill',
      },
      {
        itemId: 'F-010',
        name: 'Garlic Butter Naan & Steamed Rice',
        portionCount: 120,
        category: 'Sides',
      },
    ],
  },
];

export interface SavedDemandRecord {
  id: string;
  date: string;
  weatherCondition: 'Clear' | 'Rainy' | 'Cloudy';
  temperature: number;
  isHoliday: string;
  dayDetails: string;
  demandedCount: number;
  modelAccuracy: number;
}

const DEFAULT_MENU_ITEMS = [
  { itemId: 'F-001', name: 'Sri Lankan String Hoppers with Kiri Hodi', category: 'Breakfast', unitPrice: 850 },
  { itemId: 'F-002', name: 'Scrambled Farm Eggs & Sausages', category: 'Continental', unitPrice: 1200 },
  { itemId: 'F-003', name: 'Tropical Fresh Fruit Platter', category: 'Fruits', unitPrice: 650 },
  { itemId: 'F-004', name: 'Freshly Brewed Ceylon Milk Tea', category: 'Beverages', unitPrice: 350 },
  { itemId: 'F-005', name: 'Devilled Lagoon Prawns with Fried Rice', category: 'Seafood', unitPrice: 2400 },
  { itemId: 'F-006', name: 'Spicy Chicken Curry with Basmati', category: 'Main Dish', unitPrice: 1850 },
  { itemId: 'F-007', name: 'Dhal Curry in Coconut Milk', category: 'Curry', unitPrice: 650 },
  { itemId: 'F-008', name: 'Grilled Herb Butter Reef Fish', category: 'Grill', unitPrice: 2800 },
  { itemId: 'F-009', name: 'Barbecue Spiced Pork Ribs & Chicken', category: 'Grill', unitPrice: 3200 },
  { itemId: 'F-010', name: 'Garlic Butter Naan & Steamed Rice', category: 'Sides', unitPrice: 750 },
];

const INITIAL_SAVED_DEMANDS: SavedDemandRecord[] = [
  {
    id: 'DEM-001',
    date: '2026-08-28',
    weatherCondition: 'Clear',
    temperature: 31,
    isHoliday: 'No (Regular Day)',
    dayDetails: 'Friday • Weekday',
    demandedCount: 128,
    modelAccuracy: 96.4,
  },
  {
    id: 'DEM-002',
    date: '2026-08-27',
    weatherCondition: 'Cloudy',
    temperature: 29,
    isHoliday: 'No (Regular Day)',
    dayDetails: 'Thursday • Weekday',
    demandedCount: 114,
    modelAccuracy: 95.8,
  },
  {
    id: 'DEM-003',
    date: '2026-08-24',
    weatherCondition: 'Clear',
    temperature: 32,
    isHoliday: 'Yes - Poson Poya Holiday',
    dayDetails: 'Monday • Public Holiday',
    demandedCount: 165,
    modelAccuracy: 98.1,
  },
  {
    id: 'DEM-004',
    date: '2026-08-23',
    weatherCondition: 'Rainy',
    temperature: 27,
    isHoliday: 'No (Regular Day)',
    dayDetails: 'Sunday • Weekend',
    demandedCount: 138,
    modelAccuracy: 94.2,
  },
  {
    id: 'DEM-005',
    date: '2026-08-22',
    weatherCondition: 'Clear',
    temperature: 33,
    isHoliday: 'No (Regular Day)',
    dayDetails: 'Saturday • Weekend',
    demandedCount: 152,
    modelAccuracy: 97.0,
  },
];

const getForecastForDate = (targetDate: dayjs.Dayjs) => {
  const dayOfWeek = targetDate.format('dddd');
  const isWeekend = targetDate.day() === 0 || targetDate.day() === 6;
  const dayType = isWeekend ? 'Weekend' : 'Weekday';
  const dayDetails = `${dayOfWeek} • ${dayType}`;

  // Deterministic seed based on day + month
  const dayOfYear = targetDate.month() * 31 + targetDate.date();

  // Weather condition
  const weatherOptions: Array<'Clear' | 'Rainy' | 'Cloudy'> = [
    'Clear',
    'Rainy',
    'Cloudy',
    'Clear',
    'Clear',
  ];
  const weatherCondition = weatherOptions[Math.abs(dayOfYear) % weatherOptions.length];

  // Temperature (27°C - 33°C)
  const temperature = 28 + (Math.abs(dayOfYear * 7) % 6);

  // Holiday detection
  const month = targetDate.month() + 1; // 1-12
  const day = targetDate.date();

  let isHoliday = 'No (Regular Day)';
  if (month === 1 && day === 1) isHoliday = 'Yes - New Year Day';
  else if (month === 2 && day === 4) isHoliday = 'Yes - National Independence Day';
  else if (month === 4 && (day === 13 || day === 14))
    isHoliday = 'Yes - Sinhala & Tamil New Year';
  else if (month === 5 && (day === 15 || day === 23))
    isHoliday = 'Yes - Vesak Full Moon Poya';
  else if (month === 6 && day === 21) isHoliday = 'Yes - Poson Full Moon Poya';
  else if (month === 8 && day === 19) isHoliday = 'Yes - Nikini Full Moon Poya';
  else if (month === 8 && day === 28) isHoliday = 'Yes - Resort Gala Banquet Day';
  else if (month === 12 && day === 25) isHoliday = 'Yes - Christmas Day';
  else if (day === 15 || day === 28) isHoliday = 'Yes - Public Poya Holiday';

  // Base Demand calculation
  let baseDemand = 80;
  if (isWeekend) baseDemand += 35;
  if (isHoliday.startsWith('Yes')) baseDemand += 42;
  if (weatherCondition === 'Clear') baseDemand += 15;
  else if (weatherCondition === 'Cloudy') baseDemand += 8;
  else if (weatherCondition === 'Rainy') baseDemand -= 6;

  const demandingCount = baseDemand + (Math.abs(dayOfYear * 3) % 18);

  return {
    dateStr: targetDate.format('YYYY-MM-DD'),
    formattedDate: targetDate.format('DD MMM YYYY'),
    weatherCondition,
    temperature,
    isHoliday,
    dayDetails,
    dayOfWeek,
    dayType,
    demandingCount,
    confidenceScore: 94 + (Math.abs(dayOfYear) % 6),
  };
};

const INITIAL_A_LA_CARTE_TICKETS: KDSOrderTicket[] = [
  {
    id: 'KDS-101',
    orderNumber: '#ORD-2041',
    orderSource: 'WALK_IN',
    tableOrRoom: 'Table #04 (Garden Terrace)',
    guestName: 'Mr. David Miller',
    serverName: 'Waiter Roshan',
    createdAt: dayjs().subtract(4, 'minute').toISOString(),
    status: 'PENDING',
    priority: 'URGENT',
    specialInstructions: 'Make it extra spicy. No coriander.',
    items: [
      {
        itemId: 'F-005',
        name: 'Devilled Lagoon Prawns with Fried Rice',
        quantity: 2,
        isKitchenPrepared: true,
      },
      {
        itemId: 'F-004',
        name: 'Freshly Brewed Ceylon Milk Tea',
        quantity: 2,
        isKitchenPrepared: false,
      },
    ],
  },
  {
    id: 'KDS-102',
    orderNumber: '#ORD-2042',
    orderSource: 'ROOM_SERVICE',
    tableOrRoom: 'Villa 108 (Ocean Front)',
    guestName: 'Mrs. Sarah Jenkins',
    serverName: 'In-Room Dining Asanka',
    createdAt: dayjs().subtract(14, 'minute').toISOString(),
    startedCookingAt: dayjs().subtract(8, 'minute').toISOString(),
    status: 'PREPARING',
    priority: 'VIP',
    specialInstructions: 'VIP Guest. Separate chili paste on side.',
    items: [
      {
        itemId: 'F-008',
        name: 'Grilled Herb Butter Reef Fish',
        quantity: 2,
        isKitchenPrepared: true,
      },
      {
        itemId: 'F-007',
        name: 'Dhal Curry in Coconut Milk',
        quantity: 1,
        isKitchenPrepared: true,
      },
      {
        itemId: 'F-010',
        name: 'Garlic Butter Naan',
        quantity: 3,
        isKitchenPrepared: true,
      },
    ],
  },
  {
    id: 'KDS-103',
    orderNumber: '#ORD-2043',
    orderSource: 'TABLE_DINE_IN',
    tableOrRoom: 'Table #12 (Main Hall)',
    guestName: 'Fernando Family (4 Pax)',
    serverName: 'Steward Kasun',
    createdAt: dayjs().subtract(22, 'minute').toISOString(),
    startedCookingAt: dayjs().subtract(15, 'minute').toISOString(),
    readyAt: dayjs().subtract(2, 'minute').toISOString(),
    status: 'READY',
    priority: 'NORMAL',
    specialInstructions: 'Serve hot immediately.',
    items: [
      {
        itemId: 'F-001',
        name: 'Sri Lankan String Hoppers Feast',
        quantity: 4,
        isKitchenPrepared: true,
      },
      {
        itemId: 'F-006',
        name: 'Spicy Chicken Curry with Basmati',
        quantity: 2,
        isKitchenPrepared: true,
      },
    ],
  },
  {
    id: 'KDS-104',
    orderNumber: '#ORD-2044',
    orderSource: 'POOL_BAR',
    tableOrRoom: 'Pool Cabana #03',
    guestName: 'Alex & Elena',
    serverName: 'Barman Suresh',
    createdAt: dayjs().subtract(2, 'minute').toISOString(),
    status: 'PENDING',
    priority: 'NORMAL',
    specialInstructions: 'Quick prep requested.',
    items: [
      {
        itemId: 'F-005',
        name: 'Devilled Lagoon Prawns with Fried Rice',
        quantity: 1,
        isKitchenPrepared: true,
      },
      {
        itemId: 'F-002',
        name: 'Scrambled Farm Eggs & Sausages',
        quantity: 1,
        isKitchenPrepared: true,
      },
    ],
  },
];

const ChefOperationsDesk: React.FC = () => {
  const { userData } = useAuth();

  // -------------------------------------------------------------------------
  // TOP NAVIGATION TABS
  // -------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<
    'LIVE_KDS' | 'PRODUCTION_LOG' | 'AI_FORECASTING'
  >('LIVE_KDS');

  // TAB 1 SUB-TAB: A La Carte vs Reservation Bulk Meals
  const [kdsSubTab, setKdsSubTab] = useState<'A_LA_CARTE' | 'BULK_MEALS'>('A_LA_CARTE');

  // Tablet UI Utilities
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // REACT QUERY DATA INTEGRATION
  // -------------------------------------------------------------------------
  const { getAllRawMaterialsQuery } = kitchenMutation();
  const { getAllFoodItemsMutation } = mealMutation();
  const { getAllBOMTemplatesQuery, calculateOrderBOMMutation } = bomMutation();
  const {
    logBOMUsageMutation,
    getAllBOMUsageLogsQuery,
    getBOMUsageLogsByTemplateIdQuery,
  } = bomUsageLogMutation();
  const { getAllRestaurantOrdersQuery, updateRestaurantOrderStatusMutation } =
    restaurantOrderMutation();

  const { data: rawMaterialsRes } = getAllRawMaterialsQuery();
  const { data: foodItemsRes } = getAllFoodItemsMutation();
  const { data: bomTemplatesRes } = getAllBOMTemplatesQuery();
  const { mutateAsync: calculateOrderBOMApi } = calculateOrderBOMMutation();
  const { mutateAsync: logBOMUsageApi } = logBOMUsageMutation();

  // State for Tab 2 BOM filter
  const [selectedBOMFilter, setSelectedBOMFilter] = useState<string>('ALL');

  // React Query: Fetch All BOM Usage Logs
  const {
    data: allBOMUsageLogsRes,
    refetch: refetchAllBOMUsageLogs,
    isFetching: isFetchingAllLogs,
  } = getAllBOMUsageLogsQuery();

  // React Query: Fetch BOM Usage Logs by Template ID (when template filter selected)
  const {
    data: templateBOMUsageLogsRes,
    refetch: refetchTemplateLogs,
    isFetching: isFetchingTemplateLogs,
  } = getBOMUsageLogsByTemplateIdQuery(
    selectedBOMFilter,
    selectedBOMFilter !== 'ALL',
  );

  const isFetchingBOMUsageLogs = isFetchingAllLogs || isFetchingTemplateLogs;

  const handleRefetchBOMUsageLogs = () => {
    if (selectedBOMFilter === 'ALL') {
      refetchAllBOMUsageLogs();
    } else {
      refetchTemplateLogs();
    }
  };

  const { data: ordersRes, refetch: refetchOrders } = getAllRestaurantOrdersQuery({
    isKitchenPrepared: true,
  });
  const { mutateAsync: updateStatus } = updateRestaurantOrderStatusMutation();

  const rawMaterialsList: RawMaterial[] = useMemo(
    () => rawMaterialsRes?.data || [],
    [rawMaterialsRes],
  );
  const foodItemsList: FoodItem[] = useMemo(
    () => foodItemsRes?.data || [],
    [foodItemsRes],
  );
  const bomTemplatesList: BOMTemplate[] = useMemo(
    () => bomTemplatesRes?.data || [],
    [bomTemplatesRes],
  );

  // -------------------------------------------------------------------------
  // TAB 1: KDS ORDERS STATE & TICKERS
  // -------------------------------------------------------------------------
  const [kdsTickets, setKdsTickets] = useState<KDSOrderTicket[]>(
    INITIAL_A_LA_CARTE_TICKETS,
  );
  const [bulkRequirements] = useState<BulkMealRequirement[]>(INITIAL_BULK_REQUIREMENTS);
  const [selectedKdsTicket, setSelectedKdsTicket] = useState<KDSOrderTicket | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Sync real-time clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Merge & sync external restaurant orders into KDS tickets if available
  useEffect(() => {
    if (ordersRes?.data && Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
      // Filter to only include orders containing kitchen-prepared food items
      const kitchenOrders = ordersRes.data.filter((ord: any) => {
        const orderDetails = ord.orderDetails || ord.restaurantOrderDetails || [];
        if (orderDetails.length === 0) return true;
        return orderDetails.some((od: any) => {
          const food = foodItemsList.find(
            (f: FoodItem) => f.itemId === od.itemId || (f as any).id === od.itemId,
          );
          if (food) {
            return food.isKitchenPrepared ?? (food as any).is_kitchen_prepared ?? true;
          }
          return od.foodItem?.isKitchenPrepared ?? true;
        });
      });

      const mappedOrders: KDSOrderTicket[] = kitchenOrders.map((ord: any) => {
        let mappedStatus: KDSOrderStatus = 'PENDING';
        const s = (ord.status || 'PENDING').toUpperCase();
        if (s === 'PREPARING') mappedStatus = 'PREPARING';
        else if (s === 'SERVED') mappedStatus = 'READY';
        else if (s === 'COMPLETED' || s === 'CANCELLED') mappedStatus = 'SERVED';

        const orderDetails = ord.orderDetails || ord.restaurantOrderDetails || [];
        const items = orderDetails.map((od: any) => {
          const food: any = foodItemsList.find(
            (f: FoodItem) => f.itemId === od.itemId || (f as any).id === od.itemId,
          );
          return {
            itemId: od.itemId || food?.itemId || 'F-ITEM',
            name: food?.name || od.itemName || od.foodItem?.name || 'Menu Dish',
            quantity: Number(od.orderedQty) || 1,
            category: food?.category || 'Main Dish',
            unitPrice: Number(food?.unitPrice) || Number(od.unitPrice) || 0,
            isKitchenPrepared:
              food?.isKitchenPrepared ?? od.foodItem?.isKitchenPrepared ?? true,
          };
        });

        const totalPax = items.reduce(
          (sum: number, it: any) => sum + (it.quantity || 1),
          0,
        );

        return {
          id: ord.orderId,
          orderNumber: `#ORD-${String(ord.orderId).slice(-6).toUpperCase()}`,
          orderSource: ord.guestId ? 'TABLE_DINE_IN' : 'WALK_IN',
          tableOrRoom:
            ord.guest?.name || ord.guestName
              ? `Guest: ${ord.guest?.name || ord.guestName}`
              : 'Dine-In Walk-in',
          guestName:
            ord.guest?.name ||
            ord.guestName ||
            (ord.guestId ? 'Registered Guest' : 'Walk-in Guest'),
          guestPhone: ord.guest?.phone,
          serverName: ord.handledByUser?.name || 'Staff Server',
          serverRole: ord.handledByUser?.role || 'Staff',
          createdAt: ord.orderTime || new Date().toISOString(),
          status: mappedStatus,
          priority: s === 'PREPARING' ? 'URGENT' : 'NORMAL',
          specialInstructions: 'Prepared fresh as per guest order.',
          totalAmount: ord.totalAmount || (ord as any).total_amount || 0,
          totalPax,
          items:
            items.length > 0
              ? items
              : [
                  {
                    itemId: '1',
                    name: 'Kitchen Order Dish',
                    quantity: 1,
                    isKitchenPrepared: true,
                  },
                ],
        };
      });

      setKdsTickets(mappedOrders);
    }
  }, [ordersRes, foodItemsList]);

  // Handle KDS Ticket Status Advance (Local State & Backend API Sync)
  const handleAdvanceKdsStatus = async (ticketId: string, nextStatus: KDSOrderStatus) => {
    setKdsTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updated = { ...t, status: nextStatus };
          if (nextStatus === 'PREPARING')
            updated.startedCookingAt = new Date().toISOString();
          if (nextStatus === 'READY') updated.readyAt = new Date().toISOString();
          return updated;
        }
        return t;
      }),
    );

    if (selectedKdsTicket && selectedKdsTicket.id === ticketId) {
      setSelectedKdsTicket((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    let backendStatus = 'PENDING';
    if (nextStatus === 'PREPARING') backendStatus = 'PREPARING';
    else if (nextStatus === 'READY') backendStatus = 'SERVED';
    else if (nextStatus === 'SERVED') backendStatus = 'COMPLETED';

    try {
      await updateStatus({ orderId: ticketId, status: backendStatus });
      refetchOrders?.();
    } catch (e) {
      console.error('Failed to update status on backend:', e);
    }

    if (nextStatus === 'PREPARING') {
      successToast(`Order #${ticketId.slice(-6).toUpperCase()} started cooking!`);
    } else if (nextStatus === 'READY') {
      successToast(
        `Order #${ticketId.slice(-6).toUpperCase()} is plated and ready for serving!`,
      );
    } else if (nextStatus === 'SERVED') {
      successToast(`Order #${ticketId.slice(-6).toUpperCase()} dispatched to guest.`);
    }
  };

  const pendingTickets = useMemo(
    () => kdsTickets.filter((t) => t.status === 'PENDING'),
    [kdsTickets],
  );
  const preparingTickets = useMemo(
    () => kdsTickets.filter((t) => t.status === 'PREPARING'),
    [kdsTickets],
  );
  const readyTickets = useMemo(
    () => kdsTickets.filter((t) => t.status === 'READY'),
    [kdsTickets],
  );

  // -------------------------------------------------------------------------
  // TAB 1 (BULK MEALS & KDS): BOM CALCULATION MODAL
  // -------------------------------------------------------------------------
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [orderBOMResults, setOrderBOMResults] = useState<CalculatedOrderBOMFoodItem[]>([]);
  const [isCalculatingOrderBOM, setIsCalculatingOrderBOM] = useState(false);
  const [selectedBulkItem, setSelectedBulkItem] = useState<{
    dishName: string;
    portionCount: number;
    mealSession: string;
    itemId?: string;
    orderTicketId?: string;
    orderNumber?: string;
    items?: { itemId?: string; name: string; quantity: number }[];
  } | null>(null);

  // Fetch and Calculate BOM from Backend API for Order
  const fetchAndCalculateOrderBOM = async (ticket: KDSOrderTicket) => {
    setSelectedBulkItem({
      dishName:
        ticket.items.length === 1
          ? ticket.items[0].name
          : `Order ${ticket.orderNumber} (${ticket.items.length} Dishes)`,
      portionCount: ticket.items.reduce((s, i) => s + (i.quantity || 1), 0),
      mealSession: 'A_LA_CARTE',
      itemId: ticket.items[0]?.itemId,
      orderTicketId: ticket.id,
      orderNumber: ticket.orderNumber,
      items: ticket.items,
    });
    setIsOrderModalOpen(false);
    setBomModalOpen(true);
    setIsCalculatingOrderBOM(true);
    setOrderBOMResults([]);

    try {
      const payload: CalculateOrderBOMDTO = {
        orderId: ticket.id,
        orderDetails: ticket.items.map((it) => ({
          itemId: it.itemId,
          orderedQty: it.quantity || 1,
        })),
      };
      const res: any = await calculateOrderBOMApi(payload);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setOrderBOMResults(res.data);
      } else {
        // Fallback calculation per item if API response is empty
        const fallbackResults: CalculatedOrderBOMFoodItem[] = ticket.items.map((it) => {
          const itemQty = it.quantity || 1;
          const breakdown = calculateBOMBreakdown(it.name, itemQty, it.itemId);
          return {
            ItemId: it.itemId,
            itemId: it.itemId,
            itemName: it.name,
            required_quantity: itemQty,
            rawMaterialDetails: breakdown.materials.map((m) => ({
              materialId: m.materialId,
              materialName: m.materialName,
              category: m.category,
              unitOfMeasure: m.unitOfMeasure,
              qtyPerPerson: m.qtyPerPerson,
              orderedQty: itemQty,
              totalRequiredQty: m.totalRequiredQty,
              quantityOnHand: m.quantityOnHand,
              status: m.isShortage ? 'Shortage' : 'In Stock',
              isShortage: m.isShortage,
              shortageQty: m.shortageQty,
            })),
          };
        });
        setOrderBOMResults(fallbackResults);
      }
    } catch (err) {
      console.error('Failed to calculate BOM via backend API:', err);
      // Fallback calculation per item
      const fallbackResults: CalculatedOrderBOMFoodItem[] = ticket.items.map((it) => {
        const itemQty = it.quantity || 1;
        const breakdown = calculateBOMBreakdown(it.name, itemQty, it.itemId);
        return {
          ItemId: it.itemId,
          itemId: it.itemId,
          itemName: it.name,
          required_quantity: itemQty,
          rawMaterialDetails: breakdown.materials.map((m) => ({
            materialId: m.materialId,
            materialName: m.materialName,
            category: m.category,
            unitOfMeasure: m.unitOfMeasure,
            qtyPerPerson: m.qtyPerPerson,
            orderedQty: itemQty,
            totalRequiredQty: m.totalRequiredQty,
            quantityOnHand: m.quantityOnHand,
            status: m.isShortage ? 'Shortage' : 'In Stock',
            isShortage: m.isShortage,
            shortageQty: m.shortageQty,
          })),
        };
      });
      setOrderBOMResults(fallbackResults);
    } finally {
      setIsCalculatingOrderBOM(false);
    }
  };

  const orderBOMSummary = useMemo(() => {
    if (!orderBOMResults || orderBOMResults.length === 0) return null;

    let totalPortions = 0;
    let totalRawMaterialsCount = 0;
    let totalShortagesCount = 0;

    orderBOMResults.forEach((dish) => {
      totalPortions += dish.required_quantity || 0;
      if (dish.rawMaterialDetails) {
        totalRawMaterialsCount += dish.rawMaterialDetails.length;
        totalShortagesCount += dish.rawMaterialDetails.filter((r) => r.isShortage).length;
      }
    });

    return {
      totalPortions,
      totalDishes: orderBOMResults.length,
      totalRawMaterialsCount,
      totalShortagesCount,
    };
  }, [orderBOMResults]);

  // -------------------------------------------------------------------------
  // PRINT & DOWNLOAD PDF HELPERS FOR BOM CALCULATION
  // -------------------------------------------------------------------------
  const [isDownloadingBOMPDF, setIsDownloadingBOMPDF] = useState(false);

  const handlePrintBOMDetails = (elementId: string) => {
    const content = document.getElementById(elementId);
    if (!content) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BOM Recipe Breakdown - ${selectedBulkItem?.orderNumber || selectedBulkItem?.dishName || 'Kitchen'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm 10mm;
              }
              body {
                margin: 0;
                padding: 10px;
                background: #ffffff !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #000000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body class="p-6 bg-white flex flex-col items-center">
          <div class="w-full max-w-3xl">
            <!-- Header -->
            <div class="border-b-2 border-slate-800 pb-4 mb-5 flex justify-between items-start">
              <div>
                <h1 class="text-2xl font-black tracking-tight text-[#092968]">DSD RESORT & SPA</h1>
                <p class="text-xs font-bold uppercase tracking-wider text-[#F26E22]">Kitchen Operations & BOM Production Slip</p>
                <p class="text-xs text-slate-500 mt-1">Generated on: ${dayjs().format('DD MMM YYYY, hh:mm A')}</p>
              </div>
              <div class="text-right">
                <span class="inline-block bg-[#092968] text-white text-xs font-extrabold px-3 py-1 rounded-md">
                  ${selectedBulkItem?.orderNumber ? `ORDER ${selectedBulkItem.orderNumber}` : 'BULK PREP'}
                </span>
                <p class="text-xs font-bold text-slate-700 mt-1">
                  ${selectedKdsTicket?.guestName || 'Dine-In Guest'}
                </p>
                <p class="text-[11px] text-slate-500">
                  Server: ${selectedKdsTicket?.serverName || 'Kitchen Staff'}
                </p>
              </div>
            </div>

            ${content.outerHTML}

            <!-- Footer Signatures -->
            <div class="mt-8 pt-4 border-t border-dashed border-slate-300 grid grid-cols-2 text-xs text-slate-600">
              <div>
                <p class="font-bold">Executive Chef / Head Cook:</p>
                <div class="mt-8 border-b border-slate-400 w-48"></div>
              </div>
              <div class="text-right">
                <p class="font-bold">Pantry / Inventory Storekeeper:</p>
                <div class="mt-8 border-b border-slate-400 w-48 ml-auto"></div>
              </div>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadBOMPDF = async (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      errorToast('BOM Details content not found for PDF export.');
      return;
    }

    setIsDownloadingBOMPDF(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const filename = `BOM_Calculation_${selectedBulkItem?.orderNumber || 'Report'}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
      pdf.save(filename);
      successToast('BOM Calculation PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      errorToast('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingBOMPDF(false);
    }
  };

  // -------------------------------------------------------------------------
  // CONFIRM BOM AND START COOKING (LOG BOM TO DATABASE & ADVANCE ORDER)
  // -------------------------------------------------------------------------
  const [isLoggingBOMAndStarting, setIsLoggingBOMAndStarting] = useState(false);

  const handleConfirmBOMAndStartCooking = async () => {
    if (!selectedBulkItem?.orderTicketId) return;

    const orderId = selectedBulkItem.orderTicketId;
    const currentChefId =
      (userData as any)?.userId ||
      (userData as any)?.adminId ||
      (userData as any)?.id ||
      'c0a80123-8bc5-47e2-a3b8-465cbb6d5bc5';

    setIsLoggingBOMAndStarting(true);

    try {
      // 1. Prepare Used_BOMs array mapping each dish to its matching templateId & portions
      let usedBoms: UsedBOMItemDTO[] = [];

      if (orderBOMResults && orderBOMResults.length > 0) {
        usedBoms = orderBOMResults.map((dish) => {
          const targetItemId = dish.ItemId || dish.itemId;
          const matchedTemplate = bomTemplatesList.find(
            (b) =>
              (targetItemId &&
                (b.itemId === targetItemId ||
                  (b as any).id === targetItemId ||
                  (b as any).templateId === targetItemId)) ||
              b.templateName.toLowerCase().includes(dish.itemName.toLowerCase()) ||
              b.foodItem?.name?.toLowerCase().includes(dish.itemName.toLowerCase()),
          );
          return {
            templateId:
              matchedTemplate?.templateId ||
              matchedTemplate?.id ||
              targetItemId ||
              '00000000-0000-0000-0000-000000000000',
            portionsCooked: Number(dish.required_quantity) || 1,
          };
        });
      } else if (selectedBulkItem.items && selectedBulkItem.items.length > 0) {
        usedBoms = selectedBulkItem.items.map((it) => {
          const matchedTemplate = bomTemplatesList.find(
            (b) =>
              (it.itemId &&
                (b.itemId === it.itemId ||
                  (b as any).id === it.itemId ||
                  (b as any).templateId === it.itemId)) ||
              b.templateName.toLowerCase().includes(it.name.toLowerCase()) ||
              b.foodItem?.name?.toLowerCase().includes(it.name.toLowerCase()),
          );
          return {
            templateId:
              matchedTemplate?.templateId ||
              matchedTemplate?.id ||
              it.itemId ||
              '00000000-0000-0000-0000-000000000000',
            portionsCooked: Number(it.quantity) || 1,
          };
        });
      }

      // 2. Post BOM usage log to backend database
      if (usedBoms.length > 0) {
        const logPayload: BatchBOMUsageLogRequestDTO = {
          cookedBy: currentChefId,
          Used_BOMs: usedBoms,
        };
        await logBOMUsageApi(logPayload);
      }

      // 3. Advance KDS Order Status to PREPARING
      await handleAdvanceKdsStatus(orderId, 'PREPARING');
    } catch (err) {
      console.error('Error during BOM usage logging:', err);
      // Fallback advancing status if logging failed
      await handleAdvanceKdsStatus(orderId, 'PREPARING');
    } finally {
      setIsLoggingBOMAndStarting(false);
      setBomModalOpen(false);
      setSelectedBulkItem(null);
      setOrderBOMResults([]);
    }
  };

  const calculateBOMBreakdown = (
    dishName: string,
    portions: number,
    targetItemId?: string,
  ): BOMCalculationDetail => {
    // Find matched BOM Template if exists
    const matchedTemplate = bomTemplatesList.find(
      (b) =>
        (targetItemId && (b.itemId === targetItemId || (b as any).id === targetItemId)) ||
        b.templateName.toLowerCase().includes(dishName.toLowerCase()) ||
        b.foodItem?.name?.toLowerCase().includes(dishName.toLowerCase()),
    );

    let materialsBreakdown = [];

    if (matchedTemplate && (matchedTemplate.items || matchedTemplate.templateItems)) {
      const templateItems = matchedTemplate.items || matchedTemplate.templateItems || [];
      materialsBreakdown = templateItems.map((ing: any) => {
        const raw = rawMaterialsList.find(
          (r) =>
            r.materialId === ing.materialId || (r as any).material_id === ing.materialId,
        );
        const qtyPerPerson = ing.qtyPerPerson || 0.15;
        const totalRequired = Number((qtyPerPerson * portions).toFixed(2));
        const onHand = raw
          ? (raw.quantityOnHand ?? (raw as any).quantity_on_hand ?? 0)
          : 25;
        const isShortage = totalRequired > onHand;
        const shortageQty = isShortage ? Number((totalRequired - onHand).toFixed(2)) : 0;

        return {
          materialId: ing.materialId,
          materialName:
            raw?.materialName ||
            (raw as any)?.material_name ||
            ing.materialName ||
            'Raw Ingredient',
          category: raw?.category || 'General',
          unitOfMeasure:
            raw?.unitOfMeasure ||
            (raw as any)?.unit_of_measure ||
            ing.unitOfMeasure ||
            'kg',
          qtyPerPerson,
          totalRequiredQty: totalRequired,
          quantityOnHand: onHand,
          isShortage,
          shortageQty,
        };
      });
    } else {
      // Dynamic fallback based on dish type
      const isSeafood =
        dishName.toLowerCase().includes('prawn') ||
        dishName.toLowerCase().includes('fish') ||
        dishName.toLowerCase().includes('seafood');
      const isChicken =
        dishName.toLowerCase().includes('chicken') ||
        dishName.toLowerCase().includes('bbq') ||
        dishName.toLowerCase().includes('meat');

      if (isSeafood) {
        materialsBreakdown = [
          {
            materialId: 'RM-SEA-01',
            materialName: 'Lagoon Fresh Jumbo Prawns / Fish Fillet',
            category: 'SEAFOOD',
            unitOfMeasure: 'kg',
            qtyPerPerson: 0.22,
            totalRequiredQty: Number((0.22 * portions).toFixed(2)),
            quantityOnHand: 22.5,
            isShortage: 0.22 * portions > 22.5,
            shortageQty:
              0.22 * portions > 22.5 ? Number((0.22 * portions - 22.5).toFixed(2)) : 0,
          },
          {
            materialId: 'RM-GRN-01',
            materialName: 'Basmati Rice Premium (Grain)',
            category: 'GRAINS',
            unitOfMeasure: 'kg',
            qtyPerPerson: 0.12,
            totalRequiredQty: Number((0.12 * portions).toFixed(2)),
            quantityOnHand: 65.0,
            isShortage: false,
            shortageQty: 0,
          },
          {
            materialId: 'RM-OIL-01',
            materialName: 'Sunflower Cooking Oil & Butter',
            category: 'OILS_CONDIMENTS',
            unitOfMeasure: 'l',
            qtyPerPerson: 0.03,
            totalRequiredQty: Number((0.03 * portions).toFixed(2)),
            quantityOnHand: 40.0,
            isShortage: false,
            shortageQty: 0,
          },
          {
            materialId: 'RM-SP-01',
            materialName: 'Devilled Sauces & Sri Lankan Spices',
            category: 'SPICES_HERBS',
            unitOfMeasure: 'kg',
            qtyPerPerson: 0.04,
            totalRequiredQty: Number((0.04 * portions).toFixed(2)),
            quantityOnHand: 12.0,
            isShortage: 0.04 * portions > 12.0,
            shortageQty:
              0.04 * portions > 12.0 ? Number((0.04 * portions - 12.0).toFixed(2)) : 0,
          },
        ];
      } else if (isChicken) {
        materialsBreakdown = [
          {
            materialId: 'RM-MT-01',
            materialName: 'Fresh Chicken Cuts (Bone-in/Boneless)',
            category: 'MEAT_POULTRY',
            unitOfMeasure: 'kg',
            qtyPerPerson: 0.25,
            totalRequiredQty: Number((0.25 * portions).toFixed(2)),
            quantityOnHand: 28.0,
            isShortage: 0.25 * portions > 28.0,
            shortageQty:
              0.25 * portions > 28.0 ? Number((0.25 * portions - 28.0).toFixed(2)) : 0,
          },
          {
            materialId: 'RM-DAIRY-01',
            materialName: 'Thick Coconut Milk & Curd',
            category: 'DAIRY_EGGS',
            unitOfMeasure: 'l',
            qtyPerPerson: 0.08,
            totalRequiredQty: Number((0.08 * portions).toFixed(2)),
            quantityOnHand: 35.0,
            isShortage: false,
            shortageQty: 0,
          },
          {
            materialId: 'RM-VEG-01',
            materialName: 'Fresh Onions, Garlic, Ginger & Curry Leaves',
            category: 'VEGETABLES',
            unitOfMeasure: 'kg',
            qtyPerPerson: 0.06,
            totalRequiredQty: Number((0.06 * portions).toFixed(2)),
            quantityOnHand: 18.0,
            isShortage: false,
            shortageQty: 0,
          },
        ];
      } else {
        materialsBreakdown = [
          {
            materialId: 'RM-FLR-01',
            materialName: 'Pure White Rice Flour',
            category: 'GRAINS',
            unitOfMeasure: 'kg',
            qtyPerPerson: 0.1,
            totalRequiredQty: Number((0.1 * portions).toFixed(2)),
            quantityOnHand: 45.0,
            isShortage: false,
            shortageQty: 0,
          },
          {
            materialId: 'RM-COC-01',
            materialName: 'Fresh Grated Coconut / Milk',
            category: 'VEGETABLES',
            unitOfMeasure: 'kg',
            qtyPerPerson: 0.07,
            totalRequiredQty: Number((0.07 * portions).toFixed(2)),
            quantityOnHand: 15.0,
            isShortage: 0.07 * portions > 15.0,
            shortageQty:
              0.07 * portions > 15.0 ? Number((0.07 * portions - 15.0).toFixed(2)) : 0,
          },
          {
            materialId: 'RM-SP-02',
            materialName: 'Turmeric, Mustard & Fenugreek Seeds',
            category: 'SPICES_HERBS',
            unitOfMeasure: 'kg',
            qtyPerPerson: 0.015,
            totalRequiredQty: Number((0.015 * portions).toFixed(2)),
            quantityOnHand: 8.5,
            isShortage: false,
            shortageQty: 0,
          },
        ];
      }
    }

    const shortageCount = materialsBreakdown.filter((m) => m.isShortage).length;

    return {
      foodItemId: targetItemId || 'ITEM-GEN',
      foodItemName: dishName,
      portions,
      materials: materialsBreakdown,
      totalRawMaterialsCount: materialsBreakdown.length,
      shortageMaterialsCount: shortageCount,
    };
  };

  const currentBOMBreakdown = useMemo(() => {
    if (!selectedBulkItem) return null;

    if (selectedBulkItem.items && selectedBulkItem.items.length > 0) {
      const aggregatedMaterialsMap = new Map<
        string,
        {
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
      >();

      selectedBulkItem.items.forEach((item) => {
        const itemQty = item.quantity || 1;
        const subBreakdown = calculateBOMBreakdown(item.name, itemQty, item.itemId);
        subBreakdown.materials.forEach((mat) => {
          if (aggregatedMaterialsMap.has(mat.materialId)) {
            const existing = aggregatedMaterialsMap.get(mat.materialId)!;
            existing.totalRequiredQty = Number(
              (existing.totalRequiredQty + mat.totalRequiredQty).toFixed(2),
            );
            existing.isShortage = existing.totalRequiredQty > existing.quantityOnHand;
            existing.shortageQty = existing.isShortage
              ? Number((existing.totalRequiredQty - existing.quantityOnHand).toFixed(2))
              : 0;
          } else {
            aggregatedMaterialsMap.set(mat.materialId, { ...mat });
          }
        });
      });

      const mergedMaterials = Array.from(aggregatedMaterialsMap.values());
      const shortageCount = mergedMaterials.filter((m) => m.isShortage).length;

      return {
        foodItemId: selectedBulkItem.itemId || 'ORDER-COMBO',
        foodItemName: selectedBulkItem.dishName,
        portions: selectedBulkItem.portionCount,
        materials: mergedMaterials,
        totalRawMaterialsCount: mergedMaterials.length,
        shortageMaterialsCount: shortageCount,
      };
    }

    return calculateBOMBreakdown(
      selectedBulkItem.dishName,
      selectedBulkItem.portionCount,
      selectedBulkItem.itemId,
    );
  }, [selectedBulkItem, bomTemplatesList, rawMaterialsList]);

  // -------------------------------------------------------------------------
  // TAB 2: BOM SUMMARY & USAGE LOGS STATE
  // -------------------------------------------------------------------------
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [viewLogDetailModal, setViewLogDetailModal] = useState<ProductionLogEntry | null>(
    null,
  );

  // Normalize API production logs strictly from backend bomUsageLogMutation queries
  const normalizedBOMUsageLogs = useMemo<ProductionLogEntry[]>(() => {
    const rawData =
      selectedBOMFilter !== 'ALL' && templateBOMUsageLogsRes
        ? (templateBOMUsageLogsRes?.data ?? templateBOMUsageLogsRes)
        : (allBOMUsageLogsRes?.data ?? allBOMUsageLogsRes);

    const apiLogs: any[] = Array.isArray(rawData)
      ? rawData
      : Array.isArray((rawData as any)?.content)
        ? (rawData as any).content
        : Array.isArray((rawData as any)?.data)
          ? (rawData as any).data
          : [];

    if (!apiLogs || apiLogs.length === 0) {
      return [];
    }

    const flatLogs: any[] = [];
    apiLogs.forEach((log: any, idx: number) => {
      // If log has nested Used_BOMs / usedBoms array
      if (Array.isArray(log.Used_BOMs) && log.Used_BOMs.length > 0) {
        log.Used_BOMs.forEach((bomItem: any, subIdx: number) => {
          flatLogs.push({
            ...log,
            templateId: bomItem.templateId || log.templateId,
            portionsCooked: bomItem.portionsCooked || log.portionsCooked || 1,
            _uniqueId: `${log.id || log.usageLogId || idx}-${subIdx}`,
          });
        });
      } else if (Array.isArray(log.usedBoms) && log.usedBoms.length > 0) {
        log.usedBoms.forEach((bomItem: any, subIdx: number) => {
          flatLogs.push({
            ...log,
            templateId: bomItem.templateId || log.templateId,
            portionsCooked: bomItem.portionsCooked || log.portionsCooked || 1,
            _uniqueId: `${log.id || log.usageLogId || idx}-${subIdx}`,
          });
        });
      } else {
        flatLogs.push({
          ...log,
          _uniqueId: `${log.id || log.usageLogId || idx}`,
        });
      }
    });

    return flatLogs.map((log: any, idx: number) => {
      const targetTemplateId =
        log.templateId ||
        log.template_id ||
        log.bomTemplateId ||
        log.bomTemplate?.templateId ||
        log.bomTemplate?.id ||
        '';

      const targetChefId =
        log.cookedBy ||
        log.cooked_by ||
        log.userId ||
        log.chefId ||
        '';

      // Find template
      const template = bomTemplatesList.find(
        (t) =>
          (targetTemplateId &&
            (t.templateId === targetTemplateId || (t as any).id === targetTemplateId)) ||
          (log.itemId && (t.itemId === log.itemId || (t as any).id === log.itemId)),
      );

      const foodItem = template
        ? foodItemsList.find(
            (f) =>
              f.itemId === template.itemId || (f as any).id === template.itemId,
          )
        : foodItemsList.find(
            (f) => f.itemId === log.itemId || (f as any).id === log.itemId,
          );

      const itemName =
        log.itemName ||
        log.dishName ||
        template?.templateName ||
        template?.foodItem?.name ||
        foodItem?.name ||
        (targetTemplateId
          ? `BOM Recipe (${targetTemplateId.slice(0, 8)})`
          : 'Recipe Production Batch');

      const portions = Number(
        log.portionsCooked ||
          log.portions ||
          log.quantityCooked ||
          log.portions_cooked ||
          1,
      );

      const breakdown = calculateBOMBreakdown(
        itemName,
        portions,
        template?.itemId || foodItem?.itemId,
      );

      const deductedMaterials =
        log.deductedMaterials ||
        log.materials ||
        breakdown.materials.map((m) => ({
          materialId: m.materialId,
          materialName: m.materialName,
          deductedQty: m.totalRequiredQty,
          unitOfMeasure: m.unitOfMeasure,
        }));

      const dateStr =
        log.createdAt || log.created_at || log.timestamp || log.date;
      const formattedDate = dateStr
        ? dayjs(dateStr).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');
      const formattedTime = dateStr
        ? dayjs(dateStr).format('hh:mm A')
        : dayjs().format('hh:mm A');

      return {
        id:
          log.id ||
          log.usageLogId ||
          log.logId ||
          log._uniqueId ||
          `LOG-${idx + 1}`,
        batchCode:
          log.batchCode ||
          log.batchId ||
          (log.id
            ? `LOG-${String(log.id).slice(-8).toUpperCase()}`
            : `BATCH-${dayjs().format('YYYYMMDD')}-${idx + 101}`),
        date: formattedDate,
        time: formattedTime,
        itemId: targetTemplateId || template?.itemId || '',
        itemName,
        portionsCooked: portions,
        loggedByChef:
          log.cookedByName ||
          log.chefName ||
          (targetChefId
            ? `Chef (${targetChefId.slice(0, 8)})`
            : userData?.name || 'Head Chef'),
        status: 'STOCK_DEDUCTED',
        deductedMaterials,
      };
    });
  }, [
    selectedBOMFilter,
    templateBOMUsageLogsRes,
    allBOMUsageLogsRes,
    bomTemplatesList,
    foodItemsList,
    userData,
  ]);

  // Filtered Production Logs by BOM Template and Search Term
  const filteredProductionLogs = useMemo(() => {
    return normalizedBOMUsageLogs.filter((log) => {
      // 1. Filter by BOM Template
      if (selectedBOMFilter !== 'ALL') {
        const matchesTemplate =
          log.itemId === selectedBOMFilter ||
          (log as any).templateId === selectedBOMFilter ||
          log.itemName.toLowerCase().includes(selectedBOMFilter.toLowerCase());
        if (!matchesTemplate) return false;
      }

      // 2. Filter by search term
      if (logSearchTerm) {
        const term = logSearchTerm.toLowerCase();
        return (
          log.batchCode.toLowerCase().includes(term) ||
          log.itemName.toLowerCase().includes(term) ||
          log.loggedByChef.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [normalizedBOMUsageLogs, selectedBOMFilter, logSearchTerm]);

  // -------------------------------------------------------------------------
  // TAB 3: AI DEMAND FORECASTING STATE & INTERACTIVE CONTROLS
  // -------------------------------------------------------------------------
  const [selectedForecastDate, setSelectedForecastDate] = useState<dayjs.Dayjs>(dayjs());
  const [savedDemandRecords, setSavedDemandRecords] = useState<SavedDemandRecord[]>(
    INITIAL_SAVED_DEMANDS,
  );
  const [aiBOMCheckModal, setAiBOMCheckModal] = useState<AIPredictedItem | null>(null);
  const [isRequisitionSent, setIsRequisitionSent] = useState(false);

  // Manual interactive state for Weather (Clear, Rainy, Cloudy), Temperature, and Boolean Holiday
  const [manualWeather, setManualWeather] = useState<'Clear' | 'Rainy' | 'Cloudy'>('Clear');
  const [manualTemp, setManualTemp] = useState<number>(31);
  const [isHoliday, setIsHoliday] = useState<boolean>(false);

  // Auto sync defaults whenever selected date changes
  useEffect(() => {
    const def = getForecastForDate(selectedForecastDate || dayjs());
    setManualWeather(def.weatherCondition);
    setManualTemp(def.temperature);
    setIsHoliday(def.isHoliday.startsWith('Yes'));
  }, [selectedForecastDate]);

  // Reactive Demand Count calculation according to date and interactive card adjustments
  const currentDateForecast = useMemo(() => {
    const targetDate = selectedForecastDate || dayjs();
    const dayOfWeek = targetDate.format('dddd');
    const isWeekend = targetDate.day() === 0 || targetDate.day() === 6;
    const dayType = isWeekend ? 'Weekend' : 'Weekday';
    const dayDetails = `${dayOfWeek} • ${dayType}`;

    let baseDemand = 80;
    if (isWeekend) baseDemand += 35;
    if (isHoliday) baseDemand += 45;
    if (manualWeather === 'Clear') baseDemand += 15;
    else if (manualWeather === 'Cloudy') baseDemand += 5;
    else if (manualWeather === 'Rainy') baseDemand -= 8;

    if (manualTemp > 30) baseDemand += (manualTemp - 30) * 2;
    else if (manualTemp < 26) baseDemand -= (26 - manualTemp) * 2;

    const demandingCount = Math.max(25, baseDemand);

    return {
      dateStr: targetDate.format('YYYY-MM-DD'),
      formattedDate: targetDate.format('DD MMM YYYY'),
      weatherCondition: manualWeather,
      temperature: manualTemp,
      isHoliday: isHoliday ? 'Yes (Holiday)' : 'No (Regular Day)',
      isHolidayBool: isHoliday,
      dayDetails,
      dayOfWeek,
      dayType,
      demandingCount,
      confidenceScore: 79, // fixed model accuracy as 79
    };
  }, [selectedForecastDate, manualWeather, manualTemp, isHoliday]);

  // Available food items list for portion allocation in sidebar
  const availableAllocationFoodItems = useMemo(() => {
    const items: { itemId: string; name: string; category: string; unitPrice: number }[] = [];
    if (foodItemsList && foodItemsList.length > 0) {
      foodItemsList.forEach((f: any) => {
        items.push({
          itemId: f.itemId || f.id || 'F-ITEM',
          name: f.name || f.itemName || 'Resort Dish',
          category: f.category || 'Main Dish',
          unitPrice: Number(f.unitPrice) || Number(f.price) || 1200,
        });
      });
    } else {
      DEFAULT_MENU_ITEMS.forEach((f) => items.push(f));
    }
    return items;
  }, [foodItemsList]);

  // Drawer allocation state
  const [isForecastBOMDrawerOpen, setIsForecastBOMDrawerOpen] = useState(false);
  const [forecastFoodAllocations, setForecastFoodAllocations] = useState<
    { itemId: string; name: string; category: string; unitPrice: number; portions: number; isSelected: boolean }[]
  >([]);

  // Open drawer and initialize/sync portions with current demanding count
  const handleOpenForecastBOMDrawer = () => {
    const totalPax = currentDateForecast.demandingCount;
    // If no allocations yet, initialize with top 4 dishes
    if (forecastFoodAllocations.length === 0) {
      const topDishes = availableAllocationFoodItems.slice(0, 4);
      const baseShare = Math.floor(totalPax / topDishes.length);
      const remainder = totalPax % topDishes.length;

      const initialItems = topDishes.map((item, idx) => ({
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        unitPrice: item.unitPrice,
        portions: baseShare + (idx < remainder ? 1 : 0),
        isSelected: true,
      }));
      setForecastFoodAllocations(initialItems);
    }
    setIsForecastBOMDrawerOpen(true);
  };

  const allocatedPortionsSum = useMemo(() => {
    return forecastFoodAllocations
      .filter((it) => it.isSelected)
      .reduce((sum, it) => sum + (Number(it.portions) || 0), 0);
  }, [forecastFoodAllocations]);

  const selectedAllocatedCount = useMemo(() => {
    return forecastFoodAllocations.filter((it) => it.isSelected).length;
  }, [forecastFoodAllocations]);

  // Optimized auto-distribution helper across selected items
  const handleAutoDistributeForecastPortions = () => {
    const totalPax = currentDateForecast.demandingCount;

    setForecastFoodAllocations((prev) => {
      let itemsToDistribute = prev.filter((p) => p.isSelected);

      if (itemsToDistribute.length === 0) {
        itemsToDistribute = availableAllocationFoodItems.slice(0, 4).map((f) => ({
          itemId: f.itemId,
          name: f.name,
          category: f.category,
          unitPrice: f.unitPrice,
          portions: 0,
          isSelected: true,
        }));
      }

      const numItems = itemsToDistribute.length;
      const baseShare = Math.floor(totalPax / numItems);
      const remainder = totalPax % numItems;

      const distributedMap = new Map<string, number>();
      itemsToDistribute.forEach((item, index) => {
        distributedMap.set(item.itemId, baseShare + (index < remainder ? 1 : 0));
      });

      const existingIds = new Set(prev.map((p) => p.itemId));
      const newItemsToAdd = itemsToDistribute.filter(
        (item) => !existingIds.has(item.itemId),
      );

      const updatedExisting = prev.map((item) => {
        if (distributedMap.has(item.itemId)) {
          return {
            ...item,
            isSelected: true,
            portions: distributedMap.get(item.itemId) || 0,
          };
        }
        return item;
      });

      return [
        ...updatedExisting,
        ...newItemsToAdd.map((item) => ({
          ...item,
          portions: distributedMap.get(item.itemId) || 0,
        })),
      ];
    });

    successToast(`Evenly distributed exact ${totalPax} portions across dishes!`);
  };

  // Launch BOM Calculation Modal from Drawer with multi-dish separated breakdown
  const handleCalculateAllocatedBOM = () => {
    const selected = forecastFoodAllocations.filter(
      (it) => it.isSelected && it.portions > 0,
    );
    if (selected.length === 0) {
      errorToast('Please select at least one food item with portion count greater than 0.');
      return;
    }

    const calculatedResults: CalculatedOrderBOMFoodItem[] = selected.map((it) => {
      const breakdown = calculateBOMBreakdown(it.name, it.portions, it.itemId);
      return {
        ItemId: it.itemId,
        itemId: it.itemId,
        itemName: it.name,
        required_quantity: it.portions,
        rawMaterialDetails: breakdown.materials.map((m) => ({
          materialId: m.materialId,
          materialName: m.materialName,
          category: m.category,
          unitOfMeasure: m.unitOfMeasure,
          qtyPerPerson: m.qtyPerPerson,
          orderedQty: it.portions,
          totalRequiredQty: m.totalRequiredQty,
          quantityOnHand: m.quantityOnHand,
          status: m.isShortage ? 'Shortage' : 'In Stock',
          isShortage: m.isShortage,
          shortageQty: m.shortageQty,
        })),
      };
    });

    setOrderBOMResults(calculatedResults);
    setSelectedBulkItem({
      dishName: `AI Forecast Demand Allocation`,
      orderNumber: `FCST-${selectedForecastDate.format('MMDD')}`,
      portionCount: allocatedPortionsSum,
      mealSession: 'FORECAST_ALLOCATION',
      orderTicketId: `FCST-${selectedForecastDate.format('YYYYMMDD')}`,
      items: selected.map((it) => ({
        itemId: it.itemId,
        name: it.name,
        quantity: it.portions,
      })),
    });
    setIsForecastBOMDrawerOpen(false);
    setBomModalOpen(true);
  };

  const handleSaveForecast = () => {
    const newRecord: SavedDemandRecord = {
      id: `DEM-${dayjs().format('YYYYMMDD-HHmmss')}`,
      date: currentDateForecast.dateStr,
      weatherCondition: currentDateForecast.weatherCondition,
      temperature: currentDateForecast.temperature,
      isHoliday: currentDateForecast.isHoliday,
      dayDetails: currentDateForecast.dayDetails,
      demandedCount: currentDateForecast.demandingCount,
      modelAccuracy: currentDateForecast.confidenceScore,
    };

    setSavedDemandRecords((prev) => [
      newRecord,
      ...prev.filter((r) => r.date !== newRecord.date),
    ]);
    successToast(`Forecast for ${currentDateForecast.formattedDate} saved to records!`);
  };

  const selectedAIPredictedBOM = useMemo(() => {
    if (!aiBOMCheckModal) return null;
    return calculateBOMBreakdown(
      aiBOMCheckModal.itemName,
      aiBOMCheckModal.predictedPortions,
      aiBOMCheckModal.itemId,
    );
  }, [aiBOMCheckModal, bomTemplatesList, rawMaterialsList]);

  // Helper for Elapsed Time tag in KDS Kanban
  const getElapsedBadge = (createdAtStr: string, status: KDSOrderStatus) => {
    const elapsedMinutes = dayjs().diff(dayjs(createdAtStr), 'minute');
    let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let pulseClass = '';

    if (status === 'READY') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#092968]">
          <CheckCircle2 size={12} /> Ready Plated
        </span>
      );
    }

    if (elapsedMinutes >= 20) {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold';
      pulseClass = 'animate-pulse';
    } else if (elapsedMinutes >= 10) {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${colorClass} ${pulseClass}`}
      >
        <Clock size={12} />
        {elapsedMinutes} min ago
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* ========================================================================= */}
      {/* TOP TABLET HEADER: TAB SELECTOR, REAL-TIME CLOCK, AUDIO & FULLSCREEN */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#0D388A] bg-[#092968] p-3 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        {/* 3 MAIN HORIZONTAL NAVIGATION TABS */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('LIVE_KDS')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all duration-200 active:scale-[0.98] sm:text-sm ${
              activeTab === 'LIVE_KDS'
                ? 'bg-[#F26E22] text-white shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Flame
              size={16}
              className={activeTab === 'LIVE_KDS' ? 'animate-bounce' : ''}
            />
            <span>1. Live Kitchen Orders</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                activeTab === 'LIVE_KDS'
                  ? 'bg-white text-[#092968]'
                  : 'bg-white/20 text-white'
              }`}
            >
              {pendingTickets.length + preparingTickets.length} active
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PRODUCTION_LOG')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all duration-200 active:scale-[0.98] sm:text-sm ${
              activeTab === 'PRODUCTION_LOG'
                ? 'bg-[#F26E22] text-white shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>2. BOM Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('AI_FORECASTING')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all duration-200 active:scale-[0.98] sm:text-sm ${
              activeTab === 'AI_FORECASTING'
                ? 'bg-[#F26E22] text-white shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>3. AI Demand Forecasting</span>
          </button>
        </div>

        {/* Real-time Clock, Audio Alert & Fullscreen */}
        <div className="flex items-center justify-end gap-2.5">
          {/* Live Clock */}
          <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-md">
            <Timer className="text-[#F26E22]" size={18} />
            <div className="text-left">
              <p className="font-mono text-sm font-black leading-tight tracking-wider text-white">
                {currentTime.format('hh:mm:ss A')}
              </p>
              <p className="text-[9px] font-medium uppercase leading-tight tracking-wider text-blue-200">
                {currentTime.format('ddd, DD MMM YYYY')}
              </p>
            </div>
          </div>

          {/* Audio Toggle Button */}
          <Tooltip
            title={audioEnabled ? 'Kitchen Audio Alert: ON' : 'Kitchen Audio: MUTED'}
          >
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled) successToast('Kitchen audio chimes unmuted.');
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-95 ${
                audioEnabled
                  ? 'border-[#F26E22] bg-[#F26E22] text-white shadow-sm'
                  : 'border-white/15 bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Tablet Kiosk Fullscreen'}>
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                  setIsFullscreen(true);
                } else {
                  document.exitFullscreen().catch(() => {});
                  setIsFullscreen(false);
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE KITCHEN ORDERS (KDS) */}
      {/* ========================================================================= */}
      {activeTab === 'LIVE_KDS' && (
        <div className="animate-in fade-in space-y-6 duration-300">
          {/* Sub-Tabs: A La Carte (Walk-ins) vs Reservation Bulk Meals */}
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex w-full items-center rounded-xl bg-slate-100 p-1 sm:w-auto">
              <button
                onClick={() => setKdsSubTab('A_LA_CARTE')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all sm:flex-initial sm:text-sm ${
                  kdsSubTab === 'A_LA_CARTE'
                    ? 'bg-[#092968] text-white shadow'
                    : 'text-slate-600 hover:text-[#092968]'
                }`}
              >
                <Utensils size={16} />
                <span>A La Carte (Walk-ins)</span>
                <span className="py-0.2 rounded-full bg-[#F26E22] px-2 text-[10px] font-extrabold text-white">
                  {kdsTickets.filter((t) => t.status !== 'SERVED').length}
                </span>
              </button>

              <button
                onClick={() => setKdsSubTab('BULK_MEALS')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all sm:flex-initial sm:text-sm ${
                  kdsSubTab === 'BULK_MEALS'
                    ? 'bg-[#092968] text-white shadow'
                    : 'text-slate-600 hover:text-[#092968]'
                }`}
              >
                <Layers size={16} />
                <span>Reservation Bulk Meals</span>
                <span className="py-0.2 rounded-full bg-emerald-600 px-2 text-[10px] font-extrabold text-white">
                  {bulkRequirements.length} Batches
                </span>
              </button>
            </div>
          </div>

          {/* =================================================================== */}
          {/* SUB-VIEW 1: A LA CARTE KANBAN BOARD (3 COLUMNS: PENDING, PREPARING, READY) */}
          {/* =================================================================== */}
          {kdsSubTab === 'A_LA_CARTE' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* ---------------- COLUMN 1: PENDING ---------------- */}
              <div className="flex flex-col rounded-3xl border border-slate-200 bg-slate-100/90 p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 font-bold text-white">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h3 className="font-spaceGrotesk text-base font-extrabold text-[#092968]">
                        Pending Orders
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500">
                        Awaiting Chef pickup
                      </p>
                    </div>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-extrabold text-amber-900">
                    {pendingTickets.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="max-h-[650px] flex-1 space-y-4 overflow-y-auto pr-1">
                  {pendingTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                      <CheckCircle2 size={32} className="mb-2 text-emerald-500" />
                      <p className="text-xs font-bold text-slate-600">
                        All pending tickets cleared!
                      </p>
                      <p className="text-[11px] text-slate-400">Great job chef.</p>
                    </div>
                  ) : (
                    pendingTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        onClick={() => {
                          setSelectedKdsTicket(ticket);
                          setIsOrderModalOpen(true);
                        }}
                        className="cursor-pointer rounded-2xl border-l-4 border-slate-200 border-l-amber-500 bg-white p-0 shadow-sm transition-all hover:border-amber-400 hover:shadow-md"
                      >
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-spaceGrotesk text-base font-black text-[#092968]">
                                {ticket.orderNumber}
                              </span>
                              {ticket.priority === 'URGENT' ||
                              ticket.priority === 'VIP' ? (
                                <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700">
                                  {ticket.priority}
                                </span>
                              ) : (
                                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  PENDING
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs font-bold text-slate-700">
                              {ticket.tableOrRoom}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Server: {ticket.serverName}
                            </p>
                          </div>
                          {getElapsedBadge(ticket.createdAt, ticket.status)}
                        </div>

                        {/* Order Summary Box (Clickable to view items) */}
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#092968] text-xs font-bold text-white">
                                <Utensils size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800">
                                  {ticket.items.length}{' '}
                                  {ticket.items.length === 1 ? 'Dish' : 'Dishes'} (
                                  {ticket.items.reduce(
                                    (s, i) => s + (i.quantity || 1),
                                    0,
                                  )}{' '}
                                  Portions)
                                </p>
                                <p className="text-[11px] font-semibold text-slate-400">
                                  Total: LKR{' '}
                                  {Number(ticket.totalAmount || 0).toLocaleString(
                                    'en-US',
                                    { minimumFractionDigits: 2 },
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-bold text-[#F26E22]">
                              <Eye size={12} /> View Items
                            </span>
                          </div>
                        </div>

                        {/* Tablet Touch Action Button */}
                        <div className="p-4 pt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKdsTicket(ticket);
                              setIsOrderModalOpen(true);
                            }}
                            className="active:scale-98 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F26E22] text-xs font-extrabold text-white shadow-md transition-all hover:bg-[#d95a14]"
                          >
                            <Flame size={16} />
                            <span>Start Cooking (Review & BOM)</span>
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* ---------------- COLUMN 2: PREPARING ---------------- */}
              <div className="flex flex-col rounded-3xl border border-orange-200 bg-orange-50/70 p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-orange-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F26E22] font-bold text-white">
                      <Flame size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-spaceGrotesk text-base font-extrabold text-[#092968]">
                        Preparing / Cooking
                      </h3>
                      <p className="text-[11px] font-semibold text-orange-900/70">
                        In progress at kitchen station
                      </p>
                    </div>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F26E22] text-xs font-extrabold text-white">
                    {preparingTickets.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="max-h-[650px] flex-1 space-y-4 overflow-y-auto pr-1">
                  {preparingTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orange-300 bg-white/60 p-8 text-center">
                      <Utensils size={32} className="mb-2 text-orange-400" />
                      <p className="text-xs font-bold text-slate-600">
                        No dishes currently on the stove.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Pick a ticket from Pending to start cooking.
                      </p>
                    </div>
                  ) : (
                    preparingTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        onClick={() => {
                          setSelectedKdsTicket(ticket);
                          setIsOrderModalOpen(true);
                        }}
                        className="cursor-pointer rounded-2xl border-l-4 border-orange-200 border-l-[#F26E22] bg-white p-0 shadow-sm transition-all hover:border-[#F26E22] hover:shadow-md"
                      >
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-spaceGrotesk text-base font-black text-[#092968]">
                                {ticket.orderNumber}
                              </span>
                              <span className="flex items-center gap-1 rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-black text-[#F26E22]">
                                <Flame size={10} /> Cooking
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs font-bold text-slate-700">
                              {ticket.tableOrRoom}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Server: {ticket.serverName}
                            </p>
                          </div>
                          {getElapsedBadge(ticket.createdAt, ticket.status)}
                        </div>

                        {/* Order Summary Box (Clickable to view items) */}
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/50 p-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F26E22] text-xs font-bold text-white">
                                <Flame size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800">
                                  {ticket.items.length}{' '}
                                  {ticket.items.length === 1 ? 'Dish' : 'Dishes'} (
                                  {ticket.items.reduce(
                                    (s, i) => s + (i.quantity || 1),
                                    0,
                                  )}{' '}
                                  Portions)
                                </p>
                                <p className="text-[11px] font-semibold text-slate-400">
                                  Total: LKR{' '}
                                  {Number(ticket.totalAmount || 0).toLocaleString(
                                    'en-US',
                                    { minimumFractionDigits: 2 },
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-[#092968]">
                              <Eye size={12} /> View Items
                            </span>
                          </div>
                        </div>

                        {/* Tablet Touch Action Button */}
                        <div className="p-4 pt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceKdsStatus(ticket.id, 'READY');
                            }}
                            className="active:scale-98 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#092968] text-xs font-extrabold text-white shadow-md transition-all hover:bg-[#0c3585]"
                          >
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <span>Mark as Plated & Ready</span>
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* ---------------- COLUMN 3: READY ---------------- */}
              <div className="flex flex-col rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-spaceGrotesk text-base font-extrabold text-[#092968]">
                        Ready for Pickup
                      </h3>
                      <p className="text-[11px] font-semibold text-emerald-900/70">
                        Plated & waiting for server
                      </p>
                    </div>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-900">
                    {readyTickets.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="max-h-[650px] flex-1 space-y-4 overflow-y-auto pr-1">
                  {readyTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-white/60 p-8 text-center">
                      <ShieldCheck size={32} className="mb-2 text-emerald-400" />
                      <p className="text-xs font-bold text-slate-600">
                        No orders waiting for pickup.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        All plated food has been dispatched to tables.
                      </p>
                    </div>
                  ) : (
                    readyTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        onClick={() => {
                          setSelectedKdsTicket(ticket);
                          setIsOrderModalOpen(true);
                        }}
                        className="cursor-pointer rounded-2xl border-l-4 border-emerald-200 border-l-emerald-500 bg-white p-0 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
                      >
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-spaceGrotesk text-base font-black text-[#092968]">
                                {ticket.orderNumber}
                              </span>
                              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
                                Plated
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs font-bold text-slate-700">
                              {ticket.tableOrRoom}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Server: {ticket.serverName}
                            </p>
                          </div>
                          {getElapsedBadge(ticket.createdAt, ticket.status)}
                        </div>

                        {/* Order Summary Box (Clickable to view items) */}
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                                <CheckCircle2 size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800">
                                  {ticket.items.length}{' '}
                                  {ticket.items.length === 1 ? 'Dish' : 'Dishes'} (
                                  {ticket.items.reduce(
                                    (s, i) => s + (i.quantity || 1),
                                    0,
                                  )}{' '}
                                  Portions)
                                </p>
                                <p className="text-[11px] font-semibold text-slate-400">
                                  Total: LKR{' '}
                                  {Number(ticket.totalAmount || 0).toLocaleString(
                                    'en-US',
                                    { minimumFractionDigits: 2 },
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="flex items-center gap-1 rounded-lg bg-emerald-100/60 px-2 py-1 text-[11px] font-bold text-emerald-700">
                              <Eye size={12} /> View Items
                            </span>
                          </div>
                        </div>

                        {/* Tablet Touch Action Button */}
                        <div className="p-4 pt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceKdsStatus(ticket.id, 'SERVED');
                            }}
                            className="active:scale-98 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-700"
                          >
                            <Check size={16} />
                            <span>Dispatch / Server Picked Up</span>
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* SUB-VIEW 2: RESERVATION BULK MEALS (BUFFETS & BANQUETS) */}
          {/* =================================================================== */}
          {kdsSubTab === 'BULK_MEALS' && (
            <div className="space-y-6">
              {/* Daily Requirements Header */}
              <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-[#092968] to-[#0E3A8C] p-6 text-white shadow-md md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300">
                    <Calendar size={16} /> Daily Kitchen Schedule & In-House Requirements
                  </div>
                  <h2 className="font-spaceGrotesk mt-1 text-2xl font-black text-white">
                    Confirmed Reservation Bulk Meal Batches
                  </h2>
                  <p className="text-xs text-blue-100">
                    Calculated automatically from checked-in guests, meal plans, and
                    booked banquet events.
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-3">
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase text-blue-200">
                      Total Buffet Portions Today
                    </p>
                    <p className="font-mono text-2xl font-black text-[#F26E22]">
                      255 Portions
                    </p>
                  </div>
                </div>
              </div>

              {/* Bulk Batch Cards Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {bulkRequirements.map((batch) => (
                  <Card
                    key={batch.id}
                    className="overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-sm transition-all hover:shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
                      <div>
                        <span className="rounded-md bg-[#092968] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                          {batch.mealType}
                        </span>
                        <h3 className="font-spaceGrotesk mt-1.5 text-lg font-black text-[#092968]">
                          {batch.title}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <Clock size={13} className="text-[#F26E22]" />{' '}
                          {batch.scheduledTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-2xl bg-orange-100 px-3 py-1 font-mono text-base font-black text-[#F26E22]">
                          {batch.totalPortions} Pax
                        </span>
                      </div>
                    </div>

                    {/* Batch Details */}
                    <div className="space-y-4 p-4">
                      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs">
                        <div>
                          <p className="font-semibold text-slate-400">Confirmed Guests</p>
                          <p className="text-sm font-bold text-[#092968]">
                            {batch.confirmedGuestsCount} Guests
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-400">Room Occupancy</p>
                          <p className="text-sm font-bold text-[#092968]">
                            {batch.inHouseRoomsCount} Rooms
                          </p>
                        </div>
                      </div>

                      {/* Dishes in this bulk requirement */}
                      <div>
                        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          Menu Dishes in this Batch ({batch.dishItems.length})
                        </p>
                        <div className="space-y-2">
                          {batch.dishItems.map((dish, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-[#F26E22]">
                                  🍽️
                                </div>
                                <span className="text-xs font-bold text-slate-800">
                                  {dish.name}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-extrabold text-[#092968]">
                                {dish.portionCount} p
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prominent Touch "Calculate BOM" Button */}
                      <button
                        onClick={() => {
                          setSelectedBulkItem({
                            dishName: batch.title,
                            portionCount: batch.totalPortions,
                            mealSession: batch.mealType,
                            itemId: batch.dishItems[0]?.itemId,
                          });
                          setBomModalOpen(true);
                        }}
                        className="active:scale-98 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#F26E22] text-sm font-extrabold text-white shadow-md transition-all hover:bg-[#d95a14]"
                      >
                        <Boxes size={18} />
                        <span>Calculate BOM Recipe Requirements</span>
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/*  TAB 2: BOM SUMMARY */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCTION_LOG' && (
        <div className="animate-in fade-in space-y-6 duration-300">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#092968]">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Usage Logs
                </p>
                <h3 className="font-spaceGrotesk text-2xl font-black text-[#092968]">
                  {filteredProductionLogs.length} Batches
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F26E22]">
                <Boxes size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Portions Cooked
                </p>
                <h3 className="font-spaceGrotesk text-2xl font-black text-[#F26E22]">
                  {filteredProductionLogs.reduce((acc, curr) => acc + (curr.portionsCooked || 0), 0)} Pax
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active BOM Recipes
                </p>
                <h3 className="font-spaceGrotesk text-2xl font-black text-slate-800">
                  {bomTemplatesList.length} Templates
                </h3>
              </div>
            </div>
          </div>

          {/* BOM Usage Logs Table with Filter */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-spaceGrotesk text-lg font-black text-[#092968]">
                  BOM Production & Usage Logs
                </h3>
                <p className="text-xs text-slate-400">
                  Audit trail of meal batches cooked and raw materials deducted from warehouse
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* BOM Template Filter Dropdown */}
                <div className="w-full sm:w-64">
                  <Select
                    showSearch
                    placeholder="Filter by BOM Template"
                    value={selectedBOMFilter}
                    onChange={(val) => setSelectedBOMFilter(val)}
                    optionFilterProp="children"
                    className="h-10 w-full rounded-xl text-xs font-semibold"
                  >
                    <Option value="ALL">All BOM Templates & Dishes</Option>
                    {bomTemplatesList.map((tpl: any) => {
                      const id = tpl.templateId || tpl.id || tpl.itemId;
                      const name = tpl.templateName || tpl.foodItem?.name || 'Recipe';
                      return (
                        <Option key={id} value={id}>
                          {name}
                        </Option>
                      );
                    })}
                  </Select>
                </div>

                {/* Text Search Input */}
                <div className="relative w-full sm:w-56">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    placeholder="Search batch, dish, or chef..."
                    value={logSearchTerm}
                    onChange={(e) => setLogSearchTerm(e.target.value)}
                    className="h-10 w-full rounded-xl border-slate-200 pl-9 text-xs"
                    allowClear
                  />
                </div>

                {/* Refresh Button */}
                <Button
                  icon={
                    <RotateCw
                      size={15}
                      className={isFetchingBOMUsageLogs ? 'animate-spin' : ''}
                    />
                  }
                  onClick={handleRefetchBOMUsageLogs}
                  className="flex h-10 items-center justify-center rounded-xl font-bold"
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* Table Container */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3.5">Date & Time</th>
                    <th className="px-4 py-3.5">Batch / Log Code</th>
                    <th className="px-4 py-3.5">Cooked Dish / Recipe</th>
                    <th className="px-4 py-3.5 text-center">Portions Cooked</th>
                    <th className="px-4 py-3.5">Logged By Chef</th>
                    <th className="px-4 py-3.5 text-center">Inventory Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isFetchingBOMUsageLogs ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center">
                        <Spin size="large" />
                        <p className="mt-3 text-xs font-bold text-slate-500">
                          Fetching live BOM usage records...
                        </p>
                      </td>
                    </tr>
                  ) : filteredProductionLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Boxes size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600">No BOM usage logs found</p>
                        <p className="text-xs text-slate-400">
                          {selectedBOMFilter !== 'ALL' || logSearchTerm
                            ? 'Try clearing the BOM template filter or search query.'
                            : 'BOM usage logs will appear here once meals are prepared and approved.'}
                        </p>
                        {(selectedBOMFilter !== 'ALL' || logSearchTerm) && (
                          <Button
                            size="small"
                            className="mt-3 rounded-lg font-bold"
                            onClick={() => {
                              setSelectedBOMFilter('ALL');
                              setLogSearchTerm('');
                            }}
                          >
                            Reset Filters
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProductionLogs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {log.date}{' '}
                          <span className="block text-[11px] text-slate-400">
                            {log.time}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-[#092968]">
                            {log.batchCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-extrabold text-[#092968]">
                          {log.itemName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-orange-100 px-3 py-1 font-mono font-black text-[#F26E22]">
                            {log.portionsCooked} Pax
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {log.loggedByChef}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Tag
                            color="success"
                            className="rounded-lg px-2.5 py-0.5 text-xs font-bold"
                          >
                            ✓ Stock Deducted
                          </Tag>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            onClick={() => setViewLogDetailModal(log)}
                            className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#092968] transition-all hover:bg-[#092968] hover:text-white"
                          >
                            View BOM Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI DEMAND FORECASTING */}
      {/* ========================================================================= */}
      {activeTab === 'AI_FORECASTING' && (
        <div className="animate-in fade-in space-y-6 duration-300">
          {/* SECTION 1: TOP BAR WITH HEADER & HIGHLIGHTED DATE PICKER */}
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-[#F26E22] shadow-xs">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-spaceGrotesk text-xl font-black text-[#092968]">
                    AI Demand Forecasting
                  </h2>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                    Live Model
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Predictive kitchen portion estimation. Tweak parameters below to recalculate demand live.
                </p>
              </div>
            </div>

            {/* Highlighted DatePicker Box */}
            <div className="flex items-center gap-3 rounded-2xl border-2 border-[#F26E22] bg-orange-50/70 p-2.5 shadow-sm">
              <div className="flex items-center gap-2 pl-2">
                <Calendar className="text-[#F26E22]" size={18} />
                <span className="text-xs font-black uppercase tracking-wider text-[#092968]">
                  Forecast Date:
                </span>
              </div>
              <DatePicker
                value={selectedForecastDate}
                onChange={(date) => {
                  if (date) setSelectedForecastDate(date);
                }}
                format="YYYY-MM-DD"
                allowClear={false}
                className="h-11 min-w-[170px] rounded-xl border-orange-300 bg-white px-3 font-mono text-sm font-black text-[#092968] shadow-xs hover:border-[#F26E22] focus:border-[#F26E22]"
              />
            </div>
          </div>

          {/* SECTION 2: 4 METRIC CARDS (INTERACTIVE WEATHER, TEMP, HOLIDAY, DATE DETAILS) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Weather Condition (Editable: Clear, Rainy, Cloudy) */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Weather Condition
                  </p>
                  <h3 className="font-spaceGrotesk mt-0.5 text-xl font-black text-[#092968]">
                    {manualWeather}
                  </h3>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    manualWeather === 'Clear'
                      ? 'bg-amber-50 text-amber-500'
                      : manualWeather === 'Rainy'
                        ? 'bg-blue-50 text-blue-500'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {manualWeather === 'Clear' && <Sun size={22} />}
                  {manualWeather === 'Rainy' && <CloudRain size={22} />}
                  {manualWeather === 'Cloudy' && <Cloud size={22} />}
                </div>
              </div>
              <div className="mt-3">
                <Select
                  value={manualWeather}
                  onChange={(val) => setManualWeather(val)}
                  className="h-9 w-full rounded-xl text-xs font-bold"
                  options={[
                    { value: 'Clear', label: 'Clear' },
                    { value: 'Rainy', label: 'Rainy' },
                    { value: 'Cloudy', label: 'Cloudy' },
                  ]}
                />
              </div>
            </Card>

            {/* Card 2: Temperature (Editable Stepper) */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Temperature
                  </p>
                  <h3 className="font-spaceGrotesk mt-0.5 text-xl font-black text-[#F26E22]">
                    {manualTemp}°C
                  </h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#F26E22]">
                  <Thermometer size={22} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setManualTemp((t) => Math.max(18, t - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-700 hover:bg-slate-100 active:scale-95"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 text-center font-mono text-xs font-bold text-slate-500">
                  Feels like {manualTemp + 2}°C
                </div>
                <button
                  type="button"
                  onClick={() => setManualTemp((t) => Math.min(45, t + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-700 hover:bg-slate-100 active:scale-95"
                >
                  <Plus size={14} />
                </button>
              </div>
            </Card>

            {/* Card 3: Is Holiday? (Editable Toggle Switch) */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Is Holiday?
                  </p>
                  <h3 className="font-spaceGrotesk mt-0.5 text-xl font-black text-[#092968]">
                    {isHoliday ? 'Yes' : 'No'}
                  </h3>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    isHoliday
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Sparkles size={22} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  {isHoliday ? 'Holiday Surge (+45 Pax)' : 'Regular Business Day'}
                </span>
                <Switch
                  checked={isHoliday}
                  onChange={(checked) => setIsHoliday(checked)}
                />
              </div>
            </Card>

            {/* Card 4: Date Details */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Date Details
                  </p>
                  <h3 className="font-spaceGrotesk mt-0.5 text-xl font-black text-[#092968]">
                    {currentDateForecast.dayOfWeek}
                  </h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#092968]">
                  <CalendarDays size={22} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Tag
                  color={currentDateForecast.dayType === 'Weekend' ? 'volcano' : 'cyan'}
                  className="rounded-md font-bold"
                >
                  {currentDateForecast.dayType}
                </Tag>
                <span className="text-[11px] font-semibold text-slate-400">
                  {currentDateForecast.formattedDate}
                </span>
              </div>
            </Card>
          </div>

          {/* SECTION 3: MIDDLE SECTION - DEMANDING COUNT & BOM BUTTON */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#092968] via-[#0c327a] to-[#12429c] p-6 text-white shadow-sm md:p-8">
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-orange-300 backdrop-blur-md">
                    AI Forecast Engine Output
                  </span>
                  <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-md">
                    ✓ 79% Model Accuracy
                  </span>
                </div>
                <h3 className="font-spaceGrotesk text-xs font-extrabold uppercase tracking-wider text-blue-200">
                  Predicted Demanding Count
                </h3>
                <div className="flex items-baseline gap-3">
                  <span className="font-spaceGrotesk font-mono text-5xl font-black text-white md:text-6xl">
                    {currentDateForecast.demandingCount}
                  </span>
                  <span className="text-lg font-bold text-orange-400">
                    Portions / Covers
                  </span>
                </div>
                <p className="max-w-2xl text-xs text-blue-200">
                  Estimated kitchen dining load for <span className="font-bold text-white">{currentDateForecast.formattedDate}</span> ({currentDateForecast.dayDetails}) based on {manualWeather.toLowerCase()} weather ({manualTemp}°C) and {isHoliday ? 'holiday demand' : 'regular dining day'}.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenForecastBOMDrawer}
                  className="active:scale-98 flex h-13 items-center justify-center gap-2.5 rounded-2xl bg-[#F26E22] px-6 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition-all hover:bg-[#d95a14]"
                >
                  <Boxes size={20} />
                  <span>Check BOM for {currentDateForecast.demandingCount} Count</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveForecast}
                  className="active:scale-98 flex h-13 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
                >
                  <BookmarkPlus size={18} />
                  <span>Save Forecast</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: LAST SECTION - SAVED DEMAND VALUES ROWS */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-spaceGrotesk text-lg font-black text-[#092968]">
                  Saved Demand Values
                </h3>
                <p className="text-xs text-slate-400">
                  Historical and logged demand predictions with BOM recipe requirements
                </p>
              </div>
              <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-[#092968]">
                {savedDemandRecords.length} Saved Records
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Weather</th>
                    <th className="px-4 py-3.5 text-center">Temp</th>
                    <th className="px-4 py-3.5">Is Holiday</th>
                    <th className="px-4 py-3.5">Date Details</th>
                    <th className="px-4 py-3.5 text-center">Demanded Count</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {savedDemandRecords.map((rec) => (
                    <tr key={rec.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3.5 font-bold text-[#092968]">
                        {rec.date}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                          {rec.weatherCondition === 'Clear' && (
                            <Sun size={15} className="text-amber-500" />
                          )}
                          {rec.weatherCondition === 'Rainy' && (
                            <CloudRain size={15} className="text-blue-500" />
                          )}
                          {rec.weatherCondition === 'Cloudy' && (
                            <Cloud size={15} className="text-slate-500" />
                          )}
                          {rec.weatherCondition}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                        {rec.temperature}°C
                      </td>
                      <td className="px-4 py-3.5">
                        {rec.isHoliday.startsWith('Yes') ? (
                          <Tag color="purple" className="rounded-md text-[11px] font-bold">
                            Yes
                          </Tag>
                        ) : (
                          <Tag
                            color="default"
                            className="rounded-md text-[11px] font-medium text-slate-500"
                          >
                            No
                          </Tag>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600">
                        {rec.dayDetails}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="rounded-full bg-orange-100 px-3 py-1 font-mono text-xs font-black text-[#F26E22]">
                          {rec.demandedCount} Pax
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          onClick={() => {
                            const defaultDishes = [
                              {
                                itemId: 'F-005',
                                name: 'Devilled Lagoon Prawns with Fried Rice',
                                quantity: Math.round(rec.demandedCount * 0.35),
                              },
                              {
                                itemId: 'F-008',
                                name: 'Grilled Herb Butter Reef Fish',
                                quantity: Math.round(rec.demandedCount * 0.25),
                              },
                              {
                                itemId: 'F-001',
                                name: 'Sri Lankan String Hoppers with Kiri Hodi',
                                quantity: Math.round(rec.demandedCount * 0.25),
                              },
                              {
                                itemId: 'F-006',
                                name: 'Spicy Chicken Curry with Basmati',
                                quantity: Math.round(rec.demandedCount * 0.15),
                              },
                            ];

                            const calculatedResults: CalculatedOrderBOMFoodItem[] = defaultDishes.map((dish) => {
                              const breakdown = calculateBOMBreakdown(dish.name, dish.quantity, dish.itemId);
                              return {
                                ItemId: dish.itemId,
                                itemId: dish.itemId,
                                itemName: dish.name,
                                required_quantity: dish.quantity,
                                rawMaterialDetails: breakdown.materials.map((m) => ({
                                  materialId: m.materialId,
                                  materialName: m.materialName,
                                  category: m.category,
                                  unitOfMeasure: m.unitOfMeasure,
                                  qtyPerPerson: m.qtyPerPerson,
                                  orderedQty: dish.quantity,
                                  totalRequiredQty: m.totalRequiredQty,
                                  quantityOnHand: m.quantityOnHand,
                                  status: m.isShortage ? 'Shortage' : 'In Stock',
                                  isShortage: m.isShortage,
                                  shortageQty: m.shortageQty,
                                })),
                              };
                            });

                            setOrderBOMResults(calculatedResults);
                            setSelectedBulkItem({
                              dishName: `Saved Demand Recipe Breakdown (${rec.date})`,
                              orderNumber: `SAVED-${rec.date.replace(/-/g, '').slice(4)}`,
                              portionCount: rec.demandedCount,
                              mealSession: 'SAVED_FORECAST',
                              orderTicketId: `SAVED-${rec.id}`,
                              items: defaultDishes,
                            });
                            setBomModalOpen(true);
                          }}
                          className="h-8 rounded-xl bg-[#092968] text-xs font-bold text-white hover:bg-[#0c3585]"
                          icon={<Boxes size={13} />}
                        >
                          Check BOM
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DRAWER: FORECAST PORTION ALLOCATION & DISH SELECTION SIDEBAR */}
          {/* ========================================================================= */}
          <Drawer
            title={
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 pr-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[#F26E22]">
                    <Boxes size={20} />
                  </div>
                  <div>
                    <h3 className="font-spaceGrotesk text-lg font-black text-[#092968]">
                      Forecast Portion Allocation & BOM
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pick dishes and allocate portions for {currentDateForecast.demandingCount} predicted covers
                    </p>
                  </div>
                </div>
              </div>
            }
            placement="right"
            width={620}
            open={isForecastBOMDrawerOpen}
            onClose={() => setIsForecastBOMDrawerOpen(false)}
            footer={
              <div className="flex items-center justify-between p-2">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Allocated Portions
                  </p>
                  <p className="font-mono text-base font-black text-[#092968]">
                    {allocatedPortionsSum} / {currentDateForecast.demandingCount} Pax{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({selectedAllocatedCount} Dishes Selected)
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsForecastBOMDrawerOpen(false)}
                    className="h-11 rounded-xl px-4 font-bold"
                  >
                    Cancel
                  </Button>
                  <button
                    type="button"
                    onClick={handleCalculateAllocatedBOM}
                    className="active:scale-98 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F26E22] px-6 text-xs font-black text-white shadow-md hover:bg-[#d95a14]"
                  >
                    <Boxes size={16} />
                    <span>Calculate BOM ({allocatedPortionsSum} Portions)</span>
                  </button>
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              {/* Allocation Target Header Progress Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Target Predicted Demand
                    </p>
                    <p className="font-mono text-2xl font-black text-[#092968]">
                      {currentDateForecast.demandingCount} Covers
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Currently Allocated
                    </p>
                    <p
                      className={`font-mono text-2xl font-black ${
                        allocatedPortionsSum === currentDateForecast.demandingCount
                          ? 'text-emerald-600'
                          : allocatedPortionsSum > currentDateForecast.demandingCount
                            ? 'text-orange-600'
                            : 'text-[#092968]'
                      }`}
                    >
                      {allocatedPortionsSum} Pax
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-xs font-bold text-slate-600">
                    {allocatedPortionsSum === currentDateForecast.demandingCount ? (
                      <span className="text-emerald-600">✓ Exactly matches forecast demand</span>
                    ) : allocatedPortionsSum < currentDateForecast.demandingCount ? (
                      <span className="text-blue-600">
                        Remaining: {currentDateForecast.demandingCount - allocatedPortionsSum} portions
                      </span>
                    ) : (
                      <span className="text-orange-600">
                        Exceeds by +{allocatedPortionsSum - currentDateForecast.demandingCount} portions
                      </span>
                    )}
                  </span>

                  <Button
                    size="small"
                    onClick={handleAutoDistributeForecastPortions}
                    className="rounded-lg bg-orange-100 text-[11px] font-black text-[#F26E22] hover:bg-orange-200"
                  >
                    Auto-Distribute ({currentDateForecast.demandingCount} Pax)
                  </Button>
                </div>
              </div>

              {/* 1. SEARCHABLE FOOD ITEM SELECTOR FROM SYSTEM */}
              <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  Search & Pick Food Items from System:
                </label>
                <Select
                  showSearch
                  placeholder="Select food dish to add to allocation..."
                  value={null}
                  onChange={(val) => {
                    const found = availableAllocationFoodItems.find(
                      (f) => f.itemId === val,
                    );
                    if (found) {
                      setForecastFoodAllocations((prev) => {
                        if (prev.some((p) => p.itemId === val)) {
                          return prev.map((p) =>
                            p.itemId === val
                              ? {
                                  ...p,
                                  isSelected: true,
                                  portions: p.portions > 0 ? p.portions : 25,
                                }
                              : p,
                          );
                        }
                        return [
                          {
                            itemId: found.itemId,
                            name: found.name,
                            category: found.category,
                            unitPrice: found.unitPrice,
                            portions: 25,
                            isSelected: true,
                          },
                          ...prev,
                        ];
                      });
                      successToast(`Added "${found.name}" to allocation list!`);
                    }
                  }}
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  className="h-11 w-full rounded-xl text-xs font-bold"
                  options={availableAllocationFoodItems.map((f) => ({
                    value: f.itemId,
                    label: `${f.name} (${f.category}) - LKR ${f.unitPrice.toLocaleString()}`,
                  }))}
                />
              </div>

              {/* 2. ALLOCATED FOOD ITEMS LIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Allocated Menu Dishes ({forecastFoodAllocations.filter((f) => f.isSelected).length})
                  </p>
                  {forecastFoodAllocations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setForecastFoodAllocations([])}
                      className="text-[11px] font-bold text-rose-500 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                  {forecastFoodAllocations.filter((f) => f.isSelected).length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                      <Utensils size={32} className="text-slate-300" />
                      <p className="mt-2 text-xs font-bold text-slate-600">
                        No Food Items Selected Yet
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Pick items from the dropdown above or click Auto-Distribute to load recommended menu dishes.
                      </p>
                      <Button
                        size="small"
                        onClick={handleAutoDistributeForecastPortions}
                        className="mt-3 rounded-lg bg-[#092968] text-[11px] font-bold text-white hover:bg-[#0c3585]"
                      >
                        Auto-Select Top Dishes ({currentDateForecast.demandingCount} Pax)
                      </Button>
                    </div>
                  ) : (
                    forecastFoodAllocations
                      .filter((item) => item.isSelected)
                      .map((item) => (
                        <div
                          key={item.itemId}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-xs transition-all"
                        >
                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-spaceGrotesk text-xs font-extrabold text-[#092968]">
                              {item.name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <Tag color="orange" className="m-0 rounded-md text-[10px] font-bold">
                                {item.category}
                              </Tag>
                              <span className="text-[11px] font-semibold text-slate-400">
                                LKR {item.unitPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Stepper + Remove */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setForecastFoodAllocations((prev) =>
                                    prev.map((f) =>
                                      f.itemId === item.itemId
                                        ? { ...f, portions: Math.max(0, f.portions - 5) }
                                        : f,
                                    ),
                                  );
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white font-black text-slate-700 hover:bg-slate-100 active:scale-95"
                              >
                                <Minus size={12} />
                              </button>

                              <InputNumber
                                min={0}
                                max={1000}
                                value={item.portions}
                                onChange={(val) => {
                                  setForecastFoodAllocations((prev) =>
                                    prev.map((f) =>
                                      f.itemId === item.itemId
                                        ? { ...f, portions: Number(val) || 0 }
                                        : f,
                                    ),
                                  );
                                }}
                                className="w-18 font-mono text-center font-bold"
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  setForecastFoodAllocations((prev) =>
                                    prev.map((f) =>
                                      f.itemId === item.itemId
                                        ? { ...f, portions: f.portions + 5 }
                                        : f,
                                    ),
                                  );
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white font-black text-slate-700 hover:bg-slate-100 active:scale-95"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setForecastFoodAllocations((prev) =>
                                  prev.filter((f) => f.itemId !== item.itemId),
                                );
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </Drawer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ORDER DETAILS & FOOD ITEMS WITH BOM CALCULATION OPTION */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 pr-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#092968] text-white">
                <Utensils size={20} />
              </div>
              <div>
                <h3 className="font-spaceGrotesk text-lg font-black text-[#092968]">
                  Order Details & Food Items
                </h3>
                <p className="text-xs text-slate-400">
                  Order {selectedKdsTicket?.orderNumber} •{' '}
                  {selectedKdsTicket &&
                    dayjs(selectedKdsTicket.createdAt).format('DD MMM YYYY, hh:mm A')}
                </p>
              </div>
            </div>
            {selectedKdsTicket && (
              <Tag
                color={
                  selectedKdsTicket.status === 'READY'
                    ? 'success'
                    : selectedKdsTicket.status === 'PREPARING'
                      ? 'processing'
                      : selectedKdsTicket.status === 'SERVED'
                        ? 'default'
                        : 'warning'
                }
                className="rounded-lg px-3 py-1 text-xs font-bold"
              >
                {selectedKdsTicket.status}
              </Tag>
            )}
          </div>
        }
        open={isOrderModalOpen}
        onCancel={() => {
          setIsOrderModalOpen(false);
          setSelectedKdsTicket(null);
        }}
        footer={[
          <Button
            key="close"
            className="h-11 rounded-xl px-6 font-bold"
            onClick={() => {
              setIsOrderModalOpen(false);
              setSelectedKdsTicket(null);
            }}
          >
            Close
          </Button>,
          selectedKdsTicket?.status === 'PENDING' && (
            <button
              key="start-cooking"
              onClick={() => {
                fetchAndCalculateOrderBOM(selectedKdsTicket);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F26E22] px-6 text-xs font-bold text-white shadow-md hover:bg-[#d95a14] active:scale-95"
            >
              <Boxes size={16} />
              <span>Check BOM to Start Cooking</span>
            </button>
          ),
          selectedKdsTicket?.status === 'PREPARING' && (
            <button
              key="mark-ready"
              onClick={() => {
                handleAdvanceKdsStatus(selectedKdsTicket.id, 'READY');
                setIsOrderModalOpen(false);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#092968] px-6 text-xs font-bold text-white shadow-md hover:bg-[#0c3585] active:scale-95"
            >
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Mark Plated & Ready</span>
            </button>
          ),
          selectedKdsTicket?.status === 'READY' && (
            <button
              key="mark-served"
              onClick={() => {
                handleAdvanceKdsStatus(selectedKdsTicket.id, 'SERVED');
                setIsOrderModalOpen(false);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95"
            >
              <Check size={16} />
              <span>Dispatch / Picked Up</span>
            </button>
          ),
        ]}
        width={750}
        centered
      >
        {selectedKdsTicket && (
          <div className="space-y-4 py-2">
            {/* 1. Basic Order Details Top Card */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Customer / Table
                </p>
                <p className="mt-0.5 text-sm font-bold text-[#092968]">
                  {selectedKdsTicket.guestName}
                </p>
                {selectedKdsTicket.guestPhone && (
                  <p className="text-[11px] text-slate-500">
                    {selectedKdsTicket.guestPhone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Server Handler
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-800">
                  {selectedKdsTicket.serverName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedKdsTicket.serverRole || 'Staff'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Ordered Dishes
                </p>
                <p className="mt-0.5 font-mono text-sm font-extrabold text-[#F26E22]">
                  {selectedKdsTicket.items.length} Items (
                  {selectedKdsTicket.items.reduce((s, i) => s + (i.quantity || 1), 0)}{' '}
                  Portions)
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Total Bill
                </p>
                <p className="mt-0.5 font-mono text-sm font-black text-[#092968]">
                  LKR{' '}
                  {Number(selectedKdsTicket.totalAmount || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* 2. Middle Food Items Table */}
            <div>
              <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-600">
                Ordered Food Items Breakdown
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-extrabold uppercase text-slate-600">
                      <th className="px-3 py-3">Item / Dish</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3 text-center">Portions</th>
                      <th className="px-3 py-3 text-right">Unit Price</th>
                      <th className="px-3 py-3 text-right">Subtotal</th>
                      <th className="px-3 py-3 text-center">Station</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedKdsTicket.items.map((item: any, idx: number) => {
                      const price = item.unitPrice || 0;
                      const qty = item.quantity || 1;
                      const subtotal = price * qty;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-3 font-bold text-[#092968]">
                            {item.name}
                          </td>
                          <td className="px-3 py-3 text-slate-500">
                            {item.category || 'Main Dish'}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-sm font-black text-[#F26E22]">
                            {qty}×
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-slate-600">
                            LKR{' '}
                            {Number(price).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-black text-[#092968]">
                            LKR{' '}
                            {Number(subtotal).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Tag
                              color="orange"
                              className="m-0 rounded-md text-[10px] font-bold"
                            >
                              Kitchen Prep
                            </Tag>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Bottom Action: Check and Calculate BOM */}
            <div className="pt-2">
              <button
                onClick={() => {
                  fetchAndCalculateOrderBOM(selectedKdsTicket);
                }}
                className="active:scale-98 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#092968] text-sm font-extrabold text-white shadow-md transition-all hover:bg-[#0c3585]"
              >
                <Boxes size={18} className="text-orange-400" />
                <span>Check & Calculate BOM (Recipe Raw Materials)</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 1: BOM CALCULATION MODAL (FROM BULK MEALS & KDS ORDERS) */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 pr-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[#F26E22]">
                <Boxes size={20} />
              </div>
              <div>
                <h3 className="font-spaceGrotesk text-lg font-black text-[#092968]">
                  {selectedBulkItem?.orderNumber
                    ? `Order ${selectedBulkItem.orderNumber} • BOM Recipe Calculation`
                    : 'BOM Raw Material Breakdown'}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedBulkItem?.orderNumber
                    ? `Recipe & Stock Breakdown for ${selectedBulkItem?.portionCount} Portions (${selectedBulkItem?.items?.length || 1} Dishes)`
                    : `Calculated Recipe Quantities for ${selectedBulkItem?.dishName} (${selectedBulkItem?.portionCount} Portions)`}
                </p>
              </div>
            </div>

            {/* Print & Download Action Buttons in Header */}
            {!isCalculatingOrderBOM && (
              <div className="flex items-center gap-2">
                <Button
                  icon={<Printer size={14} />}
                  onClick={() => handlePrintBOMDetails('bom-calculation-modal-content')}
                  className="flex h-8 items-center gap-1.5 rounded-lg text-xs font-bold text-slate-700 hover:border-[#092968] hover:text-[#092968]"
                >
                  Print
                </Button>
                <Button
                  icon={<Download size={14} />}
                  loading={isDownloadingBOMPDF}
                  onClick={() => handleDownloadBOMPDF('bom-calculation-modal-content')}
                  className="flex h-8 items-center gap-1.5 rounded-lg text-xs font-bold text-slate-700 hover:border-[#092968] hover:text-[#092968]"
                >
                  PDF
                </Button>
              </div>
            )}
          </div>
        }
        open={bomModalOpen}
        onCancel={() => {
          setBomModalOpen(false);
          setSelectedBulkItem(null);
          setOrderBOMResults([]);
        }}
        footer={[
          selectedBulkItem?.orderTicketId ? (
            <Button
              key="back-to-order"
              className="h-11 rounded-xl px-5 font-bold"
              onClick={() => {
                setBomModalOpen(false);
                setIsOrderModalOpen(true);
              }}
            >
              Back to Order Details
            </Button>
          ) : (
            <Button
              key="close"
              className="h-11 rounded-xl px-6 font-bold"
              onClick={() => {
                setBomModalOpen(false);
                setSelectedBulkItem(null);
              }}
            >
              Close
            </Button>
          ),
         
          selectedBulkItem?.orderTicketId ? (
            <Button
              key="confirm-start-cooking"
              disabled={isLoggingBOMAndStarting}
              onClick={handleConfirmBOMAndStartCooking}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F26E22] px-6 text-xs font-bold text-white shadow-md hover:bg-[#d95a14] active:scale-95 disabled:opacity-60"
            >
              <Flame
                size={16}
                className={isLoggingBOMAndStarting ? 'animate-spin' : ''}
              />
              <span>
                {isLoggingBOMAndStarting
                  ? 'Logging BOM & Starting...'
                  : 'Start Cooking (BOM Approved)'}
              </span>
            </Button>
          ) : (
            <button
              key="print"
              onClick={() => {
                successToast('Kitchen Prep KOT dispatched to pantry station!');
                setBomModalOpen(false);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F26E22] px-6 text-xs font-bold text-white shadow-md hover:bg-[#d95a14] active:scale-95"
            >
              <Send size={16} />
              <span>Print Kitchen Prep Slip</span>
            </button>
          ),
        ]}
        width={780}
        centered
      >
        {/* If Order BOM is calculating */}
        {isCalculatingOrderBOM ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spin size="large" />
            <p className="mt-4 font-spaceGrotesk text-sm font-black text-[#092968]">
              Calculating Recipe BOM with Live Inventory...
            </p>
            <p className="text-xs text-slate-400">
              Querying raw material warehouse stocks and portion requirements
            </p>
          </div>
        ) : selectedBulkItem?.orderTicketId && orderBOMResults.length > 0 ? (
          <div id="bom-calculation-modal-content" className="max-h-[68vh] space-y-4 overflow-y-auto pr-1 py-1">
            {/* Top Summary Bar */}
            {orderBOMSummary && (
              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Target Portions
                  </p>
                  <p className="font-mono text-xl font-black text-[#092968]">
                    {orderBOMSummary.totalPortions} Pax{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({orderBOMSummary.totalDishes}{' '}
                      {orderBOMSummary.totalDishes === 1 ? 'Dish' : 'Dishes'})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Raw Materials Needed
                  </p>
                  <p className="font-mono text-xl font-black text-[#F26E22]">
                    {orderBOMSummary.totalRawMaterialsCount} Items
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Inventory Shortages
                  </p>
                  <p
                    className={`font-mono text-xl font-black ${
                      orderBOMSummary.totalShortagesCount === 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {orderBOMSummary.totalShortagesCount === 0
                      ? 'All In Stock ✓'
                      : `${orderBOMSummary.totalShortagesCount} Shortage!`}
                  </p>
                </div>
              </div>
            )}

            {/* SEPARATED FOOD ITEMS LIST */}
            <div className="space-y-4">
              {orderBOMResults.map((dish, dishIdx) => {
                const dishShortages =
                  dish.rawMaterialDetails?.filter((m) => m.isShortage).length || 0;
                return (
                  <div
                    key={dish.ItemId || dish.itemId || dishIdx}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Food Item Header Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#092968] text-xs font-bold text-white">
                          <Utensils size={14} />
                        </div>
                        <div>
                          <h4 className="font-spaceGrotesk text-sm font-extrabold text-[#092968]">
                            {dish.itemName}
                          </h4>
                          <p className="text-[11px] font-semibold text-slate-400">
                            {dish.rawMaterialDetails?.length || 0} Recipe Ingredients
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag
                          color="orange"
                          className="m-0 rounded-lg px-2.5 py-0.5 font-mono text-xs font-extrabold"
                        >
                          {dish.required_quantity}× Portions
                        </Tag>
                        {dishShortages > 0 ? (
                          <Tag
                            color="error"
                            className="m-0 rounded-lg px-2 py-0.5 text-[10px] font-bold"
                          >
                            {dishShortages} Shortage
                          </Tag>
                        ) : (
                          <Tag
                            color="success"
                            className="m-0 rounded-lg px-2 py-0.5 text-[10px] font-bold"
                          >
                            Ready in Stock ✓
                          </Tag>
                        )}
                      </div>
                    </div>

                    {/* Raw Materials Table for this Dish */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/60 text-[10px] font-extrabold uppercase text-slate-500">
                            <th className="px-3.5 py-2">Raw Material</th>
                            <th className="px-3.5 py-2">Per Portion</th>
                            <th className="px-3.5 py-2">Total Required</th>
                            <th className="px-3.5 py-2">Warehouse Stock</th>
                            <th className="px-3.5 py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dish.rawMaterialDetails?.map((mat, mIdx) => (
                            <tr key={mIdx} className="hover:bg-slate-50/70">
                              <td className="px-3.5 py-2.5 font-bold text-[#092968]">
                                {mat.materialName}
                                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                                  {mat.category || 'GENERAL'}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 font-mono text-slate-500">
                                {mat.qtyPerPerson} {mat.unitOfMeasure}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-black text-[#F26E22]">
                                {mat.totalRequiredQty} {mat.unitOfMeasure}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono text-slate-700">
                                {mat.quantityOnHand} {mat.unitOfMeasure}
                              </td>
                              <td className="px-3.5 py-2.5 text-right">
                                {mat.isShortage ? (
                                  <Tag
                                    color="error"
                                    className="m-0 rounded-md text-[10px] font-bold"
                                  >
                                    Shortage ({mat.shortageQty} {mat.unitOfMeasure})
                                  </Tag>
                                ) : (
                                  <Tag
                                    color="success"
                                    className="m-0 rounded-md text-[10px] font-bold"
                                  >
                                    {mat.status || 'In Stock'}
                                  </Tag>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          currentBOMBreakdown && (
            <div id="bom-calculation-modal-content" className="space-y-4 py-3">
              {/* Summary Bar */}
              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Target Portions
                  </p>
                  <p className="font-mono text-xl font-black text-[#092968]">
                    {currentBOMBreakdown.portions} Pax
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Raw Materials Needed
                  </p>
                  <p className="font-mono text-xl font-black text-[#F26E22]">
                    {currentBOMBreakdown.totalRawMaterialsCount} Items
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Inventory Shortages
                  </p>
                  <p className="font-mono text-xl font-black text-emerald-600">
                    {currentBOMBreakdown.shortageMaterialsCount === 0
                      ? 'All In Stock ✓'
                      : `${currentBOMBreakdown.shortageMaterialsCount} Shortage!`}
                  </p>
                </div>
              </div>

              {/* Materials Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-extrabold uppercase text-slate-600">
                      <th className="px-3 py-2.5">Raw Material</th>
                      <th className="px-3 py-2.5">Per Portion</th>
                      <th className="px-3 py-2.5">Total Required</th>
                      <th className="px-3 py-2.5">Warehouse Stock</th>
                      <th className="px-3 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentBOMBreakdown.materials.map((mat, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-[#092968]">
                          {mat.materialName}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-500">
                          {mat.qtyPerPerson} {mat.unitOfMeasure}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-black text-[#F26E22]">
                          {mat.totalRequiredQty} {mat.unitOfMeasure}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          {mat.quantityOnHand} {mat.unitOfMeasure}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {mat.isShortage ? (
                            <Tag
                              color="error"
                              className="rounded-md text-[10px] font-bold"
                            >
                              Shortage ({mat.shortageQty} {mat.unitOfMeasure})
                            </Tag>
                          ) : (
                            <Tag
                              color="success"
                              className="rounded-md text-[10px] font-bold"
                            >
                              In Stock
                            </Tag>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: AI BOM INVENTORY READINESS MODAL */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[#F26E22]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-black text-[#092968]">
                AI Predicted BOM Readiness Check
              </h3>
              <p className="text-xs text-slate-400">
                {aiBOMCheckModal?.itemName} • Forecast Demand:{' '}
                {aiBOMCheckModal?.predictedPortions} Portions
              </p>
            </div>
          </div>
        }
        open={Boolean(aiBOMCheckModal)}
        onCancel={() => setAiBOMCheckModal(null)}
        footer={[
          <Button
            key="close"
            className="h-11 rounded-xl px-6 font-bold"
            onClick={() => setAiBOMCheckModal(null)}
          >
            Close
          </Button>,
          selectedAIPredictedBOM?.shortageMaterialsCount &&
          selectedAIPredictedBOM.shortageMaterialsCount > 0 ? (
            <button
              key="req"
              onClick={() => {
                setIsRequisitionSent(true);
                successToast('Auto Purchase Requisition sent to Store Manager!');
              }}
              disabled={isRequisitionSent}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 disabled:opacity-50"
            >
              <AlertTriangle size={16} />
              <span>
                {isRequisitionSent
                  ? 'Requisition Sent ✓'
                  : 'Auto-Generate Stock Requisition'}
              </span>
            </button>
          ) : (
            <button
              key="ok"
              onClick={() => setAiBOMCheckModal(null)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#092968] px-6 text-xs font-bold text-white shadow-md hover:bg-[#0c3585] active:scale-95"
            >
              <CheckCircle2 size={16} />
              <span>Inventory Ready for Morning Prep</span>
            </button>
          ),
        ]}
        width={720}
        centered
      >
        {selectedAIPredictedBOM && (
          <div className="space-y-4 py-3">
            {/* Warning or Success Alert Box */}
            {selectedAIPredictedBOM.shortageMaterialsCount > 0 ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <AlertTriangle size={24} className="mt-0.5 shrink-0 text-rose-600" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900">
                    Stock Insufficiency Detected for Tomorrow's Demand!
                  </h4>
                  <p className="mt-0.5 text-xs text-rose-700">
                    {selectedAIPredictedBOM.shortageMaterialsCount} raw ingredients are
                    below the required quantity. Please requisition replenishment today
                    before dinner prep ends.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 size={24} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    Warehouse Inventory Fully Sufficient!
                  </h4>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    All required raw ingredients for {selectedAIPredictedBOM.portions}{' '}
                    portions are available in stock.
                  </p>
                </div>
              </div>
            )}

            {/* Raw Material Breakdown Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-extrabold uppercase text-slate-600">
                    <th className="px-3 py-2.5">Raw Material</th>
                    <th className="px-3 py-2.5">Per Portion</th>
                    <th className="px-3 py-2.5">Forecasted Total Required</th>
                    <th className="px-3 py-2.5">Warehouse Stock on Hand</th>
                    <th className="px-3 py-2.5 text-right">Readiness Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedAIPredictedBOM.materials.map((mat, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-[#092968]">
                        {mat.materialName}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-500">
                        {mat.qtyPerPerson} {mat.unitOfMeasure}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-black text-[#F26E22]">
                        {mat.totalRequiredQty} {mat.unitOfMeasure}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-800">
                        {mat.quantityOnHand} {mat.unitOfMeasure}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {mat.isShortage ? (
                          <Tag color="error" className="rounded-md text-[10px] font-bold">
                            ⚠️ Shortage (-{mat.shortageQty} {mat.unitOfMeasure})
                          </Tag>
                        ) : (
                          <Tag
                            color="success"
                            className="rounded-md text-[10px] font-bold"
                          >
                            ✓ Sufficient
                          </Tag>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW PRODUCTION LOG INGREDIENTS BREAKDOWN */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#092968]">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-black text-[#092968]">
                Production Log Batch Details
              </h3>
              <p className="text-xs text-slate-400">
                Batch Code: {viewLogDetailModal?.batchCode} •{' '}
                {viewLogDetailModal?.itemName}
              </p>
            </div>
          </div>
        }
        open={Boolean(viewLogDetailModal)}
        onCancel={() => setViewLogDetailModal(null)}
        footer={[
          <Button
            key="close"
            className="h-11 rounded-xl px-6 font-bold"
            onClick={() => setViewLogDetailModal(null)}
          >
            Close
          </Button>,
        ]}
        width={600}
        centered
      >
        {viewLogDetailModal && (
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
              <div>
                <p className="font-semibold text-slate-400">Portions Cooked</p>
                <p className="font-mono text-lg font-black text-[#F26E22]">
                  {viewLogDetailModal.portionsCooked} Portions
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-400">Logged By</p>
                <p className="text-sm font-bold text-[#092968]">
                  {viewLogDetailModal.loggedByChef}
                </p>
                <p className="text-[11px] text-slate-400">
                  {viewLogDetailModal.date} at {viewLogDetailModal.time}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Raw Materials Deducted from Stock
              </h4>
              <div className="space-y-2">
                {viewLogDetailModal.deductedMaterials.map((mat, i) => (
                  <div
                    key={i}
                    className="shadow-xs flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <span className="text-xs font-bold text-[#092968]">
                      {mat.materialName}
                    </span>
                    <span className="font-mono text-xs font-black text-[#F26E22]">
                      -{mat.deductedQty} {mat.unitOfMeasure}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChefOperationsDesk;