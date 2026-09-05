import { Divider } from 'antd';
import { CheckCircle2, Building } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type {
  Reservation,
  Room,
  FoodItem,
  MealPlan,
} from '../../../types/services.interfaces';
import type { RoomType } from '../../../types/rooms';
import dayjs from 'dayjs';

interface InvoiceProps {
  reservation: Reservation;
  users: any[];
  rooms: Room[];
  roomTypes: RoomType[];
  mealPlans: MealPlan[];
  foodItems: FoodItem[];
}

export const Invoice = ({
  reservation,
  users,
  rooms,
  roomTypes,
  mealPlans,
  foodItems,
}: InvoiceProps) => {
  const guest = users?.find((u) => u.guestId === reservation.guestId);
  const room = rooms?.find((r) => r.roomId === reservation.roomId);
  const roomType = roomTypes?.find((t) => t.typeId === room?.typeId);
  const mealPlan = mealPlans?.find((m) => m.planId === reservation.planId);

  const nights =
    dayjs(reservation.checkOut).diff(dayjs(reservation.checkIn), 'days') || 1;
  const roomTotal = (roomType?.pricePerNight || 0) * nights;
  const mealTotal = (mealPlan?.price || 0) * (reservation.guestCount || 1) * nights;

  const foodItemsTotal =
    reservation.reservationDetails?.reduce((sum: number, detail: any) => {
      const item = foodItems?.find((f) => f.itemId === detail.itemId);
      return sum + (item?.unitPrice || 0) * (detail.orderedQty || 0);
    }, 0) || 0;

  const totalAmount = roomTotal + mealTotal + foodItemsTotal;

  return (
    <div
      id="invoice-content"
      className="custom-scrollbar rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm print:border-none print:p-0 print:shadow-none"
    >
      <div className="mb-8 flex items-start justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#092968] to-[#1a4499] text-white shadow-md">
            <Building size={28} />
          </div>
          <div>
            <h3 className="font-spaceGrotesk text-3xl font-black text-[#092968] uppercase tracking-tight">
              DSD RESORT
            </h3>
            <p className="text-[10px] font-bold tracking-widest text-[#F26E22] uppercase mt-1">
              Hotel & Spa Reservations
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Galle Road, Southern Province, Sri Lanka
            </p>
            <p className="text-[10px] text-gray-400">Tel: +94 91 223 4567 | info@dsdresort.com</p>
          </div>
        </div>
        <div className="text-right">
          <h4 className="text-xl font-bold uppercase tracking-tighter text-[#092968]">Invoice</h4>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            No: {reservation.resId?.split('-')[0].toUpperCase()}
          </p>
          <p className="text-xs text-gray-500">Date: {dayjs().format('DD MMM YYYY')}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase text-gray-400">Bill To:</p>
          <p className="text-lg font-bold text-gray-800">{guest?.name || 'Guest'}</p>
          <p className="text-xs text-gray-500">{guest?.email}</p>
          <p className="text-xs text-gray-500">{guest?.phone}</p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[10px] font-bold uppercase text-gray-400">
            Reservation Info:
          </p>
          <p className="text-xs font-semibold text-gray-700">
            Check-in: {reservation.checkIn}
          </p>
          <p className="text-xs font-semibold text-gray-700">
            Check-out: {reservation.checkOut}
          </p>
          <p className="text-xs font-semibold text-gray-700">Nights: {nights}</p>
          <p className="text-xs font-semibold text-gray-700">
            Guests: {reservation.guestCount}
          </p>
        </div>
      </div>

      <table className="mb-8 w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="rounded-l-xl p-3 font-medium">Description</th>
            <th className="p-3 text-right font-medium">Qty/Nights</th>
            <th className="rounded-r-xl p-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {/* Room Charge */}
          <tr className="border-b border-gray-50">
            <td className="p-3">
              <p className="font-bold text-gray-800">{roomType?.typeName || 'Room'}</p>
              <p className="text-[10px] text-gray-400">Room No: {room?.roomNumber}</p>
            </td>
            <td className="p-3 text-right">{nights} Nights</td>
            <td className="p-3 text-right">LKR {roomTotal.toLocaleString()}</td>
          </tr>

          {/* Meal Plan */}
          <tr className="border-b border-gray-50">
            <td className="p-3">
              <p className="font-bold text-gray-800">{mealPlan?.name || 'Meal Plan'}</p>
              <p className="text-[10px] text-gray-400">{mealPlan?.planCode}</p>
            </td>
            <td className="p-3 text-right">{reservation.guestCount} Guests</td>
            <td className="p-3 text-right">LKR {mealTotal.toLocaleString()}</td>
          </tr>

          {/* Additional Food Items */}
          {reservation.reservationDetails?.map((detail: any) => {
            const item = foodItems?.find((f) => f.itemId === detail.itemId);
            if (!item) return null;
            return (
              <tr key={detail.detailId} className="border-b border-gray-50">
                <td className="p-3">
                  <p className="font-bold text-gray-800">{item.name}</p>
                  <p className="text-[10px] text-gray-400">
                    Unit: LKR {item.unitPrice?.toLocaleString()}
                  </p>
                </td>
                <td className="p-3 text-right">{detail.orderedQty}</td>
                <td className="p-3 text-right">
                  LKR{' '}
                  {((item.unitPrice || 0) * (detail.orderedQty || 0)).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span>LKR {totalAmount.toLocaleString()}</span>
          </div>
          <Divider className="my-2" />
          <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4">
            <span className="font-bold text-blue-900">Total Payable</span>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase text-blue-400">
                Amount Due
              </span>
              <span className="font-['Outfit'] text-2xl font-black text-blue-600">
                LKR {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-between items-end border-t border-gray-100 pt-6">
        <div className="flex flex-col items-start gap-1.5">
          <p className="text-[11px] font-bold text-[#092968] uppercase">Scan to Leave a Review!</p>
          <div className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <QRCodeSVG 
              value={`${window.location.origin}/feedback?reservationId=${reservation.resId}`} 
              size={64} 
              level="M" 
            />
          </div>
          <p className="text-[9px] text-gray-500 max-w-[180px] leading-tight">
            We value your feedback to improve our service.
          </p>
        </div>
        
        <div className="flex flex-col text-right text-[10px] italic text-gray-400 gap-1.5">
          <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold not-italic text-xs">
            <CheckCircle2 size={14} />
            <span>Thank You For Staying With Us!</span>
          </div>
          <p>
            This is a computer-generated invoice for {reservation.resId} and requires no signature.
          </p>
          <p>
            Generated on {dayjs().format('MMMM D, YYYY h:mm A')}
          </p>
          <p className="text-[10px] text-gray-400">Powered by DSD Resort Management System</p>
        </div>
      </div>
    </div>
  );
};
