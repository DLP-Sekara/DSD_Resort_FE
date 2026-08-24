import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Drawer,
  Space,
  Select,
  Form,
  Badge,
  Popconfirm,
} from 'antd';
import { Plus, Edit, Trash2, Bed, Info } from 'lucide-react';
import ActionDialog from '../../components/common/ActionDialog';
import CustomButton from '../../components/common/CustomButton';
import roomMutation from '../../mutations/room.mutation';
import type { RoomType } from '../../types/rooms';
import type { Room } from '../../types/services.interfaces';
import { errorToast } from '../../components/common/Alert';

const { Option } = Select;

const Rooms = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('add');
  const [roomTypeModalOpen, setRoomTypeModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isRoomTypeDrawerOpen, setIsRoomTypeDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const {
    getAllRoomTypesMutation,
    createRoomTypeMutation,
    deleteRoomTypeMutation,
    createRoomMutation,
    getAllRoomsMutation,
    updateRoomMutation,
    deleteRoomMutation,
  } = roomMutation();
  const { data: rooms } = getAllRoomsMutation();
  const { data: roomTypes } = getAllRoomTypesMutation();
  
  const { mutateAsync: createRoomType, isPending: createRoomTypeLoading } =
    createRoomTypeMutation();
  const { mutateAsync: deleteRoomType, isPending: deleteRoomTypeLoading } =
    deleteRoomTypeMutation();
  const { mutateAsync: createRoom, isPending: createRoomLoading } = createRoomMutation();
  const { mutateAsync: updateRoom, isPending: updateRoomLoading } = updateRoomMutation();
  const { mutateAsync: deleteRoom, isPending: deleteRoomLoading } = deleteRoomMutation();

  useEffect(() => {
    if (drawerType === 'edit' && selectedRoom) {
      form.setFieldsValue({
        roomNo: selectedRoom.roomNumber,
        type: selectedRoom.typeId,
        status: selectedRoom.status,
      });
    } else {
      form.resetFields();
    }
  }, [selectedRoom, drawerType, form, isDrawerOpen]);

  // Table Columns
  const columns = [
    {
      title: 'Room No',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      render: (text: string) => <span className="font-bold text-blue-600">{text}</span>,
    },
    {
      title: 'Room Type',
      dataIndex: 'typeId',
      key: 'typeId',
      render: (text: string) => (
        <span className="font-bold text-blue-600">
          {roomTypes?.data?.find((item: RoomType) => item.typeId === text)?.typeName}
        </span>
      ),
    },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',

      render: (status: string) => {
        const statusMap: Record<string, 'success' | 'error' | 'warning' | 'processing'> =
          {
            AVAILABLE: 'success',
            OCCUPIED: 'error',
            MAINTENANCE: 'warning',
            CLEANING: 'processing',
          };
        return (
          <Badge
            status={
              statusMap[status.toUpperCase() as keyof typeof statusMap] || 'default'
            }
            text={status}
          />
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Edit size={18} className="text-gray-400 hover:text-orange-500" />}
            onClick={() => {
              setSelectedRoom(record);
              setDrawerType('edit');
              setIsDrawerOpen(true);
            }}
            loading={updateRoomLoading}
          />
          <Popconfirm
            title="Delete the room"
            description="Are you sure to delete this room?"
            onConfirm={() => {
              deleteRoom(record.roomId);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<Trash2 size={18} className="text-gray-400 hover:text-red-500" />}
              loading={deleteRoomLoading}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreateRoomType = async (values: any) => {
    const data = {
      typeName: values.type_name,
      pricePerNight: values.price,
      maxOccupancy: values.maxOccupancy,
    };
    await createRoomType(data);
    setRoomTypeModalOpen(false);
    form.resetFields();
  };

  const handleCreateRoom = async (values: any) => {
    const data = {
      roomNumber: values.roomNo,
      typeId: values.type,
      status: values.status,
    }; 
    const response = await createRoom(data);
    if (response.success) {
      setIsDrawerOpen(false);
      form.resetFields();
    }
  };

  const handleUpdateRoom = async (values: any) => {
    const data = {
      roomId: selectedRoom?.roomId,
      roomNumber: values.roomNo,
      typeId: values.type,
      status: values.status,
    };
    const response = await updateRoom(data);
    if (response.success) {
      setIsDrawerOpen(false);
      form.resetFields();
      setSelectedRoom(null);
    }
  };

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      {/* --- 1. Header & Actions --- */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#0F2942]">Room Management</h2>
          <p className="text-sm text-gray-400">
            Manage room inventory, pricing and status
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
            Add New Room
          </Button>
          <Button
            // type="default"
            size="large"
            onClick={() => {
              setIsRoomTypeDrawerOpen(true);
            }}
            className="flex h-12 items-center gap-2 rounded-xl border-none bg-orange-500 shadow-lg hover:bg-orange-500"
          >
            Room Types
          </Button>
        </div>
      </div>
      {/* --- 2. Filter & Search Bar --- */}
      {/* <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/50 p-2">
        <Input
          prefix={<Search size={18} className="text-gray-400" />}
          placeholder="Search room number..."
          className="h-11 w-full shadow-sm md:w-80"
        />
        <Select
          defaultValue="all"
          className="h-11 w-44 rounded-xl border-none shadow-sm"
          allowClear
          placeholder="Select Room Type"
        >
          {roomTypes?.data?.map((item: RoomType) => (
            <Option key={item.typeId} value={item.typeId}>
              {item.typeName}
            </Option>
          ))}
        </Select>
      </div> */}
      {/* --- 3. Main Data Table --- */}
      <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <Table
          dataSource={rooms?.data}
          columns={columns}
          pagination={{ pageSize: 8 }}
          className="custom-table"
        />
      </div>

      {/* --- 4. Side Drawer (Add/Edit Room) --- */}
      <Drawer
        title={
          <span className="text-xl font-bold">
            {drawerType === 'add' ? 'Add New Room' : 'Edit Room Details'}
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
          onFinish={drawerType === 'add' ? handleCreateRoom : handleUpdateRoom}
        >
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <Bed className="text-orange-500" size={24} />
            <div>
              <p className="text-xs font-bold uppercase text-orange-600">
                Room Inventory
              </p>
              <p className="text-sm font-medium text-orange-900">
                Update room status manually for maintenance.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-blue-50 p-5">
            <h4 className="mb-2 flex items-center gap-2 font-bold text-blue-800">
              <Info size={16} /> Admin Note
            </h4>
            <p className="text-xs leading-relaxed text-blue-600">
              Please note that when changing the price or type of a room, it does not
              affect existing active reservations.
            </p>
          </div>

          <Form.Item label="Room Number" name="roomNo" rules={[{ required: true }]}>
            <Input placeholder="e.g. 101, 205" className="h-10 rounded-lg" />
          </Form.Item>

          <Form.Item label="Room Type" name="type" rules={[{ required: true }]}>
            <Select placeholder="Select Type" className="rounded-lg">
              {roomTypes?.data?.map((item: RoomType) => (
                <Option key={item.typeId} value={item.typeId}>
                  {item.typeName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Cleaning Status" name="status" rules={[{ required: true }]}>
            <Select className="rounded-lg" placeholder="Select Status">
              <Option value="AVAILABLE">Available</Option>
              <Option value="OCCUPIED">Occupied</Option>
              <Option value="MAINTENANCE">Maintenance</Option>
              <Option value="CLEANING">Cleaning</Option>
            </Select>
          </Form.Item>

          <Form.Item className="flex justify-end !gap-2 !space-x-2">
            <Button onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              className="ml-4 rounded-lg border-none bg-blue-600"
              htmlType="submit"
              loading={createRoomLoading}
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Room type drawer */}
      <Drawer
        title={<span className="text-xl font-bold">Room Types</span>}
        placement="right"
        width={400}
        onClose={() => setIsRoomTypeDrawerOpen(false)}
        open={isRoomTypeDrawerOpen}
        className="rounded-l-[2rem]"
      >
        <div className="space-y-6">
          <Button
            type="primary"
            size="large"
            icon={<Plus size={20} />}
            onClick={() => setRoomTypeModalOpen(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-none bg-orange-500 shadow-lg hover:bg-orange-600"
          >
            Create New Room Type
          </Button>

          <div className="grid gap-4">
            {roomTypes?.data.map((item: any, idx: any) => (
              <div
                key={idx}
                className="group relative flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100">
                  <Bed size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{item.typeName}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>LKR {item.pricePerNight}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-300" />

                    <span>
                      {rooms?.data?.filter((room: any) => room.typeId === item.typeId)
                        ?.length || 0}{' '}
                      Rooms
                    </span>
                  </div>
                </div>

                <Button
                  type="text"
                  icon={<Trash2 size={18} className="text-gray-400 hover:text-red-500" />}
                  onClick={() => {
                    if (rooms?.data?.some((room: any) => room.typeId === item.typeId)) {
                      errorToast('Cannot delete room type with existing rooms');
                      return;
                    }
                    deleteRoomType(item.typeId);
                  }}
                  loading={deleteRoomTypeLoading}
                />
              </div>
            ))}
          </div>
        </div>
      </Drawer>

      {/*Add new room type  */}
      <ActionDialog
        modalOpen={roomTypeModalOpen}
        handleCancel={() => setRoomTypeModalOpen(false)}
        title={
          <>
            <Bed className="text-orange-500" size={24} />
            Add New Room Type
          </>
        }
        children={
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
              handleCreateRoomType(values);
            }}
            className="space-y-4"
          >
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <Bed className="text-orange-500" size={24} />
              <div>
                <p className="text-xs font-bold uppercase text-orange-600">
                  Room Inventory
                </p>
                <p className="text-sm font-medium text-orange-900">
                  Update room status manually for maintenance.
                </p>
              </div>
            </div>

            <Form.Item label="Room Type" name="type_name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Deluxe King" className="h-10 rounded-lg" />
            </Form.Item>

            <Form.Item label="Price (Rs)" name="price" rules={[{ required: true }]}>
              <Input
                placeholder="e.g. 25000"
                onKeyDown={(e) => {
                  if (
                    !/[0-9.]/.test(e.key) &&
                    !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(
                      e.key,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                className="h-10 rounded-lg"
              />
            </Form.Item>

            <Form.Item label="Max Occupancy" name="maxOccupancy" rules={[{ required: true }]}>
              <Input
                placeholder="e.g. 2"
                onKeyDown={(e) => {
                  if (
                    !/[0-9]/.test(e.key) &&
                    !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(
                      e.key,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                className="h-10 rounded-lg"
              />
            </Form.Item>

            <Form.Item>
              <CustomButton
                type="primary"
                className="mt-5 w-full bg-orange-500"
                buttonName="Add Room Type"
                icon={<Plus size={20} />}
                htmlType="submit"
                loading={createRoomTypeLoading}
              />
            </Form.Item>

            <div className="mt-8 rounded-2xl bg-blue-50 p-5">
              <h4 className="mb-2 flex items-center gap-2 font-bold text-blue-800">
                <Info size={16} /> Admin Note
              </h4>
              <p className="text-xs leading-relaxed text-blue-600">
                Please note that when changing the price or type of a room, it does not
                affect existing active reservations.
              </p>
            </div>
          </Form>
        }
      />
    </div>
  );
};

export default Rooms;
