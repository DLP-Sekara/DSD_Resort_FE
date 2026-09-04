import { Badge, Card, Col, Divider, Row, Tag, Button } from 'antd';
import { CalendarCheck, Receipt, UserPlus, Printer, Download } from 'lucide-react';
import type { Reservation } from '../../../types/services.interfaces';
import reservationMutation from '../../../mutations/reservation.mutation';
import userMutation from '../../../mutations/user.mutation';
import roomMutation from '../../../mutations/room.mutation';
import mealMutation from '../../../mutations/meal.mutation';
import dayjs from 'dayjs';
import { useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';

export const ReservationPreview = ({ id, autoPrint, autoDownload }: { id: string, autoPrint?: boolean, autoDownload?: boolean }) => {
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

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Reservation_Invoice_${id}`,
  });

  const handleDownload = () => {
    if (componentRef.current) {
      const opt:any = {
        margin: 0.5,
        filename: `Reservation_Invoice_${id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().from(componentRef.current).set(opt).save();
    }
  };

  useEffect(() => {
    if (autoPrint && !isLoading && resResponse?.data) {
      setTimeout(() => {
        handlePrint();
      }, 500); // slight delay to ensure UI mounts before print
    }
    if (autoDownload && !isLoading && resResponse?.data) {
      setTimeout(() => {
        handleDownload();
      }, 500);
    }
  }, [autoPrint, autoDownload, isLoading, resResponse, handlePrint]);

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
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500">
      {/* Top Actions */}
      <div className="flex justify-end pr-2 gap-3">
        <Button 
          type="primary" 
          icon={<Printer size={16} />} 
          onClick={handlePrint}
          className="bg-[#0F2942] hover:bg-[#1a4b7c] border-none rounded-xl h-10 px-6 font-bold shadow-md"
        >
          Print
        </Button>
        <Button 
          type="default" 
          icon={<Download size={16} />} 
          onClick={handleDownload}
          className="border-[#0F2942] text-[#0F2942] hover:bg-[#0F2942] hover:text-white rounded-xl h-10 px-6 font-bold shadow-sm transition-all"
        >
          Download PDF
        </Button>
      </div>

      {/* Printable Area */}
      <div ref={componentRef} className="space-y-8 p-6 bg-white rounded-3xl print:p-8">
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

      {/* QR Code Section */}
      <div className="mt-8 flex flex-col items-center justify-center pt-8 border-t border-dashed border-gray-200 print:mt-12">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
          Scan to Provide Feedback
        </p>
        <div className="p-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <QRCodeSVG 
            value={`${window.location.origin}/public-feedback?resId=${id}`} 
            size={120} 
            level="H" 
            includeMargin 
          />
        </div>
        <p className="text-xs text-gray-400 mt-3 max-w-[250px] text-center font-semibold">
          We value your experience! Scan this QR code to rate your stay.
        </p>
      </div>

      </div>
    </div>
  );
};
