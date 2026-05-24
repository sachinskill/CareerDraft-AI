import { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../api/ResumeService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true on mount while we verify session

  // On mount: verify session via /api/auth/me (reads httpOnly cookie server-side)
  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const refreshUser = async () => {
    try {
      const res = await axiosInstance.get('/api/auth/me');
      setUser(res.data);
      return res.data;
    } catch {
      setUser(null);
      return null;
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/login', { email, password });
      const { token: _ignored, ...userData } = res.data;
      setUser(userData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/register', { email, password });
      const { token: _ignored, ...userData } = res.data;
      setUser(userData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout', {});
    } catch {
      // ignore — clear state regardless
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isLoggedIn: !!user,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

