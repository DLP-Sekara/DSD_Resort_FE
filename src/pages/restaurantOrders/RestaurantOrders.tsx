import { useState, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Drawer,
  Space,
  Select,
  Form,
  Divider,
  Card,
  Popconfirm,
  Avatar,
  Dropdown,
  type MenuProps,
} from 'antd';
import {
  Plus,
  Eye,
  Trash2,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Search,
  RotateCw,
  MoreVertical,
  Receipt,
  Calendar,
} from 'lucide-react';
import restaurantOrderMutation from '../../mutations/restaurantOrder.mutation';
import mealMutation from '../../mutations/meal.mutation';
import userMutation from '../../mutations/user.mutation';
import settingMutation from '../../mutations/setting.mutation';
import { useAuth } from '../../hooks/useAuth';
import type {
  RestaurantOrder,
  RestaurantOrderDetail,
} from '../../types/restaurantOrder.interfaces';
import type { FoodItem, UserAccount } from '../../types/services.interfaces';
import { errorToast } from '../../components/common/Alert';
import dayjs from 'dayjs';

const { Option } = Select;

const RestaurantOrders = () => {
  const { userData } = useAuth();
  const [form] = Form.useForm();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // React Query Mutations
  const {
    getAllRestaurantOrdersQuery,
    createRestaurantOrderMutation,
    updateRestaurantOrderStatusMutation,
    deleteRestaurantOrderMutation,
  } = restaurantOrderMutation();

  const { getAllFoodItemsMutation } = mealMutation();
  const { getAllUsersMutation} = userMutation();
  const { getAllSystemUsersQuery } = settingMutation();

  const { data: ordersResponse, isLoading: isOrdersLoading, refetch: refetchOrders } =
    getAllRestaurantOrdersQuery();
  const { data: foodItemsResponse, isLoading: isFoodLoading } = getAllFoodItemsMutation();
  const { data: guestsResponse } = getAllUsersMutation();
  const { data: staffResponse } = getAllSystemUsersQuery();

  const { mutateAsync: createOrder, isPending: isCreatingOrder } =
    createRestaurantOrderMutation();
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    updateRestaurantOrderStatusMutation();
  const { mutateAsync: deleteOrder, isPending: isDeletingOrder } =
    deleteRestaurantOrderMutation();

  // Selected foods in create order drawer
  const watchedSelectedFoods = Form.useWatch('orderDetails', form);

  // Live order total price calculation
  const totalOrderAmount = useMemo(() => {
    if (!watchedSelectedFoods || !Array.isArray(watchedSelectedFoods)) return 0;
    return watchedSelectedFoods.reduce((acc: number, item: any) => {
      const price = item?.unitPrice || 0;
      const qty = item?.orderedQty || 0;
      return acc + price * qty;
    }, 0);
  }, [watchedSelectedFoods]);

  // Filtered orders list
  const ordersList: RestaurantOrder[] = useMemo(() => {
    const rawList = ordersResponse?.data || [];
    return rawList.filter((order: RestaurantOrder) => {
      const matchesStatus =
        statusFilter === 'ALL' || order.status?.toUpperCase() === statusFilter.toUpperCase();

      const guestName =
        order.guest?.name || order.guestName || (order as any).guest_name || '';
      const orderId = order.orderId || (order as any).order_id || '';
      const nic = order.guest?.nic || '';

      const matchesSearch =
        !searchTerm ||
        guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nic.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [ordersResponse, statusFilter, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const all = ordersResponse?.data || [];
    const total = all.length;
    const pending = all.filter(
      (o: RestaurantOrder) =>
        o.status === 'PENDING' || o.status === 'PREPARING',
    ).length;
    const completed = all.filter(
      (o: RestaurantOrder) => o.status === 'COMPLETED' || o.status === 'SERVED',
    ).length;
    const revenue = all
      .filter((o: RestaurantOrder) => o.status !== 'CANCELLED')
      .reduce((sum: number, o: RestaurantOrder) => sum + (o.totalAmount || (o as any).total_amount || 0), 0);

    return { total, pending, completed, revenue };
  }, [ordersResponse]);

  // Match logged-in user from userData with the All System Users array
  const currentHandledByUserId = useMemo(() => {
    if (!staffResponse?.data || !Array.isArray(staffResponse.data)) {
      return (userData as any)?.userId || '';
    }

    const matched = staffResponse.data.find(
      (u: any) =>
        (userData?.userId && u.userId === userData.userId) ||
        (userData?.email && u.email?.toLowerCase() === userData.email.toLowerCase()) ||
        (userData?.name && u.name?.toLowerCase() === userData.name.toLowerCase()),
    );

    return matched?.userId || (userData as any)?.userId || staffResponse.data[0]?.userId || '';
  }, [staffResponse, userData]);

  // Open Create Drawer
  const openCreateDrawer = () => {
    form.resetFields();
    form.setFieldsValue({
      status: 'PENDING',
      handledBy: currentHandledByUserId,
      orderDetails: [],
    });
    setIsDrawerOpen(true);
  };

  // Handle Create Order Submit
  const handleCreateOrder = async (values: any) => {
    if (!values.orderDetails || values.orderDetails.length === 0) {
      errorToast('Please add at least one food item to the order!');
      return;
    }

    const payload = {
      handledBy: values.handledBy || currentHandledByUserId || (userData as any)?.userId || '',
      status: 'PENDING',
      orderDetails: values.orderDetails.map((item: any) => ({
        itemId: item.itemId,
        orderedQty: Number(item.orderedQty),
      })),
    };

    const res = await createOrder(payload as any);
    if (res?.success) {
      setIsDrawerOpen(false);
      form.resetFields();
    }
  };

  // Handle Quick Status Change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateStatus({ orderId, status: newStatus });
  };

  // Handle Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    await deleteOrder(orderId);
  };

  // Helper status badge styling
  const renderStatusTag = (status: string) => {
    const s = (status || 'PENDING').toUpperCase();
    switch (s) {
      case 'COMPLETED':
        return (
          <Tag color="success" className="rounded-lg px-2.5 py-0.5 font-bold">
            COMPLETED
          </Tag>
        );
      case 'SERVED':
        return (
          <Tag color="cyan" className="rounded-lg px-2.5 py-0.5 font-bold">
            SERVED
          </Tag>
        );
      case 'PREPARING':
        return (
          <Tag color="processing" className="rounded-lg px-2.5 py-0.5 font-bold">
            PREPARING
          </Tag>
        );
      case 'CANCELLED':
        return (
          <Tag color="error" className="rounded-lg px-2.5 py-0.5 font-bold">
            CANCELLED
          </Tag>
        );
      case 'PENDING':
      default:
        return (
          <Tag color="warning" className="rounded-lg px-2.5 py-0.5 font-bold">
            PENDING
          </Tag>
        );
    }
  };

  // Table columns definition
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (id: string, record: RestaurantOrder) => {
        const orderIdVal = id || (record as any).order_id || 'ORD-N/A';
        return (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-[#092968]">
              #{String(orderIdVal).slice(-6).toUpperCase()}
            </span>
            <span className="text-[11px] text-gray-400">
              {dayjs(record.orderTime || (record as any).order_time).format('DD MMM YYYY, hh:mm A')}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Guest Details',
      key: 'guest',
      render: (_: any, record: RestaurantOrder) => {
        const gName =
          record.guest?.name ||
          record.guestName ||
          (record as any).guest_name ||
          guestsResponse?.data?.find((g: UserAccount) => g.guestId === record.guestId)?.name ||
          'Walk-in Guest';
        const gPhone =
          record.guest?.phone ||
          guestsResponse?.data?.find((g: UserAccount) => g.guestId === record.guestId)?.phone ||
          '';

        return (
          <div className="flex items-center gap-3">
            <Avatar className="!bg-[#092968] font-bold text-white">
              {gName.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <p className="text-sm font-bold text-[#0B1B3D]">{gName}</p>
              {gPhone && <p className="text-xs text-gray-400">{gPhone}</p>}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Handled By',
      key: 'handledBy',
      render: (_: any, record: RestaurantOrder) => {
        const staffId = record.handledBy || (record as any).handled_by;
        const staffUser = staffResponse?.data?.find(
          (u: any) => u.adminId === staffId || u.userId === staffId,
        );
        const name = record.handledByUser?.name || staffUser?.name || 'Staff Member';
        const role = record.handledByUser?.role || staffUser?.role || 'Staff';

        return (
          <div>
            <p className="text-xs font-semibold text-gray-700">{name}</p>
            <Tag color="geekblue" className="text-[10px] rounded-md font-semibold">
              {role}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Items Summary',
      key: 'items',
      render: (_: any, record: RestaurantOrder) => {
        const details =
          record.orderDetails || record.restaurantOrderDetails || (record as any).order_details || [];
        const count = details.length;
        return (
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={15} className="text-[#F26E22]" />
            <span className="text-xs font-semibold text-gray-700">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Total Amount',
      key: 'totalAmount',
      render: (_: any, record: RestaurantOrder) => {
        const amount =
          record.totalAmount || (record as any).total_amount || 0;
        return (
          <span className="font-bold text-[#092968]">
            LKR {Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: RestaurantOrder) => {
        const orderId = record.orderId || (record as any).order_id;
        const status = (record.status || 'PENDING').toUpperCase();
        return (
          <div className="flex items-center gap-2">
            {renderStatusTag(status)}
            {status !== 'COMPLETED' && status !== 'CANCELLED' && (
              <Button
                size="small"
                type="primary"
                className="h-6 rounded-md !bg-emerald-600 px-2 text-[10px] font-bold text-white shadow-none hover:!bg-emerald-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(orderId, 'COMPLETED');
                }}
              >
                Complete
              </Button>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: RestaurantOrder) => {
        const orderId = record.orderId || (record as any).order_id;
        const statusMenu: MenuProps['items'] = [
          {
            key: 'PENDING',
            label: 'Mark as PENDING',
            onClick: () => handleStatusChange(orderId, 'PENDING'),
          },
          {
            key: 'PREPARING',
            label: 'Mark as PREPARING',
            onClick: () => handleStatusChange(orderId, 'PREPARING'),
          },
          {
            key: 'SERVED',
            label: 'Mark as SERVED',
            onClick: () => handleStatusChange(orderId, 'SERVED'),
          },
          {
            key: 'COMPLETED',
            label: 'Mark as COMPLETED',
            onClick: () => handleStatusChange(orderId, 'COMPLETED'),
          },
          {
            key: 'CANCELLED',
            danger: true,
            label: 'Mark as CANCELLED',
            onClick: () => handleStatusChange(orderId, 'CANCELLED'),
          },
        ];

        return (
          <Space size="small">
            <Button
              type="text"
              icon={<Eye size={16} className="text-[#092968]" />}
              className="hover:!bg-blue-50"
              onClick={() => {
                setSelectedOrder(record);
                setIsViewModalOpen(true);
              }}
            />

            <Dropdown menu={{ items: statusMenu }} trigger={['click']}>
              <Button
                type="text"
                icon={<MoreVertical size={16} className="text-gray-500" />}
                className="hover:!bg-gray-100"
              />
            </Dropdown>

            <Popconfirm
              title="Delete Restaurant Order"
              description="Are you sure you want to delete this order? This action cannot be undone."
              onConfirm={() => handleDeleteOrder(orderId)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: isDeletingOrder }}
            >
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} />}
                className="hover:!bg-red-50"
              />
            </Popconfirm>
          </Space>
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
            Restaurant Order Management
          </h2>
          <p className="text-sm text-gray-500">
            Track kitchen orders, guest food service requests, and live billing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="default"
            icon={<RotateCw size={16} />}
            onClick={() => refetchOrders()}
            className="h-11 rounded-xl border-gray-200 text-gray-600 hover:border-gray-300"
          >
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={openCreateDrawer}
            className="h-11 rounded-xl !border-none !bg-[#F26E22] font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
          >
            Create New Order
          </Button>
        </div>
      </div>

      {/* --- Analytics KPI Summary Cards --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total Orders
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-[#092968]">
                {stats.total}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#092968]">
              <UtensilsCrossed size={24} />
            </div>
          </div>
        </Card>

        {/* Pending Orders */}
        <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Pending / Preparing
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-[#F26E22]">
                {stats.pending}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F26E22]">
              <Clock size={24} />
            </div>
          </div>
        </Card>

        {/* Completed Orders */}
        <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Served / Completed
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-emerald-600">
                {stats.completed}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="rounded-2xl border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total Revenue
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-[#092968]">
                LKR {stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Receipt size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* --- Filter and Search Bar --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by Guest Name, NIC, or Order ID..."
            prefix={<Search size={18} className="mr-2 text-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 max-w-md rounded-xl hover:border-[#F26E22] focus:border-[#F26E22]"
            allowClear
          />

          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="h-11 w-44 rounded-xl"
            placeholder="Filter by Status"
          >
            <Option value="ALL">All Statuses</Option>
            <Option value="PENDING">PENDING</Option>
            <Option value="PREPARING">PREPARING</Option>
            <Option value="SERVED">SERVED</Option>
            <Option value="COMPLETED">COMPLETED</Option>
            <Option value="CANCELLED">CANCELLED</Option>
          </Select>
        </div>

        <span className="text-xs font-semibold text-gray-400">
          Showing {ordersList.length} orders
        </span>
      </div>

      {/* --- Orders Data Table --- */}
      <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <Table
          dataSource={ordersList}
          columns={columns}
          rowKey={(r) => r.orderId || (r as any).order_id || Math.random().toString()}
          loading={isOrdersLoading || isUpdatingStatus || isDeletingOrder}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} orders`,
          }}
          className="custom-table"
        />
      </div>

      {/* --- CREATE NEW RESTAURANT ORDER DRAWER --- */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F26E22]">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-bold text-[#092968]">
                Create Restaurant Order
              </h3>
              <p className="text-xs text-gray-400">
                Select guest, staff handler, and food items
              </p>
            </div>
          </div>
        }
        width={560}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        className="custom-scrollbar rounded-l-[2.5rem]"
        footer={
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 p-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Total Order Bill
              </p>
              <p className="text-xl font-black text-[#092968]">
                LKR {totalOrderAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                size="large"
                className="h-11 rounded-xl font-semibold"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                loading={isCreatingOrder}
                onClick={() => form.submit()}
                className="h-11 rounded-xl !border-none !bg-[#F26E22] font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
              >
                Submit Order
              </Button>
            </div>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrder}
          requiredMark={false}
          className="space-y-4"
        >
          {/* Hidden handledBy and initial status */}
          <Form.Item name="handledBy" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="status" hidden initialValue="PENDING">
            <Input />
          </Form.Item>

          {/* Food Items Selection */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-[#092968]">
                  Select Food Items
                </h4>
                <p className="text-xs text-gray-400">
                  Search menu items and specify ordered quantity
                </p>
              </div>
              <Tag color="orange" className="rounded-lg px-2.5 py-0.5 text-xs font-bold">
                {watchedSelectedFoods?.length || 0} item(s) selected
              </Tag>
            </div>

            {/* Food item search dropdown */}
            <Select
              showSearch
              placeholder="Search & Add Food Item to order..."
              className="mb-4 h-11 w-full rounded-xl"
              optionFilterProp="children"
              value={null}
              loading={isFoodLoading}
              onChange={(value) => {
                const selectedItem = foodItemsResponse?.data?.find(
                  (f: FoodItem) => f.itemId === value || (f as any).id === value,
                );
                if (selectedItem) {
                  const currentList = form.getFieldValue('orderDetails') || [];
                  const exists = currentList.some((f: any) => f.itemId === selectedItem.itemId);
                  if (exists) {
                    errorToast('Food item already added! Adjust quantity below.');
                    return;
                  }
                  form.setFieldsValue({
                    orderDetails: [
                      ...currentList,
                      {
                        itemId: selectedItem.itemId,
                        name: selectedItem.name,
                        unitPrice: selectedItem.unitPrice,
                        orderedQty: 1,
                      },
                    ],
                  });
                }
              }}
            >
              {foodItemsResponse?.data?.map((item: FoodItem) => (
                <Option key={item.itemId} value={item.itemId}>
                  {item.name} — LKR {Number(item.unitPrice).toLocaleString()} (Stock: {item.quantityOnHand})
                </Option>
              ))}
            </Select>

            {/* Selected Food Items List */}
            <Form.List name="orderDetails">
              {(fields, { remove }) => (
                <div className="space-y-3">
                  {fields.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-400">
                      <p className="text-xs">No food items added yet. Search above to add items.</p>
                    </div>
                  ) : (
                    fields.map(({ key, name, ...restField }) => {
                      const itemData = form.getFieldValue(['orderDetails', name]);
                      const unitPrice = itemData?.unitPrice || 0;
                      const qty = itemData?.orderedQty || 1;
                      const subtotal = unitPrice * qty;

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3"
                        >
                          <div className="flex-1">
                            <p className="text-xs font-bold text-[#0B1B3D]">{itemData?.name}</p>
                            <p className="text-[11px] text-gray-400">
                              LKR {Number(unitPrice).toLocaleString()} each
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Quantity Input */}
                            <Form.Item
                              {...restField}
                              name={[name, 'orderedQty']}
                              noStyle
                              initialValue={1}
                            >
                              <Input
                                type="number"
                                min={1}
                                className="h-8 w-16 rounded-lg text-center font-bold"
                              />
                            </Form.Item>

                            {/* Subtotal */}
                            <span className="w-24 text-right text-xs font-bold text-[#092968]">
                              LKR {subtotal.toLocaleString()}
                            </span>

                            {/* Remove button */}
                            <Button
                              type="text"
                              danger
                              icon={<Trash2 size={15} />}
                              onClick={() => remove(name)}
                              className="hover:!bg-red-50"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Form.List>
          </div>
        </Form>
      </Drawer>

      {/* --- VIEW ORDER DETAILS DRAWER / MODAL --- */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#092968]">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-bold text-[#092968]">
                Order Details & Bill
              </h3>
              <p className="text-xs text-gray-400">
                Order #{String(selectedOrder?.orderId || (selectedOrder as any)?.order_id || '').slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        }
        width={500}
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedOrder(null);
        }}
        footer={
          <div className="flex items-center justify-between border-t border-gray-100 p-4">
            <Button
              className="h-10 rounded-xl font-semibold"
              onClick={() => setIsViewModalOpen(false)}
            >
              Close
            </Button>

            {selectedOrder && (
              <div className="flex items-center gap-2">
                {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                  <>
                    {selectedOrder.status === 'PENDING' && (
                      <Button
                        className="h-10 rounded-xl font-bold text-blue-600 hover:border-blue-500"
                        onClick={async () => {
                          const id = selectedOrder.orderId || (selectedOrder as any).order_id;
                          await handleStatusChange(id, 'PREPARING');
                          setSelectedOrder({ ...selectedOrder, status: 'PREPARING' });
                        }}
                      >
                        Mark Preparing
                      </Button>
                    )}
                    {selectedOrder.status !== 'SERVED' && (
                      <Button
                        className="h-10 rounded-xl font-bold text-cyan-700 hover:border-cyan-500"
                        onClick={async () => {
                          const id = selectedOrder.orderId || (selectedOrder as any).order_id;
                          await handleStatusChange(id, 'SERVED');
                          setSelectedOrder({ ...selectedOrder, status: 'SERVED' });
                        }}
                      >
                        Mark Served
                      </Button>
                    )}
                    <Button
                      type="primary"
                      className="h-10 rounded-xl !bg-emerald-600 font-bold text-white hover:!bg-emerald-700"
                      onClick={async () => {
                        const id = selectedOrder.orderId || (selectedOrder as any).order_id;
                        await handleStatusChange(id, 'COMPLETED');
                        setSelectedOrder({ ...selectedOrder, status: 'COMPLETED' });
                        setIsViewModalOpen(false);
                      }}
                    >
                      Mark Completed
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Header Status & Total */}
            <div className="rounded-2xl bg-gradient-to-br from-[#092968] to-[#0F2942] p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-orange-300">
                  Total Bill
                </span>
                {renderStatusTag(selectedOrder.status)}
              </div>
              <h2 className="mt-2 text-3xl font-extrabold text-white">
                LKR {Number(selectedOrder.totalAmount || (selectedOrder as any).total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-200">
                <Calendar size={14} />
                <span>
                  {dayjs(selectedOrder.orderTime || (selectedOrder as any).order_time).format('dddd, DD MMMM YYYY — hh:mm A')}
                </span>
              </div>
            </div>

            {/* Guest & Staff Details */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Customer & Staff Info
              </h4>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Guest Name:</span>
                <span className="font-bold text-[#0B1B3D]">
                  {selectedOrder.guest?.name || selectedOrder.guestName || (selectedOrder as any).guest_name || 'Guest'}
                </span>
              </div>

              {(selectedOrder.guest?.phone || (selectedOrder as any).guest?.phone) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-semibold text-gray-700">
                    {selectedOrder.guest?.phone || (selectedOrder as any).guest?.phone}
                  </span>
                </div>
              )}

              {(selectedOrder.guest?.nic || (selectedOrder as any).guest?.nic) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">NIC:</span>
                  <span className="font-semibold text-gray-700">
                    {selectedOrder.guest?.nic || (selectedOrder as any).guest?.nic}
                  </span>
                </div>
              )}

              <Divider className="!my-2" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Handled By:</span>
                <span className="font-semibold text-[#092968]">
                  {selectedOrder.handledByUser?.name || 'Staff'} ({selectedOrder.handledByUser?.role || 'Staff'})
                </span>
              </div>
            </div>

            {/* Ordered Items Breakdown */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                Itemized Order Details
              </h4>

              <div className="space-y-2.5">
                {(
                  selectedOrder.orderDetails ||
                  selectedOrder.restaurantOrderDetails ||
                  (selectedOrder as any).order_details ||
                  []
                ).map((detail: RestaurantOrderDetail, idx: number) => {
                  const foodObj = foodItemsResponse?.data?.find(
                    (f: FoodItem) => f.itemId === detail.itemId,
                  );
                  const name = detail.itemName || detail.foodItem?.name || foodObj?.name || `Item #${idx + 1}`;
                  const unitPrice = detail.unitPrice || detail.foodItem?.unitPrice || foodObj?.unitPrice || 0;
                  const qty = detail.orderedQty || 1;
                  const subtotal = unitPrice * qty;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-gray-50 pb-2 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#0B1B3D]">{name}</p>
                        <p className="text-[11px] text-gray-400">
                          {qty} x LKR {Number(unitPrice).toLocaleString()}
                        </p>
                      </div>
                      <span className="font-bold text-[#092968]">
                        LKR {subtotal.toLocaleString()}
                      </span>
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

export default RestaurantOrders;
