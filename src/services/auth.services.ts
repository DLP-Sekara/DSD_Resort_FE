import type {
  APIResponse,
  LoginTypes,
  ResetPasswordTypes,
  SendOtpTypes,
  VerifyOtpTypes,
  ResetPasswordPayloadTypes,
  ChangePasswordTypes,
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

    sendForgotPasswordOtpService: (data: SendOtpTypes) =>
      handleRequest({ url: 'api/v1/auth/forgot-password/send-otp', data }),

    verifyForgotPasswordOtpService: (data: VerifyOtpTypes) =>
      handleRequest({ url: 'api/v1/auth/forgot-password/verify-otp', data }),

    resetPasswordService: (data: ResetPasswordPayloadTypes) =>
      handleRequest({ url: 'api/v1/auth/forgot-password/reset-password', data }),

    changePasswordService: (data: ChangePasswordTypes) =>
      handleRequest({ url: 'api/v1/auth/change-password', data }),

    signOutService: () => handleRequest({ url: 'api/v1/auth/logout' }),

    heckUserSessionService: () => handleRequest({ url: 'api/v1/auth/check-session' }),
  };
};

export default authService;
