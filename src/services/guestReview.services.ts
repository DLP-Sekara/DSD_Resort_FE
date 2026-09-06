import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { ServiceRequestArgs } from '../types/services.interfaces';
import type { GuestReviewDTO } from '../types/guestReview.interfaces';

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

const guestReviewService = () => {
  return {
    addGuestReview: (data: GuestReviewDTO) =>
      handleRequest({ url: 'api/v1/guest-reviews/add', data, method: 'post' }),
    getAllGuestReviews: () =>
      handleRequest({ url: 'api/v1/guest-reviews/all', method: 'get' }),
    deleteGuestReview: (id: string) =>
      handleRequest({ url: `api/v1/guest-reviews/delete/${id}`, method: 'delete' }),
  };
};

export default guestReviewService;
