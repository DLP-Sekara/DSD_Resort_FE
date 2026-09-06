import { useState, useEffect } from 'react';
import { Table, Tag, Button, Input, Drawer, Space, Form, Avatar, Popconfirm } from 'antd';
import { Edit, Trash2, ShieldCheck, Phone } from 'lucide-react';
import userMutation from '../../mutations/user.mutation';
import type { UserAccount } from '../../types/services.interfaces';

const Users = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('add');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [form] = Form.useForm();

  const { getAllUsersMutation, updateUserMutation, deleteUserMutation } = userMutation();

  const { data: usersData, isLoading: isUsersLoading } = getAllUsersMutation();
  const { mutateAsync: updateUser, isPending: isUpdateLoading } = updateUserMutation();
  const { mutateAsync: deleteUser, isPending: isDeleteLoading } = deleteUserMutation();

  useEffect(() => {
    if (drawerType === 'edit' && selectedUser) {
      form.setFieldsValue({
        name: selectedUser.name,
        nic: selectedUser.nic,
        phone: selectedUser.phone,
      });
    } else {
      form.resetFields();
    }
  }, [selectedUser, drawerType, form]);

  const handleFinish = async (values: any) => {
    try {
      if (drawerType === 'edit' && selectedUser) {
        await updateUser({ ...selectedUser, ...values });
      }
      setIsDrawerOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-blue-100 font-bold text-blue-600">
            {text?.charAt(0) || 'U'}
          </Avatar>
          <span className="font-bold text-gray-700">{text}</span>
        </div>
      ),
    },
    {
      title: 'Phone Number',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => <Tag className="rounded-md">{text || '-'}</Tag>,
    },
    {
      title: 'NIC',
      dataIndex: 'nic',
      key: 'nic',
      render: (text: string) => <Tag className="rounded-md">{text || '-'}</Tag>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
            role === 'Admin'
              ? 'bg-purple-100 text-purple-600'
              : 'bg-blue-100 text-blue-600'
          }`}
        >
          {role || 'Guest'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: UserAccount) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Edit size={18} className="text-gray-400 hover:text-blue-500" />}
            onClick={() => {
              setSelectedUser(record);
              setDrawerType('edit');
              setIsDrawerOpen(true);
            }}
          />
          <Popconfirm
            title="Delete user"
            description="Are you sure to delete this user?"
            onConfirm={() => deleteUser(record?.guestId!)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<Trash2 size={18} className="text-gray-400 hover:text-red-500" />}
              loading={isDeleteLoading}
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
          <h2 className="text-2xl font-bold text-[#0F2942]">User Management</h2>
          <p className="text-sm text-gray-400">
            Manage system access levels and staff accounts
          </p>
        </div>
      </div>

      {/* --- 3. Main Data Table --- */}
      <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <Table
          dataSource={usersData?.data}
          columns={columns}
          loading={isUsersLoading}
          pagination={{ pageSize: 8 }}
          className="custom-table"
        />
      </div>

      {/* --- 4. Side Drawer (Add/Edit User) --- */}
      <Drawer
        title={
          <span className="text-xl font-bold">
            {drawerType === 'add' ? 'Create User Account' : 'Edit User Profile'}
          </span>
        }
        placement="right"
        width={450}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedUser(null);
        }}
        open={isDrawerOpen}
        className="rounded-l-[2rem]"
      >
        <Form form={form} layout="vertical" className="space-y-4" onFinish={handleFinish}>
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <ShieldCheck className="text-purple-600" size={24} />
            <div>
              <p className="text-xs font-bold uppercase text-purple-600">
                Access Control
              </p>
              <p className="text-sm font-medium text-purple-900">
                Assign roles carefully to maintain security.
              </p>
            </div>
          </div>

          {drawerType !== 'edit' && (
            <Form.Item
              label="NIC Number"
              name="nic"
              rules={[
                { required: true },
                {
                  pattern: /^([0-9]{9}[vVxX]|[0-9]{12})$/,
                  message: 'Enter a valid NIC (e.g., 123456789V or 123456789012)',
                },
              ]}
            >
              <Input placeholder="e.g. 199012345678" className="h-10 rounded-lg" />
            </Form.Item>
          )}

          <Form.Item label="Phone Number" name="phone">
            <Input
              prefix={<Phone size={16} className="text-gray-400" />}
              placeholder="e.g. +94 77 123 4567"
              className="h-10 rounded-lg"
            />
          </Form.Item>

          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. John Doe" className="h-10 rounded-lg" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => {
                setIsDrawerOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              className="rounded-lg border-none bg-blue-600"
              htmlType="submit"
              loading={isUpdateLoading}
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default Users;
