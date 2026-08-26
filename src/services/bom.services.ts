import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { ServiceRequestArgs } from '../types/services.interfaces';
import type { CreateBOMTemplateDTO } from '../types/kitchen.interfaces';

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

const bomService = () => {
  return {
    createBOMTemplate: (data: CreateBOMTemplateDTO) =>
      handleRequest({
        url: 'api/v1/bom-templates/create',
        data,
        method: 'post',
      }),

    getBOMTemplateById: (templateId: string) =>
      handleRequest({
        url: `api/v1/bom-templates/${templateId}`,
        method: 'get',
      }),

    getAllBOMTemplates: () =>
      handleRequest({
        url: 'api/v1/bom-templates/all',
        method: 'get',
      }),

    deleteBOMTemplate: (templateId: string) =>
      handleRequest({
        url: `api/v1/bom-templates/delete/${templateId}`,
        method: 'delete',
      }),
  };
};

export default bomService;
