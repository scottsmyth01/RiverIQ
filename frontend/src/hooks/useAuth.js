import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getMe,
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  validateResetToken,
  resetPassword,
  verifyEmail,
} from '../api/authApi.js';

const MIN_LOGIN_LOADING_MS = 1000;

async function loginWithMinimumLoadingTime(formData) {
  const startedAt = Date.now();

  try {
    return await loginUser(formData);
  } finally {
    const remainingTime = MIN_LOGIN_LOADING_MS - (Date.now() - startedAt);

    if (remainingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
    }
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const loginLoading = useIsMutating({ mutationKey: ['auth', 'login'] }) > 0;
  const registerLoading = useIsMutating({ mutationKey: ['auth', 'register'] }) > 0;

  const { data, isLoading: loading } = useQuery({
    queryKey: ['authUser'],
    queryFn: getMe,
    retry: false,
  });

  const user = data?.user || null;

  const registerMutation = useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: registerUser,
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
    },
  });

  const loginMutation = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: loginWithMinimumLoadingTime,
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
    },
  });
  const logoutMutation = useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: logoutUser,
    onSettled: () => {
      queryClient.setQueryData(['authUser'], null);
      queryClient.removeQueries({ queryKey: ['sessions'] });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationKey: ['auth', 'forgot-password'],
    mutationFn: forgotPassword,
  });

  const resetPasswordMutation = useMutation({
    mutationKey: ['auth', 'reset-password'],
    mutationFn: ({ id, token, formData }) => resetPassword(id, token, formData),
  });

  const verifyEmailMutation = useMutation({
    mutationKey: ['auth', 'verify-email'],
    mutationFn: verifyEmail,
    onSuccess: () => {
      queryClient.setQueryData(['authUser'], (oldData) => {
        if (!oldData?.user) return oldData;
        return {
          ...oldData,
          user: {
            ...oldData.user,
            isEmailVerified: true,
          },
        };
      });
    },
  });
  return {
    user,
    loading,
    isAuthenticated: !!user,
    isEmailVerified: !!user?.isEmailVerified,

    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: (id, token, formData) => resetPasswordMutation.mutateAsync({ id, token, formData }),
    verifyEmail: verifyEmailMutation.mutateAsync,

    loginLoading,
    registerLoading,
    logoutLoading: logoutMutation.isPending,
  };
}

export function useValidateResetToken(id, token) {
  return useQuery({
    queryKey: ['auth', 'reset-token', id, token],
    queryFn: () => validateResetToken(id, token),
    enabled: Boolean(id && token),
    retry: false,
  });
}
