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
import { successToast } from '../../components/common/Alert';

const { Option } = Select;

const Settings = () => {
  const [passwordForm] = Form.useForm();
  const [adminForm] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { addNewAdminMutation, getAllSystemUsersQuery } = settingMutation();
  const { mutate: addAdmin, isPending: isAddingAdmin } = addNewAdminMutation();
  const { data: systemUsersData, isLoading: isUsersLoading } = getAllSystemUsersQuery();

  const handleAddAdmin = (values: any) => {
    addAdmin(values, {
      onSuccess: () => {
        setIsModalOpen(false);
        adminForm.resetFields();
      },
    });
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span className="flex items-center gap-2">
          <UserPlus size={16} /> System Admins
        </span>
      ),
      children: (
        <div className="animate-in fade-in space-y-6 duration-500">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-gray-700">Privileged Administrators</h4>
            <Button
              type="primary"
              icon={<UserPlus size={16} />}
              className="rounded-lg bg-blue-600"
              onClick={() => setIsModalOpen(true)}
            >
              Add Admin
            </Button>
          </div>
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <Table
              pagination={false}
              loading={isUsersLoading}
              dataSource={systemUsersData?.data || []}
              columns={[
                {
                  title: 'Admin Name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (t) => <b>{t}</b>,
                },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                {
                  title: 'Access Level',
                  dataIndex: 'role',
                  key: 'role',
                  render: (r) => (
                    <Tag color={r === 'SUPER_ADMIN' ? 'purple' : 'blue'}>{r}</Tag>
                  ),
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
        <span className="flex items-center gap-2">
          <KeyRound size={16} /> Change Password
        </span>
      ),
      children: (
        <div className="animate-in fade-in max-w-md rounded-3xl border border-gray-100 bg-white p-6 duration-500">
          <h4 className="mb-6 text-lg font-bold text-gray-700">
            Update Security Credentials
          </h4>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={() => successToast('Password changed successfully!')}
          >
            <Form.Item
              label="Current Password"
              name="current"
              rules={[{ required: true }]}
            >
              <Input.Password placeholder="••••••••" className="h-11 rounded-xl" />
            </Form.Item>
            <Divider />
            <Form.Item label="New Password" name="new" rules={[{ required: true }]}>
              <Input.Password placeholder="••••••••" className="h-11 rounded-xl" />
            </Form.Item>
            <Form.Item
              label="Confirm New Password"
              name="confirm"
              rules={[{ required: true }]}
            >
              <Input.Password placeholder="••••••••" className="h-11 rounded-xl" />
            </Form.Item>
            <Button
              type="primary"
              block
              size="large"
              className="mt-4 h-12 rounded-xl border-none bg-orange-500 hover:bg-blue-600"
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
        <h2 className="text-2xl font-bold text-[#0F2942]">Settings & Security</h2>
        <p className="text-sm text-gray-400">
          Manage administrator access and track your account security
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

      <Modal
        title={
          <div className="flex items-center gap-2 pb-2">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Add System Administrator</h3>
              <p className="text-xs font-normal text-gray-400">
                Grant privileged access to the management system
              </p>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={500}
        className="custom-modal"
      >
        <Form
          form={adminForm}
          layout="vertical"
          onFinish={handleAddAdmin}
          className="mt-6"
        >
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: 'Please enter admin name' }]}
          >
            <Input
              prefix={<User size={18} className="text-gray-400" />}
              placeholder="e.g. Lahiru Siri"
              className="h-12 rounded-xl"
            />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter email address' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<Mail size={18} className="text-gray-400" />}
              placeholder="admin@example.com"
              className="h-12 rounded-xl"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              prefix={<Lock size={18} className="text-gray-400" />}
              placeholder="••••••••"
              className="h-12 rounded-xl"
            />
          </Form.Item>

          <Form.Item
            label="Access Level"
            name="role"
            rules={[{ required: true, message: 'Please select a role' }]}
            initialValue="ADMIN"
          >
            <Select size="large" className="w-full rounded-xl">
              <Option value="SUPER_ADMIN">Super Admin (Full Access)</Option>
              <Option value="ADMIN">System Admin (Regular Access)</Option>
            </Select>
          </Form.Item>

          <div className="mt-8 flex gap-3">
            <Button
              size="large"
              className="flex-1 rounded-xl"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              className="flex-1 rounded-xl bg-blue-600"
              htmlType="submit"
              loading={isAddingAdmin}
            >
              Create Admin
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
