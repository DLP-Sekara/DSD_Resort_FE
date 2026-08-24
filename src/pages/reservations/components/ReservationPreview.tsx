import { Badge, Card, Col, Divider, Row, Tag } from 'antd';
import { CalendarCheck, Receipt, UserPlus } from 'lucide-react';
import type { Reservation } from '../../../types/services.interfaces';
import reservationMutation from '../../../mutations/reservation.mutation';
import userMutation from '../../../mutations/user.mutation';
import roomMutation from '../../../mutations/room.mutation';
import mealMutation from '../../../mutations/meal.mutation';
import dayjs from 'dayjs';

export const ReservationPreview = ({ id }: { id: string }) => {
  const { getReservationByIdQuery } = reservationMutation();
  const { data: resResponse, isLoading } = getReservationByIdQuery(id);
  const { getAllUsersMutation } = userMutation();
  const { getAllRoomsMutation, getAllRoomTypesMutation } = roomMutation();
  const { getAllMealPlansMutation, getAllFoodItemsMutation } = mealMutation();

  const { data: usersData } = getAllUsersMutation();
  const { data: roomsData } = getAllRoomsMutation();
  const { data: mealsData } = getAllMealPlansMutation();
  const { data: roomTypes } = getAllRoomTypesMutation();
  const { data: foodItems } = getAllFoodItemsMutation();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const reservation = resResponse?.data as Reservation;
  if (!reservation) return <p className="text-center text-gray-400">No data found</p>;

  const guest = usersData?.data?.find((u: any) => u.guestId === reservation.guestId);
  const room = roomsData?.data?.find((r: any) => r.roomId === reservation.roomId);
  const roomType = roomTypes?.data?.find((r: any) => r.typeId === room.typeId);
  const mealPlan = mealsData?.data?.find((m: any) => m.planId === reservation.planId);

  const nights = dayjs(reservation.checkOut).diff(dayjs(reservation.checkIn), 'day') || 1;
  const roomCost = (roomType?.pricePerNight || 0) * nights;
  const mealCost = (mealPlan?.price || 0) * (reservation.guestCount || 1) * nights;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      {/* Guest Card */}
      <Card className="rounded-[2rem] border-none bg-blue-50/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <UserPlus size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {guest?.name || 'Unknown Guest'}
            </h3>
          </div>
        </div>
        <Divider className="my-4" />
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Phone
            </p>
            <p className="font-semibold">{guest?.phone || 'N/A'}</p>
          </Col>
          <Col span={12}>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              NIC
            </p>
            <p className="font-semibold text-blue-600">{guest?.nic || 'N/A'}</p>
          </Col>
        </Row>
      </Card>

      {/* Stay Details */}
      <div className="space-y-2 px-2">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#0F2942]">
          <CalendarCheck size={18} className="text-blue-500" /> Stay Information
        </h3>
        <Row gutter={[16, 24]}>
          <Col span={12}>
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="mb-1 text-xs font-bold uppercase text-gray-400">
                Room Number
              </p>
              <p className="text-lg font-black text-blue-600">
                {room?.roomNumber || 'Room ' + reservation.roomNo}
              </p>
            </div>
          </Col>
          <Col span={12}>
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="mb-1 text-xs font-bold uppercase text-gray-400">Room Type</p>
              <div className="flex flex-col">
                <p className="font-bold text-gray-700">{roomType?.typeName}</p>
                <p className="text-xs font-semibold text-blue-500">
                  Rs. {roomType?.pricePerNight?.toLocaleString()} / night
                </p>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="mb-1 text-xs font-bold uppercase text-gray-400">Check-In</p>
              <p className="font-bold text-gray-700">{reservation.checkIn}</p>
            </div>
          </Col>
          <Col span={12}>
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="mb-1 text-xs font-bold uppercase text-gray-400">Check-Out</p>
              <p className="font-bold text-gray-700">{reservation.checkOut}</p>
            </div>
          </Col>
        </Row>
      </div>

      {/* Billing & Plans */}
      <div className="space-y-4 px-2">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#0F2942]">
          <Receipt size={18} className="text-blue-500" /> Billing Summary
        </h3>
        <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-[#0F2942] to-[#1a4b7c] shadow-xl">
          <div className="space-y-4 p-2 text-white">
            {/* Room Cost */}
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="text-xs font-bold uppercase text-blue-300/60">Room Stay</p>
                <p className="font-bold">
                  {roomType?.typeName} ({nights} nights)
                </p>
              </div>
              <p className="font-bold text-blue-100">Rs. {roomCost.toLocaleString()}</p>
            </div>

            {/* Meal Plan */}
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="text-xs font-bold uppercase text-blue-300/60">Meal Plan</p>
                <p className="font-bold">{mealPlan?.name}</p>
                <p className="text-[10px] text-blue-200/50">
                  {reservation.guestCount} Guests x {nights} nights
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-100">Rs. {mealCost.toLocaleString()}</p>
                <Tag color="blue" className="mr-0 mt-1 rounded-lg">
                  {mealPlan?.planCode}
                </Tag>
              </div>
            </div>

            {reservation?.reservationDetails?.length > 0 && (
              <div className="mt-4 px-2">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300/60">
                  Additional Food Items
                </p>
                <div className="space-y-2">
                  {reservation.reservationDetails.map((detail: any, index: any) => {
                    const itemInfo = foodItems?.data?.find(
                      (f: any) => f.itemId === detail.itemId,
                    );

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10 text-xs font-bold text-blue-300">
                            {detail.orderedQty}x
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {itemInfo?.name || 'Unknown Item'}
                            </p>
                            <p className="text-[10px] text-blue-200/50">
                              Unit Price: Rs.{' '}
                              {itemInfo?.unitPrice?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-100">
                            Rs.{' '}
                            {(
                              detail.orderedQty * (itemInfo?.unitPrice || 0)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Divider className="my-2 border-white/10" />

            <div className="flex items-center justify-between px-2">
              <span className="font-medium text-blue-100">Total Amount</span>
              <span className="text-3xl font-black tracking-tighter">
                Rs.{' '}
                {(
                  reservation.totalAmount ||
                  reservation.totalBill ||
                  roomCost + mealCost + (reservation.additionalFoodCost || 0)
                ).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3">
              <Badge
                status={reservation?.status === 'COMPLETED' ? 'success' : 'processing'}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Payment Status: {reservation?.status}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
