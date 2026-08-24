import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Drawer,
  Space,
  Form,
  Popconfirm,
  Select,
  InputNumber,
} from 'antd';
import { Plus, Edit, Trash2, Utensils, Info, Coffee } from 'lucide-react';
import ActionDialog from '../../components/common/ActionDialog';
import CustomButton from '../../components/common/CustomButton';
import mealMutation from '../../mutations/meal.mutation';
import type { MealPlan, FoodItem } from '../../types/services.interfaces';

const { Option } = Select;

const MealManagement = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('add');
  const [isFoodItemDrawerOpen, setIsFoodItemDrawerOpen] = useState(false);
  const [foodItemModalOpen, setFoodItemModalOpen] = useState(false);
  const [foodItemDrawerType, setFoodItemDrawerType] = useState('add');
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [form] = Form.useForm();
  const [foodForm] = Form.useForm();

  const {
    getAllMealPlansMutation,
    createMealPlanMutation,
    updateMealPlanMutation,
    deleteMealPlanMutation,
    getAllFoodItemsMutation,
    addFoodItemMutation,
    updateFoodItemMutation,
    deleteFoodItemMutation,
  } = mealMutation();

  const { data: mealPlans } = getAllMealPlansMutation();
  const { data: foodItems } = getAllFoodItemsMutation();

  const { mutateAsync: createMealPlan, isPending: createMealPlanLoading } =
    createMealPlanMutation();
  const { mutateAsync: updateMealPlan, isPending: updateMealPlanLoading } =
    updateMealPlanMutation();
  const { mutateAsync: deleteMealPlan, isPending: deleteMealPlanLoading } =
    deleteMealPlanMutation();

  const { mutateAsync: createFoodItem, isPending: createFoodItemLoading } =
    addFoodItemMutation();
  const { mutateAsync: updateFoodItem, isPending: updateFoodItemLoading } =
    updateFoodItemMutation();
  const { mutateAsync: deleteFoodItem, isPending: deleteFoodItemLoading } =
    deleteFoodItemMutation();

  useEffect(() => {
    if (drawerType === 'edit' && selectedMealPlan) {
      form.setFieldsValue({
        planName: selectedMealPlan.name,
        planCode: selectedMealPlan.planCode,
        pricePerPerson: selectedMealPlan.price,
        status: selectedMealPlan.status,
      });
    } else {
      form.resetFields();
    }
  }, [selectedMealPlan, drawerType, form, isDrawerOpen]);

  useEffect(() => {
    if (foodItemDrawerType === 'edit' && selectedFoodItem) {
      foodForm.setFieldsValue({
        name: selectedFoodItem.name,
        price: selectedFoodItem.unitPrice,
        quantity: selectedFoodItem.quantityOnHand,
      });
    } else {
      foodForm.resetFields();
    }
  }, [selectedFoodItem, foodItemDrawerType, foodForm, foodItemModalOpen]);

  // Handlers
  const handleMealPlanFinish = async (values: any) => {
    const data = {
      name: values.planName,
      planCode: values.planCode,
      price: values.pricePerPerson,
      status: values.status,
    };

    if (drawerType === 'add') {
      await createMealPlan(data);
    } else {
      await updateMealPlan({ planId: selectedMealPlan?.planId, ...data });
    }
    setIsDrawerOpen(false);
    setSelectedMealPlan(null);
  };

  const handleFoodItemFinish = async (values: any) => {
    const data = {
      name: values.name,
      unitPrice: values.price,
      quantityOnHand: values.quantity,
    };

    if (foodItemDrawerType === 'add') {
      await createFoodItem(data);
    } else {
      await updateFoodItem({ itemId: selectedFoodItem?.itemId, ...data });
    }
    setFoodItemModalOpen(false);
    setSelectedFoodItem(null);
  };

  // Table Columns
  const columns = [
    {
      title: 'Plan Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-bold text-blue-600">{text}</span>,
    },
    {
      title: 'Code',
      dataIndex: 'planCode',
      key: 'planCode',
      render: (planCode: string) => (
        <span className="font-bold text-blue-600">{planCode}</span>
      ),
    },
    {
      title: 'Price Per Person (LKR)',
      dataIndex: 'price',
      key: 'price',
      render: (val: number) => (
        <span className="font-semibold text-gray-700">Rs.{val?.toLocaleString()}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'} className="rounded-full px-3">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: MealPlan) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Edit size={18} className="text-gray-400 hover:text-orange-500" />}
            onClick={() => {
              setSelectedMealPlan(record);
              setDrawerType('edit');
              setIsDrawerOpen(true);
            }}
          />
          <Popconfirm
            title="Delete the meal plan"
            description="Are you sure to delete this meal plan?"
            onConfirm={() => deleteMealPlan(record.planId!)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<Trash2 size={18} className="text-gray-400 hover:text-red-500" />}
              loading={deleteMealPlanLoading}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      {/* --- 1. Header & Actions --- */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#0F2942]">Meal Management</h2>
          <p className="text-sm text-gray-400">
            Configure meal plans and restaurant pricing
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            type="primary"
            size="large"
            icon={<Plus size={20} />}
            onClick={() => {
              setDrawerType('add');
              setIsDrawerOpen(true);
            }}
            className="flex h-12 items-center gap-2 rounded-xl border-none bg-blue-600 shadow-lg hover:bg-orange-500"
          >
            Add New Plan
          </Button>
          <Button
            size="large"
            onClick={() => {
              setIsFoodItemDrawerOpen(true);
            }}
            className="flex h-12 items-center gap-2 rounded-xl border-none bg-orange-500 text-white shadow-lg hover:bg-orange-600"
          >
            Food Items
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <Table
          dataSource={mealPlans?.data}
          columns={columns}
          pagination={{ pageSize: 5 }}
          className="custom-table"
        />
      </div>

      {/* Meal Plan Drawer */}
      <Drawer
        title={
          <span className="text-xl font-bold">
            {drawerType === 'add' ? 'Add New Meal Plan' : 'Update Pricing'}
          </span>
        }
        placement="right"
        width={450}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        className="rounded-l-[2rem]"
      >
        <Form
          form={form}
          layout="vertical"
          className="space-y-4"
          onFinish={handleMealPlanFinish}
        >
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <Utensils className="text-blue-500" size={24} />
            <div>
              <p className="text-xs font-bold uppercase text-blue-600">
                Pricing Strategy
              </p>
              <p className="text-sm font-medium text-blue-900">
                Rates are calculated per person per night.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
            <h4 className="mb-2 flex items-center gap-2 font-bold text-gray-700">
              <Info size={16} /> Important Note
            </h4>
            <p className="text-xs leading-relaxed text-gray-500">
              Please note that after changing the prices here, the new prices will
              automatically apply to all new reservations.
            </p>
          </div>

          <Form.Item label="Meal Plan Name" name="planName" rules={[{ required: true }]}>
            <Input placeholder="e.g. Full Board" className="h-10 rounded-lg" />
          </Form.Item>

          <Form.Item label="Plan Code" name="planCode" rules={[{ required: true }]}>
            <Input placeholder="e.g. FB" className="h-10 rounded-lg" />
          </Form.Item>

          <Form.Item
            label="Price Per Person (LKR)"
            name="pricePerPerson"
            rules={[{ required: true }]}
          >
            <InputNumber
              className="flex h-10 w-full items-center rounded-lg"
              formatter={(value) => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/LKR\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select placeholder="Select Status" className="h-10 rounded-lg">
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item className="flex justify-end !gap-2 !space-x-2 pt-4">
            <Button onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              className="ml-4 rounded-lg border-none bg-blue-600"
              htmlType="submit"
              loading={createMealPlanLoading || updateMealPlanLoading}
            >
              {drawerType === 'add' ? 'Create Plan' : 'Save Changes'}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Food Items Drawer */}
      <Drawer
        title={<span className="text-xl font-bold">Food Items Management</span>}
        placement="right"
        width={400}
        onClose={() => setIsFoodItemDrawerOpen(false)}
        open={isFoodItemDrawerOpen}
        className="rounded-l-[2rem]"
      >
        <div className="space-y-6">
          <Button
            type="primary"
            size="large"
            icon={<Plus size={20} />}
            onClick={() => {
              setFoodItemDrawerType('add');
              setFoodItemModalOpen(true);
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-none bg-orange-500 shadow-lg hover:bg-orange-600"
          >
            Add New Food Item
          </Button>

          <div className="grid gap-4">
            {foodItems?.data?.map((item: FoodItem, idx: number) => (
              <div
                key={idx}
                className="group relative flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100">
                  <Coffee size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{item.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                    <span>LKR {item?.unitPrice?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Button
                    type="text"
                    size="small"
                    icon={
                      <Edit size={16} className="text-gray-400 hover:text-orange-500" />
                    }
                    onClick={() => {
                      setSelectedFoodItem(item);
                      setFoodItemDrawerType('edit');
                      setFoodItemModalOpen(true);
                    }}
                  />
                  <Popconfirm
                    title="Delete food item"
                    onConfirm={() => deleteFoodItem(item.itemId!)}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={
                        <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                      }
                      loading={deleteFoodItemLoading}
                    />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Drawer>

      {/* Add/Edit Food Item Modal */}
      <ActionDialog
        modalOpen={foodItemModalOpen}
        handleCancel={() => {
          setFoodItemModalOpen(false);
          setSelectedFoodItem(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <Coffee className="text-orange-500" size={24} />
            <span>
              {foodItemDrawerType === 'add' ? 'Add New Food Item' : 'Edit Food Item'}
            </span>
          </div>
        }
        children={
          <Form
            form={foodForm}
            layout="vertical"
            onFinish={handleFoodItemFinish}
            className="w-full space-y-4"
          >
            <Form.Item label="Item Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Fresh Orange Juice" className="h-10 rounded-lg" />
            </Form.Item>

            <Form.Item label="Price (LKR)" name="price" rules={[{ required: true }]}>
              <InputNumber
                className="flex h-10 w-full items-center rounded-lg"
                placeholder="e.g. 1500"
                formatter={(value) =>
                  `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => value!.replace(/LKR\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}>
              <InputNumber
                className="flex h-10 w-full items-center rounded-lg"
                placeholder="e.g. 10"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/LKR\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item className="pt-4">
              <CustomButton
                type="primary"
                className="w-full bg-orange-500"
                buttonName={
                  foodItemDrawerType === 'add' ? 'Add Food Item' : 'Save Changes'
                }
                icon={<Plus size={20} />}
                htmlType="submit"
                loading={createFoodItemLoading || updateFoodItemLoading}
              />
            </Form.Item>
          </Form>
        }
      />
    </div>
  );
};

export default MealManagement;
