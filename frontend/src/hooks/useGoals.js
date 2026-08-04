import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGoal, deleteGoal, getGoals, reorderGoals, updateGoal } from '../api/goalApi.js';

export const goalsQueryKey = ['goals'];

export function useGoals() {
  return useQuery({
    queryKey: goalsQueryKey,
    queryFn: getGoals,
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
