import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type {
  DemandForecastDTO,
  DemandForecastPredictRequest,
} from '../types/demandForecast.interfaces';
import demandForecastService from '../services/demandForecast.services';

const demandForecastMutation = () => {
  const queryClient = useQueryClient();
  const {
    getDemandDateContext,
    predictDemandForecast,
    addDemandForecast,
    getDemandForecastById,
    getDemandForecastsByDate,
    getAllDemandForecasts,
    deleteDemandForecast,
  } = demandForecastService();

  const getDemandDateContextQuery = (
    date: string,
    city: string = 'Colombo,LK',
    enabled = true
  ) => {
    return useQuery({
      queryKey: ['demandDateContext', date, city],
      queryFn: () => getDemandDateContext(date, city),
      enabled: Boolean(date) && enabled,
    });
  };

  const getDemandForecastByIdQuery = (id: string, enabled = true) => {
    return useQuery({
      queryKey: ['demandForecast', id],
      queryFn: () => getDemandForecastById(id),
      enabled: Boolean(id) && enabled,
    });
  };

  const getDemandForecastsByDateQuery = (date: string, enabled = true) => {
    return useQuery({
      queryKey: ['demandForecastsByDate', date],
      queryFn: () => getDemandForecastsByDate(date),
      enabled: Boolean(date) && enabled,
    });
  };

  const getAllDemandForecastsQuery = (enabled = true) => {
    return useQuery({
      queryKey: ['allDemandForecasts'],
      queryFn: () => getAllDemandForecasts(),
      enabled,
    });
  };

  const predictDemandForecastMutation = () => {
    return useMutation({
      mutationFn: (data: DemandForecastPredictRequest) => predictDemandForecast(data),
      onSuccess: (response: APIResponse) => {
        if (!response.success) {
          errorToast(response.message || 'Failed to predict demand');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to predict demand');
      },
    });
  };

  const addDemandForecastMutation = () => {
    return useMutation({
      mutationFn: (data: DemandForecastDTO) => addDemandForecast(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Demand forecast added successfully');
          queryClient.invalidateQueries({ queryKey: ['allDemandForecasts'] });
          queryClient.invalidateQueries({ queryKey: ['demandForecastsByDate'] });
        } else {
          errorToast(response.message || 'Failed to add demand forecast');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to add demand forecast');
      },
    });
  };

  const deleteDemandForecastMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteDemandForecast(id),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Demand forecast deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['allDemandForecasts'] });
          queryClient.invalidateQueries({ queryKey: ['demandForecastsByDate'] });
        } else {
          errorToast(response.message || 'Failed to delete demand forecast');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete demand forecast');
      },
    });
  };

  return {
    getDemandDateContextQuery,
    getDemandForecastByIdQuery,
    getDemandForecastsByDateQuery,
    getAllDemandForecastsQuery,
    predictDemandForecastMutation,
    addDemandForecastMutation,
    deleteDemandForecastMutation,
  };
};

export default demandForecastMutation;
