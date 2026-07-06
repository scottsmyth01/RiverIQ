import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addSession, deleteSession, getSessions, updateSession } from '../api/sessionApi';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });
}

export function useAddSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'add'],
    mutationFn: addSession,
    onSuccess: (newSession) => {
      queryClient.setQueryData(['sessions'], (sessions = []) => [...sessions, newSession]);
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'update'],
    mutationFn: updateSession,
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(['sessions'], updatedSession);
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'delete'],
    mutationFn: deleteSession,
    onSuccess: (deletedSessionId) => {
      queryClient.setQueryData(['sessions'], (sessions = []) =>
        sessions.filter((session) => session._id !== deletedSessionId),
      );
    },
  });
}
