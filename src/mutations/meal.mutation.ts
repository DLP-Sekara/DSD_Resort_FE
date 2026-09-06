import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { MealPlan, FoodItem } from '../types/services.interfaces';
import mealService from '../services/meal.services';

const mealMutation = () => {
  const queryClient = useQueryClient();
  const {
    getAllMealPlans,
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
    getAllFoodItems,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
  } = mealService();

  // --- Meal Plan Mutations ---

  const createMealPlanMutation = () => {
    return useMutation({
      mutationFn: (data: MealPlan) => createMealPlan(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to create meal plan');
      },
    });
  };

  const updateMealPlanMutation = () => {
    return useMutation({
      mutationFn: (data: Partial<MealPlan>) => updateMealPlan(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to update meal plan');
      },
    });
  };

  const deleteMealPlanMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteMealPlan(id),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete meal plan');
      },
    });
  };

  const getAllMealPlansMutation = () => {
    return useQuery({
      queryKey: ['meal-plans'],
      queryFn: () => getAllMealPlans(),
      staleTime: 1000 * 60 * 60,
    });
  };

  // --- Food Item Mutations ---

  const addFoodItemMutation = () => {
    return useMutation({
      mutationFn: (data: FoodItem) => addFoodItem(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['food-items'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to add food item');
      },
    });
  };

  const updateFoodItemMutation = () => {
    return useMutation({
      mutationFn: (data: Partial<FoodItem>) => updateFoodItem(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['food-items'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to update food item');
      },
    });
  };

  const deleteFoodItemMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteFoodItem(id),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message);
          queryClient.invalidateQueries({ queryKey: ['food-items'] });
        } else {
          errorToast(response.message);
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete food item');
      },
    });
  };

  const getAllFoodItemsMutation = () => {
    return useQuery({
      queryKey: ['food-items'],
      queryFn: () => getAllFoodItems(),
      staleTime: 1000 * 60 * 60,
    });
  };

  return {
    createMealPlanMutation,
    updateMealPlanMutation,
    deleteMealPlanMutation,
    getAllMealPlansMutation,
    addFoodItemMutation,
    updateFoodItemMutation,
    deleteFoodItemMutation,
    getAllFoodItemsMutation,
  };
};

export default mealMutation;
