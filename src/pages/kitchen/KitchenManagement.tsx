import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Form,
  Card,
  Popconfirm,
  InputNumber,
  Row,
  Col,
  Drawer,
  Switch,
  Divider,
} from 'antd';
import {
  Plus,
  Edit,
  Trash2,
  Boxes,
  Search,
  RotateCw,
  AlertTriangle,
  PackageCheck,
  Wheat,
  Coffee,
  ChefHat,
  Eye,
  FileSpreadsheet,
  Flame,
} from 'lucide-react';
import ActionDialog from '../../components/common/ActionDialog';
import CustomButton from '../../components/common/CustomButton';
import kitchenMutation from '../../mutations/kitchen.mutation';
import mealMutation from '../../mutations/meal.mutation';
import bomMutation from '../../mutations/bom.mutation';
import settingMutation from '../../mutations/setting.mutation';
import { useAuth } from '../../hooks/useAuth';
import {
  RAW_MATERIAL_CATEGORIES,
  UNITS_OF_MEASURE,
  type RawMaterial,
  type BOMTemplate,
} from '../../types/kitchen.interfaces';
import type { FoodItem } from '../../types/services.interfaces';
import { errorToast } from '../../components/common/Alert';

const { Option } = Select;

const KitchenManagement = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'RAW_MATERIALS' | 'FOOD_ITEMS' | 'BOM_MANAGEMENT'
  >('RAW_MATERIALS');

  // --- RAW MATERIAL STATE ---
  const [rawForm] = Form.useForm();
  const [rawModalOpen, setRawModalOpen] = useState(false);
  const [rawModalType, setRawModalType] = useState<'add' | 'edit'>('add');
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<RawMaterial | null>(null);
  const [rawSearchTerm, setRawSearchTerm] = useState('');
  const [rawCategoryFilter, setRawCategoryFilter] = useState('ALL');
  const [rawStockFilter, setRawStockFilter] = useState('ALL');

  // --- FOOD ITEM STATE ---
  const [foodForm] = Form.useForm();
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [foodModalType, setFoodModalType] = useState<'add' | 'edit'>('add');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [foodSearchTerm, setFoodSearchTerm] = useState('');
  const [foodTypeFilter, setFoodTypeFilter] = useState('ALL');

  // --- BOM TEMPLATE STATE ---
  const [bomForm] = Form.useForm();
  const [bomDrawerOpen, setBomDrawerOpen] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<BOMTemplate | null>(null);
  const [isViewBOMOpen, setIsViewBOMOpen] = useState(false);
  const [bomSearchTerm, setBomSearchTerm] = useState('');

  // --- REACT QUERY MUTATIONS & QUERIES ---
  const {
    getAllRawMaterialsQuery,
    addRawMaterialMutation,
    updateRawMaterialMutation,
    deleteRawMaterialMutation,
  } = kitchenMutation();

  const {
    getAllFoodItemsMutation,
    addFoodItemMutation,
    updateFoodItemMutation,
    deleteFoodItemMutation,
  } = mealMutation();

  const {
    getAllBOMTemplatesQuery,
    createBOMTemplateMutation,
    deleteBOMTemplateMutation,
  } = bomMutation();

  const { getAllSystemUsersQuery } = settingMutation();

  // Data fetching
  const { data: rawMaterialsResponse, isLoading: isRawLoading, refetch: refetchRaw } =
    getAllRawMaterialsQuery();
  const { data: foodItemsResponse, isLoading: isFoodLoading, refetch: refetchFood } =
    getAllFoodItemsMutation();
  const { data: bomTemplatesResponse, isLoading: isBOMsLoading, refetch: refetchBOMs } =
    getAllBOMTemplatesQuery();
  const { data: staffResponse } = getAllSystemUsersQuery();

  // Raw Material mutations
  const { mutateAsync: addMaterial, isPending: isAddingRaw } = addRawMaterialMutation();
  const { mutateAsync: updateMaterial, isPending: isUpdatingRaw } = updateRawMaterialMutation();
  const { mutateAsync: deleteMaterial, isPending: isDeletingRaw } = deleteRawMaterialMutation();

  // Food Item mutations
  const { mutateAsync: createFoodItem, isPending: isCreatingFood } = addFoodItemMutation();
  const { mutateAsync: updateFoodItem, isPending: isUpdatingFood } = updateFoodItemMutation();
  const { mutateAsync: deleteFoodItem, isPending: isDeletingFood } = deleteFoodItemMutation();

  // BOM mutations
  const { mutateAsync: createBOM, isPending: isCreatingBOM } = createBOMTemplateMutation();
  const { mutateAsync: deleteBOM, isPending: isDeletingBOM } = deleteBOMTemplateMutation();

  // Auto-resolve current logged in staff userId
  const currentStaffUserId = useMemo(() => {
    if (!staffResponse?.data || !Array.isArray(staffResponse.data)) {
      return (userData as any)?.userId || (userData as any)?.adminId || '';
    }
    const matched = staffResponse.data.find(
      (u: any) =>
        (userData?.userId && u.userId === userData.userId) ||
        (userData?.email && u.email?.toLowerCase() === userData.email.toLowerCase()) ||
        (userData?.name && u.name?.toLowerCase() === userData.name.toLowerCase()),
    );
    return matched?.userId || (userData as any)?.userId || staffResponse.data[0]?.userId || '';
  }, [staffResponse, userData]);

  // ==========================================
  // 1. RAW MATERIAL SECTION HANDLERS & FILTERS
  // ==========================================
  useEffect(() => {
    if (rawModalType === 'edit' && selectedRawMaterial) {
      rawForm.setFieldsValue({
        materialName:
          selectedRawMaterial.materialName || (selectedRawMaterial as any).material_name,
        category: selectedRawMaterial.category || 'GRAINS',
        unitOfMeasure:
          selectedRawMaterial.unitOfMeasure || (selectedRawMaterial as any).unit_of_measure || 'kg',
        quantityOnHand:
          selectedRawMaterial.quantityOnHand ?? (selectedRawMaterial as any).quantity_on_hand ?? 0,
      });
    } else {
      rawForm.resetFields();
      rawForm.setFieldsValue({
        category: 'GRAINS',
        unitOfMeasure: 'kg',
        quantityOnHand: 0,
      });
    }
  }, [selectedRawMaterial, rawModalType, rawForm, rawModalOpen]);

  const handleRawFormFinish = async (values: any) => {
    const data = {
      materialName: values.materialName,
      category: values.category,
      unitOfMeasure: values.unitOfMeasure,
      quantityOnHand: Number(values.quantityOnHand),
    };

    if (rawModalType === 'add') {
      await addMaterial(data);
    } else {
      const materialId =
        selectedRawMaterial?.materialId || (selectedRawMaterial as any)?.material_id;
      await updateMaterial({ materialId, ...data });
    }
    setRawModalOpen(false);
    setSelectedRawMaterial(null);
  };

  const rawMaterialsList: RawMaterial[] = useMemo(() => {
    const rawList = rawMaterialsResponse?.data || [];
    return rawList.filter((item: RawMaterial) => {
      const name = item.materialName || (item as any).material_name || '';
      const category = item.category || '';
      const id = item.materialId || (item as any).material_id || '';
      const qty = item.quantityOnHand ?? (item as any).quantity_on_hand ?? 0;

      const matchesSearch =
        !rawSearchTerm ||
        name.toLowerCase().includes(rawSearchTerm.toLowerCase()) ||
        id.toLowerCase().includes(rawSearchTerm.toLowerCase());

      const matchesCategory =
        rawCategoryFilter === 'ALL' || category.toUpperCase() === rawCategoryFilter.toUpperCase();

      let matchesStock = true;
      if (rawStockFilter === 'OUT_OF_STOCK') matchesStock = qty <= 0;
      else if (rawStockFilter === 'LOW_STOCK') matchesStock = qty > 0 && qty <= 10;
      else if (rawStockFilter === 'IN_STOCK') matchesStock = qty > 10;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [rawMaterialsResponse, rawSearchTerm, rawCategoryFilter, rawStockFilter]);

  const rawStats = useMemo(() => {
    const all = rawMaterialsResponse?.data || [];
    const totalItems = all.length;
    const totalQty = all.reduce(
      (sum: number, item: RawMaterial) =>
        sum + (item.quantityOnHand ?? (item as any).quantity_on_hand ?? 0),
      0,
    );
    const lowStockCount = all.filter((item: RawMaterial) => {
      const qty = item.quantityOnHand ?? (item as any).quantity_on_hand ?? 0;
      return qty <= 10;
    }).length;
    const categoriesCount = new Set(all.map((item: RawMaterial) => item.category)).size;
    return { totalItems, totalQty, lowStockCount, categoriesCount };
  }, [rawMaterialsResponse]);

  const getCategoryInfo = (category: string) => {
    const found = RAW_MATERIAL_CATEGORIES.find(
      (c) => c.value.toUpperCase() === (category || '').toUpperCase(),
    );
    return found || { label: category || 'General', color: 'default' };
  };

  const renderStockStatus = (qty: number, uom: string) => {
    if (qty <= 0) {
      return (
        <Tag color="error" className="rounded-lg px-2.5 py-0.5 text-xs font-bold">
          Out of Stock
        </Tag>
      );
    }
    if (qty <= 10) {
      return (
        <Tag color="warning" className="rounded-lg px-2.5 py-0.5 text-xs font-bold">
          Low Stock ({qty} {uom})
        </Tag>
      );
    }
    return (
      <Tag color="success" className="rounded-lg px-2.5 py-0.5 text-xs font-bold">
        In Stock
      </Tag>
    );
  };

  const rawColumns = [
    {
      title: 'Material Name',
      dataIndex: 'materialName',
      key: 'materialName',
      render: (_: any, record: RawMaterial) => {
        const name = record.materialName || (record as any).material_name || 'N/A';
        const id = record.materialId || (record as any).material_id || '';
        return (
          <div className="flex flex-col">
            <span className="font-bold text-[#092968]">{name}</span>
            {id && (
              <span className="font-mono text-[11px] text-gray-400">
                ID: #{String(id).slice(-6).toUpperCase()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => {
        const info = getCategoryInfo(cat);
        return (
          <Tag color={info.color} className="rounded-md px-2.5 py-0.5 text-xs font-bold">
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: 'Unit of Measure',
      dataIndex: 'unitOfMeasure',
      key: 'unitOfMeasure',
      render: (uom: string, record: RawMaterial) => {
        const val = uom || (record as any).unit_of_measure || 'units';
        return (
          <Tag color="blue" className="rounded-md font-mono text-xs font-semibold uppercase">
            {val}
          </Tag>
        );
      },
    },
    {
      title: 'Quantity On Hand',
      dataIndex: 'quantityOnHand',
      key: 'quantityOnHand',
      render: (qtyVal: number, record: RawMaterial) => {
        const qty = qtyVal ?? (record as any).quantity_on_hand ?? 0;
        const uom = record.unitOfMeasure || (record as any).unit_of_measure || '';
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0B1B3D]">
              {Number(qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-400">{uom}</span>
          </div>
        );
      },
    },
    {
      title: 'Stock Status',
      key: 'stockStatus',
      render: (_: any, record: RawMaterial) => {
        const qty = record.quantityOnHand ?? (record as any).quantity_on_hand ?? 0;
        const uom = record.unitOfMeasure || (record as any).unit_of_measure || '';
        return renderStockStatus(qty, uom);
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: RawMaterial) => {
        const materialId = record.materialId || (record as any).material_id;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="text"
              size="small"
              icon={<Edit size={16} className="text-gray-400 hover:text-[#F26E22]" />}
              onClick={() => {
                setSelectedRawMaterial(record);
                setRawModalType('edit');
                setRawModalOpen(true);
              }}
            />
            <Popconfirm
              title="Delete Raw Material"
              description="Are you sure you want to delete this raw material? This action cannot be undone."
              onConfirm={() => deleteMaterial(materialId)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: isDeletingRaw }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={16} />}
                className="hover:!bg-red-50"
              />
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  // ==========================================
  // 2. FOOD ITEM SECTION HANDLERS & FILTERS
  // ==========================================
  useEffect(() => {
    if (foodModalType === 'edit' && selectedFoodItem) {
      foodForm.setFieldsValue({
        name: selectedFoodItem.name,
        price: selectedFoodItem.unitPrice,
        quantity: selectedFoodItem.quantityOnHand,
        isKitchenPrepared:
          selectedFoodItem.isKitchenPrepared ??
          (selectedFoodItem as any).is_kitchen_prepared ??
          false,
      });
    } else {
      foodForm.resetFields();
      foodForm.setFieldsValue({
        isKitchenPrepared: false,
      });
    }
  }, [selectedFoodItem, foodModalType, foodForm, foodModalOpen]);

  const handleFoodFormFinish = async (values: any) => {
    const data = {
      name: values.name,
      unitPrice: values.price,
      quantityOnHand: values.quantity,
      isKitchenPrepared: Boolean(values.isKitchenPrepared),
    };

    if (foodModalType === 'add') {
      await createFoodItem(data);
    } else {
      await updateFoodItem({ itemId: selectedFoodItem?.itemId, ...data });
    }
    setFoodModalOpen(false);
    setSelectedFoodItem(null);
  };

  const foodItemsList: FoodItem[] = useMemo(() => {
    const rawList = foodItemsResponse?.data || [];
    return rawList.filter((item: FoodItem) => {
      const name = item.name || '';
      const isPrepared =
        item.isKitchenPrepared ?? (item as any).is_kitchen_prepared ?? false;

      const matchesSearch =
        !foodSearchTerm || name.toLowerCase().includes(foodSearchTerm.toLowerCase());

      let matchesType = true;
      if (foodTypeFilter === 'KITCHEN_PREPARED') matchesType = Boolean(isPrepared);
      else if (foodTypeFilter === 'READY_MADE') matchesType = !isPrepared;

      return matchesSearch && matchesType;
    });
  }, [foodItemsResponse, foodSearchTerm, foodTypeFilter]);

  const foodStats = useMemo(() => {
    const all = foodItemsResponse?.data || [];
    const total = all.length;
    const kitchenCount = all.filter(
      (f: FoodItem) => f.isKitchenPrepared ?? (f as any).is_kitchen_prepared,
    ).length;
    const directCount = total - kitchenCount;
    const totalUnits = all.reduce((sum: number, f: FoodItem) => sum + (f.quantityOnHand || 0), 0);
    return { total, kitchenCount, directCount, totalUnits };
  }, [foodItemsResponse]);

  const foodColumns = [
    {
      title: 'Food Item Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FoodItem) => {
        const id = record.itemId || (record as any).id || '';
        return (
          <div className="flex flex-col">
            <span className="font-bold text-[#092968]">{name}</span>
            {id && (
              <span className="font-mono text-[11px] text-gray-400">
                ID: #{String(id).slice(-6).toUpperCase()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Item Type',
      key: 'isKitchenPrepared',
      render: (_: any, record: FoodItem) => {
        const isPrepared =
          record.isKitchenPrepared ?? (record as any).is_kitchen_prepared ?? false;
        return isPrepared ? (
          <Tag color="orange" className="rounded-md text-xs font-bold">
            Kitchen Prepared (Cooked)
          </Tag>
        ) : (
          <Tag color="blue" className="rounded-md text-xs font-semibold">
            Direct / Ready-made
          </Tag>
        );
      },
    },
    {
      title: 'Unit Price (LKR)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => (
        <span className="font-bold text-[#0B1B3D]">
          LKR {Number(price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Stock Quantity',
      dataIndex: 'quantityOnHand',
      key: 'quantityOnHand',
      render: (qty: number) => {
        const q = qty || 0;
        return (
          <span
            className={`font-semibold ${
              q <= 5 ? 'text-red-500 font-bold' : 'text-gray-700'
            }`}
          >
            {q} {q <= 5 ? '(Low Stock)' : 'portions'}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: FoodItem) => {
        const itemId = record.itemId || (record as any).id;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="text"
              size="small"
              icon={<Edit size={16} className="text-gray-400 hover:text-[#F26E22]" />}
              onClick={() => {
                setSelectedFoodItem(record);
                setFoodModalType('edit');
                setFoodModalOpen(true);
              }}
            />
            <Popconfirm
              title="Delete Food Item"
              description="Are you sure you want to delete this food item?"
              onConfirm={() => deleteFoodItem(itemId)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: isDeletingFood }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={16} />}
                className="hover:!bg-red-50"
              />
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  // Watchers for BOM dynamic drawer
  const watchedBOMItems = Form.useWatch('items', bomForm);

  // Filter food items to only those prepared in the kitchen
  const kitchenPreparedFoods: FoodItem[] = useMemo(() => {
    return (foodItemsResponse?.data || []).filter(
      (f: FoodItem) => f.isKitchenPrepared ?? (f as any).is_kitchen_prepared ?? false,
    );
  }, [foodItemsResponse]);

  // ==========================================
  // 3. BOM MANAGEMENT SECTION HANDLERS
  // ==========================================
  const openCreateBOMDrawer = () => {
    bomForm.resetFields();
    bomForm.setFieldsValue({
      createdBy: currentStaffUserId,
      items: [{ materialId: undefined, qtyPerPerson: undefined }],
    });
    setBomDrawerOpen(true);
  };

  const handleBOMFinish = async (values: any) => {
    if (!values.items || values.items.length === 0) {
      errorToast('Please add at least one ingredient to the BOM template!');
      return;
    }

    const selectedFood = (foodItemsResponse?.data || []).find(
      (f: FoodItem) => f.itemId === values.itemId || (f as any).id === values.itemId,
    );
    const templateName = selectedFood ? `${selectedFood.name}-BOM` : 'Dish-BOM';

    const payload = {
      templateName,
      createdBy: values.createdBy || currentStaffUserId || '',
      itemId: values.itemId,
      items: values.items.map((item: any) => ({
        materialId: item.materialId,
        qtyPerPerson: Number(item.qtyPerPerson),
      })),
    };

    const res = await createBOM(payload);
    if (res?.success) {
      setBomDrawerOpen(false);
      bomForm.resetFields();
    }
  };

  const bomTemplatesList: BOMTemplate[] = useMemo(() => {
    const rawList = bomTemplatesResponse?.data || [];
    return rawList.filter((bom: BOMTemplate) => {
      const name = bom.templateName || (bom as any).template_name || '';
      const foodName =
        bom.foodItem?.name ||
        foodItemsResponse?.data?.find(
          (f: FoodItem) => f.itemId === bom.itemId || (f as any).id === bom.itemId,
        )?.name ||
        '';

      return (
        !bomSearchTerm ||
        name.toLowerCase().includes(bomSearchTerm.toLowerCase()) ||
        foodName.toLowerCase().includes(bomSearchTerm.toLowerCase())
      );
    });
  }, [bomTemplatesResponse, foodItemsResponse, bomSearchTerm]);

  const bomColumns = [
    {
      title: 'Template Name',
      dataIndex: 'templateName',
      key: 'templateName',
      render: (name: string, record: BOMTemplate) => {
        const id = record.templateId || (record as any).id || (record as any).template_id;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-[#092968]">{name}</span>
            {id && (
              <span className="font-mono text-[11px] text-gray-400">
                ID: #{String(id).slice(-6).toUpperCase()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Target Food Dish',
      dataIndex: 'itemId',
      key: 'itemId',
      render: (itemId: string, record: BOMTemplate) => {
        const food =
          record.foodItem ||
          foodItemsResponse?.data?.find(
            (f: FoodItem) => f.itemId === itemId || (f as any).id === itemId,
          );
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#F26E22]">
              <Coffee size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B1B3D]">
                {food?.name || 'Food Dish'}
              </p>
              <p className="text-[11px] text-gray-400">
                {food?.unitPrice ? `LKR ${Number(food.unitPrice).toLocaleString()}` : 'Menu Item'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ingredients Count',
      key: 'itemsCount',
      render: (_: any, record: BOMTemplate) => {
        const items = record.items || record.templateItems || (record as any).bomTemplateItems || [];
        return (
          <Tag color="geekblue" className="rounded-md font-semibold text-xs">
            {items.length} raw {items.length === 1 ? 'material' : 'materials'}
          </Tag>
        );
      },
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (creatorId: string, record: BOMTemplate) => {
        const staff = staffResponse?.data?.find(
          (u: any) => u.adminId === creatorId || u.userId === creatorId,
        );
        const name = record.createdByUser?.name || staff?.name || 'Head Chef / Admin';
        return <span className="text-xs font-semibold text-gray-600">{name}</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: BOMTemplate) => {
        const templateId =
          record.templateId || (record as any).id || (record as any).template_id;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="text"
              size="small"
              icon={<Eye size={16} className="text-[#092968]" />}
              className="hover:!bg-blue-50"
              onClick={() => {
                setSelectedBOM(record);
                setIsViewBOMOpen(true);
              }}
            />
            <Popconfirm
              title="Delete BOM Template"
              description="Are you sure you want to delete this BOM recipe template? This action cannot be undone."
              onConfirm={() => deleteBOM(templateId)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: isDeletingBOM }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={16} />}
                className="hover:!bg-red-50"
              />
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* --- Top Header Section --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-spaceGrotesk text-2xl font-bold text-[#092968]">
            Kitchen & Inventory Management
          </h2>
          <p className="text-sm text-gray-500">
            Control raw materials, food items catalog, and Bill of Materials (BOM) recipe templates
          </p>
        </div>

        {/* Global Tab Navigator & Chef Desk Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-2xl bg-gray-100/90 p-1.5 shadow-inner">
            <button
              onClick={() => setActiveTab('RAW_MATERIALS')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'RAW_MATERIALS'
                  ? 'bg-[#092968] text-white shadow-md'
                  : 'text-gray-600 hover:text-[#092968]'
              }`}
            >
              <Boxes size={16} />
              <span>Raw Materials</span>
            </button>

            <button
              onClick={() => setActiveTab('FOOD_ITEMS')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'FOOD_ITEMS'
                  ? 'bg-[#092968] text-white shadow-md'
                  : 'text-gray-600 hover:text-[#092968]'
              }`}
            >
              <Coffee size={16} />
              <span>Food Items</span>
            </button>

            <button
              onClick={() => setActiveTab('BOM_MANAGEMENT')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'BOM_MANAGEMENT'
                  ? 'bg-[#092968] text-white shadow-md'
                  : 'text-gray-600 hover:text-[#092968]'
              }`}
            >
              <ChefHat size={16} />
              <span>BOM Templates</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/dashboard/chef-desk')}
            className="flex items-center gap-2 rounded-2xl bg-[#F26E22] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-[#d95a14] active:scale-95"
          >
            <Flame size={16} />
            <span>Launch Chef's Desk (Tablet KDS)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-SECTION: RAW MATERIALS */}
      {/* ========================================================================= */}
      {activeTab === 'RAW_MATERIALS' && (
        <div className="animate-in fade-in space-y-6 duration-300">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Total Raw Materials
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold text-[#092968]">
                    {rawStats.totalItems}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#092968]">
                  <Boxes size={24} />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Low / Out of Stock
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold text-[#F26E22]">
                    {rawStats.lowStockCount}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F26E22]">
                  <AlertTriangle size={24} />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Total Stock Volume
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold text-emerald-600">
                    {Number(rawStats.totalQty).toLocaleString('en-US', {
                      maximumFractionDigits: 1,
                    })}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <PackageCheck size={24} />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Active Categories
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold text-purple-600">
                    {rawStats.categoriesCount}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <Wheat size={24} />
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Search raw material by name or ID..."
                prefix={<Search size={18} className="mr-2 text-gray-400" />}
                value={rawSearchTerm}
                onChange={(e) => setRawSearchTerm(e.target.value)}
                className="h-11 max-w-sm rounded-xl hover:border-[#F26E22] focus:border-[#F26E22]"
                allowClear
              />

              <Select
                value={rawCategoryFilter}
                onChange={(val) => setRawCategoryFilter(val)}
                className="h-11 w-52 rounded-xl"
                placeholder="Filter by Category"
              >
                <Option value="ALL">All Categories</Option>
                {RAW_MATERIAL_CATEGORIES.map((cat) => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select>

              <Select
                value={rawStockFilter}
                onChange={(val) => setRawStockFilter(val)}
                className="h-11 w-44 rounded-xl"
                placeholder="Filter by Stock"
              >
                <Option value="ALL">All Stock Status</Option>
                <Option value="IN_STOCK">In Stock (&gt; 10)</Option>
                <Option value="LOW_STOCK">Low Stock (&le; 10)</Option>
                <Option value="OUT_OF_STOCK">Out of Stock (0)</Option>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="default"
                icon={<RotateCw size={16} />}
                onClick={() => refetchRaw()}
                className="h-11 rounded-xl"
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<Plus size={18} />}
                onClick={() => {
                  setSelectedRawMaterial(null);
                  setRawModalType('add');
                  rawForm.resetFields();
                  setRawModalOpen(true);
                }}
                className="h-11 rounded-xl !border-none !bg-[#F26E22] font-bold text-white shadow-md hover:!bg-[#D95C1A]"
              >
                Add Raw Material
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
            <Table
              dataSource={rawMaterialsList}
              columns={rawColumns}
              rowKey={(r) => r.materialId || (r as any).material_id || Math.random().toString()}
              loading={isRawLoading || isAddingRaw || isUpdatingRaw || isDeletingRaw}
              pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} raw materials` }}
              className="custom-table"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-SECTION: FOOD ITEMS */}
      {/* ========================================================================= */}
      {activeTab === 'FOOD_ITEMS' && (
        <div className="animate-in fade-in space-y-6 duration-300">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Total Food Items
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold text-[#092968]">
                    {foodStats.total}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#092968]">
                  <Coffee size={24} />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Kitchen Prepared Dishes
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold text-[#F26E22]">
                    {foodStats.kitchenCount}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F26E22]">
                  <ChefHat size={24} />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Direct / Ready-Made
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold text-blue-600">
                    {foodStats.directCount}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <PackageCheck size={24} />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Total Portions In Stock
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold text-emerald-600">
                    {foodStats.totalUnits}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Boxes size={24} />
                </div>
              </div>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Search food item by name..."
                prefix={<Search size={18} className="mr-2 text-gray-400" />}
                value={foodSearchTerm}
                onChange={(e) => setFoodSearchTerm(e.target.value)}
                className="h-11 max-w-sm rounded-xl hover:border-[#F26E22] focus:border-[#F26E22]"
                allowClear
              />

              <Select
                value={foodTypeFilter}
                onChange={(val) => setFoodTypeFilter(val)}
                className="h-11 w-56 rounded-xl"
                placeholder="Filter by Preparation"
              >
                <Option value="ALL">All Food Items</Option>
                <Option value="KITCHEN_PREPARED">Kitchen Prepared Only</Option>
                <Option value="READY_MADE">Ready-Made / Direct Only</Option>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="default"
                icon={<RotateCw size={16} />}
                onClick={() => refetchFood()}
                className="h-11 rounded-xl"
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<Plus size={18} />}
                onClick={() => {
                  setSelectedFoodItem(null);
                  setFoodModalType('add');
                  foodForm.resetFields();
                  setFoodModalOpen(true);
                }}
                className="h-11 rounded-xl !border-none !bg-[#F26E22] font-bold text-white shadow-md hover:!bg-[#D95C1A]"
              >
                Add Food Item
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
            <Table
              dataSource={foodItemsList}
              columns={foodColumns}
              rowKey={(r) => r.itemId || (r as any).id || Math.random().toString()}
              loading={isFoodLoading || isCreatingFood || isUpdatingFood || isDeletingFood}
              pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} food items` }}
              className="custom-table"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-SECTION: BOM TEMPLATES */}
      {/* ========================================================================= */}
      {activeTab === 'BOM_MANAGEMENT' && (
        <div className="animate-in fade-in space-y-6 duration-300">
          {/* Header Description Card */}
          <div className="rounded-[2rem] border border-orange-100 bg-gradient-to-r from-orange-50/70 via-white to-orange-50/40 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F26E22] text-white shadow-md">
                  <ChefHat size={28} />
                </div>
                <div>
                  <h3 className="font-spaceGrotesk text-lg font-bold text-[#092968]">
                    Bill of Materials (BOM) & Recipe Formulation
                  </h3>
                  <p className="text-xs text-gray-500">
                    Define raw ingredient portions required per guest for each kitchen-cooked food item
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="default"
                  icon={<RotateCw size={16} />}
                  onClick={() => refetchBOMs()}
                  className="h-11 rounded-xl"
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={18} />}
                  onClick={openCreateBOMDrawer}
                  className="h-11 rounded-xl !border-none !bg-[#F26E22] font-bold text-white shadow-md hover:!bg-[#D95C1A]"
                >
                  Create BOM Template
                </Button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <Input
              placeholder="Search BOM recipe template by name or dish..."
              prefix={<Search size={18} className="mr-2 text-gray-400" />}
              value={bomSearchTerm}
              onChange={(e) => setBomSearchTerm(e.target.value)}
              className="h-11 max-w-md rounded-xl hover:border-[#F26E22] focus:border-[#F26E22]"
              allowClear
            />
            <span className="text-xs font-semibold text-gray-400">
              Showing {bomTemplatesList.length} recipe templates
            </span>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
            <Table
              dataSource={bomTemplatesList}
              columns={bomColumns}
              rowKey={(r) => r.templateId || (r as any).id || (r as any).template_id || Math.random().toString()}
              loading={isBOMsLoading || isCreatingBOM || isDeletingBOM}
              pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} templates` }}
              className="custom-table"
            />
          </div>
        </div>
      )}

      {/* --- ADD / EDIT RAW MATERIAL MODAL --- */}
      <ActionDialog
        modalOpen={rawModalOpen}
        handleCancel={() => {
          setRawModalOpen(false);
          setSelectedRawMaterial(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <Boxes className="text-[#F26E22]" size={22} />
            <span className="font-spaceGrotesk font-bold text-[#092968]">
              {rawModalType === 'add' ? 'Add New Raw Material' : 'Edit Raw Material'}
            </span>
          </div>
        }
        children={
          <Form
            form={rawForm}
            layout="vertical"
            onFinish={handleRawFormFinish}
            className="w-full space-y-4"
          >
            <Form.Item
              label={<span className="text-xs font-semibold text-[#0B1B3D]">Material Name</span>}
              name="materialName"
              rules={[{ required: true, message: 'Please enter raw material name' }]}
            >
              <Input
                placeholder="e.g. Basmati Rice, Chicken Breast, Olive Oil"
                className="h-10 rounded-xl hover:border-[#F26E22] focus:border-[#F26E22]"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-[#0B1B3D]">Category</span>}
              name="category"
              rules={[{ required: true, message: 'Please select category' }]}
            >
              <Select placeholder="Select category" className="w-full rounded-xl">
                {RAW_MATERIAL_CATEGORIES.map((cat) => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-[#0B1B3D]">Unit of Measure (UOM)</span>}
                  name="unitOfMeasure"
                  rules={[{ required: true, message: 'Select unit' }]}
                >
                  <Select placeholder="Select unit" className="w-full rounded-xl">
                    {UNITS_OF_MEASURE.map((uom) => (
                      <Option key={uom.value} value={uom.value}>
                        {uom.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-[#0B1B3D]">Quantity On Hand</span>}
                  name="quantityOnHand"
                  rules={[{ required: true, message: 'Enter quantity' }]}
                >
                  <InputNumber
                    min={0}
                    step={0.5}
                    placeholder="e.g. 100"
                    className="flex h-10 w-full items-center rounded-xl"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item className="pt-2">
              <CustomButton
                type="primary"
                className="w-full !bg-[#F26E22] hover:!bg-[#D95C1A]"
                buttonName={rawModalType === 'add' ? 'Add Raw Material' : 'Save Changes'}
                icon={<Plus size={18} />}
                htmlType="submit"
                loading={isAddingRaw || isUpdatingRaw}
              />
            </Form.Item>
          </Form>
        }
      />

      {/* --- ADD / EDIT FOOD ITEM MODAL --- */}
      <ActionDialog
        modalOpen={foodModalOpen}
        handleCancel={() => {
          setFoodModalOpen(false);
          setSelectedFoodItem(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <Coffee className="text-[#F26E22]" size={22} />
            <span className="font-spaceGrotesk font-bold text-[#092968]">
              {foodModalType === 'add' ? 'Add New Food Item' : 'Edit Food Item'}
            </span>
          </div>
        }
        children={
          <Form
            form={foodForm}
            layout="vertical"
            onFinish={handleFoodFormFinish}
            className="w-full space-y-4"
          >
            <Form.Item
              label={<span className="text-xs font-semibold text-[#0B1B3D]">Item Name</span>}
              name="name"
              rules={[{ required: true, message: 'Enter food item name' }]}
            >
              <Input placeholder="e.g. Chicken Biryani, Iced Tea" className="h-10 rounded-xl" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-[#0B1B3D]">Price (LKR)</span>}
              name="price"
              rules={[{ required: true, message: 'Enter price' }]}
            >
              <InputNumber
                className="flex h-10 w-full items-center rounded-xl"
                placeholder="e.g. 1500"
                formatter={(value) => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/LKR\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-[#0B1B3D]">Quantity (Stock Portions)</span>}
              name="quantity"
              rules={[{ required: true, message: 'Enter stock quantity' }]}
            >
              <InputNumber
                className="flex h-10 w-full items-center rounded-xl"
                placeholder="e.g. 20"
                min={0}
              />
            </Form.Item>

            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
              <div>
                <p className="text-xs font-bold text-[#092968]">
                  Prepared in Kitchen?
                </p>
                <p className="text-[11px] text-gray-400">
                  Enable if this item is cooked or prepared in the kitchen
                </p>
              </div>
              <Form.Item
                name="isKitchenPrepared"
                valuePropName="checked"
                noStyle
                initialValue={false}
              >
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  className="bg-gray-300"
                />
              </Form.Item>
            </div>

            <Form.Item className="pt-2">
              <CustomButton
                type="primary"
                className="w-full !bg-[#F26E22] hover:!bg-[#D95C1A]"
                buttonName={foodModalType === 'add' ? 'Add Food Item' : 'Save Changes'}
                icon={<Plus size={18} />}
                htmlType="submit"
                loading={isCreatingFood || isUpdatingFood}
              />
            </Form.Item>
          </Form>
        }
      />

      {/* --- CREATE BOM TEMPLATE DRAWER --- */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F26E22]">
              <ChefHat size={20} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-bold text-[#092968]">
                Create BOM Recipe Template
              </h3>
              <p className="text-xs text-gray-400">
                Define required raw materials and portions per guest
              </p>
            </div>
          </div>
        }
        width={580}
        open={bomDrawerOpen}
        onClose={() => setBomDrawerOpen(false)}
        className="custom-scrollbar rounded-l-[2.5rem]"
        footer={
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-4">
            <Button
              className="h-11 rounded-xl font-semibold"
              onClick={() => setBomDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={isCreatingBOM}
              onClick={() => bomForm.submit()}
              className="h-11 rounded-xl !border-none !bg-[#F26E22] font-bold text-white shadow-md hover:!bg-[#D95C1A]"
            >
              Save BOM Template
            </Button>
          </div>
        }
      >
        <Form
          form={bomForm}
          layout="vertical"
          onFinish={handleBOMFinish}
          requiredMark={false}
          className="space-y-4"
        >
          {/* Hidden createdBy */}
          <Form.Item name="createdBy" hidden>
            <Input />
          </Form.Item>

          {/* 1. Target Kitchen-Prepared Food Dish Selection */}
          <div>
            <Form.Item
              label={
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-[#0B1B3D]">
                    Target Kitchen-Prepared Food Dish
                  </span>
                  <Tag color="orange" className="rounded-md text-[10px] font-bold">
                    Kitchen Prepared Only
                  </Tag>
                </div>
              }
              name="itemId"
              rules={[{ required: true, message: 'Please select a kitchen-prepared food item' }]}
            >
              <Select
                showSearch
                placeholder="Select kitchen prepared dish from menu..."
                className="h-11 w-full rounded-xl"
                optionFilterProp="children"
                notFoundContent={
                  <div className="p-3 text-center text-xs text-gray-400">
                    No kitchen prepared dishes found. Please enable "Prepared in Kitchen" in the Food Items tab.
                  </div>
                }
              >
                {kitchenPreparedFoods.map((f: FoodItem) => (
                  <Option key={f.itemId || (f as any).id} value={f.itemId || (f as any).id}>
                    {f.name} — LKR {Number(f.unitPrice).toLocaleString()}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Divider className="my-2" />

          {/* 2. Modern Raw Materials / Ingredients Configuration */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#092968]">
                  Raw Material Ingredients (Recipe BOM)
                </h4>
                <p className="text-[11px] text-gray-400">
                  Select ingredients and set quantity required for 1 guest portion
                </p>
              </div>
              <Tag color="blue" className="rounded-lg px-2 py-0.5 text-xs font-bold">
                {watchedBOMItems?.length || 0} ingredient(s)
              </Tag>
            </div>

            <Form.List name="items">
              {(fields, { add, remove }) => (
                <div className="space-y-3">
                  {fields.map(({ key, name, ...restField }, index) => {
                    const currentMaterialId = watchedBOMItems?.[name]?.materialId;
                    const matchedRaw = rawMaterialsResponse?.data?.find(
                      (r: RawMaterial) =>
                        r.materialId === currentMaterialId || (r as any).material_id === currentMaterialId,
                    );
                    const rawUOM = matchedRaw?.unitOfMeasure || (matchedRaw as any)?.unit_of_measure || 'units';

                    return (
                      <div
                        key={key}
                        className="group relative rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#092968] text-[10px] font-extrabold text-white">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-700">
                              Ingredient #{index + 1}
                            </span>
                            {matchedRaw && (
                              <Tag color="orange" className="rounded-md text-[10px] font-semibold">
                                {matchedRaw.category}
                              </Tag>
                            )}
                          </div>

                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<Trash2 size={15} />}
                            onClick={() => remove(name)}
                            disabled={fields.length === 1}
                            className="text-gray-400 hover:text-red-500 hover:!bg-red-50"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                          {/* Raw Material Select */}
                          <div className="sm:col-span-7">
                            <Form.Item
                              {...restField}
                              name={[name, 'materialId']}
                              rules={[{ required: true, message: 'Select ingredient' }]}
                              className="!mb-0"
                            >
                              <Select
                                showSearch
                                placeholder="Search & select raw material..."
                                className="w-full rounded-xl"
                                optionFilterProp="children"
                              >
                                {rawMaterialsResponse?.data?.map((raw: RawMaterial) => (
                                  <Option
                                    key={raw.materialId || (raw as any).material_id}
                                    value={raw.materialId || (raw as any).material_id}
                                  >
                                    {raw.materialName} ({raw.unitOfMeasure})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </div>

                          {/* Portion Qty Per Person */}
                          <div className="sm:col-span-5">
                            <Form.Item
                              {...restField}
                              name={[name, 'qtyPerPerson']}
                              rules={[{ required: true, message: 'Enter portion qty' }]}
                              className="!mb-0"
                            >
                              <InputNumber
                                min={0.0001}
                                step={0.05}
                                placeholder="e.g. 0.250"
                                addonAfter={<span className="font-semibold text-xs text-gray-600">{rawUOM}</span>}
                                className="flex w-full items-center rounded-xl"
                              />
                            </Form.Item>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="dashed"
                    onClick={() => add({ materialId: undefined, qtyPerPerson: undefined })}
                    icon={<Plus size={16} />}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-dashed border-gray-300 font-bold text-[#092968] transition-all hover:!border-[#F26E22] hover:!text-[#F26E22]"
                  >
                    Add Raw Material Ingredient
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
        </Form>
      </Drawer>

      {/* --- VIEW BOM TEMPLATE DETAILS MODAL --- */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F26E22]">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-bold text-[#092968]">
                {selectedBOM?.templateName}
              </h3>
              <p className="text-xs text-gray-400">
                Bill of Materials Recipe Breakdown
              </p>
            </div>
          </div>
        }
        width={480}
        open={isViewBOMOpen}
        onClose={() => {
          setIsViewBOMOpen(false);
          setSelectedBOM(null);
        }}
        footer={
          <div className="flex justify-end border-t border-gray-100 p-4">
            <Button
              className="h-10 rounded-xl font-semibold"
              onClick={() => setIsViewBOMOpen(false)}
            >
              Close
            </Button>
          </div>
        }
      >
        {selectedBOM && (
          <div className="space-y-4">
            {/* Food Item Linked Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#092968] to-[#0F2942] p-5 text-white shadow-md">
              <span className="text-[11px] font-bold uppercase tracking-widest text-orange-300">
                Target Recipe Dish
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {selectedBOM.foodItem?.name ||
                  foodItemsResponse?.data?.find(
                    (f: FoodItem) =>
                      f.itemId === selectedBOM.itemId || (f as any).id === selectedBOM.itemId,
                  )?.name ||
                  'Food Dish'}
              </h2>
            </div>

            {/* Ingredients Table / List */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                Required Raw Materials (Per 1 Portion)
              </h4>

              <div className="space-y-2.5">
                {(
                  selectedBOM.items ||
                  selectedBOM.templateItems ||
                  (selectedBOM as any).bomTemplateItems ||
                  []
                ).map((ing: any, idx: number) => {
                  const rawMat = rawMaterialsResponse?.data?.find(
                    (r: RawMaterial) =>
                      r.materialId === ing.materialId ||
                      (r as any).material_id === ing.materialId,
                  );
                  const name = ing.materialName || rawMat?.materialName || `Ingredient #${idx + 1}`;
                  const uom = ing.unitOfMeasure || rawMat?.unitOfMeasure || 'units';
                  const qty = ing.qtyPerPerson || (ing as any).qty_per_person || 0;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-gray-50 pb-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 font-bold text-gray-600 text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#0B1B3D]">{name}</span>
                      </div>
                      <Tag color="orange" className="font-mono text-xs font-bold rounded-md">
                        {qty} {uom} / person
                      </Tag>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default KitchenManagement;
