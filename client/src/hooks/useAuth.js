import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [bodyProfile, setBodyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('sl_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      setProfile(data.profile);
      setStats(data.stats);
      setBodyProfile(data.bodyProfile);
    } catch (error) {
      localStorage.removeItem('sl_token');
      localStorage.removeItem('sl_user');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('sl_token', data.token);
    localStorage.setItem('sl_user', JSON.stringify(data.user));
    setUser(data.user);
    setProfile(data.user.profile);
    await checkAuth();
    return data;
  }

  async function register(userData) {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('sl_token', data.token);
    localStorage.setItem('sl_user', JSON.stringify(data.user));
    setUser(data.user);
    await checkAuth();
    return data;
  }

  function logout() {
    localStorage.removeItem('sl_token');
    localStorage.removeItem('sl_user');
    setUser(null);
    setProfile(null);
    setStats(null);
    setBodyProfile(null);
  }

  async function refreshProfile() {
    await checkAuth();
  }

  return (
    <AuthContext.Provider value={{
      user, profile, stats, bodyProfile,
      loading, login, register, logout, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
