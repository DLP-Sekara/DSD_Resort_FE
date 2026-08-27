import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { APIResponse } from '../types/onBoarding.interfaces';
import type { BatchBOMUsageLogRequestDTO } from '../types/kitchen.interfaces';
import bomUsageLogService from '../services/bomUsageLog.services';

const bomUsageLogMutation = () => {
  const queryClient = useQueryClient();
  const {
    logBOMUsage,
    getUsageLogById,
    getUsageLogsByTemplateId,
    getAllUsageLogs,
  } = bomUsageLogService();

  const getAllBOMUsageLogsQuery = () => {
    return useQuery({
      queryKey: ['bom-usage-logs'],
      queryFn: () => getAllUsageLogs(),
    });
  };

  const getBOMUsageLogByIdQuery = (logId: string, enabled = true) => {
    return useQuery({
      queryKey: ['bom-usage-log', logId],
      queryFn: () => getUsageLogById(logId),
      enabled: Boolean(logId) && enabled,
    });
  };

  const getBOMUsageLogsByTemplateIdQuery = (
    templateId: string,
    enabled = true,
  ) => {
    return useQuery({
      queryKey: ['bom-usage-logs-by-template', templateId],
      queryFn: () => getUsageLogsByTemplateId(templateId),
      enabled: Boolean(templateId) && enabled,
    });
  };

  const logBOMUsageMutation = () => {
    return useMutation({
      mutationFn: (data: BatchBOMUsageLogRequestDTO) => logBOMUsage(data),
      onSuccess: (response: APIResponse) => {
        if (response.success) {
          queryClient.invalidateQueries({ queryKey: ['bom-usage-logs'] });
          queryClient.invalidateQueries({ queryKey: ['bom-usage-logs-by-template'] });
          queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
        }
      },
    });
  };

  return {
    getAllBOMUsageLogsQuery,
    getBOMUsageLogByIdQuery,
    getBOMUsageLogsByTemplateIdQuery,
    logBOMUsageMutation,
  };
};

export default bomUsageLogMutation;
