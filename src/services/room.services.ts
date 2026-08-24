import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { RoomType } from '../types/rooms';
import type { Room, ServiceRequestArgs } from '../types/services.interfaces';

const handleRequest = async ({
  url,
  data,
  method = 'post',
}: ServiceRequestArgs): Promise<APIResponse> => {
  try {
    const response = (await (method === 'get'
      ? axiosInstance.get(url, { params: data })
      : axiosInstance[method](url, data))) as any;

    return response as APIResponse;
  } catch (error: any) {
    return error as APIResponse;
  }
};

const roomService = () => {
  return {
    getAllRooms: () => handleRequest({ url: 'api/v1/rooms/all', method: 'get' }),

    getRoomById: (id: string) =>
      handleRequest({ url: `api/v1/rooms/${id}`, method: 'get' }),

    createRoom: (data: Room) =>
      handleRequest({ url: 'api/v1/rooms/add', data, method: 'post' }),

    updateRoom: (data: Partial<Room>) =>
      handleRequest({ url: `api/v1/rooms/update`, data, method: 'put' }),

    deleteRoom: (id: string) =>
      handleRequest({ url: `api/v1/rooms/delete/${id}`, method: 'delete' }),

    getAllRoomTypesService: () =>
      handleRequest({ url: 'api/v1/room-types/all', method: 'get' }),

    createRoomType: (data: RoomType) =>
      handleRequest({ url: 'api/v1/room-types/add', data, method: 'post' }),

    deleteRoomType: (id: string) =>
      handleRequest({ url: `api/v1/room-types/delete/${id}`, method: 'delete' }),
  };
};

export default roomService;
