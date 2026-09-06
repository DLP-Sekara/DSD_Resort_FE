import { axiosInstance } from '../config/axiosService';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { ServiceRequestArgs } from '../types/services.interfaces';
import type { RawMaterial, RawMaterialDTO } from '../types/kitchen.interfaces';

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

const kitchenService = () => {
  return {
    getAllRawMaterials: () =>
      handleRequest({ url: 'api/v1/raw-materials/all', method: 'get' }),

    getRawMaterialById: (materialId: string) =>
      handleRequest({ url: `api/v1/raw-materials/${materialId}`, method: 'get' }),

    addRawMaterial: (data: RawMaterialDTO) =>
      handleRequest({ url: 'api/v1/raw-materials/add', data, method: 'post' }),

    updateRawMaterial: (data: Partial<RawMaterial>) =>
      handleRequest({ url: 'api/v1/raw-materials/update', data, method: 'put' }),

    deleteRawMaterial: (materialId: string) =>
      handleRequest({
        url: `api/v1/raw-materials/delete/${materialId}`,
        method: 'delete',
      }),
  };
};

export default kitchenService;
