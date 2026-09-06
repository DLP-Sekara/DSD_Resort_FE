import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { CreateRestaurantOrderDTO } from '../types/restaurantOrder.interfaces';
import restaurantOrderService from '../services/restaurantOrder.services';

const restaurantOrderMutation = () => {
  const queryClient = useQueryClient();
  const {
    createRestaurantOrder,
    getRestaurantOrderById,
    getAllRestaurantOrders,
    updateRestaurantOrderStatus,
    deleteRestaurantOrder,
  } = restaurantOrderService();

  const getAllRestaurantOrdersQuery = (filters?: any) => {
    return useQuery({
      queryKey: ['restaurant-orders', filters],
      queryFn: () => getAllRestaurantOrders(filters),
    });
  };

  const getRestaurantOrderByIdQuery = (orderId: string, enabled = true) => {
    return useQuery({
      queryKey: ['restaurant-order', orderId],
      queryFn: () => getRestaurantOrderById(orderId),
      enabled: Boolean(orderId) && enabled,
    });
  };

  const createRestaurantOrderMutation = () => {
    return useMutation({
      mutationFn: (data: CreateRestaurantOrderDTO) => createRestaurantOrder(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Restaurant order created successfully');
          queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
        } else {
          errorToast(response.message || 'Failed to create restaurant order');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to create restaurant order');
      },
    });
  };

  const updateRestaurantOrderStatusMutation = () => {
    return useMutation({
      mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
        updateRestaurantOrderStatus({ orderId, status }),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Order status updated successfully');
          queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
        } else {
          errorToast(response.message || 'Failed to update order status');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to update order status');
      },
    });
  };

  const deleteRestaurantOrderMutation = () => {
    return useMutation({
      mutationFn: (orderId: string) => deleteRestaurantOrder(orderId),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Order deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
        } else {
          errorToast(response.message || 'Failed to delete order');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete order');
      },
    });
  };

  return {
    getAllRestaurantOrdersQuery,
    getRestaurantOrderByIdQuery,
    createRestaurantOrderMutation,
    updateRestaurantOrderStatusMutation,
    deleteRestaurantOrderMutation,
  };
};

export default restaurantOrderMutation;
