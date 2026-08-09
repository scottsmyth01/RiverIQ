import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addSession, deleteSession, getSessions, purgeSessions, updateSession } from '../api/sessionApi';
import { goalsQueryKey } from './useGoals';

export const sessionsQueryKey = ['sessions'];
const allSessionsQueryKey = [...sessionsQueryKey, { period: 'all-time' }];
const SESSIONS_STALE_TIME_MS = 5 * 60 * 1000;

export function useSessions(params = {}) {
  const { period = 'all-time', staleTime = SESSIONS_STALE_TIME_MS, enabled = true } = params;

  return useQuery({
    queryKey: [...sessionsQueryKey, { period }],
    queryFn: () => getSessions({ period }),
    enabled,
    placeholderData: (previousSessions) => previousSessions,
    refetchOnWindowFocus: false,
    staleTime,
  });
}

export function useAddSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'add'],
    mutationFn: addSession,
    onSuccess: ({ session: newSession, sessions: newSessions = [], aiGoal, user }) => {
      const sessionsToAdd = newSessions.length ? newSessions : [newSession].filter(Boolean);
      queryClient.setQueryData(allSessionsQueryKey, (sessions = []) => [...sessions, ...sessionsToAdd]);
      if (aiGoal) {
        queryClient.setQueryData(goalsQueryKey, (goals = []) => [aiGoal, ...goals]);
      }
      if (user) {
        queryClient.setQueryData(['authUser'], { user });
      }
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      queryClient.invalidateQueries({ queryKey: goalsQueryKey });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'update'],
    mutationFn: updateSession,
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(allSessionsQueryKey, (sessions = []) =>
        sessions.map((session) => (session._id === updatedSession._id ? updatedSession : session)),
      );
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'delete'],
    mutationFn: deleteSession,
    onSuccess: ({ id: deletedSessionId, user }) => {
      queryClient.setQueryData(allSessionsQueryKey, (sessions = []) =>
        sessions.filter((session) => session._id !== deletedSessionId),
      );
      if (user) {
        queryClient.setQueryData(['authUser'], { user });
      }
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
  });
}

export function usePurgeSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sessions', 'purge'],
    mutationFn: purgeSessions,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(allSessionsQueryKey, []);
      if (user) {
        queryClient.setQueryData(['authUser'], { user });
      }
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
  });
}
