import {
  Form,
  Input,
  Button,
  Tabs,
  Table,
  Tag,
  Divider,
  Card,
  Modal,
  Select,
} from 'antd';
import { KeyRound, UserPlus, ShieldCheck, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';
import settingMutation from '../../mutations/setting.mutation';
import type { ChangePasswordTypes } from '../../types/onBoarding.interfaces';

const { Option } = Select;

const Settings = () => {
  const [passwordForm] = Form.useForm();
  const [adminForm] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { addNewAdminMutation, changePasswordMutation, getAllSystemUsersQuery } =
    settingMutation();
  const { mutate: addAdmin, isPending: isAddingAdmin } = addNewAdminMutation();
  const { mutate: changePassword, isPending: isChangingPassword } =
    changePasswordMutation();
  const { data: systemUsersData, isLoading: isUsersLoading } = getAllSystemUsersQuery();

  const handleAddAdmin = (values: any) => {
    addAdmin(values, {
      onSuccess: (res: any) => {
        if (res?.success) {
          setIsModalOpen(false);
          adminForm.resetFields();
        }
      },
    });
  };

  const handleChangePassword = (values: ChangePasswordTypes) => {
    changePassword(values, {
      onSuccess: (res: any) => {
        if (res?.success) {
          passwordForm.resetFields();
        }
      },
    });
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span className="flex items-center gap-2 font-semibold">
          <UserPlus size={16} /> System Operators
        </span>
      ),
      children: (
        <div className="animate-in fade-in space-y-6 duration-500">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-[#092968]">
              Registered System Operators
            </h4>
            <Button
              type="primary"
              icon={<UserPlus size={16} />}
              className="rounded-xl !bg-[#F26E22] font-semibold text-white shadow-sm hover:!bg-[#D95C1A]"
              onClick={() => setIsModalOpen(true)}
            >
              Add New Operator
            </Button>
          </div>
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <Table
              pagination={false}
              loading={isUsersLoading}
              dataSource={systemUsersData?.data || []}
              columns={[
                {
                  title: 'Operator Name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (t) => <b className="text-[#0B1B3D]">{t}</b>,
                },
                { title: 'Email Address', dataIndex: 'email', key: 'email' },
                {
                  title: 'Access Level',
                  dataIndex: 'role',
                  key: 'role',
                  render: (r: string) => {
                    let color = 'blue';
                    if (r === 'ADMIN' || r === 'SUPER_ADMIN') color = 'geekblue';
                    if (r === 'RECEPTIONIST') color = 'orange';
                    if (r === 'HEAD_CHEF') color = 'green';
                    return (
                      <Tag color={color} className="rounded-md px-2 py-0.5 font-semibold">
                        {r}
                      </Tag>
                    );
                  },
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span className="flex items-center gap-2 font-semibold">
          <KeyRound size={16} /> Change Password
        </span>
      ),
      children: (
        <div className="animate-in fade-in max-w-md rounded-3xl border border-gray-100 bg-white p-6 duration-500">
          <h4 className="mb-6 text-lg font-bold text-[#092968]">
            Update Security Credentials
          </h4>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
            requiredMark={false}
          >
            <Form.Item
              label={
                <span className="text-sm font-semibold text-[#0B1B3D]">
                  Current Password
                </span>
              }
              name="currentPassword"
              rules={[{ required: true, message: 'Please enter your current password!' }]}
            >
              <Input.Password
                placeholder="••••••••"
                className="h-11 rounded-xl hover:border-[#F26E22] focus:border-[#F26E22]"
              />
            </Form.Item>
            <Divider />
            <Form.Item
              label={
                <span className="text-sm font-semibold text-[#0B1B3D]">New Password</span>
              }
              name="newPassword"
              rules={[
                { required: true, message: 'Please enter your new password!' },
                { min: 6, message: 'New password must be at least 6 characters!' },
              ]}
            >
              <Input.Password
                placeholder="••••••••"
                className="h-11 rounded-xl hover:border-[#F26E22] focus:border-[#F26E22]"
              />
            </Form.Item>
            <Form.Item
              label={
                <span className="text-sm font-semibold text-[#0B1B3D]">
                  Confirm New Password
                </span>
              }
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="••••••••"
                className="h-11 rounded-xl hover:border-[#F26E22] focus:border-[#F26E22]"
              />
            </Form.Item>
            <Button
              type="primary"
              block
              size="large"
              loading={isChangingPassword}
              className="mt-4 h-12 rounded-xl border-none !bg-[#F26E22] font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
              htmlType="submit"
            >
              Update Password
            </Button>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#092968]">Settings & Security</h2>
        <p className="text-sm text-gray-500">
          Manage system operator access levels and update your security credentials
        </p>
      </div>

      <div className="min-h-[500px] rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
        <Tabs
          defaultActiveKey="1"
          items={tabItems}
          tabPosition="left"
          className="security-tabs"
        />
      </div>

      {/* Add New Operator Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F26E22]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-bold text-[#092968]">
                Add New System Operator
              </h3>
              <p className="text-xs font-normal text-gray-500">
                Create new operator account with specific access rights
              </p>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={460}
        className="custom-modal"
      >
        <Form
          form={adminForm}
          layout="vertical"
          onFinish={handleAddAdmin}
          requiredMark={false}
          className="mt-4 space-y-1"
        >
          <Form.Item
            label={
              <span className="text-xs font-semibold text-[#0B1B3D]">Full Name</span>
            }
            name="name"
            rules={[{ required: true, message: 'Please enter operator name' }]}
            className="!mb-3"
          >
            <Input
              prefix={<User size={16} className="mr-1 text-gray-400" />}
              placeholder="e.g. John Doe"
              size="middle"
              className="!rounded-lg py-1.5 hover:border-[#F26E22] focus:border-[#F26E22]"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-semibold text-[#0B1B3D]">Access Level</span>
            }
            name="role"
            rules={[{ required: true, message: 'Please select an access level' }]}
            // initialValue="ADMIN"
            className="!mb-4"
          >
            <Select size="middle" className="w-full rounded-lg">
              <Option value="ADMIN">ADMIN (System Administrator)</Option>
              <Option value="RECEPTIONIST">RECEPTIONIST (Front Desk Operator)</Option>
              <Option value="HEAD_CHEF">HEAD_CHEF (Kitchen & Meal Manager)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-semibold text-[#0B1B3D]">Email Address</span>
            }
            name="email"
            rules={[
              { required: true, message: 'Please enter email address' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
            className="!mb-3"
          >
            <Input
              prefix={<Mail size={16} className="mr-1 text-gray-400" />}
              placeholder="operator@dsdresort.com"
              size="middle"
              className="!rounded-lg py-1.5 hover:border-[#F26E22] focus:border-[#F26E22]"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-[#0B1B3D]">Password</span>}
            name="password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
            className="!mb-3"
          >
            <Input.Password
              prefix={<Lock size={16} className="mr-1 text-gray-400" />}
              placeholder="••••••••"
              size="middle"
              className="!rounded-lg py-1.5 hover:border-[#F26E22] focus:border-[#F26E22]"
            />
          </Form.Item>

          <div className="!mt-10 flex gap-3 pt-2">
            <Button
              size="middle"
              className="h-10 flex-1 rounded-xl border-gray-300 font-semibold text-gray-700 hover:border-gray-400"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="middle"
              className="h-10 flex-1 rounded-xl !border-none !bg-[#F26E22] font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
              htmlType="submit"
              loading={isAddingAdmin}
            >
              Create Operator
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
