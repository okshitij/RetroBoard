import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { apiClient } from '../api';
import { socketService } from '../services/socketService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      apiClient.setToken(storedToken);
      loadUser(storedToken);
    } else {
      socketService.connect();
      setIsLoading(false);
    }
  }, []);

  const loadUser = async (authToken?: string) => {
    try {
      const response = await apiClient.getCurrentUser();
      setUser(response.user);
      if (authToken) {
        socketService.connect(authToken);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    setUser(response.user);
    setToken(response.token);
    apiClient.setToken(response.token);
    localStorage.setItem('token', response.token);
    socketService.connect(response.token);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await apiClient.register(username, email, password);
    setUser(response.user);
    setToken(response.token);
    apiClient.setToken(response.token);
    localStorage.setItem('token', response.token);
    socketService.connect(response.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    apiClient.setToken('');
    localStorage.removeItem('token');
    socketService.disconnect();
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};