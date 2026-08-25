import { useState, useMemo, useEffect } from 'react';
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
  Beef,
  Fish,
  Milk,
  Flame,
  Droplet,
  Coffee,
  Package,
} from 'lucide-react';
import ActionDialog from '../../components/common/ActionDialog';
import CustomButton from '../../components/common/CustomButton';
import kitchenMutation from '../../mutations/kitchen.mutation';
import {
  RAW_MATERIAL_CATEGORIES,
  UNITS_OF_MEASURE,
  type RawMaterial,
} from '../../types/kitchen.interfaces';

const { Option } = Select;

const KitchenManagement = () => {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  // React Query Mutations
  const {
    getAllRawMaterialsQuery,
    addRawMaterialMutation,
    updateRawMaterialMutation,
    deleteRawMaterialMutation,
  } = kitchenMutation();

  const { data: rawMaterialsResponse, isLoading, refetch } = getAllRawMaterialsQuery();
  const { mutateAsync: addMaterial, isPending: isAdding } = addRawMaterialMutation();
  const { mutateAsync: updateMaterial, isPending: isUpdating } = updateRawMaterialMutation();
  const { mutateAsync: deleteMaterial, isPending: isDeleting } = deleteRawMaterialMutation();

  // Populate form on edit
  useEffect(() => {
    if (modalType === 'edit' && selectedMaterial) {
      form.setFieldsValue({
        materialName:
          selectedMaterial.materialName || (selectedMaterial as any).material_name,
        category: selectedMaterial.category || 'GRAINS',
        unitOfMeasure:
          selectedMaterial.unitOfMeasure || (selectedMaterial as any).unit_of_measure || 'kg',
        quantityOnHand:
          selectedMaterial.quantityOnHand ?? (selectedMaterial as any).quantity_on_hand ?? 0,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        category: 'GRAINS',
        unitOfMeasure: 'kg',
        quantityOnHand: 0,
      });
    }
  }, [selectedMaterial, modalType, form, modalOpen]);

  // Handle Form Submit
  const handleFormFinish = async (values: any) => {
    const data = {
      materialName: values.materialName,
      category: values.category,
      unitOfMeasure: values.unitOfMeasure,
      quantityOnHand: Number(values.quantityOnHand),
    };

    if (modalType === 'add') {
      await addMaterial(data);
    } else {
      const materialId =
        selectedMaterial?.materialId || (selectedMaterial as any)?.material_id;
      await updateMaterial({ materialId, ...data });
    }

    setModalOpen(false);
    setSelectedMaterial(null);
  };

  // Open Add Modal
  const openAddModal = () => {
    setSelectedMaterial(null);
    setModalType('add');
    form.resetFields();
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setModalType('edit');
    setModalOpen(true);
  };

  // Filtered List
  const rawMaterialsList: RawMaterial[] = useMemo(() => {
    const rawList = rawMaterialsResponse?.data || [];
    return rawList.filter((item: RawMaterial) => {
      const name = item.materialName || (item as any).material_name || '';
      const category = item.category || '';
      const id = item.materialId || (item as any).material_id || '';
      const qty = item.quantityOnHand ?? (item as any).quantity_on_hand ?? 0;

      const matchesSearch =
        !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'ALL' || category.toUpperCase() === categoryFilter.toUpperCase();

      let matchesStock = true;
      if (stockFilter === 'OUT_OF_STOCK') matchesStock = qty <= 0;
      else if (stockFilter === 'LOW_STOCK') matchesStock = qty > 0 && qty <= 10;
      else if (stockFilter === 'IN_STOCK') matchesStock = qty > 10;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [rawMaterialsResponse, searchTerm, categoryFilter, stockFilter]);

  // Statistics
  const stats = useMemo(() => {
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

  // Category Icon & Color Helper
  const getCategoryInfo = (category: string) => {
    const found = RAW_MATERIAL_CATEGORIES.find(
      (c) => c.value.toUpperCase() === (category || '').toUpperCase(),
    );
    return found || { label: category || 'General', color: 'default' };
  };

  // Stock Status Tag Helper
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

  // Table Columns
  const columns = [
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
              onClick={() => openEditModal(record)}
            />
            <Popconfirm
              title="Delete Raw Material"
              description="Are you sure you want to delete this raw material? This action cannot be undone."
              onConfirm={() => deleteMaterial(materialId)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: isDeleting }}
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
            Kitchen Management (Raw Materials)
          </h2>
          <p className="text-sm text-gray-500">
            Manage kitchen ingredients, stock levels, raw material categories, and unit measures
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="default"
            icon={<RotateCw size={16} />}
            onClick={() => refetch()}
            className="h-11 rounded-xl border-gray-200 text-gray-600 hover:border-gray-300"
          >
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={openAddModal}
            className="h-11 rounded-xl !border-none !bg-[#F26E22] font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
          >
            Add Raw Material
          </Button>
        </div>
      </div>

      {/* --- KPI Summary Cards --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Items */}
        <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total Raw Materials
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-[#092968]">
                {stats.totalItems}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#092968]">
              <Boxes size={24} />
            </div>
          </div>
        </Card>

        {/* Low Stock Warning */}
        <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Low / Out of Stock
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-[#F26E22]">
                {stats.lowStockCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F26E22]">
              <AlertTriangle size={24} />
            </div>
          </div>
        </Card>

        {/* Total Stock Quantity */}
        <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total Stock Volume
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-emerald-600">
                {Number(stats.totalQty).toLocaleString('en-US', { maximumFractionDigits: 1 })}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PackageCheck size={24} />
            </div>
          </div>
        </Card>

        {/* Active Categories */}
        <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Active Categories
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-purple-600">
                {stats.categoriesCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Wheat size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* --- Search and Filter Bar --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search material by name or ID..."
            prefix={<Search size={18} className="mr-2 text-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 max-w-sm rounded-xl hover:border-[#F26E22] focus:border-[#F26E22]"
            allowClear
          />

          <Select
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
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
            value={stockFilter}
            onChange={(val) => setStockFilter(val)}
            className="h-11 w-44 rounded-xl"
            placeholder="Filter by Stock"
          >
            <Option value="ALL">All Stock Status</Option>
            <Option value="IN_STOCK">In Stock (&gt; 10)</Option>
            <Option value="LOW_STOCK">Low Stock (&le; 10)</Option>
            <Option value="OUT_OF_STOCK">Out of Stock (0)</Option>
          </Select>
        </div>

        <span className="text-xs font-semibold text-gray-400">
          Showing {rawMaterialsList.length} materials
        </span>
      </div>

      {/* --- Raw Materials Data Table --- */}
      <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <Table
          dataSource={rawMaterialsList}
          columns={columns}
          rowKey={(r) => r.materialId || (r as any).material_id || Math.random().toString()}
          loading={isLoading || isAdding || isUpdating || isDeleting}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} raw materials`,
          }}
          className="custom-table"
        />
      </div>

      {/* --- Add / Edit Raw Material Modal --- */}
      <ActionDialog
        modalOpen={modalOpen}
        handleCancel={() => {
          setModalOpen(false);
          setSelectedMaterial(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#F26E22]">
              <Boxes size={20} />
            </div>
            <span className="font-spaceGrotesk font-bold text-[#092968]">
              {modalType === 'add' ? 'Add New Raw Material' : 'Edit Raw Material'}
            </span>
          </div>
        }
        children={
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormFinish}
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
              rules={[{ required: true, message: 'Please select a category' }]}
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
                buttonName={modalType === 'add' ? 'Add Raw Material' : 'Save Changes'}
                icon={<Plus size={18} />}
                htmlType="submit"
                loading={isAdding || isUpdating}
              />
            </Form.Item>
          </Form>
        }
      />
    </div>
  );
};

export default KitchenManagement;
