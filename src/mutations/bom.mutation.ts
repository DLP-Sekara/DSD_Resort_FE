import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type {
  CreateBOMTemplateDTO,
  CalculateOrderBOMDTO,
} from '../types/kitchen.interfaces';
import bomService from '../services/bom.services';

const bomMutation = () => {
  const queryClient = useQueryClient();
  const {
    createBOMTemplate,
    getBOMTemplateById,
    getAllBOMTemplates,
    deleteBOMTemplate,
    calculateOrderBOM,
  } = bomService();

  const getAllBOMTemplatesQuery = () => {
    return useQuery({
      queryKey: ['bom-templates'],
      queryFn: () => getAllBOMTemplates(),
    });
  };

  const getBOMTemplateByIdQuery = (templateId: string, enabled = true) => {
    return useQuery({
      queryKey: ['bom-template', templateId],
      queryFn: () => getBOMTemplateById(templateId),
      enabled: Boolean(templateId) && enabled,
    });
  };

  const createBOMTemplateMutation = () => {
    return useMutation({
      mutationFn: (data: CreateBOMTemplateDTO) => createBOMTemplate(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'BOM Template created successfully');
          queryClient.invalidateQueries({ queryKey: ['bom-templates'] });
        } else {
          errorToast(response.message || 'Failed to create BOM Template');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to create BOM Template');
      },
    });
  };

  const deleteBOMTemplateMutation = () => {
    return useMutation({
      mutationFn: (templateId: string) => deleteBOMTemplate(templateId),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'BOM Template deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['bom-templates'] });
        } else {
          errorToast(response.message || 'Failed to delete BOM Template');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete BOM Template');
      },
    });
  };

  const calculateOrderBOMMutation = () => {
    return useMutation({
      mutationFn: (data: CalculateOrderBOMDTO) => calculateOrderBOM(data),
    });
  };

  return {
    getAllBOMTemplatesQuery,
    getBOMTemplateByIdQuery,
    createBOMTemplateMutation,
    deleteBOMTemplateMutation,
    calculateOrderBOMMutation,
  };
};

export default bomMutation;
