import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('taskify_user') || 'null')
  );

  // Also track dark mode globally
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('taskify_dark') !== 'false'
  );

  const login = (userData) => {
    localStorage.setItem('taskify_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('taskify_user');
    setUser(null);
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('taskify_dark', next);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, darkMode, toggleDark }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);