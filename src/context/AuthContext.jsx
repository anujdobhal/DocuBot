import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, getStoredUser, clearAuth, onSessionExpired } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);

  // Listen for session expiration events triggered by API interceptor
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setToken(null);
      setUser(null);
      setSessionExpiredMessage('Your session has expired. Please log in again.');
    });
    return unsubscribe;
  }, []);

  const login = async (emailOrUsername, password) => {
    setIsLoading(true);
    setSessionExpiredMessage(null);
    try {
      const data = await api.login(emailOrUsername, password);
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } finally {
      setToken(null);
      setUser(null);
      clearAuth();
      setIsLoading(false);
    }
  };

  const clearSessionExpiredNotice = () => {
    setSessionExpiredMessage(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    sessionExpiredMessage,
    clearSessionExpiredNotice,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
