import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { RawMaterial, RawMaterialDTO } from '../types/kitchen.interfaces';
import kitchenService from '../services/kitchen.services';

const kitchenMutation = () => {
  const queryClient = useQueryClient();
  const {
    getAllRawMaterials,
    getRawMaterialById,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
  } = kitchenService();

  const getAllRawMaterialsQuery = () => {
    return useQuery({
      queryKey: ['raw-materials'],
      queryFn: () => getAllRawMaterials(),
    });
  };

  const getRawMaterialByIdQuery = (materialId: string, enabled = true) => {
    return useQuery({
      queryKey: ['raw-material', materialId],
      queryFn: () => getRawMaterialById(materialId),
      enabled: Boolean(materialId) && enabled,
    });
  };

  const addRawMaterialMutation = () => {
    return useMutation({
      mutationFn: (data: RawMaterialDTO) => addRawMaterial(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Raw material added successfully');
          queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
        } else {
          errorToast(response.message || 'Failed to add raw material');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to add raw material');
      },
    });
  };

  const updateRawMaterialMutation = () => {
    return useMutation({
      mutationFn: (data: Partial<RawMaterial>) => updateRawMaterial(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Raw material updated successfully');
          queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
        } else {
          errorToast(response.message || 'Failed to update raw material');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to update raw material');
      },
    });
  };

  const deleteRawMaterialMutation = () => {
    return useMutation({
      mutationFn: (materialId: string) => deleteRawMaterial(materialId),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          successToast(response.message || 'Raw material deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
        } else {
          errorToast(response.message || 'Failed to delete raw material');
        }
      },
      onError: (error: APIResponse) => {
        errorToast(error.message || 'Failed to delete raw material');
      },
    });
  };

  return {
    getAllRawMaterialsQuery,
    getRawMaterialByIdQuery,
    addRawMaterialMutation,
    updateRawMaterialMutation,
    deleteRawMaterialMutation,
  };
};

export default kitchenMutation;
