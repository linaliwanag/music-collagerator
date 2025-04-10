'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { refreshToken, logoutApi } from '@/utils/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  display_name: string;
  images: { url: string }[];
  email: string;
}

interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  login: () => void;
  logout: () => void;
  setAuthTokens: (accessToken: string, expiresIn: number) => void;
  setUser: (user: User) => void;
  clearAuthState: () => void;
  refreshTokenHandler: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isHydrated: false,
  login: () => {},
  logout: () => {},
  setAuthTokens: () => {},
  setUser: () => {},
  clearAuthState: () => {},
  refreshTokenHandler: () => Promise.resolve(),
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!accessToken;

  const setAuthTokens = (token: string, expiresIn: number) => {
    setAccessToken(token);
    const expiry = new Date().getTime() + expiresIn * 1000;
    setExpiryTime(expiry);
    
    if (isHydrated) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('expiryTime', expiry.toString());
    }
  };

  const clearAuthState = () => {
    setAccessToken(null);
    setUser(null);
    setExpiryTime(null);
    
    if (isHydrated) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('expiryTime');
      localStorage.removeItem('user');
    }
  };

  const refreshTokenHandler = async () => {
    if (!isHydrated) return;
    
    try {
      const data = await refreshToken();
      setAuthTokens(data.accessToken, data.expiresIn);
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthState();
    }
  };

  const login = () => {
    router.push('/login');
  };

  const logout = async () => {
    if (isHydrated) {
      try {
        await logoutApi();
      } catch (error) {
        console.error('Logout error:', error);
      }
      
      clearAuthState();
    }
    
    router.push('/');
  };

  const setUserData = (userData: User) => {
    setUser(userData);
    if (isHydrated) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  // This runs only on the client after hydration is complete
  useEffect(() => {
    setIsHydrated(true);
    
    const init = async () => {
      try {
        const storedToken = localStorage.getItem('accessToken');
        const storedExpiry = localStorage.getItem('expiryTime');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedExpiry && new Date().getTime() < parseInt(storedExpiry)) {
          setAccessToken(storedToken);
          setExpiryTime(parseInt(storedExpiry));
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else if (storedExpiry && new Date().getTime() >= parseInt(storedExpiry)) {
          await refreshTokenHandler();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!isHydrated) return;
    
    let refreshInterval: NodeJS.Timeout;

    if (accessToken && expiryTime) {
      const refreshTime = expiryTime - new Date().getTime() - 5 * 60 * 1000;
      if (refreshTime > 0) {
        refreshInterval = setTimeout(refreshTokenHandler, refreshTime);
      } else {
        refreshTokenHandler();
      }
    }

    return () => {
      if (refreshInterval) clearTimeout(refreshInterval);
    };
  }, [accessToken, expiryTime, isHydrated, refreshTokenHandler]);

  const value = {
    accessToken,
    user,
    isAuthenticated,
    isLoading,
    isHydrated,
    login,
    logout,
    setAuthTokens,
    setUser: setUserData,
    clearAuthState,
    refreshTokenHandler,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 