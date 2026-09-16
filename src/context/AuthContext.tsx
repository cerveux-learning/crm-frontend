import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, tokenStorage } from '../api/client.js';
import type { AuthUser, LoginInput, ChangePasswordInput } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void> | void;
  changePassword: (data: ChangePasswordInput) => Promise<void>;
  isAdmin: boolean;
  isSeller: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = tokenStorage.get();
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await api.auth.getMe();
        setUser(currentUser);
        setToken(savedToken);
      } catch (err) {
        console.error('Error restoring session:', err);
        tokenStorage.clear();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginInput) => {
    const res = await api.auth.login(data);
    tokenStorage.set(res.token);
    tokenStorage.setRefreshToken(res.refreshToken);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignorar errores de red al cerrar sesión
    } finally {
      tokenStorage.clear();
      setToken(null);
      setUser(null);
    }
  };

  const changePassword = async (data: ChangePasswordInput) => {
    await api.auth.changePassword(data);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isSeller = user?.role === 'SELLER';
  const isViewer = user?.role === 'VIEWER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        changePassword,
        isAdmin,
        isSeller,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
