import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    authService
      .me()
      .then((u) => {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
  }, []);

  async function login(email, password) {
    setLoading(true);
    try {
      const { token, user: u } = await authService.login(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  async function updateProfile(payload) {
    const u = await authService.updateProfile(payload);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  }

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
