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

const paymentService = () => {
  return {
    getCompletedReservations: () =>
      handleRequest({ url: 'api/v1/payments/completed-reservations', method: 'get' }),

    getBillById: (id: string) =>
      handleRequest({ url: `api/v1/payments/bills/${id}`, method: 'get' }),

    printBill: (id: string) =>
      handleRequest({ url: `api/v1/payments/bills/${id}/print`, method: 'get' }),

    downloadBill: (id: string) =>
      handleRequest({ url: `api/v1/payments/bills/${id}/download`, method: 'get' }),

    getTotalIncomeByDate: (date: string) =>
      handleRequest({
        url: `api/v1/payments/reports/income`,
        data: { date },
        method: 'get',
      }),
  };
};

export default paymentService;
