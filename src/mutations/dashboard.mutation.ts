import { useMutation, useQueryClient } from '@tanstack/react-query';
import { errorToast } from '../components/common/Alert';
import type { APIResponse } from '../types/onBoarding.interfaces';
import dashboardService from '../services/dashboard.services';

const dashboardMutation = () => {
  const queryClient = useQueryClient();
  const { markNotificationAsRead } = dashboardService();

  const markAsReadMutation = () => {
    return useMutation({
      mutationFn: (id: string) => markNotificationAsRead(id),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Action failed');
      },
    });
  };

  return { markAsReadMutation };
};

export default dashboardMutation;
