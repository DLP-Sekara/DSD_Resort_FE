import { axiosInstance } from '../config/axiosService';
import type { APIResponse, ChangePasswordTypes } from '../types/onBoarding.interfaces';
import type { UserAccount, ServiceRequestArgs } from '../types/services.interfaces';

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

const settingService = () => {
  return {
    addNewAdmin: (data: UserAccount) =>
      handleRequest({ url: 'api/v1/auth/signup', data, method: 'post' }),

    changePassword: (data: ChangePasswordTypes) =>
      handleRequest({ url: 'api/v1/auth/change-password', data, method: 'post' }),

    getCurrentSessions: () =>
      handleRequest({ url: 'api/v1/settings/sessions', method: 'get' }),

    getAllSystemUsers: () =>
      handleRequest({ url: 'api/v1/auth/all-users', method: 'get' }),
  };
};

export default settingService;
