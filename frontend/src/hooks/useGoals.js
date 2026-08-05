import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGoal, deleteGoal, getGoals, reorderGoals, updateGoal } from '../api/goalApi.js';

export const goalsQueryKey = ['goals'];
const GOALS_STALE_TIME_MS = 5 * 60 * 1000;

export function useGoals() {
  return useQuery({
    queryKey: goalsQueryKey,
    queryFn: getGoals,
    placeholderData: (previousGoals) => previousGoals,
    refetchOnWindowFocus: false,
    staleTime: GOALS_STALE_TIME_MS,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['goals', 'create'],
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKey });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['goals', 'update'],
    mutationFn: updateGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKey });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['goals', 'delete'],
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKey });
    },
  });
}

export function useReorderGoals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['goals', 'reorder'],
    mutationFn: reorderGoals,
    onSuccess: (goals) => {
      queryClient.setQueryData(goalsQueryKey, goals);
    },
  });
}
