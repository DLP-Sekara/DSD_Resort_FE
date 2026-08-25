import { useMutation } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import type {
  APIResponse,
  LoginTypes,
  SendOtpTypes,
  VerifyOtpTypes,
  ResetPasswordPayloadTypes,
} from '../types/onBoarding.interfaces';
import authService from '../services/auth.services';
import { useNavigate } from 'react-router-dom';
import { setLocalStorageData } from '../helpers/StorageHelper';
import { useAuth } from '../hooks/useAuth';

const authMutation = () => {
  const {
    signInService,
    signOutService,
    heckUserSessionService,
    sendForgotPasswordOtpService,
    verifyForgotPasswordOtpService,
    resetPasswordService,
  } = authService();
  const navigate = useNavigate();
  const { setUserData } = useAuth();

  const signInMutation = () => {
    return useMutation({
      mutationFn: (data: LoginTypes) => signInService(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          setUserData(response.data);
          setLocalStorageData('userData', response.data);
        } else {
          errorToast(response.message);
        }
      },

      onError: (error: APIResponse) => {
        errorToast(error.message);
      },
    });
  };

  const signOutMutation = () => {
    return useMutation({
      mutationFn: () => signOutService(),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          navigate('/login', { replace: true });
          localStorage.removeItem('userData');
        } else {
          errorToast(response.message);
        }
      },

      onError: (error: APIResponse) => {
        errorToast(error.message);
      },
    });
  };

  const heckUserSessionMutation = () => {
    return useMutation({
      mutationFn: () => heckUserSessionService(),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          setUserData(response.data);
          setLocalStorageData('userData', response.data);
        } else {
          errorToast(response.message);
          localStorage.removeItem('userData');
          navigate('/login');
        }
      },

      onError: (error: APIResponse) => {
        errorToast(error.message);
      },
    });
  };

  const sendForgotPasswordOtpMutation = () => {
    return useMutation({
      mutationFn: (data: SendOtpTypes) => sendForgotPasswordOtpService(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'OTP sent successfully to your email');
        } else {
          errorToast(response.message || 'Failed to send OTP');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'An error occurred while sending OTP');
      },
    });
  };

  const verifyForgotPasswordOtpMutation = () => {
    return useMutation({
      mutationFn: (data: VerifyOtpTypes) => verifyForgotPasswordOtpService(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'OTP verified successfully');
        } else {
          errorToast(response.message || 'Invalid OTP code');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'An error occurred while verifying OTP');
      },
    });
  };

  const resetPasswordMutation = () => {
    return useMutation({
      mutationFn: (data: ResetPasswordPayloadTypes) => resetPasswordService(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Password reset successfully');
        } else {
          errorToast(response.message || 'Failed to reset password');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'An error occurred while resetting password');
      },
    });
  };

  return {
    signInMutation,
    signOutMutation,
    heckUserSessionMutation,
    sendForgotPasswordOtpMutation,
    verifyForgotPasswordOtpMutation,
    resetPasswordMutation,
  };
};

export default authMutation;
