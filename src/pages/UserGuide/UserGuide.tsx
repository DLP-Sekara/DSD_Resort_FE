import { Typography, Tabs, Collapse, Card, Space, Tag, Button } from 'antd';
import {
  BookOpen,
  Calendar,
  Bed,
  Users as UsersIcon,
  Utensils,
  CreditCard,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
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
            <Card title="Making a Reservation" size="small" className="shadow-sm">
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
            <Card title="Managing Status" size="small" className="shadow-sm">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <Tag color="blue">Pending</Tag>: New bookings awaiting confirmation.
                </li>
                <li>
                  <Tag color="green">Confirmed</Tag>: Reservation is finalized.
                </li>
                <li>
                  <Tag color="orange">Checked In</Tag>: Guest is currently staying.
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
          <Bed size={18} />
          Rooms & Availability
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Paragraph>
            Manage your hotel's inventory. Add new rooms, define room types, and monitor
            real-time availability.
          </Paragraph>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title="Room Management" size="small" className="shadow-sm">
              <ul className="list-disc space-y-1 pl-5">
                <li>Create room categories (Single, Double, Suite).</li>
                <li>Set pricing per night for each category.</li>
                <li>Assign room numbers and features.</li>
                <li>Mark rooms as "Maintenance" if they are out of service.</li>
              </ul>
            </Card>
            <Card title="Check Availability" size="small" className="shadow-sm">
              <Paragraph>
                The dashboard provides a quick overview of today's occupancy. Use the
                "Rooms" page to see a detailed calendar view of bookings.
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
          <UsersIcon size={18} />
          Guest Profiles
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Paragraph>
            Maintain a comprehensive database of your guests for faster bookings and
            personalized service.
          </Paragraph>
          <Card className="shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
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
    {
      key: '4',
      label: (
        <span className="flex items-center gap-2">
          <Utensils size={18} />
          Meals & Dining
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Paragraph>
            Configure meal plans and track dining preferences for each reservation.
          </Paragraph>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Define meal plans like <Text code>Bed & Breakfast</Text>,{' '}
              <Text code>Half Board</Text>, or <Text code>Full Board</Text>.
            </li>
            <li>Assign meal preferences during the reservation process.</li>
            <li>Generate kitchen reports to see daily meal requirements.</li>
          </ul>
        </div>
      ),
    },
    {
      key: '5',
      label: (
        <span className="flex items-center gap-2">
          <CreditCard size={18} />
          Billing & Invoices
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Paragraph>
            Handle payments and generate professional invoices for your guests.
          </Paragraph>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold text-amber-700">
              <Lightbulb size={20} />
              <span>Automated Billing Logic</span>
            </div>
            <Paragraph className="mb-0 text-amber-800">
              The system calculates the final bill based on the{' '}
              <Text strong>Room Price per Night</Text>
              multiplied by the duration of stay, plus the selected{' '}
              <Text strong>Meal Plan rates</Text>. Invoices can be downloaded as PDFs.
            </Paragraph>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-200">
          <BookOpen size={32} />
        </div>
        <Title className="!mb-2">System User Guide</Title>
        <Paragraph className="text-lg text-gray-500">
          Welcome to the Online Room Reservation System! This guide will help you
          understand how to navigate and manage your property effectively.
        </Paragraph>
      </div>

      <section className="mb-12">
        <div className="mb-6 flex items-center gap-2">
          <ChevronRight className="text-blue-600" size={24} />
          <Title level={3} className="!mb-0">
            Getting Started
          </Title>
        </div>

        <Tabs
          defaultActiveKey="1"
          items={guideSections}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          size="large"
        />
      </section>

      <section className="mb-12">
        <Title level={3} className="mb-8 text-center">
          Frequently Asked Questions
        </Title>
        <Collapse ghost expandIconPosition="end" className="...">
          <Panel
            header="What happens if a room is already booked for the selected dates?"
            key="1"
            className="font-semibold"
          >
            <Paragraph className="font-normal text-gray-600">
              Our system has a built-in validation mechanism. If you try to book a room
              that overlaps with an existing reservation, the system will trigger a
              warning and block the transaction to prevent double-booking.
            </Paragraph>
          </Panel>

          <Panel
            header="Can I register a new Admin user?"
            key="2"
            className="font-semibold"
          >
            <Paragraph className="font-normal text-gray-600">
              Only users with <Text strong>SUPER_ADMIN</Text> privileges can create or
              manage other Admin users. Regular staff members can only view dashboard
              statistics and manage reservations.
            </Paragraph>
          </Panel>

          <Panel
            header="How does the Guest Auto-Fill work?"
            key="3"
            className="font-semibold"
          >
            <Paragraph className="font-normal text-gray-600">
              Simply enter the guest's NIC number in the reservation form. The system
              queries the database instantly and populates the name and contact details if
              the guest has stayed at Ocean View Resort previously.
            </Paragraph>
          </Panel>

          <Panel
            header="How do I handle a Guest Check-out?"
            key="4"
            className="font-semibold"
          >
            <Paragraph className="font-normal text-gray-600">
              Navigate to the specific reservation, review the final bill, and mark the
              status as "Completed". Once completed, the room status will automatically
              revert to "Available" for new bookings.
            </Paragraph>
          </Panel>
        </Collapse>
      </section>

      <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <HelpCircle size={120} />
        </div>
        <div className="relative z-10 flex flex-col items-center py-4 text-center">
          <Title level={3} className="!mb-2 !text-white">
            Still need assistance?
          </Title>
          <Paragraph className="mb-6 max-w-md text-blue-100">
            If you encounter any technical issues or need access to restricted modules,
            please contact the{' '}
            <Text className="text-white" strong>
              System Administrator
            </Text>{' '}
            or the IT department.
          </Paragraph>
          <Space size="middle">
            <Button
              type="primary"
              size="large"
              className="border-none bg-white font-bold !text-blue-600 hover:!bg-blue-50"
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
