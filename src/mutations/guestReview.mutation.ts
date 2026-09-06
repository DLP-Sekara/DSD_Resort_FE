import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { GuestReviewDTO } from '../types/guestReview.interfaces';
import guestReviewService from '../services/guestReview.services';

const guestReviewMutation = () => {
  const queryClient = useQueryClient();
  const { addGuestReview, getAllGuestReviews, deleteGuestReview } = guestReviewService();

  const addGuestReviewMutation = () => {
    return useMutation({
      mutationFn: (data: GuestReviewDTO) => addGuestReview(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Guest review added successfully');
          queryClient.invalidateQueries({ queryKey: ['allGuestReviews'] });
        } else {
          errorToast(response.message || 'Failed to add guest review');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to add guest review');
      },
    });
  };

  const getAllGuestReviewsQuery = (enabled = true) => {
    return useQuery({
      queryKey: ['allGuestReviews'],
      queryFn: () => getAllGuestReviews(),
      enabled,
    });
  };

  const deleteGuestReviewMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteGuestReview(id),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Guest review deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['allGuestReviews'] });
        } else {
          errorToast(response.message || 'Failed to delete guest review');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete guest review');
      },
    });
  };

  return {
    addGuestReviewMutation,
    getAllGuestReviewsQuery,
    deleteGuestReviewMutation,
  };
};

export default guestReviewMutation;
