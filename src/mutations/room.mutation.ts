import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { Room } from '../types/services.interfaces';
import roomService from '../services/room.services';
import type { RoomType } from '../types/rooms';

const roomMutation = () => {
  const queryClient = useQueryClient();
  const {
    createRoom,
    updateRoom,
    deleteRoom,
    getAllRoomTypesService,
    createRoomType,
    deleteRoomType,
    getAllRooms,
  } = roomService();

  const createRoomMutation = () => {
    return useMutation({
      mutationFn: (data: Room) => createRoom(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to create room');
      },
    });
  };

  const updateRoomMutation = () => {
    return useMutation({
      mutationFn: (data: Partial<Room>) => updateRoom(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to update room');
      },
    });
  };

  const deleteRoomMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteRoom(id),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete room');
      },
    });
  };

  const createRoomTypeMutation = () => {
    return useMutation({
      mutationFn: (data: RoomType) => createRoomType(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['room-types'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to create room type');
      },
    });
  };

  const getAllRoomTypesMutation = () => {
    return useQuery({
      queryKey: ['room-types'],
      queryFn: () => getAllRoomTypesService(),
      // staleTime: 1000 * 60 * 60,
    });
  };

  const deleteRoomTypeMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteRoomType(id),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['room-types'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete room type');
      },
    });
  };

  const getAllRoomsMutation = () => {
    return useQuery({
      queryKey: ['rooms'],
      queryFn: () => getAllRooms(),
      // staleTime: 1000 * 60 * 60,
    });
  };

  return {
    createRoomMutation,
    updateRoomMutation,
    deleteRoomMutation,
    getAllRoomTypesMutation,
    createRoomTypeMutation,
    deleteRoomTypeMutation,
    getAllRoomsMutation,
  };
};

export default roomMutation;
