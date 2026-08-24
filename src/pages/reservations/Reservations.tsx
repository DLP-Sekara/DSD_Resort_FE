import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

import {
  Table,
  Tag,
  Button,
  Input,
  Drawer,
  Space,
  DatePicker,
  Select,
  Form,
  Divider,
  Row,
  Col,
  Card,
  Steps,
  Badge,
  Tooltip,
  Popconfirm,
  Modal,
  Avatar,
} from 'antd';
import {
  Plus,
  Eye,
  Trash2,
  CalendarCheck,
  BedDouble,
  CheckCircle2,
  UserPlus,
  Receipt,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import reservationMutation from '../../mutations/reservation.mutation';
import mealMutation from '../../mutations/meal.mutation';
import roomMutation from '../../mutations/room.mutation';
import type { RoomType } from '../../types/rooms';
import type {
  FoodItem,
  MealPlan,
  Reservation,
  Room,
} from '../../types/services.interfaces';
import { errorToast, successToast } from '../../components/common/Alert';
import userMutation from '../../mutations/user.mutation';
import { ReservationPreview } from './components/ReservationPreview';

const { RangePicker } = DatePicker;
const { Option } = Select;

const disabledDate = (current: dayjs.Dayjs) => {
  // Can't select days before today
  return current && current < dayjs().startOf('day');
};

const Reservations = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('add');
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [stepOneForm] = Form.useForm();

  // Watch form values for real-time price calculation
  const watchedDates = Form.useWatch('dates', stepOneForm);
  const watchedRoomType = Form.useWatch('roomType', stepOneForm);
  const watchedGuestCount = Form.useWatch('guestCount', stepOneForm);
  const watchedMealPlan = Form.useWatch('mealPlan', stepOneForm);
  const watchedSelectedFoods = Form.useWatch('selectedFoods', stepOneForm);

  // Quick Check State
  const [isQuickCheckModalOpen, setIsQuickCheckModalOpen] = useState(false);
  const [quickCheckDates, setQuickCheckDates] = useState<any>(null);
  const [quickCheckRoomType, setQuickCheckRoomType] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  // Booking Drawer State
  const [drawerAvailableRooms, setDrawerAvailableRooms] = useState<Room[]>([]);
  const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);

  const [current, setCurrent] = useState(0); // Stepper index
  const [stepDetails, setStepDetails] = useState<any>({});

  const [searchParams, setSearchParams] = useSearchParams();

  const [reservationFilters, setReservationFilters] = useState({
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    guestName: searchParams.get('guestName') || '',
    status: searchParams.get('status') || '',
    page: parseInt(searchParams.get('page') || '0'),
    size: parseInt(searchParams.get('size') || '10'),
  });

  // Update URL when filters change
  useEffect(() => {
    const params: any = {};
    if (reservationFilters.startDate) params.startDate = reservationFilters.startDate;
    if (reservationFilters.endDate) params.endDate = reservationFilters.endDate;
    if (reservationFilters.guestName) params.guestName = reservationFilters.guestName;
    if (reservationFilters.status) params.status = reservationFilters.status;
    if (reservationFilters.page > 0) params.page = reservationFilters.page.toString();
    if (reservationFilters.size !== 10) params.size = reservationFilters.size.toString();

    setSearchParams(params, { replace: true });
  }, [reservationFilters, setSearchParams]);

  //------------------------------------------------ mutations -----------------------------------------------
  const { getAllMealPlansMutation, getAllFoodItemsMutation } = mealMutation();
  const { getAllRoomTypesMutation, getAllRoomsMutation } = roomMutation();
  const {
    getAllReservationsQuery,
    createReservationMutation,
    getAvailableRoomsMutation,
    deleteReservationMutation,
    checkOutGuestMutation,
  } = reservationMutation();

  const { getAllUsersMutation, getUserByNicMutation, createUserMutation } =
    userMutation();

  const { data: usersData } = getAllUsersMutation();
  const { data: mealPlans } = getAllMealPlansMutation();
  const { data: foodItems } = getAllFoodItemsMutation();
  const { data: rooms } = getAllRoomsMutation();
  const { data: roomTypes } = getAllRoomTypesMutation();

  const { data: reservationsData, isLoading: isReservationsLoading } =
    getAllReservationsQuery(reservationFilters);
  const { mutateAsync: createReservation, isPending: createReservationLoading } =
    createReservationMutation();
  const { mutateAsync: getAvailableRooms, isPending: isSearching } =
    getAvailableRoomsMutation();
  const { mutateAsync: deleteReservation, isPending: deleteReservationLoading } =
    deleteReservationMutation();
  const { mutateAsync: checkOutGuest, isPending: isCheckingOut } =
    checkOutGuestMutation();
  const { mutateAsync: refetchGuest, isPending: isSearchingGuest } =
    getUserByNicMutation();
  const { mutateAsync: createUser, isPending: createUserLoading } = createUserMutation();

  // Dynamic Price Calculation
  const priceBreakdown = useMemo(() => {
    const nights =
      watchedDates && watchedDates[0] && watchedDates[1]
        ? watchedDates[1].diff(watchedDates[0], 'days')
        : 0;

    const roomTypeObj = roomTypes?.data?.find(
      (t: RoomType) => t.typeId === watchedRoomType,
    );
    const roomCost = (roomTypeObj?.pricePerNight || 0) * nights;

    const mealPlanObj = mealPlans?.data?.find(
      (m: MealPlan) => m.planId === watchedMealPlan,
    );
    const guestCount = parseInt(watchedGuestCount || '0');
    const mealCost = (mealPlanObj?.price || 0) * guestCount * nights;

    const foodCost =
      watchedSelectedFoods?.reduce(
        (sum: number, item: any) => sum + (item.unitPrice || 0) * (item.ordered_qty || 0),
        0,
      ) || 0;

    return {
      nights,
      roomCost,
      mealCost,
      foodCost,
      total: roomCost + mealCost + foodCost,
    };
  }, [
    watchedDates,
    watchedRoomType,
    watchedMealPlan,
    watchedGuestCount,
    watchedSelectedFoods,
    roomTypes,
    mealPlans,
  ]);

  // --- API Functions Simulation ---
  const handleCheckOut = async (id: string) => {
    await checkOutGuest(id);
  };

  const handleQuickCheck = async () => {
    if (!quickCheckDates || !quickCheckRoomType) {
      errorToast('Please select staying dates and room type');
      return;
    }

    const data = {
      typeId: quickCheckRoomType,
      checkIn: quickCheckDates[0]?.format('YYYY-MM-DD'),
      checkOut: quickCheckDates[1]?.format('YYYY-MM-DD'),
    };

    getAvailableRooms(data, {
      onSuccess: (res) => {
        if (res.success) {
          setAvailableRooms(res.data);
          setIsQuickCheckModalOpen(true);
        } else {
          errorToast(res.message || 'No rooms found for selected criteria');
        }
      },
    });
  };

  const checkAvailability = async () => {
    const values = stepOneForm.getFieldsValue();
    if (!values.dates || !values.roomType) {
      errorToast('Please select dates and room type');
      return;
    }

    const data = {
      typeId: values.roomType,
      checkIn: values.dates?.[0]?.format('YYYY-MM-DD'),
      checkOut: values.dates?.[1]?.format('YYYY-MM-DD'),
    };

    getAvailableRooms(data, {
      onSuccess: (res) => {
        if (res.success) {
          if (res.data?.length > 0) {
            setDrawerAvailableRooms(res.data);
            setIsAvailabilityChecked(true);
            successToast('Rooms are available! Please select a room to continue.');
          } else {
            errorToast('No Available Rooms');
            setIsAvailabilityChecked(false);
          }
        } else {
          errorToast(res.message || 'No rooms found for selected criteria');
          setIsAvailabilityChecked(false);
        }
      },
    });
  };

  const handleStepOne = async () => {
    const values = stepOneForm.getFieldsValue();
    setStepDetails({ ...stepDetails, ...values });
    setCurrent(current + 1);
  };

  const handleStepTwo = async () => {
    const formData = stepOneForm.getFieldsValue();
    const res = await refetchGuest(formData.nic);
    if (res.success) {
      setStepDetails({ ...stepDetails, ...formData, guestId: res.data.guestId });
      setCurrent(current + 1);
    } else {
      const res = await createUser({
        name: formData.guestName,
        phone: formData.phone,
        nic: formData.nic,
      });
      if (res.success) {
        setStepDetails({ ...stepDetails, ...formData, guestId: res.data.guestId });
        setCurrent(current + 1);
      }
    }
  };

  const handleStepThree = async () => {
    const values = stepOneForm.getFieldsValue();
    const data = {
      guestId: stepDetails?.guestId,
      roomId: values.roomId,
      planId: values.mealPlan,
      checkIn: values.dates?.[0]?.format('YYYY-MM-DD'),
      checkOut: values.dates?.[1]?.format('YYYY-MM-DD'),
      guestCount: values.guestCount,
      reservationDetails: values.selectedFoods?.map((f: any) => ({
        itemId: f.itemId,
        orderedQty: f.ordered_qty,
      })),
    };

    createReservation(data as any, {
      onSuccess: (res) => {
        if (res.success) {
          setIsDrawerOpen(false);
          stepOneForm.resetFields();
          setCurrent(0);
        }
      },
    });
  };

  const handleGuestSearch = async (nic: string) => {
    if (!nic) {
      errorToast('Please enter NIC to search');
      return;
    }
    const res = await refetchGuest(nic);
    if (res.success) {
      stepOneForm.setFieldsValue({
        guestId: res.data.guestId,
        guestName: res.data.name,
        nic: res.data.nic,
        phone: res.data.phone,
      });
      successToast('Guest found and details populated!');
    } else {
      errorToast('Guest not found');
    }
  };

  // --- Stepper UI Components ---
  const steps = [
    { title: 'Availability', icon: <CalendarCheck size={18} /> },
    { title: 'Guest Details', icon: <UserPlus size={18} /> },
    { title: 'Confirm', icon: <Receipt size={18} /> },
  ];

  // Table Columns
  const columns = [
    {
      title: 'Guest Name',
      dataIndex: 'guestId',
      key: 'guestId',
      render: (text: string) => (
        <span className="flex flex-row items-center gap-2 font-bold text-blue-600">
          <Avatar className="bg-blue-100 font-bold text-blue-600">
            {usersData?.data?.find((r: any) => r.guestId === text)?.name?.charAt(0) ||
              'U'}
          </Avatar>
          {usersData?.data?.find((r: any) => r.guestId === text)?.name}
        </span>
      ),
    },
    {
      title: 'Room No',
      dataIndex: 'roomId',
      key: 'roomId',
      render: (text: string) => (
        <span className="font-bold text-blue-600">
          {rooms?.data?.find((r: Room) => r.roomId === text)?.roomNumber}
        </span>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, r: Reservation) => (
        <span className="text-md font-semibold">
          {r.checkIn} - {r.checkOut}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={
            status === 'CONFIRMED'
              ? 'green'
              : status === 'PENDING'
                ? 'gold'
                : status === 'COMPLETED'
                  ? 'blue'
                  : 'red'
          }
          className="rounded-full px-3"
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Total (LKR)',
      dataIndex: 'totalBill',
      key: 'totalBill',
      render: (val: number) => (
        <span className="truncate font-semibold">Rs. {val?.toLocaleString()}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Reservation) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Eye size={18} className="text-gray-400 hover:text-blue-500" />}
            onClick={() => {
              setSelectedResId(record.resId || null);
              setDrawerType('view');
              setIsDrawerOpen(true);
            }}
          />

          <Popconfirm
            title="Delete the reservation"
            description="Are you sure to delete this reservation?"
            onConfirm={() => deleteReservation(record?.resId)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<Trash2 size={18} className="text-gray-400 hover:text-red-500" />}
              loading={deleteReservationLoading && selectedResId === record.resId}
              onClick={() => setSelectedResId(record.resId)}
            />
          </Popconfirm>

          {record?.status === 'PENDING' && (
            <Tooltip title="Complete Check-out">
              <Button
                type="text"
                icon={
                  <CheckCircle2
                    size={18}
                    className="h-6 w-6 rounded-full bg-yellow-400 p-1 text-white"
                  />
                }
                onClick={() => handleCheckOut(record.resId)}
                loading={isCheckingOut && selectedResId === record.resId}
                onMouseEnter={() => setSelectedResId(record.resId)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      {/* --- 1. Header & Actions --- */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#0F2942]">Reservations</h2>
          <p className="text-sm text-gray-400">Manage and monitor all guest bookings</p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<Plus size={20} />}
          onClick={() => {
            setDrawerType('add');
            setIsDrawerOpen(true);
          }}
          className="flex h-12 items-center gap-2 rounded-xl border-none bg-blue-600 shadow-lg shadow-blue-200 hover:bg-orange-500"
        >
          New Reservation
        </Button>
      </div>

      {/* --- 2. Availability & Quick Check Section --- */}
      <Card className="overflow-hidden rounded-[2rem] border-none bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shadow-sm">
        <div className="flex flex-col gap-6 p-2 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
              <CalendarCheck size={16} /> Stay Duration
            </label>
            <RangePicker
              className="h-12 w-full rounded-xl shadow-sm"
              value={quickCheckDates}
              disabledDate={disabledDate}
              onChange={(dates) => setQuickCheckDates(dates)}
            />
          </div>

          <div className="w-full space-y-2 md:w-64">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
              <BedDouble size={16} /> Room Type
            </label>
            <Select
              placeholder="Select Type"
              className="h-12 w-full rounded-xl bg-white shadow-sm"
              value={quickCheckRoomType}
              onChange={(value) => setQuickCheckRoomType(value)}
            >
              {roomTypes?.data?.map((item: RoomType) => (
                <Option key={item.typeId} value={item.typeId}>
                  {item.typeName}
                </Option>
              ))}
            </Select>
          </div>

          <Button
            type="primary"
            loading={isSearching}
            onClick={handleQuickCheck}
            className="h-12 rounded-xl border-none bg-[#0F2942] px-8 font-bold shadow-lg shadow-blue-100"
          >
            Check Availability
          </Button>
        </div>
      </Card>

      {/* --- Filters Section --- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Input.Search
          placeholder="Search Guest Name"
          allowClear
          value={reservationFilters.guestName}
          onChange={(e) =>
            setReservationFilters({ ...reservationFilters, guestName: e.target.value })
          }
          onSearch={(value) =>
            setReservationFilters({ ...reservationFilters, guestName: value, page: 0 })
          }
          className="rounded-xl"
          size="large"
        />

        <RangePicker
          className="h-10 w-full rounded-xl"
          value={
            reservationFilters.startDate && reservationFilters.endDate
              ? [dayjs(reservationFilters.startDate), dayjs(reservationFilters.endDate)]
              : null
          }
          onChange={(dates) =>
            setReservationFilters({
              ...reservationFilters,
              startDate: dates ? dates[0]?.format('YYYY-MM-DD') || '' : '',
              endDate: dates ? dates[1]?.format('YYYY-MM-DD') || '' : '',
              page: 0,
            })
          }
        />

        <Select
          placeholder="Filter by Status"
          allowClear
          className="w-full rounded-xl"
          size="large"
          value={reservationFilters.status || undefined}
          onChange={(value) =>
            setReservationFilters({ ...reservationFilters, status: value || '', page: 0 })
          }
        >
          <Option value="PENDING">Pending</Option>
          <Option value="CONFIRMED">Confirmed</Option>
          <Option value="COMPLETED">Completed</Option>
          <Option value="CANCELLED">Cancelled</Option>
        </Select>

        <Button
          onClick={() =>
            setReservationFilters({
              startDate: '',
              endDate: '',
              guestName: '',
              status: '',
              page: 0,
              size: 10,
            })
          }
          className="h-12 rounded-xl border-none text-red-400"
        >
          Clear Filters
        </Button>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <Table
          dataSource={reservationsData?.data?.content || []}
          columns={columns}
          loading={isReservationsLoading}
          pagination={{
            current: (reservationsData?.data?.pageable?.pageNumber || 0) + 1,
            pageSize: reservationsData?.data?.pageable?.pageSize || 10,
            total: reservationsData?.data?.totalElements || 0,
            onChange: (page, pageSize) => {
              setReservationFilters({
                ...reservationFilters,
                page: page - 1,
                size: pageSize,
              });
            },
          }}
          className="custom-table"
        />
      </div>

      {/* --- 4. Side Drawer to create new reservation --- */}
      <Drawer
        title={
          <span className="text-xl font-black">
            {drawerType === 'view' ? 'Reservation Details' : 'Book a Stay'}
          </span>
        }
        width={600}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedResId(null);
        }}
        open={isDrawerOpen}
        className="custom-scrollbar rounded-l-[2.5rem]"
        footer={
          drawerType === 'view' ? null : (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-6 backdrop-blur-md">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Total Estimated Amount
                </span>
                <span className="text-2xl font-black tracking-tighter text-[#0F2942]">
                  LKR {priceBreakdown.total.toLocaleString()}
                </span>
                {priceBreakdown.total > 0 && (
                  <div className="mt-1 flex gap-2 text-[10px] font-semibold text-gray-500">
                    {priceBreakdown.roomCost > 0 && (
                      <span>Room: {priceBreakdown.roomCost.toLocaleString()}</span>
                    )}
                    {priceBreakdown.mealCost > 0 && (
                      <span>Meal: {priceBreakdown.mealCost.toLocaleString()}</span>
                    )}
                    {priceBreakdown.foodCost > 0 && (
                      <span>Food: {priceBreakdown.foodCost.toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  disabled={current === 0}
                  onClick={() => setCurrent(current - 1)}
                  icon={<ArrowLeft size={16} />}
                  className="flex h-12 items-center gap-2 rounded-2xl border-none bg-white font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-100"
                >
                  Back
                </Button>

                {current === 0 ? (
                  <Button
                    type="primary"
                    onClick={() => {
                      if (!isAvailabilityChecked) {
                        errorToast('Please check room availability first!');
                        return;
                      }
                      handleStepOne();
                    }}
                    className="flex h-12 items-center gap-2 rounded-2xl bg-[#0F2942] px-8 font-bold shadow-lg shadow-blue-100 transition-all hover:scale-105"
                  >
                    Next <ArrowRight size={16} />
                  </Button>
                ) : current === 1 ? (
                  <Button
                    type="primary"
                    onClick={() => {
                      handleStepTwo();
                    }}
                    loading={createUserLoading}
                    className="flex h-12 items-center gap-2 rounded-2xl bg-[#0F2942] px-8 font-bold shadow-lg shadow-blue-100 transition-all hover:scale-105"
                  >
                    Save user & Next <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => {
                      handleStepThree();
                    }}
                    loading={createReservationLoading}
                    className="flex h-12 items-center gap-2 rounded-2xl border-none bg-green-600 px-8 font-bold text-white shadow-lg shadow-green-100 transition-all hover:scale-105 hover:bg-green-700"
                  >
                    Confirm Booking
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {drawerType === 'view' ? (
          <ReservationPreview id={selectedResId!} />
        ) : (
          <>
            {/* 1. Progress Tracker */}
            <div className="mb-10 px-4">
              <Steps
                current={current}
                items={steps}
                size="small"
                className="custom-booking-steps"
              />
            </div>

            <Form form={stepOneForm} layout="vertical" className="px-2 pb-20">
              {/* STEP 1: AVAILABILITY CHECK */}
              <div
                className={`${
                  current === 0 ? 'block' : 'hidden'
                } animate-in slide-in-from-right space-y-4 duration-500`}
              >
                <Form.Item
                  label="Select Stay Dates"
                  name="dates"
                  rules={[
                    { required: true },
                    {
                      validator: (_, value) => {
                        if (value && value[0] && value[1]) {
                          if (value[1].isSame(value[0], 'day')) {
                            return Promise.reject(
                              new Error('Check-out date must be after check-in date'),
                            );
                          }
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <RangePicker
                    className="h-12 w-full shadow-sm"
                    disabledDate={disabledDate}
                    onChange={() => setIsAvailabilityChecked(false)}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Room Type"
                      name="roomType"
                      rules={[{ required: true }]}
                    >
                      <Select
                        size="large"
                        className="rounded-xl"
                        placeholder="Select Type"
                        onChange={() => setIsAvailabilityChecked(false)}
                      >
                        {roomTypes?.data?.map((item: RoomType) => (
                          <Option key={item.typeId} value={item.typeId}>
                            {item.typeName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Guest Count"
                      name="guestCount"
                      rules={[{ required: true }]}
                    >
                      <Input
                        type="number"
                        size="large"
                        placeholder="Enter count"
                        className="rounded-xl"
                        min={1}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  type="default"
                  className="h-12 w-full rounded-2xl border-2 border-blue-100 bg-blue-50/50 font-bold text-blue-600 transition-all hover:bg-blue-100"
                  loading={isSearching}
                  onClick={checkAvailability}
                >
                  Check Room Availability
                </Button>

                {isAvailabilityChecked && (
                  <div className="animate-in zoom-in space-y-4 pt-4 duration-500">
                    <Divider className="my-2" />
                    <Form.Item
                      label="Available Rooms"
                      name="roomId"
                      rules={[
                        { required: true, message: 'Please select a specific room!' },
                      ]}
                    >
                      <Select size="large" placeholder="Select Room No">
                        {drawerAvailableRooms.map((room: Room) => (
                          <Option key={room.roomId} value={room.roomId}>
                            Room {room.roomNumber}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Meal Plan"
                      name="mealPlan"
                      rules={[{ required: true }]}
                    >
                      <Select
                        size="large"
                        className="rounded-xl"
                        placeholder="Select Meal Plan"
                      >
                        {mealPlans?.data?.map((item: MealPlan) => (
                          <Option key={item.planId} value={item.planId}>
                            {item.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item label="Food Items" name="foodItems">
                      <Select
                        showSearch
                        className="h-11 flex-1 rounded-xl"
                        placeholder="Search & Add Food Item"
                        optionFilterProp="children"
                        value={null}
                        onChange={(value) => {
                          const selectedItem = foodItems?.data?.find(
                            (item: { itemId: any }) => item.itemId === value,
                          );
                          if (selectedItem) {
                            const currentFoods =
                              stepOneForm.getFieldValue('selectedFoods') || [];

                            if (
                              !currentFoods.find(
                                (f: { itemId: any }) => f.itemId === value,
                              )
                            ) {
                              stepOneForm.setFieldsValue({
                                selectedFoods: [
                                  ...currentFoods,
                                  { ...selectedItem, ordered_qty: 1 },
                                ],
                              });
                            } else {
                              errorToast('Item already added!');
                            }
                          }
                        }}
                      >
                        {foodItems?.data?.map((item: FoodItem) => (
                          <Option key={item.itemId} value={item.itemId}>
                            {item.name} -{' '}
                            <span className="text-xs text-gray-400">
                              LKR {item.unitPrice}
                            </span>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {/* Selected Food Items List Area */}
                    <Form.List name="selectedFoods">
                      {(fields, { remove }) => (
                        <div className="custom-scrollbar max-h-60 space-y-3 overflow-y-auto pr-2">
                          {fields.length === 0 && (
                            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                              <p className="text-xs text-gray-400">
                                No additional food items selected
                              </p>
                            </div>
                          )}

                          {fields.map(({ key, name, ...restField }) => (
                            <div
                              key={key}
                              className="animate-in zoom-in flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:border-blue-200"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-700">
                                  {stepOneForm.getFieldValue([
                                    'selectedFoods',
                                    name,
                                    'name',
                                  ])}
                                </p>
                                <p className="text-xs font-semibold text-blue-500">
                                  LKR{' '}
                                  {stepOneForm.getFieldValue([
                                    'selectedFoods',
                                    name,
                                    'unitPrice',
                                  ])}
                                </p>
                              </div>

                              <div className="flex items-center gap-4">
                                {/* Quantity adjustment */}
                                <Form.Item
                                  {...restField}
                                  name={[name, 'ordered_qty']}
                                  noStyle
                                >
                                  <Input
                                    type="number"
                                    min={1}
                                    className="h-9 w-20 rounded-lg border-gray-200 text-center"
                                    prefix={
                                      <span className="text-[10px] text-gray-400">
                                        Qty
                                      </span>
                                    }
                                  />
                                </Form.Item>

                                <Button
                                  type="text"
                                  danger
                                  icon={<Trash2 size={16} />}
                                  onClick={() => remove(name)}
                                  className="rounded-lg hover:bg-red-50"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Form.List>
                  </div>
                )}
              </div>

              {/* STEP 2: GUEST IDENTIFICATION */}
              <div
                className={`${
                  current === 1 ? 'block' : 'hidden'
                } animate-in slide-in-from-right duration-500`}
              >
                <div className="mb-8 rounded-[2rem] border border-gray-200 bg-gray-50 p-6">
                  <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                    Identity Check
                  </p>
                  <Input.Search
                    placeholder="Search by nic"
                    size="large"
                    enterButton="Find Guest"
                    loading={isSearchingGuest}
                    onSearch={handleGuestSearch}
                    className="overflow-hidden shadow-sm"
                  />
                </div>

                <Form.Item
                  label="Full Name"
                  name="guestName"
                  rules={[{ required: true }]}
                >
                  <Input
                    placeholder="Enter guest full name"
                    className="h-11 rounded-xl"
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="NIC "
                      name="nic"
                      rules={[
                        { required: true },
                        {
                          pattern: /^([0-9]{9}[vVxX]|[0-9]{12})$/,
                          message: 'Enter a valid NIC (e.g., 123456789V or 123456789012)',
                        },
                      ]}
                    >
                      <Input className="h-11 rounded-xl" placeholder="Enter NIC " />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Contact No"
                      name="phone"
                      rules={[{ required: true }]}
                    >
                      <Input
                        className="h-11 rounded-xl"
                        placeholder="Enter Contact Number"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* STEP 3: BILLING & CONFIRMATION */}
              <div
                className={`${
                  current === 2 ? 'block' : 'hidden'
                } animate-in slide-in-from-right duration-500`}
              >
                <Card className="mb-6 rounded-[2.5rem] border-none bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl">
                  <div className="p-2">
                    <div className="mb-6 flex items-center justify-between">
                      <Badge
                        status="processing"
                        color="green"
                        text={
                          <span className="text-xs font-bold text-white">
                            RESERVATION SUMMARY
                          </span>
                        }
                      />
                      <Receipt className="text-white/50" size={24} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-blue-100">
                        <span>
                          {priceBreakdown.nights} Nights x{' '}
                          {roomTypes?.data?.find(
                            (t: RoomType) => t.typeId === watchedRoomType,
                          )?.typeName || 'Unknown Room'}
                        </span>
                        <span className="font-bold text-white">
                          LKR {priceBreakdown.roomCost.toLocaleString()}
                        </span>
                      </div>
                      {priceBreakdown.mealCost > 0 && (
                        <div className="flex justify-between text-sm text-blue-100">
                          <span>
                            {
                              mealPlans?.data?.find(
                                (m: MealPlan) => m.planId === watchedMealPlan,
                              )?.name
                            }{' '}
                            Meal Plan
                          </span>
                          <span className="font-bold text-white">
                            LKR {priceBreakdown.mealCost.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {priceBreakdown.foodCost > 0 && (
                        <div className="flex justify-between text-sm text-blue-100">
                          <span>Additional Food Items</span>
                          <span className="font-bold text-white">
                            LKR {priceBreakdown.foodCost.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <Divider className="my-2 border-blue-400/30" />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white opacity-70">
                          Total Payable
                        </span>
                        <span className="text-3xl font-black tracking-tighter text-white">
                          LKR {priceBreakdown.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-4 rounded-3xl border border-orange-100 bg-orange-50 p-6">
                  <CheckCircle2 className="shrink-0 text-orange-500" size={24} />
                  <p className="text-xs leading-relaxed text-orange-800">
                    By clicking "Confirm", the room status will be changed to{' '}
                    <b>Occupied</b> and a reservation ID will be generated.
                  </p>
                </div>
              </div>
            </Form>
          </>
        )}
      </Drawer>

      {/* --- 5. Quick Check Result Modal --- */}
      <Modal
        open={isQuickCheckModalOpen}
        onCancel={() => setIsQuickCheckModalOpen(false)}
        footer={null}
        centered
        width={500}
        closeIcon={null}
        className="availability-modal"
      >
        <div className="relative overflow-hidden p-0">
          {availableRooms.length > 0 ? (
            <div className="space-y-6">
              <div className="relative h-32 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-100">
                      Great News!
                    </p>
                    <h3 className="text-2xl font-black">Rooms Available</h3>
                  </div>
                  <CheckCircle2 className="text-white/30" size={48} />
                </div>
                {/* Abstract Shapes */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              </div>

              <div className="p-2">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Available Room Numbers
                </p>
                <div className="flex flex-wrap gap-3">
                  {availableRooms.map((room: Room) => (
                    <div
                      key={room.roomId}
                      className="flex h-12 w-20 items-center justify-center rounded-2xl border-2 border-blue-50 bg-blue-50/30 text-lg font-bold text-blue-700 transition-all hover:border-blue-200 hover:bg-white hover:shadow-md"
                    >
                      {room.roomNumber}
                    </div>
                  ))}
                </div>

                <Divider className="my-8" />

                <div className="flex gap-4">
                  <Button
                    onClick={() => setIsQuickCheckModalOpen(false)}
                    className="h-14 flex-1 rounded-2xl border-none bg-gray-100 font-bold text-gray-600 transition-all hover:bg-gray-200"
                  >
                    Close
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      setIsQuickCheckModalOpen(false);
                      setDrawerType('add');
                      setIsDrawerOpen(true);
                      // Pre-fill the booking form
                      stepOneForm.setFieldsValue({
                        dates: quickCheckDates,
                        roomType: quickCheckRoomType,
                      });
                    }}
                    className="h-14 flex-[2] rounded-2xl border-none bg-[#0F2942] font-bold shadow-xl shadow-blue-100 ring-4 ring-blue-500/10"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-8 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-red-50 text-red-500">
                <CalendarCheck size={40} className="opacity-80" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-800">Fully Booked</h3>
                <p className="text-gray-500">
                  Sorry, we don't have any available rooms for the selected dates and room
                  type.
                </p>
              </div>
              <Button
                onClick={() => setIsQuickCheckModalOpen(false)}
                className="h-14 w-full rounded-2xl border-none bg-gray-100 font-bold text-gray-600"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Reservations;
