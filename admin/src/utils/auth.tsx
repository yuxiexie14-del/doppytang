import React, { createContext, useContext, useMemo, useState } from 'react';

const TOKEN_STORAGE_KEY = 'admin_token';

type AuthContextType = {
  token: string | null;
  setToken: (value: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readToken = (): string | null => {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn('无法读取本地存储 Token', error);
    return null;
  }
};

const writeToken = (value: string | null) => {
  try {
    if (value) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('无法写入本地存储 Token', error);
  }
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [tokenState, setTokenState] = useState<string | null>(() => readToken());

  const setToken = (value: string | null) => {
    writeToken(value);
    setTokenState(value);
  };

  const value = useMemo(() => ({ token: tokenState, setToken }), [tokenState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

export const getStoredToken = (): string | null => readToken();
