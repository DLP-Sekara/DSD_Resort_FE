import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { ServiceRequestArgs } from '../types/services.interfaces';
import type { CreateRestaurantOrderDTO } from '../types/restaurantOrder.interfaces';

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

const restaurantOrderService = () => {
  return {
    createRestaurantOrder: (data: CreateRestaurantOrderDTO) =>
      handleRequest({
        url: 'api/v1/restaurant-orders/create',
        data,
        method: 'post',
      }),

    getRestaurantOrderById: (orderId: string) =>
      handleRequest({
        url: `api/v1/restaurant-orders/${orderId}`,
        method: 'get',
      }),

    getAllRestaurantOrders: (data?: any) =>
      handleRequest({
        url: 'api/v1/restaurant-orders/all',
        data,
        method: 'get',
      }),

    updateRestaurantOrderStatus: ({ orderId, status }: { orderId: string; status: string }) =>
      handleRequest({
        url: `api/v1/restaurant-orders/update-status/${orderId}?status=${encodeURIComponent(status)}`,
        method: 'put',
      }),

    deleteRestaurantOrder: (orderId: string) =>
      handleRequest({
        url: `api/v1/restaurant-orders/delete/${orderId}`,
        method: 'delete',
      }),
  };
};

export default restaurantOrderService;
