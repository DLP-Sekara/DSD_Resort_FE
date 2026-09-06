import { useState, useEffect } from 'react';
import { Table, Tag, Button, Drawer, Space, DatePicker } from 'antd';
import { Eye, Printer, Download } from 'lucide-react';
import reservationMutation from '../../mutations/reservation.mutation';
import type { Reservation, Room } from '../../types/services.interfaces';
import mealMutation from '../../mutations/meal.mutation';
import roomMutation from '../../mutations/room.mutation';
import userMutation from '../../mutations/user.mutation';
import { Invoice } from './components/Invoice';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';

const BillingAndPayments = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const reservationFilters = {
    page: 0,
    size: 1000,
  };

  //------------------------------------------------ mutations -----------------------------------------------
  const { getAllMealPlansMutation, getAllFoodItemsMutation } = mealMutation();
  const { getAllRoomTypesMutation, getAllRoomsMutation } = roomMutation();
  const { getAllReservationsQuery, getAllIncomesByMonthMutation } = reservationMutation();

  const {
    mutate: getIncomes,
    data: incomeData,
    isPending: isIncomeLoading,
  } = getAllIncomesByMonthMutation();

  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    const data = {
      year: selectedDate.year(),
      month: selectedDate.month() + 1,
    };
    getIncomes(data);
  }, [selectedDate, getIncomes]);

  const { getAllUsersMutation } = userMutation();

  const { data: usersData } = getAllUsersMutation();
  const { data: mealPlans } = getAllMealPlansMutation();
  const { data: foodItems } = getAllFoodItemsMutation();
  const { data: rooms } = getAllRoomsMutation();
  const { data: roomTypes } = getAllRoomTypesMutation();
  const { data: reservationsData } = getAllReservationsQuery(reservationFilters);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`Invoice_${selectedInvoice?.resId?.split('-')[0]}.pdf`);
  };

  const columns = [
    {
      title: 'Guest Name',
      dataIndex: 'guestId',
      key: 'guestId',
      render: (text: string) => (
        <span className="font-bold text-blue-600">
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
              setSelectedInvoice(record);
              setIsDrawerOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      {/* --- 1. Header & Quick Stats --- */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#0F2942]">Billing & Payments</h2>
          <p className="text-sm text-gray-400">
            Generate invoices and track hotel revenue
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Select Month
            </span>
            <DatePicker
              picker="month"
              value={selectedDate}
              onChange={(date: any) => date && setSelectedDate(date)}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-2">
            <p className="text-[10px] font-bold uppercase text-blue-600">
              Monthly Revenue ({selectedDate.format('MMM YYYY')})
            </p>
            <p className="text-xl font-bold text-blue-900">
              {isIncomeLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `LKR ${incomeData?.data?.monthlyIncome?.toLocaleString() || '0'}`
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-2">
            <p className="text-[10px] font-bold uppercase text-blue-600">
              Total Revenue (Lifetime)
            </p>
            <p className="text-xl font-bold text-blue-900">
              {isIncomeLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `LKR ${incomeData?.data?.totalAllTimeIncome?.toLocaleString() || '0'}`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* --- 3. Main Data Table --- */}
      <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <Table
          dataSource={
            reservationsData?.data?.content?.filter(
              (r: Reservation) => r.status === 'COMPLETED',
            ) || []
          }
          columns={columns}
          pagination={{ pageSize: 8 }}
          className="custom-table"
        />
      </div>

      {/* --- 4. Side Drawer (Invoice Preview & Payment) --- */}
      <Drawer
        title={<span className="text-xl font-bold">Invoice Details</span>}
        placement="right"
        width={700}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        extra={
          <Space>
            <Button icon={<Printer size={16} />} onClick={handlePrint}>
              Print
            </Button>
            <Button
              type="primary"
              icon={<Download size={16} />}
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 rounded-lg"
            >
              Download PDF
            </Button>
          </Space>
        }
        className="custom-drawer rounded-l-[2rem]"
      >
        {selectedInvoice && (
          <Invoice
            reservation={selectedInvoice}
            users={usersData?.data || []}
            rooms={rooms?.data || []}
            roomTypes={roomTypes?.data || []}
            mealPlans={mealPlans?.data || []}
            foodItems={foodItems?.data || []}
          />
        )}
      </Drawer>
    </div>
  );
};

export default BillingAndPayments;
