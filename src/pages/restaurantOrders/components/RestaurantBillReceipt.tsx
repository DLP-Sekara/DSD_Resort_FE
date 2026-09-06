import React from 'react';
import { Tag, Divider } from 'antd';
import { UtensilsCrossed, Calendar, User, Phone, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import { QRCodeSVG } from 'qrcode.react';

export interface BillItem {
  itemId: string;
  name: string;
  unitPrice: number;
  orderedQty: number;
  subtotal?: number;
}

export interface RestaurantBillReceiptProps {
  id?: string;
  orderId?: string;
  orderTime?: string;
  status?: string;
  guestName?: string;
  guestPhone?: string;
  guestNic?: string;
  handledByName?: string;
  handledByRole?: string;
  items: BillItem[];
  totalAmount: number;
  isConfirmationPreview?: boolean;
}

export const RestaurantBillReceipt: React.FC<RestaurantBillReceiptProps> = ({
  id = 'restaurant-bill-receipt',
  orderId,
  orderTime,
  status = 'PENDING',
  guestName = 'Walk-in Guest',
  guestPhone,
  guestNic,
  handledByName = 'Staff Member',
  handledByRole = 'Staff',
  items = [],
  totalAmount = 0,
  isConfirmationPreview = false,
}) => {
  const formattedOrderId = orderId ? `#${String(orderId).slice(-6).toUpperCase()}` : 'PENDING PLACEMENT';
  const displayDate = orderTime ? dayjs(orderTime).format('DD MMM YYYY, hh:mm A') : dayjs().format('DD MMM YYYY, hh:mm A');

  return (
    <div
      id={id}
      className="receipt-container rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-gray-800 font-sans print:border-none print:shadow-none print:p-2"
      style={{ minWidth: '100%', boxSizing: 'border-box' }}
    >
      {/* Header Section */}
      <div className="text-center pb-4 border-b border-dashed border-gray-300">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#092968] to-[#1a4499] text-white shadow-md mb-2">
          <UtensilsCrossed size={22} />
        </div>
        <h2 className="text-lg font-black tracking-tight text-[#092968] uppercase font-spaceGrotesk">
          DSD Resort
        </h2>
        <p className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase">
          Restaurant & Fine Dining
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Galle Road, Southern Province, Sri Lanka
        </p>
        <p className="text-[10px] text-gray-400">Tel: +94 91 223 4567 | info@dsdresort.com</p>
      </div>

      {/* Bill Meta Details */}
      <div className="py-3 border-b border-dashed border-gray-200 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-500">Order No:</span>
          <span className="font-mono font-bold text-[#092968] text-sm">
            {formattedOrderId}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-500">Date & Time:</span>
          <span className="font-medium text-gray-700 flex items-center gap-1">
            <Calendar size={12} className="text-gray-400" />
            {displayDate}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-500">Order Status:</span>
          {isConfirmationPreview ? (
            <Tag color="orange" className="rounded-md font-bold text-[10px] m-0">
              CONFIRMATION PREVIEW
            </Tag>
          ) : (
            <Tag
              color={
                status === 'COMPLETED'
                  ? 'success'
                  : status === 'SERVED'
                  ? 'cyan'
                  : status === 'PREPARING'
                  ? 'processing'
                  : status === 'CANCELLED'
                  ? 'error'
                  : 'warning'
              }
              className="rounded-md font-bold text-[10px] m-0"
            >
              {status?.toUpperCase()}
            </Tag>
          )}
        </div>
      </div>

      {/* Customer & Server Info */}
      <div className="py-3 border-b border-dashed border-gray-200 text-xs space-y-1.5 bg-gray-50/60 rounded-xl p-3 my-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-500 flex items-center gap-1">
            <User size={12} className="text-[#092968]" /> Guest:
          </span>
          <span className="font-bold text-[#092968]">{guestName}</span>
        </div>

        {guestPhone && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-500 flex items-center gap-1">
              <Phone size={12} className="text-gray-400" /> Contact:
            </span>
            <span className="font-medium text-gray-700">{guestPhone}</span>
          </div>
        )}

        {guestNic && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-500">NIC / ID:</span>
            <span className="font-medium text-gray-700">{guestNic}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-gray-200">
          <span className="font-semibold text-gray-500">Server / Staff:</span>
          <span className="font-medium text-gray-700">
            {handledByName} {handledByRole ? `(${handledByRole})` : ''}
          </span>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="py-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-300 text-gray-500 uppercase text-[10px] font-bold">
              <th className="py-1.5 font-bold">Item</th>
              <th className="py-1.5 text-center font-bold">Qty</th>
              <th className="py-1.5 text-right font-bold">Price</th>
              <th className="py-1.5 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400 text-xs italic">
                  No food items added to order
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const subtotal = item.subtotal ?? item.unitPrice * item.orderedQty;
                return (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2 pr-2 font-semibold text-[#0B1B3D]">
                      {item.name}
                    </td>
                    <td className="py-2 text-center font-bold text-gray-700">
                      {item.orderedQty}
                    </td>
                    <td className="py-2 text-right text-gray-500">
                      {Number(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 text-right font-bold text-[#092968]">
                      {Number(subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Total Calculations */}
      <div className="mt-3 border-t-2 border-dashed border-gray-300 pt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-gray-600">
          <span>Subtotal ({items.reduce((s, i) => s + (i.orderedQty || 1), 0)} items):</span>
          <span className="font-semibold">
            LKR {Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between text-gray-600">
          <span>Service Charge & Taxes (Included):</span>
          <span className="font-semibold">LKR 0.00</span>
        </div>

        <Divider className="!my-2" />

        <div className="flex items-center justify-between text-base font-black text-[#092968] bg-blue-50/70 p-2.5 rounded-xl">
          <span className="uppercase tracking-wider text-xs font-bold text-[#092968]">
            Grand Total Amount:
          </span>
          <span className="text-lg text-[#092968]">
            LKR {Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* QR Code for Guest Review */}
      {!isConfirmationPreview && orderId && (
        <div className="mt-4 flex flex-col items-center justify-center gap-1.5 border-t border-dashed border-gray-300 pt-4 text-center">
          <p className="text-[11px] font-bold text-[#092968] uppercase">Scan to Leave a Review!</p>
          <div className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <QRCodeSVG 
              value={`${window.location.origin}/feedback?orderId=${orderId}`} 
              size={64} 
              level="M" 
            />
          </div>
          <p className="text-[9px] text-gray-500 max-w-[180px] leading-tight mt-0.5">We value your feedback to improve our service.</p>
        </div>
      )}

      {/* Footer Notes */}
      <div className="mt-5 text-center border-t border-dashed border-gray-300 pt-4 pb-12 text-[11px] text-gray-400 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-xs mb-1">
          <CheckCircle2 size={14} />
          <span>Thank You For Dining With Us!</span>
        </div>
        <p>Please retain this receipt for your reference.</p>
        <p className="text-[10px] text-gray-400">Powered by DSD Resort Management System</p>
      </div>
    </div>
  );
};

export default RestaurantBillReceipt;
