import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { ServiceRequestArgs } from '../types/services.interfaces';
import type {
  DemandForecastDTO,
  DemandForecastPredictRequest,
} from '../types/demandForecast.interfaces';

const handleRequest = async ({
  url,
  data,
  method = 'post',
}: ServiceRequestArgs): Promise<APIResponse> => {
  try {
    const response = (await (method === 'get'
      ? axiosInstance.get(url, { params: data })
      : axiosInstance[method](url, data))) as any;

    return response as APIResponse;
  } catch (error: any) {
    return error as APIResponse;
  }
};

const demandForecastService = () => {
  return {
    getDemandDateContext: (date: string, city: string = 'Colombo,LK') =>
      handleRequest({
        url: 'api/v1/demand-forecasts/date-context',
        data: { date, city },
        method: 'get',
      }),

    predictDemandForecast: (data: DemandForecastPredictRequest) =>
      handleRequest({
        url: 'api/v1/demand-forecasts/predict',
        data,
        method: 'post',
      }),

    addDemandForecast: (data: DemandForecastDTO) =>
      handleRequest({
        url: 'api/v1/demand-forecasts/add',
        data,
        method: 'post',
      }),

    getDemandForecastById: (id: string) =>
      handleRequest({
        url: `api/v1/demand-forecasts/${id}`,
        method: 'get',
      }),

    getDemandForecastsByDate: (date: string) =>
      handleRequest({
        url: 'api/v1/demand-forecasts/by-date',
        data: { date },
        method: 'get',
      }),

    getAllDemandForecasts: () =>
      handleRequest({
        url: 'api/v1/demand-forecasts/all',
        method: 'get',
      }),

    deleteDemandForecast: (id: string) =>
      handleRequest({
        url: `api/v1/demand-forecasts/delete/${id}`,
        method: 'delete',
      }),
  };
};

export default demandForecastService;
