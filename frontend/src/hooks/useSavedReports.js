import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSavedReport,
  deleteSavedReport,
  getSavedReports,
  updateSavedReport,
} from '../api/savedReportApi';

export const savedReportsQueryKey = ['saved-reports'];

export function useSavedReports() {
  return useQuery({
    queryKey: savedReportsQueryKey,
    queryFn: getSavedReports,
  });
}

export function useCreateSavedReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['saved-reports', 'create'],
    mutationFn: createSavedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedReportsQueryKey });
    },
  });
}

export function useUpdateSavedReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['saved-reports', 'update'],
    mutationFn: updateSavedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedReportsQueryKey });
    },
  });
}

export function useDeleteSavedReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['saved-reports', 'delete'],
    mutationFn: deleteSavedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedReportsQueryKey });
    },
  });
}
