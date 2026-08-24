import type {
  APIResponse,
  LoginTypes,
  ResetPasswordTypes,
} from '../types/onBoarding.interfaces';
import { axiosInstance } from '../config/axiosService';

type args = {
  url: string;
  data?: any;
  method?: 'get' | 'post' | 'put' | 'delete';
};

const handleRequest = async ({
  url,
  data,
  method = 'post',
}: args): Promise<APIResponse> => {
  try {
    const response = (await (method === 'get'
      ? axiosInstance.get(url, { params: data })
      : axiosInstance[method](url, data))) as any;

    return response as APIResponse;
  } catch (error: any) {
    return error as APIResponse;
  }
};

const authService = () => {
  return {
    signInService: (data: LoginTypes) =>
      handleRequest({ url: 'api/v1/auth/login', data }),

    signUpService: (data: any) => handleRequest({ url: 'api/v1/admin/signup', data }),

    forgotPasswordService: (data: ResetPasswordTypes) =>
      handleRequest({ url: 'api/v1/admin/forgot-password', data }),

    signOutService: () => handleRequest({ url: 'api/v1/auth/logout' }),

    heckUserSessionService: () => handleRequest({ url: 'api/v1/auth/check-session' }),
  };
};

export default authService;
