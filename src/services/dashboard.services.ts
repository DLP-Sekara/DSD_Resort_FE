import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { ServiceRequestArgs } from '../types/services.interfaces';

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

const dashboardService = () => {
  return {
    getDashboardDetails: () =>
      handleRequest({ url: 'api/v1/dashboard/details', method: 'get' }),

    getNotifications: () =>
      handleRequest({ url: 'api/v1/dashboard/notifications', method: 'get' }),

    markNotificationAsRead: (id: string) =>
      handleRequest({ url: `api/v1/dashboard/notifications/${id}/read`, method: 'put' }),
  };
};

export default dashboardService;
