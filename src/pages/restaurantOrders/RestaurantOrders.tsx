import { useState, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Drawer,
  Space,
  Select,
  Card,
  Popconfirm,
  Avatar,
  Dropdown,
  Steps,
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
  Printer,
  Download,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
import { errorToast, successToast } from '../../components/common/Alert';
import { RestaurantBillReceipt, type BillItem } from './components/RestaurantBillReceipt';
import dayjs from 'dayjs';

const { Option } = Select;

const RestaurantOrders = () => {
  const { userData } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Multi-step Create Order State: 0 = Select Items, 1 = Confirm Order, 2 = Success & Receipt
  const [createStep, setCreateStep] = useState<number>(0);
  const [selectedFoodList, setSelectedFoodList] = useState<BillItem[]>([]);
  const [createdOrderData, setCreatedOrderData] = useState<any | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

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
  const { getAllUsersMutation } = userMutation();
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

  // Live order total price calculation directly from selectedFoodList state
  const totalOrderAmount = useMemo(() => {
    if (!selectedFoodList || !Array.isArray(selectedFoodList)) return 0;
    return selectedFoodList.reduce((acc: number, item: BillItem) => {
      const price = item?.unitPrice || 0;
      const qty = item?.orderedQty || 0;
      return acc + price * qty;
    }, 0);
  }, [selectedFoodList]);

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

  // Selected Staff User Object for Receipt
  const currentSelectedStaff = useMemo(() => {
    const sId = currentHandledByUserId;
    if (!sId || !staffResponse?.data) return null;
    return staffResponse.data.find(
      (u: any) => u.adminId === sId || u.userId === sId,
    );
  }, [currentHandledByUserId, staffResponse]);

  // Open Create Drawer
  const openCreateDrawer = () => {
    setSelectedFoodList([]);
    setCreateStep(0);
    setCreatedOrderData(null);
    setIsDrawerOpen(true);
  };

  // Add Item to Food List
  const handleAddFoodItem = (itemId: string) => {
    const selectedItem = foodItemsResponse?.data?.find(
      (f: FoodItem) => f.itemId === itemId || (f as any).id === itemId,
    );
    if (!selectedItem) return;

    const exists = selectedFoodList.some((f) => f.itemId === selectedItem.itemId);
    if (exists) {
      errorToast('Food item already added! Adjust quantity in the list below.');
      return;
    }

    setSelectedFoodList((prev) => [
      ...prev,
      {
        itemId: selectedItem.itemId,
        name: selectedItem.name,
        unitPrice: Number(selectedItem.unitPrice) || 0,
        orderedQty: 1,
        subtotal: Number(selectedItem.unitPrice) || 0,
      },
    ]);
  };

  // Update Item Quantity
  const handleQuantityChange = (itemId: string, newQty: number) => {
    const qty = Math.max(1, Number(newQty) || 1);
    setSelectedFoodList((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              orderedQty: qty,
              subtotal: item.unitPrice * qty,
            }
          : item,
      ),
    );
  };

  // Remove Item from Food List
  const handleRemoveFoodItem = (itemId: string) => {
    setSelectedFoodList((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  // Move from Step 0 -> Step 1 (Validate & Review)
  const handleProceedToReview = () => {
    if (!selectedFoodList || selectedFoodList.length === 0) {
      errorToast('Please add at least one food item to the order before proceeding!');
      return;
    }

    const invalidQty = selectedFoodList.some(
      (item) => !item.orderedQty || Number(item.orderedQty) < 1,
    );
    if (invalidQty) {
      errorToast('Please specify a valid quantity (minimum 1) for all food items.');
      return;
    }

    setCreateStep(1);
  };

  // Handle Create Order Submit (Step 1 -> Step 2)
  const handleConfirmAndPlaceOrder = async () => {
    if (!selectedFoodList || selectedFoodList.length === 0) {
      errorToast('Please add at least one food item to the order!');
      return;
    }

    const payload = {
      handledBy: currentHandledByUserId || (userData as any)?.userId || '',
      status: 'PENDING',
      orderDetails: selectedFoodList.map((item) => ({
        itemId: item.itemId,
        orderedQty: Number(item.orderedQty),
      })),
    };

    const res = await createOrder(payload as any);
    if (res?.success) {
      const orderObj = res.data || {
        orderId: `ORD-${Date.now().toString().slice(-6)}`,
        orderTime: new Date().toISOString(),
        status: 'PENDING',
        totalAmount: totalOrderAmount,
        guest: {
          name: 'Walk-in Guest',
        },
        handledByUser: {
          name: currentSelectedStaff?.name || userData?.name || 'Staff Member',
          role: currentSelectedStaff?.role || (userData as any)?.role || 'Staff',
        },
        orderDetails: selectedFoodList,
      };

      setCreatedOrderData(orderObj);
      setCreateStep(2);
      refetchOrders();
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

  // Print Bill Helper (Opens clean print document for thermal/A4 receipt)
  const handlePrintBill = (elementId: string) => {
    const content = document.getElementById(elementId);
    if (!content) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Restaurant Bill Receipt</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 4mm;
              }
              body {
                margin: 0;
                padding: 10px;
                background: #ffffff !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #000000;
              }
              .receipt-container {
                box-shadow: none !important;
                border: 1px solid #e5e7eb !important;
                padding: 12px !important;
              }
            }
          </style>
        </head>
        <body class="p-6 bg-white flex justify-center">
          <div style="max-width: 480px; width: 100%;">
            ${content.outerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Download Bill PDF Helper using html2canvas and jsPDF
  const handleDownloadBillPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      errorToast('Bill element not found for PDF export.');
      return;
    }

    setIsDownloadingPDF(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
      successToast('Bill receipt PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      errorToast('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
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

      {/* --- MULTI-STEP CREATE RESTAURANT ORDER DRAWER --- */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F26E22]">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-bold text-[#092968]">
                {createStep === 0 && 'Select Food Items'}
                {createStep === 1 && 'Confirm Order & Bill Preview'}
                {createStep === 2 && 'Order Placed & Bill Receipt'}
              </h3>
              <p className="text-xs text-gray-400">
                {createStep === 0 && 'Step 1 of 2: Search menu and add food items'}
                {createStep === 1 && 'Step 2 of 2: Review details before confirming order'}
                {createStep === 2 && 'Order placed: Print or Download Bill'}
              </p>
            </div>
          </div>
        }
        width={600}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        className="custom-scrollbar rounded-l-[2.5rem]"
        footer={
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 p-5">
            {createStep === 0 && (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Estimated Bill
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
                    icon={<ArrowRight size={16} />}
                    onClick={handleProceedToReview}
                    className="h-11 rounded-xl !border-none !bg-[#092968] font-bold text-white shadow-md transition-all hover:!bg-[#153e96]"
                  >
                    Proceed to Review
                  </Button>
                </div>
              </>
            )}

            {createStep === 1 && (
              <>
                <Button
                  size="large"
                  icon={<ArrowLeft size={16} />}
                  className="h-11 rounded-xl font-semibold"
                  onClick={() => setCreateStep(0)}
                  disabled={isCreatingOrder}
                >
                  Back to Edit
                </Button>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2 hidden sm:block">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Total Bill
                    </p>
                    <p className="text-base font-black text-[#092968]">
                      LKR {totalOrderAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircle2 size={18} />}
                    loading={isCreatingOrder}
                    onClick={handleConfirmAndPlaceOrder}
                    className="h-11 rounded-xl !border-none !bg-[#F26E22] font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
                  >
                    Confirm & Place Order
                  </Button>
                </div>
              </>
            )}

            {createStep === 2 && (
              <div className="w-full flex items-center justify-between">
                <Button
                  size="large"
                  className="h-11 rounded-xl font-semibold"
                  onClick={() => openCreateDrawer()}
                >
                  Create Another Order
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircle2 size={16} />}
                    onClick={() => setIsDrawerOpen(false)}
                    className="h-11 rounded-xl !border-none !bg-[#092968] font-bold text-white shadow-md hover:!bg-[#153e96]"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        }
      >
        {/* Step Indicator Header */}
        <div className="mb-6 rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
          <Steps
            size="small"
            current={createStep}
            items={[
              { title: 'Select Food Items' },
              { title: 'Confirm Order' },
              { title: 'Bill Receipt' },
            ]}
          />
        </div>

        {/* STEP 0: SELECT FOOD ITEMS ONLY */}
        {createStep === 0 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#092968] flex items-center gap-1.5">
                    <UtensilsCrossed size={16} className="text-[#F26E22]" /> Select Food Items
                  </h4>
                  <p className="text-xs text-gray-400">
                    Search menu items and specify ordered quantity
                  </p>
                </div>
                <Tag color="orange" className="rounded-lg px-2.5 py-0.5 text-xs font-bold">
                  {selectedFoodList.length} item(s) selected
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
                onChange={(value:string) => handleAddFoodItem(value)}
              >
                {foodItemsResponse?.data?.map((item: FoodItem) => (
                  <Option key={item.itemId} value={item.itemId}>
                    {item.name} — LKR {Number(item.unitPrice).toLocaleString()} (Stock: {item.quantityOnHand})
                  </Option>
                ))}
              </Select>

              {/* Selected Food Items List */}
              <div className="space-y-3">
                {selectedFoodList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
                    <UtensilsCrossed size={28} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs font-semibold">No food items added yet.</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Use the search dropdown above to select items.</p>
                  </div>
                ) : (
                  selectedFoodList.map((item) => {
                    const subtotal = item.unitPrice * (item.orderedQty || 1);

                    return (
                      <div
                        key={item.itemId}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3 hover:border-gray-200 transition-all"
                      >
                        <div className="flex-1 pr-2">
                          <p className="text-xs font-bold text-[#0B1B3D]">{item.name}</p>
                          <p className="text-[11px] text-gray-400">
                            LKR {Number(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })} each
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Quantity Input */}
                          <Input
                            type="number"
                            min={1}
                            value={item.orderedQty}
                            onChange={(e) => handleQuantityChange(item.itemId, Number(e.target.value))}
                            className="h-8 w-16 rounded-lg text-center font-bold"
                          />

                          {/* Subtotal */}
                          <span className="w-24 text-right text-xs font-bold text-[#092968]">
                            LKR {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>

                          {/* Remove button */}
                          <Button
                            type="text"
                            danger
                            icon={<Trash2 size={15} />}
                            onClick={() => handleRemoveFoodItem(item.itemId)}
                            className="hover:!bg-red-50"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: CONFIRM ORDER & BILL PREVIEW */}
        {createStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl bg-orange-50/80 border border-orange-100 p-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-[#F26E22]" />
                <div>
                  <h4 className="text-xs font-bold text-[#092968] uppercase tracking-wider">
                    Please Review Order Details
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Verify all items and bill amount before placing the order
                  </p>
                </div>
              </div>
              <Tag color="orange" className="font-bold text-xs">Step 2: Review</Tag>
            </div>

            {/* Bill Preview Card */}
            <RestaurantBillReceipt
              id="create-order-bill-preview"
              isConfirmationPreview={true}
              guestName="Walk-in Guest"
              handledByName={currentSelectedStaff?.name || userData?.name || 'Staff Member'}
              handledByRole={currentSelectedStaff?.role || (userData as any)?.role || 'Staff'}
              items={selectedFoodList}
              totalAmount={totalOrderAmount}
            />
          </div>
        )}

        {/* STEP 2: ORDER PLACED & BILL PRINT/DOWNLOAD */}
        {createStep === 2 && createdOrderData && (
          <div className="space-y-5">
            {/* Success Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="font-spaceGrotesk text-lg font-black text-white">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Order #{String(createdOrderData.orderId || (createdOrderData as any).order_id || '').slice(-6).toUpperCase()} is registered
                  </p>
                </div>
              </div>

              {/* Action Buttons for Print & Download */}
              <div className="flex items-center gap-2">
                <Button
                  icon={<Printer size={15} />}
                  onClick={() => handlePrintBill('created-order-bill-receipt')}
                  className="h-10 rounded-xl bg-white text-emerald-800 font-bold border-none shadow-sm hover:bg-emerald-50"
                >
                  Print Bill
                </Button>

                <Button
                  icon={<Download size={15} />}
                  loading={isDownloadingPDF}
                  onClick={() => {
                    const orderIdStr = String(createdOrderData.orderId || (createdOrderData as any).order_id || 'new').slice(-6).toUpperCase();
                    handleDownloadBillPDF('created-order-bill-receipt', `Restaurant_Bill_${orderIdStr}.pdf`);
                  }}
                  className="h-10 rounded-xl bg-emerald-950 text-white font-bold border-none shadow-sm hover:bg-emerald-900"
                >
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Generated Bill Receipt */}
            <RestaurantBillReceipt
              id="created-order-bill-receipt"
              orderId={createdOrderData.orderId || (createdOrderData as any).order_id}
              orderTime={createdOrderData.orderTime || (createdOrderData as any).order_time || new Date().toISOString()}
              status={createdOrderData.status || 'PENDING'}
              guestName={
                createdOrderData.guest?.name ||
                createdOrderData.guestName ||
                'Walk-in Guest'
              }
              handledByName={
                createdOrderData.handledByUser?.name ||
                currentSelectedStaff?.name ||
                userData?.name ||
                'Staff Member'
              }
              handledByRole={
                createdOrderData.handledByUser?.role ||
                currentSelectedStaff?.role ||
                (userData as any)?.role ||
                'Staff'
              }
              items={selectedFoodList}
              totalAmount={
                createdOrderData.totalAmount ||
                (createdOrderData as any).total_amount ||
                totalOrderAmount
              }
            />
          </div>
        )}
      </Drawer>

      {/* --- VIEW ORDER DETAILS DRAWER / MODAL --- */}
      <Drawer
        title={
          <div className="flex items-center justify-between w-full pr-4">
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

            {selectedOrder && (
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  icon={<Printer size={14} />}
                  onClick={() => handlePrintBill('view-order-bill-receipt')}
                  className="rounded-lg font-semibold text-gray-700 hover:border-[#092968]"
                >
                  Print
                </Button>
                <Button
                  size="small"
                  icon={<Download size={14} />}
                  loading={isDownloadingPDF}
                  onClick={() => {
                    const orderIdStr = String(selectedOrder.orderId || (selectedOrder as any).order_id || 'order').slice(-6).toUpperCase();
                    handleDownloadBillPDF('view-order-bill-receipt', `Restaurant_Bill_${orderIdStr}.pdf`);
                  }}
                  className="rounded-lg font-semibold text-[#092968] border-blue-200 hover:bg-blue-50"
                >
                  PDF
                </Button>
              </div>
            )}
          </div>
        }
        width={560}
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
          <div className="space-y-4">
            <RestaurantBillReceipt
              id="view-order-bill-receipt"
              orderId={selectedOrder.orderId || (selectedOrder as any).order_id}
              orderTime={selectedOrder.orderTime || (selectedOrder as any).order_time}
              status={selectedOrder.status}
              guestName={
                selectedOrder.guest?.name ||
                selectedOrder.guestName ||
                (selectedOrder as any).guest_name ||
                guestsResponse?.data?.find((g: UserAccount) => g.guestId === selectedOrder.guestId)?.name ||
                'Walk-in Guest'
              }
              guestPhone={
                selectedOrder.guest?.phone ||
                guestsResponse?.data?.find((g: UserAccount) => g.guestId === selectedOrder.guestId)?.phone
              }
              guestNic={
                selectedOrder.guest?.nic ||
                guestsResponse?.data?.find((g: UserAccount) => g.guestId === selectedOrder.guestId)?.nic
              }
              handledByName={
                selectedOrder.handledByUser?.name ||
                staffResponse?.data?.find((u: any) => u.adminId === selectedOrder.handledBy || u.userId === selectedOrder.handledBy)?.name ||
                'Staff Member'
              }
              handledByRole={
                selectedOrder.handledByUser?.role ||
                staffResponse?.data?.find((u: any) => u.adminId === selectedOrder.handledBy || u.userId === selectedOrder.handledBy)?.role ||
                'Staff'
              }
              items={(
                selectedOrder.orderDetails ||
                selectedOrder.restaurantOrderDetails ||
                (selectedOrder as any).order_details ||
                []
              ).map((detail: RestaurantOrderDetail, idx: number) => {
                const foodObj = foodItemsResponse?.data?.find(
                  (f: FoodItem) => f.itemId === detail.itemId,
                );
                return {
                  itemId: detail.itemId || String(idx),
                  name: detail.itemName || detail.foodItem?.name || foodObj?.name || `Item #${idx + 1}`,
                  unitPrice: detail.unitPrice || detail.foodItem?.unitPrice || foodObj?.unitPrice || 0,
                  orderedQty: detail.orderedQty || 1,
                  subtotal: (detail.unitPrice || detail.foodItem?.unitPrice || foodObj?.unitPrice || 0) * (detail.orderedQty || 1),
                };
              })}
              totalAmount={
                selectedOrder.totalAmount ||
                (selectedOrder as any).total_amount ||
                0
              }
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default RestaurantOrders;
