import { Col, Row, Tag, Button } from 'antd';
import { UserPlus, BedDouble, LogOut, ChevronRight, UtensilsCrossed, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import roomMutation from '../../mutations/room.mutation';
import reservationMutation from '../../mutations/reservation.mutation';
import userMutation from '../../mutations/user.mutation';
import restaurantOrderMutation from '../../mutations/restaurantOrder.mutation';
import dayjs from 'dayjs';

const MainDashboard = () => {
  //------------------------------------------------ mutations -----------------------------------------------
  const { getAllRoomTypesMutation, getAllRoomsMutation } = roomMutation();
  const { getAllReservationsQuery } = reservationMutation();
  const { getAllUsersMutation } = userMutation();
  const { getAllRestaurantOrdersQuery } = restaurantOrderMutation();
  const reservationFilters = {
    page: 0,
    size: 1000,
  };

  const { data: rooms } = getAllRoomsMutation();
  const { data: roomTypes } = getAllRoomTypesMutation();
  const { data: reservationsData } = getAllReservationsQuery(reservationFilters);
  const { data: usersData } = getAllUsersMutation();
  const { data: restaurantOrdersData } = getAllRestaurantOrdersQuery();

  const stats = [
    {
      title: "Today's Guests",
      value: usersData?.data?.length || 0,
      sub: 'Guests checked in',
      icon: <UserPlus className="text-white" />,
      color: 'bg-[#2CB1BC]',
    },
    {
      title: 'Occupied Rooms',
      value:
        (rooms?.data?.filter((room: any) => room.status === 'OCCUPIED').length || 0) +
        '/' +
        (rooms?.data?.length || 0),
      sub: 'Rooms currently occupied',
      icon: <BedDouble className="text-white" />,
      color: 'bg-[#91C788]',
    },
    {
      title: 'Pending Checkouts',
      value: reservationsData?.data?.content?.filter(
        (res: any) =>
          res.checkOut === dayjs().format('YYYY-MM-DD') && res.status === 'PENDING',
      ).length || 0,
      sub: "Today's ready for checkout",
      icon: <LogOut className="text-white" />,
      color: 'bg-[#F38181]',
    },
  ];

  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      {/* 1. Modern Stats Cards */}
      <Row gutter={[24, 24]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <div
              className={`${stat.color} group relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-gray-200`}
            >
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium opacity-90">{stat.title}</span>
                  </div>
                  <h2 className="mb-1 text-4xl font-bold">{stat.value}</h2>
                  <p className="text-[12px] opacity-80">{stat.sub}</p>
                </div>
                <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm transition-transform group-hover:scale-110">
                  {stat.icon}
                </div>
              </div>
              {/* Decorative Circle */}
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
            </div>
          </Col>
        ))}
      </Row>

      {/* 2. Quick Navigations & Recent Activity */}
      <Row gutter={[24, 24]}>
        {/* Recent Reservations */}
        <Col xs={24} lg={12}>
          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-md h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0F2942]">Recent Reservations</h3>
                <p className="text-sm text-gray-500">Latest guest bookings</p>
              </div>
              <Button
                type="primary"
                className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md px-3"
                onClick={() => navigate('/dashboard/reservations')}
              >
                View <ChevronRight size={16} />
              </Button>
            </div>
            <div className="space-y-4 flex-1">
              {reservationsData?.data?.content?.slice(0, 4).map((res: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-gray-50 bg-[#F8FAFC] p-4 transition-all hover:bg-white hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold shrink-0">
                       <CalendarCheck size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-[#0B1B3D]">Room {rooms?.data?.find((r: any) => r.roomId === res.roomId)?.roomNumber || 'N/A'}</p>
                      <p className="text-[11px] text-gray-500 font-medium">{res.checkIn} to {res.checkOut}</p>
                    </div>
                  </div>
                  <Tag color={res.status === 'CONFIRMED' ? 'green' : res.status === 'PENDING' ? 'gold' : res.status === 'COMPLETED' ? 'blue' : 'red'} className="rounded-full px-2 py-0.5 font-bold text-[10px] ml-2 shrink-0">
                    {res.status}
                  </Tag>
                </div>
              ))}
              {(!reservationsData?.data?.content || reservationsData.data.content.length === 0) && (
                <div className="flex h-full items-center justify-center pb-4">
                  <p className="text-center text-gray-400 font-medium">No recent reservations found.</p>
                </div>
              )}
            </div>
          </div>
        </Col>

        {/* Recent Restaurant Orders */}
        <Col xs={24} lg={12}>
          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-md h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0F2942]">Restaurant Orders</h3>
                <p className="text-sm text-gray-500">Active kitchen requests</p>
              </div>
              <Button
                type="primary"
                className="flex items-center gap-1 rounded-xl bg-[#F26E22] hover:bg-[#D95C1A] border-none shadow-md px-3"
                onClick={() => navigate('/dashboard/restaurant-orders')}
              >
                View <ChevronRight size={16} />
              </Button>
            </div>
            <div className="space-y-4 flex-1">
              {restaurantOrdersData?.data?.slice(0, 4).map((order: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-gray-50 bg-[#F8FAFC] p-4 transition-all hover:bg-white hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F26E22] shrink-0">
                       <UtensilsCrossed size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-[#0B1B3D]">#{String(order.orderId || order.order_id || '').slice(-6).toUpperCase()}</p>
                      <p className="text-[11px] text-gray-500 font-medium">LKR {Number(order.totalAmount || order.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                  <Tag color={order.status === 'PENDING' ? 'warning' : order.status === 'PREPARING' ? 'processing' : order.status === 'SERVED' ? 'cyan' : 'success'} className="rounded-full px-2 py-0.5 font-bold text-[10px] ml-2 shrink-0">
                    {order.status || 'PENDING'}
                  </Tag>
                </div>
              ))}
              {(!restaurantOrdersData?.data || restaurantOrdersData.data.length === 0) && (
                <div className="flex h-full items-center justify-center pb-4">
                  <p className="text-center text-gray-400 font-medium">No recent orders found.</p>
                </div>
              )}
            </div>
          </div>
        </Col>

        {/* Public Feedback QR */}
        {/* <Col xs={24} lg={6}>
          <div className="rounded-[2rem] border border-gray-100 bg-gradient-to-br from-[#092968] to-indigo-800 p-6 shadow-md h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-1">Guest Feedback</h3>
              <p className="text-xs text-blue-200 mb-6 font-medium">Scan to share your experience</p>
              
              <div className="bg-white p-3 rounded-2xl shadow-xl transform transition-transform hover:scale-105">
                <QRCode
                  value={`${window.location.origin}/feedback`}
                  size={120}
                  color="#092968"
                  bordered={false}
                />
              </div>

              <Button
                type="default"
                ghost
                className="mt-6 border-white/30 text-white hover:!text-[#F26E22] hover:!border-[#F26E22] rounded-xl font-bold"
                onClick={() => window.open('/feedback', '_blank')}
              >
                Open Form <ChevronRight size={16} />
              </Button>
            </div>
            
            <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-2xl opacity-30"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-32 h-32 bg-orange-500 rounded-full mix-blend-screen filter blur-2xl opacity-20"></div>
          </div>
        </Col> */}
      </Row>

      {/* 3. Live Room Status Grid */}
      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#0F2942]">Live Room Status</h3>
            <p className="text-sm text-gray-500">Current occupancy & cleaning status</p>
          </div>
          <Button
            type="text"
            className="flex items-center gap-1 text-blue-500 hover:text-orange-500 font-bold"
            onClick={() => navigate('/dashboard/rooms')}
          >
            Show More <ChevronRight size={16} />
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          {rooms?.data?.map((room: any, i: number) => (
            <Col xs={12} sm={8} md={6} lg={4.8} key={i}>
              <div className="cursor-pointer rounded-2xl border border-gray-50 bg-[#F8FAFC] p-4 shadow-sm transition-all hover:bg-white hover:shadow-md">
                <div
                  className={`mb-3 flex h-10 w-full items-center justify-start rounded-xl ${i % 3 === 0 ? 'bg-blue-400' : i % 3 === 1 ? 'bg-teal-400' : 'bg-green-400 opacity-80'}`}
                >
                  <span className="ml-4 text-lg font-bold text-white shadow-sm">
                    {room.roomNumber}
                  </span>
                </div>
                <p className="mb-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                  {
                    roomTypes?.data?.find((type: any) => type.typeId === room.typeId)
                      ?.typeName || 'Unknown Type'
                  }
                </p>
                <Tag
                  color={
                    room.status === 'AVAILABLE'
                      ? 'green'
                      : room.status === 'CLEANING'
                        ? 'gold'
                        : room.status === 'OCCUPIED'
                          ? 'blue'
                          : 'red'
                  }
                  className="rounded-full px-3 py-0.5 font-bold shadow-sm"
                >
                  {room.status}
                </Tag>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default MainDashboard;
