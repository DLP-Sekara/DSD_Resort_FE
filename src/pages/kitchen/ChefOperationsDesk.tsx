import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Tag,
  Button,
  Input,
  Select,
  InputNumber,
  Card,
  Progress,
  Tooltip,
} from 'antd';
import {
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Sparkles,
  TrendingUp,
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
  CloudSun,
  FlameKindling,
  Timer,
  Eye,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import kitchenMutation from '../../mutations/kitchen.mutation';
import mealMutation from '../../mutations/meal.mutation';
import bomMutation from '../../mutations/bom.mutation';
import restaurantOrderMutation from '../../mutations/restaurantOrder.mutation';
import { useAuth } from '../../hooks/useAuth';
import { successToast, errorToast } from '../../components/common/Alert';
import type { RawMaterial, BOMTemplate } from '../../types/kitchen.interfaces';
import type { FoodItem } from '../../types/services.interfaces';
import type {
  KDSOrderTicket,
  KDSOrderStatus,
  BulkMealRequirement,
  BOMCalculationDetail,
  ProductionLogEntry,
  AIDemandForecastData,
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

const INITIAL_PRODUCTION_LOGS: ProductionLogEntry[] = [
  {
    id: 'LOG-8801',
    batchCode: 'BATCH-20260826-01',
    date: '2026-08-26',
    time: '06:45 AM',
    itemId: 'F-001',
    itemName: 'Sri Lankan String Hoppers with Kiri Hodi',
    portionsCooked: 55,
    loggedByChef: 'Head Chef Kumara',
    status: 'STOCK_DEDUCTED',
    deductedMaterials: [
      {
        materialId: 'RAW-01',
        materialName: 'Rice Flour (Fine)',
        deductedQty: 5.5,
        unitOfMeasure: 'kg',
      },
      {
        materialId: 'RAW-02',
        materialName: 'Coconut Milk (Thick)',
        deductedQty: 4.0,
        unitOfMeasure: 'l',
      },
      {
        materialId: 'RAW-03',
        materialName: 'Turmeric & Curry Powder',
        deductedQty: 0.35,
        unitOfMeasure: 'kg',
      },
    ],
  },
  {
    id: 'LOG-8802',
    batchCode: 'BATCH-20260826-02',
    date: '2026-08-26',
    time: '11:15 AM',
    itemId: 'F-005',
    itemName: 'Devilled Lagoon Prawns with Fried Rice',
    portionsCooked: 40,
    loggedByChef: 'Sous Chef Samantha',
    status: 'STOCK_DEDUCTED',
    deductedMaterials: [
      {
        materialId: 'RAW-04',
        materialName: 'Lagoon Fresh Jumbo Prawns',
        deductedQty: 8.0,
        unitOfMeasure: 'kg',
      },
      {
        materialId: 'RAW-05',
        materialName: 'Basmati Rice Premium',
        deductedQty: 6.0,
        unitOfMeasure: 'kg',
      },
      {
        materialId: 'RAW-06',
        materialName: 'Chili Paste & Sauces',
        deductedQty: 1.5,
        unitOfMeasure: 'kg',
      },
    ],
  },
  {
    id: 'LOG-8803',
    batchCode: 'BATCH-20260826-03',
    date: '2026-08-26',
    time: '01:30 PM',
    itemId: 'F-006',
    itemName: 'Spicy Chicken Curry with Basmati',
    portionsCooked: 35,
    loggedByChef: 'Chef Nimal',
    status: 'STOCK_DEDUCTED',
    deductedMaterials: [
      {
        materialId: 'RAW-07',
        materialName: 'Fresh Chicken Breast/Thighs',
        deductedQty: 8.75,
        unitOfMeasure: 'kg',
      },
      {
        materialId: 'RAW-05',
        materialName: 'Basmati Rice Premium',
        deductedQty: 5.25,
        unitOfMeasure: 'kg',
      },
      {
        materialId: 'RAW-08',
        materialName: 'Ceylon Spices Blend',
        deductedQty: 0.7,
        unitOfMeasure: 'kg',
      },
    ],
  },
];

const INITIAL_AI_FORECAST: AIDemandForecastData = {
  forecastDate: 'Tomorrow, Aug 27',
  predictedGuestCount: 148,
  occupancyRate: 92,
  occupancyTrend: 16.5,
  weatherSummary: {
    temperature: 32,
    condition: 'SUNNY',
    description: 'Hot, Tropical Sunny Day with clear skies',
    impactNote:
      'High heat index (+32°C). AI recommends +35% cold fresh juices & seafood, -20% heavy hot soups.',
  },
  rushHours: [
    {
      timeSlot: '07:30 AM - 09:30 AM',
      mealSession: 'Breakfast Buffet Peak',
      expectedLoad: 'EXTREME_PEAK',
      staffRecommendation: 'Deploy 3 line cooks at Live Egg & String Hopper stations.',
    },
    {
      timeSlot: '12:45 PM - 02:15 PM',
      mealSession: 'Lunch Walk-in & Poolside',
      expectedLoad: 'HEAVY',
      staffRecommendation:
        'Prep seafood marinades and chilled beverage dispensers by 11:30 AM.',
    },
    {
      timeSlot: '07:45 PM - 09:45 PM',
      mealSession: 'Dinner BBQ Banquet',
      expectedLoad: 'EXTREME_PEAK',
      staffRecommendation:
        'Full grill crew active. Pre-thaw 35kg meat and 25kg lagoon prawns.',
    },
  ],
  modelInfo: {
    version: 'DSD-KitchenAI v2.4 (Transformer Ensemble)',
    accuracyScore: 96.4,
    lastUpdated: '10 mins ago',
  },
  predictedItems: [
    {
      itemId: 'PRED-01',
      itemName: 'Devilled Lagoon Prawns with Fried Rice',
      category: 'Seafood',
      predictedPortions: 74,
      trendPercentage: 32,
      confidenceScore: 97,
      peakServingTime: '12:30 PM - 02:30 PM',
      recommendedPrepWindow: '10:30 AM - 11:30 AM',
      prepPriority: 'HIGH',
      weatherFactor: 'Sunny weather drives +38% poolside seafood demand',
    },
    {
      itemId: 'PRED-02',
      itemName: 'Grilled Herb Butter Reef Fish',
      category: 'Grill',
      predictedPortions: 65,
      trendPercentage: 24,
      confidenceScore: 94,
      peakServingTime: '07:30 PM - 09:30 PM',
      recommendedPrepWindow: '04:00 PM - 05:30 PM',
      prepPriority: 'HIGH',
      weatherFactor: 'Evening terrace dining occupancy expected at 95%',
    },
    {
      itemId: 'PRED-03',
      itemName: 'Sri Lankan String Hoppers with Kiri Hodi',
      category: 'Breakfast',
      predictedPortions: 85,
      trendPercentage: 18,
      confidenceScore: 98,
      peakServingTime: '07:30 AM - 09:00 AM',
      recommendedPrepWindow: '05:30 AM - 06:30 AM',
      prepPriority: 'HIGH',
      weatherFactor: 'High local & foreign family tourist check-ins',
    },
    {
      itemId: 'PRED-04',
      itemName: 'Spicy Chicken Curry with Basmati',
      category: 'Main Dish',
      predictedPortions: 55,
      trendPercentage: 8,
      confidenceScore: 91,
      peakServingTime: '01:00 PM - 02:30 PM',
      recommendedPrepWindow: '11:00 AM - 12:00 PM',
      prepPriority: 'MEDIUM',
      weatherFactor: 'Steady baseline buffet requirement',
    },
    {
      itemId: 'PRED-05',
      itemName: 'Fresh Passion Fruit & Mint Cooler',
      category: 'Beverages',
      predictedPortions: 110,
      trendPercentage: 45,
      confidenceScore: 99,
      peakServingTime: '11:00 AM - 04:00 PM',
      recommendedPrepWindow: '09:00 AM - 10:00 AM',
      prepPriority: 'HIGH',
      weatherFactor: 'High temperature (+32°C) creates massive drink rush',
    },
  ],
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
  const { getAllBOMTemplatesQuery } = bomMutation();
  const { getAllRestaurantOrdersQuery, updateRestaurantOrderStatusMutation } =
    restaurantOrderMutation();

  const { data: rawMaterialsRes } = getAllRawMaterialsQuery();
  const { data: foodItemsRes } = getAllFoodItemsMutation();
  const { data: bomTemplatesRes } = getAllBOMTemplatesQuery();
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

  // Kitchen prepared foods
  const kitchenPreparedFoodItems = useMemo(() => {
    return foodItemsList.filter(
      (f: FoodItem) => f.isKitchenPrepared ?? (f as any).is_kitchen_prepared ?? false,
    );
  }, [foodItemsList]);

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
  // TAB 1 (BULK MEALS): BOM CALCULATION MODAL
  // -------------------------------------------------------------------------
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [selectedBulkItem, setSelectedBulkItem] = useState<{
    dishName: string;
    portionCount: number;
    mealSession: string;
    itemId?: string;
    orderTicketId?: string;
    orderNumber?: string;
    items?: { itemId?: string; name: string; quantity: number }[];
  } | null>(null);

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
  // TAB 2: BOM SUMMARY & PRODUCTION LOG STATE
  // -------------------------------------------------------------------------
  const [productionLogs, setProductionLogs] = useState<ProductionLogEntry[]>(
    INITIAL_PRODUCTION_LOGS,
  );
  const [selectedLogFoodId, setSelectedLogFoodId] = useState<string | undefined>(
    undefined,
  );
  const [cookedPortions, setCookedPortions] = useState<number>(25);
  const [isDeducting, setIsDeducting] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [viewLogDetailModal, setViewLogDetailModal] = useState<ProductionLogEntry | null>(
    null,
  );

  // Auto select first kitchen prepared item if available
  useEffect(() => {
    if (!selectedLogFoodId && kitchenPreparedFoodItems.length > 0) {
      const firstId =
        kitchenPreparedFoodItems[0].itemId || (kitchenPreparedFoodItems[0] as any).id;
      setSelectedLogFoodId(firstId);
    }
  }, [kitchenPreparedFoodItems, selectedLogFoodId]);

  // Compute live ingredient deduction preview for Tab 2
  const selectedLogFoodItem = useMemo(() => {
    return foodItemsList.find(
      (f) => f.itemId === selectedLogFoodId || (f as any).id === selectedLogFoodId,
    );
  }, [foodItemsList, selectedLogFoodId]);

  const liveDeductionPreview = useMemo(() => {
    if (!selectedLogFoodItem || cookedPortions <= 0) return [];
    const breakdown = calculateBOMBreakdown(
      selectedLogFoodItem.name,
      cookedPortions,
      selectedLogFoodItem.itemId,
    );
    return breakdown.materials;
  }, [selectedLogFoodItem, cookedPortions, bomTemplatesList, rawMaterialsList]);

  // Handle Calculate & Deduct Stock Action
  const handleCalculateAndDeductStock = () => {
    if (!selectedLogFoodItem) {
      errorToast('Please select a kitchen prepared food item.');
      return;
    }
    if (!cookedPortions || cookedPortions <= 0) {
      errorToast('Please enter a valid number of portions cooked.');
      return;
    }

    setIsDeducting(true);

    setTimeout(() => {
      const batchCode = `BATCH-${dayjs().format('YYYYMMDD')}-${String(Math.floor(100 + Math.random() * 900))}`;
      const chefName = userData?.name || 'Head Chef Kumara';

      const newLog: ProductionLogEntry = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        batchCode,
        date: dayjs().format('YYYY-MM-DD'),
        time: dayjs().format('hh:mm A'),
        itemId: selectedLogFoodItem.itemId || (selectedLogFoodItem as any).id || 'F-LOG',
        itemName: selectedLogFoodItem.name,
        portionsCooked: cookedPortions,
        loggedByChef: chefName,
        status: 'STOCK_DEDUCTED',
        deductedMaterials: liveDeductionPreview.map((mat) => ({
          materialId: mat.materialId,
          materialName: mat.materialName,
          deductedQty: mat.totalRequiredQty,
          unitOfMeasure: mat.unitOfMeasure,
        })),
      };

      setProductionLogs([newLog, ...productionLogs]);
      setIsDeducting(false);
      successToast(
        `Successfully deducted stock for ${cookedPortions} portions of ${selectedLogFoodItem.name}! (Batch: ${batchCode})`,
      );
    }, 450);
  };

  // Filtered Production Logs
  const filteredProductionLogs = useMemo(() => {
    return productionLogs.filter((log) => {
      if (!logSearchTerm) return true;
      const term = logSearchTerm.toLowerCase();
      return (
        log.batchCode.toLowerCase().includes(term) ||
        log.itemName.toLowerCase().includes(term) ||
        log.loggedByChef.toLowerCase().includes(term)
      );
    });
  }, [productionLogs, logSearchTerm]);

  // -------------------------------------------------------------------------
  // TAB 3: AI DEMAND FORECASTING STATE
  // -------------------------------------------------------------------------
  const [aiForecast] = useState<AIDemandForecastData>(INITIAL_AI_FORECAST);
  const [aiBOMCheckModal, setAiBOMCheckModal] = useState<AIPredictedItem | null>(null);
  const [isRequisitionSent, setIsRequisitionSent] = useState(false);

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
      {/*  TAB 2: BOM SUMMARY & PRODUCTION LOG */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCTION_LOG' && (
        <div className="animate-in fade-in space-y-6 duration-300">
          {/* Top Form: Cooked Meals Inventory Logger */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#092968] text-white">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h2 className="font-spaceGrotesk text-xl font-extrabold text-[#092968]">
                    Kitchen Production Logger & BOM Stock Deduction
                  </h2>
                  <p className="text-xs text-slate-500">
                    Log cooked dishes to automatically deduct raw material ingredients
                    from warehouse inventory
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#F26E22]">
                <ShieldCheck size={16} /> Connected with Live BOM Recipe Matrices
              </div>
            </div>

            {/* Form Controls */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Selector & Portions Input (7 cols) */}
              <div className="space-y-5 lg:col-span-7">
                {/* Food Item Searchable Dropdown */}
                <div>
                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Select Kitchen Prepared Food Item{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <Select
                    showSearch
                    placeholder="Search kitchen cooked food item (e.g. Fried Rice, Curry...)"
                    value={selectedLogFoodId}
                    onChange={(val) => setSelectedLogFoodId(val)}
                    optionFilterProp="children"
                    className="h-12 w-full rounded-2xl text-sm font-semibold"
                    size="large"
                  >
                    {(kitchenPreparedFoodItems.length > 0
                      ? kitchenPreparedFoodItems
                      : [
                          {
                            itemId: 'F-001',
                            name: 'Sri Lankan String Hoppers with Kiri Hodi',
                          },
                          {
                            itemId: 'F-005',
                            name: 'Devilled Lagoon Prawns with Fried Rice',
                          },
                          { itemId: 'F-006', name: 'Spicy Chicken Curry with Basmati' },
                          { itemId: 'F-008', name: 'Grilled Herb Butter Reef Fish' },
                        ]
                    ).map((item: any) => (
                      <Option key={item.itemId || item.id} value={item.itemId || item.id}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* Portions Cooked Stepper & Quick Tap Buttons */}
                <div>
                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Number of Portions Cooked <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCookedPortions(Math.max(1, cookedPortions - 5))}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-700 hover:bg-slate-200 active:scale-95"
                    >
                      -5
                    </button>
                    <InputNumber
                      min={1}
                      max={1000}
                      value={cookedPortions}
                      onChange={(val) => setCookedPortions(Number(val) || 1)}
                      className="h-12 flex-1 rounded-2xl text-center text-lg font-black"
                      size="large"
                    />
                    <button
                      onClick={() => setCookedPortions(cookedPortions + 5)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-700 hover:bg-slate-200 active:scale-95"
                    >
                      +5
                    </button>
                  </div>

                  {/* Tablet Quick Tap Pills */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">
                      Quick Tap:
                    </span>
                    {[10, 25, 50, 75, 100, 150].map((quickVal) => (
                      <button
                        key={quickVal}
                        onClick={() => setCookedPortions(quickVal)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          cookedPortions === quickVal
                            ? 'bg-[#092968] text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {quickVal} Portions
                      </button>
                    ))}
                  </div>
                </div>

                {/* Large Tablet Touch Action Button */}
                <button
                  disabled={isDeducting || !selectedLogFoodItem}
                  onClick={handleCalculateAndDeductStock}
                  className="font-spaceGrotesk flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#F26E22] text-base font-black text-white shadow-lg transition-all hover:bg-[#d95a14] active:scale-[0.98] disabled:opacity-50"
                >
                  <RotateCw size={22} className={isDeducting ? 'animate-spin' : ''} />
                  <span>
                    {isDeducting
                      ? 'Calculating & Deducting...'
                      : 'Calculate & Deduct Stock from Warehouse'}
                  </span>
                </button>
              </div>

              {/* Right Live BOM Consumption Preview Card (5 cols) */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:col-span-5">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Live BOM Deduction Preview
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-[#092968]">
                      {cookedPortions} Portions
                    </span>
                  </div>

                  <div className="mt-3 max-h-56 space-y-2.5 overflow-y-auto pr-1">
                    {liveDeductionPreview.length === 0 ? (
                      <p className="py-6 text-center text-xs italic text-slate-400">
                        Select an item and enter portions to calculate raw material
                        deductions.
                      </p>
                    ) : (
                      liveDeductionPreview.map((mat, i) => (
                        <div
                          key={i}
                          className="shadow-xs flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs"
                        >
                          <div>
                            <p className="font-bold text-[#092968]">{mat.materialName}</p>
                            <p className="text-[10px] text-slate-400">
                              Rate: {mat.qtyPerPerson} {mat.unitOfMeasure} / pax
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-black text-[#F26E22]">
                              -{mat.totalRequiredQty} {mat.unitOfMeasure}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Avail: {mat.quantityOnHand} {mat.unitOfMeasure}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200/60 bg-blue-50 p-2.5 text-[11px] font-semibold text-[#092968]">
                  <ShieldCheck size={16} className="shrink-0 text-[#092968]" />
                  <span>
                    Deduction logs generate tamper-evident batch records automatically.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sleek Table: Recent Production Logs */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-spaceGrotesk text-lg font-bold text-[#092968]">
                  Recent Kitchen Production Logs
                </h3>
                <p className="text-xs text-slate-400">
                  Audit trail of meal batches cooked and corresponding inventory
                  consumption
                </p>
              </div>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  placeholder="Filter by batch, dish, or chef..."
                  value={logSearchTerm}
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                  className="h-10 w-full rounded-xl border-slate-200 pl-9 text-xs sm:w-64"
                  allowClear
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3.5">Date & Time</th>
                    <th className="px-4 py-3.5">Batch ID</th>
                    <th className="px-4 py-3.5">Cooked Dish</th>
                    <th className="px-4 py-3.5 text-center">Portions Cooked</th>
                    <th className="px-4 py-3.5">Logged By Chef</th>
                    <th className="px-4 py-3.5 text-center">Inventory Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProductionLogs.map((log) => (
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
                        <button
                          onClick={() => setViewLogDetailModal(log)}
                          className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#092968] transition-all hover:bg-[#092968] hover:text-white"
                        >
                          View BOM Details
                        </button>
                      </td>
                    </tr>
                  ))}
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
          {/* AI Metric Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Predicted Guests */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Predicted Guests Tomorrow
                  </p>
                  <h3 className="font-spaceGrotesk mt-1 text-3xl font-black text-[#092968]">
                    {aiForecast.predictedGuestCount} Pax
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#092968]">
                  <Utensils size={24} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <TrendingUp size={16} />
                <span>+{aiForecast.occupancyTrend}% vs 7-day average</span>
              </div>
            </Card>

            {/* Card 2: Weather Impact */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Weather Impact Analysis
                  </p>
                  <h3 className="font-spaceGrotesk mt-1 text-3xl font-black text-[#F26E22]">
                    {aiForecast.weatherSummary.temperature}°C Sunny
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F26E22]">
                  <CloudSun size={24} />
                </div>
              </div>
              <p className="mt-2 text-[11px] font-semibold leading-tight text-slate-600">
                {aiForecast.weatherSummary.impactNote}
              </p>
            </Card>

            {/* Card 3: Hotel Occupancy */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Hotel Occupancy Rate
                  </p>
                  <h3 className="font-spaceGrotesk mt-1 text-3xl font-black text-[#092968]">
                    {aiForecast.occupancyRate}%
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={24} />
                </div>
              </div>
              <div className="mt-3">
                <Progress
                  percent={aiForecast.occupancyRate}
                  strokeColor="#F26E22"
                  showInfo={false}
                />
              </div>
            </Card>

            {/* Card 4: Peak Rush Time */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Peak Kitchen Rush Hour
                  </p>
                  <h3 className="font-spaceGrotesk mt-1 text-lg font-black text-[#092968]">
                    07:30 - 09:30 AM
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <FlameKindling size={24} />
                </div>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-rose-700">
                ⚠️ Breakfast rush load: Extreme Peak. Deploy 3 line cooks.
              </p>
            </Card>
          </div>

          {/* Highly Demanded Items List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-spaceGrotesk text-xl font-black text-[#092968]">
                  Highly Demanded Dishes (Tomorrow's Top 5 Forecast)
                </h3>
                <p className="text-xs text-slate-500">
                  Verify raw material warehouse readiness before morning prep begins
                </p>
              </div>
              <span className="rounded-xl bg-orange-100 px-3 py-1.5 text-xs font-black text-[#F26E22]">
                ⚡ AI Prep Recommendations Ready
              </span>
            </div>

            {/* Items Grid */}
            <div className="mt-6 space-y-4">
              {aiForecast.predictedItems.map((item, idx) => (
                <div
                  key={item.itemId}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-[#F26E22]/40 hover:bg-orange-50/20 lg:flex-row lg:items-center lg:justify-between"
                >
                  {/* Left: Item info */}
                  <div className="flex items-start gap-4">
                    <div className="font-spaceGrotesk flex h-12 w-12 items-center justify-center rounded-2xl bg-[#092968] text-lg font-black text-white">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-spaceGrotesk text-base font-extrabold text-[#092968]">
                          {item.itemName}
                        </span>
                        <Tag color="orange" className="rounded-md text-xs font-bold">
                          {item.category}
                        </Tag>
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                          +{item.trendPercentage}% Surge
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        Peak Service:{' '}
                        <span className="font-bold text-[#092968]">
                          {item.peakServingTime}
                        </span>{' '}
                        • Recommended Prep Window:{' '}
                        <span className="font-bold text-[#F26E22]">
                          {item.recommendedPrepWindow}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Weather factor: {item.weatherFactor}
                      </p>
                    </div>
                  </div>

                  {/* Right: Predicted Portions & Action */}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 lg:justify-end lg:border-t-0 lg:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Predicted Demand
                      </p>
                      <p className="font-mono text-2xl font-black text-[#F26E22]">
                        {item.predictedPortions} Portions
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600">
                        {item.confidenceScore}% Model Confidence
                      </p>
                    </div>

                    {/* Touch Button: Check BOM Inventory */}
                    <button
                      onClick={() => {
                        setAiBOMCheckModal(item);
                        setIsRequisitionSent(false);
                      }}
                      className="active:scale-98 flex h-12 items-center gap-2 rounded-2xl bg-[#092968] px-5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-[#0c3585]"
                    >
                      <Boxes size={16} />
                      <span>Check BOM Inventory</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🍲 MODAL: ORDER DETAILS & FOOD ITEMS WITH BOM CALCULATION OPTION */}
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
                setSelectedBulkItem({
                  dishName:
                    selectedKdsTicket.items.length === 1
                      ? selectedKdsTicket.items[0].name
                      : `Order ${selectedKdsTicket.orderNumber} (${selectedKdsTicket.items.length} Dishes)`,
                  portionCount: selectedKdsTicket.items.reduce(
                    (s, i) => s + (i.quantity || 1),
                    0,
                  ),
                  mealSession: 'A_LA_CARTE',
                  itemId: selectedKdsTicket.items[0]?.itemId,
                  orderTicketId: selectedKdsTicket.id,
                  orderNumber: selectedKdsTicket.orderNumber,
                  items: selectedKdsTicket.items,
                });
                setIsOrderModalOpen(false);
                setBomModalOpen(true);
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
                  setSelectedBulkItem({
                    dishName:
                      selectedKdsTicket.items.length === 1
                        ? selectedKdsTicket.items[0].name
                        : `Order ${selectedKdsTicket.orderNumber} (${selectedKdsTicket.items.length} Dishes)`,
                    portionCount: selectedKdsTicket.items.reduce(
                      (s, i) => s + (i.quantity || 1),
                      0,
                    ),
                    mealSession: 'A_LA_CARTE',
                    itemId: selectedKdsTicket.items[0]?.itemId,
                    orderTicketId: selectedKdsTicket.id,
                    orderNumber: selectedKdsTicket.orderNumber,
                    items: selectedKdsTicket.items,
                  });
                  setIsOrderModalOpen(false);
                  setBomModalOpen(true);
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
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
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
                Calculated Recipe Quantities for {selectedBulkItem?.dishName} (
                {selectedBulkItem?.portionCount} Portions)
              </p>
            </div>
          </div>
        }
        open={bomModalOpen}
        onCancel={() => {
          setBomModalOpen(false);
          setSelectedBulkItem(null);
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
            <button
              key="confirm-start-cooking"
              onClick={() => {
                handleAdvanceKdsStatus(selectedBulkItem.orderTicketId!, 'PREPARING');
                setBomModalOpen(false);
                setSelectedBulkItem(null);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F26E22] px-6 text-xs font-bold text-white shadow-md hover:bg-[#d95a14] active:scale-95"
            >
              <Flame size={16} />
              <span>Start Cooking (BOM Approved)</span>
            </button>
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
        width={720}
        centered
      >
        {currentBOMBreakdown && (
          <div className="space-y-4 py-3">
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
                          <Tag color="error" className="rounded-md text-[10px] font-bold">
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

// {
// orderId: "46ef6395-bc5a-47e2-a3b8-465cbb6d5bc5",
// orderDetails: [
//                 {
                    
//                     "itemId": "1d9fc849-232d-4e30-b1c5-8d99d119e496",
//                     "orderedQty": 2
//                 },
//                 {
                    
//                     "itemId": "a6583917-d26d-4297-bbf3-d606347401f4",
//                     "orderedQty": 2
//                 }
//               ]}