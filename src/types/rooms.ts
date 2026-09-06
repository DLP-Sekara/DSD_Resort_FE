import type { Key } from "react";

export interface RoomType {
  typeId?: Key | null | undefined;
  id?: string;
  typeName: string;
  pricePerNight: number;
  maxOccupancy: number;
}
