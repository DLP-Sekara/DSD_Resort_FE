import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type {
  Reservation,
  AvailabilityCheck,
  ServiceRequestArgs,
} from '../types/services.interfaces';

/**
 * Common request handler to manage axios calls and error boundaries
 */
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

const reservationService = () => {
  return {
    getAllReservations: (data:any) =>
      handleRequest({ url: 'api/v1/reservations/all',data, method: 'get' }),

    getReservationById: (id: string) =>
      handleRequest({ url: `api/v1/reservations/${id}`, method: 'get' }),

    createReservation: (data: Reservation) =>
      handleRequest({ url: 'api/v1/reservations/create', data, method: 'post' }),

    deleteReservation: (id: string) =>
      handleRequest({ url: `api/v1/reservations/delete/${id}`, method: 'delete' }),

    getAvailableRooms: (data: AvailabilityCheck) =>
      handleRequest({
        url: 'api/v1/reservations/available-rooms',
        data,
        method: 'get',
      }),

    checkOutGuest: (resId: string) =>
      handleRequest({
        url: `api/v1/reservations/checkout/${resId}`,
        method: 'put',
      }),

    getAllIncomesByMonth: (data: any) =>
      handleRequest({ url: 'api/v1/reservations/income-stats', data, method: 'get' }),
  };
};

export default reservationService;
