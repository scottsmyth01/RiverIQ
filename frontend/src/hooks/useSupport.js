import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteSupportConversation,
  getMySupportConversation,
  getSupportConversation,
  getSupportConversations,
  sendSupportMessage,
  sendSupportReply,
  updateSupportConversationStatus,
} from '../api/supportApi';

export const mySupportConversationQueryKey = ['support', 'me'];
export const supportConversationsQueryKey = (status = 'open') => ['support', 'conversations', status];
export const supportConversationQueryKey = (id) => ['support', 'conversation', id];

export function useMySupportConversation({ enabled = true, refetchInterval = false } = {}) {
  return useQuery({
    queryKey: mySupportConversationQueryKey,
    queryFn: getMySupportConversation,
    enabled,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
}

export function useSendSupportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['support', 'message', 'send'],
    mutationFn: sendSupportMessage,
    onSuccess: (conversation) => {
      queryClient.setQueryData(mySupportConversationQueryKey, conversation);
      if (conversation?.id) {
        queryClient.setQueryData(supportConversationQueryKey(conversation.id), conversation);
      }
      queryClient.invalidateQueries({ queryKey: ['support', 'conversations'] });
    },
  });
}

export function useSupportConversations(status = 'open', { enabled = true } = {}) {
  return useQuery({
    queryKey: supportConversationsQueryKey(status),
    queryFn: () => getSupportConversations(status),
    enabled,
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
  });
}

export function useSupportConversation(id) {
  return useQuery({
    queryKey: supportConversationQueryKey(id),
    queryFn: () => getSupportConversation(id),
    enabled: Boolean(id),
    refetchInterval: 3000,
    refetchOnWindowFocus: false,
  });
}

export function useSendSupportReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['support', 'reply', 'send'],
    mutationFn: sendSupportReply,
    onSuccess: (conversation) => {
      if (conversation?.id) {
        queryClient.setQueryData(supportConversationQueryKey(conversation.id), conversation);
      }
      queryClient.invalidateQueries({ queryKey: ['support', 'conversations'] });
    },
  });
}

export function useUpdateSupportConversationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['support', 'conversation', 'status'],
    mutationFn: updateSupportConversationStatus,
    onSuccess: (conversation) => {
      if (conversation?.id) {
        queryClient.setQueryData(supportConversationQueryKey(conversation.id), conversation);
      }
      queryClient.invalidateQueries({ queryKey: ['support', 'conversations'] });
    },
  });
}

export function useDeleteSupportConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['support', 'conversation', 'delete'],
    mutationFn: deleteSupportConversation,
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: supportConversationQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: ['support', 'conversations'] });
    },
  });
}
