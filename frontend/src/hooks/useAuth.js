import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getMe,
  registerUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  updatePreferences,
  updateBankroll,
  forgotPassword,
  validateResetToken,
  resetPassword,
  verifyEmail,
  cancelSubscription,
  uploadAvatar,
  deleteAvatar,
} from '../api/authApi.js';

export function useAuth() {
  const queryClient = useQueryClient();
  const minimumAuthLoadingMs = 1250;
  const loginLoading = useIsMutating({ mutationKey: ['auth', 'login'] }) > 0;
  const googleLoginLoading = useIsMutating({ mutationKey: ['auth', 'google'] }) > 0;
  const registerLoading = useIsMutating({ mutationKey: ['auth', 'register'] }) > 0;
  const logoutLoading = useIsMutating({ mutationKey: ['auth', 'logout'] }) > 0;

  const { data, isLoading: loading } = useQuery({
    queryKey: ['authUser'],
    queryFn: getMe,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
    mutationFn: async (formData) => {
      const startedAt = Date.now();
      try {
        return await loginUser(formData);
      } finally {
        const remainingTime = minimumAuthLoadingMs - (Date.now() - startedAt);

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
    },
  });
  const googleLoginMutation = useMutation({
    mutationKey: ['auth', 'google'],
    mutationFn: loginWithGoogle,
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
    },
  });
  const logoutMutation = useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: async () => {
      const startedAt = Date.now();

      try {
        return await logoutUser();
      } finally {
        const remainingTime = minimumAuthLoadingMs - (Date.now() - startedAt);

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] });
    },
    onSettled: () => {
      queryClient.setQueryData(['authUser'], null);
      queryClient.removeQueries({ queryKey: ['sessions'] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationKey: ['auth', 'preferences'],
    mutationFn: updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
    },
  });

  const updateBankrollMutation = useMutation({
    mutationKey: ['auth', 'bankroll'],
    mutationFn: updateBankroll,
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationKey: ['auth', 'subscription', 'cancel'],
    mutationFn: cancelSubscription,
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationKey: ['auth', 'avatar'],
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationKey: ['auth', 'avatar', 'delete'],
    mutationFn: deleteAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
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
    loginGoogle: googleLoginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    updateBankroll: updateBankrollMutation.mutateAsync,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    deleteAvatar: deleteAvatarMutation.mutateAsync,
    cancelSubscription: cancelSubscriptionMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: (id, token, formData) => resetPasswordMutation.mutateAsync({ id, token, formData }),
    verifyEmail: verifyEmailMutation.mutateAsync,

    loginLoading,
    googleLoginLoading,
    registerLoading,
    logoutLoading,
    updatePreferencesLoading: updatePreferencesMutation.isPending,
    updateBankrollLoading: updateBankrollMutation.isPending,
    uploadAvatarLoading: uploadAvatarMutation.isPending,
    deleteAvatarLoading: deleteAvatarMutation.isPending,
    cancelSubscriptionLoading: cancelSubscriptionMutation.isPending,
    forgotPasswordLoading: forgotPasswordMutation.isPending,
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
