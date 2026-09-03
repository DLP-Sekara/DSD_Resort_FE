import React, { useState, useMemo, useEffect } from 'react';
import { Button, DatePicker, Select, Card, Switch, Tag, Drawer, Modal, Popconfirm } from 'antd';
import {
  Sparkles,
  Calendar,
  Sun,
  CloudRain,
  Cloud,
  Thermometer,
  Minus,
  Plus,
  CalendarDays,
  Boxes,
  Utensils,
  Eye,
  Trash2,
} from 'lucide-react';
import dayjs from 'dayjs';

import { successToast, errorToast } from '../../../components/common/Alert';
import type { CalculatedOrderBOMFoodItem } from '../../../types/kitchen.interfaces';
import type { FoodItem } from '../../../types/services.interfaces';
import type {
  BOMCalculationDetail,
} from '../../../types/chefPortal.interfaces';
import demandForecastMutation from '../../../mutations/demandForecast.mutation';
import bomMutation from '../../../mutations/bom.mutation';
import { Spin } from 'antd/lib';

// =========================================================================
// INITIAL SEED DATA FOR AI FORECAST
// =========================================================================
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
  {
    itemId: 'F-001',
    name: 'Sri Lankan String Hoppers with Kiri Hodi',
    category: 'Breakfast',
    unitPrice: 850,
  },
  {
    itemId: 'F-002',
    name: 'Scrambled Farm Eggs & Sausages',
    category: 'Continental',
    unitPrice: 1200,
  },
  {
    itemId: 'F-003',
    name: 'Tropical Fresh Fruit Platter',
    category: 'Fruits',
    unitPrice: 650,
  },
  {
    itemId: 'F-004',
    name: 'Freshly Brewed Ceylon Milk Tea',
    category: 'Beverages',
    unitPrice: 350,
  },
  {
    itemId: 'F-005',
    name: 'Devilled Lagoon Prawns with Fried Rice',
    category: 'Seafood',
    unitPrice: 2400,
  },
  {
    itemId: 'F-006',
    name: 'Spicy Chicken Curry with Basmati',
    category: 'Main Dish',
    unitPrice: 1850,
  },
  {
    itemId: 'F-007',
    name: 'Dhal Curry in Coconut Milk',
    category: 'Curry',
    unitPrice: 650,
  },
  {
    itemId: 'F-008',
    name: 'Grilled Herb Butter Reef Fish',
    category: 'Grill',
    unitPrice: 2800,
  },
  {
    itemId: 'F-009',
    name: 'Barbecue Spiced Pork Ribs & Chicken',
    category: 'Grill',
    unitPrice: 3200,
  },
  {
    itemId: 'F-010',
    name: 'Garlic Butter Naan & Steamed Rice',
    category: 'Sides',
    unitPrice: 750,
  },
];

const getForecastForDate = (targetDate: dayjs.Dayjs) => {
  const dayOfWeek = targetDate.format('dddd');
  const isWeekend = targetDate.day() === 0 || targetDate.day() === 6;
  const dayType = isWeekend ? 'Weekend' : 'Weekday';
  const dayDetails = `${dayOfWeek} • ${dayType}`;

  const dayOfYear = targetDate.month() * 31 + targetDate.date();

  const weatherOptions: Array<'Clear' | 'Rainy' | 'Cloudy'> = [
    'Clear',
    'Rainy',
    'Cloudy',
    'Clear',
    'Clear',
  ];
  const weatherCondition = weatherOptions[Math.abs(dayOfYear) % weatherOptions.length];

  const temperature = 28 + (Math.abs(dayOfYear * 7) % 6);

  const month = targetDate.month() + 1;
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

interface AIDemandForecastingTabProps {
  foodItemsList: FoodItem[];
  calculateBOMBreakdown: (
    dishName: string,
    portions: number,
    targetItemId?: string,
  ) => BOMCalculationDetail;
  setOrderBOMResults: (results: CalculatedOrderBOMFoodItem[]) => void;
  setSelectedBulkItem: (item: any) => void;
  setBomModalOpen: (isOpen: boolean) => void;
}

const AIDemandForecastingTab: React.FC<AIDemandForecastingTabProps> = ({
  foodItemsList,
  calculateBOMBreakdown,
  setOrderBOMResults,
  setSelectedBulkItem,
  setBomModalOpen,
}) => {
  const [selectedForecastDate, setSelectedForecastDate] = useState<dayjs.Dayjs>(dayjs());
  const [viewDemandRecordId, setViewDemandRecordId] = useState<string | null>(null);

  // Manual interactive state for Weather, Temperature, and Boolean Holiday
  const [manualWeather, setManualWeather] = useState<'Clear' | 'Rainy' | 'Cloudy'>(
    'Clear',
  );
  const [manualTemp, setManualTemp] = useState<number>(31);
  const [isHoliday, setIsHoliday] = useState<boolean>(false);

  const {
    getDemandDateContextQuery,
    predictDemandForecastMutation,
    getAllDemandForecastsQuery,
    getDemandForecastByIdQuery,
    deleteDemandForecastMutation,
  } = demandForecastMutation();
  const { calculateOrderBOMMutation } = bomMutation();
  const { mutateAsync: calculateOrderBOMApi, isPending: isCalculatingBOM } = calculateOrderBOMMutation();
  const { mutate: deleteDemandForecast, isPending: isDeletingDemandForecast } = deleteDemandForecastMutation();
  
  const { data: allForecastsRes, isLoading: isAllForecastsLoading } = getAllDemandForecastsQuery();
  const savedDemandRecords = useMemo(() => {
    if (allForecastsRes?.data && Array.isArray(allForecastsRes.data)) {
      return allForecastsRes.data;
    }
    return [];
  }, [allForecastsRes]);

  const { data: singleForecastRes, isFetching: isFetchingSingleForecast } = getDemandForecastByIdQuery(
    viewDemandRecordId || '',
    Boolean(viewDemandRecordId)
  );
  const viewDemandRecord = singleForecastRes?.data;
  
  const {
    data: dateContextResponse,
    isLoading: isContextLoading,
    isFetching: isContextFetching,
  } = getDemandDateContextQuery(selectedForecastDate.format('YYYY-MM-DD'), 'Colombo,LK');

  const { mutate: predictDemand, isPending: isPredicting } = predictDemandForecastMutation();
  const [predictedGuestCount, setPredictedGuestCount] = useState<number | null>(null);

  // Auto sync defaults whenever selected date changes or API updates
  useEffect(() => {
    if (
      dateContextResponse?.success &&
      dateContextResponse?.data &&
      dateContextResponse.data.date === selectedForecastDate.format('YYYY-MM-DD')
    ) {
      const apiData = dateContextResponse.data;
      let weatherVal = apiData.Weather;
      if (!['Clear', 'Rainy', 'Cloudy'].includes(weatherVal)) {
        if (weatherVal.toLowerCase().includes('rain') || weatherVal.toLowerCase().includes('storm') || weatherVal.toLowerCase().includes('drizzle')) {
          weatherVal = 'Rainy';
        } else if (weatherVal.toLowerCase().includes('cloud') || weatherVal.toLowerCase().includes('overcast')) {
          weatherVal = 'Cloudy';
        } else {
          weatherVal = 'Clear';
        }
      }
      setManualWeather(weatherVal as 'Clear' | 'Rainy' | 'Cloudy');
      setManualTemp(Math.round(apiData.Temperature));
      setIsHoliday(apiData.IsHoliday === 1);
    } else if (!isContextLoading && !isContextFetching) {
      const def = getForecastForDate(selectedForecastDate || dayjs());
      setManualWeather(def.weatherCondition);
      setManualTemp(def.temperature);
      setIsHoliday(def.isHoliday.startsWith('Yes'));
    }
  }, [selectedForecastDate, dateContextResponse, isContextLoading, isContextFetching]);

  // Trigger ML Prediction whenever forecast parameters change
  useEffect(() => {
    const targetDate = selectedForecastDate || dayjs();
    let dayOfWeek = dateContextResponse?.data?.DayOfWeek;
    if (dayOfWeek === undefined) {
      dayOfWeek = (targetDate.day() + 6) % 7; // Convert Sun=0,Mon=1... to Mon=0...Sun=6
    }
    const isWeekend = (targetDate.day() === 0 || targetDate.day() === 6) ? 1 : 0;

    predictDemand(
      {
        DayOfWeek: dayOfWeek,
        IsWeekend: isWeekend,
        IsHoliday: isHoliday ? 1 : 0,
        Temperature: manualTemp,
        Weather: manualWeather,
      },
      {
        onSuccess: (res) => {
          if (res.success && res.data?.predicted_guest_count) {
            setPredictedGuestCount(res.data.predicted_guest_count);
          }
        },
      }
    );
  }, [
    manualWeather,
    manualTemp,
    isHoliday,
    selectedForecastDate,
    dateContextResponse?.data?.DayOfWeek,
    predictDemand,
  ]);

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

    const demandingCount = predictedGuestCount !== null ? predictedGuestCount : Math.max(25, baseDemand);

    const apiData =
      dateContextResponse?.success &&
      dateContextResponse?.data?.date === targetDate.format('YYYY-MM-DD')
        ? dateContextResponse.data
        : null;

    return {
      dateStr: targetDate.format('YYYY-MM-DD'),
      formattedDate: targetDate.format('DD MMM YYYY'),
      weatherCondition: manualWeather,
      temperature: manualTemp,
      isHoliday: isHoliday
        ? apiData?.holidayName
          ? `Yes - ${apiData.holidayName}`
          : 'Yes (Holiday)'
        : 'No (Regular Day)',
      isHolidayBool: isHoliday,
      dayDetails,
      dayOfWeek,
      dayType,
      demandingCount,
      confidenceScore: predictedGuestCount !== null ? 96 : (apiData ? 92 : 79),
      apiContext: apiData,
    };
  }, [selectedForecastDate, manualWeather, manualTemp, isHoliday, dateContextResponse, predictedGuestCount]);

  // Available food items list for portion allocation in sidebar
  const availableAllocationFoodItems = useMemo(() => {
    const items: { itemId: string; name: string; category: string; unitPrice: number }[] =
      [];
    if (foodItemsList && foodItemsList.length > 0) {
      foodItemsList.filter((f) => f.isKitchenPrepared).forEach((f: any) => {
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
    {
      itemId: string;
      name: string;
      category: string;
      unitPrice: number;
      portions: number;
      isSelected: boolean;
    }[]
  >([]);

  // Open drawer
  const handleOpenForecastBOMDrawer = () => {
    setForecastFoodAllocations([]);
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
  const handleCalculateAllocatedBOM = async () => {
    const selected = forecastFoodAllocations.filter(
      (it) => it.isSelected && it.portions > 0,
    );
    if (selected.length === 0) {
      errorToast(
        'Please select at least one food item with portion count greater than 0.',
      );
      return;
    }

    try {
      const payload = {
        orderId: `FCST-${selectedForecastDate.format('YYYYMMDD')}`,
        orderDetails: selected.map((it) => ({
          itemId: it.itemId,
          orderedQty: it.portions || 1,
        })),
      };
      const res: any = await calculateOrderBOMApi(payload);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setOrderBOMResults(res.data);
      } else {
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
      }
    } catch (err) {
      console.error('Failed to calculate BOM via backend API:', err);
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
    }

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
      forecastContext: currentDateForecast,
    });
    setIsForecastBOMDrawerOpen(false);
    setBomModalOpen(true);
  };

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* SECTION 1: TOP BAR WITH HEADER & HIGHLIGHTED DATE PICKER */}
      <div className="shadow-xs flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="shadow-xs flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-[#F26E22]">
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
              Predictive kitchen portion estimation. Tweak parameters below to recalculate
              demand live.
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
            disabledDate={(current) => current && current < dayjs().startOf('day')}
            format="YYYY-MM-DD"
            allowClear={false}
            className="shadow-xs h-11 min-w-[170px] rounded-xl border-orange-300 bg-white px-3 font-mono text-sm font-black text-[#092968] hover:border-[#F26E22] focus:border-[#F26E22]"
          />
        </div>
      </div>

      {/* SECTION 2: 4 METRIC CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Weather Condition */}
        <Card className="shadow-xs rounded-3xl border-slate-200 bg-white transition-all hover:shadow-md">
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
          <div className="mt-3 flex flex-col gap-1">
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
            {currentDateForecast.apiContext?.weatherDescription && (
              <div
                className="truncate text-[10px] leading-tight text-slate-400"
                title={currentDateForecast.apiContext.weatherDescription}
              >
                API: {currentDateForecast.apiContext.weatherDescription}
              </div>
            )}
          </div>
        </Card>

        {/* Card 2: Temperature */}
        <Card className="shadow-xs rounded-3xl border-slate-200 bg-white transition-all hover:shadow-md">
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

        {/* Card 3: Is Holiday? */}
        <Card className="shadow-xs rounded-3xl border-slate-200 bg-white transition-all hover:shadow-md">
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
          <div className="mt-3 flex items-center justify-between gap-2">
            <span
              className="flex-1 truncate text-xs font-bold text-slate-600"
              title={currentDateForecast.isHoliday}
            >
              {isHoliday
                ? currentDateForecast.apiContext?.holidayName
                  ? `Surge: ${currentDateForecast.apiContext.holidayName}`
                  : 'Holiday Surge (+45 Pax)'
                : 'Regular Business Day'}
            </span>
            <Switch checked={isHoliday} onChange={(checked) => setIsHoliday(checked)} />
          </div>
        </Card>

        {/* Card 4: Date Details */}
        <Card className="shadow-xs rounded-3xl border-slate-200 bg-white transition-all hover:shadow-md">
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
              <span className={`font-spaceGrotesk font-mono text-5xl font-black text-white md:text-6xl transition-opacity duration-300 ${isPredicting ? 'opacity-50' : 'opacity-100'}`}>
                {isPredicting ? '...' : currentDateForecast.demandingCount}
              </span>
              <span className="text-lg font-bold text-orange-400">Portions / Covers</span>
            </div>
            <p className="max-w-2xl text-xs text-blue-200">
              Estimated kitchen dining load for{' '}
              <span className="font-bold text-white">
                {currentDateForecast.formattedDate}
              </span>{' '}
              ({currentDateForecast.dayDetails}) based on {manualWeather.toLowerCase()}{' '}
              weather ({manualTemp}°C) and{' '}
              {isHoliday ? 'holiday demand' : 'regular dining day'}.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenForecastBOMDrawer}
              className="active:scale-98 h-13 flex items-center justify-center gap-2.5 rounded-2xl bg-[#F26E22] p-6 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition-all hover:bg-[#d95a14]"
            >
              <Boxes size={20} />
              <span>Check BOM for {currentDateForecast.demandingCount} Count</span>
            </button>

          
          </div>
        </div>
      </div>

      {/* SECTION 4: LAST SECTION - SAVED DEMAND VALUES ROWS */}
      <div className="shadow-xs rounded-3xl border border-slate-200 bg-white p-6">
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
              {isAllForecastsLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <Spin size="small" className="mr-2" /> Loading saved forecasts...
                  </td>
                </tr>
              ) : savedDemandRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No saved forecasts found.
                  </td>
                </tr>
              ) : (
                savedDemandRecords.map((rec: any) => (
                <tr key={rec.forecastId} className="transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-bold text-[#092968]">{rec.targetDate || rec.date}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                      {(rec.weatherFeature || rec.weatherCondition) === 'Clear' && (
                        <Sun size={15} className="text-amber-500" />
                      )}
                      {(rec.weatherFeature || rec.weatherCondition) === 'Rainy' && (
                        <CloudRain size={15} className="text-blue-500" />
                      )}
                      {(rec.weatherFeature || rec.weatherCondition) === 'Cloudy' && (
                        <Cloud size={15} className="text-slate-500" />
                      )}
                      {rec.weatherFeature || rec.weatherCondition}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                    {rec.temperature}°C
                  </td>
                  <td className="px-4 py-3.5">
                    {rec.isHoliday || rec.isHoliday === 'Yes' ? (
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
                    {rec.dateDetails || rec.dayDetails}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="rounded-full bg-orange-100 px-3 py-1 font-mono text-xs font-black text-[#F26E22]">
                      {rec.predictedGuests || rec.demandedCount} Pax
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => setViewDemandRecordId(rec.forecastId)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#092968]"
                        icon={<Eye size={16} />}
                      />
                      <Popconfirm
                        title="Delete Forecast"
                        description="Are you sure you want to delete this forecast?"
                        onConfirm={() => deleteDemandForecast(rec.forecastId)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true, loading: isDeletingDemandForecast }}
                      >
                        <Button
                          disabled={isDeletingDemandForecast}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          icon={<Trash2 size={16} />}
                        />
                      </Popconfirm>
                    </div>
                  </td>
                </tr>
              )))}
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
                  Pick dishes and allocate portions for{' '}
                  {currentDateForecast.demandingCount} predicted covers
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
                disabled={isCalculatingBOM}
                className="active:scale-98 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F26E22] px-6 text-xs font-black text-white shadow-md hover:bg-[#d95a14] disabled:opacity-50"
              >
                <Boxes size={16} />
                <span>{isCalculatingBOM ? 'Calculating...' : `Calculate BOM (${allocatedPortionsSum} Portions)`}</span>
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
                  <span className="text-emerald-600">
                    ✓ Exactly matches forecast demand
                  </span>
                ) : allocatedPortionsSum < currentDateForecast.demandingCount ? (
                  <span className="text-blue-600">
                    Remaining: {currentDateForecast.demandingCount - allocatedPortionsSum}{' '}
                    portions
                  </span>
                ) : (
                  <span className="text-orange-600">
                    Exceeds by +
                    {allocatedPortionsSum - currentDateForecast.demandingCount} portions
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* 1. SEARCHABLE FOOD ITEM SELECTOR FROM SYSTEM */}
          <div className="shadow-xs space-y-1.5 rounded-2xl border border-slate-200 bg-white p-3.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
              Search & Pick Food Items from System:
            </label>
            <Select
              showSearch
              placeholder="Select food dish to add to allocation..."
              value={null}
              onChange={(val) => {
                const found = availableAllocationFoodItems.find((f) => f.itemId === val);
                if (found) {
                  setForecastFoodAllocations((prev) => {
                    let nextList = [...prev];
                    if (prev.some((p) => p.itemId === val)) {
                      nextList = prev.map((p) =>
                        p.itemId === val
                          ? { ...p, isSelected: true }
                          : p,
                      );
                    } else {
                      nextList = [
                        {
                          itemId: found.itemId,
                          name: found.name,
                          category: found.category,
                          unitPrice: found.unitPrice,
                          portions: 0,
                          isSelected: true,
                        },
                        ...prev,
                      ];
                    }

                    // Auto-distribute logic
                    const selectedItems = nextList.filter(p => p.isSelected);
                    const totalPax = currentDateForecast.demandingCount;
                    const numItems = selectedItems.length;
                    if (numItems > 0) {
                      const baseShare = Math.floor(totalPax / numItems);
                      const remainder = totalPax % numItems;
                      
                      let idx = 0;
                      nextList = nextList.map(p => {
                        if (p.isSelected) {
                            const share = baseShare + (idx < remainder ? 1 : 0);
                            idx++;
                            return { ...p, portions: share };
                        }
                        return p;
                      });
                    }
                    return nextList;
                  });
                  successToast(`Added "${found.name}" to allocation list and auto-distributed!`);
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
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Allocated Menu Dishes (
                  {forecastFoodAllocations.filter((f) => f.isSelected).length})
                </p>
                {forecastFoodAllocations.filter((f) => f.isSelected).length > 0 && (
                  <Button
                    size="small"
                    onClick={handleAutoDistributeForecastPortions}
                    className="rounded-lg bg-orange-100 text-[10px] font-black text-[#F26E22] hover:bg-orange-200 border-none h-6"
                  >
                    Auto-Distribute
                  </Button>
                )}
              </div>
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

            <div className="max-h-[48vh] space-y-2.5 overflow-y-auto pr-1">
              {forecastFoodAllocations.filter((f) => f.isSelected).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                  <Utensils size={32} className="text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-600">
                    No Food Items Selected Yet
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Pick items from the dropdown above or click Auto-Distribute to load
                    recommended menu dishes.
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
                      className="shadow-xs flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#092968]">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.category}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="small"
                          onClick={() => {
                            setForecastFoodAllocations((prev) =>
                              prev.map((p) =>
                                p.itemId === item.itemId
                                  ? { ...p, portions: Math.max(0, p.portions - 1) }
                                  : p,
                              ),
                            );
                          }}
                        >
                          <Minus size={12} />
                        </Button>
                        <span className="w-10 text-center font-mono text-sm font-black text-slate-700">
                          {item.portions}
                        </span>
                        <Button
                          size="small"
                          onClick={() => {
                            setForecastFoodAllocations((prev) =>
                              prev.map((p) =>
                                p.itemId === item.itemId
                                  ? { ...p, portions: p.portions + 1 }
                                  : p,
                              ),
                            );
                          }}
                        >
                          <Plus size={12} />
                        </Button>
                      </div>

                      <Button
                        type="text"
                        danger
                        size="small"
                        onClick={() => {
                          setForecastFoodAllocations((prev) =>
                            prev.filter((p) => p.itemId !== item.itemId),
                          );
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </Drawer>
      {/* ========================================================================= */}
      {/* MODAL: VIEW SAVED DEMAND RECORD DETAILS */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[#F26E22]">
              <Eye size={20} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-black text-[#092968]">
                Demand Forecast Details
              </h3>
              <p className="text-xs text-slate-400">
                Record ID: {viewDemandRecord?.id}
              </p>
            </div>
          </div>
        }
        open={Boolean(viewDemandRecordId)}
        onCancel={() => setViewDemandRecordId(null)}
        footer={[
          <Button
            key="close"
            className="h-11 rounded-xl px-6 font-bold"
            onClick={() => setViewDemandRecordId(null)}
          >
            Close
          </Button>,
        ]}
        width={600}
        centered
      >
        {isFetchingSingleForecast ? (
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
          </div>
        ) : viewDemandRecord ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Target Date</p>
                <p className="font-mono text-sm font-black text-[#092968]">{viewDemandRecord.targetDate || viewDemandRecord.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Day Details</p>
                <p className="text-sm font-bold text-slate-700">{viewDemandRecord.dateDetails || viewDemandRecord.dayDetails}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Weather</p>
                <div className="flex items-center gap-2 mt-1">
                  {(viewDemandRecord.weatherFeature || viewDemandRecord.weatherCondition) === 'Clear' && <Sun size={14} className="text-orange-500" />}
                  {(viewDemandRecord.weatherFeature || viewDemandRecord.weatherCondition) === 'Rainy' && <CloudRain size={14} className="text-blue-500" />}
                  {(viewDemandRecord.weatherFeature || viewDemandRecord.weatherCondition) === 'Cloudy' && <Cloud size={14} className="text-slate-500" />}
                  <span className="text-xs font-bold text-slate-700">{viewDemandRecord.weatherFeature || viewDemandRecord.weatherCondition} ({viewDemandRecord.temperature}°C)</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Holiday</p>
                <p className="mt-1">
                  {viewDemandRecord.isHoliday || viewDemandRecord.isHoliday === 'Yes' ? (
                    <Tag color="purple" className="rounded-md font-bold m-0">Yes - Peak</Tag>
                  ) : (
                    <Tag className="rounded-md font-bold m-0 text-slate-500">No</Tag>
                  )}
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Predicted Demand (Guests/Portions)</p>
                <p className="font-spaceGrotesk text-2xl font-black text-[#F26E22]">{viewDemandRecord.predictedGuests || viewDemandRecord.demandedCount} Pax</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Template Details</p>
                {viewDemandRecord.templateId ? (
                  <div className="mt-2 space-y-2">
                    {(() => {
                      try {
                        const parsed = JSON.parse(viewDemandRecord.templateId);
                        return Array.isArray(parsed) ? parsed.map((it: any, idx: number) => {
                          const foodItem = foodItemsList.find(f => Number(f.itemId) === Number(it.itemId));
                          return (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-white border border-slate-200">
                              <span className="font-bold text-[#092968]">{it.name || foodItem?.name || `Item #${it.itemId}`}</span>
                              <span className="font-mono text-[#F26E22]">{it.portions} Portions</span>
                            </div>
                          );
                        }) : <span>{viewDemandRecord.templateId}</span>;
                      } catch {
                        return <span className="text-xs text-slate-600">{viewDemandRecord.templateId}</span>;
                      }
                    })()}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-slate-600 mt-1">
                    Using default fallback AI predicted dishes distribution for {viewDemandRecord.predictedGuests || viewDemandRecord.demandedCount} Pax.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AIDemandForecastingTab;
