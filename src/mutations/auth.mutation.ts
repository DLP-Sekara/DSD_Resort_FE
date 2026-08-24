import { useMutation } from '@tanstack/react-query';
import { errorToast } from '../components/common/Alert';
import type { APIResponse, LoginTypes } from '../types/onBoarding.interfaces';
import authService from '../services/auth.services';
import { useNavigate } from 'react-router-dom';
import { setLocalStorageData } from '../helpers/StorageHelper';
import { useAuth } from '../hooks/useAuth';

const authMutation = () => {
  const { signInService, signOutService, heckUserSessionService } = authService();
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

  return { signInMutation, signOutMutation, heckUserSessionMutation };
};

export default authMutation;
