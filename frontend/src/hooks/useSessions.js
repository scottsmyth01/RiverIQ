import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addSession, deleteSession, getSessions, updateSession } from '../api/sessionApi';

export const sessionsQueryKey = ['sessions'];

export function useSessions() {
  return useQuery({
    queryKey: sessionsQueryKey,
    queryFn: getSessions,
  });
}

export function useAddSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'add'],
    mutationFn: addSession,
    onSuccess: (newSession) => {
      queryClient.setQueryData(sessionsQueryKey, (sessions = []) => [...sessions, newSession]);
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'update'],
    mutationFn: updateSession,
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(sessionsQueryKey, (sessions = []) =>
        sessions.map((session) => (session._id === updatedSession._id ? updatedSession : session)),
      );
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'delete'],
    mutationFn: deleteSession,
    onSuccess: (deletedSessionId) => {
      queryClient.setQueryData(sessionsQueryKey, (sessions = []) =>
        sessions.filter((session) => session._id !== deletedSessionId),
      );
    },
  });
}
