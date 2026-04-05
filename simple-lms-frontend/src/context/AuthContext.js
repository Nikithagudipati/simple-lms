import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [current, setCurrent] = useState(null);
  const [token, setToken] = useState(null);

  const KEY_TOKEN = 'lms_token';
  const KEY_CURRENT = 'lms_current';

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(KEY_TOKEN);
    const savedUser = localStorage.getItem(KEY_CURRENT);
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrent(JSON.parse(savedUser));
    }
  }, []);

  const saveToken = (newToken) => {
    localStorage.setItem(KEY_TOKEN, newToken);
    setToken(newToken);
  };

  const removeToke = () => {
    localStorage.removeItem(KEY_TOKEN);
    setToken(null);
  };

  const saveCurrent = (user) => {
    localStorage.setItem(KEY_CURRENT, JSON.stringify(user));
    setCurrent(user);
  };

  const removeCurrent = () => {
    localStorage.removeItem(KEY_CURRENT);
    setCurrent(null);
  };

  const logout = () => {
    removeToke();
    removeCurrent();
  };

  return (
    <AuthContext.Provider
      value={{
        current,
        token,
        setCurrent,
        saveToken,
        removeToke,
        saveCurrent,
        removeCurrent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
