import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { UserAccount } from '../types/services.interfaces';
import userService from '../services/user.services';

const userMutation = () => {
  const queryClient = useQueryClient();
  const { getAllUsers, updateUser, deleteUser, createUser, getUserByNic } = userService();

  const createUserMutation = () => {
    return useMutation({
      mutationFn: (data: UserAccount) => createUser(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['users'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to create user');
      },
    });
  };

  const updateUserMutation = () => {
    return useMutation({
      mutationFn: (data: Partial<UserAccount>) => updateUser(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['users'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to update user');
      },
    });
  };

  const deleteUserMutation = () => {
    return useMutation({
      mutationFn: (guestId: string) => deleteUser(guestId),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['users'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete user');
      },
    });
  };

  const getAllUsersMutation = () => {
    return useQuery({
      queryKey: ['users'],
      queryFn: () => getAllUsers(),
      staleTime: 1000 * 60 * 60,
    });
  };

  const getUserByNicMutation = () => {
    return useMutation({
      mutationFn: (nic: string) => getUserByNic(nic),
    });
  };

  return {
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    getAllUsersMutation,
    getUserByNicMutation,
  };
};

export default userMutation;
