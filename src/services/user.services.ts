import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
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

const userService = () => {
  return {
    getAllUsers: () => handleRequest({ url: 'api/v1/guests/all', method: 'get' }),

    updateUser: (data: Partial<UserAccount>) =>
      handleRequest({ url: `api/v1/guests/update`, data, method: 'put' }),

    deleteUser: (id: string) =>
      handleRequest({ url: `api/v1/guests/delete/${id}`, method: 'delete' }),

    getUserByNic: (nic: string) =>
      handleRequest({ url: `api/v1/guests/find-by-nic/${nic}`, method: 'get' }),

    createUser: (data: UserAccount) =>
      handleRequest({ url: 'api/v1/guests/add', data, method: 'post' }),
  };
};

export default userService;
