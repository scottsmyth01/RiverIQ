import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (formData) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.message || 'Registration failed');
      error.field = data.field;
      throw error;
    }

    return data;
  };

  const login = async (formData) => {
    const startedAt = Date.now();
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const error = new Error(data.message || 'Login failed');
        error.field = data.field;
        throw error;
      }

      const remainingDelay = Math.max(0, 2000 - (Date.now() - startedAt));
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));

      setUser(data.user);
      return data;
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
    }
  };

  const forgotPassword = async ({ email }) => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.message || 'Unable to send password reset link');
      error.field = data.field;
      throw error;
    }

    return data;
  };

  const validateResetToken = async (id, token) => {
    const res = await fetch(`${API_URL}/api/auth/reset-password/${id}/${token}`, {
      credentials: 'include',
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Invalid password reset link');

    return data;
  };

  const resetPassword = async (id, token, formData) => {
    const res = await fetch(`${API_URL}/api/auth/reset-password/${id}/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    });
    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.message || 'Unable to reset password');
      error.field = data.field;
      throw error;
    }

    return data;
  };

  const verifyEmail = useCallback(async (token) => {
    const res = await fetch(`${API_URL}/api/auth/verify-email/${token}`, {
      credentials: 'include',
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Unable to verify email');

    setUser((currentUser) => (currentUser ? { ...currentUser, isEmailVerified: true } : currentUser));
    return data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginLoading,
        isAuthenticated: !!user,
        isEmailVerified: !!user?.isEmailVerified,
        register,
        login,
        logout,
        forgotPassword,
        validateResetToken,
        resetPassword,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
