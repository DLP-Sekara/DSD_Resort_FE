import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { ServiceRequestArgs } from '../types/services.interfaces';
import type { BatchBOMUsageLogRequestDTO } from '../types/kitchen.interfaces';

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

const bomUsageLogService = () => {
  return {
    logBOMUsage: (data: BatchBOMUsageLogRequestDTO) =>
      handleRequest({
        url: 'api/v1/bom-usage-logs/log',
        data,
        method: 'post',
      }),

    getUsageLogById: (logId: string) =>
      handleRequest({
        url: `api/v1/bom-usage-logs/${logId}`,
        method: 'get',
      }),

    getUsageLogsByTemplateId: (templateId: string) =>
      handleRequest({
        url: `api/v1/bom-usage-logs/by-template/${templateId}`,
        method: 'get',
      }),

    getAllUsageLogs: () =>
      handleRequest({
        url: 'api/v1/bom-usage-logs/all',
        method: 'get',
      }),
  };
};

export default bomUsageLogService;
