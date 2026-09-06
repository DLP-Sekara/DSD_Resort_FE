import { Typography, Tabs, Collapse, Card, Space, Tag, Button } from 'antd';
import {
  BookOpen,
  Calendar,
  Users as UsersIcon,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  BrainCircuit, // Added for AI module
  ChefHat, // Added for Kitchen BOM
} from 'lucide-react';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const UserGuide = () => {
  const guideSections = [
    {
      key: '1',
      label: (
        <span className="flex items-center gap-2">
          <Calendar size={18} />
          Reservations
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Paragraph>
            The Reservations module is the heart of the system. Here you can manage all
            room bookings, check-ins, and check-outs.
          </Paragraph>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card
              title="Making a Reservation"
              size="small"
              className="border-t-2 border-t-[#092968] shadow-sm"
            >
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Go to <Text strong>"Reservations"</Text> and check room availability.
                </li>
                <li>
                  Select the <Text strong>"Check-in"</Text> and{' '}
                  <Text strong>"Check-out"</Text> dates.
                </li>
                <li>
                  The system will automatically prevent{' '}
                  <Text strong>Overlapping Bookings</Text>.
                </li>
                <li>
                  Enter Guest NIC; the system will auto-fetch data if they are a returning
                  guest.
                </li>
              </ul>
            </Card>
            <Card
              title="Managing Status"
              size="small"
              className="border-t-2 border-t-[#092968] shadow-sm"
            >
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <Tag color="orange">Pending</Tag>: New bookings awaiting confirmation.
                </li>
                <li>
                  <Tag color="#092968">Confirmed</Tag>: Reservation is finalized.
                </li>
                <li>
                  <Tag color="green">Checked In</Tag>: Guest is currently staying.
                </li>
                <li>
                  <Tag color="default">Completed</Tag>: Guest has departed.
                </li>
              </ul>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span className="flex items-center gap-2">
          <ChefHat size={18} />
          Restaurant & Kitchen BOM
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Paragraph>
            Manage walk-in restaurant orders and track kitchen raw material usage
            dynamically.
          </Paragraph>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title="BOM Templates" size="small" className="shadow-sm">
              <ul className="list-disc space-y-1 pl-5">
                <li>Create standard recipes (BOM Templates) for menus.</li>
                <li>Assign raw materials (e.g., Rice, Chicken) and portions.</li>
              </ul>
            </Card>
            <Card title="Usage & Inventory" size="small" className="shadow-sm">
              <Paragraph>
                When you log <Text strong>BOM Usage</Text> (e.g., cooked 50 portions of
                Fried Rice), the system automatically deducts the calculated raw materials
                from the main Inventory.
              </Paragraph>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <span className="flex items-center gap-2">
          <BrainCircuit size={18} />
          AI Forecasting
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Paragraph>
            Utilize the Python ML microservice to predict future guest demand and optimize
            kitchen operations.
          </Paragraph>
          <Card className="border-l-4 border-l-[#F26E22] shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#FFF0E6] p-3 text-[#F26E22]">
                <Lightbulb size={24} />
              </div>
              <div>
                <Title level={5}>How to run a forecast?</Title>
                <Paragraph>
                  Select a future target date. The AI engine will analyze historical
                  booking patterns, weather features, and holidays to predict the exact
                  number of guests expected. You can use this data to calculate the
                  required kitchen raw materials in advance!
                </Paragraph>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: '4',
      label: (
        <span className="flex items-center gap-2">
          <UsersIcon size={18} />
          Guest Profiles
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Paragraph>Maintain a comprehensive database of your guests.</Paragraph>
          <Card className="shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#E6EAF5] p-3 text-[#092968]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <Title level={5}>Automatic Recognition</Title>
                <Paragraph>
                  When making a new reservation, enter the guest's NIC. If they've stayed
                  before, the system will automatically fetch their details, saving you
                  time!
                </Paragraph>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl py-8">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-[#092968] p-4 text-white shadow-lg">
          <BookOpen size={32} />
        </div>
        <Title className="!mb-2">DSD Resort User Guide</Title>
        <Paragraph className="text-lg text-gray-500">
          Welcome to the DSD Resort Management System! This guide will help you navigate
          core operations, AI features, and kitchen inventory.
        </Paragraph>
      </div>

      {/* Tabs Section */}
      <section className="mb-12">
        <div className="mb-6 flex items-center gap-2">
          <ChevronRight className="text-[#F26E22]" size={24} />
          <Title level={3} className="!mb-0 text-[#092968]">
            Getting Started
          </Title>
        </div>

        <Tabs
          defaultActiveKey="1"
          items={guideSections}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          size="large"
          tabBarStyle={{ color: '#092968' }}
        />
      </section>

      {/* FAQ Section */}
      <section className="mb-12">
        <Title level={3} className="mb-8 text-center text-[#092968]">
          Frequently Asked Questions
        </Title>
        <Collapse
          ghost
          expandIconPosition="end"
          className="rounded-xl bg-white p-2 shadow-sm"
        >
          <Panel
            header="What happens if a room is already booked for the selected dates?"
            key="1"
            className="font-semibold text-black"
          >
            <Paragraph className="font-normal text-gray-600">
              Our system has a built-in validation mechanism. If you try to book a room
              that overlaps with an existing reservation, the system will trigger a
              warning and block the transaction to prevent double-booking.
            </Paragraph>
          </Panel>

          <Panel
            header="How does the Kitchen Inventory deduct automatically?"
            key="2"
            className="font-semibold text-black"
          >
            <Paragraph className="font-normal text-gray-600">
              When a Chef adds a new record in the <Text strong>BOM Usage Log</Text>, the
              Java Spring Boot backend calculates the required quantities based on the BOM
              Template and automatically deducts that amount from the{' '}
              <Text strong>Raw Materials</Text> table.
            </Paragraph>
          </Panel>

          <Panel
            header="Can I register a new Admin user?"
            key="3"
            className="font-semibold text-black"
          >
            <Paragraph className="font-normal text-gray-600">
              Only users with <Text strong>HEAD_CHEF</Text> or <Text strong>ADMIN</Text>{' '}
              privileges have access to specific restricted areas. Ensure you assign the
              correct role during user creation.
            </Paragraph>
          </Panel>
        </Collapse>
      </section>

      {/* Support Banner Card */}
      <Card className="relative overflow-hidden rounded-3xl border-none bg-[#092968] text-white shadow-xl">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <HelpCircle size={120} color="#F26E22" />
        </div>
        <div className="relative z-10 flex flex-col items-center py-4 text-center">
          <Title level={3} className="!mb-2 !text-white">
            Still need assistance?
          </Title>
          <Paragraph className="mb-6 max-w-md text-gray-300">
            If you encounter any technical issues with the AI Forecasting module or
            general operations, please contact the{' '}
            <Text className="text-[#F26E22]" strong>
              System Administrator
            </Text>
            .
          </Paragraph>
          <Space size="middle">
            <Button
              type="primary"
              size="large"
              // Applies the Orange theme color to the button
              className="border-none !bg-[#F26E22] font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
            >
              Contact Support
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default UserGuide;
