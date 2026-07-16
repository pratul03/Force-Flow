'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { LoginResponse } from '@/lib/types';
import { authApi } from '@/features/auth/api';
import { mapBackendUserToAuthUser } from '@/features/auth/utils';
import { usersApi } from '@/features/users/api';

export function useAuth() {
  const {
    user,
    token,
    refreshToken,
    isAuthenticated,
    login,
    logout,
    updateUser,
    initializeFromCookies,
  } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from cookies on mount
  useEffect(() => {
    initializeFromCookies();
    setIsInitialized(true);
  }, [initializeFromCookies]);

  useEffect(() => {
    async function hydrateUser() {
      if (!isInitialized || !isAuthenticated || !user?.id) {
        return;
      }

      if (user.organizationId && user.avatarUrl !== undefined) {
        return;
      }

      const response = await usersApi.getById(user.id);
      if (!response.success || !response.data) {
        return;
      }

      const mappedUser = mapBackendUserToAuthUser(response.data);
      updateUser({
        organizationId: mappedUser.organizationId,
        avatarUrl: mappedUser.avatarUrl,
      });
    }

    void hydrateUser();
  }, [
    isInitialized,
    isAuthenticated,
    user?.id,
    user?.organizationId,
    user?.avatarUrl,
    updateUser,
  ]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(email, password);

      if (!response.success) {
        setError(response.error || 'Login failed');
        return false;
      }

      if (!response.data) {
        setError('Invalid login response');
        return false;
      }

      const data = response.data as LoginResponse;
      const mappedUser = mapBackendUserToAuthUser(data.user);

      login(mappedUser);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      logout();
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login: handleLogin,
    logout: handleLogout,
  };
}
