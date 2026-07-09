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

  const verifyEmail = async (email, otp) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/verify-email', { email, otp });
      const { token: _ignored, ...userData } = res.data;
      setUser(userData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Email verification failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await axiosInstance.post('/api/auth/resend-otp', { email });
      return { success: true, message: res.data?.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to resend code' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await axiosInstance.post('/api/auth/forgot-password', { email });
      return { success: true, message: res.data?.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to request reset' };
    }
  };

  const resetPassword = async (email, token, newPassword) => {
    try {
      const res = await axiosInstance.post('/api/auth/reset-password', { email, token, newPassword });
      return { success: true, message: res.data?.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Password reset failed' };
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
      verifyEmail,
      resendOtp,
      forgotPassword,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

